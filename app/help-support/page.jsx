"use client";
import Link from "next/link";
import { ArrowLeft, HelpCircle, Mail } from "lucide-react";

export default function HelpSupportPage() {
  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <header className="bg-white shadow-md px-8 py-5 flex items-center gap-5">
        <Link href="/profile"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
        <h1 className="text-2xl font-bold">Help and Support</h1>
      </header>
      <div className="max-w-lg mx-auto mt-8 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <HelpCircle size={40} className="text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">Need help? Reach out to our support team.</p>
          <a href="mailto:support@lifelensai.com" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">
            <Mail size={18} /> Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}