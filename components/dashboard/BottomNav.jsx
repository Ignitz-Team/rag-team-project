"use client";

import Link from "next/link";
import { Home, Clock3, Search, MessageCircle, User } from "lucide-react";

export default function BottomNav({ active }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden z-50">

      <div className="flex justify-around items-center py-3">

        <Link
          href="/dashboard"
          className={`flex flex-col items-center ${
            active === "dashboard"
              ? "text-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          <Home size={22} />
          <span className="text-xs mt-1">Home</span>
        </Link>

        <Link
          href="/timeline"
          className={`flex flex-col items-center ${
            active === "timeline"
              ? "text-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          <Clock3 size={22} />
          <span className="text-xs mt-1">Timeline</span>
        </Link>

        <Link
          href="/search"
          className={`flex flex-col items-center ${
            active === "search"
              ? "text-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          <Search size={22} />
          <span className="text-xs mt-1">Search</span>
        </Link>

        <Link
          href="/chat"
          className={`flex flex-col items-center ${
            active === "chat"
              ? "text-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          <MessageCircle size={22} />
          <span className="text-xs mt-1">Chat</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center ${
            active === "profile"
              ? "text-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          <User size={22} />
          <span className="text-xs mt-1">Profile</span>
        </Link>

      </div>

    </div>
  );
}