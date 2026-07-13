import React from "react";
import { ChevronRight, CheckCircle, AlertCircle } from "lucide-react";

// টাইপ ডেফিনিশন
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
  
  const advanceAppointmentStep = (id: number) => {
    setAppointments(prev =>
      prev.map(a => (a.id === id && a.step < 4 ? { ...a, step: a.step + 1 } : a))
    );
  };

  return (
    <div className="space-y-6">
      {/* ইনফো ব্যানার */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-sm font-semibold flex items-center gap-2">
        <AlertCircle size={16} className="text-amber-600" />
        এখানে কোনো অ্যাপয়েন্টমেন্ট প্রসেস বা আপডেট করা হলে তা সরাসরি Doctor ড্যাশবোর্ডের Grid View-তে লাইভ রিফ্লেক্ট করবে।
      </div>

      {/* পাইপলাইন লিস্ট */}
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
    </div>
  );
}
