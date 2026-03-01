import React, { useState, useEffect, useRef } from "react";

export default function LocationAutocomplete({ value, onChange, placeholder = "City / Location (e.g. Bangalore)" }) {
    const [query, setQuery] = useState(value || "");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const debounceTimeout = useRef(null);

    // Sync external value changes into local input if needed
    useEffect(() => {
        setQuery(value || "");
    }, [value]);

    useEffect(() => {
        // Handle clicks outside to close dropdown
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = async (searchQuery) => {
        if (!searchQuery.trim() || searchQuery.length < 3) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            // Using Open-Meteo Geocoding API (Fast, Free, highly reliable for cities)
            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`
            );
            const data = await response.json();

            if (!data.results) {
                setSuggestions([]);
                setIsOpen(false);
                return;
            }

            // Extract and format names gracefully 
            // e.g., "Mumbai, Maharashtra, India"
            const parsedSuggestions = data.results.map(item => {
                const parts = [item.name, item.admin1, item.country].filter(Boolean);
                return parts.join(", ");
            });

            // Deduplicate
            const uniqueSuggestions = [...new Set(parsedSuggestions)];

            setSuggestions(uniqueSuggestions);
            setIsOpen(uniqueSuggestions.length > 0);
        } catch (error) {
            console.error("Failed to fetch location suggestions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        // We notify parent immediately so free-text is still allowed 
        onChange(val);

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        debounceTimeout.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 500); // 500ms debounce to respect OpenStreetMap rate limits
    };

    const handleSelectSuggestion = (suggestion) => {
        // Update local state
        setQuery(suggestion);
        // Update parent state
        onChange(suggestion);
        // Close dropdown
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative flex-1 w-full">
            <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
            />

            {/* Loading Indicator inside input */}
            {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin"></div>
                </div>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden py-2 animate-slideDown origin-top">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-3 text-sm"
                        >
                            <span>📍</span>
                            <span className="truncate">{suggestion}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
