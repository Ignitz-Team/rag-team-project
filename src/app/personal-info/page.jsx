"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, CircleUserRound, Pencil, X } from "lucide-react";

export default function PersonalInfoPage() {
  const fileInputRef = useRef(null);

  const [photo, setPhoto] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [joinedDate, setJoinedDate] = useState("");

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    Promise.resolve().then(() => {
      setPhoto(localStorage.getItem("userPhoto") || "");
      setName(localStorage.getItem("userName") || "");
      setEmail(localStorage.getItem("userEmail") || "");
      setPhone(localStorage.getItem("userPhone") || "");
      setDob(localStorage.getItem("userDob") || "");
      setLocation(localStorage.getItem("userLocation") || "");
      let joined = localStorage.getItem("userJoinedDate");
      if (!joined) {
        joined = new Date().toISOString().split("T")[0];
        localStorage.setItem("userJoinedDate", joined);
      }
      setJoinedDate(joined);
    });
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem("userPhoto", reader.result);
      setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) { alert("Name is required."); return; }

    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPhone", phone);
    localStorage.setItem("userDob", dob);
    localStorage.setItem("userLocation", location);

    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleChangePassword = () => {
    if (!newPassword.trim() || newPassword.length < 6) { alert("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { alert("Passwords do not match."); return; }

    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    const updated = users.map((u) =>
      u.email.toLowerCase() === email.toLowerCase() ? { ...u, password: newPassword } : u
    );
    localStorage.setItem("registeredUsers", JSON.stringify(updated));

    alert("Password changed successfully!");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-10">

      <header className="bg-white shadow-md px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/profile"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
          <h1 className="text-2xl font-bold">Personal Info</h1>
        </div>
        <button
          onClick={() => (editing ? handleSave() : setEditing(true))}
          className="flex items-center gap-1 text-blue-600 font-medium text-sm"
        >
          <Pencil size={16} /> {editing ? "Save" : "Edit"}
        </button>
      </header>

      <div className="max-w-lg mx-auto mt-8 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">

          <div className="relative w-24 h-24 mx-auto mb-6">
            {photo ? (
              <img src={photo} alt="profile" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <CircleUserRound size={96} className="text-blue-600" />
            )}
            {editing && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg"
                >
                  <Camera size={14} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </>
            )}
          </div>

          <label className="block font-semibold mb-2">Full Name</label>
          <input disabled={!editing} value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-xl p-3 mb-5 disabled:bg-gray-50 disabled:text-gray-500" />

          <label className="block font-semibold mb-2">Email Address</label>
          <input disabled={!editing} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-xl p-3 mb-5 disabled:bg-gray-50 disabled:text-gray-500" />

          <label className="block font-semibold mb-2">Phone Number</label>
          <input disabled={!editing} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-xl p-3 mb-5 disabled:bg-gray-50 disabled:text-gray-500" />

          <label className="block font-semibold mb-2">Date of Birth</label>
          <input disabled={!editing} type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full border rounded-xl p-3 mb-5 disabled:bg-gray-50 disabled:text-gray-500" />

          <label className="block font-semibold mb-2">Location</label>
          <input disabled={!editing} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="w-full border rounded-xl p-3 mb-5 disabled:bg-gray-50 disabled:text-gray-500" />

          <label className="block font-semibold mb-2">Joined</label>
          <input disabled value={new Date(joinedDate).toLocaleDateString()} className="w-full border rounded-xl p-3 mb-6 bg-gray-50 text-gray-500" />

          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full border border-blue-600 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50"
          >
            Change Password
          </button>

          {saved && <p className="text-green-600 text-center text-sm mt-4">Saved successfully ✓</p>}

        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
            </div>

            <label className="text-sm font-medium">New Password</label>
            <input
              type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded-xl p-3 mt-1 mb-4"
            />

            <label className="text-sm font-medium">Confirm Password</label>
            <input
              type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-xl p-3 mt-1 mb-6"
            />

            <button onClick={handleChangePassword} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">
              Update Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
