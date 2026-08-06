"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Upload,
  Clock3,
  Search,
  MessageCircle,
  FileText,
  User,
  LogOut,
  X,
  HardDrive,
} from "lucide-react";
import { getMemories, getTotalStorageBytes } from "@/lib/memoryStore";

const QUOTA_BYTES = 5 * 1024 * 1024; // ~5MB realistic localStorage budget for demo

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Sidebar({ isOpen, setIsOpen }) {
  const [usedBytes, setUsedBytes] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setCount(getMemories(false).length);
      setUsedBytes(getTotalStorageBytes());
    };
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const usedPercent = Math.min(100, Math.round((usedBytes / QUOTA_BYTES) * 100));

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h1 className="text-2xl font-bold text-blue-600">
            Life Lens AI
          </h1>

          <button onClick={() => setIsOpen(false)}>
            <X size={26} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 flex flex-col p-5 gap-3 overflow-y-auto">

          <Link
            href="/dashboard"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition"
          >
            <LayoutDashboard size={22} />
            Dashboard
          </Link>

          <Link
            href="/upload"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition"
          >
            <Upload size={22} />
            Upload
          </Link>

          <Link
            href="/timeline"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition"
          >
            <Clock3 size={22} />
            Timeline
          </Link>

          <Link
            href="/search"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition"
          >
            <Search size={22} />
            Search
          </Link>

          <Link
            href="/chat"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition"
          >
            <MessageCircle size={22} />
            Chat
          </Link>

          <Link
            href="/summary"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition"
          >
            <FileText size={22} />
            Summary
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition"
          >
            <User size={22} />
            Profile
          </Link>

          <hr className="my-3" />

          <Link
            href="/login"
            className="flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-100 transition"
          >
            <LogOut size={22} />
            Logout
          </Link>

        </nav>

        {/* Storage — now reflects real uploaded data, synced with Profile > Storage Usage */}
        <div className="border-t p-5 bg-gray-50">

          <div className="flex justify-between items-center mb-3">

            <div className="flex items-center gap-2">

              <HardDrive
                size={20}
                className="text-purple-600"
              />

              <span className="font-semibold">
                Storage
              </span>

            </div>

            <span className="text-blue-600 font-semibold">
              {usedPercent}%
            </span>

          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">

            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${usedPercent}%` }}
            ></div>

          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-2">

            <span>{formatBytes(usedBytes)} Used</span>

            <span>{formatBytes(QUOTA_BYTES)} Total</span>

          </div>

          <p className="text-[10px] text-gray-400 mt-1">
            {count} memories stored
          </p>

        </div>

      </div>
    </>
  );
}