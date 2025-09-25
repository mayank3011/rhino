// types/course.ts
// Application-level types (without mongoose-specific properties)

export interface Topic {
  _id?: string;
  text: string;
  order: number;
}

export interface Module {
  _id?: string;
  title: string;
  order: number;
  topics: Topic[];
}

export interface Mentor {
  name: string;
  image: string;
  imagePublicId: string;
}

export interface Course {
  _id?: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  niche: string;
  category: string | null;
  price: number;
  image: string;
  imagePublicId: string;
  mentor: Mentor;
  startTime: string | null; // ISO string for frontend use
  duration: string;
  keyOutcomes: string[];
  published: boolean;
  modules: Module[];
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}

// API response types
export interface CourseResponse {
  success: boolean;
  data?: Course;
  error?: string;
  message?: string;
}

export interface CoursesResponse {
  success: boolean;
  data?: Course[];
  error?: string;
  message?: string;
}

// Form types for course creation/editing
export interface CourseFormData {
  title: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  niche: string;
  category: string;
  price: number;
  image: string;
  imagePublicId: string;
  mentor: Mentor;
  startTime: string | null;
  duration: string;
  keyOutcomes: string[];
  published: boolean;
  modules: Module[];
}

// Utility types
export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

// Extended course type with additional computed properties
export interface ExtendedCourse extends Course {
  discountedPrice?: number;
  enrollmentCount?: number;
  rating?: number;
  level?: CourseLevel;
  status?: CourseStatus;
}



export interface IMentor {
  name: string;
  image?: string;
}

export interface ICourse {
  _id: string;
  title: string;
  slug?: string; // optional — choose required if your domain guarantees presence
  image?: string;
  mentor?: IMentor;
  metaTitle?: string;
  metaDescription?: string;
  niche?: string;
  categoryName?: string;
  description?: string;
  duration?: string;
  startTime?: string;
  price?: number;
  keyOutcomes?: string[];
}