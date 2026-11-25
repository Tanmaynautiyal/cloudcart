import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  ArrowRight,
  Facebook,
  Twitter,
  Youtube,
  Instagram,
  Linkedin,
  CheckCircle2,
} from 'lucide-react'
import BrandLogo from '../../components/common/BrandLogo'
import { PATHS } from '../../routes/routes'

export const CustomerFooter: React.FC = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newsletterEmail.trim()) {
      setSubscribed(true)
      setNewsletterEmail('')
      setTimeout(() => setSubscribed(false), 4000)
    }
  }

  return (
    <footer className="bg-[#0B0D13] text-white border-t border-slate-800/80">
      {/* 1. Value Guarantees Strip */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {/* Free Shipping */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-red-950/60 border border-red-900/50 text-[#EF233C] flex items-center justify-center shrink-0 shadow-inner">
                <Truck size={22} />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-tight">Free Shipping</div>
                <div className="text-xs text-slate-400 mt-0.5">On Orders Over $50</div>
              </div>
            </div>

            {/* Secure Payment */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-red-950/60 border border-red-900/50 text-[#EF233C] flex items-center justify-center shrink-0 shadow-inner">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-tight">Secure Payment</div>
                <div className="text-xs text-slate-400 mt-0.5">100% Secure Checkout</div>
              </div>
            </div>

            {/* Easy Returns */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-red-950/60 border border-red-900/50 text-[#EF233C] flex items-center justify-center shrink-0 shadow-inner">
                <RotateCcw size={22} />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-tight">Easy Returns</div>
                <div className="text-xs text-slate-400 mt-0.5">30-Day Return Policy</div>
              </div>
            </div>

            {/* 24/7 Support */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-red-950/60 border border-red-900/50 text-[#EF233C] flex items-center justify-center shrink-0 shadow-inner">
                <Headphones size={22} />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-tight">24/7 Support</div>
                <div className="text-xs text-slate-400 mt-0.5">We're here to help</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand Info & Socials */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo isLight={true} />
            <p className="text-xs text-slate-400 font-medium">
              Smart Choice. Better Tomorrow.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <a
                href="#facebook"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#EF233C] text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs"
              >
                <Facebook size={15} />
              </a>
              <a
                href="#twitter"
                aria-label="Twitter"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#EF233C] text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs"
              >
                <Twitter size={15} />
              </a>
              <a
                href="#youtube"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#EF233C] text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs"
              >
                <Youtube size={15} />
              </a>
              <a
                href="#instagram"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#EF233C] text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs"
              >
                <Instagram size={15} />
              </a>
              <a
                href="#linkedin"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#EF233C] text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs"
              >
                <Linkedin size={15} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to={PATHS.SHOP} className="hover:text-white transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/shop?category=mobiles" className="hover:text-white transition-colors">
                  Mobiles
                </Link>
              </li>
              <li>
                <Link to="/shop?category=laptops" className="hover:text-white transition-colors">
                  Laptops
                </Link>
              </li>
              <li>
                <Link to="/shop?category=audio" className="hover:text-white transition-colors">
                  Audio
                </Link>
              </li>
              <li>
                <Link to="/shop?category=accessories" className="hover:text-white transition-colors">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to={PATHS.ORDERS} className="hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="hover:text-white transition-colors">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2">
              Newsletter
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Subscribe for exclusive deals!
            </p>
            <form onSubmit={handleNewsletterSubmit} className="relative">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-4 pr-11 py-2 text-xs rounded-full bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#EF233C]"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#EF233C] hover:bg-[#D90429] text-white flex items-center justify-center transition-colors shadow-xs"
              >
                <ArrowRight size={14} />
              </button>
            </form>
            {subscribed && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
                <CheckCircle2 size={13} />
                Subscribed successfully!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal & Copyright Bar */}
      <div className="border-t border-slate-800/80 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © 2025 ElectroMart. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-600">|</span>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <span className="text-slate-600">|</span>
            <Link to="/cookies" className="hover:text-white transition-colors">
              Cookies Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default CustomerFooter
