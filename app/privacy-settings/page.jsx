"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacySettingsPage() {
  const [profileVisible, setProfileVisible] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("privacySettings") || "null");
    if (stored) {
      setProfileVisible(stored.profileVisible);
      setDataSharing(stored.dataSharing);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("privacySettings", JSON.stringify({ profileVisible, dataSharing }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <header className="bg-white shadow-md px-8 py-5 flex items-center gap-5">
        <Link href="/profile"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
        <h1 className="text-2xl font-bold">Privacy Settings</h1>
      </header>
      <div className="max-w-lg mx-auto mt-8 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <Lock size={40} className="text-blue-600 mb-6" />

          <div className="flex justify-between items-center mb-6">
            <span className="font-medium">Make profile visible</span>
            <input type="checkbox" checked={profileVisible} onChange={(e) => setProfileVisible(e.target.checked)} className="w-5 h-5" />
          </div>

          <div className="flex justify-between items-center mb-8">
            <span className="font-medium">Allow anonymous data sharing</span>
            <input type="checkbox" checked={dataSharing} onChange={(e) => setDataSharing(e.target.checked)} className="w-5 h-5" />
          </div>

          <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">
            {saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}