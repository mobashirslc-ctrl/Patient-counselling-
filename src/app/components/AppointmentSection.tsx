import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { Calendar, Clock, User, CheckCircle, XCircle, Search } from "lucide-react";

interface Appointment {
  id: string;
  name: string;
  time: string;
  date: string;
  type: "Routine Checkup" | "Follow-up" | "Emergency" | "Consultation";
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled";
  phone: string;
  doctor: string;
  chambers: string;
}

const STATUS_COLORS = {
  Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-slate-50 text-slate-700 border-slate-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function AppointmentSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  useEffect(() => {
    const q = query(collection(db, "zee_care_appointments"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
      setAppointments(data);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Appointment["status"]) => {
    try {
      const appointmentRef = doc(db, "zee_care_appointments", id);
      await updateDoc(appointmentRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.name?.toLowerCase().includes(search.toLowerCase()) || apt.id?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "All" || apt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-teal-50 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search appointment or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-400"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["All", "Confirmed", "Pending", "Completed", "Cancelled"].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs font-bold px-3 py-2 rounded-xl border ${
                filterStatus === status ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredAppointments.map(apt => (
          <div key={apt.id} className="bg-white rounded-2xl p-5 border border-teal-50 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800">{apt.name}</h3>
                <p className="text-xs font-bold text-teal-600 mt-1">
                  {apt.doctor ? `Dr. ${apt.doctor}` : "No Doctor Assigned"} | {apt.chambers || "No Chambers"}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                  <span>{apt.date}</span>
                  <span>{apt.time}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${STATUS_COLORS[apt.status]}`}>
                ● {apt.status}
              </span>
              {apt.status === "Pending" && (
                <div className="flex gap-1.5">
                  <button onClick={() => handleStatusChange(apt.id, "Confirmed")} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-4 h-4" /></button>
                  <button onClick={() => handleStatusChange(apt.id, "Cancelled")} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><XCircle className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}