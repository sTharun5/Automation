import { useState } from "react";
import api from "../api/axios";

export default function SearchSelect({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleChange = async (value) => {
    setQuery(value);

    if (!value) {
      setResults([]);
      return;
    }

    try {
      const res = await api.get(`/students/search?q=${value}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        placeholder="Search by roll / name / email"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />

      {results.length > 0 && (
        <ul className="absolute bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 w-full z-10 max-h-48 overflow-y-auto">
          {results.map((s) => (
            <li
              key={s.id}
              onClick={() => {
                onSelect(s);
                setQuery(`${s.name} (${s.rollNo})`);
                setResults([]);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-slate-900 dark:text-white"
            >
              <b>{s.name}</b> — {s.rollNo}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
