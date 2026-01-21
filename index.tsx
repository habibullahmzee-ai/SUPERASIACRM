
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
  Briefcase, UserRound, LayoutDashboard, ListChecks, Wrench, ShieldEllipsis, TableProperties, MonitorCheck,
  CreditCard, Gauge, Landmark, UserCog, Power
} from 'lucide-react';
import { PRODUCT_MODEL_DB } from './product_db';
import { INITIAL_TECHNICIANS } from './technician_db';

// --- FIXED SYSTEM CONSTANTS ---
const SYSTEM_RULES = {
  DATE_PRESETS: [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last Week", value: "last_week" },
    { label: "Current Month", value: "curr_month" },
    { label: "Last 3 Months", value: "last_3m" },
    { label: "Current Year", value: "curr_year" },
    { label: "Last Year Fiscal", value: "fiscal" },
    { label: "All Time", value: "all" },
    { label: "Date Range", value: "range" }
  ],
  STATUSES: [
    "PENDING", "PARTY LIFTING", "READY TO DELIVER", "ONLINE", "NOT RESPONDING", 
    "PARTS REQ (TECH)", "ON ROUTE", "PART NOT AVAILABLE", "PART TO ATTEND", 
    "PFA (CUSTOMER)", "PFA (HEAD OFFICE)", "SERVICE CENTRE LIFTING", "COMPLETED", "CANCEL", "TEMPORARY CLOSED", "VERIFIED"
  ],
  PRODUCT_CATEGORIES: Array.from(new Set(Object.values(PRODUCT_MODEL_DB))).sort(),
  WARRANTY_POINTS: [
    "1. Visit charges of PKR 1000 apply after 1 year of purchase date.",
    "2. 1 year parts warranty.",
    "3. Motor and PCB warranty as per mentioned on warranty card.",
    "4. No warranty claim for any kind of mouse cutting, physical damage, burning, or short-circuit.",
    "5. Product will be consider OUT WARRANTY if repaired by unauthorised technician.",
    "6. Company is committed to attend complaints within 24-72 working hours (3 working days).",
    "7. Original Warranty Card and dealer invoice is mandatory to show for any claim."
  ]
};

// --- DB Operations ---
const DB_KEY_COMPLAINTS = 'superasia_v12_enterprise_stable';
const DB_KEY_STAFF = 'superasia_v2_staff_db';

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
        ...INITIAL_TECHNICIANS.map(t => ({ ...t, status: 'ACTIVE' as const, position: t.position as 'TECHNICIAN' }))
      ];
      localStorage.setItem(DB_KEY_STAFF, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },
  saveStaff: (staff: Staff[]) => {
    localStorage.setItem(DB_KEY_STAFF, JSON.stringify(staff));
  }
};

// --- Types ---
type AppState = 'portal' | 'admin-dash' | 'admin-analytics' | 'admin-today' | 'admin-staff' | 'technician-dash';

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

// --- Helper Functions ---
const getProduct = (model: string) => {
  const m = String(model || "").toUpperCase().trim();
  if (m.includes("SD-555") || m.includes("SUPER SPIN")) return "SPINNER";
  return PRODUCT_MODEL_DB[m] || "GENERAL";
};

const matchTechnician = (input: string): string => {
  const name = String(input || "").toUpperCase().trim();
  if (!name || name === "UNASSIGNED" || name === "---" || name === "0") return "UNASSIGNED";
  const staff = SuperAsiaDB.getStaff();
  const found = staff.find(t => 
    t.name.toUpperCase() === name || 
    t.importKey.toUpperCase() === name ||
    t.name.toUpperCase().includes(name) || 
    name.includes(t.name.toUpperCase())
  );
  return found ? found.name : name;
};

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
    } else { date = new Date(s); }
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

const getPKDate = (includeTime = false) => standardizeDate(new Date(), includeTime);

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

// --- Shared Components ---
const SuperAsiaBranding = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <div className="flex items-center gap-3 select-none">
    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
      <ShieldCheck size={size === 'sm' ? 20 : size === 'md' ? 32 : 48} className="text-white" />
    </div>
    <div>
      <h1 className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-lg' : 'text-2xl'} font-black tracking-tighter text-blue-600 leading-none`}>SUPER ASIA</h1>
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">Enterprise Solution</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const isVerified = status === 'VERIFIED' || status === 'COMPLETED';
  return (
    <span className={`px-1 py-0.5 rounded text-[7px] font-black uppercase whitespace-nowrap border ${isVerified ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
      {status}
    </span>
  );
};

const MultiSelect = ({ label, options, selected, onChange, icon: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAllSelected = selected.length === options.length;

  const toggleAll = () => {
    if (isAllSelected) onChange([]);
    else onChange([...options]);
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-white border border-slate-200 rounded px-2 py-1 text-[8px] font-black uppercase text-slate-600 hover:border-blue-600 transition-all">
        {Icon && <Icon size={10} className="text-blue-600" />}
        <span>{label} ({selected.length})</span>
        <ChevronDown size={10} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded shadow-2xl z-50 p-2 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
            <button onClick={toggleAll} className="w-full flex items-center gap-2 p-2 mb-1 hover:bg-blue-50 rounded transition-all border border-blue-100">
               <div className={`w-3 h-3 rounded border flex items-center justify-center transition-all ${isAllSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                 {isAllSelected && <Check size={8} className="text-white"/>}
               </div>
               <span className="text-[9px] font-black text-blue-600 uppercase">Select All</span>
            </button>
            <div className="space-y-0.5">
              {options.map((opt: string) => (
                <label key={opt} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer transition-all group">
                  <input type="checkbox" checked={selected.includes(opt)} onChange={() => {
                      const next = selected.includes(opt) ? selected.filter((s: string) => s !== opt) : [...selected, opt];
                      onChange(next);
                    }}
                    className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-600 transition-all cursor-pointer"
                  />
                  <span className="text-[9px] font-black text-slate-700 uppercase group-hover:text-blue-600 transition-all">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StandardDateFilter = ({ range, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const today = getPKDate();

  const handleSelect = (rule: string) => {
    if (rule === 'range') {
        setIsRangeOpen(true);
        return;
    }
    let start = "", end = "", label = "";
    const now = new Date();
    switch(rule) {
      case 'today': start = end = today; label = "Today"; break;
      case 'yesterday': 
        const y = new Date(); y.setDate(y.getDate() - 1);
        start = end = standardizeDate(y); label = "Yesterday"; break;
      case 'last_week':
        const lw_s = new Date(); lw_s.setDate(now.getDate() - 7);
        start = standardizeDate(lw_s); end = today; label = "Last 7 Days"; break;
      case 'curr_month':
        start = standardizeDate(new Date(now.getFullYear(), now.getMonth(), 1));
        end = today; label = "Current Month"; break;
      case 'last_3m':
        start = standardizeDate(new Date(now.getFullYear(), now.getMonth() - 3, 1));
        end = today; label = "Last 3 Months"; break;
      case 'curr_year':
        start = standardizeDate(new Date(now.getFullYear(), 0, 1));
        end = today; label = "Current Year"; break;
      case 'fiscal':
        start = standardizeDate(new Date(now.getFullYear() - 1, 6, 1));
        end = standardizeDate(new Date(now.getFullYear(), 5, 30));
        label = "Fiscal Year"; break;
      case 'all': start = end = ""; label = "All Data"; break;
    }
    onChange({ start, end, label });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-white border border-slate-200 rounded px-2 py-1 text-[8px] font-black uppercase text-slate-600 hover:border-blue-600 transition-all shadow-sm">
        <Calendar size={10} className="text-blue-600" />
        <span>{range.label || "Date Filter"}</span>
        <ChevronDown size={10} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
            {SYSTEM_RULES.DATE_PRESETS.map(d => (
              <button key={d.value} onClick={() => handleSelect(d.value)} className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-[9px] font-black uppercase text-slate-600 hover:text-blue-600 rounded transition-all">
                {d.label}
              </button>
            ))}
            
            {isRangeOpen && (
              <div className="p-2 border-t border-slate-100 mt-1 space-y-2 bg-slate-50">
                <input type="date" className="w-full text-[9px] p-1.5 rounded border border-slate-200 outline-none" onChange={e => setCustomRange({...customRange, start: standardizeDate(e.target.value)})} />
                <input type="date" className="w-full text-[9px] p-1.5 rounded border border-slate-200 outline-none" onChange={e => setCustomRange({...customRange, end: standardizeDate(e.target.value)})} />
                <button onClick={() => {
                    onChange({ start: customRange.start, end: customRange.end, label: "Custom Range" });
                    setIsOpen(false);
                }} className="w-full bg-blue-600 text-white p-1.5 rounded text-[8px] font-black uppercase">Apply</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// --- Staff Management ---
const StaffManagement = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  useEffect(() => { setStaff(SuperAsiaDB.getStaff()); }, []);

  const toggleStatus = (id: string) => {
    const next = staff.map(s => s.id === id ? { ...s, status: (s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE') as any } : s);
    setStaff(next);
    SuperAsiaDB.saveStaff(next);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
           <div>
              <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900">Personnel Directory</h2>
           </div>
           <button className="bg-blue-600 text-white px-4 py-2 rounded text-[8px] font-black uppercase flex items-center gap-2 hover:bg-blue-700 transition-all shadow shadow-blue-600/20"><UserPlus size={14}/> Add New Member</button>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left text-[10px]">
              <thead>
                 <tr className="bg-slate-50 text-[8px] font-black uppercase text-slate-400">
                    <th className="px-4 py-3">Member Name</th>
                    <th className="px-4 py-3">Login Profile</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Connectivity</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {staff.map(s => (
                   <tr key={s.id} className="hover:bg-blue-50/30 transition-all group">
                      <td className="px-4 py-2 font-black text-slate-900 uppercase group-hover:text-blue-600">{s.name}</td>
                      <td className="px-4 py-2 font-mono text-blue-600 font-black">{s.loginId}</td>
                      <td className="px-4 py-2">
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[7px] font-black uppercase border border-slate-200">{s.position}</span>
                      </td>
                      <td className="px-4 py-2 font-bold text-slate-500">{s.contact}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                         <button onClick={() => toggleStatus(s.id)} className={`p-1.5 rounded transition-all ${s.status === 'ACTIVE' ? 'text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white shadow-sm' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white shadow-sm'}`}>
                            {s.status === 'ACTIVE' ? <UserMinus size={14}/> : <UserCheck size={14}/>}
                         </button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

// --- Form ---
const ComplaintForm = ({ onCancel, onSubmit }: any) => {
  const [data, setData] = useState({
    complaintNo: "", workOrder: "", model: "", serialNo: "", dop: "",
    customerName: "", phoneNo: "", address: "", problemDescription: "", priority: "NORMAL"
  });

  return (
    <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
       <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">Register Strategic Ticket</h2>
          </div>
          <button onClick={onCancel} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-rose-50 transition-all"><X size={18}/></button>
       </div>
       <div className="flex-1 overflow-auto p-8 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Complaint No</label>
                <input required value={data.complaintNo} onChange={e=>setData({...data, complaintNo: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-[12px] font-bold outline-none focus:border-blue-600" placeholder="SA-00000" />
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Work Order (WO Reference)</label>
                <input required value={data.workOrder} onChange={e=>setData({...data, workOrder: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-[12px] font-bold outline-none focus:border-blue-600" placeholder="WO-00000" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Appliance Model</label>
                <input required value={data.model} onChange={e=>setData({...data, model: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-[12px] font-bold outline-none focus:border-blue-600" placeholder="Model Identity..." />
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Serial Number</label>
                <input value={data.serialNo} onChange={e=>setData({...data, serialNo: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-[12px] font-bold outline-none focus:border-blue-600" placeholder="SA-SERIAL-000" />
             </div>
          </div>
          <div className="space-y-1.5">
             <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Customer Full Identity</label>
             <input required value={data.customerName} onChange={e=>setData({...data, customerName: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-[12px] font-bold outline-none focus:border-blue-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Phone Number</label>
                <input required value={data.phoneNo} onChange={e=>setData({...data, phoneNo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-[12px] font-bold outline-none focus:border-blue-600" placeholder="03XXXXXXXXX" />
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Date of Purchase (DOP)</label>
                <input value={data.dop} onChange={e=>setData({...data, dop: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-[12px] font-bold outline-none focus:border-blue-600" placeholder="DD-MM-YYYY" />
             </div>
          </div>
          <div className="space-y-1.5">
             <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Full Deployment Address</label>
             <textarea value={data.address} onChange={e=>setData({...data, address: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded p-4 text-[12px] font-bold outline-none focus:border-blue-600 h-24 resize-none" />
          </div>
          <div className="space-y-1.5">
             <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Problem Description</label>
             <textarea value={data.problemDescription} onChange={e=>setData({...data, problemDescription: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded p-4 text-[12px] font-bold outline-none focus:border-blue-600 h-24 resize-none" />
          </div>
       </div>
       <div className="p-6 bg-slate-50 border-t flex gap-4">
          <button onClick={onCancel} className="flex-1 py-3 bg-white border border-slate-200 rounded font-black uppercase text-[10px]">Cancel</button>
          <button onClick={() => onSubmit({...data, product: getProduct(data.model)})} className="flex-1 py-3 bg-blue-600 text-white rounded font-black uppercase text-[10px] shadow-lg shadow-blue-600/20">Publish</button>
       </div>
    </div>
  );
};

// --- Technician Dashboard ---
const TechnicianDash = ({ user, onLogout }: { user: Staff, onLogout: () => void }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedCase, setSelectedCase] = useState<Complaint | null>(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { load(); }, []);
  const load = () => { setComplaints(SuperAsiaDB.getComplaints().filter(c => c.techName === user.name)); };

  const updateCase = (id: string, partial: Partial<Complaint>) => {
    const all = SuperAsiaDB.getComplaints();
    const updated = all.map(c => c.id === id ? { ...c, ...partial, updateDate: getPKDate(true) } : c);
    SuperAsiaDB.saveComplaints(updated);
    setComplaints(updated.filter(c => c.techName === user.name));
    if (selectedCase && selectedCase.id === id) setSelectedCase({ ...selectedCase, ...partial });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <header className="bg-[#0F172A] p-6 text-white rounded-b-3xl shadow-2xl">
         <div className="flex justify-between items-center">
            <div>
               <p className="text-[8px] font-black uppercase text-blue-400 tracking-widest">Active Core - Technician</p>
               <h2 className="text-base font-black uppercase tracking-tighter">{user.name}</h2>
            </div>
            <button onClick={onLogout} className="bg-white/10 p-2.5 rounded-full hover:bg-rose-500 transition-all shadow-lg"><LogOut size={16}/></button>
         </div>
      </header>
      <div className="p-4 space-y-3">
         {complaints.filter(c => filter === 'ALL' || c.status === filter).map(job => (
            <div key={job.id} onClick={() => setSelectedCase(job)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all hover:border-blue-600">
               <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tighter">{job.model}</h3>
                  <StatusBadge status={job.status} />
               </div>
               <div className="flex items-center gap-2 text-slate-400">
                  <MapPin size={12} className="text-blue-500 shrink-0" />
                  <p className="text-[9px] font-bold uppercase truncate">{job.address}</p>
               </div>
            </div>
         ))}
      </div>
      {selectedCase && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex items-end animate-in slide-in-from-bottom-full duration-300">
           <div className="bg-white w-full rounded-t-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                 <div>
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900">Task Management</h2>
                 </div>
                 <button onClick={() => setSelectedCase(null)} className="p-2 bg-slate-50 rounded-full transition-all hover:bg-slate-100 shadow-sm"><X size={18}/></button>
              </div>
              
              <div className="flex-1 overflow-auto space-y-4 custom-scrollbar">
                 <div className="bg-blue-600 p-5 rounded-xl text-white shadow-lg space-y-3 border-l-4 border-blue-400">
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                       <div>
                          <label className="text-[6px] font-black uppercase text-blue-200 tracking-widest">Ticket No</label>
                          <div className="font-black uppercase">#{selectedCase.complaintNo}</div>
                       </div>
                       <div>
                          <label className="text-[6px] font-black uppercase text-blue-200 tracking-widest">Contact</label>
                          <div className="font-black uppercase">{selectedCase.phoneNo}</div>
                       </div>
                       <div>
                          <label className="text-[6px] font-black uppercase text-blue-200 tracking-widest">Customer</label>
                          <div className="font-black uppercase truncate">{selectedCase.customerName}</div>
                       </div>
                       <div>
                          <label className="text-[6px] font-black uppercase text-blue-200 tracking-widest">Model</label>
                          <div className="font-black uppercase">{selectedCase.model}</div>
                       </div>
                    </div>
                    <div className="pt-2 border-t border-white/10 text-[9px] font-bold uppercase">
                       {selectedCase.address}
                    </div>
                    <div className="pt-2 border-t border-white/10 text-[9px] font-bold bg-white/10 p-2 rounded italic">
                       "{selectedCase.problemDescription || 'No description provided'}"
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400">Execution Status</label>
                        <select value={selectedCase.status} onChange={e => updateCase(selectedCase.id, { status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-[10px] font-black uppercase outline-none focus:border-blue-600">
                        {['PENDING', 'TEMPORARY CLOSED'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400">D.O.P</label>
                        <input type="text" value={selectedCase.dop} onChange={e => updateCase(selectedCase.id, { dop: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-[10px] font-bold outline-none" placeholder="DD-MM-YYYY" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400">Product</label>
                        <input type="text" value={selectedCase.product} onChange={e => updateCase(selectedCase.id, { product: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-[10px] font-bold outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400">Model</label>
                        <input type="text" value={selectedCase.model} onChange={e => updateCase(selectedCase.id, { model: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-[10px] font-bold outline-none" />
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="space-y-1">
                        <label className="text-[7px] font-black uppercase text-slate-400">Visit Fee</label>
                        <input type="number" value={selectedCase.visitCharges} onChange={e => updateCase(selectedCase.id, { visitCharges: Number(e.target.value) })} className="w-full bg-white border border-slate-200 rounded p-1.5 text-[10px] font-black text-blue-600 outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[7px] font-black uppercase text-slate-400">Parts Fee</label>
                        <input type="number" value={selectedCase.partsCharges} onChange={e => updateCase(selectedCase.id, { partsCharges: Number(e.target.value) })} className="w-full bg-white border border-slate-200 rounded p-1.5 text-[10px] font-black text-blue-600 outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[7px] font-black uppercase text-slate-400">Other Fee</label>
                        <input type="number" value={selectedCase.otherCharges} onChange={e => updateCase(selectedCase.id, { otherCharges: Number(e.target.value) })} className="w-full bg-white border border-slate-200 rounded p-1.5 text-[10px] font-black text-blue-600 outline-none" />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Activity Remarks Log</label>
                    <textarea value={selectedCase.remarks} onChange={e => updateCase(selectedCase.id, { remarks: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-[10px] font-bold h-24 resize-none outline-none focus:border-blue-600" />
                 </div>
              </div>
              <button onClick={() => setSelectedCase(null)} className="w-full py-3 bg-blue-600 text-white rounded font-black uppercase text-[9px] mt-4 shadow shadow-blue-600/30">Submit Update</button>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Admin Dashboard ---
const AdminDash = ({ user, onLogout }: { user: Staff, onLogout: () => void }) => {
  const [view, setView] = useState<AppState>('admin-dash');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<Complaint | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;
  
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [techFilter, setTechFilter] = useState<string[]>([]);
  const [productFilter, setProductFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "", label: "All Data" });

  useEffect(() => { load(); }, []);

  const load = () => {
    const raw = SuperAsiaDB.getComplaints();
    setComplaints(raw.map(c => ({
      ...c, 
      regDate: standardizeDate(c.regDate, true), 
      updateDate: standardizeDate(c.updateDate, true), 
      dop: standardizeDate(c.dop),
      aging: calculateAging(c.regDate)
    })));
  };

  const updateCase = (id: string, partial: Partial<Complaint>) => {
    const finalData = complaints.map(c => c.id === id ? { ...c, ...partial, updateDate: getPKDate(true) } : c);
    setComplaints(finalData);
    SuperAsiaDB.saveComplaints(finalData);
    if (selectedCase && selectedCase.id === id) setSelectedCase({ ...selectedCase, ...partial, updateDate: getPKDate(true) });
  };

  const addComplaint = (formData: any) => {
    const newCase: Complaint = {
      ...formData,
      id: `SA-${Date.now()}`,
      regDate: getPKDate(true),
      updateDate: getPKDate(true),
      status: "PENDING",
      techName: "UNASSIGNED",
      aging: 0,
      visitCharges: 0,
      partsCharges: 0,
      otherCharges: 0,
      remarks: `[${getPKDate(true)}]: Case file opened.`,
      priority: formData.priority || "NORMAL",
      dop: standardizeDate(formData.dop)
    };
    const next = [newCase, ...complaints];
    setComplaints(next);
    SuperAsiaDB.saveComplaints(next);
    setShowAddForm(false);
    alert("Case Successfully Documented");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        const imported: Complaint[] = data.map((row, idx) => {
          const m = String(row["MODEL"] || row["Model"] || row["Appliance Model"] || "");
          const techInput = String(row["TECH NAME"] || row["TECHNICIAN"] || row["Technician"] || row["Tech"] || "UNASSIGNED");
          return {
            id: `IMP-${Date.now()}-${idx}`,
            workOrder: String(row["WORK ORDER"] || row["Work Order"] || row["WO Reference"] || ""),
            complaintNo: String(row["COMPLAINT NO"] || row["Complaint No"] || row["Case #"] || row["Complaint #"] || ""),
            product: getProduct(m) || String(row["CATEGORY"] || row["Category"] || ""),
            priority: String(row["PRIORITY"] || row["Priority"] || "NORMAL").toUpperCase(),
            model: m.toUpperCase(),
            serialNo: String(row["SERIAL NO"] || row["Serial #"] || ""),
            regDate: standardizeDate(row["REG DATE"] || row["Date"] || getPKDate(), true),
            status: String(row["STATUS"] || "PENDING").toUpperCase(),
            techName: matchTechnician(techInput),
            updateDate: getPKDate(true),
            remarks: String(row["REMARKS"] || row["Remarks History"] || ""),
            customerName: String(row["CUSTOMER NAME"] || row["Customer"] || "").toUpperCase(),
            phoneNo: String(row["PHONE NO"] || row["Phone No"] || row["PHONE"] || row["Phone"] || row["Contact"] || ""),
            address: String(row["ADDRESS"] || row["Address"] || "").toUpperCase(),
            aging: 0, 
            visitCharges: Number(row["VISIT FEE"] || row["Visit Fee"] || row["Visit Charges"] || 0), 
            partsCharges: Number(row["PARTS FEE"] || row["Parts Fee"] || row["Parts Charges"] || 0), 
            otherCharges: Number(row["OTHER FEE"] || row["Other Fee"] || row["Other Charges"] || 0),
            dop: standardizeDate(row["DOP"] || row["D.O.P"] || row["Date of Purchase"] || ""),
            problemDescription: String(row["PROBLEM DESCRIPTION"] || row["Problem Description"] || "")
          };
        }).filter(c => c.customerName);
        SuperAsiaDB.saveComplaints([...imported, ...complaints]);
        load(); alert(`${imported.length} Records Integrated Successfully`);
      } catch (err) { alert("Core Sync Failed"); }
    };
    reader.readAsBinaryString(file);
  };

  const filtered = useMemo(() => {
    let list = complaints;
    const today = getPKDate();
    
    if (view === 'admin-today') {
      list = list.filter(c => c.updateDate?.startsWith(today) || c.regDate.startsWith(today));
    }

    return list.filter(c => {
      const matchSearch = c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.complaintNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.workOrder.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter.length === 0 || statusFilter.includes(c.status);
      const matchTech = techFilter.length === 0 || techFilter.includes(c.techName);
      const matchProd = productFilter.length === 0 || productFilter.includes(c.product);
      
      let matchDate = true;
      if (dateRange.start && dateRange.end) {
        const sd = parseStandardDate(dateRange.start);
        const ed = parseStandardDate(dateRange.end);
        const cd = parseStandardDate(c.regDate);
        if (sd && ed && cd) matchDate = cd >= sd && cd <= ed;
      }
      return matchSearch && matchStatus && matchTech && matchProd && matchDate;
    });
  }, [complaints, searchTerm, statusFilter, techFilter, productFilter, dateRange, view]);

  const todayGrouped = useMemo(() => {
    const grouped: Record<string, Complaint[]> = {};
    filtered.forEach(c => {
      const t = c.techName || "UNASSIGNED";
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(c);
    });
    return Object.entries(grouped).sort((a,b) => b[1].length - a[1].length);
  }, [filtered]);

  const staffList = useMemo(() => SuperAsiaDB.getStaff(), []);
  const techOptions = useMemo(() => staffList.filter(s => s.position === 'TECHNICIAN').map(t => t.name).sort(), [staffList]);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startResize = (column: string, startX: number, currentWidth: number) => {
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, currentWidth + (moveEvent.clientX - startX));
      setColumnWidths(prev => ({ ...prev, [column]: newWidth }));
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const ResizableHeader = ({ id, label, color, width }: { id: string, label: string, color: string, width: number }) => (
    <th 
      style={{ width: columnWidths[id] || width }} 
      className={`px-2 py-2 border-r border-slate-200 relative group select-none ${color}`}
    >
      <div className="truncate">{label}</div>
      <div 
        onMouseDown={(e) => startResize(id, e.clientX, columnWidths[id] || width)}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 z-10"
      />
    </th>
  );

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-[#0F172A] flex flex-col transition-all duration-300 shadow-2xl z-50`}>
        <div className="p-4 border-b border-white/5"><SuperAsiaBranding size="sm" /></div>
        <div className="flex-1 py-4 overflow-y-auto custom-scrollbar">
           <SidebarBtn icon={Database} label="Enterprise Database" active={view === 'admin-dash'} onClick={() => setView('admin-dash')} collapsed={!isSidebarOpen} />
           <SidebarBtn icon={MonitorCheck} label="Today Working" active={view === 'admin-today'} onClick={() => setView('admin-today')} collapsed={!isSidebarOpen} />
           <SidebarBtn icon={BarChart2} label="Statistical Hub" active={view === 'admin-analytics'} onClick={() => setView('admin-analytics')} collapsed={!isSidebarOpen} />
           <SidebarBtn icon={Users} label="Personnel Registry" active={view === 'admin-staff'} onClick={() => setView('admin-staff')} collapsed={!isSidebarOpen} />
        </div>
        <button onClick={onLogout} className="p-6 border-t border-white/5 text-rose-500 font-black uppercase text-[8px] flex gap-2 hover:bg-rose-500/10 transition-all"><LogOut size={16}/> {isSidebarOpen && 'Logout'}</button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white shadow-sm z-40">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 bg-slate-50 text-slate-400 rounded hover:text-blue-600 shadow-sm transition-all"><Menu size={14}/></button>
              <h2 className="text-base font-black tracking-tighter text-slate-900 uppercase">
                {view === 'admin-today' ? "Today Working Flow" : view === 'admin-dash' ? 'COMPLAINT MANAGEMENT' : view === 'admin-analytics' ? 'Enterprise Intelligence' : 'Member Directory'}
              </h2>
           </div>
           <div className="flex gap-2">
              <input type="file" ref={fileRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
              <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-4 py-1.5 rounded text-[8px] font-black uppercase flex items-center gap-2 hover:bg-blue-700 shadow shadow-blue-600/20"><PlusCircle size={12}/> New Case</button>
              <button onClick={() => fileRef.current?.click()} className="bg-emerald-600 text-white px-4 py-1.5 rounded text-[8px] font-black uppercase flex items-center gap-2 hover:bg-emerald-700 shadow shadow-emerald-600/20"><FileSpreadsheet size={12}/> Excel Sync</button>
           </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#F8FAFC]">
          {view === 'admin-staff' ? (
            <StaffManagement />
          ) : view === 'admin-analytics' ? (
             <div className="p-4 space-y-4">
                <div className="bg-white p-4 rounded border border-slate-200 flex flex-wrap gap-2 items-center justify-between shadow-sm">
                   <h3 className="text-[10px] font-black uppercase text-slate-900">Intelligence Filters</h3>
                   <div className="flex gap-1.5 flex-wrap">
                      <MultiSelect label="Product" options={SYSTEM_RULES.PRODUCT_CATEGORIES} selected={productFilter} onChange={setProductFilter} icon={Package} />
                      <MultiSelect label="Technician" options={techOptions} selected={techFilter} onChange={setTechFilter} icon={Users} />
                      <MultiSelect label="Status" options={SYSTEM_RULES.STATUSES} selected={statusFilter} onChange={setStatusFilter} icon={ListChecks} />
                      <StandardDateFilter range={dateRange} onChange={setDateRange} />
                   </div>
                </div>
                <AnalyticsDashboard complaints={filtered} />
             </div>
          ) : view === 'admin-today' ? (
            <div className="p-4 space-y-4">
               <div className="bg-white p-4 rounded border border-slate-200 flex justify-between items-center shadow-sm">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Today Working Workforce Flow</h3>
                  </div>
                  <div className="flex gap-1.5">
                     <MultiSelect label="Technician" options={techOptions} selected={techFilter} onChange={setTechFilter} icon={Users} />
                     <MultiSelect label="Status" options={SYSTEM_RULES.STATUSES} selected={statusFilter} onChange={setStatusFilter} icon={ListChecks} />
                  </div>
               </div>
               <div className="space-y-4">
                  {todayGrouped.map(([tech, jobs]) => (
                    <div key={tech} className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
                       <div className="bg-slate-900 p-3 flex justify-between items-center text-white">
                          <div className="flex items-center gap-2">
                             <div className="bg-blue-600 p-1.5 rounded"><UserRound size={14}/></div>
                             <h4 className="font-black uppercase tracking-tighter text-[13px]">{tech}</h4>
                          </div>
                          <span className="text-[8px] font-black uppercase bg-white/10 px-2 py-0.5 rounded">{jobs.length} Jobs</span>
                       </div>
                       <div className="overflow-x-auto">
                          <table className="w-full text-left text-[10px]">
                             <tbody className="divide-y divide-slate-100">
                                {jobs.map(j => (
                                  <tr key={j.id} className="hover:bg-slate-50 transition-all group">
                                     <td className="px-4 py-2 font-black text-blue-600">#{j.complaintNo}</td>
                                     <td className="px-4 py-2 font-black text-slate-900 uppercase">{j.customerName}</td>
                                     <td className="px-4 py-2 font-black text-slate-700 uppercase">{j.model}</td>
                                     <td className="px-4 py-2"><StatusBadge status={j.status} /></td>
                                     <td className="px-4 py-2 text-right">
                                        <button onClick={() => setSelectedCase(j)} className="p-1.5 bg-blue-600 text-white rounded hover:scale-110 shadow shadow-blue-600/20 transition-all"><Eye size={10}/></button>
                                     </td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="p-2 h-full flex flex-col">
               <div className="bg-white rounded shadow-md border border-slate-200 flex flex-col flex-1 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap bg-slate-50/50">
                    <div className="relative w-full max-w-xs">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search Name, Complaint No, WO..." className="w-full bg-white border border-slate-200 rounded py-1.5 pl-8 pr-3 text-[10px] font-bold focus:border-blue-600 outline-none" />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <MultiSelect label="Product" options={SYSTEM_RULES.PRODUCT_CATEGORIES} selected={productFilter} onChange={setProductFilter} icon={Package} />
                      <MultiSelect label="Technician" options={techOptions} selected={techFilter} onChange={setTechFilter} icon={Users} />
                      <MultiSelect label="Status" options={SYSTEM_RULES.STATUSES} selected={statusFilter} onChange={setStatusFilter} icon={ListChecks} />
                      <StandardDateFilter range={dateRange} onChange={setDateRange} />
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                     <table className="w-full min-w-[5000px] text-left border-collapse table-fixed">
                       <thead>
                          <tr className="text-[9px] font-black uppercase text-slate-900 border-b border-slate-200">
                             <th className="px-2 py-2 sticky left-0 z-30 bg-[#10b981] border-r border-slate-200 w-[80px]">Actions</th>
                             <ResizableHeader id="wo" label="WORK ORDER" color="bg-[#10b981]" width={120} />
                             <ResizableHeader id="cat" label="CATEGORY" color="bg-[#fde047]" width={140} />
                             <ResizableHeader id="pri" label="PRIORITY" color="bg-[#10b981]" width={100} />
                             <ResizableHeader id="reg" label="REG DATE" color="bg-[#10b981]" width={140} />
                             <ResizableHeader id="cn" label="COMPLAINT NO" color="bg-[#10b981]" width={120} />
                             <ResizableHeader id="st" label="STATUS" color="bg-[#10b981]" width={140} />
                             <ResizableHeader id="tn" label="TECH NAME" color="bg-[#fb923c]" width={160} />
                             <ResizableHeader id="ud" label="UPDATE DATE" color="bg-[#10b981]" width={140} />
                             <ResizableHeader id="rem" label="REMARKS" color="bg-[#10b981]" width={500} />
                             <ResizableHeader id="mod" label="MODEL" color="bg-[#10b981]" width={200} />
                             <ResizableHeader id="pd" label="PROBLEM DESCRIPTION" color="bg-[#10b981]" width={400} />
                             <ResizableHeader id="dop" label="D.O.P" color="bg-[#10b981]" width={120} />
                             <ResizableHeader id="cnm" label="CUSTOMER NAME" color="bg-[#10b981]" width={200} />
                             <ResizableHeader id="ph" label="PHONE NO" color="bg-[#10b981]" width={120} />
                             <ResizableHeader id="add" label="ADDRESS" color="bg-[#10b981]" width={300} />
                             <ResizableHeader id="age" label="AGING" color="bg-[#000000] text-white" width={80} />
                             <ResizableHeader id="vf" label="VISIT FEE" color="bg-[#10b981]" width={100} />
                             <ResizableHeader id="pf" label="PARTS FEE" color="bg-[#10b981]" width={100} />
                             <ResizableHeader id="of" label="OTHER FEE" color="bg-[#10b981]" width={100} />
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 bg-white">
                          {paginated.map(row => (
                            <tr key={row.id} className="hover:bg-blue-50/50 transition-colors group">
                               <td className="px-2 py-1 sticky left-0 z-10 bg-white border-r border-slate-100 flex gap-1.5 group-hover:bg-blue-50/50">
                                  <button onClick={() => setSelectedCase(row)} className="p-1 bg-blue-600 text-white rounded hover:scale-110 shadow shadow-blue-600/20"><Eye size={10}/></button>
                                  <button onClick={() => generatePDF(row)} className="p-1 bg-rose-600 text-white rounded hover:scale-110 shadow shadow-rose-600/20"><Printer size={10}/></button>
                               </td>
                               <td style={{ width: columnWidths['wo'] }} className="px-2 py-1 border-r border-slate-100 font-bold text-slate-500 text-[10px] truncate">{row.workOrder}</td>
                               <td style={{ width: columnWidths['cat'] }} className="px-2 py-1 border-r border-slate-100 font-black text-slate-800 text-[10px] truncate">{row.product}</td>
                               <td style={{ width: columnWidths['pri'] }} className="px-2 py-1 border-r border-slate-100 font-black text-slate-500 text-[9px] uppercase">{row.priority || 'NORMAL'}</td>
                               <td style={{ width: columnWidths['reg'] }} className="px-2 py-1 border-r border-slate-100 font-mono text-[9px] truncate">{row.regDate}</td>
                               <td style={{ width: columnWidths['cn'] }} className="px-2 py-1 border-r border-slate-100 font-black text-blue-600 text-[10px] truncate">#{row.complaintNo}</td>
                               <td style={{ width: columnWidths['st'] }} className="px-2 py-1 border-r border-slate-100"><StatusBadge status={row.status} /></td>
                               <td style={{ width: columnWidths['tn'] }} className="px-2 py-1 border-r border-slate-100 font-black text-slate-800 text-[10px] truncate">{row.techName}</td>
                               <td style={{ width: columnWidths['ud'] }} className="px-2 py-1 border-r border-slate-100 font-mono text-[9px] truncate">{row.updateDate}</td>
                               <td style={{ width: columnWidths['rem'] }} className="px-2 py-1 border-r border-slate-100 text-[10px] text-slate-400 italic truncate">{row.remarks}</td>
                               <td style={{ width: columnWidths['mod'] }} className="px-2 py-1 border-r border-slate-100 font-black text-slate-900 text-[10px] truncate uppercase">{row.model}</td>
                               <td style={{ width: columnWidths['pd'] }} className="px-2 py-1 border-r border-slate-100 text-[10px] text-slate-500 truncate">{row.problemDescription || '---'}</td>
                               <td style={{ width: columnWidths['dop'] }} className="px-2 py-1 border-r border-slate-100 font-mono text-[9px] truncate">{row.dop || '---'}</td>
                               <td style={{ width: columnWidths['cnm'] }} className="px-2 py-1 border-r border-slate-100 font-black text-slate-900 text-[10px] truncate group-hover:text-blue-600">{row.customerName}</td>
                               <td style={{ width: columnWidths['ph'] }} className="px-2 py-1 border-r border-slate-100 font-bold text-blue-600 text-[10px] whitespace-nowrap">{row.phoneNo}</td>
                               <td style={{ width: columnWidths['add'] }} className="px-2 py-1 border-r border-slate-100 text-[10px] text-slate-500 uppercase truncate">{row.address}</td>
                               <td style={{ width: columnWidths['age'] }} className="px-2 py-1 border-r border-slate-100 font-black text-slate-900 text-[11px] text-center">{row.aging}</td>
                               <td style={{ width: columnWidths['vf'] }} className="px-2 py-1 border-r border-slate-100 font-black text-slate-600 text-right">{row.visitCharges.toLocaleString()}</td>
                               <td style={{ width: columnWidths['pf'] }} className="px-2 py-1 border-r border-slate-100 font-black text-slate-600 text-right">{row.partsCharges.toLocaleString()}</td>
                               <td style={{ width: columnWidths['of'] }} className="px-2 py-1 border-r border-slate-100 font-black text-slate-600 text-right">{row.otherCharges.toLocaleString()}</td>
                            </tr>
                          ))}
                       </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Admin Assignment & Edit Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-2xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase">Strategic Case Panel</h2>
                <p className="text-[9px] font-black text-blue-600 uppercase mt-0.5">#{selectedCase.complaintNo}</p>
              </div>
              <button onClick={() => setSelectedCase(null)} className="p-3 bg-white border border-slate-200 rounded-full hover:bg-rose-50 transition-all shadow-sm"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-auto p-10 space-y-8 custom-scrollbar bg-white">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Assigned Technician</label>
                    <select value={selectedCase.techName} onChange={e => updateCase(selectedCase.id, { techName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded p-4 text-[11px] font-black uppercase outline-none focus:border-blue-600 shadow-inner">
                       <option value="UNASSIGNED">SELECT TECHNICIAN...</option>
                       {staffList.filter(s=>s.position==='TECHNICIAN' && s.status==='ACTIVE').map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Lifecycle Status</label>
                    <select value={selectedCase.status} onChange={e => updateCase(selectedCase.id, { status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded p-4 text-[11px] font-black uppercase outline-none focus:border-blue-600 shadow-inner">
                       {SYSTEM_RULES.STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><History size={12}/> Remarks Log</label>
                    <button onClick={() => updateCase(selectedCase.id, { remarks: `${selectedCase.remarks}\n[${getPKDate(true)}]: ` })} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-[8px] font-black uppercase shadow-lg transition-all active:scale-95"><Clock size={12}/> Timestamp</button>
                 </div>
                 <textarea value={selectedCase.remarks} onChange={e => updateCase(selectedCase.id, { remarks: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded p-6 font-bold text-base text-slate-800 h-64 outline-none focus:border-blue-600 shadow-inner resize-none transition-all" />
              </div>
              <div className="grid grid-cols-3 gap-6">
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Visit Fee</label>
                    <input type="number" value={selectedCase.visitCharges} onChange={e => updateCase(selectedCase.id, { visitCharges: Number(e.target.value) })} className="w-full bg-transparent font-black text-xl mt-1 outline-none text-blue-600" />
                 </div>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Parts Fee</label>
                    <input type="number" value={selectedCase.partsCharges} onChange={e => updateCase(selectedCase.id, { partsCharges: Number(e.target.value) })} className="w-full bg-transparent font-black text-xl mt-1 outline-none text-blue-600" />
                 </div>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Other Fee</label>
                    <input type="number" value={selectedCase.otherCharges} onChange={e => updateCase(selectedCase.id, { otherCharges: Number(e.target.value) })} className="w-full bg-transparent font-black text-xl mt-1 outline-none text-blue-600" />
                 </div>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t flex justify-end gap-4">
               <button onClick={() => setSelectedCase(null)} className="px-6 py-3 bg-white border border-slate-200 rounded font-black uppercase text-[9px] hover:bg-slate-100 transition-all shadow-sm">Discard</button>
               <button onClick={() => { setSelectedCase(null); }} className="px-6 py-3 bg-blue-600 text-white rounded font-black uppercase text-[9px] shadow-lg hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95"><Save size={14}/> Commit Update</button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <ComplaintForm onCancel={() => setShowAddForm(false)} onSubmit={addComplaint} />
        </div>
      )}
    </div>
  );
};

// --- Atomic Layout Helpers ---
const SidebarBtn = ({ icon: Icon, label, active, collapsed, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 text-[9px] font-black uppercase transition-all duration-300 ${active ? 'text-blue-500 bg-blue-500/10 border-r-4 border-blue-500 shadow-inner' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
    <Icon size={16} className={active ? 'text-blue-500' : 'text-slate-600'} /> 
    {!collapsed && <span className="truncate tracking-widest text-left">{label}</span>}
  </button>
);

const generatePDF = (complaint: Complaint | null) => {
  if (!complaint) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const total = (complaint.visitCharges||0)+(complaint.partsCharges||0)+(complaint.otherCharges||0);
  printWindow.document.write(`
    <html><head><title>SA_Ticket_${complaint.complaintNo}</title><style>
    @page { size: A4; margin: 10mm; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #0f172a; line-height: 1.3; padding: 0; margin: 0; font-size: 10.5px; }
    .header { border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
    .box { border: 1.5px solid #f1f5f9; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; }
    .label { font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
    .value { font-size: 11.5px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .remarks { background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 9.5px; white-space: pre-wrap; min-height: 80px; }
    .total-row { background: #0f172a; color: #fff; padding: 15px 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
    .warranty { font-size: 8px; color: #64748b; margin-top: 15px; border-top: 1px dashed #e2e8f0; padding-top: 10px; }
    .sig { margin-top: 25px; display: flex; justify-content: space-between; padding: 0 40px; }
    .sig-line { border-top: 1.2px solid #000; width: 160px; text-align: center; padding-top: 5px; font-weight: 900; text-transform: uppercase; font-size: 7.5px; }
    </style></head><body>
    <div class="header">
      <div><h1 style="color:#2563eb; font-size:28px; font-weight:900; margin:0;">SUPER ASIA</h1><p style="margin:0; font-weight:900; font-size:9px;">ENTERPRISE SERVICE MANIFEST</p></div>
      <div style="text-align:right;"><strong>COMPLAINT NO: #${complaint.complaintNo}</strong><br/>WO REF: ${complaint.workOrder}<br/>DATE: ${complaint.regDate}</div>
    </div>
    <div class="box"><div class="label">Customer Profile</div><div class="grid"><div><div class="label">Full Name</div><div class="value">${complaint.customerName}</div></div><div><div class="label">Phone Number</div><div class="value">${complaint.phoneNo}</div></div></div><div class="label">Service Deployment Address</div><div class="value">${complaint.address}</div></div>
    <div class="box"><div class="label">Asset Deployment Details</div><div class="grid"><div><div class="label">Model Identity</div><div class="value">${complaint.model}</div></div><div><div class="label">Product Category</div><div class="value">${complaint.product}</div></div><div><div class="label">Serial Sequence</div><div class="value">${complaint.serialNo || '---'}</div></div><div><div class="label">Technician</div><div class="value">${complaint.techName}</div></div></div></div>
    <div class="box"><div class="label">Operational Activity History</div><div class="remarks">${complaint.remarks}</div></div>
    <div class="total-row"><div><div class="label" style="color:#94a3b8">Lifecycle Status</div><div class="value" style="color:#fff; font-size:14px; margin:0;">${complaint.status}</div></div><div style="text-align:right">
      <div class="label" style="color:#94a3b8">Final Settlement</div><div style="font-size:22px; font-weight:900; color:#10b981;">PKR ${total.toLocaleString()}/-</div>
      <p style="font-size:8px; margin:4px 0 0 0; opacity:0.6;">(Visit: ${complaint.visitCharges} | Parts: ${complaint.partsCharges} | Misc: ${complaint.otherCharges})</p>
    </div></div>
    <div class="warranty">
      <h4 style="margin:0 0 5px 0; text-transform:uppercase; color:#0f172a; font-size:9px;">Warranty Terms & Conditions</h4>
      ${SYSTEM_RULES.WARRANTY_POINTS.map(point => `<p style="margin-bottom:2px;">${point}</p>`).join('')}
      <p style="text-align:center; font-weight:900; margin-top:12px; color:#2563eb; font-size:8.5px;">SUPER ASIA CUSTOMER CARE - AUTHORIZED SERVICE NETWORK</p>
    </div>
    <div class="sig">
      <div class="sig-line">Technician Authorization</div>
      <div class="sig-line">Customer Acknowledgment</div>
    </div>
    <script>window.onload=()=>window.print();</script></body></html>
  `);
  printWindow.document.close();
};

const AnalyticsDashboard = ({ complaints }: { complaints: Complaint[] }) => {
  const stats = useMemo(() => {
    const total = complaints.length;
    const completed = complaints.filter(c => c.status === 'COMPLETED' || c.status === 'VERIFIED').length;
    const pending = complaints.filter(c => c.status === 'PENDING').length;
    const revenue = complaints.reduce((sum, c) => sum + (c.visitCharges + c.partsCharges + c.otherCharges), 0);
    return { total, completed, pending, revenue };
  }, [complaints]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       <StatCard icon={Database} label="Total Managed Cases" value={stats.total} color="blue" />
       <StatCard icon={CheckCircle2} label="Closed Lifecycles" value={stats.completed} color="emerald" />
       <StatCard icon={Clock} label="Pending Deployment" value={stats.pending} color="amber" />
       <StatCard icon={Landmark} label="Gross Settlement PKR" value={stats.revenue.toLocaleString()} color="indigo" />
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100'
  };
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}><Icon size={20} /></div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <h4 className="text-xl font-black text-slate-900 tracking-tighter">{value}</h4>
    </div>
  );
};

const Portal = ({ onLogin }: { onLogin: (user: Staff) => void }) => {
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const staff = SuperAsiaDB.getStaff();

  const handleAuth = () => {
    const u = staff.find(s => s.loginId === id);
    if (u) {
      if (u.status === 'INACTIVE') return alert("Access Restriction protocol Active");
      if (u.position !== 'TECHNICIAN' && u.password !== pass) return alert("Invalid PIN Sequence");
      onLogin(u);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 to-[#0F172A]">
      <div className="max-w-md w-full bg-white p-12 rounded-[2.5rem] shadow-2xl space-y-10 border-t-8 border-blue-600">
        <SuperAsiaBranding size="lg" />
        <div className="space-y-4 pt-6">
           <div className="space-y-1">
             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Select User</label>
             <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-8 font-black uppercase outline-none focus:border-blue-600 transition-all shadow-inner text-[12px]" value={id} onChange={e=>setId(e.target.value)}>
               <option value="">WHO ARE YOU?</option>
               {staff.map(s => <option key={s.id} value={s.loginId}>{s.name} ({s.position})</option>)}
             </select>
           </div>
           {id && staff.find(s=>s.loginId===id)?.position !== 'TECHNICIAN' && (
              <div className="space-y-1 animate-in slide-in-from-top-4 duration-300">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Access PIN</label>
                <input type="password" value={pass} onKeyDown={e => e.key === 'Enter' && handleAuth()} onChange={e=>setPass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-10 font-black outline-none focus:border-blue-600 shadow-sm text-[12px]" placeholder="PIN CODE..." />
              </div>
           )}
        </div>
        <button onClick={handleAuth} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase shadow-2xl hover:bg-blue-700 tracking-widest transition-all active:scale-95 shadow-blue-600/30 text-[11px]">Establish Link</button>
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
      {(view === 'admin-dash' || view === 'admin-analytics' || view === 'admin-today' || view === 'admin-staff') && currentUser && <AdminDash user={currentUser} onLogout={logout} />}
      {view === 'technician-dash' && currentUser && <TechnicianDash user={currentUser} onLogout={logout} />}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<SuperAsiaApp />);
