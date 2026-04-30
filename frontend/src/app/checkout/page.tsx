'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { useState } from 'react';

export default function CheckoutPage() {
  const { items, totalPrice, updateQuantity, removeFromCart } = useCart();
  const [deliverySlot, setDeliverySlot] = useState('morning');
  const [ecoDelivery, setEcoDelivery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const deliveryFee = ecoDelivery ? 0 : 30;
  const ecoDiscount = ecoDelivery ? 15 : 0;
  const finalTotal = totalPrice + deliveryFee - ecoDiscount;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">🛒</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some fresh products before checking out!</p>
          <a href="/products" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
            Browse Products
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Cart Items & Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Your Items ({items.length})</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item._id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">{item.freshnessScore}% Fresh</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.source}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold cursor-pointer">−</button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center font-bold cursor-pointer">+</button>
                    </div>
                    <p className="font-bold text-gray-900 w-20 text-right">₹{item.price * item.quantity}</p>
                    <button onClick={() => removeFromCart(item._id)} className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer text-lg">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Slot */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📦 Delivery Slot</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'morning', label: 'Morning Harvest', time: '6 AM – 9 AM', emoji: '🌅' },
                  { value: 'afternoon', label: 'Afternoon Batch', time: '12 PM – 3 PM', emoji: '☀️' },
                  { value: 'evening', label: 'Evening Fresh', time: '5 PM – 8 PM', emoji: '🌆' },
                ].map((slot) => (
                  <button
                    key={slot.value}
                    onClick={() => setDeliverySlot(slot.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      deliverySlot === slot.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <span className="text-2xl">{slot.emoji}</span>
                    <p className="font-semibold text-gray-900 mt-2">{slot.label}</p>
                    <p className="text-sm text-gray-500">{slot.time}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Eco Delivery */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">🌱 Eco-Friendly Delivery</h2>
                  <p className="text-sm text-gray-500 mt-1">Plastic-free packaging with reusable crates. Free delivery + ₹15 discount!</p>
                </div>
                <button
                  onClick={() => setEcoDelivery(!ecoDelivery)}
                  className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 cursor-pointer ${ecoDelivery ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${ecoDelivery ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">💳 Payment Method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'upi', label: 'UPI', desc: 'GPay, PhonePe, Paytm' },
                  { value: 'card', label: 'Card', desc: 'Debit / Credit Card' },
                  { value: 'cod', label: 'Cash on Delivery', desc: 'Pay at doorstep' },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      paymentMethod === method.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{method.label}</p>
                    <p className="text-sm text-gray-500">{method.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className={`font-medium ${ecoDelivery ? 'text-green-600' : ''}`}>
                    {ecoDelivery ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                {ecoDelivery && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">🌱 Eco Discount</span>
                    <span className="font-medium text-green-600">-₹{ecoDiscount}</span>
                  </div>
                )}
                <hr className="border-gray-100" />
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-extrabold text-green-600">₹{finalTotal}</span>
                </div>
              </div>

              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer">
                Place Order
              </button>

              <p className="text-xs text-center text-gray-400 mt-4">
                🔒 Your payment info is secure and encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
