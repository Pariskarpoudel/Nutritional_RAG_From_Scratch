// "use client";
// import { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Send, Moon, Sun, ChevronRight } from "lucide-react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// interface Citation {
//   id: number;
//   page: string;
//   similarity: string;
//   content: string;
//   fullContent: string;
// }

// interface Message {
//   role: "user" | "assistant";
//   content: string;
//   citations?: Citation[];
// }

// // Adjust page numbers for display
// const getRealPageNumber = (pageStr: string): string => {
//   const pageNum = parseInt(pageStr);
//   return isNaN(pageNum) ? pageStr : String(pageNum - 42);
// };

// // Highlight citations like [1]
// const highlightCitations = (text: string) =>
//   text.replace(/\[(\d+)\]/g, '<span class="citation-page">[$1]</span>');

// // Preprocess raw text to proper Markdown
// const preprocessText = (text: string) => {
//   let processed = text.replace(/^•\s+/gm, "- "); // bullets
//   processed = processed.replace(/^Water-Soluble Vitamins$/gm, "## Water-Soluble Vitamins"); // heading
//   return processed;
// };

// export default function Home() {
//   const [input, setInput] = useState("");
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [busy, setBusy] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [isDark, setIsDark] = useState(false);
//   const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
//   const [showSidebar, setShowSidebar] = useState(false);
//   const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLTextAreaElement>(null);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isTyping]);

//   useEffect(() => {
//     if (inputRef.current) {
//       inputRef.current.style.height = "auto";
//       inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + "px";
//     }
//   }, [input]);

//   const playSound = (type: "thinking" | "response") => {
//     try {
//       const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
//       const oscillator = audioContext.createOscillator();
//       const gainNode = audioContext.createGain();
//       oscillator.connect(gainNode);
//       gainNode.connect(audioContext.destination);
//       if (type === "thinking") {
//         oscillator.frequency.value = 440;
//         gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
//         gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
//         oscillator.start(audioContext.currentTime);
//         oscillator.stop(audioContext.currentTime + 0.1);
//       } else {
//         oscillator.frequency.value = 600;
//         gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
//         gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
//         oscillator.start(audioContext.currentTime);
//         oscillator.stop(audioContext.currentTime + 0.2);
//       }
//     } catch (e) {
//       console.log("Audio context not available");
//     }
//   };

//   const renderContentWithCitations = (content: string, citations: Citation[]) => {
//     const parts = content.split(/\n\nReferences:\n\n/);
//     const mainContent = parts[0] || content;
//     const referencesContent = parts[1] || "";

//     // Replace inline citations like (1, pg. 10)
//     let processedContent = mainContent.replace(/\((\d+),?\s*(?:pg\.?|page)\s*(\d+)\)/gi, (match, citationNum, pageNum) => {
//       return `<span class="inline-citation" data-citation="${citationNum}" data-page="${getRealPageNumber(pageNum)}">${match}</span>`;
//     });

//     processedContent = highlightCitations(processedContent);

//     return (
//       <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800/60">
//         <ReactMarkdown
//           remarkPlugins={[remarkGfm]}
//           components={{
//             h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-6 mb-3" {...props} />,
//             h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
//             p: ({ node, ...props }) => <p className="mb-3" {...props} />,
//             ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
//             li: ({ node, ...props }) => <li className="mb-2" {...props} />,
//             strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
//             code: ({ node, inline, className, children, ...props }) =>
//               inline ? (
//                 <code className={`px-1.5 py-0.5 rounded font-mono text-sm ${isDark ? "bg-gray-800 text-indigo-300" : "bg-gray-100 text-indigo-700"}`} {...props}>{children}</code>
//               ) : (
//                 <code className={`block p-4 rounded-lg overflow-x-auto font-mono text-sm my-4 ${isDark ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-800"}`} {...props}>{children}</code>
//               ),
//           }}
//         >
//           {preprocessText(processedContent)}
//         </ReactMarkdown>

//         {referencesContent && (
//           <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-700">
//             <h3 className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>References:</h3>
//             <div className="space-y-2">
//               {referencesContent.split(/\n\n/).map((ref, idx) => {
//                 const refMatch = ref.match(/(\d+)\s*\(Page\s*(\d+),\s*Similarity:\s*([\d.]+)%\)\s*-\s*(.+)/i);
//                 if (refMatch) {
//                   const [, refNum, page, similarity, text] = refMatch;
//                   return (
//                     <div key={idx} className="flex gap-2 text-sm">
//                       <span className={isDark ? "text-indigo-400 font-bold" : "text-indigo-600 font-bold"}>{refNum}</span>
//                       <span className={isDark ? "text-blue-400" : "text-blue-600"}>(Page {getRealPageNumber(page)}, Similarity: {similarity}%)</span>
//                       <span className={isDark ? "text-gray-300" : "text-gray-700"}>- {text}</span>
//                     </div>
//                   );
//                 }
//                 return <div key={idx} className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{ref}</div>;
//               })}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   async function send() {
//     if (!input.trim() || busy) return;
//     const userMessage: Message = { role: "user", content: input };
//     setMessages((m) => [...m, userMessage]);
//     setBusy(true);
//     setIsTyping(true);
//     playSound("thinking");
//     const userInput = input;
//     setInput("");
//     setSelectedCitation(null);

//     try {
//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: userInput }),
//       });
//       if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

//       const reader = res.body?.getReader();
//       const decoder = new TextDecoder();
//       let accumulatedText = "";
//       let citationData: Citation[] = [];

//       if (!reader) throw new Error("No response body");

//       setIsTyping(false);
//       setMessages((m) => [...m, { role: "assistant", content: "", citations: [] }]);

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         const chunk = decoder.decode(value, { stream: true });
//         accumulatedText += chunk;

//         let displayText = highlightCitations(
//           accumulatedText.replace(/\[(\d+)\]\s*\([^)]*\)/g, '[$1]')
//         );

//         if (accumulatedText.includes("---CITATIONS---")) {
//           const parts = accumulatedText.split("---CITATIONS---");
//           const mainContent = parts[0].trim();
//           const citationJson = parts[1]?.trim();

//           try {
//             if (citationJson) citationData = JSON.parse(citationJson);
//           } catch (e) {
//             console.error("Failed to parse citations:", e);
//           }

//           let finalContent = highlightCitations(
//             mainContent.replace(/\[(\d+)\]\s*\([^)]*\)/g, '[$1]')
//           );

//           setMessages((m) => {
//             const newMessages = [...m];
//             newMessages[newMessages.length - 1] = {
//               role: "assistant",
//               content: finalContent,
//               citations: citationData,
//             };
//             return newMessages;
//           });
//           playSound("response");
//           if (citationData.length > 0) setShowSidebar(true);
//           break;
//         }

//         setMessages((m) => {
//           const newMessages = [...m];
//           newMessages[newMessages.length - 1] = {
//             role: "assistant",
//             content: displayText,
//             citations: [],
//           };
//           return newMessages;
//         });
//       }
//     } catch (err) {
//       console.error("Error:", err);
//       setIsTyping(false);
//       setMessages((m) => [
//         ...m.filter((msg) => msg.content !== ""),
//         { role: "assistant", content: "I apologize, but something went wrong. Please try again.", citations: [] },
//       ]);
//     } finally {
//       setBusy(false);
//       setTimeout(() => inputRef.current?.focus(), 100);
//     }
//   }

//   const currentMessageCitations =
//     messages.length > 0 && messages[messages.length - 1]?.role === "assistant"
//       ? messages[messages.length - 1]?.citations || []
//       : [];

//   return (
//     <div className={`min-h-screen flex transition-all duration-300 ${isDark ? "bg-gray-900" : "bg-slate-50"}`}>
//       <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? (isSidebarMinimized ? "mr-[60px]" : "mr-80") : ""}`}>
//         {/* Header */}
//         <header className={`border-b backdrop-blur-xl sticky top-0 z-40 ${isDark ? "bg-gray-900/80 border-indigo-900/20" : "bg-white/80 border-indigo-200/30"}`}>
//           <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
//             <div>
//               <h1 className={`text-xl font-black tracking-tight uppercase ${isDark ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300" : "text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500"}`}>
//                 RAG Nutritional Chatbot
//               </h1>
//               <p className={`text-xs font-mono mt-0.5 ${isDark ? "text-indigo-400/60" : "text-indigo-600/60"}`}>
//                 Built from Scratch • Presented by <span className="font-bold">Pariskar Poudel</span>
//               </p>
//             </div>
//             <motion.button
//               whileHover={{ scale: 1.08, rotate: 180 }}
//               whileTap={{ scale: 0.92 }}
//               transition={{ type: "spring", stiffness: 400, damping: 17 }}
//               onClick={() => setIsDark(!isDark)}
//               className={`p-2.5 rounded-lg transition-all ${isDark ? "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20" : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-200"}`}
//             >
//               {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
//             </motion.button>
//           </div>
//         </header>

//         {/* Main chat area */}
//         <main className="flex-1 overflow-y-auto pb-32">
//           <div className="max-w-4xl mx-auto px-6 py-12">
//             {messages.length === 0 && (
//               <div className="text-center py-20">
//                 <div className="text-7xl mb-6">🥗</div>
//                 <h2 className={`text-3xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>How can I help you today?</h2>
//                 <h3 className={`text-3xl font-black mb-3 uppercase tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Ask me anything about!</h3>
//                 <p className={`text-base font-mono ${isDark ? "text-indigo-400/70" : "text-indigo-600/70"}`}>Nutrition • Dietary Guidelines • Health Topics</p>
//               </div>
//             )}

//             <div className="space-y-8">
//               {messages.map((m, i) => (
//                 <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
//                   <div className={`max-w-[85%] ${m.role === "user" ? "order-2" : ""}`}>
//                     <div className={`px-6 py-4 rounded-2xl font-mono text-[15px] leading-[1.8] ${m.role === "user" ? (isDark ? "bg-indigo-600 text-white" : "bg-indigo-500 text-white") : (isDark ? "bg-gray-800/60 text-gray-100 border border-indigo-900/30" : "bg-white text-gray-900 border border-indigo-200/50 shadow-sm")}`}>
//                       {m.role === "assistant" ? renderContentWithCitations(m.content, m.citations || []) : m.content}
//                     </div>
//                   </div>
//                 </motion.div>
//               ))}

//               {isTyping && (
//                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
//                   <div className={`px-6 py-4 rounded-2xl ${isDark ? "bg-gray-800/60 border border-indigo-900/30" : "bg-white border border-indigo-200/50 shadow-sm"}`}>
//                     <div className="flex gap-1.5">
//                       {[0, 1, 2].map((i) => (
//                         <motion.div key={i} className={`w-2 h-2 rounded-full ${isDark ? "bg-indigo-500" : "bg-indigo-600"}`} animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} />
//                       ))}
//                     </div>
//                   </div>
//                 </motion.div>
//               )}
//             </div>
//             <div ref={messagesEndRef} />
//           </div>
//         </main>

//         {/* Input area */}
//         <div className={`fixed bottom-0 left-0 border-t backdrop-blur-xl transition-all duration-300 ${showSidebar ? (isSidebarMinimized ? "right-[60px]" : "right-80") : "right-0"} ${isDark ? "bg-gray-900/90 border-indigo-900/20" : "bg-white/90 border-indigo-200/30"}`}>
//           <div className="max-w-4xl mx-auto px-6 py-5">
//             <div className={`flex gap-3 items-end rounded-2xl p-1.5 transition-all ${isDark ? "bg-gray-800/60 border-2 border-indigo-900/30 focus-within:border-indigo-600/50" : "bg-white border-2 border-indigo-200 focus-within:border-indigo-500 shadow-lg"}`}>
//               <textarea
//                 ref={inputRef}
//                 rows={1}
//                 className={`flex-1 px-4 py-3 bg-transparent resize-none focus:outline-none font-mono text-[15px] ${isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`}
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter" && !e.shiftKey) {
//                     e.preventDefault();
//                     send();
//                   }
//                 }}
//                 placeholder="Ask about nutrition..."
//                 disabled={busy}
//                 style={{ maxHeight: "200px" }}
//               />
//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={send}
//                 disabled={busy || !input.trim()}
//                 className={`p-3 rounded-xl transition-all ${busy || !input.trim() ? (isDark ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-200 text-gray-400 cursor-not-allowed") : (isDark ? "bg-indigo-500 text-white" : "bg-indigo-600 text-white")}`}
//               >
//                 <Send className="w-5 h-5" />
//               </motion.button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Moon, Sun, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import React from "react";
import rehypeRaw from "rehype-raw";

interface Citation {
  id: number;
  page: string;
  similarity: string;
  content: string;
  fullContent: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

const getRealPageNumber = (pageStr: string): string => {
  const pageNum = parseInt(pageStr);
  return isNaN(pageNum) ? pageStr : String(pageNum - 42);
};

const highlightCitations = (text: string) =>
  text.replace(
    /\[(\d+)\]/g,
    '<span class="citation-page">[$1]</span>'
  );

const preprocessForCitations = (text: string): string => {
  // Convert plain [1], [2], [3] into clickable markdown links: [1] → [1](citation:1)
  return text.replace(/\[(\d+)\]/g, "[$1](citation:$1)");
};

const preprocessText = (text: string): string => {
  let processed = text;

  // Clean bullets
  processed = processed.replace(/^[ \t]*[•·▪▶➜-]\s+/gm, "- ");
  processed = processed.replace(/^[ \t]*-\s*[-•·▪]\s*/gm, "- ");
  processed = processed.replace(/^[ \t]*-\s*-/gm, "- ");
  processed = processed.replace(/^[ \t]*-+\s*/gm, "- ");

  // Headings
  processed = processed.replace(/^([A-Z][A-Za-z\s\-&]+Vitamins?)$/gm, "## $1");
  processed = processed.replace(
    /^(Functions?|Sources?|Importance|Benefits?|Deficiency)\s*(of\s*)?([A-Z][A-Za-z\s\-&]+)$/gmi,
    "## $1 $3"
  );

  // Spacing
  processed = processed.replace(/(\S)\n##/g, "$1\n\n##");
  processed = processed.replace(/(\S)\n-/g, "$1\n\n-");
  processed = processed.replace(/\n{3,}/g, "\n\n");

  // Clean old (Page xx)
  processed = processed.replace(/\[(\d+)\]\s*\([^)]*\)/g, "[$1]");

  // Wrap citations [1][2] in <span> for styling
  processed = processed.replace(/\[(\d+)\]/g, (_, num) => {
    return `<span class="text-indigo-600 dark:text-indigo-400 font-semibold">[${num}]</span>`;
  });

  return processed.trim();
};


export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const playSound = (type: "thinking" | "response") => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      if (type === "thinking") {
        oscillator.frequency.value = 440;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } else {
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }
    } catch (e) {
      console.log("Audio context not available");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const renderContentWithCitations = (content: string, citations: Citation[] = []) => {
    const parts = content.split(/\n\nReferences:\n\n/);
    const mainContent = parts[0] || content;
    const referencesContent = parts[1] || "";

    let processedContent = mainContent;

    processedContent = processedContent.replace(/\((\d+),?\s*(?:pg\.?|page)\s*(\d+)\)/gi, (match, citationNum, pageNum) => {
      return `<span class="inline-citation" data-citation="${citationNum}" data-page="${getRealPageNumber(pageNum)}">${match}</span>`;
    });

    processedContent = processedContent.replace(/\[([\d,\s]+)\]/g, (match, group) => {
      const ids = group.split(",").map((id: string) => id.trim());
      return ids.map((id: string) => `[${id}](citation:${id})`).join("");
    });

    return (
      // <div className="font-normal text-gray-900 dark:text-white leading-relaxed">
  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800/60">
      <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeRaw]} // <-- important to render <span>
  components={{
    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-6 mb-3" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
    p: ({ node, ...props }) => <p className="mb-3" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
    li: ({ node, ...props }) => <li className="mb-2" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
    code: ({ node, className, children, ...props }) => {
      const isInline = !className || !className.includes("language-");
      return isInline ? (
        <code className={`px-1.5 py-0.5 rounded font-mono text-sm ${isDark ? "bg-gray-800 text-indigo-300" : "bg-gray-100 text-indigo-700"}`} {...props}>
          {children}
        </code>
      ) : (
        <pre className={`p-4 rounded-lg overflow-x-auto font-mono text-sm my-4 ${isDark ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-800"}`}>
          <code {...props}>{children}</code>
        </pre>
      );
    },
  }}
>
  {preprocessText(processedContent)}
</ReactMarkdown>

        {referencesContent && (
          <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-700">
            <h3 className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>References:</h3>
            <div className="space-y-2">
              {referencesContent.split(/\n\n/).map((ref, idx) => {
                const refMatch = ref.match(/(\d+)\s*\(Page\s*(\d+),\s*Similarity:\s*([\d.]+)%\)\s*-\s*(.+)/i);
                if (refMatch) {
                  const [, refNum, page, similarity, text] = refMatch;
                  return (
                    <div key={idx} className="flex gap-2 text-sm">
                      <span className={isDark ? "text-indigo-400 font-bold" : "text-indigo-600 font-bold"}>{refNum}</span>
                      <span className={isDark ? "text-blue-400" : "text-blue-600"}>(Page {getRealPageNumber(page)}, Similarity: {similarity}%)</span>
                      <span className={isDark ? "text-gray-300" : "text-gray-700"}>- {text}</span>
                    </div>
                  );
                }
                return <div key={idx} className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{ref}</div>;
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  async function send() {
    if (!input.trim() || busy) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((m) => [...m, userMessage]);
    setBusy(true);
    setIsTyping(true);
    playSound("thinking");
    const userInput = input;
    setInput("");
    setSelectedCitation(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let citationData: Citation[] = [];

      if (!reader) throw new Error("No response body");

      setIsTyping(false);
      setMessages((m) => [...m, { role: "assistant", content: "", citations: [] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        let displayText = accumulatedText.replace(/\[(\d+)\]\s*\([^)]*\)/g, '[$1]');

        if (accumulatedText.includes("---CITATIONS---")) {
          const parts = accumulatedText.split("---CITATIONS---");
          const mainContent = parts[0].trim();
          const citationJson = parts[1]?.trim();

          try {
            if (citationJson) citationData = JSON.parse(citationJson);
          } catch (e) {
            console.error("Failed to parse citations:", e);
          }

          let finalContent = mainContent.replace(/\[(\d+)\]\s*\([^)]*\)/g, '[$1]');

          setMessages((m) => {
            const newMessages = [...m];
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: finalContent,
              citations: citationData,
            };
            return newMessages;
          });
          playSound("response");
          if (citationData.length > 0) setShowSidebar(true);
          break;
        }

        setMessages((m) => {
          const newMessages = [...m];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: displayText,
            citations: [],
          };
          return newMessages;
        });
      }
    } catch (err) {
      console.error("Error:", err);
      setIsTyping(false);
      setMessages((m) => {
        const filtered = m.filter((msg) => msg.content !== "");
        return [
          ...filtered,
          { role: "assistant", content: "I apologize, but something went wrong. Please try again.", citations: [] },
        ];
      });
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const currentMessageCitations =
    messages.length > 0 && messages[messages.length - 1]?.role === "assistant"
      ? messages[messages.length - 1]?.citations || []
      : [];

  return (
    <div className={`min-h-screen flex transition-all duration-300 ${
      isDark
        ? "bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900"
        : "bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50"
    }`}>
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        showSidebar ? (isSidebarMinimized ? "mr-[60px]" : "mr-80") : ""
      }`}>
        <header className={`border-b backdrop-blur-xl sticky top-0 z-40 ${
          isDark ? "bg-gray-900/80 border-indigo-900/20" : "bg-white/80 border-indigo-200/30"
        }`}>
          <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className={`text-xl font-black tracking-tight uppercase ${
                isDark
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300"
                  : "text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500"
              }`}>
                RAG Nutritional Chatbot
              </h1>
              <p className={`text-xs font-mono mt-0.5 ${
                isDark ? "text-indigo-400/60" : "text-indigo-600/60"
              }`}>
                Built from Scratch • Presented by <span className="font-bold">Pariskar Poudel</span>
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.08, rotate: 180 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-lg transition-all ${
                isDark
                  ? "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                  : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-200"
              }`}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-32">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-7xl mb-6">
                  🥗
                </motion.div>
                <h2 className={`text-3xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                  How can I help you today?
                </h2>
                <h3 className={`text-3xl font-black mb-3 uppercase tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                  Ask me anything about!
                </h3>
                <p className={`text-base font-mono ${isDark ? "text-indigo-400/70" : "text-indigo-600/70"}`}>
                  Nutrition • Dietary Guidelines • Health Topics
                </p>
              </motion.div>
            )}

            <div className="space-y-8">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] ${m.role === "user" ? "order-2" : ""}`}>
                    <div
                      className={`px-6 py-4 rounded-2xl font-mono text-[15px] leading-[1.8] ${
                        m.role === "user"
                          ? isDark ? "bg-indigo-600 text-white" : "bg-indigo-500 text-white"
                          : isDark
                          ? "bg-gray-800/60 text-gray-100 border border-indigo-900/30"
                          : "bg-white text-gray-900 border border-indigo-200/50 shadow-sm"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        renderContentWithCitations(m.content, m.citations)
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className={`px-6 py-4 rounded-2xl ${
                    isDark ? "bg-gray-800/60 border border-indigo-900/30" : "bg-white border border-indigo-200/50 shadow-sm"
                  }`}>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className={`w-2 h-2 rounded-full ${isDark ? "bg-indigo-500" : "bg-indigo-600"}`}
                          animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </main>

        <div className={`fixed bottom-0 left-0 border-t backdrop-blur-xl transition-all duration-300 ${
          showSidebar ? (isSidebarMinimized ? "right-[60px]" : "right-80") : "right-0"
        } ${isDark ? "bg-gray-900/90 border-indigo-900/20" : "bg-white/90 border-indigo-200/30"}`}>
          <div className="max-w-4xl mx-auto px-6 py-5">
            <div className={`flex gap-3 items-end rounded-2xl p-1.5 transition-all ${
              isDark
                ? "bg-gray-800/60 border-2 border-indigo-900/30 focus-within:border-indigo-600/50"
                : "bg-white border-2 border-indigo-200 focus-within:border-indigo-500 shadow-lg"
            }`}>
              <textarea
                ref={inputRef}
                rows={1}
                className={`flex-1 px-4 py-3 bg-transparent resize-none focus:outline-none font-mono text-[15px] ${
                  isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                }`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask about nutrition..."
                disabled={busy}
                style={{ maxHeight: "200px" }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={send}
                disabled={busy || !input.trim()}
                className={`p-3 rounded-xl transition-all ${
                  busy || !input.trim()
                    ? isDark ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : isDark
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                }`}>
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSidebar && currentMessageCitations.length > 0 && (
          <motion.div
            initial={{ x: isSidebarMinimized ? 280 : 320 }}
            animate={{ x: 0, width: isSidebarMinimized ? "60px" : "320px" }}
            exit={{ x: isSidebarMinimized ? 60 : 320 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 bottom-0 border-l backdrop-blur-xl z-50 flex flex-col ${
              isDark ? "bg-gray-900/95 border-indigo-900/20" : "bg-white/95 border-indigo-200/30"
            }`}>
            <div className={`px-6 py-5 border-b ${isDark ? "border-indigo-900/20" : "border-indigo-200/30"}`}>
              <div className="flex items-center justify-between">
                {!isSidebarMinimized && (
                  <h3 className={`font-black text-lg uppercase tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    Sources
                  </h3>
                )}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                    }`}
                    title={isSidebarMinimized ? "Expand" : "Minimize"}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isSidebarMinimized ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      )}
                    </svg>
                  </motion.button>
                  {!isSidebarMinimized && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowSidebar(false)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                      }`}>
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {!isSidebarMinimized ? (
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {currentMessageCitations.map((citation, i) => (
                  <motion.button
                    key={citation.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedCitation(citation)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedCitation?.id === citation.id
                        ? isDark ? "bg-indigo-500/10 border-indigo-500/30" : "bg-indigo-50 border-indigo-300"
                        : isDark
                        ? "bg-gray-800/40 border-indigo-900/20 hover:bg-gray-800/60"
                        : "bg-white border-indigo-200/50 hover:bg-indigo-50/50"
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isDark
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
                          : "bg-indigo-100 text-indigo-700 border border-indigo-300"
                      }`}>
                        {citation.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-mono font-semibold mb-1 ${
                          isDark ? "text-indigo-400/70" : "text-indigo-600/70"
                        }`}>
                          Page {getRealPageNumber(citation.page)} • {citation.similarity}%
                        </div>
                        <p className={`text-sm font-mono leading-relaxed line-clamp-3 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}>
                          {citation.content}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
                {currentMessageCitations.map((citation, i) => (
                  <motion.button
                    key={citation.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => {
                      setSelectedCitation(citation);
                      setIsSidebarMinimized(false);
                    }}
                    className={`w-full p-2 rounded-lg border transition-all ${
                      selectedCitation?.id === citation.id
                        ? isDark ? "bg-indigo-500/10 border-indigo-500/30" : "bg-indigo-50 border-indigo-300"
                        : isDark
                        ? "bg-gray-800/40 border-indigo-900/20 hover:bg-gray-800/60"
                        : "bg-white border-indigo-200/50 hover:bg-indigo-50/50"
                    }`}
                    title={`Citation ${citation.id} - Page ${getRealPageNumber(citation.page)}`}>
                    <div className={`text-sm font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                      {citation.id}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCitation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
              onClick={() => setSelectedCitation(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl ${
                isDark
                  ? "bg-gray-800 border-2 border-indigo-900/40"
                  : "bg-white border-2 border-indigo-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`px-6 py-4 border-b ${
                  isDark
                    ? "border-indigo-900/30 bg-gray-900/50"
                    : "border-indigo-200 bg-indigo-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isDark
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
                          : "bg-indigo-100 text-indigo-700 border border-indigo-300"
                      }`}
                    >
                      {selectedCitation.id}
                    </div>
                    <div>
                      <div
                        className={`text-sm font-bold uppercase font-mono ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Source Reference
                      </div>
                      <div
                        className={`text-xs font-mono ${
                          isDark ? "text-indigo-400/70" : "text-indigo-600/70"
                        }`}
                      >
                        Page {getRealPageNumber(selectedCitation.page)} •{" "}
                        {selectedCitation.similarity}% Match
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedCitation(null)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? "hover:bg-gray-700 text-gray-400"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </motion.button>
                </div>
              </div>
              <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                <div
                  className={`p-4 rounded-xl font-mono text-sm leading-[1.8] ${
                    isDark
                      ? "bg-indigo-950/30 text-indigo-100"
                      : "bg-indigo-50 text-gray-800"
                  }`}
                >
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-bold mb-3 ${
                      isDark
                        ? "bg-indigo-600/30 text-indigo-300"
                        : "bg-indigo-200 text-indigo-800"
                    }`}
                  >
                    CITED EXCERPT
                  </span>
                  <p className="whitespace-pre-wrap">
                    {selectedCitation.fullContent}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}