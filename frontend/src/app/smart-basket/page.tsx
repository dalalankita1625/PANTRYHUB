'use client';

import { useCart } from '@/context/CartContext';

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-extrabold text-gray-900">{score}</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold text-gray-700">{label}</p>
    </div>
  );
}

export default function SmartBasketPage() {
  const { items, totalPrice } = useCart();

  // Calculate Health Score based on category mix
  const veggieCount = items.filter(i => i.name.toLowerCase().includes('spinach') || i.name.toLowerCase().includes('broccoli') || i.name.toLowerCase().includes('carrot') || i.name.toLowerCase().includes('peas') || i.name.toLowerCase().includes('tomato')).length;
  const fruitCount = items.filter(i => i.name.toLowerCase().includes('mango') || i.name.toLowerCase().includes('apple') || i.name.toLowerCase().includes('banana') || i.name.toLowerCase().includes('strawberr')).length;
  const totalCount = items.length || 1;
  const healthScore = items.length === 0 ? 0 : Math.min(100, Math.round(((veggieCount + fruitCount) / totalCount) * 100 + 10));

  // Budget Score (lower price = better score, max ₹2000 considered expensive)
  const budgetScore = items.length === 0 ? 0 : Math.max(10, Math.min(100, Math.round(100 - (totalPrice / 2000) * 100)));

  // Waste Score based on freshness (higher freshness = less waste)
  const avgFreshness = items.length === 0 ? 0 : Math.round(items.reduce((sum, i) => sum + i.freshnessScore, 0) / items.length);
  const wasteScore = items.length === 0 ? 0 : avgFreshness;

  const overallScore = items.length === 0 ? 0 : Math.round((healthScore + budgetScore + wasteScore) / 3);

  const tips = [
    healthScore < 70 && '🥬 Add more vegetables and fruits to boost your health score!',
    budgetScore < 50 && '💡 Consider removing premium items to optimize your budget.',
    wasteScore < 80 && '⚠️ Some items have lower freshness — consume them first to reduce waste.',
    healthScore >= 70 && budgetScore >= 50 && wasteScore >= 80 && '🎉 Great job! Your basket is well-balanced!',
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">📊 Smart Basket Score</h1>
        <p className="text-gray-500 mb-10">Your cart analyzed for health, budget, and sustainability.</p>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-6xl block mb-4">📊</span>
            <p className="text-xl font-bold text-gray-900 mb-2">No items to analyze</p>
            <p className="text-gray-500 mb-6">Add products to your cart to see your Smart Basket Score.</p>
            <a href="/products" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Browse Products</a>
          </div>
        ) : (
          <>
            {/* Overall Score */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8 text-center">
              <p className="text-sm font-medium text-gray-500 mb-4">OVERALL BASKET SCORE</p>
              <div className="flex justify-center mb-4">
                <ScoreRing score={overallScore} label="" color={overallScore >= 70 ? '#22c55e' : overallScore >= 40 ? '#eab308' : '#ef4444'} />
              </div>
              <p className="text-lg font-bold text-gray-900">
                {overallScore >= 80 ? '🌟 Excellent!' : overallScore >= 60 ? '👍 Good' : overallScore >= 40 ? '⚡ Could be better' : '🔴 Needs improvement'}
              </p>
            </div>

            {/* Individual Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <ScoreRing score={healthScore} label="Health Score" color="#22c55e" />
                <p className="text-xs text-gray-500 mt-3">Based on vegetable & fruit ratio</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <ScoreRing score={budgetScore} label="Budget Score" color="#3b82f6" />
                <p className="text-xs text-gray-500 mt-3">How budget-friendly your cart is</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <ScoreRing score={wasteScore} label="Waste Score" color="#f59e0b" />
                <p className="text-xs text-gray-500 mt-3">Based on freshness — less waste risk</p>
              </div>
            </div>

            {/* Smart Tips */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">💡 Smart Tips</h2>
              <div className="space-y-3">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
