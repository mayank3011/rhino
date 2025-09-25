// components/admin/AdminCourseForm.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image"; // Import Next.js Image component

// --- Mock Interface for Type Safety ---
interface IMentor {
  name?: string | null;
  image?: string | null;
  imagePublicId?: string | null;
}

interface ICourseModule {
  _id?: string;
  id: string;
  title: string;
  topics: {
    _id?: string;
    id: string;
    text: string;
  }[];
}

interface ICourse {
  _id?: string;
  title: string;
  slug: string;
  description?: string;
  niche?: string;
  price?: number | string;
  duration?: string;
  startTime?: string;
  metaTitle?: string;
  metaDescription?: string;
  keyOutcomes?: string[];
  mentor?: IMentor;
  image?: string;
  imagePublicId?: string;
  modules?: ICourseModule[];
}

// --- Concrete Tailwind class constants (no dynamic templates) ---
const PRIMARY_BG = "bg-indigo-600";
const PRIMARY_HOVER_BG = "hover:bg-indigo-700";
const PRIMARY_TEXT = "text-indigo-600";
const SECONDARY_TEXT = "text-violet-700";
const HOVER_BG = "hover:bg-indigo-700";

// --- Utility Functions (uid and slugify kept as is) ---
function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
}
function slugify(s = "") {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

function toDisplayDate(datetimeLocalOrIso: string): string {
  try {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeLocalOrIso)) {
      const d = new Date(datetimeLocalOrIso);
      return d.toLocaleString();
    }
    const d = new Date(datetimeLocalOrIso);
    return isNaN(d.getTime()) ? datetimeLocalOrIso : d.toLocaleString();
  } catch {
    return datetimeLocalOrIso;
  }
}

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

// --- Component Start ---
export default function AdminCourseForm({
  initialData,
  onSaved,
}: {
  initialData?: ICourse;
  onSaved?: (d?: ICourse) => void;
}) {
  // Use ICourse and ICourseModule for initial state structure
  const initialModules: ICourseModule[] = useMemo(() => {
    const modulesData =
      initialData?.modules && initialData.modules.length > 0
        ? initialData.modules
        : [{ id: uid("m_"), title: "", topics: [{ id: uid("t_"), text: "" }] }] as ICourseModule[];

    return modulesData.map((m: ICourseModule, i: number) => ({
      id: m._id ?? uid("m_") + i,
      title: m.title ?? "",
      topics: (m.topics || []).map((t: ICourseModule["topics"][number], j: number) => ({
        id: t._id ?? uid("t_") + j,
        text: t.text ?? "",
      })),
    }));
  }, [initialData?.modules]);

  // core fields
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState<string>(initialData?.slug ?? (initialData?.title ? slugify(initialData.title) : ""));
  const [manualSlugEdited, setManualSlugEdited] = useState<boolean>(!!initialData?.slug);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [niche, setNiche] = useState(initialData?.niche ?? "");
  const [price, setPrice] = useState<number | "">(
    initialData?.price === undefined || initialData?.price === ""
      ? ""
      : typeof initialData?.price === "number"
        ? initialData.price
        : !isNaN(Number(initialData?.price))
          ? Number(initialData?.price)
          : ""
  );
  const [duration, setDuration] = useState(initialData?.duration ?? "");
  const [startTime, setStartTime] = useState<string | null>(initialData?.startTime ? toLocalDatetimeInput(initialData.startTime) : null);

  // optional SEO (kept simple)
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription ?? "");

  // other structured fields
  const [keyOutcomes, setKeyOutcomes] = useState<string[]>(
    initialData?.keyOutcomes && initialData.keyOutcomes.length > 0 ? initialData.keyOutcomes : [""]
  );
  const [mentorName, setMentorName] = useState(initialData?.mentor?.name ?? "");
  const [mentorImageUrl, setMentorImageUrl] = useState(initialData?.mentor?.image ?? "");
  const [mentorImagePublicId, setMentorImagePublicId] = useState(initialData?.mentor?.imagePublicId ?? "");
  const [courseImageUrl, setCourseImageUrl] = useState(initialData?.image ?? "");
  const [courseImagePublicId, setCourseImagePublicId] = useState(initialData?.imagePublicId ?? "");

  const [modules, setModules] = useState<ICourseModule[]>(initialModules);

  // UI & state
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mentorUploading, setMentorUploading] = useState(false);
  const [courseUploading, setCourseUploading] = useState(false);

  // slug check
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // top error banner
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // auto-update slug from title (unless user edited slug manually)
  useEffect(() => {
    if (!manualSlugEdited) setSlug(slugify(title || ""));
  }, [title, manualSlugEdited]);

  // ---------- helpers ----------
  function addModule() {
    setModules((s) => [...s, { id: uid("m_"), title: "", topics: [{ id: uid("t_"), text: "" }] }]);
  }
  function removeModule(id: string) {
    setModules((s) => s.filter((m) => m.id !== id));
  }
  function setModuleTitle(id: string, val: string) {
    setModules((s) => s.map((m) => (m.id === id ? { ...m, title: val } : m)));
  }
  function addTopic(moduleId: string) {
    setModules((s) => s.map((m) => (m.id === moduleId ? { ...m, topics: [...m.topics, { id: uid("t_"), text: "" }] } : m)));
  }
  function setTopicText(moduleId: string, topicId: string, val: string) {
    setModules((s) => s.map((m) => (m.id === moduleId ? { ...m, topics: m.topics.map((t) => (t.id === topicId ? { ...t, text: val } : t)) } : m)));
  }
  function removeTopic(moduleId: string, topicId: string) {
    setModules((s) => s.map((m) => (m.id === moduleId ? { ...m, topics: m.topics.filter((t) => t.id !== topicId) } : m)));
  }

  function addOutcome() {
    setKeyOutcomes((s) => [...s, ""]);
  }
  function setOutcome(i: number, val: string) {
    setKeyOutcomes((s) => s.map((v, idx) => (idx === i ? val : v)));
  }
  function removeOutcome(i: number) {
    setKeyOutcomes((s) => s.filter((_, idx) => idx !== i));
  }

  async function fileToDataUrl(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("Failed to read file"));
      r.readAsDataURL(file);
    });
  }

  type UploadResult = { url?: string; secure_url?: string; public_id?: string; publicId?: string };

  async function uploadDataUrl(dataUrl: string): Promise<UploadResult> {
    const res = await fetch("/api/admin/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({} as Record<string, unknown>))) as Record<string, unknown>;
      throw new Error((typeof j?.error === "string" && j.error) || "Upload failed");
    }
    const body = (await res.json().catch(() => ({} as Record<string, unknown>))) as Record<string, unknown>;
    return {
      url: typeof body.url === "string" ? body.url : undefined,
      secure_url: typeof body.secure_url === "string" ? body.secure_url : undefined,
      public_id: typeof body.public_id === "string" ? body.public_id : undefined,
      publicId: typeof body.publicId === "string" ? body.publicId : undefined,
    };
  }

  async function onMentorImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setMentorUploading(true);
    setMessage("Uploading mentor image...");
    setErrorBanner(null);
    try {
      const dataUrl = await fileToDataUrl(f);
      const json = await uploadDataUrl(dataUrl);
      setMentorImageUrl(json.url ?? json.secure_url ?? "");
      setMentorImagePublicId(json.public_id ?? json.publicId ?? "");
      toast.success("Mentor image uploaded");
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Mentor upload failed";
      console.error("mentor upload", err);
      setErrorBanner(messageText);
      toast.error(messageText);
    } finally {
      setMentorUploading(false);
      setMessage(null);
    }
  }

  async function onCourseImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCourseUploading(true);
    setMessage("Uploading course image...");
    setErrorBanner(null);
    try {
      const dataUrl = await fileToDataUrl(f);
      const json = await uploadDataUrl(dataUrl);
      setCourseImageUrl(json.url ?? json.secure_url ?? "");
      setCourseImagePublicId(json.public_id ?? json.publicId ?? "");
      toast.success("Course image uploaded");
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Course upload failed";
      console.error("course upload", err);
      setErrorBanner(messageText);
      toast.error(messageText);
    } finally {
      setCourseUploading(false);
      setMessage(null);
    }
  }

  function validatePayload(payload: ICourse): string | null {
    if (!payload.title || String(payload.title).trim().length === 0) return "Title is required";
    if (isNaN(Number(payload.price)) || Number(payload.price) < 0) return "Price must be a positive number (or 0)";
    if (!payload.slug || String(payload.slug).trim().length === 0) return "Slug is required";
    return null;
  }

  // ---------- slug check ----------
  async function checkSlug() {
    setSlugChecking(true);
    setSlugAvailable(null);
    setErrorBanner(null);
    try {
      const res = await fetch("/api/admin/courses/check-slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug || title || "", excludeId: initialData?._id ?? undefined }),
      });
      const j = (await res.json().catch(() => ({} as Record<string, unknown>))) as Record<string, unknown>;
      if (!res.ok) {
        const errMsg = typeof j?.error === "string" ? j.error : "Check failed";
        setErrorBanner(errMsg);
        toast.error(errMsg);
        setSlugAvailable(null);
      } else {
        setSlugAvailable(Boolean(j.available));
        if (j.available) toast.success("Slug is available");
        else toast.error("Slug taken — the server will auto-suffix on save");
      }
    } catch (err: unknown) {
      console.error("checkSlug error", err);
      setErrorBanner("Slug check failed");
      toast.error("Slug check failed");
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  }

  // ---------- submit ----------
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setMessage(null);
    setErrorBanner(null);

    const payload: ICourse = {
      title: title.trim(),
      slug: slug.trim(),
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      description: description.trim(),
      niche: niche.trim(),
      price: typeof price === "number" ? price : price === "" ? 0 : Number(price),
      duration: duration || "",
      startTime: startTime || undefined,
      keyOutcomes: keyOutcomes.filter((x) => x && x.trim()).map((x) => x.trim()),
      mentor: { name: mentorName || "", image: mentorImageUrl || "", imagePublicId: mentorImagePublicId || "" },
      image: courseImageUrl || "",
      imagePublicId: courseImagePublicId || "",
      modules: modules.map((m) => ({ title: m.title, id: m.id, _id: m._id, topics: m.topics.map((t) => ({ id: t.id, _id: t._id, text: t.text })) })),
    };

    const vErr = validatePayload(payload);
    if (vErr) {
      setErrorBanner(vErr);
      toast.error(vErr);
      return;
    }

    setSubmitting(true);
    try {
      let res: Response;
      if (initialData?._id) {
        res = await fetch(`/api/admin/courses/${encodeURIComponent(initialData._id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const parsed = (await res.json().catch(() => ({} as Record<string, unknown>))) as unknown;

      if (!res.ok) {
        const errMsg = typeof (parsed as Record<string, unknown>).error === "string"
          ? ((parsed as Record<string, unknown>).error as string)
          : typeof (parsed as Record<string, unknown>).message === "string"
            ? ((parsed as Record<string, unknown>).message as string)
            : "Save failed";
        setErrorBanner(errMsg);
        toast.error(errMsg);
        throw new Error(errMsg);
      }

      toast.success(initialData?._id ? "Course updated" : "Course created");
      setMessage(initialData?._id ? "Course updated" : "Course created");

      if (onSaved) {
        // parsed might be the saved course; attempt to cast safely
        if (parsed && typeof parsed === "object") {
          onSaved(parsed as ICourse);
        } else {
          onSaved();
        }
      }
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Save failed";
      console.error("Save error:", err);
      if (!errorBanner) setErrorBanner(messageText);
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 2000);
    }
  }

  const priceValue = (price === 0 || price === "") ? price : price;

  // ---------- preview ----------
  const preview = useMemo(() => {
    return {
      title: title || "Course title",
      price: Number(price || 0),
      niche: niche || "Niche",
      duration: duration || "Duration",
      startTime: startTime ? toDisplayDate(startTime) : null,
      mentor: { name: mentorName || "Mentor name", image: mentorImageUrl || null },
      image: courseImageUrl || null,
      outcomes: keyOutcomes.filter(Boolean),
      modules: modules.map((m) => ({ title: m.title || "Module title", topics: m.topics.map((t) => t.text || "Topic") })),
      slug,
      metaTitle,
      metaDescription,
    };
  }, [title, price, niche, duration, startTime, mentorName, mentorImageUrl, courseImageUrl, keyOutcomes, modules, slug, metaTitle, metaDescription]);

  // ---------- JSX ----------
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form column */}
      <div className="lg:col-span-7">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-6 shadow-xl border border-slate-100">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100">
            <h3 className={`text-xl font-bold ${SECONDARY_TEXT}`}>Course Details</h3>
            <div className="text-sm text-slate-500 font-medium">{initialData?._id ? "Editing" : "Create new"}</div>
          </div>

          {/* top error banner */}
          {errorBanner ? (
            <div className="rounded p-3 bg-red-50 border border-red-400 text-sm text-red-700 font-medium" role="alert">
              <strong>🚫 Error:</strong> {errorBanner}
            </div>
          ) : null}

          {/* Title, slug, price - optimized for all screen sizes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-1 p-3 w-full border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Complete React Bootcamp"
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3">
                <label htmlFor="course-slug" className="text-sm text-slate-500 flex-shrink-0">
                  Slug:
                </label>
                <input
                  id="course-slug"
                  className="p-1 text-sm border rounded-md font-mono text-gray-700 flex-1 min-w-0"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setManualSlugEdited(true); setSlugAvailable(null); }}
                />
                <button type="button" onClick={checkSlug} disabled={slugChecking} className={`px-3 py-1 border rounded text-sm whitespace-nowrap transition-colors ${slugChecking ? "bg-gray-200 text-gray-500" : `bg-white hover:bg-slate-50 ${PRIMARY_TEXT}`}`}>
                  {slugChecking ? "Checking…" : "Check slug"}
                </button>
                {slugAvailable === null ? null : slugAvailable ? (
                  <div className="text-sm text-green-600">✅ Available</div>
                ) : (
                  <div className="text-sm text-red-600">❌ Taken</div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-1 p-3 w-full border border-slate-300 rounded-lg"
                type="number"
                min={0}
                value={priceValue as number | string}
                onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Short description</label>
            <textarea
              className="mt-1 p-3 w-full border border-slate-300 rounded-lg"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A 2–3 line summary for the course."
            />
          </div>

          {/* SEO fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Meta title</label>
              <input className="mt-1 p-3 w-full border border-slate-300 rounded-lg text-sm" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Optional SEO title (≤70 chars)" maxLength={70} />
              <div className="text-xs text-slate-400 mt-1">{metaTitle.length}/70</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Meta description</label>
              <input className="mt-1 p-3 w-full border border-slate-300 rounded-lg text-sm" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Optional meta description (≤160 chars)" maxLength={160} />
              <div className="text-xs text-slate-400 mt-1">{metaDescription.length}/160</div>
            </div>
          </div>

          {/* niche / duration / startTime */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Niche</label>
              <input className="mt-1 p-3 w-full border border-slate-300 rounded-lg" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. Web development" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Duration</label>
              <input className="mt-1 p-3 w-full border border-slate-300 rounded-lg" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 8 weeks" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Start time</label>
              <input type="datetime-local" className="mt-1 p-3 w-full border border-slate-300 rounded-lg" value={startTime ?? ""} onChange={(e) => setStartTime(e.target.value || null)} />
            </div>
          </div>

          {/* Key outcomes */}
          <div className="p-4 border rounded-lg bg-slate-50/50">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <div>
                <div className="text-sm font-bold text-slate-700">What students will learn</div>
                <div className="text-xs text-slate-500">Key outcomes (3–5 recommended)</div>
              </div>
              <button type="button" onClick={addOutcome} className={`text-sm px-3 py-1 border rounded-lg ${PRIMARY_BG} text-white ${PRIMARY_HOVER_BG}`}>+ Add</button>
            </div>

            <ul className="space-y-3">
              {keyOutcomes.map((k, i) => (
                <li key={i} className="flex flex-col sm:flex-row gap-2">
                  <input value={k} onChange={(e) => setOutcome(i, e.target.value)} className="flex-1 p-2 border rounded-md" placeholder={`Outcome ${i + 1}`} />
                  <button type="button" onClick={() => removeOutcome(i)} className="px-3 py-2 border rounded-lg bg-red-50 text-red-600 text-sm hover:bg-red-100 transition-colors sm:w-auto w-full">Remove</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Mentor & course image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Mentor Details & Image</label>
              <input className="p-3 w-full border border-slate-300 rounded-lg" value={mentorName} onChange={(e) => setMentorName(e.target.value)} placeholder="Mentor full name" />
              <div className="mt-2 flex items-center gap-4">
                <input type="file" accept="image/*" onChange={onMentorImageChange} className="text-sm" />
                {mentorUploading && <div className="text-sm text-slate-500">Uploading…</div>}
                {mentorImageUrl && <Image src={mentorImageUrl} alt="mentor" width={56} height={56} className="w-14 h-14 rounded-full object-cover border border-slate-200" />}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Course Hero Image</label>
              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={onCourseImageChange} className="text-sm" />
                {courseUploading && <div className="text-sm text-slate-500">Uploading…</div>}
              </div>
              {courseImageUrl && (
                <div className="mt-2 w-full">
                  <Image src={courseImageUrl} alt="course" width={300} height={150} className="w-full rounded-lg object-cover border border-slate-200" />
                </div>
              )}
            </div>
          </div>

          {/* Modules & topics */}
          <div className="p-4 border rounded-lg bg-slate-50/50">
            <div className="flex flex-wrap items-center justify-between mb-4 border-b border-slate-200 pb-2">
              <div>
                <div className="text-sm font-bold text-slate-700">Modules & Topics</div>
                <div className="text-xs text-slate-500">Ordered modules with ordered topics</div>
              </div>
              <button type="button" onClick={addModule} className={`px-3 py-1 border rounded-lg ${PRIMARY_BG} text-white ${PRIMARY_HOVER_BG}`}>+ Module</button>
            </div>

            <div className="space-y-4">
              {modules.map((mod, mi) => (
                <div key={mod.id} className="p-3 border rounded-lg bg-white shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-slate-600">Module title</label>
                      <input value={mod.title} onChange={(e) => setModuleTitle(mod.id, e.target.value)} className="mt-1 p-2 w-full border rounded-md" placeholder={`Module ${mi + 1} title`} />
                    </div>
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <button type="button" onClick={() => removeModule(mod.id)} className="px-3 py-2 border rounded-lg bg-red-50 text-red-600 text-sm hover:bg-red-100 transition-colors w-full sm:w-auto">Remove Module</button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Topics (ordered)</div>
                      <button type="button" onClick={() => addTopic(mod.id)} className="px-2 py-1 border rounded text-sm bg-slate-100 hover:bg-slate-200 transition-colors">+ Topic</button>
                    </div>

                    <ol className="list-decimal list-inside space-y-3">
                      {mod.topics.map((t, ti) => (
                        <li key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <input value={t.text} onChange={(e) => setTopicText(mod.id, t.id, e.target.value)} className="flex-1 p-2 border rounded-md" placeholder={`Topic ${ti + 1}`} />
                          <button type="button" onClick={() => removeTopic(mod.id, t.id)} className="px-3 py-2 border rounded-lg bg-red-50 text-red-600 text-xs hover:bg-red-100 transition-colors w-full sm:w-auto">Remove</button>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <button type="submit" disabled={submitting || mentorUploading || courseUploading} className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-lg font-semibold transition-colors ${submitting ? "bg-gray-400 cursor-not-allowed text-white" : `${PRIMARY_BG} text-white ${PRIMARY_HOVER_BG}`}`}>
              {submitting ? "Saving…" : initialData?._id ? "Save Changes" : "Create Course"}
            </button>

            <button type="button" onClick={() => resetForm(initialData, setTitle, setSlug, setManualSlugEdited, setDescription, setNiche, setPrice, setDuration, setStartTime, setMetaTitle, setMetaDescription, setKeyOutcomes, setMentorName, setMentorImageUrl, setMentorImagePublicId, setCourseImageUrl, setCourseImagePublicId, setModules)} className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex-1 sm:flex-none">
              Reset to Initial
            </button>

            {message && <div className="text-sm text-green-600 font-medium">{message}</div>}
          </div>
        </form>
      </div>

      {/* Preview column */}
      <aside className="lg:col-span-5">
        <div className="sticky top-4 space-y-4">
          <div className="bg-white border rounded-2xl p-5 shadow-xl">
            <div className="h-44 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
              {preview.image ? <Image src={preview.image} alt="course hero" width={400} height={176} className="w-full h-full object-cover" /> : <div className="text-slate-400 text-lg font-medium">Course hero preview</div>}
            </div>

            <div className="mt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">{preview.title}</h4>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-2">
                    <span>{preview.niche}</span>
                    <span>• {preview.duration}</span>
                    {preview.startTime && <span>• {preview.startTime}</span>}
                  </div>
                </div>
                <div className={`${PRIMARY_TEXT} font-bold text-xl flex-shrink-0`}>₹{Number(preview.price).toLocaleString()}</div>
              </div>

              <div className="mt-4 flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                {preview.mentor.image ? <Image src={preview.mentor.image} width={48} height={48} className="w-12 h-12 rounded-full object-cover border" alt="mentor" /> : <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0" />}
                <div>
                  <div className="text-sm font-medium">{preview.mentor.name}</div>
                  <div className="text-xs text-slate-500">Course Instructor</div>
                </div>
              </div>

              <div className="mt-5 border-t pt-4 border-slate-100">
                <div className="text-lg font-bold text-gray-800">What you&apos;ll learn</div>
                {preview.outcomes.length ? (
                  <ul className="mt-3 list-disc list-inside text-base text-slate-700 space-y-1">
                    {preview.outcomes.slice(0, 6).map((o: string, i: number) => <li key={i}>{o}</li>)}
                  </ul>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">No key outcomes defined yet.</div>
                )}
              </div>

              <div className="mt-5 border-t pt-4 border-slate-100">
                <div className="text-lg font-bold text-gray-800">Curriculum Modules</div>
                <ul className="mt-3 text-base text-slate-700 space-y-3">
                  {preview.modules.slice(0, 5).map((m: { title: string; topics: string[] }, i: number) => (
                    <li key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className={`font-semibold text-base ${SECONDARY_TEXT}`}>{i + 1}. {m.title}</div>
                      {m.topics && m.topics.length ? <div className="text-xs text-slate-500 mt-1 line-clamp-2">Topics: {m.topics.map((t: string) => t).slice(0, 3).join(", ")}...</div> : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className={`flex-1 px-4 py-3 rounded-xl ${PRIMARY_BG} text-white font-semibold text-base ${HOVER_BG}`}>Enroll Now (Demo)</button>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-5 text-sm shadow">
            <div className={`${PRIMARY_TEXT} font-bold`}>Course Admin Tips</div>
            <ul className="mt-2 list-disc pl-5 text-slate-600 space-y-1">
              <li>Use concise module titles for <strong>skimability</strong>.</li>
              <li>Upload clear <strong>square headshots</strong> for the mentor.</li>
              <li>Fill at least 3 key outcomes for higher conversion.</li>
              <li>Always check the <strong>slug availability</strong> before saving.</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

// resetForm helper
function resetForm(
  initialData: ICourse | undefined,
  setTitle: React.Dispatch<React.SetStateAction<string>>,
  setSlug: React.Dispatch<React.SetStateAction<string>>,
  setManualSlugEdited: React.Dispatch<React.SetStateAction<boolean>>,
  setDescription: React.Dispatch<React.SetStateAction<string>>,
  setNiche: React.Dispatch<React.SetStateAction<string>>,
  setPrice: React.Dispatch<React.SetStateAction<number | "">>,
  setDuration: React.Dispatch<React.SetStateAction<string>>,
  setStartTime: React.Dispatch<React.SetStateAction<string | null>>,
  setMetaTitle: React.Dispatch<React.SetStateAction<string>>,
  setMetaDescription: React.Dispatch<React.SetStateAction<string>>,
  setKeyOutcomes: React.Dispatch<React.SetStateAction<string[]>>,
  setMentorName: React.Dispatch<React.SetStateAction<string>>,
  setMentorImageUrl: React.Dispatch<React.SetStateAction<string>>,
  setMentorImagePublicId: React.Dispatch<React.SetStateAction<string>>,
  setCourseImageUrl: React.Dispatch<React.SetStateAction<string>>,
  setCourseImagePublicId: React.Dispatch<React.SetStateAction<string>>,
  setModules: React.Dispatch<React.SetStateAction<ICourseModule[]>>
) {
  const defaultModule: ICourseModule[] = [{ id: uid("m_"), title: "", topics: [{ id: uid("t_"), text: "" }] }];
  const modulesData = initialData?.modules && initialData.modules.length ? initialData.modules : defaultModule;

  setModules(
    modulesData.map((m: ICourseModule, i: number) => ({
      id: m._id ?? uid("m_") + i,
      title: m.title ?? "",
      topics: (m.topics || []).map((t: ICourseModule["topics"][number], j: number) => ({ id: t._id ?? uid("t_") + j, text: t.text ?? "" })),
    }))
  );

  setTitle(initialData?.title ?? "");
  setSlug(initialData?.slug ?? (initialData?.title ? slugify(initialData.title) : ""));
  setManualSlugEdited(!!initialData?.slug);
  setDescription(initialData?.description ?? "");
  setNiche(initialData?.niche ?? "");
  setPrice(
    initialData?.price === undefined || initialData?.price === ""
      ? ""
      : typeof initialData?.price === "number"
        ? initialData.price
        : !isNaN(Number(initialData?.price))
          ? Number(initialData?.price)
          : ""
  );
  setDuration(initialData?.duration ?? "");
  setStartTime(initialData?.startTime ? toLocalDatetimeInput(initialData.startTime) : null);
  setMetaTitle(initialData?.metaTitle ?? "");
  setMetaDescription(initialData?.metaDescription ?? "");
  setKeyOutcomes(initialData?.keyOutcomes && initialData.keyOutcomes.length ? initialData.keyOutcomes : [""]);
  setMentorName(initialData?.mentor?.name ?? "");
  setMentorImageUrl(initialData?.mentor?.image ?? "");
  setMentorImagePublicId(initialData?.mentor?.imagePublicId ?? "");
  setCourseImageUrl(initialData?.image ?? "");
  setCourseImagePublicId(initialData?.imagePublicId ?? "");
}
