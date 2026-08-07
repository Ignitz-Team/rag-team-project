"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, CircleUserRound, Camera, X, ChevronRight, LogOut, Trash2,
  UserCircle, ShieldCheck, HardDrive, Lock, Bell, HelpCircle, Info,
  Home, Clock3, Search, MessageCircle, User,
} from "lucide-react";
import { deleteUser } from "firebase/auth";
import { auth } from "@/lib/firebase";

const ALL_LOCAL_KEYS = [
  "memories", "reminders", "notificationHistory", "searchHistory",
  "searchPageHistory", "chatKnowledge", "summaryYearOrder",
  "privacySettings", "notificationSettings",
  "userName", "userEmail", "userPhoto", "userPhone", "userDob",
  "userLocation", "userJoinedDate", "registeredUsers",
];

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoSaved, setPhotoSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem("userName") || "User");
    setEmail(localStorage.getItem("userEmail") || "");
    setPhoto(localStorage.getItem("userPhoto") || "");
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        localStorage.setItem("userPhoto", reader.result);
        setPhoto(reader.result);
        setPhotoSaved(true);
        setTimeout(() => setPhotoSaved(false), 2000);
      } catch (err) {
        alert("This image is too large to save. Please try a smaller photo.");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    localStorage.removeItem("userPhoto");
    setPhoto("");
  };

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhoto");
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // remove the real Firebase account (email/password or Google-linked user)
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
    } catch (err) {
      console.error(err);
      // If Firebase requires a recent login to delete for security reasons,
      // we still proceed to wipe local data and send them to register fresh.
      if (err.code === "auth/requires-recent-login") {
        alert("For security, please log in again before deleting your account. Wiping local data now — please log in once more if your account still exists.");
      }
    }

    // wipe every local trace of this app's data
    ALL_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));

    setDeleting(false);
    router.push("/login");
  };

  const menuItems = [
    { href: "/personal-info", label: "Personal Information", icon: UserCircle },
    { href: "/security", label: "Security", icon: ShieldCheck },
    { href: "/storage-usage", label: "Storage Usage", icon: HardDrive },
    { href: "/privacy-settings", label: "Privacy Settings", icon: Lock },
    { href: "/notification-settings", label: "Notification Settings", icon: Bell },
    { href: "/help-support", label: "Help and Support", icon: HelpCircle },
    { href: "/about-app", label: "About App", icon: Info },
  ];

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
        <h1 className="text-2xl font-bold">Profile</h1>
      </header>

      <div className="max-w-md mx-auto mt-8 px-6">

        <div className="bg-white rounded-3xl shadow-xl p-8 text-center mb-6">
          <div className="relative w-24 h-24 mx-auto">
            {photo ? (
              <img src={photo} alt="profile" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <CircleUserRound size={96} className="text-blue-600" />
            )}
            {photo ? (
              <button type="button" onClick={handleRemovePhoto} className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700" title="Remove photo">
                <X size={14} />
              </button>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700" title="Add photo">
                <Camera size={14} />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
          </div>
          {photoSaved && <p className="text-green-600 text-xs mt-2">Photo updated ✓</p>}
          <h2 className="text-2xl font-bold mt-4">{name}</h2>
          <p className="text-gray-500">{email}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          {menuItems.map(({ href, label, icon: Icon }, i) => (
            <Link key={href} href={href}>
              <div className={`flex justify-between items-center px-5 py-4 hover:bg-gray-50 ${i !== menuItems.length - 1 ? "border-b" : ""}`}>
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-gray-500" />
                  <span className="font-medium">{label}</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>

        <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold mb-3">
          <LogOut size={18} /> Log out
        </button>

        <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-center gap-2 border border-red-600 text-red-600 hover:bg-red-50 py-3 rounded-xl font-semibold">
          <Trash2 size={18} /> Delete My Account
        </button>

      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-2">Log out?</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 border py-3 rounded-xl font-semibold">Cancel</button>
              <button onClick={handleLogout} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold">OK</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold text-red-600 mb-2">Delete Account?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This permanently deletes all your memories, chat history, search history, and notifications. This cannot be undone. Are you sure you want to delete your account?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 border py-3 rounded-xl font-semibold disabled:opacity-60">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60">
                {deleting ? "Deleting..." : "OK, Delete"}
              </button>
            </div>
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