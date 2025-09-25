// utils/serialize.ts
export function serializeDoc(doc: any): any {
  if (!doc) return doc;
  const c: any = doc;
  const base: any = {
    _id: c._id?.toString?.() || null,
    title: c.title || "",
    description: c.description || "",
    niche: c.niche || "",
    price: c.price ?? 0,
    image: c.image || "",
    imagePublicId: c.imagePublicId || "",
    published: Boolean(c.published),
    duration: c.duration || "",
    startTime: c.startTime ? (typeof c.startTime === "string" ? c.startTime : new Date(c.startTime).toISOString()) : null,
    keyOutcomes: Array.isArray(c.keyOutcomes) ? c.keyOutcomes : [],
    mentor: {
      name: c.mentor?.name || "",
      image: c.mentor?.image || "",
      imagePublicId: c.mentor?.imagePublicId || "",
    },
    modules: (c.modules || []).map((m: any) => ({
      _id: m._id?.toString?.() || null,
      title: m.title || "",
      order: typeof m.order === "number" ? m.order : 0,
      topics: (m.topics || []).map((t: any) => ({
        _id: t._id?.toString?.() || null,
        text: t.text || "",
        order: typeof t.order === "number" ? t.order : 0,
      })),
    })),
    category: c.category ? String(c.category._id || c.category) : null,
    categoryName: c.category?.name ?? null,
    createdAt: c.createdAt?.toISOString?.() || null,
    updatedAt: c.updatedAt?.toISOString?.() || null,
    __v: c.__v || 0,
  };
  return base;
}

export function serializeArray(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((d) => serializeDoc(d));
}

export function serializeCourses(courses: any[]) {
  return serializeArray(courses);
}
