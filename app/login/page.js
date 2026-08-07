"use client";

import { useState } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // if login succeeds but email isn't verified, we hold the user here
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null);

  const [screen, setScreen] = useState("login"); // "login" | "forgotEmail" | "forgotSent"
  const [forgotEmail, setForgotEmail] = useState("");

  const handleLogin = async () => {
    let newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    if (!password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      if (!result.user.emailVerified) {
        setUnverifiedUser(result.user);
        setNeedsVerification(true);
        setLoading(false);
        return;
      }

      localStorage.setItem("userName", result.user.displayName || email.split("@")[0]);
      localStorage.setItem("userEmail", result.user.email || email);
      setLoading(false);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErrors({ password: "Invalid email or password" });
    }
  };

  const resendVerification = async () => {
    try {
      await sendEmailVerification(unverifiedUser);
      alert("Verification email resent — check your inbox.");
    } catch (err) {
      alert("Couldn't resend right now, please try again shortly.");
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      localStorage.setItem("userName", user.displayName || "User");
      localStorage.setItem("userEmail", user.email || "");
      if (user.photoURL) localStorage.setItem("userPhoto", user.photoURL);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!forgotEmail.trim()) { alert("Please enter your email."); return; }
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setScreen("forgotSent");
    } catch (err) {
      console.error(err);
      alert("Couldn't send reset email. Make sure the email is registered.");
    }
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

          {screen === "login" && !needsVerification && (
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

              <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-300 disabled:opacity-60">
                {loading ? "Logging in..." : "Login"}
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
                Don't have an account?{" "}
                <Link href="/register" className="text-blue-600 font-semibold hover:underline">Register</Link>
              </p>
            </>
          )}

          {needsVerification && (
            <>
              <h2 className="text-2xl font-bold text-center mb-4">Verify Your Email First</h2>
              <p className="text-gray-500 text-center mb-6">
                Your account exists, but <span className="font-semibold">{email}</span> hasn't been verified yet.
                Check your inbox for the verification link.
              </p>
              <button onClick={resendVerification} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold mb-3">
                Resend verification email
              </button>
              <button onClick={() => { setNeedsVerification(false); setUnverifiedUser(null); }} className="w-full border py-3 rounded-lg font-semibold">
                Back to Login
              </button>
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

              <button onClick={handleSendResetEmail} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                Send Reset Link
              </button>
              <button onClick={() => setScreen("login")} className="w-full border mt-4 py-3 rounded-lg">
                Back to Login
              </button>
            </>
          )}

          {screen === "forgotSent" && (
            <>
              <h2 className="text-2xl font-bold text-center mb-4">Check Your Email</h2>
              <p className="text-gray-500 text-center mb-6">
                A real password reset link has been sent to<br /><span className="font-semibold">{forgotEmail}</span>.
                Click it to set a new password, then come back and log in.
              </p>
              <button onClick={() => setScreen("login")} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
                Back to Login
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}