"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Images, TrendingUp, Home, Clock3, Search, MessageCircle, User } from "lucide-react";
import { getMemories } from "@/lib/memoryStore";

export default function SummaryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [memories, setMemories] = useState([]);
  const [years, setYears] = useState([]);

  useEffect(() => {
    const all = getMemories(false);
    setMemories(all);
    setYears([...new Set(all.map((m) => m.year))].sort((a, b) => b - a));
  }, []);

  const countsByYear = {};
  memories.forEach((m) => {
    countsByYear[m.year] = (countsByYear[m.year] || 0) + 1;
  });
  const maxCount = Math.max(1, ...Object.values(countsByYear));

  const goToYear = (year) => router.push(`/summary/${year}`);

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/timeline", label: "Timeline", icon: Clock3 },
    { href: "/search", label: "Search", icon: Search },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-24">

      <header className="bg-white shadow-md px-8 py-5 flex items-center gap-5">
        <Link href="/dashboard"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
        <h1 className="text-2xl font-bold">Yearly Summary</h1>
      </header>

      <div className="max-w-4xl mx-auto mt-8 px-6">

        {years.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-16 text-center text-gray-400">
            No memories yet — upload something to see your yearly summary.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <h2 className="text-lg font-bold mb-6">Memories by Year</h2>

              {/* Exactly 5 bars fit the visible width; the rest scroll into view horizontally */}
              <div className="overflow-x-auto">
                <div
                  className="flex items-end gap-4 h-56"
                  style={{ width: `${years.length * 20}%`, minWidth: "100%" }}
                >
                  {years.map((year) => {
                    const count = countsByYear[year] || 0;
                    const heightPct = (count / maxCount) * 100;

                    return (
                      <div
                        key={year}
                        onClick={() => goToYear(year)}
                        className="flex flex-col items-center justify-end h-full cursor-pointer group"
                        style={{ width: `${100 / 5}%`, flexShrink: 0 }}
                      >
                        <span className="text-xs font-semibold mb-2">{count}</span>
                        <div
                          className="w-full max-w-[60px] rounded-t-xl transition-all bg-blue-300 group-hover:bg-blue-600"
                          style={{ height: `${Math.max(heightPct, 6)}%` }}
                        />
                        <span className="text-sm mt-2 font-medium text-gray-500 group-hover:text-blue-600">
                          {year}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {years.length > 5 && (
                <p className="text-xs text-gray-400 mt-3 text-center">← Scroll to see more years →</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-xl p-8 aspect-square flex flex-col justify-between">
                <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center">
                  <Images size={26} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-5xl font-bold text-blue-600">{memories.length}</h3>
                  <p className="text-gray-500 mt-1">Total Memories</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl p-8 aspect-square flex flex-col justify-between">
                <div className="bg-green-100 rounded-full w-14 h-14 flex items-center justify-center">
                  <TrendingUp size={26} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-5xl font-bold text-green-600">{years.length}</h3>
                  <p className="text-gray-500 mt-1">Years with memories</p>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

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