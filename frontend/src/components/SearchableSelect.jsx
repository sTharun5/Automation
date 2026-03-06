import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * SearchableSelect Component
 * @param {Array} options - [{ value, label, sublabel, icon, ... }]
 * @param {Function} onChange - (value) => void
 * @param {string} placeholder - Placeholder text
 * @param {string} label - Input label
 * @param {string} value - Current selected value
 * @param {boolean} isAsync - Whether to fetch options from server
 * @param {Function} onSearch - (query) => Promise<options> (only if isAsync)
 * @param {boolean} disabled - Whether the select is disabled
 * @param {string} error - Error message
 * @param {string} className - Additional classes
 * @param {boolean} required - Whether the field is required
 */
export default function SearchableSelect({
    options = [],
    onChange,
    placeholder = "Select an option...",
    label,
    value,
    isAsync = false,
    onSearch,
    disabled = false,
    error,
    className = "",
    required = false
}) {
    const { darkMode } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [filteredOptions, setFilteredOptions] = useState(options);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Sync filtered options with props
    useEffect(() => {
        if (!isAsync) {
            if (!query) {
                setFilteredOptions(options);
            } else {
                const lowerQuery = query.toLowerCase();
                setFilteredOptions(
                    options.filter(opt =>
                        opt.label.toLowerCase().includes(lowerQuery) ||
                        (opt.sublabel && opt.sublabel.toLowerCase().includes(lowerQuery))
                    )
                );
            }
        }
    }, [query, options, isAsync]);

    // Async search
    useEffect(() => {
        if (isAsync && isOpen && query.length > 1) {
            const timer = setTimeout(async () => {
                setIsLoading(true);
                try {
                    const results = await onSearch(query);
                    setFilteredOptions(results || []);
                } catch (err) {
                    console.error("SearchableSelect Async Error:", err);
                } finally {
                    setIsLoading(false);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [query, isAsync, isOpen, onSearch]);

    // Handle clicks outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scroll active item into view
    useEffect(() => {
        if (activeIndex >= 0 && listRef.current) {
            const activeItem = listRef.current.children[activeIndex];
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [activeIndex]);

    const selectedOption = options.find(opt => opt.value === value) || (isAsync ? filteredOptions.find(opt => opt.value === value) : null);

    const handleSelect = (option) => {
        onChange(option.value, option);
        setQuery("");
        setIsOpen(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                setIsOpen(true);
                return;
            }
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && filteredOptions[activeIndex]) {
                    handleSelect(filteredOptions[activeIndex]);
                } else if (filteredOptions.length === 1) {
                    handleSelect(filteredOptions[0]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setActiveIndex(-1);
                break;
            default:
                break;
        }
    };

    const toggleOpen = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    };

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 px-1">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}

            {/* Selection Bar */}
            <div
                onClick={toggleOpen}
                className={`
                    group w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all cursor-pointer
                    ${disabled ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-60 border-slate-200 dark:border-slate-800' :
                        isOpen ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-4 ring-indigo-500/10' :
                            'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50'}
                    ${error ? 'border-rose-500 ring-rose-500/10' : ''}
                `}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {selectedOption?.icon && <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{selectedOption.icon}</span>}
                    <div className="flex flex-col truncate">
                        <span className={`text-sm font-bold truncate ${selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        {selectedOption?.sublabel && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium truncate uppercase tracking-tighter">
                                {selectedOption.sublabel}
                            </span>
                        )}
                    </div>
                </div>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* ERROR MESSAGE */}
            {error && <p className="mt-1.5 px-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider">{error}</p>}

            {/* DROPDOWN MENU */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl shadow-indigo-500/10 animate-springUp overflow-hidden flex flex-col max-h-[400px]">

                    {/* Search Input */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                                placeholder="Type to filter..."
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setActiveIndex(-1);
                                }}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar" ref={listRef}>
                        {isLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3">
                                <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Searching...</p>
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                <span className="text-2xl block mb-2">🤷‍♂️</span>
                                <p className="text-xs font-bold uppercase tracking-widest">No results found</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredOptions.map((option, index) => (
                                    <div
                                        key={option.value}
                                        onClick={() => handleSelect(option)}
                                        className={`
                                            flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all
                                            ${index === activeIndex ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-500/20' :
                                                option.value === value ? 'bg-slate-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {option.icon && <span className="text-lg">{option.icon}</span>}
                                            <div className="flex flex-col truncate">
                                                <span className={`text-sm font-bold truncate ${option.value === value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {option.label}
                                                </span>
                                                {option.sublabel && (
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate uppercase tracking-tighter">
                                                        {option.sublabel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {option.value === value && (
                                            <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
                            {filteredOptions.length} Options Available
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
