import React, { useState } from "react";
import { ChevronRight, CheckCircle, AlertCircle, Plus, X } from "lucide-react";

interface AppointmentItem {
  id: number;
  name: string;
  doctor: string;
  date: string;
  time: string;
  step: number;
}

interface TeamAppointmentDeskProps {
  appointments: AppointmentItem[];
  setAppointments: React.Dispatch<React.SetStateAction<AppointmentItem[]>>;
}

const PIPELINE_STEPS = ["Patient Request", "Verify Data", "Hospital Schedule", "Doctor Slot", "Notify Patient"];

export default function TeamAppointmentDesk({ appointments, setAppointments }: TeamAppointmentDeskProps) {
  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    doctor: "Dr. Farhan Ahmed",
    date: "",
    time: "",
  });

  const advanceAppointmentStep = (id: number) => {
    setAppointments(prev =>
      prev.map(a => (a.id === id && a.step < 4 ? { ...a, step: a.step + 1 } : a))
    );
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.time) return;

    // নতুন অ্যাপয়েন্টমেন্ট অবজেক্ট তৈরি
    const newAppointment: AppointmentItem = {
      id: Date.now(), // Unique ID
      name: formData.name,
      doctor: formData.doctor,
      // Date ফরম্যাট একটু সুন্দর করার জন্য (যেমন: 2026-07-14 থেকে 14 Jul 2026)
      date: new Date(formData.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }),
      // Time ফরম্যাট (যেমন: 14:30 থেকে 02:30 PM)
      time: new Date(`2000-01-01T${formData.time}`).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      step: 0, // প্রথম স্টেপ "Patient Request" থেকে শুরু হবে
    };

    setAppointments(prev => [newAppointment, ...prev]); // একদম উপরে যুক্ত হবে
    setFormData({ name: "", doctor: "Dr. Farhan Ahmed", date: "", time: "" }); // রিসেট
    setIsOpen(false); // মোডাল বন্ধ
  };

  return (
    <div className="space-y-6">
      
      {/* টপ বার: টাইটেল এবং ক্রিয়েট বাটন */}
      <div className="flex items-center justify-between border-b border-indigo-50 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">Operational Desk</h2>
          <p className="text-xs text-slate-400 font-medium">Manage and onboarding new patient paths</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-100 transition-all"
        >
          <Plus size={16} /> Create Appointment
        </button>
      </div>

      {/* ইনফো ব্যানার */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-sm font-semibold flex items-center gap-2">
        <AlertCircle size={16} className="text-amber-600" />
        এখানে কোনো অ্যাপয়েন্টমেন্ট প্রসেস বা আপডেট করা হলে তা সরাসরি Doctor ড্যাশবোর্ডের Grid View-তে লাইভ রিফ্লেক্ট করবে।
      </div>

      {/* পাইপライン লিস্ট */}
      <div className="space-y-4">
        {appointments.map(app => (
          <div key={app.id} className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <h3 className="font-black text-slate-800 text-lg">{app.name}</h3>
                <p className="text-xs text-slate-400 font-medium">{app.doctor} • {app.date} • {app.time}</p>
              </div>
              
              {app.step < 4 ? (
                <button 
                  onClick={() => advanceAppointmentStep(app.id)}
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

            {/* পাইপলাইন প্রোগ্রেস ইন্ডিকেটর */}
            <div className="flex items-center gap-1 overflow-x-auto pt-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden m-4">
            
            {/* Modal Header */}
            <div className="bg-indigo-50 px-6 py-4 flex items-center justify-between border-b border-indigo-100">
              <h3 className="font-black text-indigo-950 text-base">New Appointment Entry</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Patient Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Assign Doctor</label>
                <select
                  value={formData.doctor}
                  onChange={e => setFormData({ ...formData, doctor: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Dr. Farhan Ahmed">Dr. Farhan Ahmed (Cardiology)</option>
                  <option value="Dr. Nusrat Jahan">Dr. Nusrat Jahan (Diabetology)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Time</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:bg-slate-50 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm px-5 py-2.5 rounded-xl shadow-md shadow-indigo-100 transition-all"
                >
                  Submit & Sync
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
