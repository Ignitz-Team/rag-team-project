"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function AboutAppPage() {
  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <header className="bg-white shadow-md px-8 py-5 flex items-center gap-5">
        <Link href="/profile"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
        <h1 className="text-2xl font-bold">About App</h1>
      </header>

      <div className="max-w-lg mx-auto mt-8 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">Life Lens AI</h2>
          <p className="text-gray-500 mt-1">Version 1.0.0</p>
          <p className="text-gray-600 mt-6 leading-relaxed">
            Life Lens AI helps you organize your memories, important documents, photos,
            and life events into one intelligent, searchable timeline — so nothing important
            ever gets lost.
          </p>
        </div>
      </div>
    </div>
  );
}