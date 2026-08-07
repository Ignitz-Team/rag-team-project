"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, CircleUserRound, Pencil } from "lucide-react";

export default function PersonalInfoPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [photo, setPhoto] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [joinedDate, setJoinedDate] = useState("");

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false); // stays true until back arrow is clicked

  useEffect(() => {
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
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }

    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem("userPhoto", reader.result);
      setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = () => {
    if (!name.trim()) { alert("Name is required."); return; }

    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPhone", phone);
    localStorage.setItem("userDob", dob);
    localStorage.setItem("userLocation", location);

    setEditing(false);
    setSaved(true); // no auto-hide — stays until user leaves via back arrow
  };

  const handleBack = () => {
    setSaved(false);
    router.push("/profile");
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-10">

      <header className="bg-white shadow-md px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button onClick={handleBack}><ArrowLeft className="cursor-pointer hover:text-blue-600" /></button>
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

          <div className="relative w-24 h-24 mx-auto mb-2">
            {photo ? (
              <img src={photo} alt="profile" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <CircleUserRound size={96} className="text-blue-600" />
            )}
            {editing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700"
              >
                <Camera size={14} />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
          </div>
          {editing && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="block mx-auto text-blue-600 text-sm font-medium mb-6 hover:underline"
            >
              Browse Photo
            </button>
          )}

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

          {saved && <p className="text-green-600 text-center text-sm">Saved successfully ✓</p>}

        </div>
      </div>
    </div>
  );
}