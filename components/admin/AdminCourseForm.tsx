// components/admin/AdminCourseForm.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

/**
 * AdminCourseForm (fixed)
 *
 * - Adds slug state + check slug button (server endpoint: /api/admin/courses/check-slug).
 * - Shows top error banner when a validation or server error occurs.
 * - Uses toast notifications for success / failure.
 * - Required fields marked with a red star.
 * - Improved upload & submit error handling.
 */

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

type Topic = { id: string; text: string };
type ModuleType = { id: string; title: string; topics: Topic[] };

export default function AdminCourseForm({
  initialData,
  onSaved,
}: {
  initialData?: any;
  onSaved?: (d?: any) => void;
}) {
  // core fields
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState<string>(initialData?.slug ?? (initialData?.title ? slugify(initialData.title) : ""));
  const [manualSlugEdited, setManualSlugEdited] = useState<boolean>(!!initialData?.slug);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [niche, setNiche] = useState(initialData?.niche ?? "");
  const [price, setPrice] = useState<number | "">(initialData?.price ?? "");
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

  const [modules, setModules] = useState<ModuleType[]>(
    (initialData?.modules && initialData.modules.length > 0
      ? initialData.modules
      : [{ id: uid("m_"), title: "", topics: [{ id: uid("t_"), text: "" }] }]
    ).map((m: any, i: number) => ({
      id: m._id ?? uid("m_") + i,
      title: m.title ?? "",
      topics: (m.topics || []).map((t: any, j: number) => ({ id: t._id ?? uid("t_") + j, text: t.text ?? "" })),
    }))
  );

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

  async function fileToDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function uploadDataUrl(dataUrl: string) {
    const res = await fetch("/api/admin/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || "Upload failed");
    }
    return res.json();
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
      setMentorImageUrl(json.url || json.secure_url);
      setMentorImagePublicId(json.public_id || json.publicId || "");
      toast.success("Mentor image uploaded");
    } catch (err: any) {
      console.error("mentor upload", err);
      setErrorBanner(err?.message || "Mentor upload failed");
      toast.error(err?.message || "Mentor upload failed");
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
      setCourseImageUrl(json.url || json.secure_url);
      setCourseImagePublicId(json.public_id || json.publicId || "");
      toast.success("Course image uploaded");
    } catch (err: any) {
      console.error("course upload", err);
      setErrorBanner(err?.message || "Course upload failed");
      toast.error(err?.message || "Course upload failed");
    } finally {
      setCourseUploading(false);
      setMessage(null);
    }
  }

  // ---------- validation ----------
  function validatePayload(payload: any) {
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
        body: JSON.stringify({ slug: slug || title || "", excludeId: initialData?._id || null }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = j?.error || "Check failed";
        setErrorBanner(errMsg);
        toast.error(errMsg);
        setSlugAvailable(null);
      } else {
        setSlugAvailable(Boolean(j.available));
        if (j.available) toast.success("Slug is available");
        else toast.error("Slug taken — the server will auto-suffix on save");
      }
    } catch (err: any) {
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

    const payload: any = {
      title: title.trim(),
      slug: slug.trim(),
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      description: description.trim(),
      niche: niche.trim(),
      price: typeof price === "number" ? price : price === "" ? 0 : Number(price),
      duration: duration || "",
      startTime: startTime || null,
      keyOutcomes: keyOutcomes.filter((x) => x && x.trim()).map((x) => x.trim()),
      mentor: { name: mentorName || "", image: mentorImageUrl || "", imagePublicId: mentorImagePublicId || "" },
      image: courseImageUrl || "",
      imagePublicId: courseImagePublicId || "",
      modules: modules.map((m, i) => ({ title: m.title, order: i, topics: m.topics.map((t, j) => ({ text: t.text, order: j })) })),
    };

    const vErr = validatePayload(payload);
    if (vErr) {
      setErrorBanner(vErr);
      toast.error(vErr);
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (initialData?._id) {
        res = await fetch(`/api/admin/courses/${initialData._id}`, {
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

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = j?.error || j?.message || "Save failed";
        setErrorBanner(errMsg);
        toast.error(errMsg);
        throw new Error(errMsg);
      }

      toast.success(initialData?._id ? "Course updated" : "Course created");
      setMessage(initialData?._id ? "Course updated" : "Course created");
      if (onSaved) onSaved(j);
    } catch (err: any) {
      console.error("Save error:", err);
      if (!errorBanner) setErrorBanner(err?.message || "Save failed");
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 2000);
    }
  }

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
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-6 shadow border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Course details</h3>
            <div className="text-xs text-slate-500">{initialData?._id ? "Editing" : "Create new"}</div>
          </div>

          {/* top error banner */}
          {errorBanner ? (
            <div className="rounded p-3 bg-red-50 border border-red-200 text-sm text-red-700">
              <strong>Error:</strong> {errorBanner}
            </div>
          ) : null}

          {/* Title, slug, price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-1 p-2 w-full border rounded-md"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Complete React Bootcamp"
              />
              <div className="flex items-center gap-2 mt-2">
                <label className="text-xs text-slate-500">Slug (editable)</label>
                <input
                  className="ml-2 p-1 text-sm border rounded-md"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setManualSlugEdited(true); setSlugAvailable(null); }}
                />
                <button type="button" onClick={checkSlug} disabled={slugChecking} className="ml-2 px-2 py-1 border rounded text-sm">
                  {slugChecking ? "Checking…" : "Check slug"}
                </button>
                {slugAvailable === null ? null : slugAvailable ? (
                  <div className="text-sm text-green-600">Available</div>
                ) : (
                  <div className="text-sm text-red-600">Taken</div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Price (INR) <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-1 p-2 w-full border rounded-md"
                type="number"
                min={0}
                value={price as any}
                onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Short description</label>
            <textarea
              className="mt-1 p-2 w-full border rounded-md"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A 2–3 line summary for the course."
            />
          </div>

          {/* SEO fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Meta title</label>
              <input className="mt-1 p-2 w-full border rounded-md text-sm" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Optional SEO title (≤70 chars)" />
              <div className="text-xs text-slate-400 mt-1">{metaTitle.length}/70</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Meta description</label>
              <input className="mt-1 p-2 w-full border rounded-md text-sm" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Optional meta description (≤160 chars)" />
              <div className="text-xs text-slate-400 mt-1">{metaDescription.length}/160</div>
            </div>
          </div>

          {/* niche / duration / startTime */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Niche</label>
              <input className="mt-1 p-2 w-full border rounded-md" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. Web development" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Duration</label>
              <input className="mt-1 p-2 w-full border rounded-md" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 8 weeks" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Start time</label>
              <input type="datetime-local" className="mt-1 p-2 w-full border rounded-md" value={startTime ?? ""} onChange={(e) => setStartTime(e.target.value || null)} />
            </div>
          </div>

          {/* Key outcomes */}
          <div className="p-3 border rounded-md bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium">What students will learn</div>
                <div className="text-xs text-slate-500">Key outcomes (3–5 recommended)</div>
              </div>
              <button type="button" onClick={addOutcome} className="text-sm px-2 py-1 border rounded">+ Add</button>
            </div>

            <ul className="space-y-2">
              {keyOutcomes.map((k, i) => (
                <li key={i} className="flex gap-2">
                  <input value={k} onChange={(e) => setOutcome(i, e.target.value)} className="flex-1 p-2 border rounded-md" placeholder={`Outcome ${i + 1}`} />
                  <button type="button" onClick={() => removeOutcome(i)} className="px-2 py-1 border rounded bg-red-50 text-sm">Remove</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Mentor & course image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-slate-700">Mentor</label>
              <input className="mt-1 p-2 w-full border rounded-md" value={mentorName} onChange={(e) => setMentorName(e.target.value)} placeholder="Mentor full name" />
              <div className="mt-2 flex items-center gap-3">
                <input type="file" accept="image/*" onChange={onMentorImageChange} />
                {mentorUploading ? <div className="text-sm text-slate-500">Uploading…</div> : null}
                {mentorImageUrl ? <img src={mentorImageUrl} alt="mentor" className="w-14 h-14 rounded-full object-cover border" /> : null}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Course hero image</label>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={onCourseImageChange} />
                {courseUploading ? <div className="text-sm text-slate-500">Uploading…</div> : null}
              </div>
              {courseImageUrl ? <div className="mt-2 w-full"><img src={courseImageUrl} alt="course" className="w-full rounded-md object-cover border" /></div> : null}
            </div>
          </div>

          {/* Modules & topics */}
          <div className="p-3 border rounded-md bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium">Modules & Topics</div>
                <div className="text-xs text-slate-500">Ordered modules with ordered topics</div>
              </div>
              <button type="button" onClick={addModule} className="px-2 py-1 border rounded">+ Module</button>
            </div>

            <div className="space-y-4">
              {modules.map((mod, mi) => (
                <div key={mod.id} className="p-3 border rounded">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium">Module title</label>
                      <input value={mod.title} onChange={(e) => setModuleTitle(mod.id, e.target.value)} className="mt-1 p-2 w-full border rounded-md" placeholder={`Module ${mi + 1} title`} />
                    </div>
                    <div className="flex-shrink-0">
                      <button type="button" onClick={() => removeModule(mod.id)} className="px-2 py-1 border rounded bg-red-50 text-sm">Remove</button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Topics (ordered)</div>
                      <button type="button" onClick={() => addTopic(mod.id)} className="px-2 py-1 border rounded text-sm">+ Topic</button>
                    </div>

                    <ol className="list-decimal list-inside space-y-2">
                      {mod.topics.map((t, ti) => (
                        <li key={t.id} className="flex items-start gap-2">
                          <input value={t.text} onChange={(e) => setTopicText(mod.id, t.id, e.target.value)} className="flex-1 p-2 border rounded-md" placeholder={`Topic ${ti + 1}`} />
                          <button type="button" onClick={() => removeTopic(mod.id, t.id)} className="px-2 py-1 border rounded bg-red-50 text-sm">Remove</button>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* actions */}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting || mentorUploading || courseUploading} className={`px-4 py-2 rounded-md text-white ${submitting ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}>
              {submitting ? "Saving…" : initialData?._id ? "Save changes" : "Create course"}
            </button>

            <button type="button" onClick={() => resetForm(initialData, setTitle, setSlug, setManualSlugEdited, setDescription, setNiche, setPrice, setDuration, setStartTime, setMetaTitle, setMetaDescription, setKeyOutcomes, setMentorName, setMentorImageUrl, setMentorImagePublicId, setCourseImageUrl, setCourseImagePublicId, setModules)} className="px-3 py-2 border rounded-md text-sm">
              Reset
            </button>

            {message ? <div className="text-sm text-slate-600">{message}</div> : null}
          </div>
        </form>
      </div>

      {/* Preview column */}
      <aside className="lg:col-span-5">
        <div className="sticky top-20 space-y-4">
          <div className="bg-white border rounded-2xl p-5 shadow">
            <div className="h-44 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
              {preview.image ? <img src={preview.image} alt="course hero" className="w-full h-full object-cover" /> : <div className="text-slate-400">Course hero</div>}
            </div>

            <div className="mt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold">{preview.title}</h4>
                  <div className="text-xs text-slate-500 mt-1">{preview.niche} • {preview.duration}{preview.startTime ? ` • ${preview.startTime}` : ""}</div>
                </div>
                <div className="text-indigo-600 font-medium">₹{Number(preview.price).toLocaleString()}</div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                {preview.mentor.image ? <img src={preview.mentor.image} className="w-12 h-12 rounded-full object-cover border" alt="mentor" /> : <div className="w-12 h-12 rounded-full bg-slate-100" />}
                <div>
                  <div className="text-sm font-medium">{preview.mentor.name}</div>
                  <div className="text-xs text-slate-500">Mentor</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium">What you'll learn</div>
                {preview.outcomes.length ? (
                  <ul className="mt-2 list-disc list-inside text-sm text-slate-700 space-y-1">
                    {preview.outcomes.slice(0, 6).map((o: string, i: number) => <li key={i}>{o}</li>)}
                  </ul>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">No outcomes yet</div>
                )}
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium">Modules</div>
                <ul className="mt-2 text-sm text-slate-700 space-y-2">
                  {preview.modules.slice(0, 5).map((m: any, i: number) => (
                    <li key={i}>
                      <div className="font-medium">{m.title}</div>
                      {m.topics && m.topics.length ? <div className="text-xs text-slate-500">{m.topics.map((t:string)=>t).slice(0,3).join(", ")}</div> : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button className="flex-1 px-4 py-2 rounded-md bg-green-600 text-white text-sm">Publish (demo)</button>
              <button className="px-4 py-2 rounded-md border text-sm">Save draft</button>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4 text-sm">
            <div className="font-semibold">Tips</div>
            <ul className="mt-2 list-disc pl-5 text-slate-600 space-y-1">
              <li>Use concise module titles for skimability.</li>
              <li>Upload clear headshot for mentor (square).</li>
              <li>Fill at least 3 key outcomes for higher conversion.</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* --------------------- helpers --------------------- */

function toDisplayDate(datetimeLocalOrIso: string) {
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

function toLocalDatetimeInput(iso: string) {
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

function resetForm(
  initialData: any,
  setTitle: any,
  setSlug: any,
  setManualSlugEdited: any,
  setDescription: any,
  setNiche: any,
  setPrice: any,
  setDuration: any,
  setStartTime: any,
  setMetaTitle: any,
  setMetaDescription: any,
  setKeyOutcomes: any,
  setMentorName: any,
  setMentorImageUrl: any,
  setMentorImagePublicId: any,
  setCourseImageUrl: any,
  setCourseImagePublicId: any,
  setModules: any
) {
  setTitle(initialData?.title ?? "");
  setSlug(initialData?.slug ?? (initialData?.title ? slugify(initialData.title) : ""));
  setManualSlugEdited(!!initialData?.slug);
  setDescription(initialData?.description ?? "");
  setNiche(initialData?.niche ?? "");
  setPrice(initialData?.price ?? "");
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
  setModules(
    (initialData?.modules && initialData.modules.length
      ? initialData.modules
      : [{ id: uid("m_"), title: "", topics: [{ id: uid("t_"), text: "" }] }]
    ).map((m: any, i: number) => ({
      id: m._id ?? uid("m_") + i,
      title: m.title ?? "",
      topics: (m.topics || []).map((t: any, j: number) => ({ id: t._id ?? uid("t_") + j, text: t.text ?? "" })),
    }))
  );
}
