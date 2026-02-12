import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import { useChat } from "../context/ChatContext"; // ✅ Import Hook

export default function ChatAssistant() {
    const { isOpen, setIsOpen, openChat, closeChat } = useChat(); // ✅ Use Context
    // const [isOpen, setIsOpen] = useState(false); // ❌ Remove local state
    const [isExpanded, setIsExpanded] = useState(false); // Full screen toggle
    const [messages, setMessages] = useState([
        { type: "bot", text: "Greetings. I am **Disha 2.0**. select a query below or type your question regarding application procedures." }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const location = useLocation();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const [attachments, setAttachments] = useState([]);
    const fileInputRef = useRef(null);

    // Custom Disha Avatar
    const dishaAvatar = "https://cdn-icons-png.flaticon.com/512/6997/6997662.png";

    /* =========================================
       📎 ATTACHMENT HANDLERS
    ========================================= */
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (attachments.length >= 2) {
                setMessages(prev => [...prev, { type: "bot", text: "⚠️ Maximum 2 attachments allowed (Offer Letter & Aim)." }]);
                return;
            }
            if (!file.type.includes("pdf")) {
                setMessages(prev => [...prev, { type: "bot", text: "⚠️ Only PDF files are supported." }]);
                return;
            }
            // Basic filename check suggestion (optional, but helpful)
            if (!file.name.includes("-ITO-") && !file.name.includes("-ITI-")) {
                setMessages(prev => [...prev, { type: "bot", text: "⚠️ Filename warning: Ensure your file follows the format `RollNo-ITO/ITI-Date.pdf`." }]);
            }

            setAttachments(prev => [...prev, file]);
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

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
        // 1. Extract Dates (Required)
        const dateRegex = /(\d{2}[-.]\d{2}[-.]\d{4}) to (\d{2}[-.]\d{2}[-.]\d{4})/i;
        const dateMatch = text.match(dateRegex);

        if (!dateMatch) {
            return "❌ **Invalid Date Format.**\nPlease use: `Apply OD <Start> to <End> ...`\nExample: `Apply OD 10.08.2025 to 12.08.2025`";
        }

        const [_, startDate, endDate] = dateMatch;

        // 2. Extract Keywords (Flexible Order)
        const industryMatch = text.match(/\b(IT|Core|Research)\b/i);
        const campusMatch = text.match(/\b(On Campus|Off Campus)\b/i);

        const industry = industryMatch ? industryMatch[0] : null;
        const campusType = campusMatch ? campusMatch[0] : null;

        if (!industry || !campusType) {
            return "❌ **Missing Details.**\nPlease specify the **Industry** (IT/Core/Research) and **Mode** (On Campus/Off Campus).\nExample: `... for Google IT On Campus`";
        }

        // 3. Extract Company Name
        // Logic: "for <Company>" ... and stop at first keyword or end of string.
        // We know the structure is "for <Company> [keywords]"
        // So we split by "for" and take the second part.
        const parts = text.split(/ for /i);
        if (parts.length < 2) {
            return "❌ **Missing Company.**\nPlease use: `... for <Company Name> ...`";
        }

        // Get everything after "for"
        let companySection = parts.slice(1).join(" for "); // Rejoin if multiple "for"s exists (edge case)

        // Remove the dates if they appeared after "for" (unlikely but safe)
        companySection = companySection.replace(dateRegex, "").trim();

        // Remove known keywords to isolate company name
        const keywordsToRemove = [industry, campusType, "to", startDate, endDate];
        // Also remove "add", "apply", "od" just in case they leaked in (defensive)

        // Strategy: Truncate company name at the *first* occurrence of a keyword
        // This assumes user types "for Google IT...", not "IT for Google..."
        // If they typed "IT On Campus for Google", this logic needs to be different.

        // Let's assume standard "for <Company>" is valid, but what follows can be mixed.
        // We simply remove the found keywords from the companySection string.
        let companyName = companySection;

        // Regex to remove keywords case-insensitively
        companyName = companyName.replace(new RegExp(`\\b${industry}\\b`, 'yi'), ""); // 'y' is sticky, nope.
        // Just replace strings
        const removeToken = (str, token) => {
            const regex = new RegExp(`\\b${token}\\b`, 'gi');
            return str.replace(regex, "");
        }

        companyName = removeToken(companyName, industry);
        companyName = removeToken(companyName, campusType);

        // Cleanup extra spaces and special chars
        companyName = companyName.replace(/\s+/g, " ").trim();

        // Remove trailing "it" if it was part of "for Google add on campus it" and "it" was matched as industry.
        // Wait, "it" IS the industry. So it's already removed.

        // Fix for "Google add" -> If "add" is a common typo for "and" or just noise, we leave it. 
        // We can't distinguish "Google Add" (company) from "Google add" (typo).
        // But the user's prompt was "Google add on campus it".
        // industry="it". campus="on campus".
        // companySection initially "Google add on campus it".
        // remove "it": "Google add on campus "
        // remove "on campus": "Google add  "
        // Result: "Google add". 
        // This is acceptable behavior.

        if (!companyName || companyName.length < 2) {
            return "❌ **Invalid Company Name.**\nPlease explicitly mention who you are visiting.";
        }

        // --- Logic Continues ---

        if (attachments.length !== 2) {
            return "❌ **Missing Attachments.**\nPlease attach exactly 2 PDF files: **Offer Letter** and **Aim/Objective** before sending.";
        }

        // Verify Student Session
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user || !user.id) return "❌ **Authentication Failed.** Please log in again.";

        try {
            // 1. Fetch Offers to find ID
            const token = sessionStorage.getItem("token");
            const offersRes = await api.get(`/students/${user.id}/offers`);
            const offers = offersRes.data;

            // Fuzzy match company name
            const selectedOffer = offers.find(o => o.company.name.toLowerCase().includes(companyName.toLowerCase().trim()));

            if (!selectedOffer) {
                return `❌ **Company Not Found.**\nI searched for '**${companyName}**' but couldn't find a matching offer in your records.`;
            }

            // 2. Prepare Form Data
            const formData = new FormData();
            formData.append("studentId", user.id);
            formData.append("offerId", selectedOffer.id);
            formData.append("industry", industry.toUpperCase()); // Normalize
            formData.append("campusType", campusType); // Keep formatting or normalize? Backend likely expects specific strings.
            // "On Campus" / "Off Campus" -> Ensure backend supports spaces or CamelCase.
            // Usually enums are "ON_CAMPUS" or similar. But let's assume Title Case is fine for now based on UI.

            // Format dates for backend (YYYY-MM-DD)
            const toISODate = (d) => {
                const parts = d.split(/[-.]/);
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            };

            const startISO = toISODate(startDate);
            const endISO = toISODate(endDate);

            formData.append("startDate", startISO);
            formData.append("endDate", endISO);

            // Calculate duration
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

            // 3. Submit
            await api.post("/od/apply", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setAttachments([]); // Clear
            return `✅ **Success!**\nOD Application for **${selectedOffer.company.name}** submitted.\nDuration: ${days} days.\nTrack status in 'My ODs'.`;

        } catch (error) {
            console.error(error);
            const errData = error.response?.data;

            // 🛑 CHECKLIST RENDERER
            if (errData?.steps && Array.isArray(errData.steps)) {
                const stepsList = errData.steps.map(step => {
                    const icon = step.success ? "✅" : "❌";
                    const status = step.success ? "**Success**" : `**Failed**: ${step.error || ""}`;
                    return `${icon} **${step.name}**\n   ${status}`; // Indented status
                }).join("\n\n");

                return `⚠️ **Verification Incomplete**\n\n${stepsList}\n\nPlease correct the issues marked with ❌ and try again.`;
            }

            return `❌ **Submission Failed.**\n${errData?.message || error.message}`;
        }
    };

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        // User Message
        const userMsg = { type: "user", text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        const lowerText = text.toLowerCase();

        // 🧠 SMART APPLY COMMAND CHECK
        if (lowerText.startsWith("apply od")) {
            // Simulate processing
            setMessages(prev => [...prev, { type: "bot", text: "🔄 Processing Smart Application..." }]);

            const resultMsg = await processSmartApply(text);

            setMessages(prev => {
                // Remove 'Processing' message (last one)
                const filtered = prev.slice(0, -1);
                return [...filtered, { type: "bot", text: resultMsg }];
            });
            setIsTyping(false);
            return;
        }

        // Check for Status/Track keywords FIRST
        if (lowerText.includes("status") || lowerText.includes("track") || lowerText.includes("check") || lowerText.includes("my od")) {
            // Simulate thinking then fetch API
            setTimeout(async () => {
                const statusMsg = await fetchODStatus();
                setMessages((prev) => [...prev, { type: "bot", text: statusMsg }]);
                setIsTyping(false);
            }, 600);
            return;
        }

        // 🤖 AI-POWERED RESPONSE for general queries
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

                setMessages((prev) => [...prev, { type: "bot", text: response.data.response }]);
            } catch (error) {
                console.error("AI Error:", error);
                // Fallback response
                setMessages((prev) => [...prev, {
                    type: "bot",
                    text: "I'm having trouble connecting right now. Please try asking about **OD Status**, **Formats**, or **Procedures**."
                }]);
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
                        {/* Expand / Collapse Button */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                            title={isExpanded ? "Minimize" : "Full Screen"}
                        >
                            {isExpanded ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                            )}
                        </button>
                        {/* Close Button */}
                        <button
                            onClick={() => { closeChat(); setIsExpanded(false); }}
                            className="p-2 hover:bg-red-500/80 hover:shadow-red-500/30 hover:shadow-lg rounded-full transition-all duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-5 scroll-smooth custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50 space-y-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            {msg.type === "bot" && (
                                <div className="w-8 h-8 rounded-full border border-indigo-100 bg-white flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                                    <img src={dishaAvatar} alt="Disha" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm
                                ${msg.type === "user"
                                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-none shadow-blue-500/20"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-700/50 shadow-slate-200/50 dark:shadow-none"
                                }`}>
                                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                            </div>
                            {msg.type === "user" && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs shadow-sm shrink-0">👤</div>
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

                {/* Attachments & Quick Actions Panel (Glassy) */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50">
                    {/* Attachments Chips */}
                    {attachments.length > 0 && (
                        <div className="px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar">
                            {attachments.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-xs px-3 py-1.5 rounded-lg text-indigo-700 dark:text-indigo-300 shadow-sm transition-all hover:scale-105">
                                    <span className="text-base">📄</span>
                                    <span className="max-w-[120px] truncate font-medium">{file.name}</span>
                                    <button onClick={() => removeAttachment(i)} className="ml-1 text-indigo-400 hover:text-red-500 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Chips */}
                    <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {QUICK_CHIPS.map((chip, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(chip)}
                                className="whitespace-nowrap px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
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
                            className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-500 rounded-xl transition-all active:scale-95"
                            title="Attach PDF"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                        </button>

                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Ex: Apply OD 10.08.2025 to 12.08.2025 for Google IT On Campus"
                                className="w-full bg-slate-100 dark:bg-slate-800 border-transparent focus:border-indigo-500 focus:ring-0 rounded-xl px-4 py-3 pr-12 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 shadow-inner transition-all"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
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
                        {/* Ping effect */}
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
