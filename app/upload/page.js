"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UploadCloud, FileText, X, CheckCircle2, Send } from "lucide-react";
import { addMemory } from "@/lib/memoryStore";

function answerAboutFile(question, file) {
  const q = question.toLowerCase().trim();
  if (/^(hi+|hello+|hey+)\b/.test(q)) return "Hi! Ask me anything about this file.";

  if (q.includes("what is this") || q.includes("what's this") || q.includes("summary") || q.includes("about")) {
    if (file.textContent) {
      const snippet = file.textContent.slice(0, 300).trim();
      return `Here's what this file contains: "${snippet}${file.textContent.length > 300 ? "..." : ""}"`;
    }
    return `This file is titled "${file.title}" (${file.fileName}). It's a ${file.fileType?.split("/")[0] || "file"} type.`;
  }

  if (file.textContent) {
    const words = q.split(/\s+/).filter((w) => w.length > 2);
    const lines = file.textContent.split("\n");
    const matchingLines = lines.filter((line) => words.some((w) => line.toLowerCase().includes(w)));
    if (matchingLines.length > 0) {
      return `Found this in the document: "${matchingLines.slice(0, 3).join(" ").trim().slice(0, 300)}"`;
    }
  }

  return file.textContent
    ? "I couldn't find an exact match for that in this document's text. Try asking differently, or ask for a summary."
    : `This file type doesn't have readable text content, but it's a ${file.fileType?.split("/")[0] || "file"} named ${file.fileName}.`;
}

export default function UploadPage() {
  const today = new Date().toISOString().split("T")[0];

  const [category, setCategory] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [date, setDate] = useState(today);
  const [uploadMode, setUploadMode] = useState("");
  const [saving, setSaving] = useState(false);

  const [showReader, setShowReader] = useState(false);
  const [readerIndex, setReaderIndex] = useState(0);
  const [savedMemories, setSavedMemories] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const [qaMessages, setQaMessages] = useState([]);
  const [qaInput, setQaInput] = useState("");

  const readFile = (file) =>
    new Promise((resolve) => {
      const result = { file, preview: "", textContent: "" };
      const readerB64 = new FileReader();
      readerB64.onload = () => {
        result.preview = readerB64.result;
        const isTextLike = file.type.startsWith("text/") || /\.(txt|csv|json|md)$/i.test(file.name);
        if (isTextLike) {
          const readerText = new FileReader();
          readerText.onload = () => { result.textContent = readerText.result; resolve(result); };
          readerText.readAsText(file);
        } else {
          resolve(result);
        }
      };
      readerB64.readAsDataURL(file);
    });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const processed = await Promise.all(files.map(readFile));
    setSelectedFiles((prev) => [...prev, ...processed]);
  };

  const removeFile = (index) => setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setCategory("");
    setSelectedFiles([]);
    setDate(today);
    setUploadMode("");
  };

  const handleUpload = () => {
    if (!category) { alert("Please select a category."); return; }
    if (selectedFiles.length === 0) { alert("Please choose at least one file."); return; }
    if (!uploadMode) { alert("Please select either 'Read it now' or 'Just Store'."); return; }

    setSaving(true);
    try {
      const saved = selectedFiles.map(({ file, preview, textContent }) =>
        addMemory({
          title: file.name.replace(/\.[^/.]+$/, ""),
          description: "",
          category,
          date,
          year: new Date(date).getFullYear().toString(),
          fileName: file.name,
          fileType: file.type,
          preview,
          textContent,
        })
      );

      setSavedMemories(saved);
      setSaving(false);

      if (uploadMode === "read") {
        setReaderIndex(0);
        setQaMessages([{ id: 1, role: "ai", text: `Ask me anything about "${saved[0].title}".` }]);
        setShowReader(true);
      } else {
        // Stays visible until the person navigates away via the back arrow —
        // no auto-dismiss timer.
        setShowSuccess(true);
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setSaving(false);
      alert("Something went wrong while saving. Files may be too large for local storage.");
    }
  };

  const closeReader = () => {
    setShowReader(false);
    setSavedMemories([]);
    setQaMessages([]);
    resetForm();
    setShowSuccess(true); // same rule — stays until back arrow clicked
  };

  const goToNextFile = () => {
    const nextIndex = readerIndex + 1;
    setReaderIndex(nextIndex);
    setQaMessages([{ id: Date.now(), role: "ai", text: `Ask me anything about "${savedMemories[nextIndex].title}".` }]);
    setQaInput("");
  };

  const sendQaQuestion = () => {
    const question = qaInput.trim();
    if (!question) return;
    const userMsg = { id: Date.now(), role: "user", text: question };
    const aiMsg = { id: Date.now() + 1, role: "ai", text: answerAboutFile(question, currentReaderFile) };
    setQaMessages((prev) => [...prev, userMsg, aiMsg]);
    setQaInput("");
  };

  const currentReaderFile = savedMemories[readerIndex];

  return (
    <div className="min-h-screen bg-slate-100">

      <header className="bg-white shadow-md px-8 py-5 flex items-center gap-5">
        <Link href="/dashboard" onClick={() => setShowSuccess(false)}>
          <ArrowLeft size={28} className="cursor-pointer hover:text-blue-600" />
        </Link>
        <h1 className="text-3xl font-bold">Upload Memory</h1>
      </header>

      <div className="max-w-3xl mx-auto py-10">
        <div className="bg-white rounded-3xl shadow-xl p-10">

          {showSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-center gap-2">
              <CheckCircle2 size={20} /> Upload successful! You can upload more, or tap the back arrow to go to Dashboard.
            </div>
          )}

          <div className="mb-6">
            <label className="block font-semibold mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select Category</option>
              <option>Education</option><option>Personal</option><option>Certificates</option>
              <option>Photos</option><option>Videos</option><option>Documents</option>
              <option>Memories</option><option>Others</option>
            </select>
          </div>

          <div className="mb-8">
            <label className="block font-semibold mb-3">Choose Files</label>
            <label className="border-2 border-dashed border-blue-500 rounded-2xl p-10 flex flex-col justify-center items-center cursor-pointer hover:bg-blue-50 transition">
              <UploadCloud size={50} className="text-blue-600" />
              <p className="text-lg font-semibold mt-4">Drag & Drop Files Here</p>
              <p className="text-gray-500 my-2">OR</p>
              <span className="bg-blue-600 text-white px-6 py-3 rounded-xl">Browse Files</span>
              <p className="text-xs text-gray-400 mt-3">You can select multiple files at once</p>
              <input type="file" multiple hidden onChange={handleFileChange} />
            </label>

            {selectedFiles.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-gray-500">{selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected</p>
                {selectedFiles.map((sf, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      {sf.file.type.startsWith("image/") && sf.preview ? (
                        <img src={sf.preview} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <FileText className="text-blue-600" />
                      )}
                      <span className="text-sm">{sf.file.name}</span>
                    </div>
                    <button onClick={() => removeFile(i)}><X size={18} className="text-gray-400 hover:text-red-500" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block font-semibold mb-2">Upload Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="mb-8">
            <label className="block font-semibold mb-3">After Upload <span className="text-red-500">*</span></label>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="uploadMode" value="read" checked={uploadMode === "read"} onChange={(e) => setUploadMode(e.target.value)} />
                <span>Read it now</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="uploadMode" value="store" checked={uploadMode === "store"} onChange={(e) => setUploadMode(e.target.value)} />
                <span>Just Store</span>
              </label>
            </div>
            {!uploadMode && <p className="text-red-500 text-sm mt-2">Please select one option before uploading.</p>}
          </div>

          <button onClick={handleUpload} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-4 rounded-xl font-semibold text-lg flex justify-center items-center gap-3 disabled:opacity-60">
            <UploadCloud size={22} />
            {saving ? "Saving..." : "Upload Memory"}
          </button>

        </div>
      </div>

      {showReader && currentReaderFile && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">{currentReaderFile.title}</h3>
                {savedMemories.length > 1 && <p className="text-xs text-gray-400">{readerIndex + 1} of {savedMemories.length}</p>}
              </div>
              <button onClick={closeReader}><X size={22} /></button>
            </div>

            {currentReaderFile.fileType?.startsWith("image/") && <img src={currentReaderFile.preview} alt={currentReaderFile.title} className="w-full rounded-xl mb-4" />}
            {currentReaderFile.fileType?.startsWith("video/") && <video src={currentReaderFile.preview} controls className="w-full rounded-xl mb-4" />}
            {currentReaderFile.fileType === "application/pdf" && <iframe src={currentReaderFile.preview} className="w-full h-[50vh] rounded-xl border mb-4" title={currentReaderFile.title} />}
            {currentReaderFile.textContent && <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-xl border mb-4 max-h-60 overflow-y-auto">{currentReaderFile.textContent}</pre>}
            {!currentReaderFile.fileType?.startsWith("image/") && !currentReaderFile.fileType?.startsWith("video/") && currentReaderFile.fileType !== "application/pdf" && !currentReaderFile.textContent && (
              <div className="bg-gray-100 p-8 rounded-xl text-center text-gray-500 mb-4">
                This file type can't be previewed directly, but it's fully saved — {currentReaderFile.fileName}
              </div>
            )}

            <div className="border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Ask about this file</div>
              <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                {qaMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 p-3 border-t">
                <input value={qaInput} onChange={(e) => setQaInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendQaQuestion()} placeholder="e.g. What is this about?" className="flex-1 border rounded-lg p-2 text-sm" />
                <button onClick={sendQaQuestion} className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg"><Send size={16} /></button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {readerIndex < savedMemories.length - 1 ? (
                <button onClick={goToNextFile} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">Next File</button>
              ) : (
                <button onClick={closeReader} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">Done — Back to Upload</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}