"use client";

import { useState } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { loginUser, establishSession } from "@/lib/apiClient";

// Avoids next/navigation's useSearchParams(), which requires a Suspense
// boundary — this page is a fully client component with no need for one.
function getRedirectTarget() {
  if (typeof window === "undefined") return "/dashboard";
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  return redirect && redirect.startsWith("/") ? redirect : "/dashboard";
}

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [googleLoading, setGoogleLoading] = useState(false);

  const [screen, setScreen] = useState("login");

  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // -------------------------
  // Demo mode: any non-empty password logs you in.
  // If this email was registered before, we greet them by their real name;
  // otherwise we just use the part before @ as a friendly name.
  // -------------------------
  const handleLogin = async () => {
    let newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    if (!password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const user = await loginUser(email.trim(), password);
      localStorage.setItem("userName", user.name || email.trim());
      localStorage.setItem("userEmail", user.email || email.trim());
      if (user.phone) localStorage.setItem("userPhone", user.phone);

      router.replace(getRedirectTarget());
    } catch (error) {
      setErrors({ email: error.message || "Invalid login credentials" });
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const name = user.displayName || "User";
      const email = user.email || "";
      await establishSession({ name, email });
      localStorage.setItem("userName", name);
      localStorage.setItem("userEmail", email);
      if (user.photoURL) localStorage.setItem("userPhoto", user.photoURL);
      router.replace(getRedirectTarget());
    } catch (err) {
      console.error(err);
      alert("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendResetOtp = () => {
    if (!forgotEmail.trim()) { alert("Please enter your email."); return; }
    alert(`OTP sent to ${forgotEmail}`);
    setScreen("forgotOtp");
  };

  const handleVerifyResetOtp = () => {
    if (!otp.trim()) { setOtpError("Please enter the OTP."); return; }
    if (otp.trim().length !== 6) { setOtpError("Enter the 6-digit OTP."); return; }
    setOtpError("");
    setScreen("forgotNewPassword");
  };

  const handleUpdatePassword = () => {
    if (!newPassword.trim()) { alert("Please enter a new password."); return; }
    if (newPassword.length < 6) { alert("Password must be at least 6 characters."); return; }
    if (!confirmPassword.trim()) { alert("Please confirm your password."); return; }
    if (newPassword !== confirmPassword) { alert("Passwords do not match."); return; }

    // update the stored demo user's password, if they exist
    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    const updated = users.map((u) =>
      u.email.toLowerCase() === forgotEmail.trim().toLowerCase() ? { ...u, password: newPassword } : u
    );
    localStorage.setItem("registeredUsers", JSON.stringify(updated));

    alert("Password updated successfully!");

    setForgotEmail(""); setOtp(""); setNewPassword(""); setConfirmPassword("");
    setScreen("login");
  };

  return (
    <div className="min-h-screen flex">

      <div className="w-1/2 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white flex flex-col justify-center items-center p-12">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-indigo-600 text-4xl font-bold shadow-lg">LL</div>
        <h1 className="text-5xl font-bold mt-8">Life Lens AI</h1>
        <h2 className="text-2xl font-semibold mt-6">Welcome Back!</h2>
        <p className="text-center mt-4 max-w-md text-lg leading-8">
          Organize your memories, important documents, photos, and life events in one intelligent timeline.
        </p>
      </div>

      <div className="w-1/2 flex justify-center items-center bg-gray-100">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-[420px]">

          {screen === "login" && (
            <>
              <h2 className="text-3xl font-bold text-center mb-8">Login</h2>

              <label className="font-medium">Email Address<span className="text-red-500"> *</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full border rounded-lg p-3 mt-2" />
              {errors.email && <p className="text-red-500 text-sm mt-1 mb-3">{errors.email}</p>}

              <label className="font-medium mt-4 block">Password<span className="text-red-500"> *</span></label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full border rounded-lg p-3 mt-2 pr-11" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-gray-500 hover:text-gray-700" tabIndex={-1}>
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1 mb-3">{errors.password}</p>}

              <p onClick={() => setScreen("forgotEmail")} className="text-right text-blue-600 text-sm cursor-pointer hover:underline mt-3 mb-6">
                Forgot Password?
              </p>

              <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-300">
                Login
              </button>

              <div className="flex items-center my-6">
                <hr className="flex-1 border-gray-300" />
                <span className="mx-3 text-gray-500 text-sm">OR</span>
                <hr className="flex-1 border-gray-300" />
              </div>

              <button onClick={handleGoogleLogin} disabled={googleLoading} className="w-full border border-gray-300 py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition duration-300 disabled:opacity-60">
                <FcGoogle size={24} />
                {googleLoading ? "Opening Google..." : "Continue with Google"}
              </button>

              <p className="text-center mt-6 text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-blue-600 font-semibold hover:underline">Register</Link>
              </p>
            </>
          )}

          {screen === "forgotEmail" && (
            <>
              <h2 className="text-3xl font-bold text-center mb-8">Forgot Password</h2>

              <label className="font-medium">Registered Email<span className="text-red-500"> *</span></label>
              <input
                type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full border rounded-lg p-3 mt-2 mb-6"
              />

              <button onClick={handleSendResetOtp} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                Send OTP
              </button>
              <button onClick={() => setScreen("login")} className="w-full border mt-4 py-3 rounded-lg">
                Back to Login
              </button>
            </>
          )}

          {screen === "forgotOtp" && (
            <>
              <h2 className="text-3xl font-bold text-center mb-8">Email Verification</h2>
              <p className="text-gray-500 text-center mb-6">
                Enter the OTP sent to<br /><span className="font-semibold">{forgotEmail}</span>
              </p>

              <label className="font-medium">OTP<span className="text-red-500"> *</span></label>
              <input
                type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full border rounded-lg p-3 mt-2 mb-2 tracking-widest text-center"
              />
              {otpError && <p className="text-red-500 text-sm mb-4">{otpError}</p>}

              <button onClick={handleVerifyResetOtp} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                Verify OTP
              </button>
              <button onClick={() => { setScreen("forgotEmail"); setOtpError(""); }} className="w-full border mt-4 py-3 rounded-lg">
                Back
              </button>
            </>
          )}

          {screen === "forgotNewPassword" && (
            <>
              <h2 className="text-3xl font-bold text-center mb-8">Reset Password</h2>

              <label className="font-medium">New Password<span className="text-red-500"> *</span></label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full border rounded-lg p-3 mt-2 mb-5 pr-11"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-gray-500 hover:text-gray-700" tabIndex={-1}>
                  {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>

              <label className="font-medium">Confirm Password<span className="text-red-500"> *</span></label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full border rounded-lg p-3 mt-2 pr-11"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-gray-500 hover:text-gray-700" tabIndex={-1}>
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-sm mt-2">Passwords do not match.</p>
              )}

              <button onClick={handleUpdatePassword} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold mt-6">
                Update Password
              </button>
              <button onClick={() => setScreen("login")} className="w-full border py-3 rounded-lg mt-4">
                Back to Login
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
