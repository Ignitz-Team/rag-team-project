"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function SecurityPage() {
  const [screen, setScreen] = useState("home");

  const [email, setEmail] = useState(typeof window !== "undefined" ? localStorage.getItem("userEmail") || "" : "");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const sendOtp = () => {
    if (!email.trim()) { alert("Please enter your email."); return; }
    alert(`OTP sent to ${email}`);
    setScreen("otp");
  };

  const verifyOtp = () => {
    if (!otp.trim()) { setOtpError("Please enter the OTP."); return; }
    if (otp.trim().length !== 6) { setOtpError("Enter the 6-digit OTP."); return; }
    setOtpError("");
    setScreen("setPassword");
  };

  const updatePassword = () => {
    if (!newPassword.trim() || newPassword.length < 6) { alert("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { alert("Passwords do not match."); return; }

    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    const updated = users.map((u) =>
      u.email.toLowerCase() === email.trim().toLowerCase() ? { ...u, password: newPassword } : u
    );
    localStorage.setItem("registeredUsers", JSON.stringify(updated));

    alert("Password changed successfully!");
    setOtp(""); setNewPassword(""); setConfirmPassword("");
    setScreen("home");
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <header className="bg-white shadow-md px-8 py-5 flex items-center gap-5">
        <Link href="/profile"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
        <h1 className="text-2xl font-bold">Security</h1>
      </header>

      <div className="max-w-lg mx-auto mt-8 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">

          {screen === "home" && (
            <>
              <ShieldCheck size={40} className="text-blue-600 mb-4" />
              <p className="text-gray-600 mb-6">Manage your account security here.</p>
              <button
                onClick={() => setScreen("verifyEmail")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
              >
                Change Password
              </button>
            </>
          )}

          {screen === "verifyEmail" && (
            <>
              <h2 className="text-xl font-bold mb-4">Verify Your Email</h2>
              <label className="text-sm font-medium">Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-xl p-3 mt-1 mb-6"
              />
              <button onClick={sendOtp} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">
                Send OTP
              </button>
              <button onClick={() => setScreen("home")} className="w-full border py-3 rounded-xl font-semibold mt-3">
                Cancel
              </button>
            </>
          )}

          {screen === "otp" && (
            <>
              <h2 className="text-xl font-bold mb-2">Enter OTP</h2>
              <p className="text-gray-500 text-sm mb-4">Sent to {email}</p>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                className="w-full border rounded-xl p-3 mb-2 text-center tracking-widest"
              />
              {otpError && <p className="text-red-500 text-sm mb-4">{otpError}</p>}
              <button onClick={verifyOtp} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">
                Verify OTP
              </button>
              <button onClick={() => setScreen("verifyEmail")} className="w-full border py-3 rounded-xl font-semibold mt-3">
                Back
              </button>
            </>
          )}

          {screen === "setPassword" && (
            <>
              <h2 className="text-xl font-bold mb-4">Set New Password</h2>

              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-xl p-3 mt-1 mb-4 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>

              <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border rounded-xl p-3 mt-1 mb-6 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>

              <button onClick={updatePassword} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">
                Update Password
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}