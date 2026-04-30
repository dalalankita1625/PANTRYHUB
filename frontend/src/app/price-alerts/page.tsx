'use client';

import { useState } from 'react';

interface PriceAlert {
  id: string;
  productName: string;
  imageUrl: string;
  currentPrice: number;
  previousPrice: number;
  dropPercent: number;
  timeAgo: string;
}

const MOCK_ALERTS: PriceAlert[] = [
  { id: '1', productName: 'Fresh Organic Tomatoes', imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop', currentPrice: 38, previousPrice: 45, dropPercent: 16, timeAgo: '2 hours ago' },
  { id: '2', productName: 'Red Apples', imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop', currentPrice: 99, previousPrice: 120, dropPercent: 18, timeAgo: '5 hours ago' },
  { id: '3', productName: 'Basmati Rice 1kg', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop', currentPrice: 155, previousPrice: 180, dropPercent: 14, timeAgo: '1 day ago' },
  { id: '4', productName: 'Cold Pressed Olive Oil', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop', currentPrice: 299, previousPrice: 350, dropPercent: 15, timeAgo: '3 hours ago' },
  { id: '5', productName: 'Organic Bananas', imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop', currentPrice: 42, previousPrice: 55, dropPercent: 24, timeAgo: '30 mins ago' },
];

const WEEKLY_LOWS = [
  { name: 'Spinach', price: 22, usual: 30 },
  { name: 'Carrots', price: 28, usual: 35 },
  { name: 'Green Peas', price: 32, usual: 40 },
];

export default function PriceAlertsPage() {
  const [emailSubscribed, setEmailSubscribed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">💰 Price Drop Alerts</h1>
        <p className="text-gray-500 mb-10">Never miss a deal. Smart notifications for the best prices.</p>

        {/* Subscribe Banner */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-6 mb-10 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">🔔 Get Weekly Price Alerts</h2>
            <p className="text-green-100 text-sm">Subscribe to receive lowest price notifications every week.</p>
          </div>
          <button
            onClick={() => setEmailSubscribed(!emailSubscribed)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer ${
              emailSubscribed
                ? 'bg-white text-green-600'
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
            }`}
          >
            {emailSubscribed ? '✓ Subscribed' : 'Subscribe'}
          </button>
        </div>

        {/* Recent Price Drops */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">🔥 Recent Price Drops</h2>
        <div className="space-y-4 mb-12">
          {MOCK_ALERTS.map((alert) => (
            <div key={alert.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img src={alert.imageUrl} alt={alert.productName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{alert.productName}</h3>
                <p className="text-xs text-gray-400">{alert.timeAgo}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 line-through">₹{alert.previousPrice}</p>
                <p className="text-xl font-bold text-green-600">₹{alert.currentPrice}</p>
              </div>
              <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold">
                ↓ {alert.dropPercent}%
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Lowest Prices */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">📉 This Week&apos;s Lowest Prices</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {WEEKLY_LOWS.map((item) => (
            <div key={item.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <p className="text-3xl font-extrabold text-green-600 mb-1">₹{item.price}</p>
              <p className="font-semibold text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-400 mt-1">Usually ₹{item.usual}</p>
              <div className="mt-3 bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full inline-block">
                Save ₹{item.usual - item.price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
