'use client';

import { useState } from 'react';

interface Order {
  id: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';
  deliverySlot: string;
  ecoDelivery: boolean;
}

const STATUS_STEPS = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  confirmed: '✅ Confirmed',
  preparing: '🥗 Preparing',
  out_for_delivery: '🚚 Out for Delivery',
  delivered: '📦 Delivered',
};

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2026-001',
    date: '30 Apr 2026, 11:45 AM',
    items: [
      { name: 'Fresh Organic Tomatoes', qty: 2, price: 45 },
      { name: 'Green Spinach Bundle', qty: 1, price: 30 },
      { name: 'Basmati Rice 1kg', qty: 1, price: 180 },
    ],
    total: 300,
    status: 'out_for_delivery',
    deliverySlot: 'Morning 6-9 AM',
    ecoDelivery: true,
  },
  {
    id: 'ORD-2026-002',
    date: '28 Apr 2026, 3:20 PM',
    items: [
      { name: 'Alphonso Mangoes', qty: 1, price: 250 },
      { name: 'Organic Bananas', qty: 2, price: 55 },
    ],
    total: 360,
    status: 'delivered',
    deliverySlot: 'Evening 5-8 PM',
    ecoDelivery: false,
  },
  {
    id: 'ORD-2026-003',
    date: '25 Apr 2026, 9:10 AM',
    items: [
      { name: 'Red Apples', qty: 3, price: 120 },
      { name: 'Cold Pressed Olive Oil', qty: 1, price: 350 },
    ],
    total: 710,
    status: 'delivered',
    deliverySlot: 'Morning 6-9 AM',
    ecoDelivery: true,
  },
];

function StatusTracker({ status }: { status: string }) {
  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-1 mt-4">
      {STATUS_STEPS.map((step, i) => {
        const isActive = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                    : 'bg-gray-200 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}`}
              >
                {isActive ? '✓' : i + 1}
              </div>
              <p className={`text-xs mt-1.5 text-center ${isActive ? 'text-green-700 font-semibold' : 'text-gray-400'}`}>
                {STATUS_LABELS[step]?.split(' ').slice(1).join(' ')}
              </p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-1 flex-1 rounded-full mx-1 ${i < currentIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const activeOrders = MOCK_ORDERS.filter((o) => o.status !== 'delivered');
  const completedOrders = MOCK_ORDERS.filter((o) => o.status === 'delivered');
  const displayOrders = activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">📋 My Orders</h1>
        <p className="text-gray-500 mb-8">Track your deliveries and view order history.</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-green-600 text-white shadow-md shadow-green-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-green-50'
            }`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-green-600 text-white shadow-md shadow-green-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-green-50'
            }`}
          >
            History ({completedOrders.length})
          </button>
        </div>

        {/* Orders */}
        {displayOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-5xl block mb-4">{activeTab === 'active' ? '🎉' : '📦'}</span>
            <p className="text-lg font-bold text-gray-900">
              {activeTab === 'active' ? 'No active orders' : 'No order history yet'}
            </p>
            <p className="text-gray-500 mt-1">
              {activeTab === 'active' ? 'All your orders have been delivered!' : 'Your completed orders will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.id}</h3>
                    <p className="text-sm text-gray-400">{order.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.ecoDelivery && (
                      <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">🌱 Eco</span>
                    )}
                    <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">🕐 {order.deliverySlot}</span>
                    <span className="text-lg font-extrabold text-green-600">₹{order.total}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {order.items.map((item, i) => (
                    <span key={i} className="bg-gray-50 text-gray-700 text-xs px-3 py-1.5 rounded-lg border border-gray-100">
                      {item.name} × {item.qty}
                    </span>
                  ))}
                </div>

                {/* Status Tracker */}
                <StatusTracker status={order.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
