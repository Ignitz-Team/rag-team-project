"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  RecaptchaVerifier,
  linkWithPhoneNumber,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Register() {
  const router = useRouter();
  const recaptchaRef = useRef(null);
  const confirmationResultRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // expects full format e.g. +919876543210
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});

  // screen: "form" -> "checkEmail" -> "phoneEntry" -> "phoneOtp" -> done
  const [screen, setScreen] = useState("form");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const validateForm = () => {
    let newErrors = {};

    if (!fullName.trim()) newErrors.fullName = "Full name is required";

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Enter a valid email address";

    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (!confirmPassword.trim()) newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (!agreed) newErrors.agreed = "You must agree to the Terms & Conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: create the real Firebase account + send a real verification email
  const handleFormSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      setLoading(false);
      setScreen("checkEmail");
    } catch (err) {
      console.error(err);
      setLoading(false);
      if (err.code === "auth/email-already-in-use") {
        setErrors({ email: "This email is already registered. Please login instead." });
      } else if (err.code === "auth/weak-password") {
        setErrors({ password: "Password is too weak." });
      } else {
        setErrors({ email: "Something went wrong. Please try again." });
      }
    }
  };

  // Step 2: user has clicked the link in their inbox — reload to pick up emailVerified status
  const checkEmailVerified = async () => {
    setLoading(true);
    await auth.currentUser?.reload();
    setLoading(false);

    if (auth.currentUser?.emailVerified) {
      setScreen("phoneEntry");
    } else {
      alert("Email not verified yet. Please click the link we sent to your inbox first.");
    }
  };

  const resendVerificationEmail = async () => {
    if (resendCooldown > 0) return;
    try {
      await sendEmailVerification(auth.currentUser);
      alert("Verification email resent.");
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      alert("Couldn't resend right now. Please wait a moment and try again.");
    }
  };

  // Step 3: set up invisible reCAPTCHA and send a real SMS OTP
  const sendPhoneOtp = async () => {
    if (!phone.trim() || !phone.startsWith("+")) {
      alert("Please enter your phone number in international format, e.g. +919876543210");
      return;
    }

    setLoading(true);
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }

      const confirmationResult = await linkWithPhoneNumber(auth.currentUser, phone, recaptchaRef.current);
      confirmationResultRef.current = confirmationResult;
      setLoading(false);
      setScreen("phoneOtp");
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Couldn't send OTP. Check the phone number format and try again.");
    }
  };

  // Step 4: verify the real OTP the user received via SMS
  const verifyPhoneOtp = async () => {
    if (!phoneOtp.trim() || phoneOtp.trim().length !== 6) {
      setOtpError("Enter the 6-digit OTP sent to your phone.");
      return;
    }

    setLoading(true);
    try {
      await confirmationResultRef.current.confirm(phoneOtp.trim());

      localStorage.setItem("userName", fullName);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userPhone", phone);

      setLoading(false);
      alert(`Welcome, ${fullName}! Your account is fully verified.`);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setLoading(false);
      setOtpError("Incorrect OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex">

      <div className="w-1/2 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white flex flex-col justify-center items-center p-12">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-indigo-600 text-4xl font-bold shadow-lg">LL</div>
        <h1 className="text-5xl font-bold mt-8">Life Lens AI</h1>
        <h2 className="text-2xl font-semibold mt-6">Create New Account</h2>
        <p className="text-center mt-4 max-w-md text-lg leading-8">
          Start your journey with Life Lens AI and organize your memories in one intelligent timeline.
        </p>
      </div>

      <div className="w-1/2 flex justify-center items-center bg-gray-100">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-[450px]">

          {screen === "form" && (
            <>
              <h2 className="text-3xl font-bold text-center mb-8">Register</h2>

              <label className="font-medium">Full Name<span className="text-red-500"> *</span></label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full border border-gray-300 p-3 rounded-lg mt-2" />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}

              <label className="font-medium mt-4 block">Email Address<span className="text-red-500"> *</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full border border-gray-300 p-3 rounded-lg mt-2" />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}

              <label className="font-medium mt-4 block">Password<span className="text-red-500"> *</span></label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full border border-gray-300 p-3 rounded-lg mt-2 pr-11" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-gray-500 hover:text-gray-700" tabIndex={-1}>
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}

              <label className="font-medium mt-4 block">Confirm Password<span className="text-red-500"> *</span></label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full border border-gray-300 p-3 rounded-lg mt-2 pr-11" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-gray-500 hover:text-gray-700" tabIndex={-1}>
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}

              <label className="flex items-center gap-2 mt-5 mb-1 text-sm">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                I agree to the Terms & Conditions<span className="text-red-500">*</span>
              </label>
              {errors.agreed && <p className="text-red-500 text-sm mb-3">{errors.agreed}</p>}

              <button onClick={handleFormSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold mt-5 disabled:opacity-60">
                {loading ? "Creating account..." : "Register"}
              </button>

              <p className="text-center mt-6 text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 font-semibold hover:underline">Login</Link>
              </p>
            </>
          )}

          {screen === "checkEmail" && (
            <>
              <h2 className="text-3xl font-bold text-center mb-4">Check Your Email</h2>
              <p className="text-gray-500 text-center mb-6">
                We sent a real verification link to<br /><span className="font-semibold">{email}</span>.
                Click it, then come back and tap the button below.
              </p>

              <button onClick={checkEmailVerified} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-60">
                {loading ? "Checking..." : "I've verified my email"}
              </button>

              <button
                onClick={resendVerificationEmail}
                disabled={resendCooldown > 0}
                className="w-full border py-3 rounded-lg font-semibold mt-4 disabled:opacity-60"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
              </button>
            </>
          )}

          {screen === "phoneEntry" && (
            <>
              <h2 className="text-3xl font-bold text-center mb-2">Verify Your Phone</h2>
              <p className="text-gray-500 text-center mb-6">Email verified ✓ — now let's verify your phone number.</p>

              <label className="font-medium">Phone Number<span className="text-red-500"> *</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full border border-gray-300 p-3 rounded-lg mt-2 mb-2"
              />
              <p className="text-xs text-gray-400 mb-4">Include country code, e.g. +91 for India</p>

              <div id="recaptcha-container"></div>

              <button onClick={sendPhoneOtp} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-60">
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          )}

          {screen === "phoneOtp" && (
            <>
              <h2 className="text-3xl font-bold text-center mb-4">Enter OTP</h2>
              <p className="text-gray-500 text-center mb-6">
                Enter the 6-digit code sent via SMS to<br /><span className="font-semibold">{phone}</span>
              </p>

              <input
                type="text" maxLength={6} value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full border border-gray-300 p-3 rounded-lg mb-2 tracking-widest text-center"
              />
              {otpError && <p className="text-red-500 text-sm mb-3">{otpError}</p>}

              <button onClick={verifyPhoneOtp} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-60">
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>
              <button onClick={() => setScreen("phoneEntry")} className="w-full border py-3 rounded-lg font-semibold mt-4">
                Change Number
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}