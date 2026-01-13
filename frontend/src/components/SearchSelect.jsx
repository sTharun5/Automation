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
        className="w-full border p-2 rounded"
        placeholder="Search by roll / name / email"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />

      {results.length > 0 && (
        <ul className="absolute bg-white border w-full z-10 max-h-48 overflow-y-auto">
          {results.map((s) => (
            <li
              key={s.id}
              onClick={() => {
                onSelect(s);
                setQuery(`${s.name} (${s.rollNo})`);
                setResults([]);
              }}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              <b>{s.name}</b> — {s.rollNo}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
