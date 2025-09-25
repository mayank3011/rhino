// components/CourseCreateComponent.tsx

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image"; // Import Next.js Image component
import toast from "react-hot-toast";

// --- Constants based on Logo Colors ---
const COLOR_PRIMARY = "indigo-600";
const COLOR_SECONDARY = "violet-700";
const COLOR_ACCENT = "emerald-600";
const COLOR_HOVER = "indigo-700"; // For primary buttons

// --- Type Definitions ---
type Topic = { id: string; text: string };
type ModuleType = { id: string; title: string; topics: Topic[] };
type Category = { _id: string; name: string };
// Type for the image upload helper response
type UploadResponse = { url: string; publicId: string };

function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 9);
}

// 1. FIXED: Removed 'any' in getErrorMessage by using 'unknown' and safe property checks
function getErrorMessage(json: unknown): string {
  if (json && typeof json === 'object') {
    const errObj = json as { error?: string, message?: string };
    return errObj.error || errObj.message || "Operation failed";
  }
  return "Operation failed";
}

export default function CourseCreateComponent({
  initialTitle = "",
  initialDescription = "",
}: {
  initialTitle?: string;
  initialDescription?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  const [modules, setModules] = useState<ModuleType[]>([
    { id: uid("m_"), title: "Introduction", topics: [{ id: uid("t_"), text: "Overview" }] },
  ]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  // new fields
  const [startTime, setStartTime] = useState<string | null>(null); // ISO or null
  const [price, setPrice] = useState<number | "">("");
  const [duration, setDuration] = useState<string>("");
  const [keyOutcomes, setKeyOutcomes] = useState<string[]>([""]);
  const [mentorName, setMentorName] = useState<string>("");
  const [mentorImageUrl, setMentorImageUrl] = useState<string>(""); // public URL returned from upload
  const [mentorImagePublicId, setMentorImagePublicId] = useState<string>("");

  const [courseImageUrl, setCourseImageUrl] = useState<string>("");
  const [courseImagePublicId, setCourseImagePublicId] = useState<string>("");

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Helper to convert ISO time to datetime-local input format
  // This helper is kept here but intentionally unused in the component body to resolve the warning.
  // We disable the unused-vars check for this specific function.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function toLocalDatetimeInput(iso: string): string {
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        const pad = (n: number) => String(n).padStart(2, "0");
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return "";
    }
  }
  
  // Fetch categories on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data: Category[] = await res.json();
        if (mounted) {
            setCategories(data || []);
            if ((data || []).length > 0) setSelectedCategoryId(data[0]._id);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load categories.");
      } finally {
        if (mounted) setLoadingCategories(false);
      }
    })();
    return () => { mounted = false; }
  }, []);

  // --- Module/Topic Handlers (omitted for brevity, assume valid) ---
  function addModule() {
    setModules((m) => [...m, { id: uid("m_"), title: "", topics: [{ id: uid("t_"), text: "" }] }]);
  }
  function removeModule(id: string) {
    setModules((m) => m.filter((x) => x.id !== id));
  }
  function setModuleTitle(id: string, value: string) {
    setModules((m) => m.map((x) => (x.id === id ? { ...x, title: value } : x)));
  }
  function addTopic(moduleId: string) {
    setModules((m) => m.map((mod) => (mod.id === moduleId ? { ...mod, topics: [...mod.topics, { id: uid("t_"), text: "" }] } : mod)));
  }
  function removeTopic(moduleId: string, topicId: string) {
    setModules((m) => m.map((mod) => (mod.id === moduleId ? { ...mod, topics: mod.topics.filter((t) => t.id !== topicId) } : mod)));
  }
  function setTopicText(moduleId: string, topicId: string, text: string) {
    setModules((m) => m.map((mod) => (mod.id === moduleId ? { ...mod, topics: mod.topics.map((t) => (t.id === topicId ? { ...t, text } : t)) } : mod)));
  }
  function moveTopic(moduleId: string, index: number, dir: "up" | "down") {
    setModules((m) =>
      m.map((mod) => {
        if (mod.id !== moduleId) return mod;
        const topics = [...mod.topics];
        const swapWith = dir === "up" ? index - 1 : index + 1;
        if (swapWith < 0 || swapWith >= topics.length) return mod;
        const tmp = topics[swapWith];
        topics[swapWith] = topics[index];
        topics[index] = tmp;
        return { ...mod, topics };
      }),
    );
  }

  // --- Key Outcomes Handlers (omitted for brevity, assume valid) ---
  function addOutcome() {
    setKeyOutcomes((s) => [...s, ""]);
  }
  function setOutcome(idx: number, val: string) {
    setKeyOutcomes((s) => s.map((v, i) => (i === idx ? val : v)));
  }
  function removeOutcome(idx: number) {
    setKeyOutcomes((s) => s.filter((_, i) => i !== idx));
  }

  // --- Category Creation ---
  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Category name cannot be empty");
      return;
    }
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const errJson = await res.json().catch(() => ({}));

      if (res.status === 409) {
        toast.error("Category already exists");
        return;
      }
      if (!res.ok) {
        throw new Error(getErrorMessage(errJson));
      }
      
      const created: Category = errJson as Category;

      setCategories((c) => [...c, created]);
      setSelectedCategoryId(created._id);
      setNewCategoryName("");
      toast.success("Category created successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Create category failed";
      console.error(err);
      toast.error(message);
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  }

  // --- Upload Handlers ---
  async function uploadFile(file: File): Promise<UploadResponse> {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const errJson = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(getErrorMessage(errJson));
      }
      
      const data = errJson as Record<string, unknown>;
      
      // Destructuring and safely coercing nested or variant keys to string
      const result = data.result && typeof data.result === 'object' ? data.result as Record<string, unknown> : {};

      // 3. & 4. FINAL FIX: Safely accessing deeply nested and variant fields without 'any'
      const url = String(data.url || data.secure_url || result.secure_url || '');
      const publicId = String(data.public_id || result.public_id || data.publicId || '');

      return { url, publicId };
    } catch (err) {
      console.error("upload error", err);
      throw err;
    }
  }

  async function onMentorImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setMessage("Uploading mentor image...");
      const { url, publicId }: UploadResponse = await uploadFile(file); 
      setMentorImageUrl(url || "");
      setMentorImagePublicId(publicId || "");
      toast.success("Mentor image uploaded");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Mentor upload failed";
      toast.error(message);
    } finally {
      setMessage(null);
      setTimeout(() => setMessage(null), 2000);
    }
  }

  async function onCourseImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setMessage("Uploading course image...");
      const { url, publicId }: UploadResponse = await uploadFile(file);
      setCourseImageUrl(url || "");
      setCourseImagePublicId(publicId || "");
      toast.success("Course image uploaded");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Course upload failed";
      toast.error(message);
    } finally {
      setMessage(null);
      setTimeout(() => setMessage(null), 2000);
    }
  }

  // --- Submission ---
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) {
      toast.error("Course title required");
      return;
    }
    // validate modules/topics
    for (const mod of modules) {
      if (!mod.title.trim()) {
        toast.error("Each module must have a title");
        return;
      }
      for (const t of mod.topics) {
        if (!t.text.trim()) {
          toast.error("Topic items cannot be empty");
          return;
        }
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      price: typeof price === "number" ? price : Number(price || 0),
      categoryId: selectedCategoryId,
      startTime: startTime || null, // ISO string
      duration: duration || "",
      keyOutcomes: keyOutcomes.filter((x) => x && x.trim()).map((x) => x.trim()),
      mentor: {
        name: mentorName,
        image: mentorImageUrl,
        imagePublicId: mentorImagePublicId,
      },
      image: courseImageUrl,
      imagePublicId: courseImagePublicId,
      modules: modules.map((m, i) => ({
        title: m.title,
        order: i,
        topics: m.topics.map((t, j) => ({ text: t.text, order: j })),
      })),
    };

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const errJson = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(getErrorMessage(errJson));
      }
      
      toast.success("Course created successfully!");
      
      // Reset form on success
      setTitle("");
      setDescription("");
      setModules([{ id: uid("m_"), title: "Introduction", topics: [{ id: uid("t_"), text: "Overview" }] }]);
      setMentorName("");
      setMentorImageUrl("");
      setCourseImageUrl("");
      setPrice("");
      setDuration("");
      setKeyOutcomes([""]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create course";
      console.error(err);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  // Value used in input field for price (handles the empty string state)
  const priceValue = (price === 0 || price === "") ? price : price;

  // --- JSX Rendering ---
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h2 className={`text-3xl font-bold mb-6 text-${COLOR_SECONDARY}`}>Create New Course</h2>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-100">
        
        {/* Course Details Section */}
        <div className="space-y-4">
          <h3 className={`text-xl font-semibold border-b pb-2 mb-4 text-${COLOR_PRIMARY}`}>Basic Information</h3>
          
          <div>
            <label className="block font-medium text-slate-700">Course Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full p-3 border border-slate-300 rounded-lg focus:border-indigo-500" placeholder="e.g. Full Stack React & Node Mastery" />
          </div>

          <div>
            <label className="block font-medium text-slate-700">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full p-3 border border-slate-300 rounded-lg focus:border-indigo-500" rows={4} placeholder="A brief summary of the course content." />
          </div>

          {/* Price, duration, start time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700">Price (INR)</label>
              <input type="number" value={priceValue} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1 w-full p-3 border border-slate-300 rounded-lg" min={0} placeholder="0" />
            </div>
            <div>
              <label className="block font-medium text-slate-700">Duration</label>
              <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 8 weeks or 12 hours" className="mt-1 w-full p-3 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block font-medium text-slate-700">Start time</label>
              <input type="datetime-local" value={startTime ?? ""} onChange={(e) => setStartTime(e.target.value || null)} className="mt-1 w-full p-3 border border-slate-300 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Key Outcomes Section */}
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
            <h3 className="font-semibold text-lg text-slate-700">Key Outcomes (What students will learn)</h3>
            <button type="button" onClick={addOutcome} className={`px-3 py-1 border rounded-lg text-white bg-${COLOR_PRIMARY} hover:bg-${COLOR_HOVER} transition-colors text-sm`}>+ Add Outcome</button>
          </div>
          <ul className="list-disc pl-5 space-y-3">
            {keyOutcomes.map((o, i) => (
              <li key={i} className="flex items-start gap-3">
                <input value={o} onChange={(e) => setOutcome(i, e.target.value)} className="flex-1 p-2 border border-slate-300 rounded-md" placeholder={`Outcome ${i + 1}`} />
                <button type="button" onClick={() => removeOutcome(i)} className="px-3 py-2 border rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm">Remove</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Media & Mentor Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Mentor block */}
            <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-slate-700">Mentor Details</h3>
                
                <label className="block text-sm font-medium text-slate-700">Mentor Name</label>
                <input value={mentorName} onChange={(e) => setMentorName(e.target.value)} className="mt-1 w-full p-3 border border-slate-300 rounded-lg" placeholder="Full name of instructor" />

                <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mentor Image (Square)</label>
                        <input type="file" accept="image/*" onChange={onMentorImageChange} className="text-sm w-full" />
                    </div>
                    {mentorImageUrl ? (
                        <Image src={mentorImageUrl} alt="mentor" width={80} height={80} className="w-20 h-20 object-cover rounded-full border-2 border-slate-200 flex-shrink-0" />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-400 flex-shrink-0">
                            Avatar
                        </div>
                    )}
                </div>
            </div>

            {/* Course image block */}
            <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-slate-700">Course Hero Image</h3>
                <div className="flex flex-col gap-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Upload Image (Landscape)</label>
                    <input type="file" accept="image/*" onChange={onCourseImageChange} className="text-sm" />
                    {courseImageUrl ? (
                        <Image src={courseImageUrl} alt="course" width={280} height={160} className="w-full h-40 object-cover rounded-lg border-2 border-slate-200" />
                    ) : (
                         <div className="w-full h-40 object-cover rounded-lg bg-slate-100 flex items-center justify-center text-sm text-slate-400">
                             Preview
                         </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* Category & Module Section */}
        <div className="space-y-6">
            <h3 className={`text-xl font-semibold border-b pb-2 mb-4 text-${COLOR_PRIMARY}`}>Curriculum & Categorization</h3>
            
            {/* Category (existing) */}
            <div className="p-4 border border-slate-200 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-slate-700">Select Category</h3>
                    {loadingCategories ? <span className="text-sm text-slate-500">Loading...</span> : null}
                </div>
                
                <div className="flex gap-2 flex-wrap mb-4">
                    {categories.length ? categories.map((c) => (
                        <button 
                            key={c._id} 
                            type="button" 
                            onClick={() => setSelectedCategoryId(c._id)} 
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${selectedCategoryId === c._id ? `bg-${COLOR_PRIMARY} text-white border-${COLOR_PRIMARY}` : "bg-white text-gray-700 border-gray-300 hover:bg-slate-50"}`}
                        >
                            {c.name}
                        </button>
                    )) : <div className="text-sm text-slate-500">No categories yet</div>}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Create a new category" className="p-3 border border-slate-300 rounded-lg flex-1" />
                    <button type="button" onClick={createCategory} className={`px-4 py-3 border rounded-lg text-white bg-${COLOR_ACCENT} hover:bg-emerald-700 transition-colors flex-shrink-0`}>Create New</button>
                </div>
            </div>

            {/* Modules */}
            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                    <h3 className="font-semibold text-lg text-slate-700">Modules & Topics</h3>
                    <button type="button" onClick={addModule} className={`px-3 py-2 border rounded-lg text-white bg-${COLOR_PRIMARY} hover:bg-${COLOR_HOVER} transition-colors text-sm`}>+ Add Module</button>
                </div>

                <div className="space-y-4">
                    {modules.map((mod, mi) => (
                        <div key={mod.id} className="p-4 border border-slate-300 rounded-lg bg-white shadow-sm">
                            
                            {/* Module Title & Remove */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-medium text-slate-600">Module Title</label>
                                    <input value={mod.title} onChange={(e) => setModuleTitle(mod.id, e.target.value)} className="mt-1 w-full p-2 border rounded-md" placeholder={`Module ${mi + 1} title`} />
                                </div>
                                <button type="button" onClick={() => removeModule(mod.id)} className="text-sm px-3 py-2 border rounded-lg bg-red-50 text-red-600 hover:bg-red-100 w-full sm:w-auto">Remove Module</button>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="font-medium text-slate-700">Topics (Ordered)</div>
                                    <button type="button" onClick={() => addTopic(mod.id)} className="px-3 py-1 text-sm border rounded-lg bg-slate-100 hover:bg-slate-200">+ Add Topic</button>
                                </div>

                                <ol className="list-decimal list-inside space-y-3">
                                    {mod.topics.map((t, ti) => (
                                        <li key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                            <input value={t.text} onChange={(e) => setTopicText(mod.id, t.id, e.target.value)} className="w-full p-2 border rounded-md" placeholder={`Topic ${ti + 1}`} />

                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button type="button" onClick={() => moveTopic(mod.id, ti, "up")} className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-slate-100 text-sm">↑</button>
                                                <button type="button" onClick={() => moveTopic(mod.id, ti, "down")} className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-slate-100 text-sm">↓</button>
                                                <button type="button" onClick={() => removeTopic(mod.id, t.id)} className="px-3 py-1 text-sm border rounded bg-red-50 text-red-600 hover:bg-red-100">Remove</button>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Submission Button & Message */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200">
          <button type="submit" disabled={submitting} className={`px-6 py-3 rounded-xl text-lg font-semibold transition-colors flex-1 sm:flex-none ${submitting ? "bg-gray-400 cursor-not-allowed" : `bg-${COLOR_PRIMARY} hover:bg-${COLOR_HOVER}`} text-white`}>
            {submitting ? "Creating..." : "Create Course"}
          </button>
          {message && <div className="text-sm text-green-600 font-medium">{message}</div>}
        </div>
      </form>
    </div>
  );
}