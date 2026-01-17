
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
  Terminal, Code2, AlertTriangle
} from 'lucide-react';
import { PRODUCT_MODEL_DB } from './product_db';
import { INITIAL_TECHNICIANS } from './technician_db';

const ALL_MODELS = Object.keys(PRODUCT_MODEL_DB).sort();
const ALL_PRODUCT_CATEGORIES = Array.from(new Set(Object.values(PRODUCT_MODEL_DB))).sort();

// --- Types ---
type AppState = 'portal' | 'admin-dash' | 'technician-dash';
type AdminTab = 'dashboard' | 'field-staff' | 'reports';

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

const DB_KEY_COMPLAINTS = 'sa_complaints_v19';
const DB_KEY_STAFF = 'sa_staff_v19';

// --- Helper Functions ---
const getPKDate = () => {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getFullYear()).slice(-2)}`;
};

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
  },
  saveStaff: (staff: Staff[]) => {
    localStorage.setItem(DB_KEY_STAFF, JSON.stringify(staff));
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

// --- View: Remarks Update Interface (Technician) ---
const TechnicianDash = ({ staff, onLogout }: { staff: Staff, onLogout: () => void }) => {
  const [jobs, setJobs] = useState<Complaint[]>([]);
  const [selectedJob, setSelectedJob] = useState<Complaint | null>(null);
  const [form, setForm] = useState({ 
    remarks: '', status: '', dop: '', serialNumber: '', product: '', model: '',
    visitCharges: 0, partsCharges: 0, otherCharges: 0, images: [] as string[]
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadJobs(); }, [staff.name]);

  const loadJobs = () => {
    const all = SuperAsiaDB.getComplaints();
    setJobs(all.filter(c => {
      const ts = (c.technician || '').split(', ').map(t => t.trim().toUpperCase());
      const status = (c.status || '').toUpperCase();
      return ts.includes(staff.name.toUpperCase()) && status !== 'COMPLETED' && status !== 'CANCEL' && status !== 'TEMPORARY CLOSED';
    }).sort((a, b) => {
      const aUrgent = (a.priority || '').toUpperCase().includes('URGENT');
      const bUrgent = (b.priority || '').toUpperCase().includes('URGENT');
      return aUrgent && !bUrgent ? -1 : (!aUrgent && bUrgent ? 1 : 0);
    }));
  };

  const handleJobSelect = (job: Complaint) => {
    setSelectedJob(job);
    setForm({ 
      remarks: '', 
      status: job.status || 'PENDING', 
      dop: job.dop || '', 
      serialNumber: job.serialNumber || '', 
      product: job.product || '', 
      model: job.model || '',
      visitCharges: job.visitCharges || 0, 
      partsCharges: job.partsCharges || 0, 
      otherCharges: job.otherCharges || 0,
      images: job.images || []
    });
  };

  const filteredModels = useMemo(() => {
    if (!form.product) return ALL_MODELS;
    return ALL_MODELS.filter(m => PRODUCT_MODEL_DB[m] === form.product);
  }, [form.product]);

  const handleModelSelect = (m: string) => { 
    let p = PRODUCT_MODEL_DB[m] || form.product; 
    setForm(prev => ({ ...prev, model: m, product: p })); 
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const b64 = evt.target?.result as string;
        setForm(prev => ({ ...prev, images: [...prev.images, b64] }));
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const saveUpdate = () => {
    if (!selectedJob) return;
    const all = SuperAsiaDB.getComplaints();
    const todayStr = getPKDate();
    
    const displayStatus = form.status === 'TEMPORARY CLOSED' ? 'TEMPORARY CLOSED' : form.status;
    const newRemarkLine = `${form.remarks || displayStatus} (${todayStr})`;
    const updatedRemarks = selectedJob.remarks ? `${newRemarkLine} | ${selectedJob.remarks}` : newRemarkLine;

    const updated = all.map(c => {
      if (c.id === selectedJob.id) {
        return { 
          ...c, ...form, 
          remarks: updatedRemarks, 
          updateDate: todayStr,
          history: [...(c.history || []), { 
            date: new Date().toLocaleString('en-PK'), 
            status: form.status, 
            remark: `Technician Update: ${form.remarks || 'Status Synced'}`, 
            user: staff.name,
            images: form.images
          }]
        };
      }
      return c;
    });
    SuperAsiaDB.saveComplaints(updated); loadJobs(); setSelectedJob(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shadow-md sticky top-0 z-40">
        <SuperAsiaBranding size="sm" />
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block"><p className="text-[10px] font-black text-blue-600 uppercase">Field Resource: {staff.name}</p></div>
          <button onClick={onLogout} className="text-slate-400 hover:text-rose-500 p-2"><LogOut size={22} /></button>
        </div>
      </header>
      <main className="flex-1 p-6 space-y-4 max-w-2xl mx-auto w-full">
        {jobs.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100"><CheckCircle2 size={56} className="mx-auto mb-4 text-emerald-500 opacity-20" /><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Queue Clear</p></div>
        ) : jobs.map(job => (
          <div key={job.id} onClick={() => handleJobSelect(job)} className="bg-white rounded-[2.5rem] p-8 border-2 border-slate-50 hover:border-blue-500 cursor-pointer shadow-sm transition-all relative group">
            <div className="flex justify-between items-start mb-2"><h3 className="font-black text-slate-900 text-xl uppercase group-hover:text-blue-600 leading-none">{job.customerName}</h3><span className="text-[10px] font-black text-blue-500 tracking-tighter">#{job.complaintNo}</span></div>
            <div className="flex gap-2 mb-4"><StatusBadge status={job.status} /><span className="text-[10px] font-bold text-rose-500 uppercase">{job.priority}</span></div>
            <div className="pt-5 border-t border-slate-100 flex items-start gap-4"><MapPin size={18} className="text-blue-500 shrink-0 mt-0.5"/><p className="text-[11px] font-bold uppercase text-slate-600 leading-snug">{job.address}</p></div>
          </div>
        ))}
      </main>
      
      {selectedJob && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white"><div><h3 className="text-2xl font-black uppercase tracking-tighter">REMARKS UPDATE INTERFACE</h3><p className="text-[10px] font-black text-blue-600 uppercase mt-1">Ref: {selectedJob.customerName} | Case: {selectedJob.complaintNo}</p></div><button onClick={() => setSelectedJob(null)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100"><X/></button></div>
            <div className="flex-1 overflow-auto p-8 space-y-8 custom-scrollbar">
              <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Establish Status</label><div className="grid grid-cols-2 gap-4"><button onClick={() => setForm({...form, status: 'PENDING'})} className={`py-6 rounded-3xl font-black uppercase text-[13px] border-2 transition-all ${form.status !== 'TEMPORARY CLOSED' ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Pending Action</button><button onClick={() => setForm({...form, status: 'TEMPORARY CLOSED'})} className={`py-6 rounded-3xl font-black uppercase text-[13px] border-2 transition-all ${form.status === 'TEMPORARY CLOSED' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Temporary Closed</button></div></div>
              <div className="grid grid-cols-2 gap-4"><Select label="Product Category" value={form.product} options={ALL_PRODUCT_CATEGORIES} onChange={(v:any)=>setForm({...form, product:v})} /><Select label="Model Number" value={form.model} options={filteredModels} onChange={handleModelSelect} /></div>
              <div className="grid grid-cols-2 gap-4"><Input label="Serial Number" value={form.serialNumber} onChange={(v:any)=>setForm({...form, serialNumber:v})} placeholder="S/N..." /><Input label="D.O.P" value={form.dop} onChange={(v:any)=>setForm({...form, dop:v})} placeholder="DD.MM.YY" /></div>
              <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Economics (PKR)</label><div className="grid grid-cols-3 gap-3"><Input label="Visit" type="number" value={form.visitCharges} onChange={(v:any)=>setForm({...form, visitCharges:Number(v)})} /><Input label="Parts" type="number" value={form.partsCharges} onChange={(v:any)=>setForm({...form, partsCharges:Number(v)})} /><Input label="Other" type="number" value={form.otherCharges} onChange={(v:any)=>setForm({...form, otherCharges:Number(v)})} /></div></div>
              <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between ml-1">Evidence Capture <button onClick={() => fileRef.current?.click()} className="text-blue-600 flex items-center gap-1 font-black"><Camera size={14}/> Capture</button></label><input type="file" ref={fileRef} className="hidden" accept="image/*" multiple onChange={handleFile} /><div className="flex flex-wrap gap-4">{form.images.map((img, idx) => (<div key={idx} className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-100 relative shadow-sm group"><img src={img} className="w-full h-full object-cover" /><button onClick={() => setForm(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1"><Trash2 size={12}/></button></div>))}<button onClick={() => fileRef.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 bg-slate-50 hover:border-blue-500 hover:text-blue-500 transition-all"><PlusCircle size={28}/><span className="text-[9px] font-black mt-1 uppercase">Upload</span></button></div></div>
              <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technical Remarks</label><textarea className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-[2rem] p-8 font-bold h-44 resize-none outline-none transition-all shadow-sm" value={form.remarks} onChange={e=>setForm({...form, remarks:e.target.value})} placeholder="Visit findings..." /></div>
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50 shrink-0"><button onClick={saveUpdate} disabled={!form.status} className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-[15px] tracking-widest shadow-2xl shadow-blue-600/30 hover:bg-blue-700 flex items-center justify-center gap-3"><Save size={20}/> Synchronize Update</button></div>
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
  
  const remarkTimeline = useMemo(() => {
    if (!selectedAction.remarks) return [];
    return selectedAction.remarks.split('|').map(r => r.trim()).filter(Boolean);
  }, [selectedAction.remarks]);

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-8">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div><h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Eye className="text-blue-600"/> Intelligence Node</h3><p className="text-[10px] font-black text-slate-400 uppercase mt-1">Ref: {selectedAction.customerName} | Case: {selectedAction.complaintNo}</p></div>
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100"><X/></button>
        </div>
        <div className="flex-1 overflow-auto p-10 space-y-10 custom-scrollbar">
           <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl text-white">
              <div className="flex items-center justify-between mb-6">
                <div><h4 className="text-[11px] font-black uppercase tracking-widest mb-1 text-blue-100">Operation Case Update</h4><p className="font-black text-lg uppercase">Status: {selectedAction.status}</p></div>
                <select value={localStatus} onChange={(e) => setLocalStatus(e.target.value)} className="bg-white/10 border-2 border-white/20 rounded-xl px-5 py-2.5 text-[12px] font-black uppercase outline-none text-white cursor-pointer">{ADMIN_STATUSES.map(s => <option key={s} value={s} className="text-slate-900">{s}</option>)}</select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-blue-100 uppercase tracking-widest block ml-1">Internal Admin Remarks (New Entry)</label>
                <div className="flex gap-4">
                  <textarea value={localRemark} onChange={e => setLocalRemark(e.target.value)} className="flex-1 bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-[13px] font-black text-white placeholder-white/40 outline-none h-20 resize-none" placeholder="Add administrative note..." />
                  <button onClick={() => { onUpdateCase(selectedAction.id, localStatus, localRemark); setLocalRemark(""); }} className="bg-white text-blue-600 px-8 py-2.5 rounded-2xl font-black text-[11px] uppercase shadow-lg active:scale-95 transition-transform self-end">Commit Sync</button>
                </div>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-8">
              <InfoBlock label="Contact" value={selectedAction.phoneNo} icon={Phone} />
              <InfoBlock label="Priority" value={selectedAction.priority} icon={ShieldAlert} />
              <InfoBlock label="Resource" value={selectedAction.technician} icon={PenTool} />
              <InfoBlock label="Product" value={selectedAction.product} icon={Package} />
              <InfoBlock label="Model" value={selectedAction.model} icon={Tag} />
              <InfoBlock label="Serial" value={selectedAction.serialNumber} icon={Hash} />
           </div>

           <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Problem Description (Excel)</label>
              <p className="text-[13px] font-bold text-slate-900 leading-relaxed italic">"{selectedAction.problemDescription || '---'}"</p>
           </div>
           
           <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 block underline">Timeline of Remarks (Latest First)</label>
              <div className="space-y-4">
                 {remarkTimeline.length ? remarkTimeline.map((r, i) => (
                    <div key={i} className="bg-white/70 p-5 rounded-2xl border border-blue-100/50 shadow-sm relative">
                       <p className="text-[13px] font-bold text-slate-800 leading-relaxed">{r}</p>
                       <div className="absolute top-3 right-5 text-[9px] font-black text-blue-500 uppercase opacity-40">Entry #{remarkTimeline.length - i}</div>
                    </div>
                 )) : <p className="text-[13px] font-bold text-slate-400 italic">No activity entries logged.</p>}
              </div>
           </div>

           {selectedAction.images?.length ? (
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Visual Evidence Frames</label>
                <div className="flex flex-wrap gap-4">{selectedAction.images.map((img, i) => <img key={i} src={img} className="w-48 h-48 rounded-[2rem] object-cover shadow-xl border-4 border-white" />)}</div>
             </div>
           ) : null}
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
    
    // Group all complaints by technician for the selected date
    const techGroups: Record<string, Complaint[]> = {};
    
    // Only target TECHNICIANS
    staffList.filter(s => s.position === 'TECHNICIAN' && s.status === 'ACTIVE').forEach(tech => {
       const jobsForTech = complaints.filter(c => {
         const assigned = (c.technician || '').split(', ').map(n => n.trim().toUpperCase());
         const normalizedDate = c.updateDate || c.regDate;
         return assigned.includes(tech.name.toUpperCase()) && normalizedDate === targetDateStr;
       });
       if (jobsForTech.length > 0) {
         techGroups[tech.name] = jobsForTech;
       }
    });

    return Object.entries(techGroups).map(([name, list]) => ({ name, list }));
  }, [complaints, selectedDate, staffList]);

  const activeCount = techActivity.length;

  return (
    <div className="p-8 flex-1 overflow-auto bg-[#F8FAFC] space-y-8 custom-scrollbar">
      {/* Header Panel matching screenshot style */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between border border-slate-100">
         <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
               <Clock size={28} />
            </div>
            <div>
               <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">ACTIVITY TRACE</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  ACTIVE FIELD WORKING • {new Date(selectedDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
               </p>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-[12px] font-black outline-none focus:bg-white" />
            <div className="bg-slate-50 border border-slate-100 px-8 py-4 rounded-[2rem] text-center min-w-[140px]">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ACTIVE PERSONNEL TODAY</p>
               <p className="text-2xl font-black text-blue-600">{activeCount}</p>
            </div>
         </div>
      </div>

      {/* Technician Nodes matching screenshot style */}
      <div className="space-y-10">
         {techActivity.map((group, idx) => (
            <div key={idx} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
               <div className="bg-[#0F172A] p-6 flex justify-between items-center px-10">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <User size={20} />
                     </div>
                     <div>
                        <h3 className="text-[14px] font-black text-white uppercase tracking-wider">{group.name}</h3>
                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">TECHNICIAN NODES ACTIVE</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">HANDLE COUNT</p>
                     <p className="text-xl font-black text-white">{group.list.length}</p>
                  </div>
               </div>
               
               <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC] border-b border-slate-100">
                     <tr className="text-[9px] font-black uppercase text-slate-400">
                        <th className="px-10 py-5">JOB ID</th>
                        <th className="px-10 py-5">CUSTOMER PERSONA</th>
                        <th className="px-10 py-5">ASSET NODE</th>
                        <th className="px-10 py-5">ACTION TAKEN</th>
                        <th className="px-10 py-5">TIMESTAMP</th>
                        <th className="px-10 py-5 text-right">STATUS</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {group.list.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-all font-black text-[12px]">
                           <td className="px-10 py-6 text-blue-600">#{c.complaintNo}</td>
                           <td className="px-10 py-6">
                              <div className="text-slate-900">{c.customerName}</div>
                              <div className="text-[9px] text-slate-400 uppercase mt-0.5">{c.address.slice(0, 35)}...</div>
                           </td>
                           <td className="px-10 py-6 text-slate-600 uppercase text-[10px]">
                              {c.product} + {c.model}
                           </td>
                           <td className="px-10 py-6">
                              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] uppercase font-black">
                                 {c.remarks?.split('|')[0].replace(/\(.*?\)/g, '').trim().toUpperCase() || 'WORK DONE'}
                              </span>
                           </td>
                           <td className="px-10 py-6 text-slate-400 text-[10px]">{c.updateDate}</td>
                           <td className="px-10 py-6 text-right">
                              <button className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter border ${
                                 c.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-600 text-white border-blue-700 shadow-sm'
                              }`}>
                                 {c.status === 'COMPLETED' ? 'COMPLETED' : 'VERIFIED'}
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         ))}
         
         {techActivity.length === 0 && (
           <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100">
              <Terminal size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">NO ACTIVITY TRACES FOUND FOR SELECTED DATE</p>
           </div>
         )}
      </div>
    </div>
  );
};

// --- Atomic Components ---
const InfoBlock = ({ label, value, icon: Icon }: any) => (
  <div className="space-y-2"><label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</label><div className="flex items-center gap-3"><Icon size={18} className="text-blue-500 shrink-0" /><span className="font-black text-slate-900 uppercase text-[12px] truncate">{value || '---'}</span></div></div>
);

const Input = ({ label, value, onChange, type = "text", placeholder = "", onKeyDown }: any) => (
  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label><input type={type} onKeyDown={onKeyDown} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 text-[13px] font-black transition-all outline-none uppercase shadow-sm" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></div>
);

const Select = ({ label, value, options, onChange }: any) => (
  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label><div className="relative"><select className="w-full bg-white border-2 border-slate-100 focus:border-blue-600 rounded-2xl py-4 px-6 text-[12px] font-black outline-none uppercase shadow-sm appearance-none cursor-pointer" value={value} onChange={e => onChange(e.target.value)}><option value="">Select Option...</option>{options.map((opt:any) => <option key={opt} value={opt}>{opt}</option>)}</select><ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20}/></div></div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-6 px-6 py-6 text-[11px] font-black uppercase tracking-[0.1em] transition-all ${active ? 'text-blue-500 bg-blue-500/5 border-r-[5px] border-blue-500' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Icon size={24} className={active ? 'text-blue-500' : 'text-slate-700'} /> {!collapsed && <span className="truncate">{label}</span>}</button>
);

// --- Admin Dashboard ---
const AdminDash = ({ staff, onLogout }: { staff: Staff, onLogout: () => void }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [selectedAction, setSelectedAction] = useState<Complaint | null>(null);
  const [activeModal, setActiveModal] = useState<'view' | 'assign' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columnWidths = { actions: 140, status: 150, priority: 110, tech: 160, aging: 70, regDate: 110, updateDate: 110, complaintNo: 120, customer: 220, contact: 130, product: 140, model: 140, problem: 350, visit: 100, parts: 100, other: 100, remarks: 450 };

  useEffect(() => { 
    setComplaints(SuperAsiaDB.getComplaints().map(c => ({...c, aging: calculateAging(c.regDate)})));
    setStaffList(SuperAsiaDB.getStaff());
  }, []);

  const handleUpdateCase = (id: string, newStatus: string, newRemark: string) => {
    const todayStr = getPKDate();
    const updated = complaints.map(c => {
      if (c.id === id) {
        let finalRemarks = c.remarks || "";
        if (newRemark.trim()) {
           const formattedRemark = `Admin: ${newRemark.trim()} (${todayStr})`;
           finalRemarks = finalRemarks ? `${formattedRemark} | ${finalRemarks}` : formattedRemark;
        }
        return { ...c, status: newStatus, remarks: finalRemarks, updateDate: todayStr };
      }
      return c;
    });
    setComplaints(updated); SuperAsiaDB.saveComplaints(updated); setActiveModal(null);
    alert('Case intelligence updated.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data: any[] = XLSX.utils.sheet_to_json(XLSX.read(evt.target?.result as any, { type: 'binary' }).Sheets[XLSX.read(evt.target?.result as any, { type: 'binary' }).SheetNames[0]]);
        const currentStaff = SuperAsiaDB.getStaff();
        const imported: Complaint[] = data.map((row, idx) => {
          const modelRaw = String(row['MODEL'] || row['model'] || '').trim();
          let product = PRODUCT_MODEL_DB[modelRaw.toUpperCase()];
          if (modelRaw.toUpperCase().includes('SPIN')) product = "SPINNER";
          if (!product) product = row['CATEGORY'] || row['category'] || row['PRODUCT'] || row['product'] || "GENERAL";
          const techNameFromExcel = String(row['TECH NAME'] || row['tech name'] || row['TECHNICIAN'] || '').trim().toUpperCase();
          const match = currentStaff.find(s => s.name.toUpperCase().includes(techNameFromExcel) || techNameFromExcel.includes(s.name.toUpperCase()) || s.importKey.toUpperCase() === techNameFromExcel);
          return {
            id: String(row['WORK ORDER'] || `SA-${Date.now()}-${idx}`),
            category: String(row['CATEGORY'] || row['category'] || product || 'GENERAL'),
            priority: String(row['PRIORITY'] || row['priority'] || 'NORMAL').toUpperCase(),
            regDate: formatExcelDate(row['REG DATE'] || row['date']),
            complaintNo: String(row['COMPLAINT NO'] || row['complaint_no'] || ''),
            status: String(row['STATUS'] || row['status'] || 'PENDING'),
            technician: match ? match.name : techNameFromExcel,
            updateDate: formatExcelDate(row['UPDATE DATE'] || row['update_date'] || ''),
            remarks: String(row['REMARKS'] || row['remarks'] || ''),
            product, model: modelRaw,
            problemDescription: String(row['PROBLEM'] || row['problem'] || row['DESCRIPTION'] || row['description'] || row['PROBLEM DESCRIPTION'] || ''),
            dop: formatExcelDate(row['DOP'] || row['dop'] || ''),
            customerName: String(row['CUSTOMER NAME'] || row['NAME'] || ''),
            phoneNo: String(row['PHONE NO'] || row['CONTACT'] || ''),
            address: String(row['ADDRESS'] || row['SITE ADDRESS'] || ''),
            aging: 0, history: [], images: [], visitCharges: 0, partsCharges: 0, otherCharges: 0
          };
        }).map(c => ({...c, aging: calculateAging(c.regDate)}));
        const merged = [...complaints, ...imported]; setComplaints(merged); SuperAsiaDB.saveComplaints(merged);
        alert(`Integrated ${imported.length} cases.`); if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) { alert('Sync failed.'); }
    };
    reader.readAsBinaryString(file as Blob);
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#0F172A] flex flex-col transition-all duration-300 border-r border-slate-800`}>
        <div className="p-6 border-b border-slate-800"><SuperAsiaBranding size="sm" /></div>
        <nav className="flex-1 py-8">
           <SidebarItem icon={Database} label="Service DB" active={currentTab === 'dashboard'} onClick={() => setCurrentTab('dashboard')} collapsed={!isSidebarOpen} />
           <SidebarItem icon={BarChart2} label="Reports Node" active={currentTab === 'reports'} onClick={() => setCurrentTab('reports')} collapsed={!isSidebarOpen} />
        </nav>
        <button onClick={onLogout} className="p-6 border-t border-slate-800 text-rose-500 font-black uppercase text-[10px] flex gap-4"><LogOut size={20}/> {isSidebarOpen && 'Logout'}</button>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="h-20 border-b border-slate-100 flex items-center justify-between px-8 shrink-0 bg-white z-40"><div className="flex items-center gap-4"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg"><Menu size={24}/></button><h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">Enterprise Core System</h2></div>{currentTab === 'dashboard' && (<div className="flex gap-4"><button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"><Upload size={16}/> Master Sync</button><input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" /></div>)}</header>
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
           {currentTab === 'dashboard' ? (<div className="flex-1 overflow-auto custom-scrollbar"><table className="w-full text-left border-collapse table-fixed" style={{ width: Object.values(columnWidths).reduce((a, b) => a + b, 0) }}><thead className="sticky top-0 bg-[#0F172A] text-white z-30 text-[10px] font-black uppercase"><tr>{Object.entries(columnWidths).map(([key, width]) => (<th key={key} className="px-5 py-5 border-r border-slate-800" style={{ width }}>{key}</th>))}</tr></thead><tbody className="divide-y divide-slate-100 text-[11px] font-bold">{complaints.map(row => (<tr key={row.id} className="hover:bg-blue-50/50 transition-all group"><td className="px-5 py-4 flex gap-1.5 bg-white group-hover:bg-blue-50 sticky left-0 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.1)] z-10"><button onClick={() => { setSelectedAction(row); setActiveModal('view'); }} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all" title="View Detail"><Eye size={14}/></button><button onClick={() => { setSelectedAction(row); setActiveModal('assign'); }} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all" title="Assign"><UserPlus size={14}/></button><button onClick={() => printComplaintReport(row)} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all" title="PDF"><FileDown size={14}/></button></td><td className="px-5 py-4"><StatusBadge status={row.status} /></td><td className="px-5 py-4 text-rose-600 uppercase font-black">{row.priority || 'NORMAL'}</td><td className="px-5 py-4 text-blue-800 uppercase truncate">{row.technician || '---'}</td><td className="px-5 py-4 text-center"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black">{row.aging}d</span></td><td className="px-5 py-4">{row.regDate}</td><td className="px-5 py-4 text-rose-500 font-black italic">{row.updateDate || '---'}</td><td className="px-5 py-4 text-slate-900 tracking-tighter">{row.complaintNo}</td><td className="px-5 py-4 truncate uppercase text-slate-900">{row.customerName}</td><td className="px-5 py-4">{row.phoneNo}</td><td className="px-5 py-4 text-slate-500 truncate uppercase">{row.product}</td><td className="px-5 py-4 text-slate-500 truncate uppercase">{row.model}</td><td className="px-5 py-4 text-slate-900 truncate font-black" title={row.problemDescription}>{row.problemDescription || '---'}</td><td className="px-5 py-4 text-emerald-700">PKR {row.visitCharges || 0}</td><td className="px-5 py-4 text-rose-700">PKR {row.partsCharges || 0}</td><td className="px-5 py-4 text-slate-700">PKR {row.otherCharges || 0}</td><td className="px-5 py-4 text-blue-700 italic truncate" title={row.remarks}>{row.remarks || '---'}</td></tr>))}</tbody></table></div>) : (<ReportsTab complaints={complaints} staffList={staffList} />)}
        </div>
      </main>
      {selectedAction && activeModal === 'view' && <ViewModal selectedAction={selectedAction} onClose={() => setActiveModal(null)} onUpdateCase={handleUpdateCase} />}
      {selectedAction && activeModal === 'assign' && (<div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-8"><div className="bg-white w-full max-md rounded-[3rem] p-12 shadow-2xl"><h3 className="text-2xl font-black uppercase mb-8 tracking-tighter text-slate-900">Personnel Allocation</h3><div className="space-y-4 max-h-96 overflow-auto mb-10 custom-scrollbar pr-2">{staffList.filter(s=>s.position==='TECHNICIAN' && s.status === 'ACTIVE').map(tech => (<div key={tech.id} onClick={() => { const current = (selectedAction.technician || '').split(', ').map(n=>n.trim()).filter(Boolean); const updated = current.includes(tech.name) ? current.filter(n=>n!==tech.name) : [...current, tech.name]; setSelectedAction({...selectedAction, technician: updated.join(', ')}); }} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex justify-between items-center ${selectedAction.technician?.includes(tech.name) ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}><span className="font-black uppercase text-[14px]">{tech.name}</span>{selectedAction.technician?.includes(tech.name) && <CheckSquareIcon size={22}/>}</div>))}</div><button onClick={() => { const updated = complaints.map(c => c.id === selectedAction.id ? { ...c, technician: selectedAction.technician, updateDate: getPKDate() } : c); setComplaints(updated); SuperAsiaDB.saveComplaints(updated); setActiveModal(null); }} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase shadow-2xl active:scale-95 transition-all">Establish Connection</button></div></div>)}
    </div>
  );
};

const Portal = ({ onLogin }: { onLogin: (user: Staff) => void }) => {
  const [selectedId, setSelectedId] = useState("");
  const [password, setPassword] = useState("");
  const staff = SuperAsiaDB.getStaff();

  const handleAuth = () => {
    const user = staff.find(s => s.loginId === selectedId);
    if (user && user.status === 'ACTIVE') {
      if (user.position !== 'TECHNICIAN' && user.password !== password) return alert('Invalid Key Code');
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-8">
       <div className="max-w-md w-full bg-white p-16 rounded-[4rem] shadow-2xl space-y-12 relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-3 bg-blue-600"></div><SuperAsiaBranding /><div className="space-y-8"><div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Profile</label><select className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-6 px-8 text-[15px] font-black uppercase outline-none focus:border-blue-600 appearance-none cursor-pointer" value={selectedId} onChange={e => setSelectedId(e.target.value)}><option value="">Select Personnel...</option>{staff.filter(s=>s.status==='ACTIVE').map(s => <option key={s.id} value={s.loginId}>{s.name} — {s.position}</option>)}</select></div>{selectedId && staff.find(s=>s.loginId===selectedId)?.position !== 'TECHNICIAN' && (<div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Token</label><input type="password" onKeyDown={(e) => e.key === 'Enter' && handleAuth()} value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-6 px-8 text-[15px] font-black outline-none focus:border-blue-600" placeholder="Enter Token..." /></div>)}<button onClick={handleAuth} disabled={!selectedId} className="w-full bg-blue-600 text-white py-7 rounded-[2rem] font-black uppercase text-[15px] tracking-widest shadow-2xl shadow-blue-600/30 active:scale-95 transition-all">Link System</button></div></div>
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
