"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopIcons from "@/components/TopIcons";
import {
  Menu, Upload, Images, CalendarPlus,
  Home, Clock3, Search, MessageCircle, User, X,
} from "lucide-react";
import { getMemories, getAllMemoriesRaw } from "@/lib/memoryStore";

function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const pathname = usePathname();

  const [activeMemories, setActiveMemories] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [reminders, setReminders] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [notifStatus, setNotifStatus] = useState("default");

  const refreshMemories = async () => {
    const active = await getMemories(false);
    setActiveMemories(active || []);

    const all = await getAllMemoriesRaw();
    const list = Array.isArray(all) ? all : [];
    const activity = list
      .slice()
      .sort((a, b) => {
        const ad = safeDate(a.deletedAt || a.createdAt || a.date);
        const bd = safeDate(b.deletedAt || b.createdAt || b.date);
        return (bd ? bd.getTime() : 0) - (ad ? ad.getTime() : 0);
      })
      .slice(0, 3);
    setRecentActivity(activity);
  };

  useEffect(() => {
    const name = localStorage.getItem("userName");
    Promise.resolve().then(() => {
      if (name) setUserName(name);
      setReminders(JSON.parse(localStorage.getItem("reminders") || "[]"));
      if (typeof window !== "undefined" && "Notification" in window) {
        setNotifStatus(Notification.permission);
      }
      return refreshMemories();
    });
  }, []);

  const handleAddReminder = async () => {
    if (!reminderTitle.trim() || !reminderTime) {
      alert("Please enter a title and pick a date/time.");
      return;
    }
    if (new Date(reminderTime).getTime() <= Date.now()) {
      alert("Please pick a future date/time.");
      return;
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        setNotifStatus(result);
      } else {
        setNotifStatus(Notification.permission);
      }
      if (Notification.permission === "denied") {
        alert("Notifications are blocked for this site. The reminder is saved, but you won't get a popup unless you allow notifications in your browser's site settings.");
      }
    }

    const newReminder = { id: Date.now(), title: reminderTitle, time: reminderTime, notified: false };
    const updated = [...reminders, newReminder].sort((a, b) => new Date(a.time) - new Date(b.time));

    setReminders(updated);
    localStorage.setItem("reminders", JSON.stringify(updated));

    setReminderTitle("");
    setReminderTime("");
    setShowReminderModal(false);
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/timeline", label: "Timeline", icon: Clock3 },
    { href: "/search", label: "Search", icon: Search },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-24">

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <header className="bg-white shadow-md px-8 py-5 flex justify-between items-center">
        <button onClick={() => setIsOpen(true)}>
          <Menu size={30} />
        </button>
        <TopIcons />
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">

        <h1 className="text-4xl font-bold mb-8">Welcome, {userName || "User"} 👋</h1>

        <div className="grid lg:grid-cols-2 gap-8">

          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-3xl p-8 shadow-xl">
            <div className="flex justify-between">
              <div>
                <h2 className="text-3xl font-bold">Upload Memory</h2>
                <p className="mt-3 text-blue-100">
                  Upload documents, photos and memories to build your AI timeline.
                </p>
                <Link href="/upload">
                  <button className="mt-8 bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:scale-105 transition">
                    Upload Now
                  </button>
                </Link>
              </div>
              <div className="bg-white/20 rounded-full w-24 h-24 flex items-center justify-center">
                <Upload size={48} />
              </div>
            </div>
          </div>

          <Link href="/summary">
            <div className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition cursor-pointer">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Total Memories</h2>
                  <h1 className="text-6xl font-bold text-blue-600 mt-6">{activeMemories.length}</h1>
                  <p className="text-blue-600 mt-3 text-sm font-medium">View full summary →</p>
                </div>
                <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center">
                  <Images size={40} className="text-blue-600" />
                </div>
              </div>
            </div>
          </Link>

        </div>

        <div className="mt-8">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Recent Activity</h2>
              <Link href="/uploads">
                <button className="text-blue-600 font-semibold hover:underline">View All</button>
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-gray-400 text-center py-6">
                  No uploads yet. Tap &quot;Upload Now&quot; to add your first memory.
                </p>
              ) : (
                recentActivity.map((item) => {
                  const displayDate = safeDate(item.deletedAt) || safeDate(item.date) || safeDate(item.createdAt);
                  return (
                    <div key={item.id} className="flex justify-between border rounded-xl p-3">
                      <span className={item.deleted ? "line-through text-gray-400" : ""}>
                        {item.fileType?.startsWith("image/") ? "🖼" : item.fileType?.startsWith("video/") ? "🎬" : "📄"} {item.title}
                        {item.deleted && (
                          <span className="ml-2 text-xs font-semibold text-red-500 no-underline">(Deleted)</span>
                        )}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {displayDate ? displayDate.toLocaleDateString() : "Unknown date"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 mt-8">
          <div className="flex justify-between">
            <h2 className="text-2xl font-bold">Upcoming Reminders</h2>
            <button onClick={() => setShowReminderModal(true)} className="bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-700">
              <CalendarPlus size={20} />
            </button>
          </div>

          {notifStatus === "denied" && (
            <p className="text-red-500 text-xs mt-3">
              Notifications are blocked for this site. Enable them in your browser&apos;s site settings to get alerts.
            </p>
          )}

          <div className="mt-6 space-y-4">
            {reminders.filter((r) => new Date(r.time) > new Date()).length === 0 ? (
              <p className="text-gray-400 text-center py-4">No reminders set. Tap + to add one.</p>
            ) : (
              reminders
                .filter((r) => new Date(r.time) > new Date())
                .map((r) => (
                  <div key={r.id} className="border rounded-xl p-4 flex justify-between">
                    <span>🔔 {r.title}</span>
                    <span className="text-gray-500 text-sm">{new Date(r.time).toLocaleString()}</span>
                  </div>
                ))
            )}
          </div>
        </div>

      </main>

      {showReminderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Reminder</h3>
              <button onClick={() => setShowReminderModal(false)}><X size={22} /></button>
            </div>

            <label className="font-medium text-sm">Title</label>
            <input
              type="text"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              placeholder="e.g. Mom's Birthday"
              className="w-full border rounded-lg p-3 mt-1 mb-4"
            />

            <label className="font-medium text-sm">Date & Time</label>
            <input
              type="datetime-local"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full border rounded-lg p-3 mt-1 mb-6"
            />

            <button onClick={handleAddReminder} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
              Save Reminder
            </button>
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
