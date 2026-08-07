"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Send, Plus, X, Paperclip, Link as LinkIcon, Trash2, MessageSquareText, Home, Clock3, Search, MessageCircle, User } from "lucide-react";
import TopIcons from "@/components/TopIcons";
import { getMemories, addMemory } from "@/lib/memoryStore";

const CATEGORY_OPTIONS = ["Education", "Personal", "Certificates", "Photos", "Videos", "Documents", "Memories", "Others"];

const GREETING_PATTERNS = /^(hi+|hello+|hey+|yo|good\s?morning|good\s?evening|good\s?afternoon|sup|whats up|namaste)\b/i;
const GREETING_REPLIES = [
  "Hello! 😊 Ask me anything about your memories, or tap + to add something new.",
  "Hi there! How can I help you with your memories today?",
  "Hey! I'm here to help you find and remember things. What are you looking for?",
];

function findBestMatch(memories, q) {
  const lower = q.toLowerCase();
  const titleMatches = memories.filter((m) => m.title && (lower.includes(m.title.toLowerCase()) || m.title.toLowerCase().includes(lower)));
  if (titleMatches.length > 0) return titleMatches[0];

  const stopWords = new Set(["what", "when", "where", "which", "show", "find", "tell", "about", "have", "did", "the", "are", "my", "me", "you", "is", "was", "for", "year", "date", "in"]);
  const words = lower.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
  if (words.length === 0) return null;

  const scored = memories
    .map((m) => {
      const haystack = `${m.title} ${m.description} ${m.category} ${m.fileName} ${m.textContent || ""} ${m.url || ""}`.toLowerCase();
      const score = words.reduce((acc, w) => acc + (haystack.includes(w) ? 1 : 0), 0);
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].m : null;
}

function generateReply(question, memories) {
  const trimmed = question.trim();
  if (GREETING_PATTERNS.test(trimmed)) return GREETING_REPLIES[Math.floor(Math.random() * GREETING_REPLIES.length)];

  const q = trimmed.toLowerCase();
  const yearMatch = q.match(/\b(20\d{2})\b/);
  const catMatch = CATEGORY_OPTIONS.map((c) => c.toLowerCase()).find((c) => q.includes(c));

  if (q.includes("how many") || q.includes("count")) {
    let filtered = memories;
    if (yearMatch) filtered = filtered.filter((m) => m.year === yearMatch[1]);
    if (catMatch) filtered = filtered.filter((m) => m.category?.toLowerCase() === catMatch);
    return `You have ${filtered.length} matching memor${filtered.length === 1 ? "y" : "ies"}${yearMatch ? ` in ${yearMatch[1]}` : ""}${catMatch ? ` under ${catMatch}` : ""}.`;
  }

  const asksWhen = /(which year|what year|when|what date|which date)/.test(q);
  if (asksWhen) {
    const match = findBestMatch(memories, q);
    return match ? `"${match.title}" is from ${new Date(match.date).toLocaleDateString()} (${match.year}), under ${match.category}.` : "I couldn't find a memory matching that name.";
  }

  const asksContent = /(what is|what's|content|contains|about|summary|say|written|read)/.test(q);
  if (asksContent) {
    const match = findBestMatch(memories, q);
    if (match) {
      if (match.textContent) {
        const words = q.split(/\s+/).filter((w) => w.length > 2);
        const lines = match.textContent.split("\n").filter((l) => l.trim());
        const relevantLines = lines.filter((line) => words.some((w) => line.toLowerCase().includes(w.toLowerCase())));
        const snippet = (relevantLines.length > 0 ? relevantLines : lines).slice(0, 3).join(" ").trim().slice(0, 350);
        return `From "${match.title}": "${snippet}${snippet.length >= 350 ? "..." : ""}"`;
      }
      if (match.url) return `"${match.title}" is a saved link: ${match.url}`;
      return `"${match.title}" (${match.category}, ${match.year}) doesn't have readable text content, but it's saved as ${match.fileName || "a note"}.`;
    }
  }

  if (yearMatch && catMatch) {
    const both = memories.filter((m) => m.year === yearMatch[1] && m.category?.toLowerCase() === catMatch);
    return both.length ? `In ${yearMatch[1]}, under ${catMatch}: ${both.map((m) => m.title).join(", ")}.` : `Nothing found under ${catMatch} for ${yearMatch[1]}.`;
  }
  if (yearMatch) {
    const inYear = memories.filter((m) => m.year === yearMatch[1]);
    return inYear.length ? `In ${yearMatch[1]}, you have: ${inYear.map((m) => m.title).join(", ")}.` : `I don't see any memories from ${yearMatch[1]} yet.`;
  }
  if (catMatch) {
    const inCat = memories.filter((m) => m.category?.toLowerCase() === catMatch);
    return inCat.length ? `Under ${catMatch}, you have: ${inCat.map((m) => m.title).join(", ")}.` : `You don't have any memories under ${catMatch} yet.`;
  }

  const match = findBestMatch(memories, q);
  if (match) return `I found "${match.title}" (${match.category}, ${match.year}) — is that what you're looking for?`;

  return "I couldn't find anything matching that in your memories yet. Try mentioning a year, category, or the title of what you're looking for.";
}

export default function ChatPage() {
  const pathname = usePathname();
  const [memories, setMemories] = useState([]);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([{ id: 1, role: "ai", text: "Hi! Ask me about your memories, or tap + to add something new." }]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addText, setAddText] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addFile, setAddFile] = useState(null);
  const [addFilePreview, setAddFilePreview] = useState("");
  const [addTextContent, setAddTextContent] = useState("");
  const [readingFile, setReadingFile] = useState(false);

  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showSaveDetailsModal, setShowSaveDetailsModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState("");
  const [pendingDate, setPendingDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingMemory, setSavingMemory] = useState(false);

  const refreshMemories = () => setMemories(getMemories(false));

  useEffect(() => {
    refreshMemories();
    setHistory(JSON.parse(localStorage.getItem("searchHistory") || "[]"));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const saveHistoryEntry = (text) => {
    const entry = { id: Date.now(), text, time: new Date().toISOString() };
    const updated = [entry, ...history];
    setHistory(updated);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
  };

  const deleteHistoryEntry = (id) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.setItem("searchHistory", "[]");
  };

  const send = () => {
    const question = input.trim();
    if (!question) return;
    const userMsg = { id: Date.now(), role: "user", text: question };
    const reply = { id: Date.now() + 1, role: "ai", text: generateReply(question, memories) };
    setMessages((prev) => [...prev, userMsg, reply]);
    saveHistoryEntry(question);
    setInput("");
  };

  const openAddModal = () => {
    setAddText(""); setAddUrl(""); setAddFile(null); setAddFilePreview(""); setAddTextContent("");
    setShowAddModal(true);
  };

  // Reads EVERY file type as base64 (same as Upload page), so preview/fileSize
  // is always populated and storage usage reliably increases.
  const handleFileBrowse = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAddFile(file);
    setReadingFile(true);

    const readerB64 = new FileReader();
    readerB64.onload = () => {
      setAddFilePreview(readerB64.result);

      const isTextLike = file.type.startsWith("text/") || /\.(txt|csv|json|md)$/i.test(file.name);
      if (isTextLike) {
        const readerText = new FileReader();
        readerText.onload = () => { setAddTextContent(readerText.result); setReadingFile(false); };
        readerText.readAsText(file);
      } else {
        setReadingFile(false);
      }
    };
    readerB64.readAsDataURL(file);
  };

  const confirmAdd = () => {
    if (readingFile) { alert("Please wait, still reading the file..."); return; }
    if (!addText.trim() && !addFile && !addUrl.trim()) { alert("Please type something, attach a file, or add a URL."); return; }
    setShowAddModal(false);
    setShowChoiceModal(true);
  };

  const getAddTitle = () => addText.trim() || addFile?.name || addUrl.trim() || "Untitled";

  const chooseSaveAsMemory = () => {
    setShowChoiceModal(false);
    setPendingCategory("");
    setPendingDate(new Date().toISOString().split("T")[0]);
    setShowSaveDetailsModal(true);
  };

  const confirmSaveMemory = () => {
    if (!pendingCategory) { alert("Please select a category."); return; }
    if (!pendingDate) { alert("Please select a date."); return; }

    setSavingMemory(true);
    try {
      const title = getAddTitle();
      const year = new Date(pendingDate).getFullYear().toString();

      const saved = addMemory({
        title,
        description: addUrl.trim() ? `Link: ${addUrl.trim()}` : (addFile ? "Added from chat with attached file" : "Added from chat"),
        category: pendingCategory,
        date: pendingDate,
        year,
        fileName: addFile?.name || "",
        fileType: addFile?.type || (addUrl.trim() ? "text/url" : "text/note"),
        preview: addFilePreview,
        textContent: addTextContent || addText.trim(),
        url: addUrl.trim(),
      });

      refreshMemories();

      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "ai", text: `Saved "${saved.title}" to your memories under ${saved.category} on ${saved.date}. Storage usage updated. Ask me anything about it!` },
      ]);

      setShowSaveDetailsModal(false);
      resetAddState();
    } catch (err) {
      console.error(err);
      alert("Couldn't save — the file may be too large for local storage.");
    } finally {
      setSavingMemory(false);
    }
  };

  const chooseKeepInHistoryOnly = () => {
    const title = getAddTitle();
    saveHistoryEntry(title);
    setMessages((prev) => [...prev, { id: Date.now(), role: "ai", text: `Got it — I've noted "${title}" in your chat history without saving it to Memories.` }]);
    setShowChoiceModal(false);
    resetAddState();
  };

  const resetAddState = () => {
    setAddText(""); setAddUrl(""); setAddFile(null); setAddFilePreview(""); setAddTextContent("");
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/timeline", label: "Timeline", icon: Clock3 },
    { href: "/search", label: "Search", icon: Search },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-24 flex flex-col">

      <header className="bg-white shadow-md px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/dashboard"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
          <h1 className="text-2xl font-bold">Memory Assistant</h1>
        </div>
        <TopIcons />
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full mt-6 px-4 gap-4">

        <div className="hidden md:block w-64 bg-white rounded-2xl shadow p-4 h-fit max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquareText size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-500 uppercase">History</h3>
            </div>
            {history.length > 0 && <button onClick={clearAllHistory} className="text-xs text-red-500 hover:underline">Clear all</button>}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-gray-400">Nothing here yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-1 group">
                  <button onClick={() => setInput(h.text)} className="flex-1 text-left text-sm p-2 rounded-lg hover:bg-gray-100 min-w-0">
                    <p className="truncate">{h.text}</p>
                    <p className="text-[10px] text-gray-400">{new Date(h.time).toLocaleDateString()}</p>
                  </button>
                  <button onClick={() => deleteHistoryEntry(h.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow">
          <div className="flex-1 space-y-4 overflow-y-auto p-6" style={{ maxHeight: "60vh" }}>
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100"}`}><p className="text-sm">{m.text}</p></div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2 p-4 border-t">
            <button onClick={openAddModal} className="border rounded-xl px-3 hover:bg-gray-50"><Plus size={18} /></button>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about your memories..." className="flex-1 border rounded-xl p-3" />
            <button onClick={send} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl"><Send size={18} /></button>
          </div>
        </div>

      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Something New</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <textarea value={addText} onChange={(e) => setAddText(e.target.value)} placeholder="Type a note, event, or anything you want to remember..." rows={3} className="w-full border rounded-xl p-3 mb-3" />
            <div className="relative mb-3">
              <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="url" value={addUrl} onChange={(e) => setAddUrl(e.target.value)} placeholder="https://... (add a link, optional)" className="w-full border rounded-xl p-3 pl-9" />
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="w-full border border-dashed rounded-xl p-3 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 mb-2">
              <Paperclip size={16} /> {readingFile ? "Reading file..." : addFile ? addFile.name : "Browse File (optional)"}
            </button>
            <input ref={fileInputRef} type="file" hidden onChange={handleFileBrowse} />
            <button onClick={confirmAdd} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold mt-3">Add</button>
          </div>
        </div>
      )}

      {showChoiceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-2">Save this?</h3>
            <p className="text-gray-500 text-sm mb-6 break-words">{getAddTitle()}</p>
            <button onClick={chooseSaveAsMemory} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold mb-3">Save to my Memories</button>
            <button onClick={chooseKeepInHistoryOnly} className="w-full border py-3 rounded-xl font-semibold">Don't save — just answer & keep in chat history</button>
          </div>
        </div>
      )}

      {showSaveDetailsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Save Details</h3>
            <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
            <select value={pendingCategory} onChange={(e) => setPendingCategory(e.target.value)} className="w-full border rounded-xl p-3 mt-1 mb-4">
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <label className="text-xs font-semibold text-gray-500 uppercase">Date</label>
            <input type="date" value={pendingDate} onChange={(e) => setPendingDate(e.target.value)} className="w-full border rounded-xl p-3 mt-1 mb-6" />
            <button onClick={confirmSaveMemory} disabled={savingMemory} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60">
              {savingMemory ? "Saving..." : "Save & Open Chat"}
            </button>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} className={`flex flex-col items-center ${isActive ? "text-blue-600" : "text-gray-600"}`}>
                <Icon size={22} />
                <span className="text-xs">{label}</span>
              </Link>
            );
          })}
        </div>
      </footer>
    </div>
  );
}