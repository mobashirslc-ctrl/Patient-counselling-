import React, { useState } from "react";
import { Calendar, Clock, User, Plus, CheckCircle, XCircle, Search, Filter } from "lucide-react";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  date: string;
  type: "Routine Checkup" | "Follow-up" | "Emergency" | "Consultation";
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled";
  phone: string;
}

const INIT_APPOINTMENTS: Appointment[] = [
  { id: "APT-001", patientName: "Rahim Uddin", time: "10:30 AM", date: "2026-07-13", type: "Follow-up", status: "Confirmed", phone: "+880 1711-223344" },
  { id: "APT-002", patientName: "Karim Ahmed", time: "11:15 AM", date: "2026-07-13", type: "Routine Checkup", status: "Confirmed", phone: "+880 1812-334455" },
  { id: "APT-003", patientName: "Sultana Begum", time: "02:00 PM", date: "2026-07-13", type: "Emergency", status: "Pending", phone: "+880 1913-445566" },
  { id: "APT-004", patientName: "Nusrat Jahan", time: "04:30 PM", date: "2026-07-14", type: "Consultation", status: "Confirmed", phone: "+880 1514-556677" },
];

const TYPE_COLORS = {
  "Routine Checkup": "bg-blue-50 text-blue-600 border-blue-100",
  "Follow-up": "bg-teal-50 text-teal-600 border-teal-100",
  "Emergency": "bg-rose-50 text-rose-600 border-rose-100",
  "Consultation": "bg-purple-50 text-purple-600 border-purple-100",
};

const STATUS_COLORS = {
  Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-slate-50 text-slate-700 border-slate-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function AppointmentSection() {
  const [appointments, setAppointments] = useState<Appointment[]>(INIT_APPOINTMENTS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  // Status পরিবর্তন করার ফাংশন
  const handleStatusChange = (id: string, newStatus: Appointment["status"]) => {
    setAppointments(prev =>
      prev.map(apt => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
  };

  // ফিল্টারিং লজিক
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.patientName.toLowerCase().includes(search.toLowerCase()) || apt.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "All" || apt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* ─── Top Stats ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-teal-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Today's Total</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {appointments.filter(a => a.date === "2026-07-13").length} Slots
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-teal-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Pending Action</p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {appointments.filter(a => a.status === "Pending").length} Requests
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-teal-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Completed Today</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {appointments.filter(a => a.status === "Completed").length} Patients
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── Filters & Search ─── */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-teal-50 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search appointment or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-400 transition-colors"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["All", "Confirmed", "Pending", "Completed", "Cancelled"].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs font-bold px-3 py-2 rounded-xl transition-all border ${
                filterStatus === status
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Appointments List ─── */}
      <div className="space-y-3">
        {filteredAppointments.map(apt => (
          <div
            key={apt.id}
            className="bg-white rounded-2xl p-5 border border-teal-50 hover:shadow-md hover:shadow-teal-100/40 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-center flex-shrink-0 text-teal-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-slate-800">{apt.patientName}</h3>
                  <span className="text-xs font-mono text-slate-300">{apt.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${TYPE_COLORS[apt.type]}`}>
                    {apt.type}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400 font-['DM_Sans',sans-serif]">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-teal-500" /> {apt.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-teal-500" /> {apt.time}</span>
                  <span className="text-slate-500 font-medium">{apt.phone}</span>
                </div>
              </div>
            </div>

            {/* Actions and Badges */}
            <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-50">
              <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${STATUS_COLORS[apt.status]}`}>
                ● {apt.status}
              </span>

              {apt.status === "Pending" && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleStatusChange(apt.id, "Confirmed")}
                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                    title="Accept Appointment"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStatusChange(apt.id, "Cancelled")}
                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                    title="Decline Appointment"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}

              {apt.status === "Confirmed" && (
                <button
                  onClick={() => handleStatusChange(apt.id, "Completed")}
                  className="text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition-colors"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-teal-100 text-slate-300">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30 text-teal-600" />
            <p className="font-bold text-slate-400">No appointments found</p>
            <p className="text-xs text-slate-400 font-['DM_Sans',sans-serif]">Try changing the filter or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}
