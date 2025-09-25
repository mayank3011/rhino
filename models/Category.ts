import mongoose, { Schema, Document, Model } from "mongoose";

interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    maxlength: 100
  },
}, { timestamps: true });

CategorySchema.index({ name: 1 });

interface ICategoryModel extends Model<ICategory> {
  findByName(name: string): Promise<ICategory | null>;
}

CategorySchema.statics.findByName = function(name: string) {
  return this.findOne({ name: name.trim() });
};

const Category: ICategoryModel = (mongoose.models.Category as ICategoryModel) || 
  mongoose.model<ICategory, ICategoryModel>("Category", CategorySchema);

export default Category;
export type { ICategory, ICategoryModel };