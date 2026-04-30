'use client';

import { useState } from 'react';
import Image from 'next/image';

interface GroupOrder {
  id: string;
  neighborhood: string;
  members: number;
  maxMembers: number;
  savings: number;
  deliverySlot: string;
  items: string[];
}

const MOCK_GROUPS: GroupOrder[] = [
  { id: '1', neighborhood: 'Koramangala', members: 4, maxMembers: 8, savings: 120, deliverySlot: 'Morning 6-9 AM', items: ['Tomatoes', 'Spinach', 'Rice'] },
  { id: '2', neighborhood: 'HSR Layout', members: 6, maxMembers: 10, savings: 200, deliverySlot: 'Evening 5-8 PM', items: ['Mangoes', 'Bananas', 'Olive Oil'] },
  { id: '3', neighborhood: 'Indiranagar', members: 3, maxMembers: 6, savings: 80, deliverySlot: 'Afternoon 12-3 PM', items: ['Carrots', 'Apples', 'Bread'] },
];

export default function GroupBuyingPage() {
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);

  const toggleJoin = (id: string) => {
    setJoinedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">👥 Group Buying</h1>
        <p className="text-gray-500 mb-10">Join neighbors to unlock bulk discounts and save on delivery.</p>

        {/* How it Works */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-8 mb-10 border border-green-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">How Neighborhood Mode Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl mb-3">📍</div>
              <h3 className="font-bold text-gray-900 mb-1">1. Find Your Area</h3>
              <p className="text-sm text-gray-500">See active group orders near you</p>
            </div>
            <div>
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="font-bold text-gray-900 mb-1">2. Join a Group</h3>
              <p className="text-sm text-gray-500">Add your items to a shared order</p>
            </div>
            <div>
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-bold text-gray-900 mb-1">3. Save Together</h3>
              <p className="text-sm text-gray-500">Unlock bulk discounts and share delivery</p>
            </div>
          </div>
        </div>

        {/* Active Groups */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">🏘️ Active Groups Near You</h2>
        <div className="space-y-4">
          {MOCK_GROUPS.map((group) => {
            const isJoined = joinedGroups.includes(group.id);
            const progress = (group.members / group.maxMembers) * 100;

            return (
              <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">📍</span>
                      <h3 className="text-lg font-bold text-gray-900">{group.neighborhood}</h3>
                      <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Save ₹{group.savings}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {group.items.map((item) => (
                        <span key={item} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">{item}</span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>🕐 {group.deliverySlot}</span>
                      <span>👥 {group.members}/{group.maxMembers} members</span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{group.maxMembers - group.members} spots remaining</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleJoin(group.id)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isJoined
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200'
                    }`}
                  >
                    {isJoined ? '✓ Joined' : 'Join Group'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Group */}
        <div className="mt-10 bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
          <span className="text-4xl block mb-3">➕</span>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Start a New Group</h3>
          <p className="text-sm text-gray-500 mb-4">Create a group order for your neighborhood and invite others.</p>
          <button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors cursor-pointer">
            Create Group Order
          </button>
        </div>
      </div>
    </div>
  );
}
