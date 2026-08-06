"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft, Calendar, ChevronDown, ChevronRight,
  MoreVertical, Home, Clock3, Search, MessageCircle, User, X,
} from "lucide-react";
import TopIcons from "@/components/TopIcons";
import { getMemories, updateMemories, deleteMemories } from "@/lib/memoryStore";

const CATEGORY_OPTIONS = ["Education", "Personal", "Certificates", "Photos", "Videos", "Documents", "Memories", "Others"];

export default function TimelinePage() {
  const pathname = usePathname();

  const [memories, setMemories] = useState([]);
  const [expandedYears, setExpandedYears] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);
  const [actionType, setActionType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [moveDate, setMoveDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectionYear, setSelectionYear] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setMemories(getMemories(false));
  };

  const grouped = {};
  memories.forEach((m) => {
    const year = m.year || "Unknown";
    const cat = m.category || "Others";
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][cat]) grouped[year][cat] = [];
    grouped[year][cat].push(m);
  });

  const years = Object.keys(grouped).sort((a, b) => b - a);

  const toggleYear = (year) => {
    setExpandedYears((prev) => (prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]));
  };

  const toggleFile = (id) => setSelectedFiles((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectAll = (files) => {
    const obj = { ...selectedFiles };
    files.forEach((f) => { obj[f.id] = true; });
    setSelectedFiles(obj);
  };

  const unSelectAll = (files) => {
    const obj = { ...selectedFiles };
    files.forEach((f) => { obj[f.id] = false; });
    setSelectedFiles(obj);
  };

  const getSelectedCount = () => Object.values(selectedFiles).filter(Boolean).length;
  const getSelectedIds = () => Object.keys(selectedFiles).filter((id) => selectedFiles[id]).map(Number);

  const openAction = (action, year) => {
    setActionType(action);
    setSelectionMode(true);
    setSelectionYear(year);
    setSelectedFiles({});
    setActiveMenu(null);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectionYear(null);
    setSelectedFiles({});
    setActionType("");
  };

  const continueSelection = () => {
    const count = getSelectedCount();
    if (count === 0) { alert("Please select at least one file."); return; }
    if (actionType === "rename" && count !== 1) { alert("Please select only one file to rename."); return; }
    if (actionType === "rename") {
      const id = getSelectedIds()[0];
      const file = memories.find((m) => m.id === id);
      setRenameValue(file ? file.title : "");
    }
    setShowModal(true);
  };

  const confirmMoveDate = () => {
    if (!moveDate) { alert("Please pick a date."); return; }
    const newYear = new Date(moveDate).getFullYear().toString();
    updateMemories(getSelectedIds(), { date: moveDate, year: newYear });
    refresh(); setShowModal(false); cancelSelection(); setMoveDate("");
  };

  const confirmMoveCategory = () => {
    if (!selectedCategory) { alert("Please select a category."); return; }
    updateMemories(getSelectedIds(), { category: selectedCategory });
    refresh(); setShowModal(false); cancelSelection(); setSelectedCategory("");
  };

  const confirmRename = () => {
    if (!renameValue.trim()) { alert("Please enter a name."); return; }
    updateMemories(getSelectedIds(), { title: renameValue.trim() });
    refresh(); setShowModal(false); cancelSelection(); setRenameValue("");
  };

  const confirmDelete = () => {
    deleteMemories(getSelectedIds());
    refresh(); setShowModal(false); cancelSelection();
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/timeline", label: "Timeline", icon: Clock3 },
    { href: "/search", label: "Search", icon: Search },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-24">

      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <Link href="/dashboard"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
            <div>
              <h1 className="text-3xl font-bold">My Timeline</h1>
              <p className="text-gray-500">{memories.length} memories saved</p>
            </div>
          </div>
          <TopIcons />
        </div>
      </header>

      <div className="max-w-5xl mx-auto mt-8 px-4">

        {years.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center text-gray-500">
            No memories uploaded yet.
            <div className="mt-4">
              <Link href="/upload">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-xl">Upload your first memory</button>
              </Link>
            </div>
          </div>
        )}

        {years.map((year) => {
          const categories = grouped[year];
          const catNames = Object.keys(categories);
          const isExpanded = expandedYears.includes(year);

          return (
            <div key={year} className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">

              <div className="flex justify-between items-center px-6 py-5">
                <button onClick={() => toggleYear(year)} className="flex items-center gap-4">
                  {isExpanded ? <ChevronDown /> : <ChevronRight />}
                  <Calendar className="text-blue-600" />
                  <div className="text-left">
                    <h2 className="text-2xl font-bold">{year}</h2>
                    <p className="text-gray-500">{catNames.length} Categories</p>
                  </div>
                </button>

                <div className="relative">
                  <button onClick={() => setActiveMenu(activeMenu === year ? null : year)}><MoreVertical /></button>

                  {activeMenu === year && (
                    <div className="absolute right-0 top-10 bg-white shadow-xl border rounded-xl w-64 z-50">
                      <button onClick={() => openAction("date", year)} className="w-full text-left px-4 py-3 hover:bg-gray-100">Move to another Date</button>
                      <button onClick={() => openAction("category", year)} className="w-full text-left px-4 py-3 hover:bg-gray-100">Move to another Category</button>
                      <button onClick={() => openAction("rename", year)} className="w-full text-left px-4 py-3 hover:bg-gray-100">Rename</button>
                      <button onClick={() => openAction("delete", year)} className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-gray-50 p-6">
                  {catNames.map((catName) => {
                    const files = categories[catName];
                    const allSelected = files.length > 0 && files.every((f) => selectedFiles[f.id]);
                    const showCheckboxes = selectionMode && selectionYear === year;

                    return (
                      <div key={catName} className="bg-white rounded-xl shadow-sm border mb-6">
                        <div className="flex justify-between items-center px-5 py-4 border-b">
                          <div>
                            <h3 className="text-xl font-semibold text-blue-600">📂 {catName}</h3>
                            <p className="text-sm text-gray-500">{files.length} Files</p>
                          </div>
                          {showCheckboxes && (
                            <button onClick={() => (allSelected ? unSelectAll(files) : selectAll(files))} className="text-blue-600 font-medium hover:underline">
                              {allSelected ? "Unselect All" : "Select All"}
                            </button>
                          )}
                        </div>

                        <div className="p-4 space-y-4">
                          {files.map((file) => (
                            <div key={file.id} className="flex justify-between items-center border rounded-xl p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                {showCheckboxes && (
                                  <input
                                    type="checkbox"
                                    checked={selectedFiles[file.id] || false}
                                    onChange={() => toggleFile(file.id)}
                                    className="w-5 h-5 accent-blue-600"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">
                                    {file.fileType?.startsWith("image/") ? "🖼" : file.fileType?.startsWith("video/") ? "🎬" : file.url ? "🔗" : "📄"} {file.title}
                                  </p>
                                  <p className="text-sm text-gray-500">Category: {file.category} · {file.date}</p>
                                </div>
                              </div>
                              <button onClick={() => setPreviewFile(file)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectionMode && (
        <div className="fixed bottom-20 left-0 w-full flex justify-center z-40 px-4">
          <div className="bg-white shadow-2xl border rounded-2xl px-6 py-4 flex items-center gap-6">
            <span className="font-medium">{getSelectedCount()} file{getSelectedCount() !== 1 ? "s" : ""} selected</span>
            <button onClick={cancelSelection} className="border px-4 py-2 rounded-xl">Cancel</button>
            <button onClick={continueSelection} className="bg-blue-600 text-white px-5 py-2 rounded-xl">Continue</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-8">

            {actionType === "date" && (
              <>
                <h2 className="text-2xl font-bold mb-6">Move Selected Files</h2>
                <div className="max-h-52 overflow-y-auto border rounded-xl p-4 mb-6">
                  {memories.filter((m) => selectedFiles[m.id]).map((f) => (
                    <div key={f.id} className="py-2 border-b last:border-none">📄 {f.title}</div>
                  ))}
                </div>
                <label className="font-semibold">Move To Date</label>
                <input
                  type="date"
                  value={moveDate}
                  onChange={(e) => setMoveDate(e.target.value)}
                  className="w-full border rounded-xl p-3 mt-2 mb-2"
                />
                <p className="text-xs text-gray-500 mb-6">The file's year on the timeline updates automatically based on this date.</p>
                <div className="flex justify-end gap-4">
                  <button onClick={() => setShowModal(false)} className="px-5 py-2 border rounded-xl">Cancel</button>
                  <button onClick={confirmMoveDate} className="bg-blue-600 text-white px-5 py-2 rounded-xl">Move</button>
                </div>
              </>
            )}

            {actionType === "category" && (
              <>
                <h2 className="text-2xl font-bold mb-6">Move to Another Category</h2>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full border rounded-xl p-3 mb-6">
                  <option value="">Select Category</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
                <div className="flex justify-end gap-4">
                  <button onClick={() => setShowModal(false)} className="border px-5 py-2 rounded-xl">Cancel</button>
                  <button onClick={confirmMoveCategory} className="bg-blue-600 text-white px-5 py-2 rounded-xl">Move</button>
                </div>
              </>
            )}

            {actionType === "rename" && (
              <>
                <h2 className="text-2xl font-bold mb-6">Rename File</h2>
                <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="Enter New File Name" className="w-full border rounded-xl p-3 mb-6" />
                <div className="flex justify-end gap-4">
                  <button onClick={() => setShowModal(false)} className="border px-5 py-2 rounded-xl">Cancel</button>
                  <button onClick={confirmRename} className="bg-blue-600 text-white px-5 py-2 rounded-xl">Save</button>
                </div>
              </>
            )}

            {actionType === "delete" && (
              <>
                <h2 className="text-2xl font-bold text-red-600 mb-6">Delete Selected Files</h2>
                <div className="max-h-56 overflow-y-auto border rounded-xl p-4 mb-6">
                  {memories.filter((m) => selectedFiles[m.id]).map((f) => (
                    <div key={f.id} className="py-2 border-b last:border-none">📄 {f.title}</div>
                  ))}
                </div>
                <p className="text-gray-600 mb-6">This action cannot be undone. Deleted files will still appear in your Recent Activity marked as "(Deleted)".</p>
                <div className="flex justify-end gap-4">
                  <button onClick={() => setShowModal(false)} className="border px-5 py-2 rounded-xl">Cancel</button>
                  <button onClick={confirmDelete} className="bg-red-600 text-white px-5 py-2 rounded-xl">Delete</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 px-4" onClick={() => setPreviewFile(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{previewFile.title}</h3>
              <button onClick={() => setPreviewFile(null)}><X /></button>
            </div>

            {previewFile.fileType?.startsWith("image/") && (
              <img src={previewFile.preview} alt={previewFile.title} className="w-full rounded-xl" />
            )}

            {previewFile.fileType?.startsWith("video/") && (
              <video src={previewFile.preview} controls className="w-full rounded-xl" />
            )}

            {previewFile.fileType === "application/pdf" && (
              <iframe src={previewFile.preview} className="w-full h-[60vh] rounded-xl border" title={previewFile.title} />
            )}

            {previewFile.textContent && (
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-xl border max-h-96 overflow-y-auto">{previewFile.textContent}</pre>
            )}

            {previewFile.url && (
              <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="block bg-blue-50 text-blue-600 p-4 rounded-xl break-all hover:underline">
                🔗 {previewFile.url}
              </a>
            )}

            {!previewFile.fileType?.startsWith("image/") &&
              !previewFile.fileType?.startsWith("video/") &&
              previewFile.fileType !== "application/pdf" &&
              !previewFile.textContent &&
              !previewFile.url && (
                <div className="bg-gray-100 p-8 rounded-xl text-center text-gray-500">
                  Preview not available for this file type — {previewFile.fileName}
                </div>
              )}

            {previewFile.description && <p className="mt-4 text-gray-600">{previewFile.description}</p>}
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 w-full bg-white border-t shadow-lg">
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