"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, CircleUserRound, Camera, ChevronRight, LogOut,
  UserCircle, ShieldCheck, HardDrive, Lock, Bell, HelpCircle, Info,
  Home, Clock3, Search, MessageCircle, User,
} from "lucide-react";
import { logoutUser } from "@/lib/apiClient";

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoSaved, setPhotoSaved] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      const name = localStorage.getItem("userName") || "User";
      setName(name);
      setEmail(localStorage.getItem("userEmail") || "");
      const raw = localStorage.getItem("userPhoto") || "";
      const isValid = typeof raw === "string" && (raw.startsWith("data:") || raw.startsWith("http://") || raw.startsWith("https://"));
      setPhoto(isValid ? raw : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D90FF&color=fff&rounded=true&size=256`);
    });
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        localStorage.setItem("userPhoto", reader.result);
        setPhoto(reader.result);
        setPhotoSaved(true);
        setTimeout(() => setPhotoSaved(false), 2000);
      } catch (err) {
        console.error(err);
        alert("This image is too large to save. Please try a smaller photo.");
      }
    };
    reader.onerror = () => {
      alert("Couldn't read that file. Please try another image.");
    };
    reader.readAsDataURL(file);

    // reset so selecting the SAME file again still fires onChange next time
    e.target.value = "";
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhoto");
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
            <img
              src={photo || null}
              alt="profile"
              className="w-24 h-24 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                const name = localStorage.getItem("userName") || "User";
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D90FF&color=fff&rounded=true&size=256`;
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />
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

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold"
        >
          <LogOut size={18} /> Log out
        </button>

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
