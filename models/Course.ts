// models/Course.ts
import mongoose, { Schema } from "mongoose";

const TopicSchema = new Schema(
  { text: { type: String, default: "" }, order: { type: Number, default: 0 } },
  { _id: true }
);

const ModuleSchema = new Schema(
  { title: { type: String, default: "" }, order: { type: Number, default: 0 }, topics: { type: [TopicSchema], default: [] } },
  { _id: true }
);

const MentorSchema = new Schema(
  { name: { type: String, default: "" }, image: { type: String, default: "" }, imagePublicId: { type: String, default: "" } },
  { _id: false }
);

const CourseSchema = new Schema(
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

export default (mongoose.models.Course as mongoose.Model<any>) || mongoose.model("Course", CourseSchema);
