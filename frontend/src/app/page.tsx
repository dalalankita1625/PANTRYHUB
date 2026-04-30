import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-20 pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-200/40 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center bg-green-100 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              🌿 India&apos;s first freshness-transparent grocery platform
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
              Farm Fresh to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Doorstep.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Experience the true taste of freshness. Direct from farmers, transparently sourced, and delivered with care. Know your food&apos;s journey.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/products" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:-translate-y-1 shadow-xl shadow-green-200 inline-flex items-center justify-center gap-2">
                🛒 Shop Fresh Now
              </Link>
              <Link href="/group-buying" className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold transition-all hover:-translate-y-1 shadow-lg border border-gray-200 inline-flex items-center justify-center gap-2">
                👥 Group Buying
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-extrabold text-white">500+</p>
              <p className="text-sm text-gray-400">Fresh Products</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">150+</p>
              <p className="text-sm text-gray-400">Local Farmers</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">98%</p>
              <p className="text-sm text-gray-400">Avg Freshness</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">10K+</p>
              <p className="text-sm text-gray-400">Happy Customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* USP Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Why PantryHub?</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Not just another grocery app. A complete freshness-first ecosystem.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { emoji: '🌱', title: 'Freshness Score', desc: 'Every product shows a 0-100% freshness score with harvest time and quality grade.', color: 'green', link: '/products' },
              { emoji: '🚜', title: 'Farmer Direct', desc: 'Choose between warehouse or farmer-direct sourcing. See farmer profiles.', color: 'emerald', link: '/products' },
              { emoji: '📊', title: 'Smart Basket', desc: 'AI analyzes your cart for health, budget, and waste prediction scores.', color: 'blue', link: '/smart-basket' },
              { emoji: '💰', title: 'Price Alerts', desc: 'Get notified when prices drop. Weekly lowest price intelligence.', color: 'amber', link: '/price-alerts' },
              { emoji: '👥', title: 'Group Buying', desc: 'Join neighbors for bulk discounts. Shared delivery, more savings.', color: 'purple', link: '/group-buying' },
              { emoji: '📦', title: 'Flexible Slots', desc: 'Morning harvest, evening fresh batch — you choose your freshness window.', color: 'teal', link: '/checkout' },
              { emoji: '🌿', title: 'Eco Delivery', desc: 'Plastic-free packaging, reusable crates. Earn rewards for going green.', color: 'lime', link: '/checkout' },
              { emoji: '🧠', title: 'Smart Reorder', desc: 'AI predicts when you need groceries and auto-suggests your cart.', color: 'rose', link: '/products' },
            ].map((feature) => (
              <Link href={feature.link} key={feature.title} className="group bg-gray-50 hover:bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300">
                <div className="text-4xl mb-4">{feature.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-500">Fresh groceries in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Browse & Check', desc: 'Browse products and check freshness scores before you buy.' },
              { step: '02', title: 'Choose Source', desc: 'Pick Farmer Direct for maximum freshness or Warehouse for variety.' },
              { step: '03', title: 'Select Slot', desc: 'Choose your preferred delivery slot — morning harvest or evening fresh.' },
              { step: '04', title: 'Get Delivered', desc: 'Track your order in real-time. Eco-friendly packaging available.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg shadow-green-200">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to taste real freshness?</h2>
          <p className="text-lg text-green-100 mb-8">Join 10,000+ happy customers who trust PantryHub for their daily groceries.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="bg-white hover:bg-gray-50 text-green-600 px-8 py-4 rounded-full text-lg font-semibold transition-all hover:-translate-y-1 shadow-xl inline-flex items-center justify-center">
              Get Started — It&apos;s Free
            </Link>
            <Link href="/products" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all border border-white/30 inline-flex items-center justify-center">
              Explore Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
