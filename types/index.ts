// types/index.ts

import { ObjectId } from 'mongoose';

export interface Course {
  _id: string | ObjectId;
  title: string;
  description: string;
  slug: string;
  niche?: string;
  price: number;
  published: boolean;
  startTime?: Date;
  duration?: string;
  keyOutcomes?: string[];
  mentor?: {
    name: string;
    image: string;
    imagePublicId: string;
  };
  image?: string;
  imagePublicId?: string;
  metaTitle?: string;
  metaDescription?: string;
  category?: string | ObjectId;
  modules?: CourseModule[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseModule {
  title: string;
  order: number;
  topics: CourseTopic[];
}

export interface CourseTopic {
  text: string;
  order: number;
}

export interface Category {
  _id: string | ObjectId;
  name: string;
  slug: string;
  description?: string;
}

export interface Registration {
  _id: string | ObjectId;
  courseId: string | ObjectId;
  name: string;
  email: string;
  phone: string;
  screenshot?: string;
  screenshotPublicId?: string;
  verified: boolean;
  registeredAt: Date;
  course?: Course;
}

export interface PromoCode {
  _id: string | ObjectId;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  active: boolean;
  expiresAt?: Date;
  usedBy?: string[];
  createdAt: Date;
}

export interface User {
  _id: string | ObjectId;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

// Form types
export interface CourseFormData {
  title: string;
  description: string;
  slug: string;
  niche: string;
  price: number;
  published: boolean;
  startTime: string;
  duration: string;
  keyOutcomes: string[];
  mentor: {
    name: string;
    image: string;
    imagePublicId: string;
  };
  image: string;
  imagePublicId: string;
  metaTitle: string;
  metaDescription: string;
  categoryId: string;
  modules: CourseModule[];
}

export interface RegistrationFormData {
  name: string;
  email: string;
  phone: string;
  screenshot?: File;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

// Event handler types
export type FormSubmitHandler<T = unknown> = (data: T) => void | Promise<void>;
export type ChangeHandler<T = unknown> = (value: T) => void;
export type ClickHandler = () => void | Promise<void>;