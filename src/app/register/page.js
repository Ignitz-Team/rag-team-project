"use client";

import { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { registerUser, sendOtp, verifyOtp } from "@/lib/apiClient";

export default function Register() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});

  const [screen, setScreen] = useState("form");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [serverError, setServerError] = useState("");

  const validateForm = () => {
    let newErrors = {};

    if (!fullName.trim()) newErrors.fullName = "Full name is required";

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Enter a valid email address";

    if (!phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(phone.trim())) newErrors.phone = "Enter a valid 10-digit phone number";

    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (!confirmPassword.trim()) newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (!agreed) newErrors.agreed = "You must agree to the Terms & Conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    setOtpError("");
    setServerError("");

    try {
      await sendOtp(email.trim(), phone.trim());
      setScreen("otp");
    } catch (error) {
      setServerError(error.message || "Unable to send OTP. Please try again.");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setOtpError("Please enter the OTP sent to your email or phone."); return; }
    if (otp.trim().length !== 6) { setOtpError("Enter the 6-digit OTP."); return; }

    setOtpError("");
    setServerError("");

    try {
      await verifyOtp(email.trim(), otp.trim());
      await registerUser({
        name: fullName,
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      alert(`Welcome, ${fullName}! Your account has been created.`);
      router.push("/login");
    } catch (error) {
      setServerError(error.message || "OTP verification or registration failed.");
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

              <label className="font-medium mt-4 block">Phone Number<span className="text-red-500"> *</span></label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full border border-gray-300 p-3 rounded-lg mt-2" />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}

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
              {serverError && <p className="text-red-500 text-sm mb-3">{serverError}</p>}

              <button onClick={handleFormSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold mt-5">
                Register
              </button>

              <p className="text-center mt-6 text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 font-semibold hover:underline">Login</Link>
              </p>
            </>
          )}

{screen === "otp" && (
            <>
              <h2 className="text-3xl font-bold text-center mb-4">Verify OTP</h2>
              <p className="text-gray-500 text-center mb-6">
                Enter the verification code sent to your email and phone.
              </p>

              <label className="font-medium">OTP<span className="text-red-500"> *</span></label>
              <input
                type="text" maxLength={6} value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full border border-gray-300 p-3 rounded-lg mt-2 mb-2 tracking-widest text-center"
              />
              {otpError && <p className="text-red-500 text-sm mb-3">{otpError}</p>}
              {serverError && <p className="text-red-500 text-sm mb-3">{serverError}</p>}

              <button onClick={handleVerifyOtp} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold mt-4">
                Verify & Create Account
              </button>
              <button onClick={() => { setScreen("form"); setOtpError(""); setServerError(""); }} className="w-full border py-3 rounded-lg mt-4">
                Back
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}