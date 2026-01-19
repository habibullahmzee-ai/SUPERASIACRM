
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import { 
  Phone, LogOut, Shield, MapPin, User, ChevronRight, Users, CheckCircle2, Clock, X, Database, 
  BarChart2, FileSpreadsheet, History, FileText, ChevronDown, PlusCircle, Package, Upload, 
  HardDrive, Trash2, Ban, CheckSquare, MessageSquare, RefreshCw, UserPlus, FileDown, TrendingUp,
  Zap, Hash, Tag, Store, CalendarDays, Cpu, ShieldCheck, Server, Lock, Settings, Eye, Info, Image as ImageIcon,
  Check, ShieldAlert, ArrowRight, Camera, Save, ClipboardList, AlertCircle, DollarSign, PenTool,
  TrendingDown, Layers, Activity, Search, Filter, Calendar, ChevronUp, Menu, CheckSquare as CheckSquareIcon,
  Square, UserCheck, UserMinus, Key, MoreHorizontal, UserX, FileType, ToggleLeft, ToggleRight,
  Terminal, Code2, AlertTriangle, FilePlus, Download, Info as InfoIcon, Share2
} from 'lucide-react';
import { PRODUCT_MODEL_DB } from './product_db';
import { INITIAL_TECHNICIANS } from './technician_db';

const ALL_MODELS = Object.keys(PRODUCT_MODEL_DB).sort();
const ALL_PRODUCT_CATEGORIES = Array.from(new Set(Object.values(PRODUCT_MODEL_DB))).sort();

// --- Location Data ---
const PAKISTAN_LOCATIONS: Record<string, Record<string, string[]>> = {
  "SINDH": {
    "KARACHI": ["Clifton", "DHA", "Gulshan-e-Iqbal", "North Nazimabad", "Malir", "Korangi", "Federal B Area", "Saddar", "Lyari", "Surjani Town"],
    "HYDERABAD": ["Latifabad", "Qasimabad", "City Area"],
    "SUKKUR": ["Barrage Road", "Old Sukkur", "New Sukkur"]
  },
  "PUNJAB": {
    "LAHORE": ["DHA", "Gulberg", "Model Town", "Johar Town", "Bahria Town", "Walled City", "Iqbal Town", "Cantt"],
    "FAISALABAD": ["Madina Town", "People's Colony", "Samanabad"],
    "MULTAN": ["Gulgasht Colony", "Multan Cantt", "Shah Rukne Alam"],
    "RAWALPINDI": ["Satellite Town", "Saddar", "Bahria Town"]
  },
  "ISLAMABAD": {
    "ISLAMABAD": ["F-6", "F-7", "F-8", "G-9", "G-10", "G-11", "I-8", "I-9", "Blue Area", "DHA"]
  },
  "KPK": {
    "PESHAWAR": ["Hayatabad", "University Town", "Peshawar Cantt"],
    "ABBOTTABAD": ["Mandian", "Supply", "Cantt"]
  }
};

// --- Types ---
type AppState = 'portal' | 'admin-dash' | 'technician-dash';
type AdminTab = 'dashboard' | 'reports' | 'launch';

interface HistoryLog {
  date: string;
  status: string;
  remark: string;
  user: string;
  images?: string[];
}

interface Complaint {
  id: string; 
  category: string;
  priority: string;
  regDate: string;
  complaintNo: string;
  status: string;
  technician: string; 
  updateDate: string;
  remarks: string;
  product: string; 
  model: string; 
  problemDescription: string;
  dop: string; 
  customerName: string;
  phoneNo: string;
  address: string;
  aging: number;
  serialNumber?: string;
  visitCharges?: number;
  partsCharges?: number;
  otherCharges?: number;
  history?: HistoryLog[];
  images?: string[];
  [key: string]: any;
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
  "PARTY LIFTING", "READY TO DELIVER", "ONLINE", "NOT RESPONDING", 
  "PARTS REQ (TECH)", "ON ROUTE", "PART NOT AVAILABLE", "PART TO ATTEND", 
  "PFA (CUSTOMER)", "PFA (HEAD OFFICE)", "SERVICE CENTRE LIFTING", "COMPLETED", "CANCEL", "TEMPORARY CLOSED"
];

// Consistent Production Keys
const DB_KEY_COMPLAINTS = 'sa_production_complaints_v1';
const DB_KEY_STAFF = 'sa_production_staff_v1';

// --- Helper Functions ---
const getPKDate = () => {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getFullYear()).slice(-2)}`;
};

const SuperAsiaDB = {
  getComplaints: (): Complaint[] => {
    // Migration logic to sweep old versions
    const versions = ['sa_complaints_v18', 'sa_complaints_v19', 'sa_complaints_v20', DB_KEY_COMPLAINTS];
    let activeData = null;
    
    for (const v of versions) {
      const stored = localStorage.getItem(v);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) {
          activeData = parsed;
          // If found in old version, migrate to new production key immediately
          if (v !== DB_KEY_COMPLAINTS) {
            localStorage.setItem(DB_KEY_COMPLAINTS, JSON.stringify(activeData));
          }
          break;
        }
      }
    }
    return activeData || [];
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
  },
  saveStaff: (staff: Staff[]) => {
    localStorage.setItem(DB_KEY_STAFF, JSON.stringify(staff));
  },
  exportDatabase: () => {
    const complaints = SuperAsiaDB.getComplaints();
    const staff = SuperAsiaDB.getStaff();
    const data = { complaints, staff, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SA_Backup_${getPKDate().replace(/\./g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

const SuperAsiaBranding = ({ size = "lg" }: { size?: "sm" | "lg" }) => (
  <div className="flex items-center gap-3">
    <div className={`${size === 'lg' ? 'w-12 h-12 text-xl' : 'w-10 h-10 text-lg'} bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic shadow-xl shadow-blue-500/20`}>SA</div>
    <div>
      <h1 className={`${size === 'lg' ? 'text-lg' : 'text-sm'} font-black text-slate-900 uppercase tracking-tighter leading-none`}>Super Asia</h1>
      <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-1">Enterprise Core</p>
    </div>
  </div>
);

const printComplaintReport = (complaint: Complaint) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const totalCharges = (complaint.visitCharges || 0) + (complaint.partsCharges || 0) + (complaint.otherCharges || 0);
  printWindow.document.write(`
    <html>
      <head>
        <title>SA Case - ${complaint.complaintNo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          @page { size: A4; margin: 10mm; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 0; color: #1e293b; background: white; margin: 0; line-height: 1.2; width: 210mm; height: 297mm; box-sizing: border-box; }
          .container { width: 100%; padding: 15px; box-sizing: border-box; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .logo-area { display: flex; align-items: center; gap: 10px; }
          .logo { background: #2563eb; color: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: 900; border-radius: 6px; font-size: 20px; font-style: italic; }
          .title-area h1 { font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0f172a; }
          .title-area p { font-size: 8px; font-weight: 700; color: #2563eb; margin: 0; letter-spacing: 1px; }
          .meta-info { text-align: right; }
          .meta-info h2 { font-size: 14px; font-weight: 800; color: #2563eb; margin: 0; }
          .meta-info p { font-size: 9px; color: #64748b; margin: 0; text-transform: uppercase; font-weight: 700; }
          .section-title { font-size: 8px; font-weight: 800; text-transform: uppercase; color: #2563eb; background: #f8fafc; padding: 4px 10px; border-left: 4px solid #2563eb; margin: 12px 0 8px; }
          .grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 10px; margin-bottom: 8px; }
          .field { display: flex; flex-direction: column; }
          .label { font-size: 7px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 1px; }
          .value { font-size: 9px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 1px; }
          .wide { grid-column: span 2; }
          .full { grid-column: span 4; }
          .asset-row { display: grid; grid-template-cols: 1.5fr 1.5fr 1fr 1fr; gap: 10px; padding: 8px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
          .charges-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          .charges-table th { text-align: left; font-size: 8px; color: #94a3b8; padding: 5px; border-bottom: 1px solid #e2e8f0; }
          .charges-table td { font-size: 9px; font-weight: 700; padding: 5px; border-bottom: 1px solid #f8fafc; }
          .total-row { background: #f1f5f9; color: #2563eb; font-weight: 800 !important; font-size: 10px; }
          .findings-box { font-size: 9px; color: #475569; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 8px; min-height: 40px; font-style: italic; }
          .warranty-box { margin-top: 15px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #fff; }
          .warranty-box h3 { font-size: 8px; font-weight: 800; margin: 0 0 6px; text-transform: uppercase; color: #0f172a; text-decoration: underline; }
          .terms-list { margin: 0; padding: 0; list-style: none; display: grid; grid-template-cols: 1fr 1fr; gap: 4px 15px; }
          .terms-list li { font-size: 7.5px; color: #64748b; line-height: 1.2; position: relative; padding-left: 10px; }
          .terms-list li::before { content: "•"; position: absolute; left: 0; color: #2563eb; font-weight: 900; }
          .sig-row { margin-top: 25px; display: flex; justify-content: space-between; }
          .sig-block { width: 180px; text-align: center; }
          .sig-line { border-top: 1px solid #94a3b8; margin-bottom: 4px; }
          .sig-label { font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
          @media print { body { width: 210mm; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-area"><div class="logo">SA</div><div class="title-area"><h1>Super Asia Service</h1><p>NATIONWIDE SUPPORT NETWORK</p></div></div>
            <div class="meta-info"><h2>${complaint.complaintNo}</h2><p>Work ID: ${complaint.id} | Status: ${complaint.status}</p></div>
          </div>
          <div class="section-title">Customer Identity</div>
          <div class="grid">
            <div class="field wide"><div class="label">Customer Name</div><div class="value">${complaint.customerName}</div></div>
            <div class="field"><div class="label">Contact</div><div class="value">${complaint.phoneNo}</div></div>
            <div class="field"><div class="label">Reg Date</div><div class="value">${complaint.regDate}</div></div>
            <div class="field full"><div class="label">Service Address</div><div class="value">${complaint.address}</div></div>
          </div>
          <div class="section-title">Verified Asset</div>
          <div class="asset-row">
            <div class="field"><div class="label">Category</div><div class="value">${complaint.product}</div></div>
            <div class="field"><div class="label">Model</div><div class="value">${complaint.model}</div></div>
            <div class="field"><div class="label">Serial No</div><div class="value">${complaint.serialNumber || 'N/A'}</div></div>
            <div class="field"><div class="label">D.O.P</div><div class="value">${complaint.dop || 'N/A'}</div></div>
          </div>
          <div class="section-title">Settlement Summary</div>
          <table class="charges-table">
             <thead><tr><th>Description</th><th style="text-align:right;">Amount (PKR)</th></tr></thead>
             <tbody>
                <tr><td>Visit Fee</td><td style="text-align:right;">${complaint.visitCharges || 0}</td></tr>
                <tr><td>Parts Fee</td><td style="text-align:right;">${complaint.partsCharges || 0}</td></tr>
                <tr><td>Others</td><td style="text-align:right;">${complaint.otherCharges || 0}</td></tr>
                <tr class="total-row"><td>GROSS TOTAL</td><td style="text-align:right;">${totalCharges}/-</td></tr>
             </tbody>
          </table>
          <div class="section-title">Technical Remarks</div>
          <div class="findings-box">${complaint.remarks || 'No detailed updates recorded.'}</div>
          <div class="warranty-box">
            <h3>WARRANTY TERMS & CONDITIONS</h3>
            <ul class="terms-list">
              <li>Visit charges of PKR 1000 apply after 1 year of purchase date.</li>
              <li>1 year parts warranty.</li>
              <li>Motor and PCB warranty as per mentioned on warranty card.</li>
              <li>No warranty claim for mouse cutting, physical damage, burning, or short-circuit.</li>
              <li>Product consider OUT WARRANTY if repaired by unauthorised technician.</li>
              <li>Company committed to attend complaints within 24-72 working hours (3 working days).</li>
              <li>Original Warranty Card and dealer invoice is mandatory to show for any claim.</li>
            </ul>
          </div>
          <div class="sig-row">
            <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Technician Signature</div></div>
            <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Customer Acknowledgment</div></div>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

const formatExcelDate = (val: any): string => {
  if (!val) return "";
  if (typeof val === 'number') {
    const date = new Date((val - (25567 + 1)) * 86400 * 1000);
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getFullYear()).slice(-2)}`;
  }
  return String(val).trim();
};

const parsePKDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split(/[.-]/);
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0]);
  const m = parseInt(parts[1]) - 1;
  const y = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
  const res = new Date(y, m, d);
  return isNaN(res.getTime()) ? null : res;
};

const calculateAging = (regDateStr: string): number => {
  const regDate = parsePKDate(regDateStr);
  if (!regDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - regDate.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toUpperCase() || '';
  const isFinal = s === 'COMPLETED' || s === 'CANCEL' || s === 'CLOSED' || s === 'TEMPORARY CLOSED';
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter whitespace-nowrap shadow-sm border ${isFinal ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-100 text-slate-900 border-slate-300'}`}>
      {status}
    </span>
  );
};

// --- View: Launch Case Tab (Admin) ---
const LaunchCaseTab = ({ onCaseLaunched }: { onCaseLaunched: (newCase: Complaint) => void }) => {
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNo: "",
    state: "",
    city: "",
    area: "",
    detailedAddress: "",
    product: "",
    model: "",
    dop: "",
    problemDescription: ""
  });

  const [loading, setLoading] = useState(false);

  const availableCities = useMemo(() => {
    if (!formData.state) return [];
    return Object.keys(PAKISTAN_LOCATIONS[formData.state] || {});
  }, [formData.state]);

  const availableAreas = useMemo(() => {
    if (!formData.state || !formData.city) return [];
    return PAKISTAN_LOCATIONS[formData.state][formData.city] || [];
  }, [formData.state, formData.city]);

  const filteredModels = useMemo(() => {
    if (!formData.product) return ALL_MODELS;
    return ALL_MODELS.filter(m => PRODUCT_MODEL_DB[m] === formData.product);
  }, [formData.product]);

  const handleProductChange = (v: string) => {
    setFormData(prev => ({ ...prev, product: v, model: "" }));
  };

  const handleModelChange = (v: string) => {
    const autoProduct = PRODUCT_MODEL_DB[v] || formData.product;
    setFormData(prev => ({ ...prev, model: v, product: autoProduct }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phoneNo || !formData.product || !formData.model) {
      alert("Please fill mandatory fields (Name, Contact, Product, Model)");
      return;
    }

    setLoading(true);
    const complaints = SuperAsiaDB.getComplaints();
    const lastNo = complaints.reduce((max, c) => {
      const num = parseInt(c.complaintNo);
      return isNaN(num) ? max : Math.max(max, num);
    }, 10000);
    const newComplaintNo = String(lastNo + 1);
    const fullAddress = `${formData.detailedAddress}, ${formData.area}, ${formData.city}, ${formData.state}`;
    const today = getPKDate();

    const newCase: Complaint = {
      id: `SA-${Date.now()}`,
      complaintNo: newComplaintNo,
      customerName: formData.customerName.toUpperCase(),
      phoneNo: formData.phoneNo,
      address: fullAddress.toUpperCase(),
      product: formData.product,
      model: formData.model,
      problemDescription: formData.problemDescription,
      dop: formData.dop,
      regDate: today,
      status: "PENDING",
      priority: "NORMAL",
      technician: "UNASSIGNED",
      updateDate: "",
      remarks: "",
      aging: 0,
      category: formData.product,
      history: [],
      images: [],
      visitCharges: 0,
      partsCharges: 0,
      otherCharges: 0
    };

    const updated = [newCase, ...complaints];
    SuperAsiaDB.saveComplaints(updated);
    printComplaintReport(newCase);
    onCaseLaunched(newCase);
    setLoading(false);
    setFormData({ customerName: "", phoneNo: "", state: "", city: "", area: "", detailedAddress: "", product: "", model: "", dop: "", problemDescription: "" });
    alert(`Complaint Launched Successfully! No: ${newComplaintNo}`);
  };

  return (
    <div className="p-10 bg-slate-50 flex-1 overflow-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
           <div className="flex items-center gap-6 mb-8">
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"><FilePlus size={28} /></div>
              <div><h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Launch New Complaint</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel Authorization: BALAJ ANSARI</p></div>
           </div>
           <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-6">
                 <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Customer Data</h3>
                 <div className="grid grid-cols-2 gap-6"><Input label="Customer Full Name" value={formData.customerName} onChange={(v:any) => setFormData({...formData, customerName: v})} placeholder="Enter Customer Name..." /><Input label="Contact Number" value={formData.phoneNo} onChange={(v:any) => setFormData({...formData, phoneNo: v})} placeholder="03xx-xxxxxxx" /></div>
              </div>
              <div className="space-y-6">
                 <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> Address Details</h3>
                 <div className="grid grid-cols-3 gap-6">
                    <Select label="State / Province" value={formData.state} options={Object.keys(PAKISTAN_LOCATIONS)} onChange={(v:any) => setFormData({...formData, state: v, city: "", area: ""})} />
                    <Select label="City" value={formData.city} options={availableCities} onChange={(v:any) => setFormData({...formData, city: v, area: ""})} />
                    <Select label="Area" value={formData.area} options={availableAreas} onChange={(v:any) => setFormData({...formData, area: v})} />
                 </div>
                 <Input label="Detailed Street Address" value={formData.detailedAddress} onChange={(v:any) => setFormData({...formData, detailedAddress: v})} placeholder="House No, Street, Landmark..." />
              </div>
              <div className="space-y-6">
                 <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Package size={14}/> Product Matrix</h3>
                 <div className="grid grid-cols-2 gap-6"><Select label="Product Category" value={formData.product} options={ALL_PRODUCT_CATEGORIES} onChange={handleProductChange} /><Select label="Model Number" value={formData.model} options={filteredModels} onChange={handleModelChange} /></div>
                 <div className="grid grid-cols-2 gap-6"><Input label="Date of Purchase (D.O.P)" type="date" value={formData.dop} onChange={(v:any) => setFormData({...formData, dop: v})} />
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Problem / Fault</label><textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-[13px] font-black transition-all outline-none focus:border-blue-600 h-28 resize-none" value={formData.problemDescription} onChange={(e) => setFormData({...formData, problemDescription: e.target.value})} placeholder="Describe technical issue..." /></div>
                 </div>
              </div>
              <div className="pt-8"><button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-[15px] tracking-widest shadow-2xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3">{loading ? <RefreshCw className="animate-spin" /> : <Save size={20}/>} Establish Case & Generate Report</button></div>
           </form>
        </div>
      </div>
    </div>
  );
};

// --- View: Technician Dash ---
const TechnicianDash = ({ staff, onLogout }: { staff: Staff, onLogout: () => void }) => {
  const [jobs, setJobs] = useState<Complaint[]>([]);
  const [selectedJob, setSelectedJob] = useState<Complaint | null>(null);
  const [form, setForm] = useState({ remarks: '', status: '', dop: '', serialNumber: '', product: '', model: '', visitCharges: 0, partsCharges: 0, otherCharges: 0, images: [] as string[] });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadJobs(); }, [staff.name]);

  const loadJobs = () => {
    const all = SuperAsiaDB.getComplaints();
    setJobs(all.filter(c => {
      const ts = (c.technician || '').split(', ').map(t => t.trim().toUpperCase());
      const status = (c.status || '').toUpperCase();
      return ts.includes(staff.name.toUpperCase()) && status !== 'COMPLETED' && status !== 'CANCEL' && status !== 'TEMPORARY CLOSED';
    }));
  };

  const filteredModels = useMemo(() => { if (!form.product) return ALL_MODELS; return ALL_MODELS.filter(m => PRODUCT_MODEL_DB[m] === form.product); }, [form.product]);

  const saveUpdate = () => {
    if (!selectedJob) return;
    const all = SuperAsiaDB.getComplaints();
    const todayStr = getPKDate();
    const newRemarkLine = `${form.remarks || form.status} (${todayStr})`;
    const updatedRemarks = selectedJob.remarks ? `${newRemarkLine} | ${selectedJob.remarks}` : newRemarkLine;
    const updated = all.map(c => (c.id === selectedJob.id ? { ...c, ...form, remarks: updatedRemarks, updateDate: todayStr } : c));
    SuperAsiaDB.saveComplaints(updated); loadJobs(); setSelectedJob(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shadow-md sticky top-0 z-40"><SuperAsiaBranding size="sm" /><button onClick={onLogout} className="text-slate-400 hover:text-rose-500 p-2"><LogOut size={22} /></button></header>
      <main className="flex-1 p-6 space-y-4 max-w-2xl mx-auto w-full">
        {jobs.length === 0 ? (<div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">Queue Clear</div>) : 
        jobs.map(job => (
          <div key={job.id} onClick={() => { setSelectedJob(job); setForm({ ...form, status: job.status, product: job.product, model: job.model, dop: job.dop, serialNumber: job.serialNumber || '' }); }} className="bg-white rounded-[2.5rem] p-8 border-2 border-slate-50 hover:border-blue-500 cursor-pointer shadow-sm transition-all">
            <h3 className="font-black text-slate-900 text-xl uppercase mb-2">{job.customerName}</h3>
            <div className="flex gap-2 mb-4"><StatusBadge status={job.status} /></div>
            <p className="text-[11px] font-bold uppercase text-slate-600 leading-snug">{job.address}</p>
          </div>
        ))}
      </main>
      {selectedJob && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center"><div><h3 className="text-2xl font-black uppercase">Technical Remarks</h3><p className="text-[10px] font-black text-blue-600 mt-1">Ref: {selectedJob.customerName}</p></div><button onClick={() => setSelectedJob(null)} className="p-3 bg-slate-50 rounded-full"><X/></button></div>
            <div className="flex-1 overflow-auto p-8 space-y-6 custom-scrollbar">
              <Select label="Product Category" value={form.product} options={ALL_PRODUCT_CATEGORIES} onChange={(v:any)=>setForm({...form, product:v, model:""})} /><Select label="Model Number" value={form.model} options={filteredModels} onChange={(v:any)=>setForm({...form, model:v})} />
              <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 font-bold h-44 resize-none outline-none" value={form.remarks} onChange={e=>setForm({...form, remarks:e.target.value})} placeholder="Visit findings..." />
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50"><button onClick={saveUpdate} className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl">Synchronize Update</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Modal: View Intelligence (Admin) ---
const ViewModal = ({ selectedAction, onClose, onUpdateCase }: { selectedAction: Complaint, onClose: () => void, onUpdateCase: (id: string, newStatus: string, newRemark: string) => void }) => {
  const [localStatus, setLocalStatus] = useState(selectedAction.status);
  const [localRemark, setLocalRemark] = useState("");
  const remarkTimeline = useMemo(() => (selectedAction.remarks || "").split('|').map(r => r.trim()).filter(Boolean), [selectedAction.remarks]);
  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-8">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0"><div><h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Eye className="text-blue-600"/> Intelligence Node</h3><p className="text-[10px] font-black text-slate-400 uppercase mt-1">Case: {selectedAction.complaintNo}</p></div><button onClick={onClose} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100"><X/></button></div>
        <div className="flex-1 overflow-auto p-10 space-y-10 custom-scrollbar">
           <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl text-white">
              <div className="flex items-center justify-between mb-6"><div><h4 className="text-[11px] font-black uppercase mb-1 text-blue-100">Operation Case Update</h4><p className="font-black text-lg">Status: {selectedAction.status}</p></div><select value={localStatus} onChange={(e) => setLocalStatus(e.target.value)} className="bg-white/10 border-2 border-white/20 rounded-xl px-5 py-2.5 text-[12px] font-black uppercase text-white outline-none">{ADMIN_STATUSES.map(s => <option key={s} value={s} className="text-slate-900">{s}</option>)}</select></div>
              <div className="flex gap-4"><textarea value={localRemark} onChange={e => setLocalRemark(e.target.value)} className="flex-1 bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-[13px] font-black text-white outline-none h-20" placeholder="Internal Admin Remarks..." /><button onClick={() => { onUpdateCase(selectedAction.id, localStatus, localRemark); setLocalRemark(""); }} className="bg-white text-blue-600 px-8 py-2.5 rounded-2xl font-black text-[11px] uppercase self-end">Sync</button></div>
           </div>
           <div className="grid grid-cols-3 gap-8"><InfoBlock label="Contact" value={selectedAction.phoneNo} icon={Phone} /><InfoBlock label="Priority" value={selectedAction.priority} icon={ShieldAlert} /><InfoBlock label="Product" value={selectedAction.product} icon={Package} /><InfoBlock label="Model" value={selectedAction.model} icon={Tag} /></div>
           <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100"><label className="text-[10px] font-black text-blue-600 uppercase mb-4 block underline">Timeline of Remarks</label><div className="space-y-4">{remarkTimeline.map((r, i) => (<div key={i} className="bg-white/70 p-5 rounded-2xl border border-blue-100/50 shadow-sm"><p className="text-[13px] font-bold text-slate-800">{r}</p></div>))}</div></div>
        </div>
      </div>
    </div>
  );
};

// --- Reports Tab Component ---
const ReportsTab = ({ complaints, staffList }: { complaints: Complaint[], staffList: Staff[] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const techActivity = useMemo(() => {
    const parts = selectedDate.split('-');
    const targetDateStr = `${parts[2]}.${parts[1]}.${parts[0].slice(-2)}`;
    const techGroups: Record<string, Complaint[]> = {};
    staffList.filter(s => s.position === 'TECHNICIAN' && s.status === 'ACTIVE').forEach(tech => {
       const jobs = complaints.filter(c => (c.technician || '').split(', ').map(n => n.trim().toUpperCase()).includes(tech.name.toUpperCase()) && (c.updateDate || c.regDate) === targetDateStr);
       if (jobs.length > 0) techGroups[tech.name] = jobs;
    });
    return Object.entries(techGroups).map(([name, list]) => ({ name, list }));
  }, [complaints, selectedDate, staffList]);

  return (
    <div className="p-8 flex-1 overflow-auto bg-[#F8FAFC] space-y-8 custom-scrollbar">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between border border-slate-100">
         <div className="flex items-center gap-6"><div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><Clock size={28} /></div><div><h2 className="text-xl font-black uppercase text-slate-900">ACTIVITY TRACE</h2><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Personnel Active Today</p></div></div>
         <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-[12px] font-black" />
      </div>
      <div className="space-y-10">
         {techActivity.map((group, idx) => (
            <div key={idx} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
               <div className="bg-[#0F172A] p-6 flex justify-between items-center px-10"><h3 className="text-[14px] font-black text-white uppercase tracking-wider">{group.name} — Nodes Active: {group.list.length}</h3></div>
               <table className="w-full text-left"><thead className="bg-[#F8FAFC] border-b border-slate-100"><tr className="text-[9px] font-black uppercase text-slate-400"><th className="px-10 py-5">JOB ID</th><th className="px-10 py-5">CUSTOMER</th><th className="px-10 py-5">PRODUCT INFO</th><th className="px-10 py-5 text-right">STATUS</th></tr></thead>
               <tbody className="divide-y divide-slate-50">{group.list.map((c, i) => (<tr key={i} className="font-black text-[12px]"><td className="px-10 py-6 text-blue-600">#{c.complaintNo}</td><td className="px-10 py-6">{c.customerName}</td><td className="px-10 py-6 text-slate-600 uppercase text-[10px]">{c.product} + {c.model}</td><td className="px-10 py-6 text-right"><StatusBadge status={c.status}/></td></tr>))}</tbody></table>
            </div>
         ))}
      </div>
    </div>
  );
};

// --- Atomic Components ---
const InfoBlock = ({ label, value, icon: Icon }: any) => (<div className="space-y-2"><label className="text-[8px] font-black text-slate-400 uppercase">{label}</label><div className="flex items-center gap-3"><Icon size={18} className="text-blue-500"/><span className="font-black text-slate-900 uppercase text-[12px] truncate">{value || '---'}</span></div></div>);
const Input = ({ label, value, onChange, type = "text", placeholder = "", onKeyDown }: any) => (<div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label><input type={type} onKeyDown={onKeyDown} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-[13px] font-black outline-none uppercase" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></div>);
const Select = ({ label, value, options, onChange }: any) => (<div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label><div className="relative"><select className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 text-[12px] font-black outline-none uppercase appearance-none cursor-pointer" value={value} onChange={e => onChange(e.target.value)}><option value="">Select Option...</option>{options.map((opt:any) => <option key={opt} value={opt}>{opt}</option>)}</select><ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20}/></div></div>);
const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => (<button onClick={onClick} className={`w-full flex items-center gap-6 px-6 py-6 text-[11px] font-black uppercase transition-all ${active ? 'text-blue-500 bg-blue-500/5 border-r-[5px] border-blue-500' : 'text-slate-500 hover:bg-white/5'}`}><Icon size={24} className={active ? 'text-blue-500' : 'text-slate-700'} /> {!collapsed && <span className="truncate">{label}</span>}</button>);

// --- Admin Dashboard ---
const AdminDash = ({ staff, onLogout }: { staff: Staff, onLogout: () => void }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [selectedAction, setSelectedAction] = useState<Complaint | null>(null);
  const [activeModal, setActiveModal] = useState<'view' | 'assign' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setComplaints(SuperAsiaDB.getComplaints().map(c => ({...c, aging: calculateAging(c.regDate)}))); setStaffList(SuperAsiaDB.getStaff()); }, []);

  const handleUpdateCase = (id: string, newStatus: string, newRemark: string) => {
    const todayStr = getPKDate();
    const updated = complaints.map(c => {
      if (c.id === id) {
        let finalRemarks = c.remarks || "";
        if (newRemark.trim()) finalRemarks = `Admin: ${newRemark.trim()} (${todayStr}) | ${finalRemarks}`;
        return { ...c, status: newStatus, remarks: finalRemarks, updateDate: todayStr };
      }
      return c;
    });
    setComplaints(updated); SuperAsiaDB.saveComplaints(updated); setActiveModal(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        if (file.name.endsWith('.json')) {
           const backup = JSON.parse(content);
           if (backup.complaints) { setComplaints(backup.complaints); SuperAsiaDB.saveComplaints(backup.complaints); alert('Data Synced Successfully.'); return; }
        }
        const data: any[] = XLSX.utils.sheet_to_json(XLSX.read(content, { type: 'binary' }).Sheets[XLSX.read(content, { type: 'binary' }).SheetNames[0]]);
        // Added missing mandatory properties from Complaint interface for Type Safety
        const imported: Complaint[] = data.map((row, idx) => {
          const productValue = String(row['PRODUCT'] || 'GENERAL');
          return {
            id: `SA-${Date.now()}-${idx}`,
            category: productValue,
            priority: 'NORMAL',
            regDate: formatExcelDate(row['REG DATE'] || row['date']),
            complaintNo: String(row['COMPLAINT NO'] || ''),
            status: 'PENDING',
            technician: 'UNASSIGNED',
            updateDate: '',
            remarks: '',
            product: productValue,
            model: String(row['MODEL'] || ''),
            problemDescription: String(row['PROBLEM DESCRIPTION'] || 'IMPORTED'),
            dop: String(row['DOP'] || ''),
            customerName: String(row['CUSTOMER NAME'] || ''),
            phoneNo: String(row['PHONE NO'] || ''),
            address: String(row['ADDRESS'] || ''),
            aging: 0,
            visitCharges: 0,
            partsCharges: 0,
            otherCharges: 0,
            history: [],
            images: []
          };
        });
        const merged = [...imported, ...complaints]; setComplaints(merged); SuperAsiaDB.saveComplaints(merged);
        alert(`Integrated ${imported.length} cases.`);
      } catch (err) { alert('Sync failed.'); }
    };
    if (file.name.endsWith('.json')) reader.readAsText(file); else reader.readAsBinaryString(file as Blob);
  };

  const columnWidths = { actions: 140, status: 150, priority: 110, tech: 160, aging: 70, regDate: 110, updateDate: 110, complaintNo: 120, customer: 220, contact: 130, product: 140, model: 140, problem: 350, visit: 100, parts: 100, other: 100, remarks: 450 };

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#0F172A] flex flex-col transition-all border-r border-slate-800`}>
        <div className="p-6 border-b border-slate-800"><SuperAsiaBranding size="sm" /></div>
        <nav className="flex-1 py-8">
           <SidebarItem icon={Database} label="Service DB" active={currentTab === 'dashboard'} onClick={() => setCurrentTab('dashboard')} collapsed={!isSidebarOpen} />
           <SidebarItem icon={FilePlus} label="Launch Case" active={currentTab === 'launch'} onClick={() => setCurrentTab('launch')} collapsed={!isSidebarOpen} />
           <SidebarItem icon={BarChart2} label="Reports Node" active={currentTab === 'reports'} onClick={() => setCurrentTab('reports')} collapsed={!isSidebarOpen} />
        </nav>
        <button onClick={onLogout} className="p-6 border-t border-slate-800 text-rose-500 font-black uppercase text-[10px] flex gap-4"><LogOut size={20}/> {isSidebarOpen && 'Logout'}</button>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="h-20 border-b border-slate-100 flex items-center justify-between px-8 shrink-0 bg-white z-40">
           <div className="flex items-center gap-4"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg"><Menu size={24}/></button><h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">Enterprise Core System</h2></div>
           <div className="flex gap-4">
              <button onClick={SuperAsiaDB.exportDatabase} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all"><Download size={16}/> Export Data</button>
              <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all"><Upload size={16}/> Master Sync</button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
           </div>
        </header>
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
           {complaints.length === 0 && currentTab === 'dashboard' && (
             <div className="m-6 p-8 bg-amber-50 border-2 border-dashed border-amber-200 rounded-[2rem] flex flex-col items-center text-center">
                <ShieldAlert size={48} className="text-amber-500 mb-4" />
                <h3 className="text-xl font-black uppercase text-amber-900">Synchronization Required</h3>
                <p className="text-[13px] font-bold text-amber-700 max-w-lg mt-2">Data is local to this device. If you entered complaints on your mobile, please click <b>EXPORT DATA</b> on your phone and upload that file here using <b>MASTER SYNC</b>.</p>
                <div className="flex gap-4 mt-6">
                   <div className="bg-white p-4 rounded-2xl border border-amber-200 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-black">1</div><p className="text-[10px] font-black uppercase">Export from phone</p></div>
                   <div className="bg-white p-4 rounded-2xl border border-amber-200 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-black">2</div><p className="text-[10px] font-black uppercase">Import on laptop</p></div>
                </div>
             </div>
           )}
           {currentTab === 'dashboard' ? (
              <div className="flex-1 overflow-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse table-fixed" style={{ width: Object.values(columnWidths).reduce((a, b) => a + b, 0) }}>
                    <thead className="sticky top-0 bg-[#0F172A] text-white z-30 text-[10px] font-black uppercase"><tr>{Object.entries(columnWidths).map(([key, width]) => (<th key={key} className="px-5 py-5 border-r border-slate-800" style={{ width }}>{key}</th>))}</tr></thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] font-bold">{complaints.map(row => (<tr key={row.id} className="hover:bg-blue-50/50 group"><td className="px-5 py-4 flex gap-1.5 bg-white group-hover:bg-blue-50 sticky left-0 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.1)] z-10"><button onClick={() => { setSelectedAction(row); setActiveModal('view'); }} className="p-2 bg-slate-900 text-white rounded-xl"><Eye size={14}/></button><button onClick={() => { setSelectedAction(row); setActiveModal('assign'); }} className="p-2 bg-blue-600 text-white rounded-xl"><UserPlus size={14}/></button><button onClick={() => printComplaintReport(row)} className="p-2 bg-emerald-600 text-white rounded-xl"><FileDown size={14}/></button></td><td className="px-5 py-4"><StatusBadge status={row.status} /></td><td className="px-5 py-4 text-rose-600 uppercase font-black">{row.priority || 'NORMAL'}</td><td className="px-5 py-4 text-blue-800 uppercase truncate">{row.technician || '---'}</td><td className="px-5 py-4 text-center"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black">{row.aging}d</span></td><td className="px-5 py-4">{row.regDate}</td><td className="px-5 py-4 italic">{row.updateDate || '---'}</td><td className="px-5 py-4 text-slate-900">{row.complaintNo}</td><td className="px-5 py-4 truncate uppercase text-slate-900">{row.customerName}</td><td className="px-5 py-4">{row.phoneNo}</td><td className="px-5 py-4 truncate uppercase">{row.product}</td><td className="px-5 py-4 truncate uppercase">{row.model}</td><td className="px-5 py-4 truncate font-black">{row.problemDescription || '---'}</td><td className="px-5 py-4 text-emerald-700">PKR {row.visitCharges || 0}</td><td className="px-5 py-4 text-rose-700">PKR {row.partsCharges || 0}</td><td className="px-5 py-4 text-slate-700">PKR {row.otherCharges || 0}</td><td className="px-5 py-4 text-blue-700 italic truncate">{row.remarks || '---'}</td></tr>))}</tbody>
                 </table>
              </div>
           ) : currentTab === 'reports' ? (<ReportsTab complaints={complaints} staffList={staffList} />) : (<LaunchCaseTab onCaseLaunched={(c) => { setComplaints(SuperAsiaDB.getComplaints().map(x => ({...x, aging: calculateAging(x.regDate)}))); setCurrentTab('dashboard'); }} />)}
        </div>
      </main>
      {selectedAction && activeModal === 'view' && <ViewModal selectedAction={selectedAction} onClose={() => setActiveModal(null)} onUpdateCase={handleUpdateCase} />}
      {selectedAction && activeModal === 'assign' && (<div className="fixed inset-0 z-[1000] bg-slate-900/95 flex items-center justify-center p-8"><div className="bg-white w-full max-md rounded-[3rem] p-12 shadow-2xl"><h3 className="text-2xl font-black uppercase mb-8">Personnel Allocation</h3><div className="space-y-4 max-h-96 overflow-auto mb-10 custom-scrollbar pr-2">{staffList.filter(s=>s.position==='TECHNICIAN' && s.status === 'ACTIVE').map(tech => (<div key={tech.id} onClick={() => { const current = (selectedAction.technician || '').split(', ').map(n=>n.trim()).filter(Boolean); const updated = current.includes(tech.name) ? current.filter(n=>n!==tech.name) : [...current, tech.name]; setSelectedAction({...selectedAction, technician: updated.join(', ')}); }} className={`p-6 rounded-[2rem] border-2 cursor-pointer flex justify-between items-center ${selectedAction.technician?.includes(tech.name) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-100'}`}><span className="font-black uppercase text-[14px]">{tech.name}</span>{selectedAction.technician?.includes(tech.name) && <CheckSquareIcon size={22}/>}</div>))}</div><button onClick={() => { const updated = complaints.map(c => c.id === selectedAction.id ? { ...c, technician: selectedAction.technician, updateDate: getPKDate() } : c); setComplaints(updated); SuperAsiaDB.saveComplaints(updated); setActiveModal(null); }} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase">Establish Connection</button></div></div>)}
    </div>
  );
};

const Portal = ({ onLogin }: { onLogin: (user: Staff) => void }) => {
  const [selectedId, setSelectedId] = useState("");
  const [password, setPassword] = useState("");
  const staff = SuperAsiaDB.getStaff();
  const handleAuth = () => {
    const user = staff.find(s => s.loginId === selectedId);
    if (user && user.status === 'ACTIVE') { if (user.position !== 'TECHNICIAN' && user.password !== password) return alert('Invalid Token'); onLogin(user); }
  };
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-8">
       <div className="max-w-md w-full bg-white p-16 rounded-[4rem] shadow-2xl space-y-12 relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-3 bg-blue-600"></div><SuperAsiaBranding /><div className="space-y-8"><div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Profile</label><select className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-6 px-8 text-[15px] font-black uppercase outline-none" value={selectedId} onChange={e => setSelectedId(e.target.value)}><option value="">Select Personnel...</option>{staff.filter(s=>s.status==='ACTIVE').map(s => <option key={s.id} value={s.loginId}>{s.name} — {s.position}</option>)}</select></div>{selectedId && staff.find(s=>s.loginId===selectedId)?.position !== 'TECHNICIAN' && (<div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Token</label><input type="password" onKeyDown={(e) => e.key === 'Enter' && handleAuth()} value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-6 px-8 text-[15px] font-black outline-none" placeholder="Token..." /></div>)}<button onClick={handleAuth} disabled={!selectedId} className="w-full bg-blue-600 text-white py-7 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-600/30 active:scale-95 transition-all">Link System</button></div></div>
    </div>
  );
};

export default function SuperAsiaApp() {
  const [view, setView] = useState<AppState>('portal');
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const login = (u: Staff) => { setCurrentUser(u); setView(u.position === 'TECHNICIAN' ? 'technician-dash' : 'admin-dash'); };
  const logout = () => { setView('portal'); setCurrentUser(null); };
  return (<div className="min-h-screen select-none bg-white font-sans antialiased">{view === 'portal' && <Portal onLogin={login} />}{view === 'admin-dash' && currentUser && <AdminDash staff={currentUser} onLogout={logout} />}{view === 'technician-dash' && currentUser && <TechnicianDash staff={currentUser} onLogout={logout} />}</div>);
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<SuperAsiaApp />);
