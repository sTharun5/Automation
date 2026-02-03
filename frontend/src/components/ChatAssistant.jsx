import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";

export default function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
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

    /* =========================================
       📘 PROFESSIONAL KNOWLEDGE BASE
       - Formal language
       - Detailed procedures
       - Format specifications
    ========================================= */
    const KNOWLEDGE_BASE = [
        {
            id: "apply",
            keywords: ["apply", "how to", "create", "step", "procedure", "process", "submission"],
            response: "**Application Procedure:**\n\n1. Navigate to the **Dashboard**.\n\n2. Click the **'Apply OD'** button located in the top-right corner.\n\n3. Input the **Company Name** and select the strictly required **Start/End Dates**.\n\n4. **Upload Evidence** with specific naming:\n   - **Offer Letter**: `RollNo-ITO-Date` (e.g., `201CS111-ITO-08.06.2025`)\n   - **Aim/Objective**: `RollNo-ITI-Date` (e.g., `201CS111-ITI-08.06.2025`)\n\n5. Click **Submit** to forward the request to your assigned Faculty Mentor."
        },
        {
            id: "formats",
            keywords: ["format", "size", "upload", "pdf", "image", "file", "requirement", "name", "naming"],
            response: "**Document Standards:**\n\nPlease strictly adhere to these specific naming formats:\n\n📄 **Offer Letter**:\n`RollNo-ITO-Date.pdf`\n(e.g., `201CS111-ITO-08.06.2025.pdf`)\n\n📄 **Aim/Objective**:\n`RollNo-ITI-Date.pdf`\n(e.g., `201CS111-ITI-08.06.2025.pdf`)\n\n⚠️ **Restrictions**:\n- Maximum File Size: **5 MB**\n- Content must be clearly legible."
        },
        {
            id: "purpose",
            keywords: ["purpose", "what is", "portal", "system", "about"],
            response: "**System Overview:**\n\nThe **Smart OD Automation System** is an institutional platform designed to digitize the On-Duty request workflow. It facilitates:\n\n- Real-time tracking of placement ODs.\n- Digital validation of offer letters.\n- Streamlined Mentor-Student communication."
        },
        {
            id: "approval",
            keywords: ["approve", "status", "pending", "mentor", "wait"],
            response: "**Approval Workflow:**\n\nUpon submission, your request status is set to **PENDING**.\n\n🔸 **Review**: Your mapped Faculty Mentor will review the attached documents.\n\n🔹 **Outcome**: You will receive a system notification upon **APPROVAL** or **REJECTION**.\n\n🔸 **Action**: Monitor your dashboard or notification center for updates."
        },
        {
            id: "cancel",
            keywords: ["cancel", "delete", "revoke", "modify"],
            response: "**Cancellation Policy:**\n\n❌ **Pending Requests**:\nCan be withdrawn via the 'Trash' icon in the OD History section.\n\n🔒 **Approved Requests**:\nCannot be modified by students. Contact the Administrator for revocation if necessary."
        },
        {
            id: "contact",
            keywords: ["contact", "help", "support", "issue", "error"],
            response: "**Support:**\n\nFor technical issues or data discrepancies, please contact the System Administrator or your Department Coordinator."
        },
        {
            id: "greeting",
            keywords: ["hello", "hi", "greetings", "start"],
            response: "Greetings. I am **Disha 2.0**. I can assist you with:\n\n1. Application Procedures\n2. File Naming & Formats\n3. System Policies\n\nHow may I assist you?"
        }
    ];

    /* =========================================
       ⚙️ LOGIC ENGINE WITH API
    ========================================= */
    const findBestResponse = (query) => {
        const tokens = query.toLowerCase().split(/\s+/);
        let bestMatch = null;
        let maxScore = 0;

        KNOWLEDGE_BASE.forEach((topic) => {
            let score = 0;
            tokens.forEach((token) => {
                if (topic.keywords.some((k) => k.includes(token) || token.includes(k))) {
                    score += 1;
                }
            });

            if (score > maxScore) {
                maxScore = score;
                bestMatch = topic;
            }
        });

        if (maxScore > 0 && bestMatch) {
            return bestMatch.response;
        }

        return "I apologize, but I could not identify a standardized response for that inquiry. Please try keywords such as **'Application Process'**, **'File Formats'**, or **'Approval Status'**.";
    };

    const fetchODStatus = async () => {
        try {
            const res = await api.get("/od/my-ods");
            const ods = res.data;

            // CASE 1: No ODs found
            if (!Array.isArray(ods) || ods.length === 0) {
                return "**Status Update:**\n\nNo records found. You have not submitted any On-Duty applications yet.\n\nTo apply, use the **'Apply OD'** button on your dashboard.";
            }

            // CASE 2: ODs exist - Formatting
            const formattedList = ods.slice(0, 5).map((od, index) => {
                const statusIcon = od.status === "APPROVED" ? "✅" : od.status === "REJECTED" ? "❌" : "⏳";
                const date = new Date(od.startDate).toLocaleDateString();
                const company = od.company || "Unknown Company";
                return `${index + 1}. **${company}** (${date}): ${statusIcon} **${od.status}**`;
            }).join("\n");

            return `**Current Application Status:**\n\n${formattedList}\n\n(Displaying most recent 5 records)`;

        } catch (error) {
            console.error("Chatbot API Error:", error);

            // CASE 3: Authentication Error
            if (error.response?.status === 401 || error.response?.status === 403) {
                return "**Authentication Notice:**\n\nUser verification failed. Please refresh the page or log in again to view sensitive data.";
            }

            // CASE 4: Network/Server Error
            return "**System Notice:**\n\nUnable to retrieve status at this moment. Please check your network connection or contact support if the issue persists.";
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

        // Processing Delay for Realism
        setTimeout(() => {
            const botResponse = findBestResponse(text);
            setMessages((prev) => [...prev, { type: "bot", text: botResponse }]);
            setIsTyping(false);
        }, 400);
    };

    const QUICK_CHIPS = [
        "Check my Status",
        "Application Procedure",
        "Document Formats",
        "System Purpose"
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            {/* Interaction Area enable pointer events */}
            <div className={`pointer-events-auto transition-all duration-300 origin-bottom-right ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}>
                <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[500px]">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🤖</span>
                            <div>
                                <h3 className="font-bold text-sm">Disha 2.0</h3>
                                <p className="text-[10px] opacity-80">Automated Agent</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950/50 space-y-3 custom-scrollbar">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${msg.type === "user"
                                    ? "bg-blue-600 text-white rounded-br-none"
                                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none"
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        {/* Quick Chips */}
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
                            {QUICK_CHIPS.map((chip, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(chip)}
                                    className="whitespace-nowrap px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Type your query..."
                                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 dark:text-white placeholder:text-slate-400"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim()}
                                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAB Toggle Area */}
            <div className="flex items-center gap-4 pointer-events-auto">
                {!isOpen && (
                    <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 text-sm font-semibold animate-bounce">
                        Chat with Disha 2.0 👋
                    </div>
                )}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${isOpen
                        ? "bg-slate-700 rotate-90"
                        : "bg-blue-600 hover:bg-blue-700 scale-100"
                        }`}
                >
                    {isOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <span className="text-3xl">🤖</span>
                    )}
                </button>
            </div>
        </div>
    );
}
