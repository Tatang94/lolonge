
import React, { useState, useEffect } from 'react';
import { Drama, UserProfile, Transaction, AdConfig } from './types';
import DramaCard from './components/VideoCard';
import UploadModal from './components/UploadModal';
import AdZone from './components/AdZone';
import { supabase } from './services/supabaseService';

type Page = 'HOME' | 'WATCH' | 'REWARDS' | 'PROFILE' | 'ADMIN_DASHBOARD';
type ModalType = 'NONE' | 'PURCHASES' | 'SECURITY' | 'RENAME' | 'AUTH' | 'WITHDRAW' | 'REFERRAL_INPUT';
type AdminTab = 'KONTEN' | 'USER' | 'IKLAN' | 'TRANSAKSI';

const App: React.FC = () => {
  const [dramas, setDramas] = useState<Drama[]>(() => {
    const saved = localStorage.getItem('gahar_dramas');
    return saved ? JSON.parse(saved) : [];
  });

  const [activePage, setActivePage] = useState<Page>('HOME');
  const [activeModal, setActiveModal] = useState<ModalType>('NONE');
  const [adminTab, setAdminTab] = useState<AdminTab>('KONTEN');
  const [selectedDrama, setSelectedDrama] = useState<Drama | null>(null);
  const [activeEpisodeIdx, setActiveEpisodeIdx] = useState(0);
  const [isCheckingIP, setIsCheckingIP] = useState(false);
  
  const [coinTimer, setCoinTimer] = useState(10);
  const [showRewardToast, setShowRewardToast] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(50);
  
  const [session, setSession] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [withdrawForm, setWithdrawForm] = useState({ method: 'DANA', account: '', amount: 1000 });
  const [referralInput, setReferralInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const generateReferralCode = (id: string) => {
    return "GHR-" + id.slice(-5).toUpperCase();
  };

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('gahar_user');
    const defaultId = 'u-' + Math.random().toString(36).substr(2, 9);
    const parsed = saved ? JSON.parse(saved) : {
      id: defaultId,
      name: 'User Gahar',
      coins: 100,
      isVip: false,
      history: [],
      favorites: [],
      transactions: [
        { id: 't-init', date: new Date().toLocaleDateString(), type: 'REWARD', label: 'Welcome Bonus GAHAR', amount: 100, status: 'SUCCESS' }
      ],
      lastCheckIn: '',
      role: 'USER',
      referralCode: generateReferralCode(defaultId),
      watchTimeMinutes: 0,
      referralCount: 0,
      completedMissions: []
    };
    if (!parsed.referralCode) parsed.referralCode = generateReferralCode(parsed.id);
    return parsed;
  });

  const [ads, setAds] = useState<AdConfig[]>(() => {
    const saved = localStorage.getItem('gahar_ads');
    return saved ? JSON.parse(saved) : [
      { id: 'ad-top', position: 'TOP', scriptCode: '', isActive: false },
      { id: 'ad-bottom', position: 'BOTTOM', scriptCode: '', isActive: false }
    ];
  });

  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
          setUser(prev => ({ 
              ...prev, 
              name: session.user.user_metadata.full_name || prev.name,
              id: session.user.id
          }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (activePage !== 'WATCH') return; 
    const interval = setInterval(() => {
      setCoinTimer((prev) => {
        if (prev <= 1) {
          setUser(u => ({ ...u, coins: u.coins + 50 }));
          setRewardAmount(50);
          setShowRewardToast(true);
          setTimeout(() => setShowRewardToast(false), 2000);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activePage]);

  useEffect(() => {
    localStorage.setItem('gahar_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('gahar_dramas', JSON.stringify(dramas));
  }, [dramas]);

  useEffect(() => {
    localStorage.setItem('gahar_ads', JSON.stringify(ads));
  }, [ads]);

  const addTransaction = (type: Transaction['type'], label: string, amount: number) => {
    const newTx: Transaction = {
      id: 't-' + Date.now(),
      date: new Date().toLocaleString('id-ID'),
      type, label, amount, status: 'SUCCESS'
    };
    setUser(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions].slice(0, 50)
    }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'LOGIN' && authForm.email === 'admin' && authForm.password === 'lolong123') {
        setIsAdmin(true);
        setUser(prev => ({ ...prev, name: 'Admin Gahar', role: 'ADMIN' }));
        alert('Akses Admin GAHAR Terbuka!');
        setActiveModal('NONE');
        setActivePage('ADMIN_DASHBOARD');
        return;
    }

    try {
        if (authMode === 'REGISTER') {
            const { error } = await supabase.auth.signUp({
                email: authForm.email,
                password: authForm.password,
                options: { data: { full_name: authForm.name } }
            });
            if (error) throw error;
            alert('Pendaftaran berhasil! Cek email untuk verifikasi.');
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email: authForm.email,
                password: authForm.password
            });
            if (error) throw error;
            alert('Selamat Datang di GAHAR!');
            setActiveModal('NONE');
        }
    } catch (err: any) {
        alert(err.message);
    }
  };

  const handleLogout = async () => {
      if (isAdmin) setIsAdmin(false);
      else await supabase.auth.signOut();
      alert('Anda telah keluar.');
      setActivePage('HOME');
  };

  const handleWithdrawClick = () => {
    if (!session && !isAdmin) {
        setActiveModal('AUTH');
    } else {
        setActiveModal('WITHDRAW');
    }
  };

  const submitWithdrawal = () => {
      if (user.coins < withdrawForm.amount) {
          alert('Koin tidak cukup!');
          return;
      }
      setUser(prev => ({ ...prev, coins: prev.coins - withdrawForm.amount }));
      addTransaction('PURCHASE', `Penarikan ${withdrawForm.method} - ${withdrawForm.account}`, -withdrawForm.amount);
      alert('Permintaan Penarikan Berhasil Dikirim!');
      setActiveModal('NONE');
  };

  const handleApplyReferral = () => {
    if (referralInput.startsWith('GHR-')) {
      const bonus = 1000;
      setUser(prev => ({
        ...prev,
        coins: prev.coins + bonus,
        referredBy: referralInput,
        transactions: [{
          id: 't-ref-' + Date.now(),
          date: new Date().toLocaleString('id-ID'),
          type: 'REWARD', label: 'Bonus Referral', amount: bonus, status: 'SUCCESS'
        }, ...prev.transactions].slice(0, 50)
      }));
      alert(`Berhasil! Bonus ${bonus} Koin.`);
      setActiveModal('NONE');
    }
  };

  const claimDailyReward = () => {
    const today = new Date().toISOString().split('T')[0];
    if (user.lastCheckIn === today) return;
    setIsCheckingIP(true);
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        coins: prev.coins + 50,
        lastCheckIn: today
      }));
      addTransaction('REWARD', 'Daily Check-in Bonus', 50);
      setIsCheckingIP(false);
      alert('Mantap! 50 Koin mendarat.');
    }, 1500);
  };

  const GaharLogo = () => (
    <div className="flex items-center gap-1.5 cursor-pointer select-none group" onClick={() => setActivePage('HOME')}>
        <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-red-600/20 blur-md rounded-full group-hover:bg-red-600/40 transition-all"></div>
            <span className="relative text-2xl">⚡</span>
        </div>
        <div className="flex flex-col -space-y-1">
            <h1 className="font-serif italic text-2xl leading-none tracking-tighter">
                <span className="text-white group-hover:text-red-500 transition-colors">GA</span>
                <span className="shimmer-brand bg-clip-text text-transparent">HAR</span>
            </h1>
            <span className="text-[6px] font-black text-red-500 uppercase tracking-[0.3em]">Intensity 100%</span>
        </div>
    </div>
  );

  return (
    <div className="main-container max-w-[380px] mx-auto relative border-x border-slate-900 overflow-hidden shadow-2xl bg-slate-950">
      {showRewardToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] bg-emerald-600 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-bounce">
          ⚡ +{rewardAmount} KOIN GAHAR!
        </div>
      )}

      {activePage !== 'WATCH' && (
        <div className="px-5 py-4 flex justify-between items-center bg-slate-950/80 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/5">
          <GaharLogo />
          <div className="bg-slate-900 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-800 shadow-inner group cursor-pointer active:scale-95 transition-all">
            <span className="text-base group-hover:rotate-12 transition-transform">🪙</span>
            <span className="text-xs font-black text-white">{user.coins}</span>
          </div>
        </div>
      )}

      <div className="scroll-container no-scrollbar">
        {activePage === 'HOME' && (
          <div className="p-3.5 space-y-3.5 pb-24">
            <AdZone scriptCode={ads.find(a => a.position === 'TOP' && a.isActive)?.scriptCode || ''} id="top-banner" />
            <div className="px-1">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex items-center gap-2.5 text-slate-500 hover:border-red-600/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Cari video viral...</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {dramas.map(drama => <DramaCard key={drama.id} drama={drama} onClick={() => { setSelectedDrama(drama); setActivePage('WATCH'); }} />)}
            </div>
            <AdZone scriptCode={ads.find(a => a.position === 'BOTTOM' && a.isActive)?.scriptCode || ''} id="bottom-banner" />
          </div>
        )}

        {activePage === 'WATCH' && selectedDrama && (
          <div className="h-screen bg-black relative flex flex-col animate-in fade-in duration-500">
             <div className="absolute top-4 right-4 z-[60] flex items-center gap-1.5 bg-black/40 backdrop-blur-xl px-2.5 py-1 rounded-full border border-white/10">
                <div className="w-5 h-5 relative flex items-center justify-center">
                   <svg className="w-full h-full -rotate-90">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/20" />
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-amber-500"
                      strokeDasharray={50}
                      strokeDashoffset={50 - ((10 - coinTimer) * 5)}
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <span className="absolute text-[6px] font-black text-white">{coinTimer}</span>
                </div>
                <span className="text-[9px] font-black text-white">{user.coins} 🪙</span>
             </div>
             <div className="flex-1 w-full bg-slate-950 flex items-center justify-center">
                <iframe src={selectedDrama.episodes[activeEpisodeIdx].url} className="w-full h-full" allowFullScreen scrolling="no" />
             </div>
             <button onClick={() => setActivePage('HOME')} className="absolute top-4 left-4 w-10 h-10 bg-black/40 backdrop-blur-2xl rounded-xl text-white border border-white/10 z-[60] hover:bg-red-600 transition-colors">✕</button>
          </div>
        )}

        {activePage === 'REWARDS' && (
          <div className="p-5 space-y-6 animate-in slide-in-from-right pb-24">
            <header className="text-center py-4 flex flex-col items-center">
                <GaharLogo />
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-3">Pusat Hadiah Gahar</p>
            </header>
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                    <h3 className="text-5xl font-black text-white tracking-tighter shimmer-brand bg-clip-text text-transparent">{user.coins}</h3>
                    <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-tight">Koin Terkumpul</p>
                </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-[1.5rem] space-y-3">
                <div className="flex justify-between items-center">
                    <p className="text-[9px] font-black text-white uppercase tracking-widest">Undang Rekan</p>
                    <div onClick={() => { navigator.clipboard.writeText(user.referralCode); alert("Salin!") }} className="bg-slate-950 px-3 py-1.5 rounded-lg border border-red-600/30 cursor-pointer text-[10px] font-black text-white tracking-widest active:scale-95 transition-all">{user.referralCode}</div>
                </div>
                {!user.referredBy && <button onClick={() => setActiveModal('REFERRAL_INPUT')} className="w-full py-2.5 bg-slate-800 rounded-lg text-[9px] font-black text-red-500 uppercase tracking-widest border border-red-500/20 active:bg-red-600 transition-colors">Masukkan Kode Teman</button>}
            </div>

            <div className="grid grid-cols-1 gap-3">
                <button onClick={claimDailyReward} disabled={user.lastCheckIn === new Date().toISOString().split('T')[0] || isCheckingIP} className="bg-slate-900 border border-slate-800 p-4 rounded-[1.2rem] flex items-center justify-between group active:scale-95 disabled:opacity-50">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Ambil Jatah Harian</span>
                    <span className="bg-red-600 px-2.5 py-1 rounded-md text-[9px] text-white font-black">KLAIM</span>
                </button>
                <button onClick={handleWithdrawClick} className="bg-slate-900 border border-slate-800 p-4 rounded-[1.2rem] flex items-center justify-between group active:scale-95">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Cairkan Koin</span>
                    <span className="bg-emerald-600 px-2.5 py-1 rounded-md text-[9px] text-white font-black">TARIK</span>
                </button>
            </div>
          </div>
        )}

        {activePage === 'PROFILE' && (
          <div className="p-6 space-y-8 animate-in slide-in-from-left pb-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-red-600 to-amber-600 p-1 shadow-2xl group cursor-pointer">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="Avatar" className="w-full h-full object-cover rounded-[2.3rem] bg-slate-950 group-hover:scale-105 transition-transform" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-serif italic text-white">{user.name}</h2>
                <p className="text-red-500 font-black text-[9px] uppercase tracking-[0.3em]">GAHAR {isAdmin ? 'ADMIN' : (session ? 'Elite Member' : 'Visitor')}</p>
              </div>
            </div>

            <div className="space-y-2.5">
               {!session && !isAdmin ? (
                 <button onClick={() => setActiveModal('AUTH')} className="w-full p-4.5 bg-red-600 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all">MASUK KE AKUN</button>
               ) : (
                 <>
                   <button onClick={() => setActiveModal('PURCHASES')} className="w-full p-4.5 bg-slate-900/40 border border-slate-800 rounded-2xl flex justify-between items-center text-white text-[10px] font-black uppercase tracking-widest hover:border-red-600/40 transition-colors"><span>📊 Riwayat Transaksi</span><span>›</span></button>
                   {isAdmin && <button onClick={() => setActivePage('ADMIN_DASHBOARD')} className="w-full p-4.5 bg-red-600/20 border border-red-600/40 rounded-2xl text-red-500 font-black uppercase text-[10px] tracking-widest text-center active:bg-red-600 active:text-white transition-all">Masuk Panel Admin</button>}
                   <button onClick={handleLogout} className="w-full p-4.5 border border-red-500/30 rounded-2xl text-red-500 font-black uppercase text-[10px] tracking-widest active:bg-red-600 active:text-white transition-all">KELUAR</button>
                 </>
               )}
            </div>
          </div>
        )}

        {activePage === 'ADMIN_DASHBOARD' && (
            <div className="p-6 pb-24 space-y-6 animate-in fade-in h-screen flex flex-col overflow-hidden">
              <div className="flex justify-between items-center flex-shrink-0">
                <GaharLogo />
                <button onClick={() => setActivePage('PROFILE')} className="text-[9px] font-black text-red-500 uppercase tracking-widest border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-all">Back</button>
              </div>

              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 flex-shrink-0">
                {(['KONTEN', 'USER', 'IKLAN', 'TRANSAKSI'] as AdminTab[]).map(tab => (
                  <button key={tab} onClick={() => setAdminTab(tab)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === tab ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="bg-slate-900/50 rounded-[1.5rem] p-4 border border-slate-800 flex-1 overflow-y-auto no-scrollbar shadow-inner">
                {adminTab === 'KONTEN' && (
                  <div className="space-y-3">
                    <button onClick={() => setShowUpload(true)} className="w-full bg-red-600 py-2.5 rounded-lg text-white font-black text-[9px] uppercase hover:bg-red-500">TAMBAH VIDEO +</button>
                    {dramas.map(d => (
                      <div key={d.id} className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 group">
                        <div className="flex-1 text-[10px] font-bold text-white line-clamp-1">{d.title}</div>
                        <button onClick={() => setDramas(prev => prev.filter(item => item.id !== d.id))} className="p-1.5 text-red-500">🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
                {adminTab === 'TRANSAKSI' && (
                  <div className="space-y-2">
                    {user.transactions.map(tx => (
                        <div key={tx.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                            <div className="text-left space-y-0.5">
                                <p className="text-[9px] font-black text-white uppercase line-clamp-1">{tx.label}</p>
                                <p className="text-[7px] text-slate-600 uppercase font-bold">{tx.date}</p>
                            </div>
                            <div className={`text-[9px] font-black ${tx.amount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {tx.amount >= 0 ? '+' : ''}{tx.amount}
                            </div>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        )}
      </div>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-3xl py-3 px-8 flex justify-between items-center z-50 shadow-2xl">
          <button onClick={() => { setActivePage('HOME'); setIsAdmin(false); }} className={`flex flex-col items-center gap-1 transition-all ${activePage === 'HOME' ? 'text-red-500 scale-105' : 'text-slate-600'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg><span className="text-[6px] font-black uppercase">Beranda</span></button>
          <button onClick={() => { setActivePage('REWARDS'); setIsAdmin(false); }} className={`flex flex-col items-center gap-1 transition-all ${activePage === 'REWARDS' ? 'text-red-500 scale-105' : 'text-slate-600'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg><span className="text-[6px] font-black uppercase">Hadiah</span></button>
          <button onClick={() => { setActivePage('PROFILE'); setIsAdmin(false); }} className={`flex flex-col items-center gap-1 transition-all ${activePage === 'PROFILE' ? 'text-red-500 scale-105' : 'text-slate-600'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg><span className="text-[6px] font-black uppercase">Saya</span></button>
      </nav>

      {/* MODALS - Tetap proporsional */}
      {activeModal === 'REFERRAL_INPUT' && (
          <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full space-y-6 bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
                  <h2 className="font-serif italic text-2xl text-white text-center">Kode Rekan</h2>
                  <input type="text" placeholder="GHR-ABCDE" className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white text-xs font-bold text-center tracking-widest outline-none focus:border-red-600 transition-colors" value={referralInput} onChange={e => setReferralInput(e.target.value.toUpperCase())} />
                  <button onClick={handleApplyReferral} className="w-full py-3.5 bg-red-600 rounded-xl text-white font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">TERAPKAN KODE</button>
                  <button onClick={() => setActiveModal('NONE')} className="w-full text-[9px] text-slate-500 font-black uppercase tracking-widest">Batal</button>
              </div>
          </div>
      )}

      {activeModal === 'AUTH' && (
          <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full space-y-6 bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
                  <div className="text-center">
                      <GaharLogo />
                      <h2 className="font-serif italic text-2xl text-white mt-3">{authMode === 'LOGIN' ? 'Masuk' : 'Daftar Akun'}</h2>
                  </div>
                  <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                      {authMode === 'REGISTER' && <input type="text" placeholder="NAMA LENGKAP" className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white text-xs font-bold focus:border-red-600 outline-none transition-all" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required />}
                      <input type="text" placeholder="EMAIL ATAU USERNAME" className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white text-xs font-bold focus:border-red-600 outline-none transition-all" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} required />
                      <input type="password" placeholder="PASSWORD" className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white text-xs font-bold focus:border-red-600 outline-none transition-all" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
                      <button type="submit" className="w-full py-3.5 bg-red-600 rounded-xl text-white font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">{authMode === 'LOGIN' ? 'MASUK' : 'DAFTAR'}</button>
                  </form>
                  <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="w-full text-[9px] text-slate-500 font-black uppercase tracking-widest hover:text-red-500 transition-colors">
                    {authMode === 'LOGIN' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
                  </button>
                  <button onClick={() => setActiveModal('NONE')} className="w-full mt-2 text-[9px] text-slate-700 font-black uppercase tracking-widest">Tutup</button>
              </div>
          </div>
      )}

      {activeModal === 'WITHDRAW' && (
          <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full space-y-6 bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
                  <h2 className="font-serif italic text-2xl text-white mb-2 text-center">Penarikan</h2>
                  <div className="space-y-3.5">
                      <div className="flex gap-1.5">
                          {['DANA', 'OVO', 'GOPAY'].map(m => (
                              <button key={m} onClick={() => setWithdrawForm({...withdrawForm, method: m})} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black tracking-widest transition-all ${withdrawForm.method === m ? 'bg-red-600 text-white' : 'bg-slate-950 text-slate-500'}`}>{m}</button>
                          ))}
                      </div>
                      <input type="text" placeholder="NOMOR E-WALLET" className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white text-xs font-bold focus:border-red-600 outline-none transition-all" value={withdrawForm.account} onChange={e => setWithdrawForm({...withdrawForm, account: e.target.value})} />
                      <input type="number" min="1000" className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white text-xs font-bold focus:border-red-600 outline-none transition-all" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: parseInt(e.target.value)})} />
                      <button onClick={submitWithdrawal} className="w-full py-3.5 bg-emerald-600 rounded-xl text-white font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">AJUKAN</button>
                      <button onClick={() => setActiveModal('NONE')} className="w-full text-[9px] text-slate-500 font-black uppercase tracking-widest">Batal</button>
                  </div>
              </div>
          </div>
      )}

      {activeModal === 'PURCHASES' && (
          <div className="fixed inset-0 z-[400] bg-black/95 p-6 animate-in fade-in flex flex-col items-center justify-center">
              <div className="w-full max-w-[340px] bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl space-y-5 max-h-[70vh] flex flex-col">
                  <h2 className="font-serif italic text-xl text-white text-center">Riwayat Transaksi</h2>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5">
                      {user.transactions.map(tx => (
                          <div key={tx.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                              <div><p className="text-[9px] font-bold text-white uppercase">{tx.label}</p><p className="text-[7px] text-slate-600">{tx.date}</p></div>
                              <div className={`text-[9px] font-black ${tx.amount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{tx.amount >= 0 ? '+' : ''}{tx.amount}</div>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setActiveModal('NONE')} className="w-full py-3 bg-slate-800 rounded-xl text-[9px] font-black text-slate-500 uppercase">Tutup</button>
              </div>
          </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={(d) => {
          const newDrama: Drama = {
            id: 'd-' + Date.now(), title: d.title || 'Untitled', coverUrl: d.coverUrl || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
            description: d.description || '', genre: d.genre || 'Trending', rating: 9.9, author: user.name, 
            episodes: [{ id: 'e-' + Date.now(), episodeNumber: 1, url: d.url, isLocked: false, coinCost: 0 }]
          };
          setDramas(prev => [newDrama, ...prev]);
          setShowUpload(false);
          alert('Konten Berhasil Terbit!');
      }} />}
    </div>
  );
};

export default App;
