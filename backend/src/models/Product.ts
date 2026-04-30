import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: 'Vegetables' | 'Fruits' | 'Grocery';
  imageUrl: string;
  stock: number;
  freshnessScore: number;
  source: 'Warehouse' | 'Farmer';
  farmerId?: mongoose.Types.ObjectId;
  harvestTime?: Date;
  qualityGrade?: 'A' | 'B' | 'C';
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, enum: ['Vegetables', 'Fruits', 'Grocery'], required: true },
  imageUrl: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  freshnessScore: { type: Number, required: true, default: 100 },
  source: { type: String, enum: ['Warehouse', 'Farmer'], default: 'Warehouse' },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  harvestTime: { type: Date },
  qualityGrade: { type: String, enum: ['A', 'B', 'C'] },
});

export default mongoose.model<IProduct>('Product', ProductSchema);
