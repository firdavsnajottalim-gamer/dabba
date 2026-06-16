import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Download,
  Upload,
  Plus,
  Search,
  Trash2,
  Check,
  X,
  RotateCcw,
  AlertCircle,
  FileSpreadsheet,
  Users,
  GraduationCap,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JournalRecord } from './types';

// Pre-defined student lists for Class 6 A and B divisions
const STUDENTS_6A = [
  "Malikov Zakariyo",
  "Malikova Fotima",
  "Muratov Abdulbosit",
  "Muratov Muhammadyusuf",
  "Muratov Muhammad",
  "Anvarov Baxriddin",
  "Soxibjonov G'olibjon",
  "Rasulova Shukrona",
  "Hamidullayeva Mubina",
  "Mirahmadova Oysha",
  "Nasimov Abdullo",
  "Abdulbositov Abubakr",
  "Giyasov Muhammadali",
  "Asqaraliyev Asadbek",
  "Abduqodirov Tolibjon"
];

const STUDENTS_6B = [
  "Odiljonov Firdavsbek",
  "To'xtaraliyev Shoxakbar",
  "Mamadaliyev Abdulhakim",
  "Bositxonov Boqixon",
  "Umarov Abdullo",
  "Abduqahharov Abdulaziz",
  "Mamadaliyev Mus'ab",
  "Najmiddinov Abdurahmon",
  "Karimov Jaloliddin",
  "Mahmudjanov Ali",
  "Abduvahobov Muhammadvafo",
  "Zokirov Muhammadali",
  "Azimova Hadija",
  "Muhammadjonova Lobarxon",
  "Mirsobitova Soliha",
  "Muratova Madina",
  "Rahmatullayev Sayfullo",
  "Ismailov Umarxon",
  "Mahmudjanov Ubaydullo"
];

export default function App() {
  // 1. Core States & Persistence (connected to server backend)
  const [records, setRecords] = useState<JournalRecord[]>(() => {
    try {
      const saved = localStorage.getItem('kitob_jurnali_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Local storage load error:", e);
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_auth_imtihon') === 'true';
  });
  const [activeUser, setActiveUser] = useState<string>(() => {
    return localStorage.getItem('active_auth_username') || 'mirjalol-t';
  });
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  const displayName = useMemo(() => {
    const norm = activeUser.trim().toLowerCase();
    if (norm === 'mirjalol-t') return 'Mirjalol Turdamirzayev';
    if (norm === 'firdavsiy') return 'Firdavsbek Odiljonov';
    if (norm === 'admin') return 'admin';
    if (norm === 'gey') return 'gey';
    return activeUser || 'Foydalanuvchi';
  }, [activeUser]);

  // UI Filter control
  const [selectedClass, setSelectedClass] = useState<number>(6); // Default class 6
  const [selectedClassLetter, setSelectedClassLetter] = useState<'HAMMASI' | 'A-SINF' | 'B-SINF'>('HAMMASI');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<string>('');

  // Background Theme Control is locked to white theme
  const bgTheme = 'oq';

  // Backup dropdown state
  const [showBackupDropdown, setShowBackupDropdown] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal control state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'O\'quvchi' | 'O\'qituvchi'>('O\'quvchi');

  // Modal Form Inputs state
  const [formClassGroup, setFormClassGroup] = useState<number>(6);
  const [formClassLetter, setFormClassLetter] = useState<'A' | 'B' | ''>('A');
  const [formName, setFormName] = useState<string>('');
  const [formExamType, setFormExamType] = useState<'Haftalik imtihon' | 'Choraklik imtihon' | 'Oylik imtihon' | 'Yillik imtihon' | 'Kitobxonlik imtihoni'>('Kitobxonlik imtihoni');
  const [formSubject, setFormSubject] = useState<string>('Matematika');
  const [formBookName, setFormBookName] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('2026-06-15'); // default from metadata
  const [formResult, setFormResult] = useState<number>(0);
  const [formGrade, setFormGrade] = useState<number>(0);

  // Fetch from backend on initial mount and merge content
  useEffect(() => {
    fetch('/api/records')
      .then(res => res.json())
      .then(serverData => {
        if (Array.isArray(serverData)) {
          setRecords(prevLocal => {
            const recordMap = new Map<string, JournalRecord>();
            
            // 1. Feed local items
            prevLocal.forEach(item => {
              if (item && item.id) recordMap.set(item.id, item);
            });
            
            // 2. Feed server items (only if local doesn't exist)
            serverData.forEach(item => {
              if (item && item.id) {
                if (!recordMap.has(item.id)) {
                  recordMap.set(item.id, item);
                }
              }
            });
            
            const mergedList = Array.from(recordMap.values());
            
            // If merged is different from server list, sync it up to server so the server has it!
            const serverIds = new Set(serverData.map(s => s.id));
            const hasLocalAdditions = mergedList.some(item => !serverIds.has(item.id));
            if (hasLocalAdditions || mergedList.length !== serverData.length) {
              fetch('/api/records', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mergedList)
              }).catch(err => console.error("Initial restore sync failure:", err));
            }
            
            // Save the merged back to localStorage too
            localStorage.setItem('kitob_jurnali_records', JSON.stringify(mergedList));
            return mergedList;
          });
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Ma'lumotlarni yuklashda xator, local storage ishlatilmoqda:", err);
        setIsLoading(false);
      });
  }, []);

  // Save changes to backend on records state modification (guarding race with isLoading)
  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('kitob_jurnali_records', JSON.stringify(records));
    
    fetch('/api/records', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records)
    })
    .catch(err => {
      console.error("Ma'lumotlarni backendga yozishda xato:", err);
    });
  }, [records, isLoading]);

  // Handle Login Authentication
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    const isValidMirjalol = cleanUsername === 'mirjalol-t' && cleanPassword === 't-mirjalol';
    const isValidMental = cleanUsername === 'mental' && cleanPassword === 'mental';
    const isValidAdmin = cleanUsername === 'admin' && cleanPassword === 'admin';
    const isValidFirdavsiy = cleanUsername === 'firdavsiy' && cleanPassword === 'wish';

    if (isValidMirjalol || isValidMental || isValidAdmin || isValidFirdavsiy) {
      setIsAuthenticated(true);
      localStorage.setItem('is_auth_imtihon', 'true');
      localStorage.setItem('active_auth_username', cleanUsername);
      setActiveUser(cleanUsername);
      setLoginError('');
    } else {
      setLoginError("Login yoki parol noto'g'ri! Iltimos qaytadan urinib ko'ring (bo'sh joylarsiz yozing).");
    }
  };

  // Logout action
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('is_auth_imtihon');
    localStorage.removeItem('active_auth_username');
    setActiveUser('');
    setUsername('');
    setPassword('');
  };

  // Outside click helper for the backup dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showBackupDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('#backup-parent-btn')) {
          setShowBackupDropdown(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBackupDropdown]);

  // Backups functionality
  const handleExportBackup = () => {
    try {
      const dataStr = JSON.stringify(records, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kitob_jurnali_zahira_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      setNotification("Zahira fayli muvaffaqiyatli saqlandi!");
      setShowBackupDropdown(false);
      setTimeout(() => setNotification(''), 4000);
    } catch (e) {
      console.error(e);
      alert("Zahirani eksport qilishda xatolik yuz berdi");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setRecords(parsed);
          setNotification("Zahira muvaffaqiyatli tiklandi!");
          setShowBackupDropdown(false);
          setTimeout(() => setNotification(''), 4000);
        } else {
          alert("Xato: JSON fayl massiv shaklida bo'lishi kerak!");
        }
      } catch (err) {
        alert("Faylni o'qishda xatolik yuz berdi: " + err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // clear input
  };

  // Delete dynamic record
  const handleDeleteRecord = (id: string, name: string) => {
    setRecords(prev => prev.filter(rec => rec.id !== id));
    setNotification(`${name} qaydi muvaffaqiyatli o'chirildi.`);
    setTimeout(() => setNotification(''), 4000);
  };

  // Open modal with default clean inputs
  const handleOpenModal = (type: 'O\'quvchi' | 'O\'qituvchi') => {
    setModalType(type);
    setFormClassGroup(selectedClass);
    setFormClassLetter('A'); // default select division A
    setFormName('');
    setFormExamType('Kitobxonlik imtihoni');
    setFormBookName('');
    setFormSubject('Matematika');
    setFormDate('2026-06-15');
    setFormResult(0);
    setFormGrade(0);
    setShowAddModal(true);
  };

  const handleSaveModalRecord = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || formName === '--_SELECT_--') {
      alert("Iltimos, ism va familiyani to'liq tanlang yoki kiriting!");
      return;
    }

    const newRecord: JournalRecord = {
      id: `record-${Date.now()}`,
      type: modalType,
      classGroup: formClassGroup,
      classLetter: formClassLetter,
      name: formName.trim(),
      examType: formExamType,
      date: formDate,
      result: Number(formResult) || 0,
      grade: Number(formGrade) || 0
    };

    if (formExamType === 'Kitobxonlik imtihoni') {
      newRecord.bookName = formBookName.trim() || "Noma'lum kitob";
    } else {
      newRecord.subject = formSubject;
    }

    setRecords(prev => [newRecord, ...prev]);
    setShowAddModal(false);
    setSelectedClass(formClassGroup); // Switch view to saved class
    
    // Auto align main screen class group letter to match what was added so they can see it instantly
    if (formClassLetter === 'A') {
      setSelectedClassLetter('A-SINF');
    } else if (formClassLetter === 'B') {
      setSelectedClassLetter('B-SINF');
    } else {
      setSelectedClassLetter('HAMMASI');
    }

    setNotification(`${formName.trim()} yozuvi jurnala muvaffaqiyatli qo'shildi!`);
    setTimeout(() => setNotification(''), 4000);
  };

  // Filter records based on active class, division letter, and search query
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      // 1. filter by class
      if (rec.classGroup !== selectedClass) return false;

      // 1b. filter by division letter (A or B subclass)
      if (selectedClassLetter !== 'HAMMASI') {
        const targetLetter = selectedClassLetter === 'A-SINF' ? 'A' : 'B';
        if (rec.classLetter !== targetLetter) return false;
      }

      // 2. filter by search text query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = rec.name.toLowerCase().includes(query);
        const matchExam = rec.examType.toLowerCase().includes(query);
        const matchBook = rec.bookName?.toLowerCase().includes(query) || false;
        const matchSubject = rec.subject?.toLowerCase().includes(query) || false;
        const matchType = rec.type.toLowerCase().includes(query);
        return matchName || matchExam || matchBook || matchSubject || matchType;
      }
      return true;
    });
  }, [records, selectedClass, selectedClassLetter, searchQuery]);

  // Statistics for the selected class (taking division into account)
  const classStats = useMemo(() => {
    const classRecords = records.filter(rec => {
      if (rec.classGroup !== selectedClass) return false;
      if (selectedClassLetter !== 'HAMMASI') {
        const targetLetter = selectedClassLetter === 'A-SINF' ? 'A' : 'B';
        if (rec.classLetter !== targetLetter) return false;
      }
      return true;
    });
    const studentsOnly = classRecords.filter(rec => rec.type === 'O\'quvchi');
    const teachersOnly = classRecords.filter(rec => rec.type === 'O\'qituvchi');
    return {
      total: classRecords.length,
      students: studentsOnly.length,
      teachers: teachersOnly.length
    };
  }, [records, selectedClass, selectedClassLetter]);

  // Format date correctly to Uzbekistan style DD.MM.YYYY
  const formatUzDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateString;
  };

  // 1. Force authorization screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans selection:bg-emerald-100 selection:text-emerald-950">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#10b981] text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/15">
              <BookOpen size={28} className="stroke-[2.5]" />
            </div>
            <h2 className="font-sans font-black text-stone-900 text-lg tracking-tight uppercase mt-4">
              IMTIHONLAR TIZIMI
            </h2>
            <p className="text-[11px] text-stone-400 font-bold tracking-wide">
              Kirish uchun login va parolni kiriting
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 border border-red-150 text-red-600 text-[11px] font-bold py-2.5 px-3 rounded-xl flex items-center gap-1.5">
                <AlertCircle size={13} />
                <span>{loginError}</span>
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-bold text-stone-500 mb-1">
                FOYDALANUVCHI NOMI (LOGIN)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Login..."
                className="w-full px-3 py-2 bg-white border border-stone-200 focus:border-[#10b981] rounded-xl text-xs font-semibold outline-none placeholder:text-stone-300"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 mb-1">
                MAXFIY SO'Z (PAROL)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parol..."
                  className="w-full pl-3 pr-10 py-2 bg-[#ffffff] border border-stone-200 focus:border-[#10b981] rounded-xl text-xs font-semibold outline-none placeholder:text-stone-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none transition-colors cursor-pointer"
                  title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs shadow-emerald-500/10"
            >
              Tizimga Kirish
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-stone-400">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  // Theme computed styling
  const wrapperClass = bgTheme === 'oq'
    ? 'min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-emerald-100 selection:text-emerald-950 pb-12 transition-all duration-300'
    : bgTheme === 'qora'
      ? 'min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-900 selection:text-white pb-12 transition-all duration-300'
      : 'min-h-screen bg-gradient-to-br from-[#064e3b] via-[#0b132b] to-[#1e1b4b] text-[#ecfdf5] font-sans selection:bg-emerald-800 selection:text-white pb-12 transition-all duration-300';

  const headerClass = bgTheme === 'oq'
    ? 'bg-white border-b border-stone-200 sticky top-0 z-40 px-6 py-4 shadow-3xs transition-all duration-300'
    : bgTheme === 'qora'
      ? 'bg-zinc-900 border-b border-zinc-805 sticky top-0 z-40 px-6 py-4 shadow-3xs text-zinc-100 transition-all duration-300'
      : 'bg-emerald-950/70 backdrop-blur-md border border-emerald-900/40 sticky top-0 z-40 px-6 py-4 shadow-3xs text-emerald-100 transition-all duration-300';

  const textLogoClass = bgTheme === 'oq'
    ? 'font-sans font-black text-stone-900 text-lg tracking-tight leading-none uppercase'
    : bgTheme === 'qora'
      ? 'font-sans font-black text-white text-lg tracking-tight leading-none uppercase'
      : 'font-sans font-black text-[#f1f5f9] text-lg tracking-tight leading-none uppercase';

  const btnBackupClass = bgTheme === 'oq'
    ? 'px-4 py-2 bg-white border border-stone-300 hover:border-slate-400 text-stone-700 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-3xs'
    : bgTheme === 'qora'
      ? 'px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-750 hover:border-zinc-650 text-zinc-100 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-3xs'
      : 'px-4 py-2 bg-emerald-900/40 border border-emerald-850/50 hover:bg-emerald-850/50 text-emerald-100 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-3xs';

  const containerClass = bgTheme === 'oq'
    ? 'bg-white border border-stone-200 rounded-[28px] overflow-hidden shadow-xs transition-all duration-300'
    : bgTheme === 'qora'
      ? 'bg-zinc-900 border border-zinc-800 rounded-[28px] overflow-hidden shadow-xs transition-all duration-300'
      : 'bg-[#101c23]/95 backdrop-blur-xl border border-emerald-900/45 rounded-[28px] overflow-hidden shadow-md transition-all duration-300';

  const cardHeaderClass = bgTheme === 'oq'
    ? 'border-b border-stone-150 px-6 py-4.5 bg-stone-50/50 flex justify-between items-center transition-all duration-300'
    : bgTheme === 'qora'
      ? 'border-b border-zinc-800 px-6 py-4.5 bg-zinc-850/40 flex justify-between items-center transition-all duration-300'
      : 'border-b border-emerald-950 px-6 py-4.5 bg-[#0f2127]/60 flex justify-between items-center transition-all duration-300';

  const cardTitleClass = bgTheme === 'oq'
    ? 'font-sans font-extrabold text-stone-800 text-sm tracking-tight'
    : bgTheme === 'qora'
      ? 'font-sans font-extrabold text-zinc-100 text-sm tracking-tight'
      : 'font-sans font-extrabold text-[#f1f5f9] text-sm tracking-tight';

  const labelClass = bgTheme === 'oq'
    ? 'text-stone-500 text-[12px] font-extrabold uppercase tracking-wider font-sans'
    : bgTheme === 'qora'
      ? 'text-zinc-300 text-[12px] font-extrabold uppercase tracking-wider font-sans'
      : 'text-emerald-300 text-[12px] font-extrabold uppercase tracking-wider font-sans';

  const searchBoxClass = bgTheme === 'oq'
    ? 'flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-stone-50/50 border border-stone-150 p-4.5 rounded-2xl transition-all duration-300'
    : bgTheme === 'qora'
      ? 'flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-950/40 border border-zinc-800 p-4.5 rounded-2xl transition-all duration-300'
      : 'flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#14252d]/90 border border-[#1b343e] p-4.5 rounded-2xl transition-all duration-300';

  const searchInputClass = bgTheme === 'oq'
    ? 'w-full pl-10 pr-4 py-2 bg-white border border-stone-200 focus:border-[#10b981] focus:ring-1 focus:ring-emerald-100 rounded-xl text-xs font-sans text-stone-800 outline-none placeholder:text-stone-400'
    : bgTheme === 'qora'
      ? 'w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 focus:border-[#10b981] focus:ring-1 focus:ring-zinc-900 rounded-xl text-xs font-sans text-zinc-100 outline-none placeholder:text-zinc-650'
      : 'w-full pl-10 pr-4 py-2 bg-[#17272f] border border-[#1b343e] focus:border-[#10b981] focus:ring-1 focus:ring-emerald-950 rounded-xl text-xs font-sans text-[#e2f0e7] outline-none placeholder:text-emerald-700/80';

  const subStatsTitleClass = bgTheme === 'oq'
    ? 'font-sans font-black text-stone-900 text-sm'
    : bgTheme === 'qora'
      ? 'font-sans font-black text-zinc-100 text-sm'
      : 'font-sans font-black text-emerald-250 text-sm';

  const tableContainerClass = bgTheme === 'oq'
    ? 'border border-stone-200 rounded-2xl overflow-hidden bg-white'
    : bgTheme === 'qora'
      ? 'border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/60'
      : 'border border-emerald-900/45 rounded-2xl overflow-hidden bg-[#12222a]/95';

  const tableHeaderClass = bgTheme === 'oq'
    ? 'bg-stone-50/80 border-b border-stone-200 text-stone-500 font-black tracking-wider text-[10px] uppercase'
    : bgTheme === 'qora'
      ? 'bg-zinc-850 border-b border-zinc-800 text-zinc-300 font-black tracking-wider text-[10px] uppercase'
      : 'bg-[#152731] border-b border-emerald-950/65 text-emerald-250 font-black tracking-wider text-[10px] uppercase';

  const tableRowClass = bgTheme === 'oq'
    ? 'border-b border-stone-150 hover:bg-stone-50/40 transition-colors'
    : bgTheme === 'qora'
      ? 'border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors text-zinc-200'
      : 'border-b border-[#1b343e]/40 hover:bg-[#1a2d36]/40 transition-colors text-[#e2f0e7]';

  const tableRowNameClass = bgTheme === 'oq'
    ? 'py-3.5 px-4 font-extrabold text-stone-900 font-sans whitespace-nowrap'
    : bgTheme === 'qora'
      ? 'py-3.5 px-4 font-extrabold text-white font-sans whitespace-nowrap'
      : 'py-3.5 px-4 font-extrabold text-emerald-100 font-sans whitespace-nowrap';

  const tableRowResultClass = bgTheme === 'oq'
    ? 'py-3.5 px-4 text-right font-black font-sans whitespace-nowrap text-stone-800'
    : bgTheme === 'qora'
      ? 'py-3.5 px-4 text-right font-black font-sans whitespace-nowrap text-zinc-100'
      : 'py-3.5 px-4 text-right font-black font-sans whitespace-nowrap text-emerald-250';

  const classBtnClass = (classNum: number) => {
    const isActive = selectedClass === classNum;
    if (isActive) {
      return 'h-[68px] rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer font-sans select-none focus:outline-none bg-[#10b981] text-white border-[#10b981] shadow-md shadow-emerald-500/20 transform scale-[1.03] animate-none';
    }
    
    if (bgTheme === 'oq') {
      return 'h-[68px] rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer font-sans select-none focus:outline-none bg-white border-stone-200 hover:border-stone-400 hover:bg-stone-50/50 text-stone-700';
    } else if (bgTheme === 'qora') {
      return 'h-[68px] rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer font-sans select-none focus:outline-none bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 text-zinc-300';
    } else {
      return 'h-[68px] rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer font-sans select-none focus:outline-none bg-[#16252c]/50 border-emerald-950/65 hover:border-emerald-800/50 hover:bg-[#1a2d36] text-emerald-100';
    }
  };

  return (
    <div className={wrapperClass}>
      {/* 1-to-1 Copied Header Panel */}
      <header className={headerClass}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo & Custom Subtitles */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#10b981] text-white flex items-center justify-center shadow-md shadow-emerald-500/15 transition-all">
              <BookOpen size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className={textLogoClass}>
                IMTIHONLAR NATIJASI
              </h1>
              <p className={`text-[10.5px] font-black mt-0.5 tracking-wide ${
                bgTheme === 'oq'
                  ? 'text-emerald-750'
                  : bgTheme === 'qora'
                    ? 'text-emerald-450'
                    : 'text-emerald-300'
              }`}>
                Xush kelibsiz, {displayName} 👋
              </p>
            </div>
          </div>

          {/* Action buttons matching first mockup */}
          <div className="flex flex-wrap items-center gap-2.5">


            {/* Backup control button */}
            <div className="relative" id="backup-parent-btn">
              <button
                onClick={() => setShowBackupDropdown(prev => !prev)}
                className={btnBackupClass}
              >
                <Upload size={14} className="text-emerald-600 animate-none shrink-0" />
                Zahira yuklash (JSON)
              </button>

              {/* Popup option menu for Backup */}
              <AnimatePresence>
                {showBackupDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className={`absolute right-0 mt-2 w-56 ${
                      bgTheme === 'oq'
                        ? 'bg-white border border-stone-200 text-stone-700'
                        : bgTheme === 'qora'
                          ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                          : 'bg-[#15242b] border border-emerald-900 text-emerald-100'
                    } rounded-xl shadow-lg py-2 z-50 text-xs font-sans`}
                  >
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full px-4 py-2.5 ${
                        bgTheme === 'oq' ? 'hover:bg-stone-50' : bgTheme === 'qora' ? 'hover:bg-zinc-800' : 'hover:bg-[#1a2d36]'
                      } text-left font-semibold flex items-center gap-2`}
                    >
                      <Upload size={13} className="text-stone-500" />
                      Fayldan zahirani yuklash (.json)
                    </button>
                    <button
                      onClick={handleExportBackup}
                      className={`w-full px-4 py-2.5 ${
                        bgTheme === 'oq' ? 'hover:bg-stone-50' : bgTheme === 'qora' ? 'hover:bg-zinc-800' : 'hover:bg-[#1a2d36]'
                      } text-left font-semibold flex items-center gap-2 border-t ${
                        bgTheme === 'oq' ? 'border-stone-100' : bgTheme === 'qora' ? 'border-zinc-800' : 'border-[#1b343e]/40'
                      }`}
                    >
                      <Download size={13} className="text-stone-500" />
                      Zahirani yuklab olish (.json)
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Main Add record action */}
            <button
              onClick={() => handleOpenModal('O\'quvchi')}
              className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs shadow-emerald-500/10 shrink-0"
            >
              <Plus size={15} />
              Natija Qo'shish
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0"
              title="Tizimdan chiqish"
            >
              <LogOut size={14} className="text-red-500 hover:scale-110 active:scale-95 transition-transform" />
              {displayName} (Chiqish)
            </button>
          </div>

        </div>
      </header>

      {/* Main interactive applet area */}
      <main className="max-w-7xl mx-auto mt-6 px-6">
        
        {/* Dynamic status/notification banner */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-emerald-50 border border-emerald-200 text-[#059669] font-sans font-bold text-xs rounded-2xl py-3.5 px-4 mb-4 flex items-center gap-2 shadow-3xs"
            >
              <Check size={14} className="bg-emerald-200 p-0.5 rounded-full" />
              <span>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic welcome notification box */}
        <div className={`mb-6 p-4.5 rounded-[22px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-all duration-300 ${
          bgTheme === 'oq'
            ? 'bg-[#f0fdf4] border-[#dcfce7] text-emerald-850'
            : bgTheme === 'qora'
              ? 'bg-emerald-950/15 border-emerald-900/35 text-emerald-250'
              : 'bg-[#122826] border-emerald-850/50 text-[#e6fcf0]'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce shrink-0">👋</span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">Tizim Administratori</h4>
              <p className="text-xs font-extrabold mt-0.5">Xush kelibsiz, {displayName}!</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 max-w-fit">
            FAOL SEANS • TIZIM VA BAZA TO'LIQ ISHCHI REJIMDA
          </span>
        </div>

        {/* Outer content container mimicking the mockup */}
        <div className={containerClass}>
          
          {/* Card title element (replacing old unneeded tabs) */}
          <div className={cardHeaderClass}>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-700 font-extrabold text-base">☰</span>
              <h2 className={cardTitleClass}>
                Imtihonlar Natijalari Jurnali
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Sinf Filtri section matching Image 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 text-sm">🗂️</span>
                <span className={labelClass}>
                  Sinfni Tanlang (1 - 11)
                </span>
              </div>

              {/* 1-11 Grid boxes */}
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-11 gap-2.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((classNum) => (
                  <button
                    key={classNum}
                    onClick={() => setSelectedClass(classNum)}
                    className={classBtnClass(classNum)}
                  >
                    <span className="text-base font-extrabold tracking-tight">
                      {classNum}
                    </span>
                    <span className={`text-[10px] uppercase font-bold mt-0.5 tracking-wider ${
                      selectedClass === classNum 
                        ? 'text-teal-100' 
                        : bgTheme === 'oq' 
                          ? 'text-stone-400' 
                          : 'text-stone-500'
                    }`}>
                      Sinf
                    </span>
                  </button>
                ))}
              </div>

              {/* Class Letter Divisions selector (A-sinf / B-sinf / Barchasi) */}
              <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-dashed border-stone-150">
                <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider mr-1.5">
                  SINF TURI / GURUHI:
                </span>
                <div className="flex rounded-xl bg-stone-100 p-0.5 border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setSelectedClassLetter('HAMMASI')}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      selectedClassLetter === 'HAMMASI'
                        ? 'bg-white text-stone-900 shadow-3xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    👥 Barchasi
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClassLetter('A-SINF')}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      selectedClassLetter === 'A-SINF'
                        ? 'bg-emerald-650 text-white shadow-3xs'
                        : 'text-stone-500 hover:text-emerald-700'
                    }`}
                  >
                    🅰️ A - sinf
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClassLetter('B-SINF')}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      selectedClassLetter === 'B-SINF'
                        ? 'bg-emerald-650 text-white shadow-3xs'
                        : 'text-stone-500 hover:text-emerald-700'
                    }`}
                  >
                    🅱️ B - sinf
                  </button>
                </div>

                {/* Info status cue for 6th class list */}
                {selectedClass === 6 && (
                  <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-150 ml-auto hidden sm:inline-block">
                    {selectedClassLetter === 'HAMMASI' ? "6-A va 6-B to'liq tarkibi faol" : selectedClassLetter === 'A-SINF' ? "Simulyatorda 6-A talabalari sozlangan" : "Simulyatorda 6-B talabalari sozlangan"}
                  </span>
                )}
              </div>
            </div>

            {/* Search Input Bar & Record Counter */}
            <div className={searchBoxClass}>
              <div className="relative flex-1 min-w-0">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-450" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ism, familiya yoki fan orqali qidirish..."
                  className={searchInputClass}
                />
              </div>
            </div>

            {/* Selected Class title stats & badging */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-stone-100 pt-3">
              <div>
                <h3 className={subStatsTitleClass}>
                  {selectedClass}-Sinf Imtihon natijalari
                </h3>
                <p className="text-[11px] text-stone-400 font-sans font-semibold mt-0.5">
                  Jami natijalar: {classStats.total} ta ({classStats.students} o'quvchi, {classStats.teachers} o'qituvchi)
                </p>
              </div>
            </div>

            {/* List Table container */}
            <div className={tableContainerClass}>
              
              {/* Responsive Table overflow wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  {/* Table Headers */}
                  <thead>
                    <tr className={tableHeaderClass}>
                      <th className="py-3.5 px-4 font-bold">TURI</th>
                      <th className="py-3.5 px-4 font-bold">ISM VA FAMILIYA</th>
                      <th className="py-3.5 px-4 font-bold">IMTIHON NOMI</th>
                      <th className="py-3.5 px-4 font-bold">SANA KUN</th>
                      <th className="py-3.5 px-4 font-bold">FAN / KITOB NOMI</th>
                      <th className="py-3.5 px-4 font-bold text-right">NATIJA</th>
                      <th className="py-3.5 px-4 text-center font-bold">BAHO (1-100)</th>
                      <th className="py-3.5 px-4 text-center font-bold">AMALLAR</th>
                    </tr>
                  </thead>
                  
                  {/* Table Body */}
                  <tbody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((rec) => (
                        <tr
                           key={rec.id}
                           className={tableRowClass}
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              rec.type === 'O\'quvchi'
                                ? bgTheme === 'oq'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-100'
                                  : 'bg-blue-950/40 text-blue-350 border border-blue-900/30'
                                : bgTheme === 'oq'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-100'
                                  : 'bg-amber-950/40 text-amber-350 border border-amber-900/30'
                            }`}>
                              {rec.type === 'O\'quvchi' ? (
                                <GraduationCap size={11} className="shrink-0" />
                              ) : (
                                <Users size={11} className="shrink-0" />
                              )}
                              {rec.type}
                            </span>
                          </td>
                          <td className={tableRowNameClass}>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                              <span>{rec.name}</span>
                              {rec.classLetter && (
                                <span className="inline-flex max-w-fit items-center text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 tracking-wider">
                                  {rec.classGroup}-{rec.classLetter}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`py-3.5 px-4 font-bold font-sans whitespace-nowrap ${bgTheme === 'oq' ? 'text-stone-600' : 'text-stone-300'}`}>
                            {rec.examType}
                          </td>
                          <td className={`py-3.5 px-4 font-mono whitespace-nowrap ${bgTheme === 'oq' ? 'text-stone-500' : 'text-stone-400'}`}>
                            {formatUzDate(rec.date)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {rec.examType === 'Kitobxonlik imtihoni' ? (
                              <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] border ${
                                bgTheme === 'oq'
                                  ? 'text-purple-700 bg-purple-50 border-purple-150'
                                  : 'text-purple-300 bg-purple-950/40 border-purple-900/50'
                              }`}>
                                📖 {rec.bookName || 'Noma\'lum kitob'}
                              </span>
                            ) : (
                              <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] border ${
                                bgTheme === 'oq'
                                  ? 'text-[#059669] bg-emerald-50 border-emerald-100'
                                  : 'text-emerald-300 bg-emerald-950/40 border border-emerald-900/40'
                              }`}>
                                🏫 {rec.subject || 'Matematika'}
                              </span>
                            )}
                          </td>
                          <td className={tableRowResultClass}>
                            {rec.examType === 'Kitobxonlik imtihoni' ? (
                              <span>{rec.result} bet</span>
                            ) : (
                              <span>{rec.result} ball</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-lg font-bold text-[11px] ${
                              rec.grade >= 86
                                ? bgTheme === 'oq' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#064e3b] text-emerald-100 border border-emerald-900/40'
                                : rec.grade >= 74
                                ? bgTheme === 'oq' ? 'bg-blue-100 text-blue-800' : 'bg-[#1e3a8a] text-blue-100 border border-blue-900/40'
                                : rec.grade >= 62
                                ? bgTheme === 'oq' ? 'bg-orange-100 text-orange-850' : 'bg-[#7c2d12] text-orange-100 border border-orange-900/40'
                                : bgTheme === 'oq' ? 'bg-red-100 text-red-800' : 'bg-[#7f1d1d] text-red-100 border border-red-900/40'
                            }`}>
                              {rec.grade} / 100
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteRecord(rec.id, rec.name)}
                              className={`p-1 px-1.5 rounded-lg ${
                                bgTheme === 'oq' 
                                  ? 'text-stone-400 hover:text-red-650 hover:bg-red-50' 
                                  : 'text-stone-500 hover:text-red-400 hover:bg-red-950/30'
                              } transition-all cursor-pointer`}
                              title="Qaydni o'chirish"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-0">
                          {/* Inline Warning bar matching image 1 */}
                          <div className={`${
                            bgTheme === 'oq'
                              ? 'bg-emerald-50/50 border-b border-stone-200 text-[#059669]'
                              : 'bg-emerald-950/20 border-b border-emerald-900/35 text-emerald-400'
                          } text-[11px] font-bold py-3 px-5 flex items-center gap-2`}>
                            <AlertCircle size={14} className="text-emerald-500" />
                            <span>
                              Ushbu sinfda hozircha imtihon natijalari belgilanmagan. ("Natija Qo'shish" tugmasini bosib yangi natija kiriting)
                            </span>
                          </div>

                          {/* Empty State visual matching image 1 */}
                          <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-300 text-3xl mb-4">
                              🚫
                            </div>
                            <h4 className="font-sans font-bold text-stone-400 text-xs uppercase tracking-wider">
                              Natijalar kiritilmagan
                            </h4>
                            <p className="text-[10px] text-stone-400 font-sans mt-1">
                              Fayl filtri bo'yicha hech qanday natija topilmadi.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        </div>

      </main>

      {/* Elegant minimalist footer containing 2026 */}
      <footer className="max-w-7xl mx-auto px-6 pb-8 text-center">
        <p className="text-[11px] font-bold text-stone-450 font-mono tracking-widest uppercase">
          © 2026 • IMTIHONLAR NATIJASI TIZIMI
        </p>
      </footer>

      {/* MODAL DIALOG POPUP matching 100% Image 2 */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm sm:max-w-xl md:max-w-xl lg:max-w-2xl landscape:max-w-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[96vh] md:max-h-[90vh] transition-all duration-300"
            >
              
              {/* Modal Header */}
              <div className="px-6 py-4.5 bg-white border-b border-stone-100 flex items-center justify-between shrink-0">
                <div className="space-y-0.5">
                  <h3 className="font-sans font-black text-stone-900 text-sm tracking-tight capitalize">
                    Yangi natija qo'shish
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider hidden sm:block">
                    Format: {window.innerWidth >= 1024 ? "Notebook o'lchami 💻" : window.innerWidth >= 640 ? "Yonboshlangan o'lcham 📱" : "Telefon o'lchami 📱"}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveModalRecord} className="flex flex-col flex-1 overflow-hidden">
                
                {/* Scrollable Container for inputs to support mobile rotation/height limits */}
                <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh] sm:max-h-[65vh] md:max-h-none">
                  
                  {/* Dynamic Adaptive Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 md:grid-cols-2 gap-x-5 gap-y-4">
                    
                     {/* 0. Foydalanuvchi Turi Selection */}
                     <div className="col-span-1">
                       <label className="block text-[11px] font-bold text-stone-500 mb-1 font-sans">
                         Kim uchun (Foydalanuvchi turi)
                       </label>
                       <select
                         value={modalType}
                         onChange={(e) => {
                           const val = e.target.value as 'O\'quvchi' | 'O\'qituvchi';
                           setModalType(val);
                           if (val === 'O\'quvchi' && formClassGroup === 6) {
                             setFormClassLetter('A');
                             setFormName(STUDENTS_6A[0]);
                           } else {
                             setFormName('');
                           }
                         }}
                         className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-sans text-stone-850 focus:border-[#10b981] outline-none"
                       >
                         <option value="O'quvchi">O'quvchi</option>
                         <option value="O'qituvchi">O'qituvchi</option>
                       </select>
                     </div>
 
                     {/* 1. Sinf Row */}
                     <div className="col-span-1 grid grid-cols-2 gap-2">
                       <div>
                         <label className="block text-[11px] font-bold text-stone-500 mb-1 font-sans">
                           Sinf
                         </label>
                         <select
                           value={formClassGroup}
                           onChange={(e) => {
                             const selectedVal = Number(e.target.value);
                             setFormClassGroup(selectedVal);
                             // Preset name based on selected section choice
                             if (selectedVal === 6 && modalType === 'O\'quvchi') {
                               if (formClassLetter === 'A') {
                                 setFormName(STUDENTS_6A[0]);
                               } else if (formClassLetter === 'B') {
                                 setFormName(STUDENTS_6B[0]);
                               } else {
                                 setFormName('');
                               }
                             } else {
                               setFormName('');
                             }
                           }}
                           className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-sans text-stone-850 focus:border-[#10b981] outline-none"
                         >
                           {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                             <option key={n} value={n}>
                               {n}-sinf
                             </option>
                           ))}
                         </select>
                       </div>
                       
                       <div>
                         <label className="block text-[11px] font-bold text-stone-500 mb-1 font-sans">
                           Sinf Harfi / turi
                         </label>
                         <select
                           value={formClassLetter}
                           onChange={(e) => {
                             const val = e.target.value as 'A' | 'B' | '';
                             setFormClassLetter(val);
                             // Align current candidate selection to the corresponding division
                             if (formClassGroup === 6 && modalType === 'O\'quvchi') {
                               if (val === 'A') {
                                 setFormName(STUDENTS_6A[0]);
                               } else if (val === 'B') {
                                 setFormName(STUDENTS_6B[0]);
                               } else {
                                 setFormName('');
                               }
                             } else {
                               setFormName('');
                             }
                           }}
                           className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-sans text-stone-850 focus:border-[#10b981] outline-none"
                         >
                           <option value="A">A - sinf</option>
                           <option value="B">B - sinf</option>
                           <option value="">Standart</option>
                         </select>
                       </div>
                     </div>
 
                     {/* 2. Ism va Familiya - Dynamic auto-completed or manually typed */}
                     <div className="col-span-1 sm:col-span-2 landscape:col-span-2 md:col-span-2">
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-[11px] font-bold text-stone-500 font-sans">
                           Ism va Familiya
                         </label>
                         {formClassGroup === 6 && modalType === 'O\'quvchi' && (formClassLetter === 'A' || formClassLetter === 'B') && (
                           <button
                             type="button"
                             onClick={() => {
                               if (formClassLetter === 'A') {
                                 setFormName(STUDENTS_6A.includes(formName) ? '' : STUDENTS_6A[0]);
                               } else {
                                 setFormName(STUDENTS_6B.includes(formName) ? '' : STUDENTS_6B[0]);
                               }
                             }}
                             className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-150 hover:bg-emerald-100 transition cursor-pointer"
                           >
                             {(formClassLetter === 'A' ? STUDENTS_6A.includes(formName) : STUDENTS_6B.includes(formName)) 
                               ? "✍️ Qo'lda yozish" 
                               : "📋 Ro'yxatdan tanlash"
                             }
                           </button>
                         )}
                       </div>
 
                       {formClassGroup === 6 && modalType === 'O\'quvchi' && (formClassLetter === 'A' || formClassLetter === 'B') && 
                        (formClassLetter === 'A' ? STUDENTS_6A.includes(formName) || formName === '' : STUDENTS_6B.includes(formName) || formName === '') ? (
                         <select
                           value={formName}
                           onChange={(e) => setFormName(e.target.value)}
                           className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-sans text-stone-800 focus:border-[#10b981] outline-none"
                         >
                           <option value="">-- O'quvchini tanlang --</option>
                           {(formClassLetter === 'A' ? STUDENTS_6A : STUDENTS_6B).map((student) => (
                             <option key={student} value={student}>
                               {student}
                             </option>
                           ))}
                         </select>
                       ) : (
                         <input
                           type="text"
                           required
                           value={formName}
                           onChange={(e) => setFormName(e.target.value)}
                           placeholder="Ism va Familiyani kiriting..."
                           className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-sans text-stone-800 focus:border-[#10b981] outline-none placeholder:text-stone-300"
                         />
                       )}
                     </div>

                    {/* 3. Imtihon / Natija turi */}
                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-stone-500 mb-1 font-sans">
                        Imtihon / Natija turi
                      </label>
                      <select
                        value={formExamType}
                        onChange={(e) => setFormExamType(e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-sans text-stone-850 focus:border-[#10b981] outline-none"
                      >
                        <option value="Kitobxonlik imtihoni">Kitobxonlik imtihoni</option>
                        <option value="Haftalik imtihon">Haftalik imtihon</option>
                        <option value="Oylik imtihon">Oylik imtihon</option>
                        <option value="Choraklik imtihon">Choraklik imtihon</option>
                        <option value="Yillik imtihon">Yillik imtihon jurnali</option>
                      </select>
                    </div>

                    {/* 4. Conditional Content based on selections */}
                    <div className="col-span-1">
                      <AnimatePresence mode="wait">
                        {formExamType === 'Kitobxonlik imtihoni' ? (
                          <motion.div
                            key="kitobxonlik-extra"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="space-y-1 block"
                          >
                            <label className="block text-[11px] font-bold text-stone-500 mb-1 font-sans">
                              Qaysi kitob o'qigani (Kitob nomi)
                            </label>
                            <input
                              type="text"
                              required
                              value={formBookName}
                              onChange={(e) => setFormBookName(e.target.value)}
                              placeholder="Kitob nomini kiriting"
                              className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-sans text-stone-800 focus:border-[#10b981] outline-none"
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="exam-extra"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="space-y-1 block"
                          >
                            <label className="block text-[11px] font-bold text-stone-500 mb-1 font-sans">
                              Fan bo'limini tanlang
                            </label>
                            <select
                              value={formSubject}
                              onChange={(e) => setFormSubject(e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-sans text-stone-850 focus:border-[#10b981] outline-none"
                            >
                              <option value="Rus tili">Rus tili</option>
                              <option value="Ingliz tili">Ingliz tili</option>
                              <option value="Matematika">Matematika</option>
                              <option value="Ona tili">Ona tili</option>
                              <option value="IT">IT (Informatika)</option>
                            </select>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Single Row for Date */}
                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-stone-500 mb-1 font-sans">
                        Olgan sanasi
                      </label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-sans text-stone-800 focus:border-[#10b981] outline-none"
                      />
                    </div>

                    {/* Split Row for Page numbers / Result and Grades */}
                    <div className="col-span-1 sm:col-span-2 landscape:col-span-2 md:col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-500 mb-1 font-sans">
                          Natija (ball yoki sahifa)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formResult}
                          onChange={(e) => setFormResult(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-800 focus:border-[#10b981] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-500 mb-1 font-sans">
                          Baho (1-100)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={formGrade}
                          onChange={(e) => setFormGrade(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-800 focus:border-[#10b981] outline-none"
                        />
                      </div>
                    </div>

                  </div>

                </div>

                {/* Form Controls - Pinned at the bottom */}
                <div className="flex items-center justify-end gap-3 px-6 py-4.5 bg-stone-50 border-t border-stone-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-white border border-stone-250 hover:bg-stone-50 text-stone-600 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs shadow-emerald-500/10"
                  >
                    <Check size={14} />
                    Saqlash
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
