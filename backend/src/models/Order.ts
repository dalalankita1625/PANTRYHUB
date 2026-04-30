import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  deliveryFee: number;
  ecoDelivery: boolean;
  deliverySlot: string;
  paymentMethod: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';
  address: string;
  createdAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  imageUrl: { type: String },
});

const OrderSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  totalPrice: { type: Number, required: true },
  deliveryFee: { type: Number, default: 30 },
  ecoDelivery: { type: Boolean, default: false },
  deliverySlot: { type: String, default: 'morning' },
  paymentMethod: { type: String, default: 'upi' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'],
    default: 'pending',
  },
  address: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IOrder>('Order', OrderSchema);
