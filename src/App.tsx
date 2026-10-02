import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  ArrowRight, 
  Scale, 
  Tag, 
  Package, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Github, 
  Send,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { KG_BUNDLES, Bundle } from './data/bundles';

interface BasketItem {
  type: 'ticket' | 'bundle';
  id: string;
  name: string;
  price: number;
  quantity: number;
  weightKg?: number;
}

export default function App() {
  // Navigation active view
  const [activeTab, setActiveTab] = useState<'home' | 'coming-soon'>('home');
  const [bundleFilter, setBundleFilter] = useState<string>('all');
  
  // Custom Kilo Calculator
  const [customKg, setCustomKg] = useState<number>(10);
  const [customCategory, setCustomCategory] = useState<'mixed' | 'vintage' | 'sportswear'>('mixed');

  // Modals
  const [showBasket, setShowBasket] = useState<boolean>(false);
  const [showTicketExplainer, setShowTicketExplainer] = useState<boolean>(false);
  const [selectedBundleModal, setSelectedBundleModal] = useState<Bundle | null>(null);
  const [showGitModal, setShowGitModal] = useState<boolean>(true);

  // Spend simulator in explainer
  const [simSpend, setSimSpend] = useState<number>(25);

  // Basket State backed by localStorage matching original key
  const [ticketsCount, setTicketsCount] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('kgflips-event-basket-v1'));
      return Number.isInteger(saved) && saved >= 0 ? Math.min(3, saved) : 0;
    } catch {
      return 0;
    }
  });

  const [reservedBundles, setReservedBundles] = useState<BasketItem[]>(() => {
    try {
      const saved = localStorage.getItem('kgflips-bundles-basket-v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kgflips-event-basket-v1', String(ticketsCount));
    } catch (e) {
      console.error(e);
    }
  }, [ticketsCount]);

  useEffect(() => {
    try {
      localStorage.setItem('kgflips-bundles-basket-v1', JSON.stringify(reservedBundles));
    } catch (e) {
      console.error(e);
    }
  }, [reservedBundles]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Club waitlist
  const [emailInput, setEmailInput] = useState('');
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  // GitHub token state for direct push
  const [githubPat, setGithubPat] = useState('');
  const [gitStatus, setGitStatus] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);

  const addTicket = () => {
    if (ticketsCount >= 3) {
      showToast('Maximum 3 early access tickets per booking');
      return;
    }
    setTicketsCount(prev => Math.min(3, prev + 1));
    showToast('Early access ticket added to basket');
    setShowBasket(true);
  };

  const addBundle = (bundle: Bundle) => {
    setReservedBundles(prev => {
      const existing = prev.find(item => item.id === bundle.id);
      if (existing) {
        return prev.map(item => item.id === bundle.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        type: 'bundle',
        id: bundle.id,
        name: bundle.name,
        price: bundle.totalPrice,
        quantity: 1,
        weightKg: bundle.weightKg
      }];
    });
    showToast(`${bundle.name} added to your basket`);
    setShowBasket(true);
  };

  const addCustomLot = () => {
    const rate = customCategory === 'vintage' ? 14 : customCategory === 'sportswear' ? 12.5 : 8.5;
    const price = Math.round(customKg * rate);
    const label = `${customKg}kg Custom ${customCategory.toUpperCase()} Kilo Bale`;
    const id = `custom-${customCategory}-${customKg}kg`;

    setReservedBundles(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        type: 'bundle',
        id,
        name: label,
        price,
        quantity: 1,
        weightKg: customKg
      }];
    });
    showToast(`${label} added to basket`);
    setShowBasket(true);
  };

  const removeBundle = (id: string) => {
    setReservedBundles(prev => prev.filter(item => item.id !== id));
  };

  const updateBundleQty = (id: string, delta: number) => {
    setReservedBundles(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as BasketItem[]);
  };

  const totalBasketCount = ticketsCount + reservedBundles.reduce((acc, item) => acc + item.quantity, 0);
  const totalBasketPrice = (ticketsCount * 5) + reservedBundles.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const filteredBundles = bundleFilter === 'all' 
    ? KG_BUNDLES 
    : KG_BUNDLES.filter(b => b.category === bundleFilter);

  const handlePushToGit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubPat) {
      setGitStatus('Please enter a GitHub Personal Access Token with repo scope.');
      return;
    }
    setIsPushing(true);
    setGitStatus('Pushing codebase to https://github.com/eigroz/KGflips.git...');
    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pat: githubPat })
      });
      const data = await res.json();
      if (res.ok) {
        setGitStatus('Success! Repository updated on GitHub.');
      } else {
        setGitStatus(data.error || 'Failed to push. You can also run the terminal commands shown below.');
      }
    } catch {
      setGitStatus('Command ready. You can push via the terminal command listed below.');
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faff] text-[#163459] flex flex-col font-sans selection:bg-[#c8f047] selection:text-[#163459]">
      {/* Top Preview Bar */}
      <div className="bg-[#163459] text-white text-xs md:text-sm py-2.5 px-4 text-center font-normal tracking-wide flex items-center justify-center gap-2 border-b border-[#24528b]">
        <span className="font-bold text-[#c8f047]">KGflips preview</span>
        <span className="opacity-60 hidden sm:inline">·</span>
        <span className="opacity-90">Discover our event ticket offer & wholesale kilo bundles. Event bookings opening soon.</span>
      </div>

      {/* Main Header / Nav */}
      <header className="bg-white border-b border-[#d3dfef] sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 sm:h-24 flex items-center justify-between">
          {/* Logo */}
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab('home'); }} 
            className="flex items-center gap-2 group"
            aria-label="KGflips home"
          >
            <img 
              src="/logo.jpeg" 
              alt="KGflips — Clothes by the kilo" 
              className="h-12 sm:h-14 w-auto object-contain transition-transform group-hover:scale-102"
              onError={(e) => {
                // Fallback text logo if image not loaded
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter text-[#163459] leading-none">KGflips</span>
              <span className="text-[10px] uppercase tracking-wider text-[#50647e] font-semibold">Clothes by the kilo</span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-semibold text-sm">
            <button 
              onClick={() => { setActiveTab('home'); const el = document.getElementById('events'); el?.scrollIntoView({ behavior: 'smooth' }); }}
              className={`hover:text-[#2b5e9f] transition-colors py-2 cursor-pointer ${activeTab === 'home' ? 'text-[#2b5e9f]' : 'text-[#50647e]'}`}
            >
              Event tickets
            </button>
            <button 
              onClick={() => { setActiveTab('home'); const el = document.getElementById('bundles'); el?.scrollIntoView({ behavior: 'smooth' }); }}
              className="hover:text-[#2b5e9f] transition-colors py-2 cursor-pointer text-[#50647e] flex items-center gap-1.5"
            >
              <span>Reseller Bundles</span>
              <span className="bg-[#c8f047] text-[#163459] text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">New</span>
            </button>
            <button 
              onClick={() => setShowTicketExplainer(true)}
              className="hover:text-[#2b5e9f] transition-colors py-2 cursor-pointer text-[#50647e]"
            >
              £5 Ticket Credit
            </button>
            <button 
              onClick={() => setActiveTab(activeTab === 'coming-soon' ? 'home' : 'coming-soon')}
              className={`hover:text-[#2b5e9f] transition-colors py-2 cursor-pointer ${activeTab === 'coming-soon' ? 'text-[#2b5e9f] underline underline-offset-6' : 'text-[#50647e]'}`}
            >
              Coming soon
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGitModal(true)}
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#d3dfef] text-[#50647e] hover:bg-[#f0f5fc] hover:text-[#163459] transition-all cursor-pointer"
              title="GitHub Repository Sync"
            >
              <Github className="w-3.5 h-3.5 text-[#2b5e9f]" />
              <span>GitHub Sync</span>
            </button>

            <button 
              onClick={() => setShowBasket(true)}
              className="bg-[#2b5e9f] hover:bg-[#214a80] text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-sm cursor-pointer active:scale-98"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Basket</span>
              <span className="bg-[#c8f047] text-[#163459] text-xs font-black px-2 py-0.5 rounded-full min-w-5 text-center">
                {totalBasketCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1">
        {activeTab === 'coming-soon' ? (
          /* ========================================================================= */
          /* COMING SOON VIEW                                                           */
          /* ========================================================================= */
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
            <div className="max-w-3xl mb-12">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#2b5e9f] block mb-2">
                More ways to find your next favourite
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-[#163459] tracking-tight leading-[1.08] mb-4">
                Good finds.<br />More ways to shop.
              </h1>
              <p className="text-lg text-[#50647e] leading-relaxed">
                There’s more on the way: discover clothing by the kilo, pre-book your next lot and get closer to the action with KGflips membership.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white border border-[#d3dfef] rounded-2xl p-7 shadow-xs">
                <span className="inline-block bg-[#eef4fc] text-[#2b5e9f] text-xs font-bold px-3 py-1 rounded-full mb-6">
                  Coming soon
                </span>
                <h2 className="text-2xl font-bold mb-3 tracking-tight text-[#163459]">Order by the kilo.</h2>
                <p className="text-sm text-[#50647e] leading-relaxed">
                  Shop clothing by weight. Choose the type of clothes you’re looking for and the kilo option that suits you. More finds, one simple way to shop.
                </p>
              </div>

              <div className="bg-white border border-[#d3dfef] rounded-2xl p-7 shadow-xs">
                <span className="inline-block bg-[#eef4fc] text-[#2b5e9f] text-xs font-bold px-3 py-1 rounded-full mb-6">
                  Coming soon
                </span>
                <h2 className="text-2xl font-bold mb-3 tracking-tight text-[#163459]">Pre-book your lots.</h2>
                <p className="text-sm text-[#50647e] leading-relaxed">
                  Plan your next haul ahead of time. Pre-book clothing lots from upcoming stock, with lot sizes, prices and availability announced before bookings open.
                </p>
              </div>

              <div className="bg-white border border-[#d3dfef] rounded-2xl p-7 shadow-xs">
                <span className="inline-block bg-[#eef4fc] text-[#2b5e9f] text-xs font-bold px-3 py-1 rounded-full mb-6">
                  Coming soon
                </span>
                <h2 className="text-2xl font-bold mb-3 tracking-tight text-[#163459]">Find your category.</h2>
                <p className="text-sm text-[#50647e] leading-relaxed mb-4">
                  Choose men’s, women’s or kids’ clothing when selecting your lot. Find the category that fits your next wardrobe refresh.
                </p>
                <div className="flex gap-2">
                  <span className="bg-[#f0f5fc] text-xs font-bold px-3 py-1 rounded-full text-[#163459]">Men’s</span>
                  <span className="bg-[#f0f5fc] text-xs font-bold px-3 py-1 rounded-full text-[#163459]">Women’s</span>
                  <span className="bg-[#f0f5fc] text-xs font-bold px-3 py-1 rounded-full text-[#163459]">Kids’</span>
                </div>
              </div>
            </div>

            {/* Club Card */}
            <div className="bg-[#2b5e9f] text-white rounded-3xl p-8 sm:p-12 shadow-lg mb-8">
              <span className="inline-block bg-white/20 text-[#c8f047] text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full mb-6">
                Membership · Coming soon
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">Join the KGflips Club.</h2>
              <p className="text-white/80 max-w-2xl text-base sm:text-lg mb-8">
                A little closer to the finds you love. We’re working on membership with early access to events, stock, and exclusive kilo drops.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pt-6 border-t border-white/20">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Early event access</h3>
                  <p className="text-sm text-white/80">Get an earlier opportunity to book upcoming KGflips bin sales.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">First look at stock</h3>
                  <p className="text-sm text-white/80">Discover new clothing lots and stock releases ahead of general access.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Exclusive member discounts</h3>
                  <p className="text-sm text-white/80">Special tier pricing on bulk kilos and invitations to private sorting events.</p>
                </div>
              </div>

              {/* Waitlist Form */}
              <div className="max-w-md bg-white/10 p-2 rounded-2xl border border-white/20 flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email for club VIP access"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="bg-transparent px-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none flex-1"
                />
                <button
                  onClick={() => {
                    if (emailInput.includes('@')) {
                      setWaitlistJoined(true);
                      showToast('You are on the VIP waitlist!');
                    }
                  }}
                  className="bg-[#c8f047] text-[#163459] font-bold text-xs uppercase px-4 py-2.5 rounded-xl cursor-pointer hover:bg-white transition-colors"
                >
                  {waitlistJoined ? 'Joined!' : 'Join Waitlist'}
                </button>
              </div>
            </div>

            <div className="text-center pt-4">
              <button 
                onClick={() => setActiveTab('home')}
                className="bg-[#163459] hover:bg-[#2b5e9f] text-white px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Explore event tickets & bundles</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* HOME VIEW                                                                 */
          /* ========================================================================= */
          <>
            {/* EVENT SECTION (Original Cloudflare Landing) */}
            <section id="events" className="bg-[#f0f5fc] border-b border-[#d3dfef] py-10 md:py-16">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                
                {/* Intro Copy */}
                <div className="max-w-3xl mb-8">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#2b5e9f] block mb-2">
                    KGflips events
                  </span>
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#163459] tracking-tight leading-[1.08] mb-3">
                    Are you a Whatnot or Ebay live seller?
                  </h1>
                  <p className="text-base sm:text-lg text-[#50647e] leading-relaxed">
                    This is the ideal opportunity to buy affordable items in bulk for your upcoming show.
                  </p>
                </div>

                {/* 2-Column Event Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                  
                  {/* Left: Graphic Poster */}
                  <div className="flex items-center justify-center bg-white border border-[#d3dfef] rounded-3xl p-4 sm:p-6 shadow-xs overflow-hidden">
                    <img 
                      src="/event-kgflips.png" 
                      alt="KGflips event announcement: the UKs first bins experience is coming. Dig, find, weigh, pay."
                      className="w-full h-auto max-h-[500px] object-contain rounded-2xl"
                      fetchPriority="high"
                      onError={(e) => {
                        // In case graphic image fails, show stylish fallback
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Right: Ticket Card */}
                  <div className="bg-[#2b5e9f] text-white border border-[#24528b] rounded-3xl p-6 sm:p-10 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16"></div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#c8f047] block mb-2">
                        The next KGflips kilo sale
                      </span>
                      <h3 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-white">
                        See you at the bins.
                      </h3>
                      <p className="text-white/80 text-sm sm:text-base mb-6 leading-relaxed">
                        First event coming soon.<br />
                        Location, date and entry times to be announced.
                      </p>

                      {/* Big Price Tag */}
                      <div className="my-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl sm:text-7xl font-black text-white tracking-tight">£5</span>
                          <span className="text-base sm:text-lg text-white/80 font-medium">/ person</span>
                        </div>
                      </div>

                      {/* £5 Back Rule Box */}
                      <div className="bg-white/10 border border-white/20 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 mb-6">
                        <div>
                          <b className="block text-sm sm:text-base font-bold text-white">£5 back against your shop</b>
                          <span className="text-xs sm:text-sm text-white/80">When you spend £20 or more on clothing</span>
                        </div>
                        <span aria-hidden="true" className="text-3xl text-[#c8f047] leading-none shrink-0 font-serif">✦</span>
                      </div>
                    </div>

                    <div>
                      {/* Ticket CTA Button */}
                      <button 
                        onClick={addTicket}
                        className="w-full bg-[#c8f047] hover:bg-[#bce43f] text-[#163459] font-black text-sm uppercase tracking-wide py-4 px-6 rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5 stroke-[3]" />
                        <span>Add EARLY ACCESS TICKET · £5</span>
                      </button>

                      {/* Explainer Link */}
                      <button 
                        onClick={() => setShowTicketExplainer(true)}
                        className="w-full text-center text-xs sm:text-sm text-white underline underline-offset-4 mt-3 hover:text-[#c8f047] transition-colors cursor-pointer"
                      >
                        How the £5 ticket credit works
                      </button>

                      <p className="text-[11px] text-white/70 leading-normal mt-4 text-center">
                        Maximum 3 EARLY ACCESS TICKETs per booking. One £5 credit per qualifying purchase, at the named event only. Event clothing price per kg to be confirmed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* #BUNDLES SECTION (Wholesale & Reseller Kilo Lots)                          */}
            {/* ========================================================================= */}
            <section id="bundles" className="py-16 md:py-24 bg-white border-b border-[#d3dfef]">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div className="max-w-2xl">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-[#2b5e9f] flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-[#2b5e9f]" />
                      <span>Wholesale & Live Seller Inventory</span>
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-[#163459] tracking-tight leading-tight mb-3">
                      Order Clothing by the Kilo & Pre-Packaged Lots
                    </h2>
                    <p className="text-base text-[#50647e] leading-relaxed">
                      Stock up for Whatnot streams, eBay auctions, Vinted, or your boutique. Clean, graded, high-margin kilo lots shipped directly or picked up at the bin sale.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'All Lots' },
                      { id: 'streamer', label: 'Whatnot / Live' },
                      { id: 'vintage', label: 'Vintage' },
                      { id: 'branded', label: 'Sportswear' },
                      { id: 'womens', label: 'Women’s Y2K' },
                      { id: 'kids', label: 'Kids’' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setBundleFilter(tab.id)}
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                          bundleFilter === tab.id
                            ? 'bg-[#163459] text-white shadow-sm'
                            : 'bg-[#f0f5fc] text-[#50647e] hover:bg-[#e2edf9] hover:text-[#163459]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bundle Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                  {filteredBundles.map(bundle => (
                    <div 
                      key={bundle.id}
                      className="bg-[#f7faff] border border-[#d3dfef] hover:border-[#2b5e9f]/50 rounded-3xl p-6 flex flex-col justify-between transition-all hover:shadow-lg group"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#e6effc] text-[#2b5e9f] flex items-center gap-1">
                            <Scale className="w-3 h-3" />
                            {bundle.weightKg} kg lot
                          </span>
                          {bundle.badge && (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#c8f047] text-[#163459]">
                              {bundle.badge}
                            </span>
                          )}
                        </div>

                        {/* Bundle Title */}
                        <h3 className="text-xl font-bold text-[#163459] mb-2 group-hover:text-[#2b5e9f] transition-colors">
                          {bundle.name}
                        </h3>

                        <p className="text-xs text-[#50647e] mb-4 leading-relaxed line-clamp-2">
                          {bundle.description}
                        </p>

                        {/* Metric Highlights */}
                        <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-xl border border-[#e2edf9] mb-4 text-xs">
                          <div>
                            <span className="text-[10px] text-[#50647e] block">Est. Pieces</span>
                            <span className="font-bold text-[#163459]">~{bundle.estPieces} items</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#50647e] block">Rate / kg</span>
                            <span className="font-bold text-[#163459]">£{bundle.pricePerKg.toFixed(2)}/kg</span>
                          </div>
                        </div>

                        {/* Bullet Highlights */}
                        <ul className="space-y-1.5 mb-6 text-xs text-[#50647e]">
                          {bundle.highlights.map((h, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-[#2b5e9f] shrink-0" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Card Bottom / Price & CTA */}
                      <div className="pt-4 border-t border-[#d3dfef]">
                        <div className="flex items-baseline justify-between mb-3">
                          <div>
                            <span className="text-[10px] text-[#50647e] uppercase font-bold block">Bundle Price</span>
                            <span className="text-2xl font-black text-[#163459]">£{bundle.totalPrice}</span>
                          </div>
                          <span className="text-xs font-semibold text-[#2b5e9f] bg-[#eef4fc] px-2 py-0.5 rounded">
                            {bundle.grade}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedBundleModal(bundle)}
                            className="w-full text-xs font-bold py-2.5 rounded-xl border border-[#d3dfef] text-[#163459] hover:bg-white transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => addBundle(bundle)}
                            className="w-full text-xs font-bold py-2.5 rounded-xl bg-[#2b5e9f] hover:bg-[#214a80] text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Reserve</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Kilo Bale Builder Box */}
                <div className="bg-[#163459] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
                  <div className="max-w-3xl">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#c8f047] mb-2">
                      <Scale className="w-4 h-4" />
                      <span>Custom Weight Selector</span>
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
                      Need a specific weight for your live show?
                    </h3>
                    <p className="text-white/80 text-sm sm:text-base mb-6 leading-relaxed">
                      Choose your desired kilo volume and category. We pack and weigh sacks in 5kg, 10kg, 15kg, 20kg, and 30kg bales.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {/* Weight Selector */}
                      <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
                        <label className="text-xs font-semibold text-white/70 block mb-2">Selected Weight (kg)</label>
                        <div className="flex items-center justify-between">
                          <button 
                            onClick={() => setCustomKg(prev => Math.max(5, prev - 5))}
                            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-lg cursor-pointer"
                          >
                            −
                          </button>
                          <span className="text-2xl font-black text-white">{customKg} kg</span>
                          <button 
                            onClick={() => setCustomKg(prev => Math.min(50, prev + 5))}
                            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-lg cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Category Selector */}
                      <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
                        <label className="text-xs font-semibold text-white/70 block mb-2">Category Mix</label>
                        <select 
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value as any)}
                          className="w-full bg-[#1e416d] text-white text-sm font-semibold rounded-xl px-3 py-2 border border-white/20 focus:outline-none cursor-pointer"
                        >
                          <option value="mixed">Mixed Reseller Bale (£8.50/kg)</option>
                          <option value="vintage">Vintage & Y2K Mix (£14.00/kg)</option>
                          <option value="sportswear">Branded Sportswear (£12.50/kg)</option>
                        </select>
                      </div>

                      {/* Calculated Summary & Add */}
                      <div className="bg-[#24528b] rounded-2xl p-4 border border-white/20 flex flex-col justify-between">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-white/80">Est. Total</span>
                          <span className="text-2xl font-black text-[#c8f047]">
                            £{Math.round(customKg * (customCategory === 'vintage' ? 14 : customCategory === 'sportswear' ? 12.5 : 8.5))}
                          </span>
                        </div>
                        <button
                          onClick={addCustomLot}
                          className="mt-2 w-full bg-[#c8f047] hover:bg-[#bce43f] text-[#163459] font-black text-xs uppercase py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Reserve Custom Bale</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* COMING SOON TEASER ON HOME (Matches original site) */}
            <section className="py-16 bg-[#f7faff] text-center border-b border-[#d3dfef]">
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#2b5e9f] block mb-2">
                  More from KGflips
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-[#163459] tracking-tight mb-4">
                  COMING SOON
                </h2>
                <p className="text-base sm:text-lg text-[#50647e] mb-8 leading-relaxed">
                  Order clothing by the kilo, pre-book men’s, women’s or kids’ lots, and discover membership with early access to events, stock and more.
                </p>
                <button 
                  onClick={() => setActiveTab('coming-soon')}
                  className="bg-[#2b5e9f] hover:bg-[#214a80] text-white px-6 py-3.5 rounded-xl font-bold text-sm inline-flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                >
                  <span>See what’s coming</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#163459] text-white py-12 border-t border-[#24528b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-white/15">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-2 flex items-center justify-center">
                <img 
                  src="/logo.jpeg" 
                  alt="KGflips — Clothes by the kilo" 
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="font-bold text-lg tracking-tight">KGflips</span>
            </div>

            <nav className="flex flex-wrap gap-6 text-sm text-white/80">
              <button 
                onClick={() => { setActiveTab('home'); const el = document.getElementById('events'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Event tickets
              </button>
              <button 
                onClick={() => { setActiveTab('home'); const el = document.getElementById('bundles'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Reseller bundles
              </button>
              <button 
                onClick={() => setShowTicketExplainer(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                £5 Credit terms
              </button>
              <button 
                onClick={() => setActiveTab('coming-soon')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Coming soon
              </button>
              <button 
                onClick={() => setShowGitModal(true)}
                className="hover:text-white transition-colors cursor-pointer text-[#c8f047]"
              >
                GitHub sync
              </button>
            </nav>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#e6effc]">
            <p>KGflips · UK’s First Bins Experience · Clothes by the Kilo</p>
            <p className="text-white/60">Good clothes. Fresh starts. Whatnot & eBay Seller Supply.</p>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* BASKET MODAL (Exact functionality & styling from original site)           */}
      {/* ========================================================================= */}
      {showBasket && (
        <div className="fixed inset-0 z-50 bg-[#163459]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#d3dfef] relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#d3dfef] mb-6">
              <h2 className="text-2xl font-black text-[#163459] tracking-tight">Your ticket basket</h2>
              <button 
                onClick={() => setShowBasket(false)}
                className="w-8 h-8 rounded-full hover:bg-[#f0f5fc] flex items-center justify-center text-[#50647e] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {totalBasketCount > 0 ? (
              <div className="space-y-6">
                {/* Tickets Section */}
                {ticketsCount > 0 && (
                  <div className="bg-[#f7faff] border border-[#d3dfef] rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h4 className="font-bold text-[#163459] text-base">KGflips EARLY ACCESS TICKET</h4>
                        <p className="text-xs text-[#50647e] mt-0.5">
                          £5 per person · Maximum 3 tickets per booking.<br />
                          Includes £5 credit against clothing spend of £20+.
                        </p>
                      </div>
                      <span className="font-black text-lg text-[#163459]">£{ticketsCount * 5}.00</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#d3dfef]/60">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setTicketsCount(prev => Math.max(0, prev - 1))}
                          className="w-8 h-8 rounded-full border border-[#d3dfef] bg-white flex items-center justify-center text-lg font-bold hover:bg-[#f0f5fc] cursor-pointer"
                        >
                          −
                        </button>
                        <span className="font-bold text-sm text-[#163459]">
                          {ticketsCount} ticket{ticketsCount === 1 ? '' : 's'}
                        </span>
                        <button 
                          disabled={ticketsCount >= 3}
                          onClick={() => setTicketsCount(prev => Math.min(3, prev + 1))}
                          className="w-8 h-8 rounded-full border border-[#d3dfef] bg-white flex items-center justify-center text-lg font-bold hover:bg-[#f0f5fc] disabled:opacity-40 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button 
                        onClick={() => setTicketsCount(0)}
                        className="text-xs text-[#50647e] underline hover:text-rose-600 cursor-pointer"
                      >
                        Remove tickets
                      </button>
                    </div>
                  </div>
                )}

                {/* Reserved Bundles Section */}
                {reservedBundles.map(bundle => (
                  <div key={bundle.id} className="bg-[#f7faff] border border-[#d3dfef] rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h4 className="font-bold text-[#163459] text-sm">{bundle.name}</h4>
                        <p className="text-xs text-[#50647e]">
                          {bundle.weightKg}kg wholesale sack reservation
                        </p>
                      </div>
                      <span className="font-black text-base text-[#163459]">
                        £{bundle.price * bundle.quantity}.00
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#d3dfef]/60">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateBundleQty(bundle.id, -1)}
                          className="w-7 h-7 rounded-full border border-[#d3dfef] bg-white flex items-center justify-center font-bold text-xs hover:bg-[#f0f5fc] cursor-pointer"
                        >
                          −
                        </button>
                        <span className="font-bold text-xs text-[#163459]">{bundle.quantity}</span>
                        <button 
                          onClick={() => updateBundleQty(bundle.id, 1)}
                          className="w-7 h-7 rounded-full border border-[#d3dfef] bg-white flex items-center justify-center font-bold text-xs hover:bg-[#f0f5fc] cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button 
                        onClick={() => removeBundle(bundle.id)}
                        className="text-xs text-[#50647e] underline hover:text-rose-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* Basket Total */}
                <div className="flex items-center justify-between text-xl font-black text-[#163459] pt-4 border-t border-[#d3dfef]">
                  <span>Total</span>
                  <span>£{totalBasketPrice}.00</span>
                </div>

                {/* Notice Box matching original site */}
                <div className="bg-[#eaf1fb] text-[#163459] p-4 rounded-xl text-xs leading-relaxed">
                  <b>Your basket is saved on this device.</b> Tickets are not reserved until payment is completed. Booking will open when event details are confirmed.
                </div>

                {/* Checkout Button */}
                <button 
                  disabled
                  className="w-full bg-[#163459]/20 text-[#50647e] py-3.5 rounded-xl font-bold text-sm cursor-not-allowed text-center"
                >
                  Checkout coming soon
                </button>
                <p className="text-[11px] text-[#50647e] text-center">
                  Online payment is not available yet. No payment has been taken.
                </p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[#50647e] text-base mb-6">Your basket is empty.</p>
                <button 
                  onClick={addTicket}
                  className="w-full bg-[#2b5e9f] hover:bg-[#214a80] text-white py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-colors"
                >
                  Add an event ticket · £5
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* £5 TICKET EXPLAINER MODAL (Exact calculation & breakdown)                 */}
      {/* ========================================================================= */}
      {showTicketExplainer && (
        <div className="fixed inset-0 z-50 bg-[#163459]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#d3dfef] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#d3dfef] mb-6">
              <h2 className="text-2xl font-black text-[#163459] tracking-tight">Your £5 ticket, explained</h2>
              <button 
                onClick={() => setShowTicketExplainer(false)}
                className="w-8 h-8 rounded-full hover:bg-[#f0f5fc] flex items-center justify-center text-[#50647e] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <span className="inline-block bg-[#eef4fc] text-[#2b5e9f] text-xs font-bold px-3 py-1 rounded-full mb-4">
              Event dates coming soon
            </span>

            <p className="text-sm text-[#50647e] leading-relaxed mb-6">
              Your ticket includes early access plus one £5 credit against a clothing purchase of £20 or more at that event.
            </p>

            {/* Interactive Spend Simulation */}
            <div className="bg-[#f7faff] border border-[#d3dfef] rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center text-xs font-bold text-[#163459] mb-2">
                <span>Simulate clothing purchase spend:</span>
                <span className="text-sm text-[#2b5e9f]">£{simSpend}.00</span>
              </div>
              <input 
                type="range" 
                min={20} 
                max={100} 
                step={5}
                value={simSpend}
                onChange={(e) => setSimSpend(Number(e.target.value))}
                className="w-full accent-[#2b5e9f] cursor-pointer mb-4"
              />

              <div className="space-y-2 text-xs text-[#163459]">
                <div className="flex justify-between py-1.5 border-b border-[#d3dfef]">
                  <span>Ticket paid before the event</span>
                  <b className="font-semibold">£5.00</b>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#d3dfef]">
                  <span>Clothing purchase at the bins</span>
                  <b className="font-semibold">£{simSpend}.00</b>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#d3dfef] text-[#2b5e9f]">
                  <span>Ticket credit at the till</span>
                  <b className="font-bold">−£5.00</b>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#d3dfef]">
                  <span>Remaining payment at the till</span>
                  <b className="font-semibold">£{simSpend - 5}.00</b>
                </div>
              </div>
            </div>

            <div className="bg-[#eaf1fb] text-[#163459] p-4 rounded-xl text-xs leading-relaxed mb-4">
              <b>Total paid in this example: £{simSpend}.00.</b><br />
              One credit per qualifying transaction, after any other discounts. Credits cannot be combined, exchanged for cash or used online.
            </div>

            <p className="text-[11px] text-[#50647e] leading-normal mb-6">
              A live ticket will have a unique code for entry and one-time credit redemption. Cancellation, transfer and accompanying-child terms will be published before booking opens.
            </p>

            <button 
              disabled
              className="w-full bg-[#163459]/20 text-[#50647e] py-3.5 rounded-xl font-bold text-sm cursor-not-allowed"
            >
              Booking opens when dates are confirmed
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BUNDLE DETAILS MODAL                                                      */}
      {/* ========================================================================= */}
      {selectedBundleModal && (
        <div className="fixed inset-0 z-50 bg-[#163459]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#d3dfef] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#d3dfef] mb-6">
              <div>
                <span className="text-[11px] font-bold text-[#2b5e9f] uppercase tracking-wider block">
                  Lot Details
                </span>
                <h3 className="text-2xl font-black text-[#163459]">{selectedBundleModal.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedBundleModal(null)}
                className="w-8 h-8 rounded-full hover:bg-[#f0f5fc] flex items-center justify-center text-[#50647e] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#50647e] leading-relaxed mb-6">
              {selectedBundleModal.description}
            </p>

            <div className="grid grid-cols-3 gap-3 p-4 bg-[#f7faff] rounded-2xl border border-[#d3dfef] mb-6 text-center text-xs">
              <div>
                <span className="text-[#50647e] block text-[10px]">Net Weight</span>
                <span className="text-base font-black text-[#163459]">{selectedBundleModal.weightKg} kg</span>
              </div>
              <div>
                <span className="text-[#50647e] block text-[10px]">Avg Items</span>
                <span className="text-base font-black text-[#163459]">~{selectedBundleModal.estPieces}</span>
              </div>
              <div>
                <span className="text-[#50647e] block text-[10px]">Rate</span>
                <span className="text-base font-black text-[#163459]">£{selectedBundleModal.pricePerKg}/kg</span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <span className="text-xs font-bold text-[#163459] block">Curated For:</span>
              <p className="text-xs text-[#50647e] bg-[#eef4fc] p-3 rounded-xl border border-[#d3dfef]">
                {selectedBundleModal.bestFor}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#d3dfef]">
              <div>
                <span className="text-[10px] text-[#50647e] block">Total Wholesale Price</span>
                <span className="text-2xl font-black text-[#163459]">£{selectedBundleModal.totalPrice}.00</span>
              </div>
              <button
                onClick={() => {
                  addBundle(selectedBundleModal);
                  setSelectedBundleModal(null);
                }}
                className="bg-[#2b5e9f] hover:bg-[#214a80] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wide cursor-pointer transition-all shadow-sm"
              >
                Add to Basket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GITHUB DIRECT SYNC MODAL                                                  */}
      {/* ========================================================================= */}
      {showGitModal && (
        <div className="fixed inset-0 z-50 bg-[#163459]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#d3dfef] relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#d3dfef] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#163459] text-white">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#163459] tracking-tight">Approve GitHub Upload</h3>
                  <p className="text-xs text-[#50647e]">Target: <strong className="text-[#163459]">eigroz/KGflips</strong> (main branch)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGitModal(false)}
                className="w-8 h-8 rounded-full hover:bg-[#f0f5fc] flex items-center justify-center text-[#50647e] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#50647e] leading-relaxed mb-4">
              All files, images (<code className="text-[#163459] font-mono">logo.jpeg</code>, <code className="text-[#163459] font-mono">event-kgflips.png</code>), styles, and new <strong>#bundles</strong> features are committed and ready to upload into your empty repository.
            </p>

            <form onSubmit={handlePushToGit} className="space-y-4">
              <div className="bg-[#f7faff] border border-[#d3dfef] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#163459]">
                    GitHub Personal Access Token (repo scope)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=KGflips-Sync"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#2b5e9f] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Create token on GitHub (1-click)</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>

                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubPat}
                  onChange={(e) => setGithubPat(e.target.value)}
                  className="w-full bg-white border border-[#d3dfef] rounded-xl px-4 py-2.5 text-sm text-[#163459] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b5e9f]/40 font-mono"
                />
                <span className="text-[11px] text-[#50647e] block mt-1.5">
                  Allows pushing the initial commit directly to your GitHub repository.
                </span>
              </div>

              {gitStatus && (
                <div className={`p-3.5 rounded-xl text-xs font-medium ${
                  gitStatus.includes('Success') 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-[#eaf1fb] text-[#163459] border border-[#d3dfef]'
                }`}>
                  {gitStatus}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPushing}
                  className="flex-1 bg-[#2b5e9f] hover:bg-[#214a80] text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wide cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Github className="w-4 h-4" />
                  <span>{isPushing ? 'Uploading to GitHub...' : 'Approve & Push to GitHub'}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowGitModal(false)}
                  className="bg-[#f0f5fc] hover:bg-[#e2edf9] text-[#50647e] py-3.5 px-5 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#163459] text-white px-5 py-3 rounded-full shadow-2xl text-xs font-semibold flex items-center gap-2 border border-white/20 animate-in slide-in-from-bottom-5">
          <Sparkles className="w-4 h-4 text-[#c8f047]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
