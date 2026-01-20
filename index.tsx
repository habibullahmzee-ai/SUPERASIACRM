
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import { 
  Phone, LogOut, Shield, MapPin, User, ChevronLeft, ChevronRight, Users, CheckCircle2, Clock, X, Database, 
  BarChart2, FileSpreadsheet, History, FileText, ChevronDown, PlusCircle, Package, Upload, 
  HardDrive, Trash2, Ban, CheckSquare, MessageSquare, RefreshCw, UserPlus, FileDown, TrendingUp,
  Zap, Hash, Tag, Store, CalendarDays, Cpu, ShieldCheck, Server, Lock, Settings, Eye, Info, Image as ImageIcon,
  Check, ShieldAlert, ArrowRight, Camera, Save, ClipboardList, AlertCircle, DollarSign, PenTool,
  TrendingDown, Layers, Activity, Search, Filter, Calendar, ChevronUp, Menu, CheckSquare as CheckSquareIcon,
  Square, UserCheck, UserMinus, Key, MoreHorizontal, UserX, FileType, ToggleLeft, ToggleRight,
  Terminal, Code2, AlertTriangle, FilePlus, Download, FilterX, Clipboard, Printer, FileText as PdfIcon,
  Briefcase, UserRound, LayoutDashboard, ListChecks, Wrench, ShieldEllipsis, TableProperties, MonitorCheck
} from 'lucide-react';
import { PRODUCT_MODEL_DB } from './product_db';
import { INITIAL_TECHNICIANS } from './technician_db';

// --- Constants & DB Mapping ---
const getProduct = (model: string) => {
  const m = String(model || "").toUpperCase().trim();
  if (m.includes("SD-555") || m.includes("SUPER SPIN")) return "SPINNER";
  return PRODUCT_MODEL_DB[m] || "GENERAL";
};

const matchTechnician = (input: string): string => {
  const name = String(input || "").toUpperCase().trim();
  if (!name || name === "UNASSIGNED" || name === "---") return "UNASSIGNED";
  const found = INITIAL_TECHNICIANS.find(t => 
    t.name.toUpperCase().includes(name) || 
    name.includes(t.name.toUpperCase()) ||
    t.importKey.toUpperCase().includes(name)
  );
  return found ? found.name : name;
};

// --- Types ---
type AppState = 'portal' | 'admin-dash' | 'admin-analytics' | 'admin-today' | 'technician-dash';

interface Complaint {
  id: string; 
  workOrder: string;
  product: string; 
  priority: string;
  regDate: string; 
  complaintNo: string;
  status: string;
  techName: string; 
  updateDate: string; 
  remarks: string;
  model: string; 
  serialNo: string;
  problemDescription: string;
  dop: string; 
  customerName: string;
  phoneNo: string;
  address: string;
  aging: number;
  visitCharges: number;
  partsCharges: number;
  otherCharges: number;
}

interface Staff {
  id: string;
  name: string;
  contact: string;
  position: 'ADMIN' | 'TECHNICIAN' | 'DEVELOPER';
  loginId: string;
  password?: string;
  importKey: string; 
  status: 'ACTIVE' | 'INACTIVE';
}

const ADMIN_STATUSES = [
  "PENDING", "PARTY LIFTING", "READY TO DELIVER", "ONLINE", "NOT RESPONDING", 
  "PARTS REQ (TECH)", "ON ROUTE", "PART NOT AVAILABLE", "PART TO ATTEND", 
  "PFA (CUSTOMER)", "PFA (HEAD OFFICE)", "SERVICE CENTRE LIFTING", "COMPLETED", "CANCEL", "TEMPORARY CLOSED", "VERIFIED"
];

const TECH_ALLOWED_STATUSES = ["PENDING", "TEMPORARY CLOSED"];

const DB_KEY_COMPLAINTS = 'superasia_v12_enterprise_stable';
const DB_KEY_STAFF = 'superasia_v2_staff_db';

// --- Date Utils ---
const standardizeDate = (val: any, includeTime = false): string => {
  if (val === undefined || val === null || val === "") return "";
  let date: Date;

  const numericVal = typeof val === 'number' ? val : parseFloat(String(val));
  if (!isNaN(numericVal) && numericVal > 30000 && numericVal < 60000) {
    const dateSerial = Math.floor(numericVal);
    const timeSerial = numericVal - dateSerial;
    date = new Date((dateSerial - 25569) * 86400 * 1000);
    const totalSeconds = Math.round(timeSerial * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    date.setHours(hours, minutes, 0, 0);
  } else {
    const s = String(val).trim();
    if (!s) return "";
    const dateTimeParts = s.split(/\s+/);
    const datePart = dateTimeParts[0];
    const parts = datePart.split(/[\/\-\.\s]/).filter(p => p.length > 0);
    if (parts.length === 3) {
      let d, m, y;
      const p1 = parseInt(parts[0]);
      const p2 = parseInt(parts[1]);
      const p3Str = parts[2];
      const p3 = p3Str.length === 2 ? 2000 + parseInt(p3Str) : parseInt(p3Str);
      if (datePart.includes('/')) { m = p1; d = p2; y = p3; } 
      else { d = p1; m = p2; y = p3; }
      date = new Date(y, m - 1, d);
      const timeMatch = s.match(/(\d{1,2}):(\d{1,2})/);
      if (timeMatch) {
        let hh = parseInt(timeMatch[1]);
        const min = parseInt(timeMatch[2]);
        if (s.toLowerCase().includes('pm') && hh < 12) hh += 12;
        if (s.toLowerCase().includes('am') && hh === 12) hh = 0;
        date.setHours(hh, min, 0, 0);
      }
    } else {
      date = new Date(s);
    }
  }

  if (isNaN(date.getTime())) return String(val);

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  let result = `${dd}-${mm}-${yyyy}`;

  if (includeTime) {
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    result += ` ${hh}:${min}`;
  }

  return result;
};

const getPKDate = (includeTime = false) => {
  return standardizeDate(new Date(), includeTime);
};

const parseStandardDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const pureDate = dateStr.split(' ')[0];
  const parts = pureDate.split('-');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
};

const calculateAging = (regDateStr: string): number => {
  const d = parseStandardDate(regDateStr);
  if (!d) return 0;
  const diffTime = new Date().getTime() - d.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

// --- DB Logic ---
const SuperAsiaDB = {
  getComplaints: (): Complaint[] => {
    const data = localStorage.getItem(DB_KEY_COMPLAINTS);
    return data ? JSON.parse(data) : [];
  },
  saveComplaints: (complaints: Complaint[]) => {
    localStorage.setItem(DB_KEY_COMPLAINTS, JSON.stringify(complaints));
  },
  getStaff: (): Staff[] => {
    const data = localStorage.getItem(DB_KEY_STAFF);
    if (!data) {
      const initial: Staff[] = [
        { id: '1', name: "BALAJ ANSARI", contact: "0315 2753537", position: "ADMIN", loginId: "BALAJ", password: "123", importKey: "BALAJ ANSARI", status: "ACTIVE" },
        { id: 'dev', name: "SA-DEV-ROOT", contact: "DEV-SYSTEM-786", position: "DEVELOPER", loginId: "DEV", password: "786", importKey: "DEV", status: "ACTIVE" },
        ...INITIAL_TECHNICIANS as Staff[]
      ];
      localStorage.setItem(DB_KEY_STAFF, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  }
};

// --- UI Components ---
const SuperAsiaBranding = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <div className="flex items-center gap-3 select-none">
    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
      <ShieldCheck size={size === 'sm' ? 20 : size === 'md' ? 32 : 48} className="text-white" />
    </div>
    <div>
      <h1 className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-lg' : 'text-2xl'} font-black tracking-tighter text-blue-600 leading-none`}>SUPER ASIA</h1>
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">Enterprise Core Platform</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const isVerified = status === 'VERIFIED' || status === 'COMPLETED';
  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap shadow-sm border-2 ${isVerified ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
      {status}
    </span>
  );
};

// --- Shared Components for Admin ---
const StatCard = ({ label, value, icon: Icon, color }: any) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-600 shadow-blue-600/20",
    emerald: "bg-emerald-600 shadow-emerald-600/20",
    orange: "bg-orange-600 shadow-orange-600/20"
  };
  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex items-center gap-6">
      <div className={`${colors[color] || colors.blue} p-5 rounded-[2rem] text-white shadow-xl`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value.toLocaleString()}</p>
      </div>
    </div>
  );
};

const AnalyticsDashboard = ({ complaints }: { complaints: Complaint[] }) => {
  const stats = useMemo(() => {
    const total = complaints.length;
    const completed = complaints.filter(c => c.status === 'COMPLETED' || c.status === 'VERIFIED').length;
    const pending = complaints.filter(c => c.status === 'PENDING').length;
    const byProduct: Record<string, number> = {};
    complaints.forEach(c => {
      if (c.product) byProduct[c.product] = (byProduct[c.product] || 0) + 1;
    });
    const topProducts = Object.entries(byProduct).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return { total, completed, pending, topProducts };
  }, [complaints]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <StatCard label="Total Nodes" value={stats.total} icon={Database} color="blue" />
         <StatCard label="Resolved" value={stats.completed} icon={CheckCircle2} color="emerald" />
         <StatCard label="In Queue" value={stats.pending} icon={Clock} color="orange" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
           <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase mb-8">Asset Distribution</h3>
           <div className="space-y-6">
              {stats.topProducts.map(([name, count]) => (
                <div key={name} className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-500">{name}</span>
                      <span className="text-blue-600">{count} Units</span>
                   </div>
                   <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]" style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }} />
                   </div>
                </div>
              ))}
           </div>
        </div>
        <div className="bg-[#0F172A] p-10 rounded-[3.5rem] shadow-xl text-white flex flex-col">
           <h3 className="text-xl font-black tracking-tighter uppercase mb-8">Performance Efficiency</h3>
           <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-7xl font-black text-blue-500 mb-2">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Overall Sync Completion</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const MultiSelect = ({ label, options, selected, onChange, icon: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 bg-white border-2 border-slate-100 rounded-2xl px-6 py-3.5 text-[10px] font-black uppercase text-slate-600 hover:border-blue-600 transition-all shadow-sm group">
        {Icon && <Icon size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />}
        <span>{label} ({selected.length})</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl z-50 p-6 max-h-[450px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              {options.map((opt: string) => (
                <label key={opt} className="flex items-center gap-3 p-3.5 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all group">
                  <input type="checkbox" checked={selected.includes(opt)} onChange={() => {
                      const next = selected.includes(opt) ? selected.filter((s: string) => s !== opt) : [...selected, opt];
                      onChange(next);
                    }}
                    className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-600 transition-all cursor-pointer"
                  />
                  <span className="text-[11px] font-black text-slate-700 uppercase group-hover:text-blue-600 transition-all">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const DateRangePresets = ({ range, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const presets = [
    { label: "Today", get: () => { const d = getPKDate(); return { start: d, end: d, label: "Today" }; } },
    { label: "Yesterday", get: () => { 
        const d = new Date(); d.setDate(d.getDate() - 1); 
        const ds = standardizeDate(d);
        return { start: ds, end: ds, label: "Yesterday" }; 
    } },
    { label: "Last 7 Days", get: () => {
        const end = new Date(); 
        const start = new Date(); start.setDate(start.getDate() - 7);
        return { start: standardizeDate(start), end: standardizeDate(end), label: "Last 7 Days" };
    } },
    { label: "All Database", get: () => ({ start: "", end: "", label: "" }) }
  ];

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 bg-white border-2 border-slate-100 rounded-2xl px-6 py-3.5 text-[10px] font-black uppercase text-slate-600 hover:border-blue-600 transition-all shadow-sm group">
        <Calendar size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
        <span>{range.label || "Timeline filter"}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-60 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl z-50 p-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {presets.map(p => (
              <button key={p.label} onClick={() => { onChange(p.get()); setIsOpen(false); }} className="w-full text-left px-6 py-4 hover:bg-blue-50 text-[11px] font-black uppercase text-slate-600 hover:text-blue-600 rounded-2xl transition-all">
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- Technician Dashboard ---
const TechnicianDash = ({ user, onLogout }: { user: Staff, onLogout: () => void }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedCase, setSelectedCase] = useState<Complaint | null>(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { load(); }, []);

  const load = () => {
    const raw = SuperAsiaDB.getComplaints();
    const myJobs = raw.filter(c => c.techName === user.name);
    setComplaints(myJobs);
  };

  const updateCase = (id: string, partial: Partial<Complaint>) => {
    const today = getPKDate(true);
    const all = SuperAsiaDB.getComplaints();
    const updated = all.map(c => c.id === id ? { ...c, ...partial, updateDate: today } : c);
    SuperAsiaDB.saveComplaints(updated);
    setComplaints(updated.filter(c => c.techName === user.name));
    if (selectedCase && selectedCase.id === id) {
      setSelectedCase({ ...selectedCase, ...partial, updateDate: today });
    }
  };

  const addTimestamp = () => {
    if (!selectedCase) return;
    const now = getPKDate(true);
    const newRemarks = `${selectedCase.remarks}\n[${now}]: `;
    updateCase(selectedCase.id, { remarks: newRemarks });
  };

  const filtered = complaints.filter(c => filter === 'ALL' || c.status === filter);
  const todayGoal = useMemo(() => {
    const today = getPKDate();
    const tJobs = complaints.filter(c => c.updateDate?.startsWith(today) || c.regDate.startsWith(today));
    const done = tJobs.filter(c => c.status === 'COMPLETED' || c.status === 'VERIFIED').length;
    return { total: tJobs.length, done };
  }, [complaints]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-[#0F172A] p-8 text-white rounded-b-[3rem] shadow-2xl space-y-6 sticky top-0 z-50">
         <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="bg-blue-600 p-2 rounded-xl"><UserRound size={20}/></div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Technician Terminal</p>
                  <h2 className="text-xl font-black tracking-tighter">{user.name}</h2>
               </div>
            </div>
            <button onClick={onLogout} className="bg-white/10 p-3 rounded-full hover:bg-rose-500 transition-all"><LogOut size={20}/></button>
         </div>
         <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
            <div className="flex justify-between text-[10px] font-black uppercase mb-3">
               <span>Performance Log (Today)</span>
               <span>{todayGoal.done} / {todayGoal.total} Syncs</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" style={{ width: `${todayGoal.total > 0 ? (todayGoal.done / todayGoal.total) * 100 : 0}%` }} />
            </div>
         </div>
      </header>

      <div className="p-6 space-y-6">
         <div className="flex gap-2 overflow-auto pb-2 scrollbar-hide">
            {['ALL', 'PENDING', 'TEMPORARY CLOSED'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all border-2 ${filter === s ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}>
                {s}
              </button>
            ))}
         </div>

         <div className="space-y-4">
            {filtered.map(job => (
              <div key={job.id} onClick={() => setSelectedCase(job)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm active:scale-95 transition-all space-y-4">
                 <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <h3 className="text-lg font-black tracking-tighter text-slate-900">{job.model}</h3>
                       <p className="text-[9px] font-black text-blue-600 uppercase">Order: {job.workOrder}</p>
                    </div>
                    <StatusBadge status={job.status} />
                 </div>
                 <div className="flex items-center gap-3 text-slate-500">
                    <MapPin size={14} className="text-blue-500"/>
                    <p className="text-[11px] font-bold uppercase truncate">{job.address}</p>
                 </div>
                 <div className="pt-4 border-t flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <span className="text-[11px] font-black text-slate-900">{job.customerName}</span>
                    </div>
                    <div className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase">{job.regDate.split(' ')[0]}</div>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {selectedCase && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex items-end animate-in slide-in-from-bottom-full duration-300">
           <div className="bg-white w-full rounded-t-[3.5rem] max-h-[95vh] flex flex-col overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <div>
                    <h2 className="text-2xl font-black tracking-tighter text-slate-900">Calibration Terminal</h2>
                    <p className="text-[10px] font-black text-blue-600 uppercase">Job Ref: #{selectedCase.complaintNo}</p>
                 </div>
                 <button onClick={() => setSelectedCase(null)} className="p-3 bg-white border border-slate-200 rounded-full"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-auto p-8 space-y-8 custom-scrollbar pb-10">
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Customer Persona</label>
                       <input type="text" value={selectedCase.customerName} onChange={e => updateCase(selectedCase.id, { customerName: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-bold outline-none focus:border-blue-500 shadow-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Asset Model</label>
                         <input type="text" value={selectedCase.model} onChange={e => updateCase(selectedCase.id, { model: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-bold outline-none focus:border-blue-500 shadow-sm" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Serial Node</label>
                         <input type="text" value={selectedCase.serialNo || ''} onChange={e => updateCase(selectedCase.id, { serialNo: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-bold outline-none focus:border-blue-500 shadow-sm" placeholder="SERIAL #..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">D.O.P (Node Birth)</label>
                         <input type="text" value={selectedCase.dop} onChange={e => updateCase(selectedCase.id, { dop: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-bold outline-none focus:border-blue-500 shadow-sm" placeholder="DD-MM-YYYY" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Current Status</label>
                         <select value={selectedCase.status} onChange={e => updateCase(selectedCase.id, { status: e.target.value })} className="w-full bg-white border-2 border-slate-100 p-5 rounded-2xl font-black uppercase outline-none focus:border-blue-500 shadow-sm">
                            {TECH_ALLOWED_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between px-4">
                       <span>Live Action Logs</span>
                       <span className="text-blue-600">Sync: {selectedCase.updateDate || '---'}</span>
                    </label>
                    <div className="relative">
                       <textarea value={selectedCase.remarks} onChange={e => updateCase(selectedCase.id, { remarks: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 text-sm font-bold min-h-[12rem] outline-none focus:border-blue-500 shadow-inner resize-none" />
                       <button onClick={addTimestamp} className="absolute right-6 bottom-6 p-4 bg-blue-600 text-white rounded-2xl shadow-xl active:scale-90"><Clock size={20}/></button>
                    </div>
                 </div>
                 <div className="space-y-6 bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Settlement Matrix</p>
                    <div className="grid grid-cols-3 gap-6">
                       <div className="text-center">
                          <label className="text-[8px] font-black uppercase text-white/30">Visit</label>
                          <input type="number" value={selectedCase.visitCharges} onChange={e => updateCase(selectedCase.id, { visitCharges: parseInt(e.target.value)||0 })} className="w-full bg-transparent border-b border-white/10 text-center font-black text-xl text-white outline-none focus:border-blue-500" />
                       </div>
                       <div className="text-center">
                          <label className="text-[8px] font-black uppercase text-white/30">Parts</label>
                          <input type="number" value={selectedCase.partsCharges} onChange={e => updateCase(selectedCase.id, { partsCharges: parseInt(e.target.value)||0 })} className="w-full bg-transparent border-b border-white/10 text-center font-black text-xl text-white outline-none focus:border-blue-500" />
                       </div>
                       <div className="text-center">
                          <label className="text-[8px] font-black uppercase text-white/30">Other</label>
                          <input type="number" value={selectedCase.otherCharges} onChange={e => updateCase(selectedCase.id, { otherCharges: parseInt(e.target.value)||0 })} className="w-full bg-transparent border-b border-white/10 text-center font-black text-xl text-white outline-none focus:border-blue-500" />
                       </div>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex justify-between items-center px-4">
                       <span className="text-[10px] font-black uppercase text-white/40">Grand Total</span>
                       <span className="text-2xl font-black text-blue-500">PKR {(selectedCase.visitCharges + selectedCase.partsCharges + selectedCase.otherCharges).toLocaleString()}/-</span>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-white border-t flex gap-4">
                 <button onClick={() => setSelectedCase(null)} className="flex-1 py-6 bg-slate-50 text-slate-400 rounded-3xl font-black uppercase text-[11px] hover:bg-slate-100 transition-all">Back to Feed</button>
                 <button onClick={() => setSelectedCase(null)} className="flex-1 py-6 bg-blue-600 text-white rounded-3xl font-black uppercase text-[11px] shadow-2xl shadow-blue-600/30 active:scale-95 transition-all">Save & Close Terminal</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Admin Dashboard Main ---
const AdminDash = ({ user, onLogout }: { user: Staff, onLogout: () => void }) => {
  const [view, setView] = useState<AppState>('admin-dash');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<Complaint | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [techFilter, setTechFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "", label: "" });

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  const load = () => {
    const raw = SuperAsiaDB.getComplaints();
    const clean = raw.map(c => ({
      ...c, 
      regDate: standardizeDate(c.regDate, true), 
      updateDate: standardizeDate(c.updateDate, true), 
      dop: standardizeDate(c.dop),
      aging: calculateAging(c.regDate)
    }));
    setComplaints(clean);
  };

  const handleExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const imported = data.map((row, idx) => {
          const getV = (hs: string[]) => {
            const f = Object.keys(row).find(k => hs.includes(k.toUpperCase().trim()));
            return f ? row[f] : "";
          };
          const m = String(getV(["MODEL"]));
          return {
            id: `IMP-${Date.now()}-${idx}`,
            workOrder: String(getV(["WORK ORDER", "WO"])),
            product: getProduct(m),
            priority: String(getV(["PRIORITY"])) || "NORMAL",
            regDate: standardizeDate(getV(["REG DATE", "DATE"]), true),
            complaintNo: String(getV(["COMPLAINT NO", "NO"])),
            status: String(getV(["STATUS"])).toUpperCase() || "PENDING",
            techName: matchTechnician(String(getV(["TECH NAME", "TECH"]))),
            updateDate: standardizeDate(getV(["UPDATE DATE"]), true),
            remarks: String(getV(["REMARKS"])),
            model: m,
            serialNo: String(getV(["SERIAL NO", "SERIAL"])),
            problemDescription: String(getV(["PROBLEM DESCRIPTION", "PROBLEM"])),
            dop: standardizeDate(getV(["D.O.P", "DOP"])),
            customerName: String(getV(["CUSTOMER NAME", "NAME"])).toUpperCase(),
            phoneNo: String(getV(["PHONE NO", "PHONE"])),
            address: String(getV(["ADDRESS"])).toUpperCase(),
            aging: 0, visitCharges: 0, partsCharges: 0, otherCharges: 0
          };
        }).filter(c => c.customerName && c.customerName !== "UNDEFINED");
        SuperAsiaDB.saveComplaints([...imported, ...complaints]);
        load(); alert("Database Synced - All Dates Re-formatted Successfully");
      } catch (err) { alert("Data Sync Failed"); }
    };
    reader.readAsBinaryString(file as Blob);
  };

  const updateCase = (id: string, partial: Partial<Complaint>) => {
    const today = getPKDate(true); 
    const finalData = complaints.map(c => c.id === id ? { ...c, ...partial, updateDate: today } : c);
    setComplaints(finalData);
    SuperAsiaDB.saveComplaints(finalData);
    if (selectedCase && selectedCase.id === id) {
      setSelectedCase({ ...selectedCase, ...partial, updateDate: today });
    }
  };

  const addTimestamp = () => {
    if (!selectedCase) return;
    const now = getPKDate(true);
    const newRemarks = `${selectedCase.remarks}\n[${now}]: `;
    updateCase(selectedCase.id, { remarks: newRemarks });
  };

  const filtered = useMemo(() => {
    let list = complaints;
    if (view === 'admin-today') {
      const today = getPKDate();
      list = list.filter(c => c.updateDate?.startsWith(today) || c.regDate.startsWith(today));
    }
    return list.filter(c => {
      const sm = c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 c.complaintNo.includes(searchTerm) || 
                 c.phoneNo.includes(searchTerm) ||
                 c.model.toLowerCase().includes(searchTerm.toLowerCase());
      const stm = statusFilter.length === 0 || statusFilter.includes(c.status);
      const tm = techFilter.length === 0 || techFilter.includes(c.techName);
      let dm = true;
      if (dateRange.start && dateRange.end) {
        const sd = parseStandardDate(dateRange.start), ed = parseStandardDate(dateRange.end), cd = parseStandardDate(c.regDate);
        if (sd && ed && cd) dm = cd >= sd && cd <= ed;
      }
      return sm && stm && tm && dm;
    });
  }, [complaints, searchTerm, statusFilter, techFilter, dateRange, view]);

  const todayStats = useMemo(() => {
    const today = getPKDate();
    const todayList = complaints.filter(c => c.updateDate?.startsWith(today) || c.regDate.startsWith(today));
    const techMap: Record<string, Complaint[]> = {};
    todayList.forEach(c => {
      const tName = c.techName || "UNASSIGNED";
      if (!techMap[tName]) techMap[tName] = [];
      techMap[tName].push(c);
    });
    return {
      activePersonnel: Object.keys(techMap).length,
      dateLabel: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      techGrouped: Object.entries(techMap).map(([name, jobs]) => ({ name, jobs })).sort((a,b) => b.jobs.length - a.jobs.length)
    };
  }, [complaints]);

  const techOptions = useMemo(() => {
    return Array.from(new Set(complaints.map(c => c.techName))).filter(Boolean).sort();
  }, [complaints]);

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getActionString = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'WORK DONE';
      case 'VERIFIED': return 'AUDIT VERIFIED';
      case 'TEMPORARY CLOSED': return 'SITE VISITED (HOLD)';
      case 'PENDING': return 'READY TO ATTEND';
      case 'ON ROUTE': return 'TRAVELLING';
      default: return status.replace(/_/g, ' ');
    }
  };

  const getTimeOnly = (dateStr: string) => {
    if (!dateStr) return '--:--';
    const parts = dateStr.split(' ');
    if (parts.length < 2) return '--:--';
    return parts[1];
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-[#0F172A] flex flex-col transition-all duration-500 shadow-2xl z-50`}>
        <div className="p-8 border-b border-white/5"><SuperAsiaBranding size="sm" /></div>
        <div className="flex-1 py-10 overflow-y-auto custom-scrollbar">
           <div className="px-8 mb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{isSidebarOpen ? 'Operations' : 'OPS'}</div>
           <SidebarBtn icon={Database} label="Master Database" active={view === 'admin-dash'} onClick={() => setView('admin-dash')} collapsed={!isSidebarOpen} />
           <div className="px-8 mt-10 mb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{isSidebarOpen ? 'Reporting' : 'RPT'}</div>
           <SidebarBtn icon={MonitorCheck} label="Today Working" active={view === 'admin-today'} onClick={() => setView('admin-today')} collapsed={!isSidebarOpen} />
           <SidebarBtn icon={BarChart2} label="Data Analysis" active={view === 'admin-analytics'} onClick={() => setView('admin-analytics')} collapsed={!isSidebarOpen} />
           <div className="mx-8 my-10 border-t border-white/5 opacity-30" />
           <SidebarBtn icon={UserPlus} label="Staff Directory" collapsed={!isSidebarOpen} />
        </div>
        <button onClick={onLogout} className="p-10 border-t border-white/5 text-rose-500 font-black uppercase text-[10px] flex gap-4 transition-all hover:bg-rose-500/10"><LogOut size={22}/> {isSidebarOpen && 'System Logout'}</button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] relative">
        <header className="h-20 border-b border-slate-200 flex items-center justify-between px-10 bg-white z-40">
           <div className="flex items-center gap-8">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-blue-600 transition-all shadow-sm"><Menu size={20}/></button>
              <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase">
                {view === 'admin-today' ? 'Today Working Hub' : view === 'admin-dash' ? 'Core Node Database' : 'Analytics Center'}
              </h2>
           </div>
           <div className="flex gap-4 items-center">
              <button onClick={() => fileRef.current?.click()} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 shadow-xl shadow-emerald-600/20 active:scale-95 hover:bg-emerald-700 transition-all"><FileSpreadsheet size={18}/> Excel Sync</button>
              <input type="file" ref={fileRef} onChange={handleExcel} className="hidden" accept=".xlsx, .xls" />
           </div>
        </header>

        <div className="flex-1 overflow-auto custom-scrollbar p-10 bg-slate-50">
          {view === 'admin-today' ? (
            <div className="space-y-10 max-w-7xl mx-auto pb-20">
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-between transition-all hover:shadow-2xl">
                 <div className="flex items-center gap-6">
                    <div className="bg-blue-600 p-5 rounded-[2rem] text-white shadow-xl shadow-blue-600/30"><Clock size={32} /></div>
                    <div>
                       <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Activity Trace</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Field Working • {todayStats.dateLabel}</p>
                    </div>
                 </div>
                 <div className="bg-slate-50 px-10 py-6 rounded-[2.5rem] border border-slate-100 text-center flex flex-col items-center gap-1 min-w-[200px]">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Personnel Today</p>
                    <p className="text-4xl font-black text-blue-600">{todayStats.activePersonnel}</p>
                 </div>
              </div>

              <div className="space-y-12">
                 {todayStats.techGrouped.map(tg => (
                   <div key={tg.name} className="bg-white rounded-[4rem] overflow-hidden shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-8 duration-500">
                      <div className="bg-[#0F172A] p-10 flex justify-between items-center text-white">
                         <div className="flex items-center gap-6">
                            <div className="bg-blue-600 p-4 rounded-2xl"><UserRound size={28}/></div>
                            <div>
                               <h4 className="text-2xl font-black tracking-tighter uppercase">{tg.name}</h4>
                               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Technician Nodes Active</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Handle Count</p>
                            <p className="text-4xl font-black text-blue-500 leading-none mt-1">{tg.jobs.length}</p>
                         </div>
                      </div>
                      <div className="p-4">
                         <table className="w-full text-left">
                            <thead>
                               <tr className="text-[9px] font-black uppercase text-slate-400 border-b border-slate-50">
                                  <th className="px-8 py-6">Action</th>
                                  <th className="px-8 py-6">Job ID</th>
                                  <th className="px-8 py-6">Customer Persona</th>
                                  <th className="px-8 py-6">Asset Node</th>
                                  <th className="px-8 py-6">Action Taken</th>
                                  <th className="px-8 py-6">Timestamp</th>
                                  <th className="px-8 py-6 text-right">Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {tg.jobs.map(job => (
                                 <tr key={job.id} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="px-8 py-6">
                                       <button onClick={() => setSelectedCase(job)} className="p-2 bg-blue-600 text-white rounded-lg hover:scale-110 transition-transform"><Eye size={12}/></button>
                                    </td>
                                    <td className="px-8 py-6 font-black text-blue-600 text-[11px]">#{job.complaintNo}</td>
                                    <td className="px-8 py-6">
                                       <div className="text-[12px] font-black text-slate-900 uppercase">{job.customerName}</div>
                                       <div className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{job.address}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                       <div className="text-[11px] font-black text-slate-700 uppercase">{job.model}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                       <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border border-slate-200">
                                          {getActionString(job.status)}
                                       </span>
                                    </td>
                                    <td className="px-8 py-6 font-mono text-slate-400 text-[10px]">
                                       {getTimeOnly(job.updateDate || job.regDate)}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       <StatusBadge status={job.status} />
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                 ))}
                 {todayStats.techGrouped.length === 0 && (
                   <div className="text-center py-40 space-y-6">
                      <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto border-2 border-dashed border-slate-200"><Activity size={64} /></div>
                      <p className="text-[12px] font-black uppercase text-slate-400 tracking-widest">No activity trace detected for {todayStats.dateLabel}</p>
                   </div>
                 )}
              </div>
            </div>
          ) : view === 'admin-analytics' ? (
            <AnalyticsDashboard complaints={complaints} />
          ) : (
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div className="relative w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search Fleet Network..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold focus:border-blue-600 outline-none shadow-inner" />
                  </div>
                  <div className="flex gap-4">
                    <MultiSelect label="Filter Staff" options={techOptions} selected={techFilter} onChange={setTechFilter} icon={Users} />
                    <DateRangePresets range={dateRange} onChange={setDateRange} />
                  </div>
               </div>
               <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full min-w-[2000px]">
                    <thead>
                       <tr className="bg-slate-900 text-[10px] font-black uppercase text-white">
                          <th className="px-6 py-5 sticky left-0 z-20 bg-slate-900 text-center">Tools</th>
                          <th className="px-6 py-5">Order #</th>
                          <th className="px-6 py-5">Product</th>
                          <th className="px-6 py-5">Model</th>
                          <th className="px-6 py-5">Reg Date</th>
                          <th className="px-6 py-5">Customer</th>
                          <th className="px-6 py-5">Status</th>
                          <th className="px-6 py-5">Technician</th>
                          <th className="px-6 py-5">Remarks</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {paginated.map(row => (
                         <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-6 py-4 sticky left-0 z-10 bg-white border-r flex gap-2">
                               <button onClick={() => setSelectedCase(row)} className="p-2 bg-blue-600 text-white rounded-lg hover:scale-110"><Eye size={12}/></button>
                               <button onClick={() => generatePDF(row)} className="p-2 bg-rose-600 text-white rounded-lg hover:scale-110"><Printer size={12}/></button>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">{row.workOrder}</td>
                            <td className="px-6 py-4 text-slate-500 font-bold">{row.product}</td>
                            <td className="px-6 py-4 font-black text-slate-900 uppercase">{row.model}</td>
                            <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{row.regDate}</td>
                            <td className="px-6 py-4 font-black text-slate-900 uppercase">{row.customerName}</td>
                            <td className="px-6 py-4"><StatusBadge status={row.status} /></td>
                            <td className="px-6 py-4 font-bold text-blue-600">{row.techName}</td>
                            <td className="px-6 py-4 text-slate-400 italic truncate max-w-xs">{row.remarks}</td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
               <footer className="p-8 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Records: {filtered.length}</span>
                  <div className="flex gap-2">
                     <button disabled={currentPage===1} onClick={()=>setCurrentPage(c=>c-1)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 disabled:opacity-30"><ChevronLeft size={16}/></button>
                     <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black">Page {currentPage}</span>
                     <button disabled={currentPage===Math.ceil(filtered.length/pageSize)} onClick={()=>setCurrentPage(c=>c+1)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 disabled:opacity-30"><ChevronRight size={16}/></button>
                  </div>
               </footer>
            </div>
          )}
        </div>
      </main>

      {/* Admin Control Override Modal - REFINED LOOK */}
      {selectedCase && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="px-10 py-10 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-blue-600 rounded-lg text-white"><ShieldEllipsis size={14}/></div>
                   <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Admin Control Override</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none">{selectedCase.model}</h2>
                <div className="flex gap-4">
                   <div className="bg-blue-600/10 text-blue-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-600/10">Compl: #{selectedCase.complaintNo}</div>
                   <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">{selectedCase.product}</div>
                </div>
              </div>
              <button onClick={() => setSelectedCase(null)} className="p-4 bg-white border border-slate-200 rounded-full hover:bg-rose-50 hover:text-rose-600 shadow-sm transition-all active:scale-90"><X size={24}/></button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-10 space-y-10 custom-scrollbar bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Deployment Status</label>
                    <select value={selectedCase.status} onChange={e => updateCase(selectedCase.id, { status: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 font-black uppercase text-xs outline-none focus:border-blue-600 transition-all shadow-sm">
                       {ADMIN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Assign Field Agent</label>
                    <select value={selectedCase.techName} onChange={e => updateCase(selectedCase.id, { techName: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 font-black uppercase text-xs outline-none focus:border-blue-600 transition-all shadow-sm">
                       <option value="UNASSIGNED">UNASSIGNED</option>
                       {SuperAsiaDB.getStaff().filter(s=>s.position==='TECHNICIAN').map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={16} className="text-blue-600"/> Master Remark Log
                    </label>
                    <button onClick={addTimestamp} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                       <Clock size={14}/>
                       <span className="text-[9px] font-black uppercase tracking-widest">Add Timestamp</span>
                    </button>
                 </div>
                 <textarea value={selectedCase.remarks} onChange={e => updateCase(selectedCase.id, { remarks: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 font-bold text-lg text-slate-800 h-[20rem] outline-none focus:border-blue-600 shadow-inner resize-none transition-all" />
              </div>

              <div className="grid grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visit PKR</label>
                      <input type="number" value={selectedCase.visitCharges} onChange={e => updateCase(selectedCase.id, { visitCharges: parseInt(e.target.value)||0 })} className="w-full bg-transparent font-black text-2xl mt-1 outline-none text-slate-900" />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Parts PKR</label>
                      <input type="number" value={selectedCase.partsCharges} onChange={e => updateCase(selectedCase.id, { partsCharges: parseInt(e.target.value)||0 })} className="w-full bg-transparent font-black text-2xl mt-1 outline-none text-slate-900" />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Other PKR</label>
                      <input type="number" value={selectedCase.otherCharges} onChange={e => updateCase(selectedCase.id, { otherCharges: parseInt(e.target.value)||0 })} className="w-full bg-transparent font-black text-2xl mt-1 outline-none text-slate-900" />
                  </div>
              </div>
            </div>
            
            {/* Modal Footer - REMOVED PRINT BUTTON */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
               <button onClick={() => setSelectedCase(null)} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-100 shadow-sm transition-all active:scale-95">Discard Changes</button>
               <button onClick={() => { setSelectedCase(null); }} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-blue-600/20 hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95">
                  <Save size={16}/> Sync & Save Changes
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Atomic Helpers ---
const SidebarBtn = ({ icon: Icon, label, active, collapsed, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-6 px-10 py-6 text-[11px] font-black uppercase transition-all duration-300 ${active ? 'text-blue-500 bg-blue-500/10 border-r-4 border-blue-500 shadow-inner' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
    <Icon size={22} className={active ? 'text-blue-500' : 'text-slate-600'} /> 
    {!collapsed && <span className="truncate tracking-[0.15em] text-left">{label}</span>}
  </button>
);

// --- PDF Manifest Generator (Remains available for Admin Table buttons but removed from Modal) ---
const generatePDF = (complaint: Complaint | null) => {
  if (!complaint) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const total = (complaint.visitCharges||0)+(complaint.partsCharges||0)+(complaint.otherCharges||0);
  printWindow.document.write(`
    <html><head><title>SA_MANIFEST_${complaint.complaintNo}</title><style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #0f172a; line-height: 1.5; padding: 0; margin: 0; font-size: 11px; }
    .header { border-bottom: 6px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
    .box { border: 2px solid #f1f5f9; padding: 20px; border-radius: 15px; margin-bottom: 20px; }
    .label { font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px; }
    .value { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .remarks-box { background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; font-size: 12px; color: #1e293b; white-space: pre-wrap; min-height: 150px; }
    .total-row { background: #0f172a; color: #fff; padding: 25px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
    .policy { font-size: 9px; color: #64748b; margin-top: 40px; border-top: 2px dashed #e2e8f0; padding-top: 20px; }
    </style></head><body>
    <div class="header">
      <div><div style="font-size:32px; font-weight:900; color:#2563eb; font-style:italic;">SA</div><div style="font-weight:900; text-transform:uppercase; font-size:18px;">Super Asia Enterprise Core</div></div>
      <div style="text-align:right; font-size:12px; font-weight:bold; color:#64748b;">MANIFEST ID: #${complaint.complaintNo}<br/>ORDER REF: ${complaint.workOrder}<br/>REG DATE: ${complaint.regDate}</div>
    </div>
    <div class="box"><div class="label">Customer Profile</div><div class="grid"><div><div class="label">Full Name & Contact</div><div class="value">${complaint.customerName} | ${complaint.phoneNo}</div></div></div><div class="label">Primary Service Address</div><div class="value">${complaint.address}</div></div>
    <div class="box"><div class="label">Hardware Deployment Details</div><div class="grid"><div><div class="label">Model Identity</div><div class="value">${complaint.model}</div></div><div><div class="label">Category</div><div class="value">${complaint.product}</div></div><div><div class="label">Purchase Date (DOP)</div><div class="value">${complaint.dop}</div></div><div><div class="label">Assigned Technician</div><div class="value">${complaint.techName}</div></div></div></div>
    <div class="box"><div class="label">Field Action Log History</div><div class="remarks-box">${complaint.remarks || 'Fresh system log.'}</div></div>
    <div class="total-row"><div><div class="label" style="color:#64748b">Final Operation Status</div><div class="value" style="color:#fff; font-size:16px;">${complaint.status}</div></div><div style="text-align:right">
      <div class="label" style="color:#64748b">Manifest Settlement</div><div style="font-size:26px; font-weight:900; color:#10b981;">PKR ${total.toLocaleString()}/-</div>
      <div style="font-size:9px; opacity:0.5; font-weight:bold;">(Visit: ${complaint.visitCharges}, Parts: ${complaint.partsCharges}, Other: ${complaint.otherCharges})</div>
    </div></div>
    <div class="policy">
      <h4 style="margin:0 0 10px 0; text-transform:uppercase; color:#0f172a;">Enterprise Service Protocol</h4>
      <ul style="padding-left:15px; margin:0;">
        <li>Super Asia provides 1 Year Parts and 2 Years Motor coverage from documented D.O.P.</li>
        <li>Protocol is void if physical damage, voltage fluctuations, or unauthorized tampering is detected.</li>
      </ul>
      <p style="text-align:center; font-weight:900; margin-top:40px; border-top:2px solid #f1f5f9; padding-top:15px; text-transform:uppercase; color:#2563eb;">AUTHORIZED NETWORK PARTNER - SUPER ASIA CUSTOMER CARE</p>
    </div>
    <script>window.onload=()=>window.print();</script></body></html>
  `);
  printWindow.document.close();
};

const Portal = ({ onLogin }: { onLogin: (user: Staff) => void }) => {
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const staff = SuperAsiaDB.getStaff();
  const handleAuth = () => {
    const u = staff.find(s => s.loginId === id);
    if (u) {
      if (u.position !== 'TECHNICIAN' && u.password !== pass) return alert("Interface Access Revoked");
      onLogin(u);
    }
  };
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-[#0F172A]">
      <div className="max-w-md w-full bg-white p-16 rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] space-y-10 animate-in fade-in zoom-in-95 duration-700 border-t-8 border-blue-600">
        <SuperAsiaBranding size="lg" />
        <div className="space-y-6 pt-10">
           <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Personnel Link</label>
             <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-6 px-8 font-black uppercase outline-none focus:border-blue-600 shadow-sm transition-all" value={id} onChange={e=>setId(e.target.value)}>
               <option value="">ESTABLISH IDENTITY...</option>
               {staff.map(s => <option key={s.id} value={s.loginId}>{s.name} ({s.position})</option>)}
             </select>
           </div>
           {id && staff.find(s=>s.loginId===id)?.position !== 'TECHNICIAN' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Access Sequence</label>
                <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAuth()} className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-6 px-10 font-black outline-none focus:border-blue-600 shadow-sm transition-all" placeholder="PIN SEQUENCE..." />
              </div>
           )}
        </div>
        <button onClick={handleAuth} className="w-full bg-blue-600 text-white py-7 rounded-3xl font-black uppercase shadow-2xl shadow-blue-600/30 active:scale-95 hover:bg-blue-700 transition-all mt-6 tracking-[0.25em]">Initialize Hub</button>
      </div>
    </div>
  );
};

export default function SuperAsiaApp() {
  const [view, setView] = useState<AppState>('portal');
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const login = (u: Staff) => { setCurrentUser(u); setView(u.position === 'TECHNICIAN' ? 'technician-dash' : 'admin-dash'); };
  const logout = () => { setView('portal'); setCurrentUser(null); };
  return (
    <div className="min-h-screen select-none bg-white font-sans antialiased overflow-hidden">
      {view === 'portal' && <Portal onLogin={login} />}
      {(view === 'admin-dash' || view === 'admin-analytics' || view === 'admin-today') && currentUser && <AdminDash user={currentUser} onLogout={logout} />}
      {view === 'technician-dash' && currentUser && (
        <TechnicianDash user={currentUser} onLogout={logout} />
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<SuperAsiaApp />);
