"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { getAllMemoriesRaw } from "@/lib/memoryStore";

// safely turn any date-ish value into a Date, or null if it's bad/missing
function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export default function AllUploadsPage() {
  const [memories, setMemories] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | deleted

  useEffect(() => {
    async function load() {
      const all = (await getAllMemoriesRaw()) || [];
      setMemories(all);
    }

    load();
  }, []);

  const filtered = memories
    .filter((m) => {
      if (filter === "active") return !m.deleted;
      if (filter === "deleted") return m.deleted;
      return true;
    })
    .filter((m) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        m.title?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q) ||
        m.fileName?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const ad = safeDate(a.deletedAt || a.date || a.createdAt);
      const bd = safeDate(b.deletedAt || b.date || b.createdAt);
      return (bd ? bd.getTime() : 0) - (ad ? ad.getTime() : 0);
    });

  return (
    <div className="min-h-screen bg-slate-100 pb-16">

      <header className="bg-white shadow-md px-8 py-5 flex items-center gap-5">
        <Link href="/dashboard">
          <ArrowLeft size={26} className="cursor-pointer hover:text-blue-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Upload History</h1>
          <p className="text-gray-500 text-sm">{memories.length} total uploads</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto mt-8 px-6">

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, category, or file name..."
              className="w-full border rounded-xl p-3 pl-10 bg-white"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-xl p-3 bg-white"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-16 text-center text-gray-400">
            No uploads found.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const displayDate =
                safeDate(item.deletedAt) || safeDate(item.date) || safeDate(item.createdAt);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow p-4 flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">
                      {item.fileType?.startsWith("image/")
                        ? "🖼"
                        : item.fileType?.startsWith("video/")
                        ? "🎬"
                        : "📄"}
                    </span>
                    <div>
                      <p className={`font-medium ${item.deleted ? "line-through text-gray-400" : ""}`}>
                        {item.title}
                        {item.deleted && (
                          <span className="ml-2 text-xs font-semibold text-red-500 no-underline">
                            (Deleted)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.category} · {item.year}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-500 text-sm whitespace-nowrap">
                    {displayDate ? displayDate.toLocaleDateString() : "Unknown date"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}