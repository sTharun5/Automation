
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchInput = ({
    placeholder = "Search...",
    onSearch,
    fetchSuggestions, // Async function to fetch data based on query
    onSelect, // Function when a suggestion is clicked
    renderSuggestion, // Function to render each suggestion item
    keyExtractor = (item) => item.id // Unique key for list
}) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    // Debounce Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length > 1 && fetchSuggestions) {
                setLoading(true);
                try {
                    const results = await fetchSuggestions(query);
                    setSuggestions(results || []);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Search Error:", error);
                    setSuggestions([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, fetchSuggestions]);

    // Handle Outside Click
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (item) => {
        if (onSelect) {
            onSelect(item);
            setQuery(""); // Clear or maintain based on need? Usually clear or set to item name.
            // Let's keep it flexible, maybe clear query if selection is a navigation action
        }
        setShowSuggestions(false);
    };

    const handleEnter = (e) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch(query);
            setShowSuggestions(false);
        }
    }

    return (
        <div ref={wrapperRef} className="relative w-full max-w-md">
            <div className="relative group">
                <motion.input
                    layout
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleEnter}
                    placeholder={placeholder}
                    className="w-full px-5 py-3 pl-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    whileFocus={{ scale: 1.02 }}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </span>

                {loading && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    </span>
                )}
            </div>

            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.ul
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl max-h-80 overflow-y-auto overflow-hidden divide-y divide-slate-100 dark:divide-slate-800"
                    >
                        {suggestions.map((item) => (
                            <motion.li
                                key={keyExtractor(item)}
                                onClick={() => handleSelect(item)}
                                className="px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                                whileHover={{ x: 4 }}
                            >
                                {renderSuggestion ? renderSuggestion(item) : <span>{item.name || item.title}</span>}
                                <span className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchInput;
