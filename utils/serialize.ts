// utils/serialize.ts
import { ObjectId } from "mongoose";

/**
 * Raw DB document shapes (input from mongoose .lean() etc.)
 * kept un-exported because they are internal helpers.
 */
interface RawTopic {
  _id?: ObjectId | string;
  text?: string;
  order?: number;
}

interface RawModule {
  _id?: ObjectId | string;
  title?: string;
  order?: number;
  topics?: RawTopic[];
}

interface RawMentor {
  name?: string;
  image?: string;
  imagePublicId?: string;
}

interface RawCategory {
  _id?: ObjectId | string;
  name?: string;
}

interface RawDocument {
  _id?: ObjectId | string;
  title?: string;
  description?: string;
  niche?: string;
  price?: number;
  image?: string;
  imagePublicId?: string;
  published?: boolean;
  duration?: string;
  startTime?: Date | string;
  keyOutcomes?: string[];
  mentor?: RawMentor;
  modules?: RawModule[];
  category?: RawCategory | ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

/**
 * Exported serialized types (output shape after serialization)
 * Exported so other files can import them for typing.
 */
export interface SerializedTopic {
  _id: string | null;
  text: string;
  order: number;
}

export interface SerializedModule {
  _id: string | null;
  title: string;
  order: number;
  topics: SerializedTopic[];
}

export interface SerializedMentor {
  name: string;
  image: string;
  imagePublicId: string;
}

export interface SerializedDocument {
  _id: string | null;
  title: string;
  description: string;
  niche: string;
  price: number;
  image: string;
  imagePublicId: string;
  published: boolean;
  duration: string;
  startTime: string | null;
  keyOutcomes: string[];
  mentor: SerializedMentor;
  modules: SerializedModule[];
  category: string | null;
  categoryName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  __v: number;
}

/** Safe string conversion for ObjectIds and other values */
function safeToString(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  if (typeof value === "string") return value;

  if (typeof value === "object" && value !== null) {
    const obj = value as { toString?: () => string };
    if (typeof obj.toString === "function") {
      try {
        return obj.toString();
      } catch {
        return null;
      }
    }
  }

  try {
    return String(value);
  } catch {
    return null;
  }
}

/** Safe date conversion to ISO string */
function safeToISOString(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  try {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === "string") {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString();
      return null;
    }

    if (typeof value === "object" && value !== null) {
      const obj = value as { toISOString?: () => string };
      if (typeof obj.toISOString === "function") {
        try {
          return obj.toISOString();
        } catch {
          return null;
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** Serialize a single topic */
function serializeTopic(topic: RawTopic): SerializedTopic {
  return {
    _id: safeToString(topic._id),
    text: topic?.text || "",
    order: typeof topic?.order === "number" ? topic.order : 0,
  };
}

/** Serialize a single module */
function serializeModule(module: RawModule): SerializedModule {
  return {
    _id: safeToString(module._id),
    title: module?.title || "",
    order: typeof module?.order === "number" ? module.order : 0,
    topics: Array.isArray(module?.topics) ? module.topics.map(serializeTopic) : [],
  };
}

/** Serialize mentor information */
function serializeMentor(mentor: RawMentor | undefined): SerializedMentor {
  return {
    name: mentor?.name || "",
    image: mentor?.image || "",
    imagePublicId: mentor?.imagePublicId || "",
  };
}

/** Extract category information robustly */
function extractCategoryInfo(category: RawCategory | ObjectId | string | undefined): {
  categoryId: string | null;
  categoryName: string | null;
} {
  if (!category) {
    return { categoryId: null, categoryName: null };
  }

  if (typeof category === "string") {
    return { categoryId: category, categoryName: null };
  }

  if (typeof category === "object") {
    // If it's a RawCategory with a name, prefer that
    const cat = category as RawCategory;
    return {
      categoryId: safeToString(cat._id ?? category),
      categoryName: cat.name ?? null,
    };
  }

  return { categoryId: safeToString(category), categoryName: null };
}

/** Serialize a single document */
export function serializeDoc(doc: unknown): SerializedDocument | null {
  if (!doc || typeof doc !== "object") return null;

  const rawDoc = doc as RawDocument;
  const { categoryId, categoryName } = extractCategoryInfo(rawDoc.category);

  return {
    _id: safeToString(rawDoc._id),
    title: rawDoc.title || "",
    description: rawDoc.description || "",
    niche: rawDoc.niche || "",
    price: typeof rawDoc.price === "number" ? rawDoc.price : 0,
    image: rawDoc.image || "",
    imagePublicId: rawDoc.imagePublicId || "",
    published: Boolean(rawDoc.published),
    duration: rawDoc.duration || "",
    startTime:
      typeof rawDoc.startTime === "string" ? rawDoc.startTime : safeToISOString(rawDoc.startTime),
    keyOutcomes: Array.isArray(rawDoc.keyOutcomes) ? rawDoc.keyOutcomes : [],
    mentor: serializeMentor(rawDoc.mentor),
    modules: Array.isArray(rawDoc.modules) ? rawDoc.modules.map(serializeModule) : [],
    category: categoryId,
    categoryName: categoryName,
    createdAt: safeToISOString(rawDoc.createdAt),
    updatedAt: safeToISOString(rawDoc.updatedAt),
    __v: typeof rawDoc.__v === "number" ? rawDoc.__v : 0,
  };
}

/**
 * Generic serializeArray: callers can pass a target type T and receive T[].
 * Default T is SerializedDocument for backward compatibility.
 *
 * Note: runtime behavior unchanged — we map with serializeDoc and filter nulls.
 * The final cast to T[] is safe when callers pick a T matching the serialized shape.
 */
export function serializeArray<T = SerializedDocument>(arr: unknown): T[] {
  if (!Array.isArray(arr)) return [];
  const serialized = arr
    .map(serializeDoc)
    .filter((doc): doc is SerializedDocument => doc !== null);

  // Cast here because we've already normalized runtime data to SerializedDocument.
  return serialized as unknown as T[];
}

/** Alias kept for backward compatibility */
export function serializeCourses<T = SerializedDocument>(courses: unknown): T[] {
  return serializeArray<T>(courses);
}

/** Type guard convenience */
export function isSerializedDocument(value: unknown): value is SerializedDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as SerializedDocument)._id === "string" &&
    typeof (value as SerializedDocument).title === "string"
  );
}
