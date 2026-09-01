import { useEffect, useState } from 'react';
import { apiRequest, clearTokens } from '../utils/api';
import ProductsPage from './ProductsPage';
import CouponPage from './CouponPage';
import OrdersPage from './OrdersPage';
import logoImg from '../assets/kalastra-logo.png';

interface AdminUser {
  sub: string;
  email: string;
  name: string;
  role: string;
  groups: string[];
}

interface CategoryTotal {
  count: number;
  selling: number;
  buying: number;
}

interface AnalyticsData {
  categoryTotals: Record<string, CategoryTotal>;
  totalRevenue: number;
  totalInvested: number;
  profitMargin: number;
  ratio: number;
  productCount: number;
  monthlyIncome: { label: string; value: number };
  yearlyIncome: { label: string; value: number };
  lastMonthIncome: { label: string; value: number };
  onlineVsCod: { online: number; cod: number };
}

type SidebarTab = 'dashboard' | 'products' | 'coupons' | 'orders';

const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Outfit:wght@300;400;500;600&display=swap');
  
  .font-cinzel { font-family: 'Cinzel', serif; }
  .font-outfit { font-family: 'Outfit', sans-serif; }
  
  .glass-panel {
    background: rgba(26, 11, 46, 0.4);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(212, 175, 55, 0.15);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  }
  
  .gold-gradient-text {
    background: linear-gradient(135deg, #FFDF73 0%, #D4AF37 50%, #B8922A 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .hover-lift {
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease;
  }
  .hover-lift:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 40px rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.4);
  }
  
  .cream-text {
    color: #FDFBF7;
  }
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0f0518; }
  ::-webkit-scrollbar-thumb { background: #D4AF37; border-radius: 3px; }

  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => { loadAdminProfile(); }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadAnalytics();
  }, [activeTab]);

  const loadAdminProfile = async () => {
    setLoading(true);
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) setAdminUser(JSON.parse(storedUser));
    const res = await apiRequest('/admin/me');
    setLoading(false);
    if (res.success && res.data) {
      setAdminUser({
        sub: res.data.uid,
        email: res.data.email,
        name: res.data.name,
        role: res.data.role,
        groups: res.data.groups || [],
      });
      localStorage.setItem('adminUser', JSON.stringify(res.data));
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    const res = await apiRequest('/admin/analytics');
    if (res.success && res.data) setAnalytics(res.data);
    setAnalyticsLoading(false);
  };

  const handleLogout = () => {
    clearTokens();
    localStorage.removeItem('adminUser');
    window.location.reload();
  };

  const handleNavClick = (tab: SidebarTab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  // Unicode escape so the Rupee sign is never affected by file encoding
  const formatCurrency = (value: number) =>
    '\u20B9' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const sidebarNav = [
    { id: 'dashboard' as SidebarTab, label: 'Dashboard' },
    { id: 'products' as SidebarTab, label: 'Products' },
    { id: 'coupons' as SidebarTab, label: 'Coupons' },
    { id: 'orders' as SidebarTab, label: 'Orders' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0518] flex items-center justify-center font-outfit relative overflow-hidden">
        <style>{customStyles}</style>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37] rounded-full blur-[150px] opacity-10" />
        <div className="glass-panel rounded-3xl p-12 max-w-sm w-full text-center mx-4 relative z-10 border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.15)]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse" />
          <img src={logoImg} alt="Kalastra Logo" className="h-24 mx-auto mb-10 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-2 border-t-[#D4AF37] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
            <div className="absolute inset-3 border-2 border-b-[#FFDF73] border-r-transparent border-t-transparent border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="mt-8 text-[#D4AF37] text-xs tracking-[0.3em] uppercase font-cinzel font-bold">Unlocking Sanctum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0518] cream-text font-outfit selection:bg-[#D4AF37] selection:text-[#0f0518] relative">
      <style>{customStyles}</style>

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#3a1b66] blur-[150px] opacity-20" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#D4AF37] blur-[180px] opacity-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-15 mix-blend-overlay" />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-20 px-6 glass-panel border-b border-[#D4AF37]/20">
        <button onClick={() => setMobileSidebarOpen(true)} className="p-2 text-[#D4AF37] hover:text-[#FFDF73] transition-colors cursor-pointer">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h8" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Kalastra" className="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
          <span className="text-xl font-black gold-gradient-text font-cinzel tracking-widest">Kalastra</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-[#0f0518]/80 backdrop-blur-md transition-opacity" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen z-[70] glass-panel border-r border-[#D4AF37]/20 flex flex-col transition-all duration-500 ease-in-out lg:z-40 ${sidebarCollapsed ? 'lg:w-24' : 'lg:w-80'} ${mobileSidebarOpen ? 'translate-x-0 w-[85%]' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="flex items-center gap-5 px-8 h-32 border-b border-[#D4AF37]/10 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent" />
          <img src={logoImg} alt="Logo" className={`${sidebarCollapsed ? 'h-10 mx-auto' : 'h-16'} w-auto object-contain relative z-10 drop-shadow-[0_0_12px_rgba(212,175,55,0.5)] transition-all duration-500`} />
          {!sidebarCollapsed && (
            <div className="min-w-0 relative z-10">
              <h1 className="text-2xl font-black gold-gradient-text font-cinzel tracking-[0.15em]">Kalastra</h1>
              <p className="text-[10px] text-[#D4AF37]/70 uppercase tracking-[0.4em] mt-1.5 font-bold">Admin</p>
            </div>
          )}
        </div>

        {/* Mobile Close */}
        <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden absolute top-8 right-8 p-2 text-[#A08BA6] hover:text-[#D4AF37]">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Desktop Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-4 top-28 w-8 h-8 rounded-full bg-[#1a0b2e] border border-[#D4AF37]/50 text-[#D4AF37] items-center justify-center text-sm hover:bg-[#D4AF37] hover:text-[#0f0518] transition-all cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.3)] z-50 hover:scale-110"
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>

        {/* Navigation */}
        <nav className="flex-1 py-10 space-y-4 px-5">
          {sidebarNav.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-6'} py-4 rounded-xl text-base font-medium transition-all duration-500 relative group overflow-hidden ${
                activeTab === item.id
                  ? 'text-[#0f0518] bg-gradient-to-r from-[#D4AF37] to-[#FFDF73] shadow-[0_0_25px_rgba(212,175,55,0.4)] border border-[#FFDF73]/50'
                  : 'text-[#A08BA6] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 border border-transparent hover:border-[#D4AF37]/30'
              }`}
              title={sidebarCollapsed ? item.label : ''}
            >
              {activeTab !== item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}
              <span className={`relative z-10 tracking-[0.2em] font-cinzel font-bold ${sidebarCollapsed ? 'text-lg' : 'text-sm'}`}>
                {sidebarCollapsed ? item.label.charAt(0) : item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Profile */}
        {adminUser && !sidebarCollapsed && (
          <div className="px-8 py-6 border-t border-[#D4AF37]/10 bg-gradient-to-t from-[#1a0b2e]/60 to-transparent">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#997A15] flex items-center justify-center text-lg font-black text-[#0f0518] shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.4)] font-cinzel border-2 border-[#FFDF73]/50">
                {adminUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#FDFBF7] truncate">{adminUser.name}</p>
                <p className="text-[11px] text-[#D4AF37]/80 truncate tracking-widest mt-0.5">{adminUser.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="px-5 py-5 border-t border-[#D4AF37]/10">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-4 px-6'} py-4 rounded-xl text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all cursor-pointer border border-transparent hover:border-red-500/30 group`}
          >
            <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">&#9167;</span>
            {!sidebarCollapsed && <span className="tracking-[0.15em] uppercase text-xs font-bold">Relinquish Access</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`relative z-10 transition-all duration-500 ${sidebarCollapsed ? 'lg:ml-24' : 'lg:ml-80'} pt-28 lg:pt-10 min-h-screen`}>
        {activeTab === 'dashboard' && (
          <div className="p-6 sm:p-10 lg:p-16 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-16">
              <div className="relative">
                <div className="absolute -left-6 top-3 bottom-3 w-1.5 bg-gradient-to-b from-[#FFDF73] to-[#997A15] rounded-r-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                <h1 className="text-4xl sm:text-6xl font-black gold-gradient-text font-cinzel tracking-tight leading-none drop-shadow-lg">
                  Grand Overview
                </h1>
                <p className="text-base text-[#A08BA6] mt-4 font-light tracking-wide">
                  Welcome back, <span className="text-[#D4AF37] font-medium">{adminUser?.name || 'Admin'}</span>.
                </p>
              </div>
              <button
                onClick={loadAnalytics}
                className="group relative px-8 py-3.5 bg-[#0f0518]/50 backdrop-blur-md overflow-hidden rounded-xl self-start sm:self-auto border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#D4AF37] to-[#FFDF73] opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <span className="relative z-10 text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] group-hover:text-[#FFDF73] transition-colors duration-300">
                  Refresh
                </span>
              </button>
            </div>

            {/* Analytics Area */}
            {analyticsLoading ? (
              <div className="flex flex-col items-center justify-center py-40">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-2 border-[#D4AF37]/20 rounded-full" />
                  <div className="absolute inset-0 border-2 border-t-[#D4AF37] rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
                  <div className="absolute inset-4 border-2 border-[#FFDF73]/20 rounded-full" />
                  <div className="absolute inset-4 border-2 border-b-[#FFDF73] rounded-full animate-spin shadow-[0_0_15px_rgba(255,223,115,0.4)]" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
                </div>
                <p className="mt-8 text-[#D4AF37] text-sm uppercase tracking-[0.4em] font-cinzel animate-pulse font-bold">Loading...</p>
              </div>
            ) : analytics ? (
              <div className="space-y-16">

                {/* Category Cards */}
                <section>
                  <div className="flex items-center gap-6 mb-8">
                    <h2 className="text-base font-bold text-[#FDFBF7] uppercase tracking-[0.25em] font-cinzel">Category Overview</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent" />
                  </div>
                  {Object.keys(analytics.categoryTotals).length === 0 ? (
                    <div className="glass-panel rounded-3xl p-12 text-center border border-[#D4AF37]/15">
                      <p className="text-[#A08BA6] text-sm uppercase tracking-[0.3em] font-cinzel font-bold">No products yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {Object.entries(analytics.categoryTotals).map(([cat, data]) => (
                        <div key={cat} className="glass-panel rounded-3xl p-8 hover-lift relative overflow-hidden group">
                          <div className="absolute -right-20 -top-20 w-48 h-48 bg-gradient-to-br from-[#D4AF37]/15 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                          <div className="relative z-10">
                            {/* Category Name */}
                            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-cinzel font-bold mb-5">{cat}</p>

                            {/* Revenue — big number */}
                            <p className="text-4xl sm:text-5xl font-light text-[#FDFBF7] tracking-tight">
                              {formatCurrency(data.selling)}
                            </p>

                            {/* Divider row */}
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#D4AF37]/15">
                              {/* Units sold */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-[#A08BA6] uppercase tracking-[0.25em] font-bold">Units Sold</span>
                                <span className="text-lg font-semibold text-[#FDFBF7]">{data.count}</span>
                              </div>

                              <div className="w-px h-10 bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent" />

                              {/* Investment */}
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-[#A08BA6] uppercase tracking-[0.25em] font-bold">Investment</span>
                                <span className="text-lg font-semibold text-[#FDFBF7]">{formatCurrency(data.buying)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Key Metrics */}
                <section>
                  <div className="flex items-center gap-6 mb-8">
                    <h2 className="text-base font-bold text-[#FDFBF7] uppercase tracking-[0.25em] font-cinzel">Key Metrics</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <MetricCard label="Gross Revenue"    value={formatCurrency(analytics.totalRevenue)}  color="gold" />
                    <MetricCard label="Capital Invested" value={formatCurrency(analytics.totalInvested)} color="rose" />
                    <MetricCard
                      label="Yield Ratio"
                      value={analytics.ratio.toFixed(2) + 'x'}
                      color={analytics.ratio >= 1 ? 'emerald' : 'rose'}
                    />
                    <MetricCard label="Total Products"   value={String(analytics.productCount)}         color="purple" />
                  </div>
                </section>

                {/* Income Timeline */}
                <section>
                  <div className="flex items-center gap-6 mb-8">
                    <h2 className="text-base font-bold text-[#FDFBF7] uppercase tracking-[0.25em] font-cinzel">Revenue Timeline</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <IncomeCard label="This Month"   value={formatCurrency(analytics.monthlyIncome.value)}   period={analytics.monthlyIncome.label}   accent="#D4AF37" />
                    <IncomeCard label="This Year"    value={formatCurrency(analytics.yearlyIncome.value)}    period={analytics.yearlyIncome.label}    accent="#FFDF73" />
                    <IncomeCard label="Last Month"   value={formatCurrency(analytics.lastMonthIncome.value)} period={analytics.lastMonthIncome.label} accent="#B8922A" />
                  </div>
                </section>

              </div>
            ) : (
              <div className="text-center py-40 glass-panel rounded-[2.5rem] mx-auto max-w-2xl border border-[#D4AF37]/20">
                <p className="text-[#A08BA6] text-base uppercase tracking-[0.3em] font-cinzel mb-8 font-bold">Failed to load analytics.</p>
                <button
                  onClick={loadAnalytics}
                  className="px-10 py-4 bg-gradient-to-r from-[#D4AF37] to-[#997A15] text-[#0f0518] text-sm font-black uppercase tracking-[0.25em] rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all cursor-pointer font-cinzel hover:scale-105"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="p-6 sm:p-10 lg:p-16 animate-fade-in">
            <ProductsPage isAdminMode={true} />
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="p-6 sm:p-10 lg:p-16 animate-fade-in">
            <CouponPage />
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="p-6 sm:p-10 lg:p-16 animate-fade-in">
            <OrdersPage />
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'emerald' | 'gold' | 'rose' | 'purple';
}) {
  const accentColor =
    color === 'emerald' ? '#10B981' :
    color === 'gold'    ? '#D4AF37' :
    color === 'rose'    ? '#F43F5E' :
    '#8B5CF6';

  return (
    <div className="glass-panel rounded-3xl p-8 hover-lift relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-30 transition-opacity duration-700">
        <div className="w-16 h-16 rounded-full blur-[25px]" style={{ backgroundColor: accentColor }} />
      </div>
      <div
        className="absolute left-0 top-0 w-1.5 h-full transform scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-500 ease-out"
        style={{ backgroundColor: accentColor }}
      />
      <p className="text-[10px] font-cinzel font-black uppercase tracking-[0.3em] mb-5" style={{ color: accentColor }}>
        {label}
      </p>
      <p className="text-4xl font-light text-[#FDFBF7] tracking-tight group-hover:scale-[1.03] transition-transform duration-500 origin-left">
        {value}
      </p>
    </div>
  );
}

function IncomeCard({
  label,
  value,
  period,
  accent,
}: {
  label: string;
  value: string;
  period: string;
  accent: string;
}) {
  return (
    <div className="relative p-[1px] rounded-[2rem] overflow-hidden group hover-lift">
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5 z-0" />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0"
        style={{ background: `linear-gradient(135deg, transparent, ${accent}60, transparent)` }}
      />
      <div className="relative h-full bg-[#0a0310]/95 backdrop-blur-3xl rounded-[31px] p-8 sm:p-10 z-10 overflow-hidden flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
        <div
          className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full blur-[60px] opacity-20 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none"
          style={{ backgroundColor: accent }}
        />
        <div className="relative z-20 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start mb-10">
            <p className="text-[11px] font-cinzel font-black uppercase tracking-[0.35em] text-[#A08BA6] group-hover:text-white transition-colors duration-500">
              {label}
            </p>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }} />
          </div>
          <div className="mt-auto">
            <p className="text-4xl sm:text-5xl font-light text-[#FDFBF7] tracking-tighter mb-6 group-hover:scale-[1.02] transition-transform duration-500 origin-left">
              {value}
            </p>
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-md bg-[#1a0b2e] border border-[#D4AF37]/20"
                style={{ color: accent }}
              >
                {period}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}