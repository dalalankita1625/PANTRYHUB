'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { totalItems, toggleCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/smart-basket', label: 'Smart Basket' },
    { href: '/price-alerts', label: 'Price Alerts' },
    { href: '/group-buying', label: 'Group Buy' },
    { href: '/orders', label: 'Orders' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-extrabold text-green-600 tracking-tight">
              PantryHub<span className="text-emerald-400">.</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex lg:space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Cart button */}
            <button
              onClick={toggleCart}
              className="relative text-gray-700 hover:text-green-600 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Auth buttons */}
            {user ? (
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link href="/login" className="text-gray-700 hover:text-green-600 text-sm font-medium transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-md shadow-green-200">
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-100 mt-2 pt-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-600 hover:text-green-600 hover:bg-green-50 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <button onClick={handleLogout} className="block w-full text-left text-red-500 hover:bg-red-50 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer">
                Logout ({user.name.split(' ')[0]})
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 hover:text-green-600 hover:bg-green-50 px-3 py-2.5 rounded-lg text-sm font-medium">
                  Log in
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block text-green-600 font-semibold hover:bg-green-50 px-3 py-2.5 rounded-lg text-sm">
                  Sign up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
