"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CircleUserRound } from "lucide-react";

export default function TopIcons() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    const history = JSON.parse(localStorage.getItem("notificationHistory") || "[]");
    setUnreadCount(history.filter((n) => !n.read).length);
    setPhoto(localStorage.getItem("userPhoto") || "");
  };

  return (
    <div className="flex items-center gap-6">
      <Link href="/notifications" className="relative">
        <Bell size={24} className="cursor-pointer hover:text-blue-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
      <Link href="/profile">
        {photo ? (
          <img src={photo} alt="profile" className="w-8 h-8 rounded-full object-cover cursor-pointer" />
        ) : (
          <CircleUserRound size={32} className="cursor-pointer hover:text-blue-600" />
        )}
      </Link>
    </div>
  );
}