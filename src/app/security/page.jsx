"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SecurityPage() {
  const [email] = useState(typeof window !== "undefined" ? localStorage.getItem("userEmail") || "" : "");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!email) { alert("No email found on this account."); return; }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      console.error(err);
      alert("Couldn't send reset email. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <header className="bg-white shadow-md px-8 py-5 flex items-center gap-5">
        <Link href="/profile"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
        <h1 className="text-2xl font-bold">Security</h1>
      </header>

      <div className="max-w-lg mx-auto mt-8 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">

          {!sent ? (
            <>
              <ShieldCheck size={40} className="text-blue-600 mb-4" />
              <p className="text-gray-600 mb-2">Manage your account security here.</p>
              <p className="text-gray-500 text-sm mb-6">
                We'll send a real password reset link to <span className="font-semibold">{email || "your email"}</span>.
              </p>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60"
              >
                {loading ? "Sending..." : "Change Password"}
              </button>
            </>
          ) : (
            <>
              <Mail size={40} className="text-green-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
              <p className="text-gray-600">
                A reset link was sent to <span className="font-semibold">{email}</span>. Click it to set a new password.
              </p>
              <button onClick={() => setSent(false)} className="w-full border py-3 rounded-xl font-semibold mt-6">
                Done
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}