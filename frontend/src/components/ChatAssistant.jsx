import { useState, useRef, useEffect, useCallback } from "react";
import {
    Maximize2,
    Minimize2,
    X,
    Send,
    Paperclip,
    User,
    FileText,
    ThumbsUp,
    ThumbsDown,
    Copy,
    Check,
    ChevronDown
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
   🌊 STREAMING MESSAGE — Claude-style char-by-char
========================================= */
function StreamingMessage({ text, isStreaming }) {
    const [displayed, setDisplayed] = useState("");
    const idxRef = useRef(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!isStreaming) {
            setDisplayed(text);
            return;
        }
        setDisplayed("");
        idxRef.current = 0;

        const tick = () => {
            if (idxRef.current >= text.length) return;
            const ch = text[idxRef.current];
            setDisplayed(prev => prev + ch);
            idxRef.current += 1;

            // Variable speed: punctuation & newlines pause longer for natural rhythm
            const delay = /[.!?\n]/.test(ch) ? 55
                        : ch === ',' ? 35
                        : 12; // normal chars fly fast like Claude
            timerRef.current = setTimeout(tick, delay);
        };
        timerRef.current = setTimeout(tick, 10);
        return () => clearTimeout(timerRef.current);
    }, [text, isStreaming]);

    const html = displayed
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br/>");

    return (
        <div>
            <span dangerouslySetInnerHTML={{ __html: html }} />
            {isStreaming && displayed.length < text.length && (
                <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse align-middle" />
            )}
        </div>
    );
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

/* =========================================
   👍 MESSAGE REACTION BUTTON
========================================= */
function ReactionBar({ msgIndex, reactions, onReact }) {
    const [showPop, setShowPop] = useState(null);
    const reaction = reactions[msgIndex];

    const handleReact = (type) => {
        if (reaction === type) return; // already reacted
        setShowPop(type);
        onReact(msgIndex, type);
        setTimeout(() => setShowPop(null), 800);
    };

    return (
        <div className="flex items-center gap-1 mt-0.5 relative">
            {showPop && (
                <span className="absolute -top-7 left-0 text-lg animate-bounce pointer-events-none select-none">
                    {showPop === "up" ? "👍" : "👎"}
                </span>
            )}
            <button
                onClick={() => handleReact("up")}
                aria-label="Helpful"
                className={`p-1 rounded-full transition-all hover:scale-125 active:scale-95
                    ${reaction === "up" ? "text-green-500" : "text-slate-300 hover:text-green-400"}`}
            >
                <ThumbsUp className="w-3 h-3" />
            </button>
            <button
                onClick={() => handleReact("down")}
                aria-label="Not helpful"
                className={`p-1 rounded-full transition-all hover:scale-125 active:scale-95
                    ${reaction === "down" ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
            >
                <ThumbsDown className="w-3 h-3" />
            </button>
        </div>
    );
}

/* =========================================
   📋 COPY BUTTON
========================================= */
function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const plain = text.replace(/\*\*(.*?)\*\*/g, "$1"); // strip markdown for clipboard

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(plain);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    return (
        <button
            onClick={handleCopy}
            aria-label="Copy message"
            className={`p-1 rounded-full transition-all hover:scale-125 active:scale-95
                ${copied ? "text-green-500" : "text-slate-300 hover:text-slate-500"}`}
        >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
    );
}


/* =========================================
   💡 AUTO-SUGGESTION DATA
========================================= */
// Compute dynamic example dates: today → today + 60 days (max OD window)
const _fmtD = (date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${d}.${m}.${date.getFullYear()}`;
};
const _suggestStart = _fmtD(new Date());
const _suggestEnd = (() => { const e = new Date(); e.setDate(e.getDate() + 60); return _fmtD(e); })();

const SUGGESTIONS = [
    { trigger: /^ap/i, chips: [`Apply OD ${_suggestStart} to ${_suggestEnd} for Google IT On Campus`, "Application Procedure"] },
    { trigger: /^st|^tr|^ch|^my/i, chips: ["Check my Status", "Track my OD"] },
    { trigger: /^doc|^fo|^fi/i, chips: ["Document Formats", "File naming convention"] },
    { trigger: /^sys|^pu|^wh|^ab/i, chips: ["System Purpose", "What is Smart OD?"] },
    { trigger: /^hi|^hel|^hey/i, chips: ["Hello", "Help me apply for OD"] },
];

function getAutoSuggestions(input) {
    if (!input || input.trim().length < 2) return [];
    for (const s of SUGGESTIONS) {
        if (s.trigger.test(input.trim())) return s.chips;
    }
    return [];
}

/**
 * ChatAssistant component - An AI-powered virtual assistant (Disha 2.0)
 */
export default function ChatAssistant() {
    const { isOpen, openChat, closeChat } = useChat();
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState([
        {
            type: "bot",
            text: "Greetings. I am **Disha 2.0**. select a query below or type your question regarding application procedures.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [reactions, setReactions] = useState({}); // { msgIndex: "up" | "down" }
    const [suggestions, setSuggestions] = useState([]);
    const [showScrollPill, setShowScrollPill] = useState(false);
    const [attachments, setAttachments] = useState([]);

    const messagesEndRef = useRef(null);
    const messagesBodyRef = useRef(null);
    const fileInputRef = useRef(null);
    const isAtBottomRef = useRef(true);

    const dishaAvatar = "https://cdn-icons-png.flaticon.com/512/6997/6997662.png";

    /* ---- Scroll management ---- */
    const scrollToBottom = useCallback((force = false) => {
        if (force || isAtBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setShowScrollPill(false);
        }
    }, []);

    const handleScroll = useCallback(() => {
        const el = messagesBodyRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        isAtBottomRef.current = atBottom;
        if (atBottom) setShowScrollPill(false);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [isOpen]);

    useEffect(() => {
        // Show scroll pill for new bot messages if user scrolled up
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.type === "bot" && !isAtBottomRef.current) {
            setShowScrollPill(true);
        } else {
            scrollToBottom();
        }
    }, [messages, scrollToBottom]);

    /* ---- Message helpers (must be defined before useVoiceInput and handleFileSelect) ---- */
    const addBotMsg = useCallback((text) => {
        setMessages(prev => [...prev, { type: "bot", text, timestamp: new Date() }]);
    }, []);

    const streamBotMessage = useCallback((text) => {
        setMessages(prev => [...prev, {
            type: "bot", text, timestamp: new Date(), streaming: true
        }]);
        const durationMs = Math.min(text.split(" ").length * 42, 3000);
        setTimeout(() => {
            setMessages(prev =>
                prev.map((m, i) => i === prev.length - 1 ? { ...m, streaming: false } : m)
            );
        }, durationMs);
    }, []);


    /* ---- Auto-suggestions from typing ---- */
    const handleInputChange = (val) => {
        setInput(val);
        setSuggestions(getAutoSuggestions(val));
    };

    /* ---- Attachments ---- */
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            e.target.value = "";
            if (attachments.length >= 2) {
                addBotMsg("⚠️ Maximum 2 attachments allowed (Offer Letter & Aim).");
                return;
            }
            if (!file.type.includes("pdf")) {
                addBotMsg("⚠️ Only PDF files are supported.");
                return;
            }
            if (!file.name.includes("-ITO-") && !file.name.includes("-ITI-")) {
                addBotMsg("⚠️ Filename warning: Ensure your file follows the format `RollNo-ITO/ITI-Date.pdf`.");
            }
            setAttachments(prev => [...prev, file]);
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    /* ---- Reactions ---- */
    const handleReact = useCallback((msgIndex, type) => {
        setReactions(prev => ({ ...prev, [msgIndex]: type }));
        // Log to backend (fire-and-forget, non-blocking)
        api.post("/ai/feedback", { msgIndex, rating: type }).catch(() => {});
    }, []);

    /* ---- OD Status fetch ---- */
    const fetchODStatus = async () => {
        try {
            const user = JSON.parse(sessionStorage.getItem("user"));
            if (!user || !user.id) return "❌ Please log in to check your OD status.";
            const res = await api.get(`/od/my-ods?studentId=${user.id}`);
            const ods = res.data;
            if (!ods || ods.length === 0) return "ℹ️ You have no OD applications yet.";
            const statusList = ods.map(od =>
                `📌 **${od.company}**\n   Status: **${od.status}**\n   Dates: ${new Date(od.startDate).toLocaleDateString()} - ${new Date(od.endDate).toLocaleDateString()}`
            ).join("\n\n");
            return `Here are your recent OD applications:\n\n${statusList}`;
        } catch { return "❌ Failed to fetch OD status. Please try again later."; }
    };

    /* ---- Smart Apply ---- */
    const processSmartApply = async (text) => {
        const dateMatch = text.match(/(\d{2}[-.](\d{2})[-.](\d{4})) to (\d{2}[-.](\d{2})[-.](\d{4}))/i);
        if (!dateMatch) return `❌ **Invalid Date Format.**\nExample: \`Apply OD ${_suggestStart} to ${_suggestEnd}\``;

        const startDate = dateMatch[1];
        const endDate = dateMatch[4];
        const industryMatch = text.match(/\b(IT|Core|Research)\b/i);
        const campusMatch = text.match(/\b(On Campus|Off Campus)\b/i);
        const industry = industryMatch?.[0];
        const campusType = campusMatch?.[0];

        if (!industry || !campusType) return "❌ **Missing Details.**\nSpecify Industry (IT/Core/Research) and Mode (On Campus/Off Campus).";

        const parts = text.split(/ for /i);
        if (parts.length < 2) return "❌ **Missing Company.**\nUse: `... for <Company Name> ...`";

        const removeToken = (str, token) => str.replace(new RegExp(`\\b${token}\\b`, 'gi'), "");
        let companyName = parts.slice(1).join(" for ")
            .replace(/(\d{2}[-.](\d{2})[-.](\d{4})) to (\d{2}[-.](\d{2})[-.](\d{4}))/i, "").trim();
        companyName = removeToken(removeToken(companyName, industry), campusType).replace(/\s+/g, " ").trim();

        if (!companyName || companyName.length < 2) return "❌ **Invalid Company Name.**";
        if (attachments.length !== 2) return "❌ **Missing Attachments.**\nPlease attach exactly 2 PDFs: Offer Letter and Aim/Objective.";

        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user?.id) return "❌ **Authentication Failed.** Please log in again.";

        try {
            const offersRes = await api.get(`/students/${user.id}/offers`);
            const selectedOffer = offersRes.data.find(o =>
                o.company.name.toLowerCase().includes(companyName.toLowerCase())
            );
            if (!selectedOffer) return `❌ **Company Not Found.**\nSearched for '**${companyName}**'. No matching offer found.`;

            const toISO = (d) => { const p = d.split(/[-.]/); return `${p[2]}-${p[1]}-${p[0]}`; };
            const startISO = toISO(startDate), endISO = toISO(endDate);
            const days = Math.ceil((new Date(endISO) - new Date(startISO)) / 86400000) + 1;

            const offerFile = attachments.find(f => f.name.includes("ITO"));
            const aimFile = attachments.find(f => f.name.includes("ITI"));
            if (!offerFile || !aimFile) return "❌ **Filename Error.**\nEnsure Offer Letter has `-ITO-` and Aim has `-ITI-` in filename.";

            const fd = new FormData();
            fd.append("studentId", user.id);
            fd.append("offerId", selectedOffer.id);
            fd.append("industry", industry.toUpperCase());
            fd.append("campusType", campusType);
            fd.append("startDate", startISO);
            fd.append("endDate", endISO);
            fd.append("duration", days);
            fd.append("offerFile", offerFile);
            fd.append("aimFile", aimFile);
            fd.append("iqacStatus", "Initiated");

            const response = await api.post("/od/apply", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setAttachments([]);
            
            const v = response.data.verificationDetails || {};
            let msg = `✅ **Submitted!**\nOD for **${selectedOffer.company.name}** applied.\nDuration: ${days} days.\n\n`;
            
            // Format AI verification results
            msg += `**🔍 AI Verification Details:**\n`;
            if (v.name?.matchedParts?.length > 0) {
                msg += `- **Name:** ${v.name.matchedParts.join(", ")} ✅\n`;
            } else {
                msg += `- **Name:** Not found ❌\n`;
            }
            if (v.company?.searched) {
                msg += `- **Company:** ${v.company.searched} (${v.company.found ? "✅ Found" : "❌ Not Found"})\n`;
            }

            // ✅ NEW: Strict date match reporting in chat
            if (v.dates) {
                msg += `\n**📅 Date Verification (Strict):**\n`;
                msg += `- **Start Date (${v.dates.startDateSearched}):** ${v.dates.startDateMatched ? "✅ Found in document" : "❌ NOT found — date mismatch"}\n`;
                msg += `- **End Date (${v.dates.endDateSearched}):** ${v.dates.endDateMatched ? "✅ Found in document" : "❌ NOT found — date mismatch"}\n`;

                if (!v.dates.startDateMatched || !v.dates.endDateMatched) {
                    msg += `\n⚠️ *Date mismatch: Ensure your ITI/ITO document contains the exact dates you entered. Accepted formats: DD/MM/YYYY, DD Month YYYY, DD-MM-YYYY.*\n`;
                }
            }
            
            if (response.data.ocrFailed) {
                msg += `\n⚠️ *Note: AI verification flagged issues, so this requires manual Mentor review.*`;
            } else {
                msg += `\n*Track your status in 'My ODs'.*`;
            }
            return msg;
        } catch (error) {
            const errData = error.response?.data;
            if (errData?.steps) {
                const list = errData.steps.map(s => `${s.success ? "✅" : "❌"} **${s.name}**${s.error ? `\n   ${s.error}` : ""}`).join("\n\n");
                return `⚠️ **Verification Incomplete**\n\n${list}\n\nCorrect issues marked ❌ and try again.`;
            }
            return `❌ **Submission Failed.**\n${errData?.message || error.message}`;
        }
    };

    /* ---- Handle Send ---- */
    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        setSuggestions([]);
        setMessages(prev => [...prev, { type: "user", text, timestamp: new Date() }]);
        setInput("");
        setIsTyping(true);

        const lower = text.toLowerCase();

        if (lower.startsWith("apply od")) {
            addBotMsg("🔄 Processing Smart Application...");
            const result = await processSmartApply(text);
            setMessages(prev => {
                const filtered = prev.slice(0, -1);
                return [...filtered, { type: "bot", text: result, timestamp: new Date(), streaming: true }];
            });
            const wc = result.split(" ").length;
            setTimeout(() => setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, streaming: false } : m)), Math.min(result.length * 13, 4000));
            setIsTyping(false);
            return;
        }

        if (lower.includes("status") || lower.includes("track") || lower.includes("check") || lower.includes("my od")) {
            setTimeout(async () => {
                const msg = await fetchODStatus();
                streamBotMessage(msg);
                setIsTyping(false);
            }, 600);
            return;
        }

        (async () => {
            try {
                const response = await api.post("/ai/chat", {
                    message: text,
                    conversationHistory: messages
                        .slice(-6)
                        .filter(m => m.type !== "bot" || !m.text.includes("Processing"))
                        .map(m => ({ role: m.type === "user" ? "user" : "assistant", content: m.text }))
                });
                streamBotMessage(response.data.response);
            } catch {
                streamBotMessage("I'm having trouble connecting right now. Try asking about **OD Status**, **Formats**, or **Procedures**.");
            } finally {
                setIsTyping(false);
            }
        })();
    };

    const QUICK_CHIPS = ["Check my Status", "Application Procedure", "Document Formats", "System Purpose"];

    return (
        <>
            {/* Main Chat Window */}
            <div className={`fixed z-[100] transition-all duration-500 ease-in-out flex flex-col overflow-hidden shadow-2xl
                ${isExpanded
                    ? "inset-0 w-full h-full rounded-none"
                    : `bottom-24 right-6 w-96 max-h-[600px] h-[500px] rounded-3xl ${isOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-10 pointer-events-none"}`
                }
                bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 ring-1 ring-black/5`}
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
                        <button onClick={() => setIsExpanded(!isExpanded)} aria-label={isExpanded ? "Minimize chat" : "Maximize chat"}
                            className="p-2 hover:bg-white/20 rounded-full transition-all duration-200">
                            {isExpanded ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
                        </button>
                        <button onClick={() => { closeChat(); setIsExpanded(false); }} aria-label="Close chat"
                            className="p-2 hover:bg-red-500/80 hover:shadow-red-500/30 hover:shadow-lg rounded-full transition-all duration-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Body (relative for scroll pill positioning) */}
                <div className="flex-1 relative overflow-hidden">
                    <div
                        ref={messagesBodyRef}
                        onScroll={handleScroll}
                        className="h-full overflow-y-auto p-5 scroll-smooth custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50 space-y-4"
                    >
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                                {msg.type === "bot" && (
                                    <div className="w-8 h-8 rounded-full border border-indigo-100 bg-white flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                                        <img src={dishaAvatar} alt="Disha" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5 max-w-[85%] sm:max-w-[75%]">
                                    <div className={`px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm
                                        ${msg.type === "user"
                                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-none shadow-blue-500/20"
                                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-700/50"
                                        }`}
                                    >
                                        {msg.type === "bot" && msg.streaming !== undefined ? (
                                            <StreamingMessage text={msg.text} isStreaming={!!msg.streaming} />
                                        ) : (
                                            <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                                        )}
                                    </div>

                                    {/* Actions row: Timestamp + Reactions + Copy */}
                                    <div className={`flex items-center gap-1 ${msg.type === "user" ? "justify-end" : "justify-start"} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                                        {msg.timestamp && (
                                            <span className="text-[10px] text-slate-400 select-none px-1">{getRelativeTime(msg.timestamp)}</span>
                                        )}
                                        {msg.type === "bot" && (
                                            <>
                                                <CopyButton text={msg.text} />
                                                <ReactionBar msgIndex={i} reactions={reactions} onReact={handleReact} />
                                            </>
                                        )}
                                    </div>
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

                    {/* 🔽 Scroll-to-Latest Pill */}
                    {showScrollPill && (
                        <button
                            onClick={() => scrollToBottom(true)}
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/40 animate-bounce transition-all z-10"
                        >
                            <ChevronDown className="w-3.5 h-3.5" />
                            New message
                        </button>
                    )}
                </div>

                {/* Bottom Panel */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50">

                    {/* File Previews */}
                    {attachments.length > 0 && (
                        <div className="px-4 pt-3 pb-1 flex gap-2.5 overflow-x-auto no-scrollbar">
                            {attachments.map((file, i) => (
                                <FilePreviewCard key={i} file={file} index={i} onRemove={removeAttachment} />
                            ))}
                        </div>
                    )}

                    {/* Auto-Suggestions (contextual chips based on typing) */}
                    {suggestions.length > 0 && (
                        <div className="px-4 pt-2 flex gap-2 overflow-x-auto no-scrollbar">
                            {suggestions.map((chip, i) => (
                                <button key={i}
                                    onClick={() => { handleSend(chip); setSuggestions([]); }}
                                    className="whitespace-nowrap px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-all hover:scale-105 active:scale-95 shadow-sm"
                                >
                                    ✨ {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Default Quick Chips (shown when no auto-suggestions) */}
                    {suggestions.length === 0 && (
                        <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {QUICK_CHIPS.map((chip, i) => (
                                <button key={i} onClick={() => handleSend(chip)} disabled={isTyping}
                                    className="whitespace-nowrap px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 hover:shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Row */}
                    <div className="p-4 flex items-center gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="application/pdf" />

                        {/* Attach button with count badge */}
                        <button onClick={() => fileInputRef.current?.click()} aria-label="Attach PDF"
                            className={`relative p-2.5 rounded-xl transition-all active:scale-95 flex-shrink-0
                                ${attachments.length > 0 ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-500"}`}>
                            <FileText className="w-5 h-5" />
                            {attachments.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">{attachments.length}</span>
                            )}
                        </button>


                        {/* Text input */}
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Ask Disha or type 'Apply OD ...'"
                                aria-label="Chat input"
                                className="w-full bg-slate-100 dark:bg-slate-800 border-transparent focus:border-indigo-500 focus:ring-0 rounded-xl px-4 py-3 pr-12 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 shadow-inner transition-all"
                            />
                            <button onClick={() => handleSend()} disabled={!input.trim() || isTyping}
                                aria-label="Send message" aria-busy={isTyping}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90 flex items-center justify-center">
                                {isTyping ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAB */}
            {!isExpanded && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-4 transition-all duration-300 ${isOpen ? "invisible opacity-0" : "visible opacity-100"}`}>
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-800 dark:text-white px-5 py-2.5 rounded-full shadow-xl border border-white/20 dark:border-slate-700 text-sm font-semibold animate-bounce hidden sm:block">
                        Chat with Disha 2.0 👋
                    </div>
                    <button onClick={() => openChat()}
                        className="group relative h-16 w-16 rounded-full shadow-2xl flex items-center justify-center bg-white border-2 border-indigo-500 transition-all duration-500 transform hover:scale-110 active:scale-95 ring-4 ring-indigo-200 dark:ring-indigo-900/40 overflow-hidden">
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
