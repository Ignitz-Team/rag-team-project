"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { getMemories } from "@/lib/memoryStore";

export default function YearSummaryPage() {
  const params = useParams();
  const year = decodeURIComponent(String(params.year));

  const [yearMemories, setYearMemories] = useState([]);

  useEffect(() => {
    const all = getMemories(false);
    const filtered = all
      .filter((m) => String(m.year).trim() === year.trim())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    setYearMemories(filtered);
  }, [year]);

  const categoryCounts = {};
  yearMemories.forEach((m) => {
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
  });
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0];

  const highlights = [];
  if (yearMemories.length > 0) {
    highlights.push(`You saved ${yearMemories.length} memor${yearMemories.length === 1 ? "y" : "ies"} in ${year}.`);
    if (topCategory) highlights.push(`Most active category: ${topCategory[0]} (${topCategory[1]} files).`);
    if (sortedCategories.length > 1) highlights.push(`Activity spread across ${sortedCategories.length} different categories.`);

    const first = yearMemories[0];
    const last = yearMemories[yearMemories.length - 1];
    if (first) highlights.push(`First memory of the year: "${first.title}" on ${new Date(first.date).toLocaleDateString()}.`);
    if (last && last !== first) highlights.push(`Most recent memory: "${last.title}" on ${new Date(last.date).toLocaleDateString()}.`);
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-10">

      <header className="bg-white shadow-md px-8 py-5 flex items-center gap-5">
        <Link href="/summary"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
        <div>
          <h1 className="text-2xl font-bold">{year} — Full Year Summary</h1>
          <p className="text-gray-500 text-sm">{yearMemories.length} memories</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto mt-8 px-6">

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-lg font-bold mb-4">Highlights</h2>
          {highlights.length === 0 ? (
            <p className="text-gray-400">No memories recorded for {year}.</p>
          ) : (
            <ul className="space-y-3">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Star size={16} className="text-yellow-500 fill-yellow-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {sortedCategories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {sortedCategories.map(([cat, count]) => (
              <div key={cat} className="bg-white rounded-2xl shadow p-5">
                <p className="text-3xl font-bold text-blue-600">{count}</p>
                <p className="text-gray-500 text-sm mt-1">{cat}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold mb-4">Everything from {year}</h3>
          {yearMemories.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nothing here yet.</p>
          ) : (
            <div className="space-y-3">
              {yearMemories.map((m) => (
                <div key={m.id} className="flex justify-between items-center border-b pb-3 last:border-none">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {m.fileType?.startsWith("image/") ? "🖼" : m.fileType?.startsWith("video/") ? "🎬" : m.url ? "🔗" : "📄"}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-gray-500">{m.category}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(m.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}