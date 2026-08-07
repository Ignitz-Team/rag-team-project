"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Search as SearchIcon, SlidersHorizontal, X, Trash2, Home, Clock3, MessageCircle, User } from "lucide-react";
import TopIcons from "@/components/TopIcons";
import { getMemories } from "@/lib/memoryStore";

const CATEGORY_OPTIONS = ["All", "Education", "Personal", "Certificates", "Photos", "Videos", "Documents", "Memories", "Others"];
const HISTORY_KEY = "searchPageHistory";

export default function SearchPage() {
  const pathname = usePathname();
  const [memories, setMemories] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [year, setYear] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setMemories(getMemories(false));
    setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"));
  }, []);

  const years = ["All", ...new Set(memories.map((m) => m.year))].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : b - a));

  const hasQuery = query.trim().length > 0;
  const hasFilter = category !== "All" || year !== "All";
  const shouldShowResults = hasQuery || hasFilter;

  const results = shouldShowResults
    ? memories.filter((m) => {
        if (category !== "All" && m.category !== category) return false;
        if (year !== "All" && m.year !== year) return false;
        if (hasQuery && !m.title?.toLowerCase().includes(query.trim().toLowerCase())) return false;
        return true;
      })
    : [];

  const activeFilterCount = (category !== "All" ? 1 : 0) + (year !== "All" ? 1 : 0);

  const saveToHistory = (text) => {
    if (!text.trim()) return;
    const entry = { id: Date.now(), text: text.trim(), time: new Date().toISOString() };
    const updated = [entry, ...history.filter((h) => h.text.toLowerCase() !== text.trim().toLowerCase())].slice(0, 15);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleQueryKeyDown = (e) => {
    if (e.key === "Enter") saveToHistory(query);
  };

  const deleteHistoryEntry = (id) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.setItem(HISTORY_KEY, "[]");
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/timeline", label: "Timeline", icon: Clock3 },
    { href: "/search", label: "Search", icon: SearchIcon },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-24">

      <header className="bg-white shadow-md px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/dashboard"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
          <h1 className="text-2xl font-bold">Search Memories</h1>
        </div>
        <TopIcons />
      </header>

      <div className="max-w-3xl mx-auto mt-8 px-6">

        <div className="relative mb-4">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleQueryKeyDown}
            onBlur={() => saveToHistory(query)}
            placeholder="Type to search, or just set a filter..."
            className="w-full border rounded-xl p-3 pl-10 pr-12 bg-white"
          />
          <button onClick={() => setShowFilters((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100">
            <SlidersHorizontal size={18} className={activeFilterCount > 0 ? "text-blue-600" : "text-gray-400"} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="absolute right-0 top-14 bg-white shadow-2xl border rounded-2xl p-5 w-72 z-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X size={16} /></button>
              </div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full border rounded-lg p-2 mt-1 mb-4">
                {years.map((y) => <option key={y}>{y}</option>)}
              </select>
              <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-lg p-2 mt-1 mb-4">
                {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <button onClick={() => { setCategory("All"); setYear("All"); }} className="w-full text-blue-600 text-sm font-medium py-2">Clear filters</button>
            </div>
          )}
        </div>

        {!hasQuery && history.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Recent Searches</h3>
              <button onClick={clearAllHistory} className="text-xs text-red-500 hover:underline">Clear all</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-1 bg-gray-100 rounded-full pl-3 pr-1 py-1">
                  <button onClick={() => setQuery(h.text)} className="text-sm">{h.text}</button>
                  <button onClick={() => deleteHistoryEntry(h.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!shouldShowResults ? (
          <div className="bg-white rounded-2xl shadow p-16 text-center text-gray-400">
            Start typing, or set a filter, to see your memories.
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">{results.length} result{results.length !== 1 ? "s" : ""}</p>
            {results.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-16 text-center text-gray-400">
                No memories match your search{hasFilter ? " and filters" : ""}.
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((file) => (
                  <div key={file.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">
                        {file.fileType?.startsWith("image/") ? "🖼" : file.fileType?.startsWith("video/") ? "🎬" : file.url ? "🔗" : "📄"}
                      </span>
                      <div>
                        <p className="font-medium">{file.title}</p>
                        <p className="text-sm text-gray-500">{file.category} · {file.year}</p>
                      </div>
                    </div>
                    <button onClick={() => setPreviewFile(file)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">View</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {previewFile && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 px-4" onClick={() => setPreviewFile(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{previewFile.title}</h3>
              <button onClick={() => setPreviewFile(null)}><X /></button>
            </div>
            {previewFile.fileType?.startsWith("image/") && <img src={previewFile.preview} alt={previewFile.title} className="w-full rounded-xl" />}
            {previewFile.fileType?.startsWith("video/") && <video src={previewFile.preview} controls className="w-full rounded-xl" />}
            {previewFile.fileType === "application/pdf" && <iframe src={previewFile.preview} className="w-full h-[60vh] rounded-xl border" title={previewFile.title} />}
            {previewFile.textContent && <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-xl border max-h-96 overflow-y-auto">{previewFile.textContent}</pre>}
            {previewFile.url && <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="block bg-blue-50 text-blue-600 p-4 rounded-xl break-all hover:underline">🔗 {previewFile.url}</a>}
            {!previewFile.fileType?.startsWith("image/") && !previewFile.fileType?.startsWith("video/") && previewFile.fileType !== "application/pdf" && !previewFile.textContent && !previewFile.url && (
              <div className="bg-gray-100 p-8 rounded-xl text-center text-gray-500">Preview not available — {previewFile.fileName}</div>
            )}
            {previewFile.description && <p className="mt-4 text-gray-600">{previewFile.description}</p>}
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} className={`flex flex-col items-center ${isActive ? "text-blue-600" : "text-gray-600"}`}>
                <Icon size={22} />
                <span className="text-xs">{label}</span>
              </Link>
            );
          })}
        </div>
      </footer>
    </div>
  );
}