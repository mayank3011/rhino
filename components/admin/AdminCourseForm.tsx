// components/admin/AdminCourseForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { mutate } from "swr";

type FormData = {
  _id?: string;
  title: string;
  slug: string;
  description?: string;
  niche?: string;
  category?: string;
  price?: number;
  image?: string | null;
  imagePublicId?: string | null;
  published?: boolean;
};

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const UPLOAD_TIMEOUT_MS = 30_000; // 30s

export default function AdminCourseForm({
  initialData,
  onSaved,
}: {
  initialData?: Partial<FormData>;
  onSaved?: () => void;
}) {
  const { register, handleSubmit, reset, setValue, setError } = useForm<FormData>({
    defaultValues:
      initialData || {
        title: "",
        slug: "",
        description: "",
        niche: "",
        category: "",
        price: 0,
        image: null,
        imagePublicId: null,
        published: true,
      },
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialData?.image ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-upload when a file is selected. If you prefer manual upload, set this false.
  const AUTO_UPLOAD_ON_SELECT = true;

  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([k, v]) => {
        // @ts-ignore
        setValue(k, v);
      });
      setPreview(initialData.image ?? null);
    }
  }, [initialData, setValue]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Upload helper: tries form-data path first, then falls back to base64 JSON
  async function uploadFileImpl(fileToUpload: File, signal?: AbortSignal) {
    if (!fileToUpload) throw new Error("No file selected");
    if (!fileToUpload.type.startsWith("image/")) throw new Error("Only image files are allowed");
    if (fileToUpload.size > MAX_UPLOAD_BYTES) throw new Error("File too large (max 5 MB)");

    // Build form-data
    const fd = new FormData();
    fd.append("file", fileToUpload);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
        signal,
      });

      // Try parse JSON; if server returned HTML, we will catch below
      const json = await res.json().catch(async () => {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Upload failed with status ${res.status}`);
      });

      if (!res.ok) {
        const errMsg = json?.error || json?.detail || `Upload failed (${res.status})`;
        throw new Error(errMsg);
      }

      if (!json?.url) throw new Error("Upload succeeded but server didn't return url");

      return json;
    } catch (e: any) {
      // If the server didn't accept form-data (some runtimes), fallback to base64 JSON
      // Only do fallback if error indicates no file received or non-json; otherwise rethrow
      const msg = String(e?.message ?? e);
      // if server says "no_file_received" or generic upload_failed, try fallback
      if (msg.includes("no_file_received") || msg.includes("upload_failed") || msg.includes("non-JSON") || msg.includes("Unexpected end")) {
        // fallback to dataURL
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(fileToUpload);
          });

          const res2 = await fetch("/api/admin/upload", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ fileBase64: dataUrl, filename: fileToUpload.name }),
            credentials: "include",
            signal,
          });

          const json2 = await res2.json().catch(async () => {
            const t = await res2.text().catch(() => "");
            throw new Error(t || `Upload fallback failed (${res2.status})`);
          });

          if (!res2.ok) {
            const errMsg2 = json2?.error || json2?.detail || `Upload fallback failed (${res2.status})`;
            throw new Error(errMsg2);
          }

          if (!json2?.url) throw new Error("Fallback upload returned no url");

          return json2;
        } catch (err2: any) {
          throw new Error(err2?.message || "Upload fallback failed");
        }
      }

      // rethrow original error
      throw e;
    }
  }

  // public wrapper with timeout + toasts
  async function uploadFile(fileToUpload: File) {
    setUploading(true);
    toast.loading("Uploading image...", { id: "upload" });
    setUploadResult(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    try {
      const res = await uploadFileImpl(fileToUpload, controller.signal);
      clearTimeout(timeout);
      // res expected to contain url & public_id
      setValue("image", res.url);
      setValue("imagePublicId", res.public_id ?? null);
      setPreview(res.url);
      setUploadResult(res);
      toast.success("Image uploaded", { id: "upload" });
      return res;
    } catch (err: any) {
      clearTimeout(timeout);
      console.error("uploadFile error:", err);
      const message = err?.message || String(err) || "Upload failed";
      toast.error(message, { id: "upload" });
      // bubble up
      throw err;
    } finally {
      setUploading(false);
    }
  }

  // If AUTO_UPLOAD_ON_SELECT, upload immediately when user selects file
  useEffect(() => {
    if (!AUTO_UPLOAD_ON_SELECT) return;
    if (!file) return;
    // If file is already uploaded (image value present) skip
    const currentImageValue = ((): string | null => {
      try {
        // @ts-ignore
        return (initialData && initialData.image) || null;
      } catch {
        return null;
      }
    })();
    // always attempt to upload the selected file
    uploadFile(file).catch((err) => {
      // set form error visible on upload failure
      setError("image", { type: "manual", message: err?.message ?? "Upload failed" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      let payload = { ...data };

      // If file selected but no payload.image (not uploaded yet) — upload now
      if (file && !payload.image) {
        try {
          const uploaded = await uploadFile(file);
          payload.image = uploaded.url;
          payload.imagePublicId = uploaded.public_id ?? null;
        } catch (err: any) {
          setError("image", { type: "manual", message: err.message || "Upload failed" });
          return;
        }
      }

      // Submit create/update course
      const res = await fetch(data._id ? `/api/admin/courses/${data._id}` : "/api/admin/courses", {
        method: data._id ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422 && json?.issues) {
          for (const key of Object.keys(json.issues)) {
            const msg = json.issues[key]?.[0] ?? "Invalid";
            if (key === "_error") toast.error(msg);
            else setError(key as any, { type: "server", message: msg });
          }
          toast.error("Validation errors — check the form");
          return;
        }
        throw new Error(json?.error || `Save failed (${res.status})`);
      }

      toast.success(data._id ? "Course updated" : "Course created");
      mutate("/api/admin/courses");
      if (!data._id) {
        reset();
        setFile(null);
        setPreview(null);
      }
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error("Save failed:", err);
      toast.error(err.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border p-4 rounded max-w-2xl">
      <input type="hidden" {...register("_id")} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input {...register("title", { required: "Title is required" })} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input {...register("slug", { required: "Slug is required" })} className="w-full p-2 border rounded" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Description</label>
          <textarea {...register("description")} className="w-full p-2 border rounded" rows={4} />
        </div>

        <div>
          <label className="text-sm">Niche</label>
          <input {...register("niche")} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="text-sm">Category</label>
          <input {...register("category")} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="text-sm">Price</label>
          <input type="number" {...register("price", { valueAsNumber: true })} className="w-full p-2 border rounded" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm">Image</label>
          <div className="flex gap-2 items-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f) {
                  setValue("image", "");
                  setValue("imagePublicId", null);
                }
              }}
            />

            <button
              type="button"
              disabled={!file || uploading}
              onClick={async () => {
                if (!file) return;
                try {
                  await uploadFile(file);
                } catch (err: any) {
                  setError("image", { type: "manual", message: err?.message ?? "Upload failed" });
                }
              }}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload image"}
            </button>

            <div className="text-sm text-slate-500 ml-2">Max 5MB</div>
          </div>

          {preview && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="max-w-xs rounded shadow" />
            </div>
          )}

          {uploadResult && (
            <div className="mt-2 text-sm text-slate-700">
              <div>Uploaded: {uploadResult.public_id ?? "—"}</div>
              <div className="text-xs text-slate-500 break-words">{uploadResult.url}</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" {...register("published")} className="h-4 w-4" />
          <label>Published</label>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button disabled={submitting} type="submit" className="btn-primary">
          {submitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setFile(null);
            setPreview(null);
            setUploadResult(null);
          }}
          className="btn-outline"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
