"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Upload, Clock3, Search, MessageCircle, FileText,
  User, LogOut, X, HardDrive,
} from "lucide-react";
import { getMemories, getTotalStorageBytes } from "@/lib/memoryStore";

const QUOTA_BYTES = 5 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Sidebar({ isOpen, setIsOpen }) {
  const router = useRouter();
  const [usedBytes, setUsedBytes] = useState(0);
  const [count, setCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhoto");
    setShowLogoutConfirm(false);
    router.push("/login");
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setIsOpen(false)} />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-5 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Life Lens AI</h1>
          <button onClick={() => setIsOpen(false)}>
            <X size={26} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col p-5 gap-3 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition">
            <LayoutDashboard size={22} />
            Dashboard
          </Link>
          <Link href="/upload" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition">
            <Upload size={22} />
            Upload
          </Link>
          <Link href="/timeline" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition">
            <Clock3 size={22} />
            Timeline
          </Link>
          <Link href="/search" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition">
            <Search size={22} />
            Search
          </Link>
          <Link href="/chat" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition">
            <MessageCircle size={22} />
            Chat
          </Link>
          <Link href="/summary" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition">
            <FileText size={22} />
            Summary
          </Link>
          <Link href="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition">
            <User size={22} />
            Profile
          </Link>

          <hr className="my-3" />

          {/* Was a <Link> before — now a button that opens a confirm modal instead of navigating directly */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-100 transition text-left w-full"
          >
            <LogOut size={22} />
            Logout
          </button>
        </nav>

        <div className="border-t p-5 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <HardDrive size={20} className="text-purple-600" />
              <span className="font-semibold">Storage</span>
            </div>
            <span className="text-blue-600 font-semibold">{usedPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${usedPercent}%` }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{formatBytes(usedBytes)} Used</span>
            <span>{formatBytes(QUOTA_BYTES)} Total</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{count} memories stored</p>
        </div>
      </div>

      {/* Confirm popup — appears above the sidebar/overlay via z-[60] */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-2">Log out?</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border py-3 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}