import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  where // এই লাইনটি যোগ করো
} from "firebase/firestore";
import { UploadCloud } from 'lucide-react';
import { db } from "../firebase"; // আপনার লোকাল কনফিগারেশন ফাইল

// ইমেজ ও কম্পোনেন্ট ইমপোর্ট
import logoImg from './components/figma/G-care final 2-01.png';
import AppointmentSection from "./components/AppointmentSection";
import TeamAppointmentDesk from "./components/TeamAppointmentDesk";
import {
  Heart, Users, Phone, FileText, CheckCircle, LogOut,
  Bell, Calendar, Clipboard, Activity, Search, Plus,
  Eye, Clock, AlertCircle, Stethoscope, Shield,
  ArrowRight, Check, User, PhoneCall, ClipboardList,
  UserCheck, ChevronRight, Pill, BarChart3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface PatientRecord {
  id: string;
  name: string;
  phone: string;
  age: string;
  priority: "Normal" | "Urgent" | "Critical";
  vitals: {
    bp: string;
    pulse: string;
    sugar: string;
  };
  lastFollowup: string;
  nextFollowup: string;
  teamNote: string;
  medications: string[];
}

type Page = "landing" | "login" | "doctor" | "team";
type DoctorView = "patients" | "team" | "appointments" | "patient-detail";
type TeamView = "call-list" | "data-entry" | "patient-detail" | "appointments";
// ─── Mock Data ────────────────────────────────────────────────

const CREDS: Record<string, { password: string; role: "doctor" | "team"; name: string }> = {
  // আগের ইউজাররা...
  "admin@gmail.com": { 
      password: "admin123", 
      role: "doctor", 
      name: "Shahin Wadud" 
  },
  "team@meditrack.com": { password: "team123", role: "team", name: "Sakib Hasan" },
};

const DOCTORS = [
  { 
    id: "D001", 
    name: "Dr. Shahin Wadud", 
    specialty: "Cardiology",
    chambers: ["Japan Bangladesh Hospital", "Millenium hospital"] // এই ফিল্ডটি থাকা জরুরি
  },
];

const INIT_PATIENTS = [
  {
    id: "P001", name: "Rahim Uddin", doctorId: "D001", status: "Stable",
    lastFollowup: "2026-07-07", priority: "Hypertension + Diabetes",
    phone: "01711-234567", age: 58, address: "Mirpur-10, Dhaka",
    nextFollowup: "2026-07-21",
    medications: ["Amlodipine 5mg", "Metformin 500mg"],
    teamNote: "Patient reported improvement in BP readings. Following prescribed diet plan correctly.",
  },
  {
    id: "P002", name: "Fatema Begum", doctorId: "D001", status: "Critical",
    lastFollowup: "2026-07-05", priority: "Congestive Heart Failure",
    phone: "01822-345678", age: 65, address: "Uttara Sector-7, Dhaka",
    nextFollowup: "2026-07-10",
    medications: ["Furosemide 40mg", "Atorvastatin 20mg", "Carvedilol 6.25mg"],
    teamNote: "Breathing difficulty reported during call. Advised immediate in-person check-up. Urgent review needed.",
  },
  {
    id: "P003", name: "Karim Molla", doctorId: "D001", status: "Follow-up Due",
    lastFollowup: "2026-06-30", priority: "Cardiac Arrhythmia",
    phone: "01933-456789", age: 45, address: "Banani, Dhaka",
    nextFollowup: "2026-07-09",
    medications: ["Bisoprolol 5mg", "Aspirin 75mg"],
    teamNote: "Patient missed last 2 scheduled calls. Rescheduled for today. Follow-up overdue.",
  },
  {
    id: "P004", name: "Rokeya Khatun", doctorId: "D002", status: "Stable",
    lastFollowup: "2026-07-08", priority: "Type-2 Diabetes",
    phone: "01644-567890", age: 52, address: "Dhanmondi, Dhaka",
    nextFollowup: "2026-07-22",
    medications: ["Insulin Glargine 20U", "Metformin 1000mg"],
    teamNote: "HbA1c improved to 7.2. Patient compliant with medication. Continue current regimen.",
  },
];

const INIT_TEAM = [
  { id: "T001", name: "Sakib Hasan", role: "Senior Data Entry", phone: "01755-111222", email: "sakib@meditrack.com", joinDate: "2025-03-15", callsToday: 8 },
  { id: "T002", name: "Riya Akter", role: "Call Specialist", phone: "01866-222333", email: "riya@meditrack.com", joinDate: "2025-05-20", callsToday: 6 },
  { id: "T003", name: "Mehedi Hasan", role: "Data Entry", phone: "01977-333444", email: "mehedi@meditrack.com", joinDate: "2026-01-10", callsToday: 5 },
];

const INIT_CALLS = [
  { id: "CL001", patientId: "P001", status: "pending", priority: "High", reason: "Medication compliance check — weekly routine", callDate: "2026-07-09" },
  { id: "CL002", patientId: "P002", status: "pending", priority: "Urgent", reason: "Post-discharge followup — breathing and weight check", callDate: "2026-07-09" },
  { id: "CL003", patientId: "P003", status: "pending", priority: "Normal", reason: "Scheduled monthly followup — overdue", callDate: "2026-07-09" },
];

const STATUS_CHIP: Record<string, string> = {
  "Stable": "bg-emerald-100 text-emerald-700",
  "Critical": "bg-red-100 text-red-700",
  "Follow-up Due": "bg-amber-100 text-amber-700",
  "New Patient": "bg-blue-100 text-blue-700",
};

const PRIORITY_CHIP: Record<string, string> = {
  "Urgent": "bg-red-50 text-red-600 border border-red-200",
  "High": "bg-orange-50 text-orange-600 border border-orange-200",
  "Normal": "bg-blue-50 text-blue-600 border border-blue-200",
};

// ─── Small shared component ───────────────────────────────────

function InfoBlock({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-slate-700 font-semibold text-sm leading-snug">{value || "—"}</p>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────

export default function App() {
  // --- ১. সব useState হুকস (শুরুতে) ---
  const [entrySuccess, setEntrySuccess] = useState(false);
const [page, setPage] = useState<Page>("landing");
const [appointments, setAppointments] = useState<any[]>([]); // একবারই থাকবে

const [activeChamber, setActiveChamber] = useState("All");
const [onboardedDoctors, setOnboardedDoctors] = useState([]);
const [currentDoctor, setCurrentDoctor] = useState(null);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loginError, setLoginError] = useState("");
const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
const [doctorView, setDoctorView] = useState<DoctorView>("patients");
const [teamView, setTeamView] = useState<TeamView>("call-list");
const [patients, setPatients] = useState(INIT_PATIENTS);
const [callList, setCallList] = useState(INIT_CALLS);
const [callNotes, setCallNotes] = useState<Record<string, string>>({});
const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState("");
const [loading, setLoading] = useState(true);


// ২. ডাটা এন্ট্রির জন্য স্টেট (একবারই)
const [dataEntry, setDataEntry] = useState({
  patientFullName: "",
  age: "",
  phone: "",
  address: "",
  assignDoctor: "",
  assignChamber: "",
  diagnosis: "", // এখানে diagnosis সেট করা হলো
  chiefComplaint: "",
  medications: "",
  nextFollowUpdate: "",
  additionalNotes: "",
  teamNote: "", 
  priority: "Normal",
  vitals: { bp: "", pulse: "", sugar: "" },
  documentUrl: ""
});

useEffect(() => {
  if (!currentUser?.name) {
    setLoading(false);
    setAppointments([]);
    setPatients([]);
    return;
  }

  // ১. কুয়েরি ডিফাইন করা
  const qAppointments = query(
    collection(db, "zee_care_appointments"), 
    where("doctor", "==", "Dr. " + currentUser.name)
  );

  const qPatients = query(collection(db, "patients")); 

  // ২. সাবস্ক্রিপশন সেট করা (এখানে unsubAppts ডিফাইন করা হয়েছে)
  const unsubAppts = onSnapshot(qAppointments, (snap) => {
    setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  const unsubPatients = onSnapshot(qPatients, (snap) => {
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Found patients:", data);
    setPatients(data);
    setLoading(false);
  });

  // ৩. ক্লিনআপ ফাংশন (এখন unsubAppts এখানে পাওয়া যাবে)
  return () => {
    unsubAppts();
    unsubPatients();
  };
}, [currentUser?.name]);
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center font-bold text-slate-500">
        Loading your G-Care Dashboard...
      </div>
    );
  }

  // --- ৪. ফাংশনস এবং লজিক ---
  const login = () => {
    const cred = CREDS[email];
    if (cred && cred.password === password) {
      setCurrentUser({ name: cred.name, role: cred.role });
      setLoginError("");
      setPage(cred.role);
    } else {
      setLoginError("Invalid credentials. Please contact your admin for access.");
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setEmail("");
    setPassword("");
    setPage("landing");
  };

  const completeCall = (callId: string) => {
    if (!callNotes[callId]?.trim()) return;
    setCallList(prev => prev.map(c => c.id === callId ? { ...c, status: "completed" } : c));
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    console.log("File selected:", file);
    // যদি ফাইলটি স্টেটে রাখতে চান:
    // setDataEntry(prev => ({ ...prev, documentUrl: "URL_HERE" }));
  }
};

const submitDataEntry = async () => {
  // ১. ভ্যালিডেশন চেক (ফোন নম্বরসহ)
  if (!dataEntry.patientFullName || !dataEntry.assignDoctor || !dataEntry.phone) {
    alert("Please provide Patient Name, Doctor, and Phone Number!");
    return;
  }
  
  try {
    setLoading(true);

    // ২. Firebase-এ ডাটা পাঠানো (নতুন ফিল্ড অনুযায়ী আপডেট করা)
    const newPatient: Omit<PatientRecord, 'id'> = {
      name: dataEntry.patientFullName,
      doctorName: dataEntry.assignDoctor,
      age: dataEntry.age || "N/A",
      phone: dataEntry.phone,
      address: dataEntry.address || "",
      chiefComplaint: dataEntry.chiefComplaint || "",
      vitals: dataEntry.vitals || { bp: '', pulse: '', sugar: '' },
      priority: dataEntry.priority as "Normal" | "Urgent" | "Critical",
      documentUrl: dataEntry.documentUrl || "",
      diagnosis: dataEntry.diagnosis || "", // নতুন diagnosis কী ব্যবহার করা হয়েছে
      medications: dataEntry.medications ? dataEntry.medications.split(',').map(m => m.trim()) : [],
      nextFollowup: dataEntry.nextFollowUpdate || "",
      teamNote: dataEntry.teamNote || "", // নতুন teamNote কী ব্যবহার করা হয়েছে
      status: dataEntry.priority === "Critical" ? "Critical" : "Stable",
      createdAt: new Date(),
    };

    const colRef = collection(db, "patients");
    await addDoc(colRef, newPatient);
    
    // ৩. সাকসেস মেসেজ ও স্টেট ক্লিয়ার
    alert("Patient entry successful!");
    setEntrySuccess(true);
    setTimeout(() => setEntrySuccess(false), 3000);

    // স্টেট রিসেট (নতুন ফিল্ড অনুযায়ী)
    setDataEntry({ 
      patientFullName: "", age: "", phone: "", address: "", 
      assignDoctor: "", assignChamber: "", diagnosis: "", 
      chiefComplaint: "", medications: "", nextFollowUpdate: "", 
      additionalNotes: "", teamNote: "", priority: "Normal", 
      vitals: { bp: '', pulse: '', sugar: '' },
      documentUrl: "" 
    });

  } catch (error) {
    console.error("Error saving patient:", error);
    alert("Error saving patient data!");
  } finally {
    setLoading(false);
  }
};
 const doctorPatients = patients.filter((p: any) => p.doctorName === currentUser?.name);
  const filtered = doctorPatients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.priority.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const pendingCalls = callList.filter(c => c.status === "pending").length;
  const doneCalls = callList.filter(c => c.status === "completed").length;
  // ═══════════════════════════════════════════════════════════
  // LANDING PAGE
  // ═══════════════════════════════════════════════════════════

  if (page === "landing") return (
    <div className="min-h-screen font-['Nunito',sans-serif] overflow-x-hidden">

 {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-teal-100 px-6 py-4 flex items-center justify-between shadow-sm shadow-teal-50">
        <div className="flex items-center gap-2.5">
          {/* Exact G-Care PNG Logo Implementation */}
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-md border border-slate-100">
            <img 
              src={logoImg} 
              alt="G-Care Logo" 
              className="w-full h-full object-contain p-0.5" 
            />
          </div>
          <span className="text-xl font-black text-teal-900 tracking-tight">ZEE CARE</span>
          <span className="text-[10px] font-black text-teal-500 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Pro</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
          <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
          <a href="#how" className="hover:text-teal-600 transition-colors">How It Works</a>
          <a href="#stats" className="hover:text-teal-600 transition-colors">For Teams</a>
        </div>

        <button
          onClick={() => setPage("login")}
          className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:shadow-lg hover:shadow-teal-200 transition-all duration-200 flex items-center gap-2"
        >
          Sign In <ArrowRight className="w-4 h-4" />
        </button>
      </nav>
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-900" />
        {/* Watermark image */}
        <div
          className="absolute inset-0 opacity-[0.09] bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&auto=format&fit=crop)" }}
        />
        <div className="absolute top-24 right-10 w-[500px] h-[500px] bg-purple-500 rounded-full opacity-20 blur-[80px]" />
        <div className="absolute bottom-24 left-10 w-[400px] h-[400px] bg-orange-400 rounded-full opacity-20 blur-[80px]" />
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[300px] bg-cyan-400 rounded-full opacity-10 blur-[100px]" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-bold px-4 py-2 rounded-full mb-7 uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5 text-emerald-300" />
              Patient Followup Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.05] mb-6">
              Smart Care,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-teal-200">
                Seamless Followup
              </span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-9 max-w-lg font-['DM_Sans',sans-serif]">
              ZEE CARE connects doctors and care teams in real-time — streamlining patient followups, prescription data entry, and daily call management from one premium platform.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <button
                onClick={() => setPage("login")}
                className="bg-white text-teal-700 font-black px-8 py-4 rounded-2xl hover:shadow-2xl hover:shadow-teal-900/40 transition-all duration-200 flex items-center gap-2 text-lg"
              >
                Get Started <ChevronRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-white/25 text-white font-black px-8 py-4 rounded-2xl hover:bg-white/10 hover:border-white/40 transition-all duration-200 text-lg">
                Watch Demo
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[
                  "photo-1559839734-2b71ea197ec2",
                  "photo-1612349317150-e413f6a5b16d",
                  "photo-1582750433449-648ed127bb54",
                ].map((id, i) => (
                  <img
                    key={i}
                    src={`https://images.unsplash.com/photo-${id}?w=48&h=48&fit=crop&auto=format`}
                    className="w-11 h-11 rounded-full border-[3px] border-teal-600 object-cover"
                    alt="Doctor"
                  />
                ))}
              </div>
              <div>
                <p className="text-white font-black text-sm">500+ Doctors Enrolled</p>
                <p className="text-white/50 text-xs font-['DM_Sans',sans-serif]">Trusted by top clinics in Bangladesh</p>
              </div>
            </div>
          </div>

          {/* Hero card */}
          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl shadow-teal-900/40">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-black text-white text-lg">Today's Patient Updates</h3>
                  <p className="text-white/50 text-xs font-['DM_Sans',sans-serif]">Dr. Farhan Ahmed • Cardiology</p>
                </div>
                <span className="flex items-center gap-1.5 bg-emerald-400/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
             {appointments.slice(0, 3).map((p: any) => (
  <div key={p.id} className="flex items-start gap-3 py-3.5 border-b border-white/10 last:border-0">
    {/* কন্ডিশনাল ডট কালার */}
    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${p.status === 'Critical' ? 'bg-red-400' : p.status === 'Due' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-white text-sm">{p.name}</p>
        <span className="text-white/35 text-xs flex-shrink-0 font-['DM_Sans',sans-serif]">
          {p.time || "N/A"}
        </span>
      </div>
      <p className="text-white/55 text-xs mt-0.5 font-['DM_Sans',sans-serif] leading-relaxed">
        {p.chiefComplaint || "No notes available"}
      </p>
    </div>
  </div>
))}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Patients", value: "24", color: "text-emerald-300" },
                  { label: "Calls Today", value: "12", color: "text-cyan-300" },
                  { label: "Team Active", value: "3", color: "text-purple-300" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-3 text-center">
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-white/40 text-[10px] mt-0.5 font-['DM_Sans',sans-serif]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 30C1200 70 960 10 720 40C480 70 240 10 0 30L0 80Z" fill="#F0FBF9" />
          </svg>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-[#F0FBF9] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025] bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1576671081837-49000212a370?w=1920&auto=format&fit=crop)" }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-teal-100 text-teal-700 font-black text-xs px-4 py-2 rounded-full mb-4 uppercase tracking-widest">Platform Features</span>
            <h2 className="text-4xl font-black text-teal-900 mb-4 leading-tight">Everything Your Care Team Needs</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg font-['DM_Sans',sans-serif]">
              One platform, three powerful roles — designed for doctors, data entry teams, and call specialists.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Stethoscope className="w-7 h-7" />,
                title: "Doctor Dashboard",
                desc: "Real-time patient status updates from your team. Monitor priority, team notes, and followup dates at a glance.",
                grad: "from-teal-500 to-emerald-600",
              },
              {
                icon: <ClipboardList className="w-7 h-7" />,
                title: "Smart Data Entry",
                desc: "Team enters prescription data from patient forms. Instantly appears in the assigned doctor's live patient list.",
                grad: "from-purple-500 to-indigo-600",
              },
              {
                icon: <PhoneCall className="w-7 h-7" />,
                title: "Daily Call Management",
                desc: "Admin assigns daily call lists. Team can't mark calls complete without adding a note — fully tracked.",
                grad: "from-orange-500 to-red-500",
              },
              {
                icon: <Shield className="w-7 h-7" />,
                title: "Admin-Controlled Access",
                desc: "No open registration. Admin creates and shares credentials — full control over who accesses the platform.",
                grad: "from-cyan-500 to-blue-600",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-7 shadow-sm border border-teal-50 hover:shadow-xl hover:shadow-teal-100/60 transition-all duration-300 group cursor-default"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.grad} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="font-black text-slate-800 text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-['DM_Sans',sans-serif]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600" />
        <div
          className="absolute inset-0 opacity-[0.06] bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1504813184591-a058ada5ab5?w=1920&auto=format&fit=crop)" }}
        />
        <div className="absolute top-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L1440 0L1440 50C1200 10 960 70 720 40C480 10 240 70 0 50L0 0Z" fill="#F0FBF9" />
          </svg>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 text-white font-black text-xs px-4 py-2 rounded-full mb-4 uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl font-black text-white mb-4">Three Steps to Better Patient Care</h2>
            <p className="text-white/65 max-w-xl mx-auto text-lg font-['DM_Sans',sans-serif]">
              Simple for doctors, powerful for teams, seamless for patients.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {[
              {
                step: "01", title: "Admin Sets Up",
                desc: "Admin creates and team accounts, assigns daily call lists, and controls all platform access.",
                icon: <Shield className="w-7 h-7" />, grad: "from-yellow-400 to-orange-500",
              },
              {
                step: "02", title: "Team Works",
                desc: "Team members enter patient data, make assigned calls, and update patient status with mandatory call notes.",
                icon: <Users className="w-7 h-7" />, grad: "from-pink-400 to-rose-500",
              },
              {
                step: "03", title: "Doctor Reviews",
                desc: "Doctor sees all patient updates from their team in real-time — status, notes, priority, and followup dates.",
                icon: <Stethoscope className="w-7 h-7" />, grad: "from-cyan-400 to-teal-500",
              },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center relative">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.grad} flex items-center justify-center text-white mx-auto mb-4 shadow-xl`}>
                  {s.icon}
                </div>
                <span className="text-white/20 text-6xl font-black block mb-3 leading-none">{s.step}</span>
                <h3 className="text-white font-black text-xl mb-3">{s.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed font-['DM_Sans',sans-serif]">{s.desc}</p>
                {i < 2 && (
                  <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/10 rounded-full items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 30C1200 70 960 10 720 40C480 70 240 10 0 30L0 80Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Stats / CTA ── */}
      <section id="stats" className="py-24 bg-white relative overflow-hidden">
        <div
          className="absolute right-0 top-0 bottom-0 w-1/2 opacity-[0.04] bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=960&auto=format&fit=crop)" }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block bg-orange-100 text-orange-600 font-black text-xs px-4 py-2 rounded-full mb-5 uppercase tracking-widest">Premium Platform</span>
              <h2 className="text-4xl font-black text-slate-800 mb-6 leading-tight">
                Doctor-Friendly.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">
                  Team-Powered.
                </span>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-8 font-['DM_Sans',sans-serif]">
                No complex setup. No lengthy registrations. Your team gets to work immediately with admin-provided credentials. Doctors see exactly what matters — nothing more, nothing less.
              </p>
              <button
                onClick={() => setPage("login")}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black px-8 py-4 rounded-2xl hover:shadow-xl hover:shadow-teal-200 transition-all duration-200 flex items-center gap-3 text-lg"
              >
                <Heart className="w-5 h-5" />
                Access Platform Now
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "500+", label: "Doctors Enrolled", grad: "from-teal-400 to-emerald-500", icon: <Stethoscope className="w-6 h-6" /> },
                { value: "12K+", label: "Patients Tracked", grad: "from-purple-400 to-indigo-500", icon: <Users className="w-6 h-6" /> },
                { value: "98%", label: "Call Completion", grad: "from-orange-400 to-red-500", icon: <PhoneCall className="w-6 h-6" /> },
                { value: "24/7", label: "Platform Uptime", grad: "from-cyan-400 to-blue-500", icon: <Activity className="w-6 h-6" /> },
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.grad} rounded-3xl p-7 text-white shadow-lg`}>
                  <div className="mb-3 opacity-75">{s.icon}</div>
                  <p className="text-4xl font-black mb-1">{s.value}</p>
                  <p className="text-white/65 font-bold text-sm font-['DM_Sans',sans-serif]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-900 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            {/* Footer G-Care PNG Logo Implementation */}
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-white flex items-center justify-center p-0.5 shadow-sm">
              <img 
                src={logoImg} 
                alt="ZEE CARE Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="text-white font-black text-xl tracking-tight">ZEE CARE</span>
          </div>
          <p className="text-white/40 text-sm font-['DM_Sans',sans-serif]">© 2026 ZEE CARE. Powered by Gorun Ltd.</p>
          <button
            onClick={() => setPage("login")}
            className="text-teal-300 font-bold text-sm hover:text-white transition-colors flex items-center gap-1.5"
          >
            Sign In to Platform <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // LOGIN PAGE
  // ═══════════════════════════════════════════════════════════

  if (page === "login") return (
    <div className="min-h-screen font-['Nunito',sans-serif] relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-emerald-700 to-teal-900" />
      <div
        className="absolute inset-0 opacity-[0.08] bg-cover bg-center"
        style={{ backgroundImage: "url(https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&auto=format&fit=crop)" }}
      />
      <div className="absolute top-20 right-20 w-72 h-72 bg-purple-400 rounded-full opacity-20 blur-3xl" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-orange-400 rounded-full opacity-20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="bg-white rounded-3xl p-9 shadow-2xl shadow-teal-900/40">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-teal-200">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-teal-900">Welcome to ZEE CARE</h1>
            <p className="text-slate-400 text-sm mt-1 font-['DM_Sans',sans-serif]">Sign in with your admin-provided credentials</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && login()}
                placeholder="your@email.com"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-teal-400 transition-colors font-['DM_Sans',sans-serif]"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && login()}
                placeholder="••••••••"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-teal-400 transition-colors font-['DM_Sans',sans-serif]"
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl font-['DM_Sans',sans-serif]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loginError}
              </div>
            )}

            <button
              onClick={login}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black py-4 rounded-xl hover:shadow-lg hover:shadow-teal-200 transition-all duration-200 text-lg"
            >
              Sign In
            </button>
          </div>

          <div className="mt-6 bg-teal-50 border border-teal-100 rounded-2xl p-4">
            <p className="text-xs font-black text-teal-700 mb-2 uppercase tracking-wide">Demo Credentials</p>
            <div className="space-y-1.5 text-xs text-teal-600 font-['DM_Sans',sans-serif]">
              <p><span className="font-bold">Doctor login:</span> doctor@meditrack.com / doctor123</p>
              <p><span className="font-bold">Team login:</span> team@meditrack.com / team123</p>
            </div>
          </div>

          <button
            onClick={() => setPage("landing")}
            className="w-full mt-4 text-slate-400 text-sm font-bold hover:text-teal-600 transition-colors font-['DM_Sans',sans-serif]"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
 // DOCTOR DASHBOARD
// ═══════════════════════════════════════════════════════════

if (page === "doctor") {
  if (!appointments) {
    return <div>Loading...</div>;
  }
  // 🔍 শুধুমাত্র কারেন্ট ডক্টরের জন্য অ্যাপয়েন্টমেন্টগুলো ফিল্টার করে নেওয়া হচ্ছে
const myLiveAppointments = appointments.filter((app) => {
  const isMyPatient = app.doctor === currentUser?.name;
  const isChamberMatch = activeChamber === "All" || app.chamber === activeChamber;
  const isConfirmed = app.status === "confirmed"; // এই লাইনটি যোগ করুন
  
  return isMyPatient && isChamberMatch && isConfirmed; // এখানেও এটি যোগ করে দিন
});

  return (
  <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-[#F0FBF9] font-['Nunito',sans-serif]">
    
    {/* সাইডবার */}
    <aside className="hidden md:flex w-64 bg-gradient-to-b from-indigo-700 to-purple-800 flex-col flex-shrink-0 h-screen shadow-2xl shadow-indigo-900/30">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/90 flex items-center justify-center p-0.5 shadow-sm">
            <img src={logoImg} alt="ZEE CARE Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-base leading-none">ZEE CARE</span>
            <span className="text-[9px] font-bold text-teal-200/70 mt-0.5 tracking-wider">MEDITRACK CLIENT</span>
          </div>
        </div>
        <div className="bg-white/10 rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <User className="w-5 h-5 text-white" />
          </div>
          <p className="text-white font-black text-sm">{currentUser?.name}</p>
          <p className="text-white/50 text-xs mt-0.5">Cardiology • D001</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: "patients" as DoctorView, label: "My Patients", icon: <Users className="w-4 h-4" />, badge: doctorPatients.length },
          { id: "team" as DoctorView, label: "My Team", icon: <UserCheck className="w-4 h-4" />, badge: INIT_TEAM.length },
          { id: "appointments" as DoctorView, label: "Appointments", icon: <Calendar className="w-4 h-4" />, badge: myLiveAppointments.length },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setDoctorView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              doctorView === item.id ? "bg-white text-teal-700 shadow-lg" : "text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${doctorView === item.id ? "bg-teal-100 text-teal-600" : "bg-white/10"}`}>
              {item.badge}
            </span>
          </button>
        ))}
      </nav>
    </aside>

    {/* মেইন কন্টেন্ট এলাকা */}
    <main className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="bg-white border-b border-teal-100 px-8 py-5 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-black text-teal-900">
            {doctorView === "patients" && "Patient Overview"}
            {doctorView === "team" && "My Care Team"}
            {doctorView === "appointments" && "Live Consultation Queue"}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="w-5 h-5 text-slate-400" />
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </header>

      {/* চেম্বার ফিল্টার বার */}
      {doctorView === "appointments" && (
        <div className="bg-white px-8 py-3 border-b border-teal-50 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-black text-teal-800 uppercase tracking-widest mr-2">Select Chamber:</span>
          <button
            onClick={() => setActiveChamber("All")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold ${activeChamber === "All" ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-700"}`}
          >
            All
          </button>
          {currentDoctor?.chambers?.map((chamber: string) => (
            <button
              key={chamber}
              onClick={() => setActiveChamber(chamber)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold ${activeChamber === chamber ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-700"}`}
            >
              {chamber}
            </button>
          ))}
        </div>
      )}
        <div className="p-8">
{/* ── Patients View ── */}
{doctorView === "patients" && (
  <div className="flex flex-col gap-6">
    {!selectedPatientId ? (
      /* লিস্ট ভিউ (ডাটা দেখানোর জন্য) */
      <div className="space-y-3">
        {patients && patients.length > 0 ? (
          patients.map((p) => (
            <div 
              key={p.id} 
              className="p-5 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-teal-400 transition-all shadow-sm"
              onClick={() => setSelectedPatientId(p.id)}
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-800 text-lg">{p.name || "Unknown"}</h3>
                        <span className="text-slate-300 text-xs font-mono">
                          {p.id ? String(p.id).slice(-6) : ""}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm font-['DM_Sans',sans-serif]">
                        {p.priority || "No Priority"} • Age {p.age || "N/A"} • {p.address || "No Address"}
                      </p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full flex-shrink-0 ${STATUS_CHIP[p.status] || "bg-slate-100 text-slate-600"}`}>
                      {p.status || "N/A"}
                    </span>
                  </div>
                  {p.teamNote && (
                    <div className="mt-3 bg-teal-50 rounded-xl p-3.5 border-l-4 border-teal-400">
                      <p className="text-xs font-black text-teal-600 mb-1 uppercase tracking-wide">Team Update</p>
                      <p className="text-sm text-teal-800 font-['DM_Sans',sans-serif] leading-relaxed line-clamp-2">
                        {p.teamNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-400 py-10">No patients found.</p>
        )}
      </div>
    ) : (
      /* ডিটেইলস ভিউ (সঠিক এ্যারে `patients` দিয়ে খোঁজা হয়েছে) */
      <div className="bg-white p-8 rounded-3xl border border-teal-50 shadow-lg">
        {(() => {
          // এখানে doctorPatients এর বদলে patients ব্যবহার করা হয়েছে এবং সেফ ম্যাচিং এর জন্য String() করা হয়েছে
          const p = patients.find(pat => String(pat.id) === String(selectedPatientId));
          
          return p ? (
            <>
              <button 
                onClick={() => setSelectedPatientId(null)}
                className="mb-6 flex items-center gap-2 text-teal-600 font-bold hover:text-teal-700"
              >
                ← Back to List
              </button>
              
              <div className="border-b border-slate-100 pb-5 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black text-slate-800">{p.name}</h2>
                  <span className="text-slate-400 text-sm font-mono bg-slate-100 px-2 py-0.5 rounded">ID: {p.id}</span>
                </div>
                <p className="text-slate-500 font-['DM_Sans',sans-serif]">Age {p.age || "N/A"} • {p.address || "No Address"}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Priority</p>
                  <p className="font-black text-slate-700 text-base">{p.priority || "N/A"}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Status</p>
                  <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-full mt-0.5 ${STATUS_CHIP[p.status] || "bg-slate-100 text-slate-600"}`}>
                    {p.status || "N/A"}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Phone</p>
                  <p className="font-bold text-slate-700 text-base">{p.phone || "N/A"}</p>
                </div>
              </div>

              {p.teamNote && (
                <div className="bg-teal-50 p-5 rounded-2xl border-l-4 border-teal-400">
                  <p className="text-xs font-black text-teal-600 mb-1 uppercase tracking-wide">Team Update Note</p>
                  <p className="text-slate-800 text-sm font-['DM_Sans',sans-serif] leading-relaxed whitespace-pre-line">
                    {p.teamNote}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-500 mb-4">Patient details could not be loaded.</p>
              <button 
                onClick={() => setSelectedPatientId(null)} 
                className="bg-teal-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-teal-700 transition-all"
              >
                Go Back
              </button>
            </div>
          );
        })()}
      </div>
    )}
  </div>
)}
          {/* ── Team View ── */}
          {doctorView === "team" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {INIT_TEAM.map(t => (
                <div key={t.id} className="bg-white rounded-2xl p-6 border border-teal-50 hover:shadow-lg hover:shadow-teal-100/60 transition-all duration-200">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-100">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg">{t.name}</h3>
                      <span className="text-xs font-black text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">{t.role}</span>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-sm font-['DM_Sans',sans-serif]">
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> {t.phone}
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <FileText className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                      <span className="truncate">{t.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Joined {t.joinDate}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-black bg-emerald-50 px-3 py-1 rounded-lg">● Active</span>
                    <span className="text-xs text-slate-400 font-['DM_Sans',sans-serif]">{t.callsToday} calls today</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* ── Patient Detail View ── */}
{selectedPatientId && (() => {
  const p = patients.find(pat => String(pat.id) === String(selectedPatientId));
  if (!p) return null;

  return (
    <div className="p-8">
      {/* একমাত্র সিঙ্গেল কার্ড কন্টেইনার */}
      <div className="max-w-2xl mx-auto bg-white rounded-3xl overflow-hidden border border-teal-50 shadow-sm">
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-7 text-white">
          <div className="flex items-center gap-5">
            <div className="w-[72px] h-[72px] rounded-2xl bg-white/20 flex items-center justify-center shadow-xl">
              <User className="w-9 h-9 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black">{p.name || "Unknown"}</h2>
              <p className="text-white/70 font-mono text-sm mt-0.5">{p.id} • Age {p.age || "N/A"}</p>
              <div className="mt-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-white/20">
                  {p.status || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-7 space-y-6">
           <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
             <div className="bg-slate-50 p-4 rounded-xl">
                <strong className="text-slate-800 block mb-1">Phone:</strong> {p.phone || "N/A"}
             </div>
             <div className="bg-slate-50 p-4 rounded-xl">
                <strong className="text-slate-800 block mb-1">Condition:</strong> {p.priority || "N/A"}
             </div>
           </div>
           
           <div className="bg-teal-50 rounded-2xl p-5 border-l-4 border-teal-400">
             <p className="text-xs font-black text-teal-600 mb-2 uppercase tracking-wide">Team Note</p>
             <p className="text-sm text-teal-800 leading-relaxed font-['DM_Sans',sans-serif]">
               {p.teamNote || "No clinical notes provided by the team."}
             </p>
           </div>

           <button
             onClick={() => setSelectedPatientId(null)}
             className="w-full py-3.5 rounded-2xl border-2 border-teal-200 text-teal-600 font-black hover:bg-teal-50 transition-colors"
           >
             ← Back to Patients List
           </button>
        </div>
      </div>
    </div>
  );
})()}
{/* ── Firebase Filtered Realtime Appointments View ── */}
        
          {doctorView === "appointments" && (
            (() => {
              // স্টেটের নাম 'appointments' যদি হয় তবে এটাই রাখুন
              const dataToFilter = appointments || []; 

              const filtered = activeChamber === "All" 
                ? dataToFilter 
                : dataToFilter.filter((apt) => 
                    String(apt.chamber || "").trim().toLowerCase() === activeChamber.trim().toLowerCase()
                  );

              console.log("ফিল্টার করা ডাটা:", filtered);

              return filtered.length > 0 ? (
  <AppointmentSection 
    appointments={filtered} 
    onPatientClick={(patient) => setSelectedPatientId(patient.id)} 
  />
) : (
  <div className="text-center py-20 text-slate-400">No appointments found.</div>
);
            })()
          )}
        </div> 
      </main>
    </div>
  );
}
  // ═══════════════════════════════════════════════════════════
  // TEAM DASHBOARD
  // ═══════════════════════════════════════════════════════════

  if (page === "team") return (
    <div className="min-h-screen bg-[#F0FBF9] font-['Nunito',sans-serif] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-700 to-purple-800 flex flex-col flex-shrink-0 min-h-screen shadow-2xl shadow-indigo-900/30">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-5">
  {/* Team Dashboard G-Care PNG Logo */}
  <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/90 flex items-center justify-center p-0.5 shadow-sm">
    <img 
      src={logoImg} 
      alt="G-Care Logo" 
      className="w-full h-full object-contain" 
    />
  </div>
  <div className="flex flex-col">
    <span className="text-white font-black text-base leading-none">ZEE CARE</span>
    <span className="text-[9px] font-bold text-indigo-200/70 mt-0.5 tracking-wider">TEAM PORTAL</span>
  </div>
</div>
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <User className="w-5 h-5 text-white" />
            </div>
            <p className="text-white font-black text-sm">{currentUser?.name}</p>
            <p className="text-white/50 text-xs font-['DM_Sans',sans-serif] mt-0.5">Team Member • T001</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "call-list" as TeamView, label: "Daily Call List", icon: <PhoneCall className="w-4 h-4" />, badge: pendingCalls, urgent: pendingCalls > 0 },
            { id: "data-entry" as TeamView, label: "Patient Data Entry", icon: <ClipboardList className="w-4 h-4" />, badge: null, urgent: false },
      { id: "appointments" as TeamView, label: "Appointment Desk", icon: <Calendar className="w-4 h-4" />, badge: appointments.filter(a => a.step < 4).length },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setTeamView(item.id); setSelectedPatientId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-150 ${
                teamView === item.id
                  ? "bg-white text-indigo-700 shadow-lg shadow-indigo-900/20"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== null && (
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${item.urgent ? "bg-orange-400 text-white" : "bg-white/10 text-white/50"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 pt-0">
          <div className="bg-white/10 rounded-2xl p-4 mb-3">
            <p className="text-white/40 text-xs font-['DM_Sans',sans-serif] mb-2">Today's Progress</p>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${callList.length ? (doneCalls / callList.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-white font-black text-lg">{doneCalls}<span className="text-white/40 font-normal text-sm">/{callList.length} calls done</span></p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/10 hover:text-white text-sm font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-indigo-100 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm shadow-indigo-50">
          <div>
            <h1 className="text-xl font-black text-indigo-900">
              {teamView === "call-list" ? "Daily Call List" :
               teamView === "data-entry" ? "Patient Data Entry" :
               "Patient Details"}
            </h1>
            <p className="text-slate-400 text-sm font-['DM_Sans',sans-serif]">
              {teamView === "call-list" ? `${pendingCalls} calls pending · ${doneCalls} completed today` :
               teamView === "data-entry" ? "Enter patient details from prescription forms" :
               `Viewing: ${selectedPatientId?.name} • ${selectedPatientId}`}
            </p>
          </div>
          {teamView === "patient-detail" && (
            <button
              onClick={() => { setTeamView("call-list"); setSelectedPatientId(null); }}
              className="flex items-center gap-2 text-sm font-bold text-indigo-500 hover:text-indigo-800 transition-colors"
            >
              ← Back to Call List
            </button>
          )}
        </header>

        <div className="p-8">

          {/* ── Call List ── */}
          {teamView === "call-list" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-indigo-50 shadow-sm mb-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-black text-slate-700">Today's Progress — {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
                  <p className="text-sm font-black text-indigo-600">{doneCalls}/{callList.length} Completed</p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${callList.length ? (doneCalls / callList.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {callList.map(call => {
                const patient = patients.find(p => p.id === call.patientId);
                if (!patient) return null;
                const noteVal = callNotes[call.id] || "";
                return (
                  <div
                    key={call.id}
                    className={`bg-white rounded-2xl p-6 border-2 transition-all duration-200 ${
                      call.status === "completed"
                        ? "border-emerald-200 opacity-75"
                        : call.priority === "Urgent"
                        ? "border-red-100 hover:shadow-lg hover:shadow-red-50"
                        : call.priority === "High"
                        ? "border-orange-100 hover:shadow-lg hover:shadow-orange-50"
                        : "border-transparent hover:shadow-lg hover:shadow-indigo-50"
                    }`}
                  >
                    <div className="flex items-start gap-5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${call.status === "completed" ? "bg-emerald-100" : "bg-indigo-100"}`}>
                        {call.status === "completed"
                          ? <Check className="w-5 h-5 text-emerald-600" />
                          : <PhoneCall className="w-5 h-5 text-indigo-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                          <div>
                            <button
                              onClick={() => { setSelectedPatientId(patient.id); setTeamView("patient-detail"); }}
                              className="font-black text-slate-800 text-lg hover:text-indigo-600 transition-colors flex items-center gap-1.5 group"
                            >
                              {patient.name}
                              <Eye className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </button>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{patient.id} • {patient.phone}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${PRIORITY_CHIP[call.priority]}`}>
                              {call.priority}
                            </span>
                            {call.status === "completed" && (
                              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                ✓ Done
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-500 mb-4 flex items-center gap-1.5 font-['DM_Sans',sans-serif]">
                          <Clipboard className="w-3.5 h-3.5 flex-shrink-0 text-indigo-400" />
                          {call.reason}
                        </p>

                        {call.status === "pending" && (
                          <div className="flex gap-3 items-start">
                            <textarea
                              value={noteVal}
                              onChange={e => setCallNotes(prev => ({ ...prev, [call.id]: e.target.value }))}
                              placeholder="Add call note here — required before marking complete..."
                              rows={2}
                              className="flex-1 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors resize-none font-['DM_Sans',sans-serif]"
                            />
                            <button
                              onClick={() => completeCall(call.id)}
                              disabled={!noteVal.trim()}
                              className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-150 ${
                                noteVal.trim()
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-200"
                                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
                              }`}
                            >
                              <Check className="w-4 h-4" />
                              Complete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {callList.every(c => c.status === "completed") && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <p className="font-black text-slate-700 text-xl mb-1">All calls completed!</p>
                  <p className="text-slate-400 font-['DM_Sans',sans-serif]">Great work today. All {callList.length} calls done.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Data Entry ── */}
{teamView === "data-entry" && (
  <div className="max-w-2xl mx-auto">
    <div className="bg-white rounded-3xl p-8 border border-indigo-50 shadow-sm">
      {entrySuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 mb-6">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-black">Patient Added Successfully!</p>
            <p className="text-sm font-['DM_Sans',sans-serif]">Patient is now visible in the assigned doctor's dashboard.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-black text-slate-800 text-lg">New Patient from Prescription</h2>
          <p className="text-slate-400 text-sm font-['DM_Sans',sans-serif]">Fill all required fields — select doctor to auto-assign</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Basic Info */}
        <div className="col-span-2">
          <label className="block text-sm font-black text-slate-700 mb-1.5">
            Patient Full Name <span className="text-red-400">*</span>
          </label>
          <input 
  value={dataEntry.patientFullName} 
  onChange={e => setDataEntry(p => ({ ...p, patientFullName: e.target.value }))}
  placeholder="e.g. Mohammed Abdul Karim"
  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors font-['DM_Sans',sans-serif]"
/>
        </div>
        
        {/* Vitals Section */}
        <div className="col-span-2 grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <div>
              <label className="block text-xs font-black text-slate-500 mb-1">BP</label>
              <input value={dataEntry.vitals?.bp} onChange={e => setDataEntry(p => ({...p, vitals: {...p.vitals, bp: e.target.value}}))} placeholder="120/80" className="w-full border rounded-lg p-2 text-sm"/>
           </div>
           <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Pulse</label>
              <input value={dataEntry.vitals?.pulse} onChange={e => setDataEntry(p => ({...p, vitals: {...p.vitals, pulse: e.target.value}}))} placeholder="72" className="w-full border rounded-lg p-2 text-sm"/>
           </div>
           <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Sugar</label>
              <input value={dataEntry.vitals?.sugar} onChange={e => setDataEntry(p => ({...p, vitals: {...p.vitals, sugar: e.target.value}}))} placeholder="5.6" className="w-full border rounded-lg p-2 text-sm"/>
           </div>
        </div>

        <div>
          <label className="block text-sm font-black text-slate-700 mb-1.5">Age</label>
          <input type="number" value={dataEntry.age} onChange={e => setDataEntry(p => ({ ...p, age: e.target.value }))} placeholder="45" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors font-['DM_Sans',sans-serif]" />
        </div>
        <div>
          <label className="block text-sm font-black text-slate-700 mb-1.5">Phone Number <span className="text-red-400">*</span></label>
          <input 
  type="text"
  value={dataEntry.phone} 
  // এখানে phone এর বদলে phoneNumber লিখে দিন
  onChange={e => setDataEntry(p => ({ ...p, phone: e.target.value }))} 
  placeholder="017XX-XXXXXX" 
  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors font-['DM_Sans',sans-serif]" 
/>
        </div>
{/* Priority Selection */}
        <div className="col-span-2">
          <label className="block text-sm font-black text-slate-700 mb-1.5">Priority Level</label>
          <select 
            value={dataEntry.priority || "Normal"} 
            onChange={e => setDataEntry(p => ({...p, priority: e.target.value}))} 
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm bg-white"
          >
            <option value="Normal">Normal 🟢</option>
            <option value="Urgent">Urgent 🟡</option>
            <option value="Critical">Critical 🔴</option>
          </select>
        </div>

        {/* File Upload */}
        <div className="col-span-2">
          <label className="block text-sm font-black text-slate-700 mb-1.5">Medical Report Attachment</label>
          <input 
            type="file" 
            onChange={handleFileUpload} 
            className="w-full border-2 border-dashed border-slate-300 rounded-xl px-4 py-3 text-sm" 
          />
        </div>

        {/* Diagnosis / Condition */}
        <div className="col-span-2">
          <label className="block text-sm font-black text-slate-700 mb-1.5">Diagnosis / Condition</label>
          <input 
            value={dataEntry.diagnosis || ""} 
            onChange={e => setDataEntry(p => ({ ...p, diagnosis: e.target.value }))} 
            placeholder="e.g. Hypertension, Type-2 Diabetes" 
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm" 
          />
        </div>
        <div className="col-span-2">
  <label className="block text-sm font-black text-slate-700 mb-1.5">Assign Doctor</label>
  <select
  value={dataEntry.assignDoctor}
  onChange={(e) => setDataEntry((prev) => ({ ...prev, assignDoctor: e.target.value }))}
  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm"
>
  <option value="">Select a Doctor</option>
  
  {/* ডাটাবেস ফেচ না হওয়া পর্যন্ত এই হার্ডকোডেড নামগুলো দিয়ে চেক করুন */}
  <option value="Dr. Shahin Wadud">Dr. Shahin Wadud</option>
  <option value="Dr. Another Name">Dr. Another Name</option>

  {/* ডায়নামিক ডাটা যদি পরে ঠিক হয়, তবে এটিও কাজ করবে */}
  {onboardedDoctors?.map((doc) => (
    <option key={doc.id} value={doc.name}>
      {doc.name}
    </option>
  ))}
</select>
</div>
        {/* Address */}
        <div className="col-span-2">
          <label className="block text-sm font-black text-slate-700 mb-1.5">Patient Address</label>
          <input 
            value={dataEntry.address || ""} 
            onChange={e => setDataEntry(p => ({ ...p, address: e.target.value }))} 
            placeholder="Enter full address" 
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm" 
          />
        </div>

        {/* Team Note */}
        <div className="col-span-2">
          <label className="block text-sm font-black text-slate-700 mb-1.5">Team Note</label>
          <textarea 
            value={dataEntry.teamNote || ""} 
            onChange={e => setDataEntry(p => ({ ...p, teamNote: e.target.value }))} 
            placeholder="Clinical observations or team notes..." 
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm min-h-[100px]" 
          />
        </div>

        {/* Submit Button */}
<button
  onClick={submitDataEntry}
  disabled={false} // এটাকে সাময়িকভাবে false করে দিলাম
  className={`col-span-2 w-full mt-6 py-4 rounded-2xl font-black text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
    "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl"
  }`}
>
  {loading ? "Saving..." : "Add Patient to Doctor's List"}
</button>

      </div> {/* Closing grid container */}
    </div> {/* Closing inner wrapper */}
  </div> // Closing main padding container
)}

{/* Appointment Desk View */}
{teamView === "appointments" && (
  <TeamAppointmentDesk 
    appointments={appointments} 
    setAppointments={setAppointments} 
  />
)}      {/* ── Patient Detail ── */}
          {teamView === "patient-detail" && selectedPatientId && (() => {
            const p = patients.find(pat => pat.id === selectedPatientId);
            if (!p) return null;
console.log("Check fields:", {
  hasName: !!dataEntry.patientFullName,
  hasDoctor: !!dataEntry.assignDoctor,
  hasPhone: !!dataEntry.phone
});
            retun (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl overflow-hidden border border-indigo-50 shadow-sm">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-7 text-white">
                    <div className="flex items-center gap-5">
                      <div className="w-[72px] h-[72px] rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-xl">
                        <User className="w-9 h-9 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black">{p.name}</h2>
                        <p className="text-white/60 font-mono text-sm mt-0.5">{p.id} • Age {p.age}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white">
                            {p.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-7 space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoBlock label="Phone" value={p.phone} icon={<Phone className="w-3.5 h-3.5" />} />
                      <InfoBlock label="Address" value={p.address} icon={<FileText className="w-3.5 h-3.5" />} />
                      <InfoBlock label="Condition" value={p.priority} icon={<Activity className="w-3.5 h-3.5" />} />
                      <InfoBlock label="Assigned Doctor" value={DOCTORS.find(d => d.id === p.doctorId)?.name || "N/A"} icon={<Stethoscope className="w-3.5 h-3.5" />} />
                      <InfoBlock label="Last Followup" value={p.lastFollowup} icon={<Calendar className="w-3.5 h-3.5" />} />
                      <InfoBlock label="Next Followup" value={p.nextFollowup || "Not scheduled"} icon={<Clock className="w-3.5 h-3.5" />} />
                    </div>

                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Current Medications</p>
                      <div className="flex flex-wrap gap-2">
                        {p.medications?.length > 0 ? p.medications.map((m, i) => (
                          <span key={i} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-bold px-3.5 py-2 rounded-xl border border-indigo-100">
                            <Pill className="w-3.5 h-3.5" /> {m}
                          </span>
                        )) : (
                          <span className="text-slate-400 text-sm">No medications recorded</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-indigo-50 rounded-2xl p-5 border-l-4 border-indigo-400">
                      <p className="text-xs font-black text-indigo-600 mb-2 uppercase tracking-wide">Latest Team Note</p>
                      <p className="text-sm text-indigo-800 leading-relaxed">{p.teamNote}</p>
                    </div>

                    <button
                      onClick={() => { setTeamView("call-list"); setSelectedPatientId(null); }}
                      className="w-full py-3.5 rounded-2xl border-2 border-indigo-200 text-indigo-600 font-black hover:bg-indigo-50 transition-colors"
                    >
                      ← Back to Call List
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}