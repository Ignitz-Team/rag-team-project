"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, HardDrive } from "lucide-react";
import { getMemories, getTotalStorageBytes } from "@/lib/memoryStore";

const QUOTA_BYTES = 5 * 1024 * 1024; // ~5MB realistic localStorage budget for demo

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function StorageUsagePage() {
  const [count, setCount] = useState(0);
  const [usedBytes, setUsedBytes] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      const memories = await getMemories(false);
      setCount(memories.length);
      setUsedBytes(await getTotalStorageBytes());
    };
    refresh();
    // keep it live in case another tab/page uploads while this is open
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const usedPercent = Math.min(100, Math.round((usedBytes / QUOTA_BYTES) * 100));

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <header className="bg-white shadow-md px-8 py-5 flex items-center gap-5">
        <Link href="/profile"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
        <h1 className="text-2xl font-bold">Storage Usage</h1>
      </header>
      <div className="max-w-lg mx-auto mt-8 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <HardDrive size={40} className="text-purple-600 mb-4" />
          <div className="flex justify-between mb-2 text-sm">
            <span>Used</span>
            <span>{usedPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-blue-600 h-4 rounded-full transition-all" style={{ width: `${usedPercent}%` }} />
          </div>
          <p className="mt-4 text-gray-500 text-sm">
            {formatBytes(usedBytes)} of {formatBytes(QUOTA_BYTES)} used · {count} memories stored
          </p>
        </div>
      </div>
    </div>
  );
}
