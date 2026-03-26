import { useState, useRef, useEffect, useCallback } from "react";
import {
    Maximize2,
    Minimize2,
    X,
    Send,
    Paperclip,
    User,
    FileText,
    Bot,
    CheckCircle,
    AlertCircle,
    Pin
} from "lucide-react";

import api from "../api/axios";
import { useChat } from "../context/ChatContext";

/* =========================================
   ⏱️ TIMESTAMP HELPER
========================================= */
function getRelativeTime(date) {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
}

/* =========================================
   🌊 STREAMING MESSAGE COMPONENT
========================================= */
function StreamingMessage({ text, isStreaming }) {
    const [displayedText, setDisplayedText] = useState("");
    const indexRef = useRef(0);

    useEffect(() => {
        if (!isStreaming) {
            setDisplayedText(text);
            return;
        }

        // Reset when a new streaming message starts
        setDisplayedText("");
        indexRef.current = 0;

        // Stream word-by-word at ~40ms per word
        const words = text.split(" ");
        const interval = setInterval(() => {
            if (indexRef.current >= words.length) {
                clearInterval(interval);
                return;
            }
            setDisplayedText(prev => (prev ? prev + " " : "") + words[indexRef.current]);
            indexRef.current += 1;
        }, 40);

        return () => clearInterval(interval);
    }, [text, isStreaming]);

    const html = displayedText
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br/>");

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/* =========================================
   📄 FILE PREVIEW CARD
========================================= */
function FilePreviewCard({ file, index, onRemove }) {
    const sizeKB = (file.size / 1024).toFixed(1);
    const isOffer = file.name.includes("-ITO-");
    const isAim = file.name.includes("-ITI-");
    const label = isOffer ? "Offer Letter" : isAim ? "Aim/Objective" : "PDF";
    const color = isOffer
        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
        : isAim
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300";

    return (
        <div className={`flex items-center gap-2.5 border rounded-xl px-3 py-2 shadow-sm min-w-[160px] max-w-[200px] flex-shrink-0 ${color}`}>
            <div className="w-8 h-8 rounded-lg bg-white/60 dark:bg-black/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</p>
                <p className="text-xs font-semibold truncate" title={file.name}>{file.name}</p>
                <p className="text-[10px] opacity-60">{sizeKB} KB</p>
            </div>
            <button
                onClick={() => onRemove(index)}
                aria-label={`Remove ${file.name}`}
                className="flex-shrink-0 w-5 h-5 rounded-full bg-white/50 dark:bg-black/30 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}

/**
 * ChatAssistant component - An AI-powered virtual assistant (Disha 2.0) that handles
 * natural language queries for OD applications and provides status updates.
 */
export default function ChatAssistant() {
    const { isOpen, openChat, closeChat } = useChat();
    const [isExpanded, setIsExpanded] = useState(false);

    // Each message: { type, text, timestamp, streaming? }
    const [messages, setMessages] = useState([
        {
            type: "bot",
            text: "Greetings. I am **Disha 2.0**. select a query below or type your question regarding application procedures.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const [attachments, setAttachments] = useState([]);
    const fileInputRef = useRef(null);

    const dishaAvatar = "https://cdn-icons-png.flaticon.com/512/6997/6997662.png";

    /* =========================================
       📎 ATTACHMENT HANDLERS
    ========================================= */
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Reset input so same file can be re-selected if removed
            e.target.value = "";

            if (attachments.length >= 2) {
                setMessages(prev => [...prev, {
                    type: "bot",
                    text: "⚠️ Maximum 2 attachments allowed (Offer Letter & Aim).",
                    timestamp: new Date()
                }]);
                return;
            }
            if (!file.type.includes("pdf")) {
                setMessages(prev => [...prev, {
                    type: "bot",
                    text: "⚠️ Only PDF files are supported.",
                    timestamp: new Date()
                }]);
                return;
            }
            if (!file.name.includes("-ITO-") && !file.name.includes("-ITI-")) {
                setMessages(prev => [...prev, {
                    type: "bot",
                    text: "⚠️ Filename warning: Ensure your file follows the format `RollNo-ITO/ITI-Date.pdf`.",
                    timestamp: new Date()
                }]);
            }
            setAttachments(prev => [...prev, file]);
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    /* =========================================
       🌊 STREAM A BOT REPLY
    ========================================= */
    const streamBotMessage = useCallback((text) => {
        const msg = { type: "bot", text, timestamp: new Date(), streaming: true };
        setMessages(prev => [...prev, msg]);

        // After streaming duration completes, mark as done
        const words = text.split(" ").length;
        const durationMs = Math.min(words * 42, 3000);
        setTimeout(() => {
            setMessages(prev =>
                prev.map((m, i) => i === prev.length - 1 ? { ...m, streaming: false } : m)
            );
        }, durationMs);
    }, []);

    /* =========================================
       📢 HELPER FUNCTIONS
    ========================================= */
    const fetchODStatus = async () => {
        try {
            const user = JSON.parse(sessionStorage.getItem("user"));
            if (!user || !user.id) return "❌ Please log in to check your OD status.";

            const res = await api.get(`/od/my-ods?studentId=${user.id}`);
            const ods = res.data;

            if (!ods || ods.length === 0) {
                return "ℹ️ You have no OD applications yet.";
            }

            const statusList = ods.map(od =>
                `📌 **${od.company}**\n   Status: **${od.status}**\n   Dates: ${new Date(od.startDate).toLocaleDateString()} - ${new Date(od.endDate).toLocaleDateString()}`
            ).join("\n\n");

            return `Here are your recent OD applications:\n\n${statusList}`;
        } catch (error) {
            console.error(error);
            return "❌ Failed to fetch OD status. Please try again later.";
        }
    };

    // eslint-disable-next-line no-unused-vars
    const findBestResponse = (query) => {
        const lower = query.toLowerCase();
        if (lower.includes("procedure") || lower.includes("process")) {
            return "To apply for an OD:\n1. **Upload** your Offer Letter & Aim.\n2. Use the **Smart Apply** command (e.g., `Apply OD...`).\n3. Wait for **Faculty Approval**.\n4. Once approved, download your OD form.";
        }
        if (lower.includes("format") || lower.includes("document")) {
            return "Files must be in **PDF** format.\n\nNaming Convention:\n- Offer Letter: `RollNo-ITO-Date.pdf`\n- Aim: `RollNo-ITI-Date.pdf`\n\nExample: `22CS001-ITO-01.02.2024.pdf`";
        }
        if (lower.includes("purpose") || lower.includes("system")) {
            return "This **Smart OD System** automates the On-Duty application process for students with placement offers, eliminating manual paperwork! 🚀";
        }
        if (lower.includes("hello") || lower.includes("hi")) {
            return "Hello! 👋 How can I assist you with your OD application today?";
        }
        if (lower.includes("why") && lower.includes("start") && lower.includes("approved")) {
            return "Usually, an OD is **Active** only when:\n1. The Start Date has arrived.\n2. Final Admin/HOD Approval is complete (after Mentor).\nIf your Mentor approved, it might still be pending Final Review!";
        }
        return "I'm not sure about that. Try asking about **OD Status**, **Formats**, or **Procedures**.";
    };

    /* =========================================
       🧠 SMART APPLY LOGIC
    ========================================= */
    const processSmartApply = async (text) => {
        const dateRegex = /(\d{2}[-.](\d{2})[-.](\d{4})) to (\d{2}[-.](\d{2})[-.](\d{4}))/i;
        const dateMatch = text.match(/(\d{2}[-.](\d{2})[-.](\d{4})) to (\d{2}[-.](\d{2})[-.](\d{4}))/i);

        if (!dateMatch) {
            return "❌ **Invalid Date Format.**\nPlease use: `Apply OD <Start> to <End> ...`\nExample: `Apply OD 10.08.2025 to 12.08.2025`";
        }

        const startDate = dateMatch[1];
        const endDate = dateMatch[4];

        const industryMatch = text.match(/\b(IT|Core|Research)\b/i);
        const campusMatch = text.match(/\b(On Campus|Off Campus)\b/i);
        const industry = industryMatch ? industryMatch[0] : null;
        const campusType = campusMatch ? campusMatch[0] : null;

        if (!industry || !campusType) {
            return "❌ **Missing Details.**\nPlease specify the **Industry** (IT/Core/Research) and **Mode** (On Campus/Off Campus).\nExample: `... for Google IT On Campus`";
        }

        const parts = text.split(/ for /i);
        if (parts.length < 2) {
            return "❌ **Missing Company.**\nPlease use: `... for <Company Name> ...`";
        }

        let companySection = parts.slice(1).join(" for ");
        companySection = companySection.replace(/(\d{2}[-.](\d{2})[-.](\d{4})) to (\d{2}[-.](\d{2})[-.](\d{4}))/i, "").trim();

        const removeToken = (str, token) => {
            const regex = new RegExp(`\\b${token}\\b`, 'gi');
            return str.replace(regex, "");
        };

        let companyName = companySection;
        companyName = removeToken(companyName, industry);
        companyName = removeToken(companyName, campusType);
        companyName = companyName.replace(/\s+/g, " ").trim();

        if (!companyName || companyName.length < 2) {
            return "❌ **Invalid Company Name.**\nPlease explicitly mention who you are visiting.";
        }

        if (attachments.length !== 2) {
            return "❌ **Missing Attachments.**\nPlease attach exactly 2 PDF files: **Offer Letter** and **Aim/Objective** before sending.";
        }

        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user || !user.id) return "❌ **Authentication Failed.** Please log in again.";

        try {
            const offersRes = await api.get(`/students/${user.id}/offers`);
            const offers = offersRes.data;
            const selectedOffer = offers.find(o => o.company.name.toLowerCase().includes(companyName.toLowerCase().trim()));

            if (!selectedOffer) {
                return `❌ **Company Not Found.**\nI searched for '**${companyName}**' but couldn't find a matching offer in your records.`;
            }

            const formData = new FormData();
            formData.append("studentId", user.id);
            formData.append("offerId", selectedOffer.id);
            formData.append("industry", industry.toUpperCase());
            formData.append("campusType", campusType);

            const toISODate = (d) => {
                const p = d.split(/[-.]/) ;
                return `${p[2]}-${p[1]}-${p[0]}`;
            };
            const startISO = toISODate(startDate);
            const endISO = toISODate(endDate);
            formData.append("startDate", startISO);
            formData.append("endDate", endISO);

            const s = new Date(startISO);
            const e = new Date(endISO);
            const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
            formData.append("duration", days);

            const offerFile = attachments.find(f => f.name.includes("ITO"));
            const aimFile = attachments.find(f => f.name.includes("ITI"));

            if (!offerFile || !aimFile) {
                return "❌ **Filename Error.**\nPlease ensure:\n- Offer Letter filename contains `-ITO-`\n- Aim filename contains `-ITI-`";
            }

            formData.append("offerFile", offerFile);
            formData.append("aimFile", aimFile);
            formData.append("iqacStatus", "Initiated");

            await api.post("/od/apply", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setAttachments([]);
            return `✅ **Success!**\nOD Application for **${selectedOffer.company.name}** submitted.\nDuration: ${days} days.\nTrack status in 'My ODs'.`;

        } catch (error) {
            console.error(error);
            const errData = error.response?.data;
            if (errData?.steps && Array.isArray(errData.steps)) {
                const stepsList = errData.steps.map(step => {
                    const icon = step.success ? "✅" : "❌";
                    const status = step.success ? "**Success**" : `**Failed**: ${step.error || ""}`;
                    return `${icon} **${step.name}**\n   ${status}`;
                }).join("\n\n");
                return `⚠️ **Verification Incomplete**\n\n${stepsList}\n\nPlease correct the issues marked with ❌ and try again.`;
            }
            return `❌ **Submission Failed.**\n${errData?.message || error.message}`;
        }
    };

    /* =========================================
       📤 HANDLE SEND
    ========================================= */
    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        setMessages(prev => [...prev, { type: "user", text, timestamp: new Date() }]);
        setInput("");
        setIsTyping(true);

        const lowerText = text.toLowerCase();

        if (lowerText.startsWith("apply od")) {
            setMessages(prev => [...prev, {
                type: "bot", text: "🔄 Processing Smart Application...", timestamp: new Date(), streaming: false
            }]);
            const resultMsg = await processSmartApply(text);
            setMessages(prev => {
                const filtered = prev.slice(0, -1);
                return [...filtered, { type: "bot", text: resultMsg, timestamp: new Date(), streaming: true }];
            });
            // Mark as done after stream completes
            const wordCount = resultMsg.split(" ").length;
            setTimeout(() => {
                setMessages(prev =>
                    prev.map((m, i) => i === prev.length - 1 ? { ...m, streaming: false } : m)
                );
            }, Math.min(wordCount * 42, 3000));
            setIsTyping(false);
            return;
        }

        if (lowerText.includes("status") || lowerText.includes("track") || lowerText.includes("check") || lowerText.includes("my od")) {
            setTimeout(async () => {
                const statusMsg = await fetchODStatus();
                streamBotMessage(statusMsg);
                setIsTyping(false);
            }, 600);
            return;
        }

        // AI-POWERED RESPONSE
        (async () => {
            try {
                const response = await api.post("/ai/chat", {
                    message: text,
                    conversationHistory: messages
                        .slice(-6)
                        .filter(m => m.type !== "bot" || !m.text.includes("Processing"))
                        .map(m => ({
                            role: m.type === "user" ? "user" : "assistant",
                            content: m.text
                        }))
                });
                streamBotMessage(response.data.response);
            } catch (error) {
                console.error("AI Error:", error);
                streamBotMessage("I'm having trouble connecting right now. Please try asking about **OD Status**, **Formats**, or **Procedures**.");
            } finally {
                setIsTyping(false);
            }
        })();
    };

    const QUICK_CHIPS = [
        "Check my Status",
        "Application Procedure",
        "Document Formats",
        "System Purpose"
    ];

    return (
        <>
            {/* Main Chat Window */}
            <div
                className={`fixed z-[100] transition-all duration-500 ease-in-out flex flex-col overflow-hidden shadow-2xl
                ${isExpanded
                        ? "inset-0 w-full h-full rounded-none"
                        : `bottom-24 right-6 w-96 max-h-[600px] h-[500px] rounded-3xl ${isOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-10 pointer-events-none"}`
                    }
                bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 ring-1 ring-black/5
            `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 backdrop-blur-sm">
                            <img src={dishaAvatar} alt="Disha" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                                Disha 2.0
                                <span className="bg-green-400/90 w-2 h-2 rounded-full animate-pulse shadow-green-400/50 shadow-lg"></span>
                            </h3>
                            <p className="text-[10px] uppercase tracking-wider opacity-90 font-medium">Smart Assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            aria-label={isExpanded ? "Minimize chat" : "Maximize chat"}
                            className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                            title={isExpanded ? "Minimize" : "Full Screen"}
                        >
                            {isExpanded ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
                        </button>
                        <button
                            onClick={() => { closeChat(); setIsExpanded(false); }}
                            aria-label="Close chat"
                            className="p-2 hover:bg-red-500/80 hover:shadow-red-500/30 hover:shadow-lg rounded-full transition-all duration-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-5 scroll-smooth custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50 space-y-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                            {msg.type === "bot" && (
                                <div className="w-8 h-8 rounded-full border border-indigo-100 bg-white flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                                    <img src={dishaAvatar} alt="Disha" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex flex-col gap-0.5">
                                <div className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm
                                    ${msg.type === "user"
                                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-none shadow-blue-500/20"
                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-700/50 shadow-slate-200/50 dark:shadow-none"
                                    }`}>
                                    {msg.type === "bot" && msg.streaming !== undefined ? (
                                        <StreamingMessage text={msg.text} isStreaming={!!msg.streaming} />
                                    ) : (
                                        <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                                    )}
                                </div>
                                {/* Timestamp — visible on group hover */}
                                {msg.timestamp && (
                                    <p className={`text-[10px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none
                                        ${msg.type === "user" ? "text-right pr-1" : "pl-1"}`}>
                                        {getRelativeTime(msg.timestamp)}
                                    </p>
                                )}
                            </div>
                            {msg.type === "user" && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0">
                                    <User className="w-4 h-4 text-slate-500" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start items-end gap-2">
                            <div className="w-8 h-8 rounded-full border border-indigo-100 bg-white flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                                <img src={dishaAvatar} alt="Disha" className="w-full h-full object-cover" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700/50">
                                <div className="flex gap-1.5">
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Attachments & Quick Actions Panel */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50">

                    {/* Rich File Preview Cards */}
                    {attachments.length > 0 && (
                        <div className="px-4 pt-3 pb-1 flex gap-2.5 overflow-x-auto no-scrollbar">
                            {attachments.map((file, i) => (
                                <FilePreviewCard key={i} file={file} index={i} onRemove={removeAttachment} />
                            ))}
                        </div>
                    )}

                    {/* Quick Chips */}
                    <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {QUICK_CHIPS.map((chip, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(chip)}
                                disabled={isTyping}
                                className={`whitespace-nowrap px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 hover:shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                            >
                                {chip}
                            </button>
                        ))}
                    </div>

                    {/* Input Field */}
                    <div className="p-4 flex items-center gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="application/pdf"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Attach PDF document"
                            className={`p-2.5 rounded-xl transition-all active:scale-95 relative
                                ${attachments.length > 0
                                    ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-500"
                                }`}
                            title="Attach PDF"
                        >
                            <Paperclip className="w-5 h-5" />
                            {attachments.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                    {attachments.length}
                                </span>
                            )}
                        </button>

                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Ex: Apply OD 10.08.2025 to 12.08.2025 for Google IT On Campus"
                                aria-label="Chat input"
                                className="w-full bg-slate-100 dark:bg-slate-800 border-transparent focus:border-indigo-500 focus:ring-0 rounded-xl px-4 py-3 pr-12 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 shadow-inner transition-all"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isTyping}
                                aria-label="Send message"
                                aria-busy={isTyping}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90 flex items-center justify-center"
                            >
                                {isTyping ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button (FAB) */}
            {!isExpanded && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-4 transition-all duration-300 ${isOpen ? "invisible opacity-0" : "visible opacity-100"}`}>
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-800 dark:text-white px-5 py-2.5 rounded-full shadow-xl border border-white/20 dark:border-slate-700 text-sm font-semibold animate-bounce hidden sm:block">
                        Chat with Disha 2.0 👋
                    </div>
                    <button
                        onClick={() => openChat()}
                        className="group relative h-16 w-16 rounded-full shadow-2xl flex items-center justify-center bg-white border-2 border-indigo-500 transition-all duration-500 transform hover:scale-110 active:scale-95 ring-4 ring-indigo-200 dark:ring-indigo-900/40 overflow-hidden"
                    >
                        <img src={dishaAvatar} alt="Disha" className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-white"></span>
                        </span>
                    </button>
                </div>
            )}
        </>
    );
}
