// models/Course.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// TypeScript interfaces
export interface ITopic {
  _id: mongoose.Types.ObjectId;
  text: string;
  order: number;
}

export interface IModule {
  _id: mongoose.Types.ObjectId;
  title: string;
  order: number;
  topics: ITopic[];
}

export interface IMentor {
  name: string;
  image: string;
  imagePublicId: string;
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  niche: string;
  category: mongoose.Types.ObjectId | null;
  price: number;
  image: string;
  imagePublicId: string;
  mentor: IMentor;
  startTime: Date | null;
  duration: string;
  keyOutcomes: string[];
  published: boolean;
  modules: IModule[];
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schemas
const TopicSchema = new Schema<ITopic>(
  {
    text: { type: String, default: "" },
    order: { type: Number, default: 0 }
  },
  { _id: true }
);

const ModuleSchema = new Schema<IModule>(
  {
    title: { type: String, default: "" },
    order: { type: Number, default: 0 },
    topics: { type: [TopicSchema], default: [] }
  },
  { _id: true }
);

const MentorSchema = new Schema<IMentor>(
  {
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    imagePublicId: { type: String, default: "" }
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    slug: { type: String, default: "" }, // server ensures uniqueness
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    niche: { type: String, default: "" },
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    price: { type: Number, default: 0 },
    image: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    mentor: { type: MentorSchema, default: () => ({}) },
    startTime: { type: Date, default: null },
    duration: { type: String, default: "" },
    keyOutcomes: { type: [String], default: [] },
    published: { type: Boolean, default: true },
    modules: { type: [ModuleSchema], default: [] },
  },
  { timestamps: true }
);

// Create and export the model with proper typing
const Course: Model<ICourse> = mongoose.models.Course as Model<ICourse> || mongoose.model<ICourse>("Course", CourseSchema);

export default Course;