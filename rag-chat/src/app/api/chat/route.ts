import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1) CLIENTS

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// 2) SELF-HOSTED HF EMBEDDING CALL

async function getEmbeddings(text: string) {
  const API_URL = process.env.HF_EMBEDDING_API_URL;

  if (!API_URL) {
    throw new Error("Missing HF_EMBEDDING_API_URL env variable.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000); // 60 seconds

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      const msg = await resp.text().catch(() => "");
      console.error(`❌ Embedding API returned HTTP ${resp.status}: ${msg}`);
      throw new Error(`Embedding API error: HTTP ${resp.status}`);
    }

    const data = await resp.json();
    return data;
  } catch (err: any) {
    clearTimeout(timeout);

    if (err?.name === "AbortError") {
      console.error("❌ Embedding request timed out.");
    } else if (err?.message?.includes("connect")) {
      console.error("❌ Failed to connect to embedding server.");
    } else {
      console.error("❌ Unexpected embedding error:", err);
    }

    return null;
  }
}

// Wrapper that extracts the embedding vector
async function embedQuery(query: string): Promise<number[]> {
  const result = await getEmbeddings(query);

  if (!result) {
    console.warn("⚠️ No embedding response from Hugging Face server. Returning empty array.");
    return [];
  }

  let emb: any = result.embeddings?.[0] ?? result;

  if (emb && typeof emb === "object" && !Array.isArray(emb) && "embedding" in emb) {
    emb = emb.embedding ?? emb;
  }

  if (!Array.isArray(emb)) {
    emb = Array.isArray(emb) ? emb : [emb];
  }

  const vector: number[] = emb.map((v: any) => parseFloat(v as any) || 0);

  return vector;
}

// NEW: streaming helper using the official Groq SDK style
export async function getGroqChatStream(params: {
  messages: { role: string; content: string }[];
  model?: string;
  temperature?: number;
}) {
  const { messages, model = "openai/gpt-oss-20b", temperature } = params;
  return groq.chat.completions.create({
    messages,
    model,
    ...(typeof temperature === "number" ? { temperature } : {}),
    stream: true,
  });
}

// 3) POST ROUTE – FULL RAG PIPELINE (streaming reply from Groq with Wikipedia-style citations)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = (body?.message ?? "").toString().trim();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Empty query" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // STEP 1 – Embed user query
    const queryEmb = await embedQuery(message);

    // STEP 2 – Search Supabase
    const { data: chunks, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmb,
      match_count: 8,
      filter: { source: "human-nutrition-text.pdf" }, 
    });
// filter matra ho ,file ko sabai kam pura vaisakexa , yo ta metadata ko lagi matra ho metadatama j xa tei 
    if (error) {
      console.error("❌ Supabase retrieval error:", error);
      throw error;
    }

    console.log(`🔍 Retrieved ${(chunks ?? []).length} chunks from Supabase.`);
    
    if (!chunks || chunks.length === 0) {
      const encoder = new TextEncoder();
      const errorMessage = "I couldn't find relevant information in the provided document. Try rephrasing or asking about another section.";
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(errorMessage));
            controller.close();
          }
        }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          } 
        }
      );
    }

    // Build context with numbered citations for the model
    const context = chunks
      .map(
        (c: any, idx: number) =>
          `[${idx + 1}] (Page ${c.metadata?.page ?? "?"}, Similarity: ${(c.similarity * 100).toFixed(1)}%)\n${c.content}`
      )
      .join("\n\n");

    // STEP 3 – Prepare messages with EXACT Wikipedia-style citation instructions
const messages = [
  {
    role: "system",
    content:
        "You are a strict RAG assistant. Answer ONLY using the CONTEXT provided.\n\n" +
        
        "📝 RESPONSE FORMAT:\n" +
        "- For 'Define/Explain/Describe': Write in well-structured PARAGRAPHS with proper line breaks\n" +
        "- For 'List/In points': Use bullet points with hyphens (-)\n" +
        "- Add blank lines between paragraphs for readability\n" +
        "- Add blank lines before and after bullet point lists\n\n" +
        
        "✨ FORMATTING RULES:\n" +
        "- Use **bold** for main headings and important terms\n" +
        "- Use hyphens (-) for bullet points, not asterisks or dots\n" +
        "- Add a blank line between each section\n" +
        "- Keep paragraphs concise (3-5 sentences max)\n" +
        "- NO inline lists - if listing items, use proper bullet points with line breaks\n\n" +
        
        "📌 CITATIONS: (MANDATORY)\n" +
        "- You MUST add inline citations using [1], [2], [3], etc. after EVERY factual claim from the context\n" +
        "- Cite sources like [1], [2] and include page numbers , eg : (Page x) next to each claim" +
        "- No need to give references at the end of the answer or response ,just add the citations inline only" +
        "- Multiple sources: [1][2]\n\n" +
        
        "❌ IF ANSWER NOT IN CONTEXT:\n" +
        "Say: 'I couldn't find this information in the provided context.'\n\n" 
        
  },
  {
    role: "user",
    content:
      `QUESTION: ${message}\n\n` +
      `CONTEXT:\n${context}\n\n` +
      "Answer based on the context above. Use proper formatting with bold headings, blank lines between sections, and bullet points where appropriate. Match format to question type."
  }
];



    // STEP 4 – Request a streaming completion from Groq
    const stream = await getGroqChatStream({
      messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
    });

    // Return a ReadableStream that pipes deltas from Groq, then appends citations metadata
    const encoder = new TextEncoder();
    const responseBody = new ReadableStream({
      async start(controller) {
        try {
          // First, stream the AI response
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }

          // After the response is complete, append citation metadata for frontend parsing
          const citationSection = "\n\n---CITATIONS---\n" + JSON.stringify(
            chunks.map((c: any, idx: number) => ({
              id: idx + 1,
              page: c.metadata?.page ?? "?",
              similarity: c.similarity ? (c.similarity * 100).toFixed(1) : "N/A",
              content: c.content.substring(0, 200) + (c.content.length > 200 ? "..." : ""),
              fullContent: c.content
            }))
          );

          controller.enqueue(encoder.encode(citationSection));
          controller.close();
        } catch (err) {
          console.error("❌ Streaming error:", err);
          controller.error(err as any);
        }
      },
    });

    // Content-Type is plain/text streaming; the client can assemble the pieces.
    return new Response(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    console.error("❌ /api/chat ERROR:", err?.message || err);

    return new Response(
      JSON.stringify({ error: err?.message || "Unknown server error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}