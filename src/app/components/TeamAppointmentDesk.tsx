import React, { useState } from "react";
import { ChevronRight, CheckCircle, AlertCircle, Plus, X, UserCheck, Paperclip, FileText } from "lucide-react";
// db এবং Firestore ফাংশন ইম্পোর্ট
import { db } from "../../firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";

interface AppointmentItem {
  id: string;
  name: string;
  doctor: string;
  date: string;
  time: string;
  step: number;
  age: string;
  phone: string;
  chiefComplaint: string;
  vitalSigns?: string;
  condition: "Normal" | "Urgent" | "Critical";
  documentUrl?: string;
  teamNotes?: string;
}

interface TeamAppointmentDeskProps {
  appointments: AppointmentItem[];
}

const PIPELINE_STEPS = ["Patient Request", "Verify Data", "Hospital Schedule", "Doctor Slot", "Notify Patient"];

export default function TeamAppointmentDesk({ appointments }: TeamAppointmentDeskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    name: "",
    doctor: "Dr. Farhan Ahmed",
    date: "",
    time: "",
    age: "",
    phone: "",
    chiefComplaint: "",
    vitalSigns: "",
    condition: "Normal" as "Normal" | "Urgent" | "Critical",
    documentUrl: "",
    teamNotes: "",
    chamber: "",
  });

  // ☁️ Cloudinary File Upload Handler (সম্পূর্ণ লজিক)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    // Cloudinary আপলোডের জন্য আপনার preset ও cloud_name বসাবেন
    data.append("upload_preset", "your_cloudinary_preset"); 

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      
      if (fileData.secure_url) {
        setFormData(prev => ({ ...prev, documentUrl: fileData.secure_url }));
        alert("Medical document successfully uploaded to Cloudinary!");
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      alert("Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  // 🔄 Firebase-এ পাইপলাইন স্টেপ আপডেট
  const advanceAppointmentStep = async (id: string, currentStep: number) => {
    if (currentStep >= 4) return;
    try {
      const docRef = doc(db, "zee_care_appointments", id);
      await updateDoc(docRef, { step: currentStep + 1 });
    } catch (error) {
      console.error("Error updating step:", error);
    }
  };

  // 🔥 Firebase Firestore-এ ডেটা পাঠানো
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // এখানে chamber ভ্যালিডেশন চেক করুন যদি প্রয়োজন হয়
    if (!formData.name || !formData.date || !formData.time || !formData.phone || !formData.chamber) {
      alert("Please fill all required fields, including Chamber.");
      return;
    }

    try {
      await addDoc(collection(db, "zee_care_appointments"), {
        name: formData.name,
        doctor: formData.doctor,
        chamber: formData.chamber, // নতুন ফিল্ডটি যোগ করা হলো
        date: new Date(formData.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric"
        }),
        time: new Date(`2000-01-01T${formData.time}`).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        step: 0,
        age: formData.age,
        phone: formData.phone,
        chiefComplaint: formData.chiefComplaint,
        vitalSigns: formData.vitalSigns,
        condition: formData.condition,
        documentUrl: formData.documentUrl,
        teamNotes: formData.teamNotes,
        createdAt: new Date().getTime() 
      });

      // ফর্ম রিসেট (chamber সহ)
      setFormData({ 
        name: "", 
        doctor: "Dr. Farhan Ahmed", 
        chamber: "", // এখানে রিসেট ফিল্ড যোগ করুন
        date: "", 
        time: "", 
        age: "", 
        phone: "", 
        chiefComplaint: "", 
        vitalSigns: "",
        condition: "Normal", 
        documentUrl: "", 
        teamNotes: ""
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding to Firebase:", error);
      alert("Database sync failed!");
    }
  };

  const getBadgeColor = (cond: string) => {
    if (cond === "Critical") return "bg-rose-100 text-rose-700 border-rose-200";
    if (cond === "Urgent") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-indigo-50 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">Operational Desk</h2>
          <p className="text-xs text-slate-400 font-medium">Verify hospital serials & onboarding patients</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-100 transition-all"
        >
          <Plus size={16} /> Verify & Create Appointment
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-sm font-semibold flex items-center gap-2">
        <AlertCircle size={16} className="text-amber-600" />
        হাসপাতালের সিরিয়াল চেক করে পেশেন্টের সাথে কথা বলে এই তথ্যগুলো পূরণ করুন। এটি সরাসরি Doctor ড্যাশবোর্ডে চলে যাবে।
      </div>

      {/* Pipeline List */}
      <div className="space-y-4">
        {appointments.map(app => (
          <div key={app.id} className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-black text-slate-800 text-lg">{app.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">Age: {app.age || "N/A"}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getBadgeColor(app.condition)}`}>
                    {app.condition}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{app.doctor} • {app.date} • {app.time} • Mob: {app.phone}</p>
              </div>
              
              {app.step < 4 ? (
                <button 
                  onClick={() => advanceAppointmentStep(app.id, app.step)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 transition-colors"
                >
                  Next Step: {PIPELINE_STEPS[app.step + 1]} <ChevronRight size={14} />
                </button>
              ) : (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1">
                  <CheckCircle size={14} /> Approved & Active ✓
                </span>
              )}
            </div>

            {/* প্রি-কনসালটেশন কার্ড */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex items-center gap-1 text-indigo-700 font-black uppercase tracking-wider text-[10px]">
                <UserCheck size={12} /> Pre-Consultation Support Data
              </div>
              <p className="text-slate-700 font-medium"><strong className="text-slate-900">Chief Complaint:</strong> {app.chiefComplaint}</p>
              {app.vitalSigns && <p className="text-slate-700 font-medium"><strong className="text-slate-900">Vitals/History:</strong> {app.vitalSigns}</p>}
              {app.teamNotes && <p className="text-slate-600 italic"><strong className="text-slate-900 font-normal not-italic font-semibold">Team Assessment:</strong> "{app.teamNotes}"</p>}
              
              {app.documentUrl && (
                <a 
                  href={app.documentUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-black mt-1 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <FileText size={12} /> View Attached Medical Report
                </a>
              )}
            </div>

            {/* Progress Pipeline Indicator */}
            <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-dashed border-slate-100">
              {PIPELINE_STEPS.map((stepName, i) => (
                <div key={stepName} className="flex items-center gap-1 shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${
                    i <= app.step ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    <span>{i + 1}. {stepName}</span>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className={`w-4 h-0.5 ${i < app.step ? "bg-indigo-400" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ─── POPUP MODAL FORM ─── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm m-0">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 mx-2 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-indigo-50 px-6 py-4 flex items-center justify-between border-b border-indigo-100 shrink-0">
              <div>
                <h3 className="font-black text-indigo-950 text-base">Hospital Serial Verification</h3>
                <p className="text-[11px] text-indigo-700 font-medium">Collect medical logs & sync with Doctor Desk</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* ১. বেসিক অ্যাপয়েন্টমেন্ট ইনফো */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">1. Schedule & Severity</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Date</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Time Slot</label>
                    <input type="time" required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Assign Doctor</label>
                    <select value={formData.doctor} onChange={e => setFormData({ ...formData, doctor: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-indigo-500">
                      <option value="Dr. Farhan Ahmed">Dr. Farhan Ahmed</option>
                      <option value="Dr. Nusrat Jahan">Dr. Nusrat Jahan</option>
                    </select>
                  </div>
                  <div>
    <label className="block text-[11px] font-bold text-slate-600 mb-1">Assign Chamber</label>
    <select 
      value={formData.chamber} 
      onChange={e => setFormData({ ...formData, chamber: e.target.value })} 
      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-indigo-500"
      required
    >
      <option value="">Select Chamber</option>
      <option value="Chamber A">Chamber A</option>
      <option value="Chamber B">Chamber B</option>
    </select>
  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Patient Condition</label>
                    <select value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value as any })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-indigo-500">
                      <option value="Normal">🟢 Normal Case</option>
                      <option value="Urgent">🟡 Urgent Case</option>
                      <option value="Critical">🔴 Critical Case</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ২. পেশেন্ট ও প্রি-কনসালটেশন ডিটেইলস */}
              <div className="bg-indigo-50/20 p-4 rounded-2xl border border-indigo-50/50 space-y-3">
                <div className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">2. Patient Call & Medical Sync</div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Patient Full Name</label>
                    <input type="text" required placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Age</label>
                    <input type="number" placeholder="Age" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Number</label>
                  <input type="tel" required placeholder="017xxxxxxxx" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Chief Complaint (পেশেন্টের মূল সমস্যা)</label>
                  <textarea rows={2} required placeholder="পেশেন্ট বর্তমানে কী সমস্যা ফেস করছেন..." value={formData.chiefComplaint} onChange={e => setFormData({ ...formData, chiefComplaint: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Vitals (BP/Pulse/Sugar)</label>
                    <input type="text" placeholder="e.g. BP 140/90" value={formData.vitalSigns} onChange={e => setFormData({ ...formData, vitalSigns: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Previous Reports (PDF/Image)</label>
                    <div className="relative">
                      <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" id="modal-file-upload" disabled={uploading} />
                      <label htmlFor="modal-file-upload" className={`w-full flex items-center justify-center gap-1.5 border border-dashed rounded-xl px-3 py-2 text-xs font-black cursor-pointer transition-colors ${
                        formData.documentUrl ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}>
                        <Paperclip size={13} /> {uploading ? "Uploading..." : formData.documentUrl ? "Uploaded ✓" : "Attach File"}
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Team assessment & Short notes (পেশেন্টের ফাইনাল অবস্থা)</label>
                  <input type="text" placeholder="যেমন: পেশেন্ট অনেক দুর্বল, হুইলচেয়ার প্রয়োজন হতে পারে..." value={formData.teamNotes} onChange={e => setFormData({ ...formData, teamNotes: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setIsOpen(false)} className="text-slate-500 hover:bg-slate-50 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all">
                  Confirm Serial & Sync to Doctor
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
