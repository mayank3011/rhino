// components/CourseCreateComponent.tsx
"use client";

import React, { useEffect, useState } from "react";

type Topic = { id: string; text: string };
type ModuleType = { id: string; title: string; topics: Topic[] };
type Category = { _id: string; name: string };

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
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

  useEffect(() => {
    (async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data || []);
        if ((data || []).length > 0) setSelectedCategoryId(data[0]._id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  // modules handlers
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

  // key outcomes
  function addOutcome() {
    setKeyOutcomes((s) => [...s, ""]);
  }
  function setOutcome(idx: number, val: string) {
    setKeyOutcomes((s) => s.map((v, i) => (i === idx ? val : v)));
  }
  function removeOutcome(idx: number) {
    setKeyOutcomes((s) => s.filter((_, i) => i !== idx));
  }

  // category creation
  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      setMessage("Category name cannot be empty");
      return;
    }
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.status === 409) {
        setMessage("Category already exists");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to create category");
      }
      const created = await res.json();
      setCategories((c) => [...c, created]);
      setSelectedCategoryId(created._id);
      setNewCategoryName("");
      setMessage("Category created");
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message || "Create category failed");
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  }

  // upload helper - expects your upload endpoint to accept FormData { file }
  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Upload failed");
      }
      // expected response: { url: string, public_id: string }
      const data = await res.json();
      return { url: data.url || data.secure_url || data.result?.secure_url, publicId: data.public_id || data.result?.public_id || data.publicId || data.public_id };
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
      const { url, publicId } = await uploadFile(file) as any;
      setMentorImageUrl(url || "");
      setMentorImagePublicId(publicId || "");
      setMessage("Mentor image uploaded");
    } catch (err: any) {
      setMessage(err?.message || "Mentor upload failed");
    } finally {
      setTimeout(() => setMessage(null), 2000);
    }
  }

  async function onCourseImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setMessage("Uploading course image...");
      const { url, publicId } = await uploadFile(file) as any;
      setCourseImageUrl(url || "");
      setCourseImagePublicId(publicId || "");
      setMessage("Course image uploaded");
    } catch (err: any) {
      setMessage(err?.message || "Course upload failed");
    } finally {
      setTimeout(() => setMessage(null), 2000);
    }
  }

  // submit
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) {
      setMessage("Course title required");
      return;
    }
    // validate modules/topics
    for (const mod of modules) {
      if (!mod.title.trim()) {
        setMessage("Each module must have a title");
        return;
      }
      for (const t of mod.topics) {
        if (!t.text.trim()) {
          setMessage("Topic items cannot be empty");
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Create failed");
      }
      const created = await res.json();
      setMessage("Course created successfully");
      // optional: redirect to course page
      // window.location.href = `/course/${created._id}`;
      // reset minimal parts
      setTitle("");
      setDescription("");
      setModules([{ id: uid("m_"), title: "", topics: [{ id: uid("t_"), text: "" }] }]);
      setMentorName("");
      setMentorImageUrl("");
      setCourseImageUrl("");
      setPrice("");
      setDuration("");
      setKeyOutcomes([""]);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message || "Failed to create course");
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic */}
        <div>
          <label className="block font-medium">Course Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block font-medium">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full p-2 border rounded" rows={3} />
        </div>

        {/* Price, duration, start time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-medium">Price (INR)</label>
            <input type="number" value={price as any} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1 w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-medium">Duration</label>
            <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 8 weeks · 12 hours" className="mt-1 w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-medium">Start time</label>
            <input type="datetime-local" value={startTime ?? ""} onChange={(e) => setStartTime(e.target.value || null)} className="mt-1 w-full p-2 border rounded" />
          </div>
        </div>

        {/* Key outcomes (unordered list) */}
        <div className="p-3 border rounded">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Key outcomes</h3>
            <button type="button" onClick={addOutcome} className="px-2 py-1 border rounded text-sm">+ Add outcome</button>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            {keyOutcomes.map((o, i) => (
              <li key={i} className="flex items-start gap-2">
                <input value={o} onChange={(e) => setOutcome(i, e.target.value)} className="flex-1 p-2 border rounded" placeholder={`Outcome ${i + 1}`} />
                <button type="button" onClick={() => removeOutcome(i)} className="px-2 py-1 border rounded bg-red-50">Remove</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Mentor block */}
        <div className="p-3 border rounded">
          <h3 className="font-semibold mb-2">Mentor</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Mentor name</label>
              <input value={mentorName} onChange={(e) => setMentorName(e.target.value)} className="mt-1 w-full p-2 border rounded" />
            </div>

            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium">Mentor image</label>
              <input type="file" accept="image/*" onChange={onMentorImageChange} className="mt-1" />
              {mentorImageUrl ? <img src={mentorImageUrl} alt="mentor" className="mt-2 w-24 h-24 object-cover rounded" /> : null}
            </div>
          </div>
        </div>

        {/* Course image */}
        <div className="p-3 border rounded">
          <h3 className="font-semibold mb-2">Course image</h3>
          <div className="flex items-center gap-4">
            <input type="file" accept="image/*" onChange={onCourseImageChange} />
            {courseImageUrl ? <img src={courseImageUrl} alt="course" className="w-28 h-20 object-cover rounded" /> : null}
          </div>
        </div>

        {/* Category (existing) */}
        <div className="p-3 border rounded">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Category</h3>
            {loadingCategories ? <span className="text-sm text-slate-500">Loading...</span> : null}
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {categories.length ? categories.map((c) => (
              <button key={c._id} type="button" onClick={() => setSelectedCategoryId(c._id)} className={`px-3 py-1 rounded border ${selectedCategoryId === c._id ? "bg-gray-200" : ""}`}>{c.name}</button>
            )) : <div className="text-sm text-slate-500">No categories yet</div>}
          </div>
          <div className="flex gap-2">
            <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category" className="p-2 border rounded flex-1" />
            <button type="button" onClick={createCategory} className="px-4 py-2 border rounded">Create</button>
          </div>
        </div>

        {/* Modules */}
        <div className="p-3 border rounded">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Modules</h3>
            <div>
              <button type="button" onClick={addModule} className="px-3 py-1 border rounded">+ Add Module</button>
            </div>
          </div>

          <div className="space-y-4">
            {modules.map((mod, mi) => (
              <div key={mod.id} className="p-3 border rounded bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium">Module Title</label>
                    <input value={mod.title} onChange={(e) => setModuleTitle(mod.id, e.target.value)} className="mt-1 w-full p-2 border rounded" placeholder={`Module ${mi + 1} title`} />
                  </div>

                  <div className="flex flex-col gap-2 ml-3">
                    <button type="button" onClick={() => removeModule(mod.id)} className="text-sm px-2 py-1 border rounded bg-red-50">Remove</button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Topics we will cover (ordered)</div>
                    <button type="button" onClick={() => addTopic(mod.id)} className="px-2 py-1 text-sm border rounded">+ Add Topic</button>
                  </div>

                  <ol className="list-decimal list-inside space-y-2">
                    {mod.topics.map((t, ti) => (
                      <li key={t.id} className="flex items-start gap-2">
                        <div className="flex-1">
                          <input value={t.text} onChange={(e) => setTopicText(mod.id, t.id, e.target.value)} className="w-full p-2 border rounded" placeholder={`Topic ${ti + 1}`} />
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-1">
                            <button type="button" onClick={() => moveTopic(mod.id, ti, "up")} className="px-2 py-1 border rounded disabled:opacity-50" disabled={ti === 0}>↑</button>
                            <button type="button" onClick={() => moveTopic(mod.id, ti, "down")} className="px-2 py-1 border rounded disabled:opacity-50" disabled={ti === mod.topics.length - 1}>↓</button>
                          </div>
                          <button type="button" onClick={() => removeTopic(mod.id, t.id)} className="px-2 py-1 text-sm border rounded bg-red-50">Remove</button>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* submit */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className={`px-4 py-2 rounded text-white ${submitting ? "bg-gray-400" : "bg-blue-600"}`}>{submitting ? "Creating..." : "Create Course"}</button>
          {message ? <div className="text-sm text-slate-600">{message}</div> : null}
        </div>
      </form>
    </div>
  );
}
