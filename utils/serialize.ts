// utils/serialize.js

/**
 * Serialize MongoDB documents to plain objects for Next.js Client Components
 */
export function serializeDoc(doc: any): any {
  if (doc === null || doc === undefined) {
    return doc;
  }
  
  if (doc instanceof Date) {
    return doc.toISOString();
  }
  
  // Handle MongoDB ObjectId - check for toString method and convert
  if (doc && typeof doc === 'object' && typeof doc.toString === 'function' && doc._bsontype) {
    return doc.toString();
  }
  
  // Handle Buffer objects (convert to string or remove)
  if (doc && doc.constructor && doc.constructor.name === 'Buffer') {
    return doc.toString('hex'); // or return null if you don't need it
  }
  
  // Handle plain objects
  if (doc && typeof doc === 'object' && doc.constructor === Object) {
    const serialized: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(doc)) {
      serialized[key] = serializeDoc(value);
    }
    return serialized;
  }
  
  // Handle arrays
  if (Array.isArray(doc)) {
    return doc.map(serializeDoc);
  }
  
  // Return primitive values as-is
  return doc;
}

/**
 * Serialize an array of MongoDB documents
 */
export function serializeArray(array) {
  if (!Array.isArray(array)) {
    return [];
  }
  
  return array.map(item => serializeDoc(item));
}

/**
 * Specifically for Course documents - explicit serialization
 */
export function serializeCourses(courses) {
  return courses.map(course => ({
    _id: course._id.toString(),
    title: course.title || '',
    slug: course.slug || '',
    description: course.description || '',
    niche: course.niche || '',
    category: course.category || '',
    price: course.price || 0,
    image: course.image || '',
    imagePublicId: course.imagePublicId || '',
    published: Boolean(course.published),
    createdAt: course.createdAt?.toISOString() || null,
    updatedAt: course.updatedAt?.toISOString() || null,
    __v: course.__v || 0,
  }));
}