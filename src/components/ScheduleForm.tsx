import React, { useState, useEffect } from 'react';
import { Route, Bus, Driver, Schedule } from '../types';
import { Calendar, Clock, Compass, Plus, User, AlertCircle, Sparkles, Check, CheckCircle2 } from 'lucide-react';

interface ScheduleFormProps {
  routes: Route[];
  buses: Bus[];
  drivers: Driver[];
  onCreateSchedule: (scheduleData: Omit<Schedule, 'id' | 'status' | 'progress' | 'delay' | 'currentStopIndex'>) => void;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ScheduleForm({
  routes,
  buses,
  drivers,
  onCreateSchedule
}: ScheduleFormProps) {
  const [routeId, setRouteId] = useState<string>('');
  const [busId, setBusId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('08:00');
  const [arrivalTime, setArrivalTime] = useState<string>('08:45');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  // Filter for valid units
  const availableBuses = buses.filter(b => b.status === 'Active');
  const availableDrivers = drivers.filter(d => d.status === 'On Duty');

  // Auto-calculate arrival time based on departure and route duration!
  useEffect(() => {
    if (!routeId || !departureTime) return;

    const selectedRoute = routes.find(r => r.id === routeId);
    if (!selectedRoute) return;

    const [hoursStr, minutesStr] = departureTime.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    const totalMinutes = hours * 60 + minutes + selectedRoute.duration;
    const finalHours = Math.floor(totalMinutes / 60) % 24;
    const finalMinutes = totalMinutes % 60;

    const formattedHours = String(finalHours).padStart(2, '0');
    const formattedMinutes = String(finalMinutes).padStart(2, '0');

    setArrivalTime(`${formattedHours}:${formattedMinutes}`);
  }, [routeId, departureTime, routes]);

  // Set default selection values once arrays load
  useEffect(() => {
    if (routes.length > 0 && !routeId) setRouteId(routes[0].id);
    if (availableBuses.length > 0 && !busId) setBusId(availableBuses[0].id);
    if (availableDrivers.length > 0 && !driverId) setDriverId(availableDrivers[0].id);
  }, [routes, availableBuses, availableDrivers, routeId, busId, driverId]);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!routeId) {
      setErrorMsg('Please select an active bus corridor route.');
      return;
    }
    if (!busId) {
      setErrorMsg('No active bus unit selected. Ensure a bus is set to "Active" first.');
      return;
    }
    if (!driverId) {
      setErrorMsg('No driver selected. Ensure a driver is marked "On Duty" first.');
      return;
    }
    if (selectedDays.length === 0) {
      setErrorMsg('Please choose at least one active operational week day.');
      return;
    }

    onCreateSchedule({
      busId,
      routeId,
      driverId,
      departureTime,
      arrivalTime,
      days: selectedDays,
    });

    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
    }, 3000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5" id="schedule-creation-form">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
          Dispatch New Custom Run
        </h3>
        <p className="text-xs text-slate-400 font-medium">
          Program a new transit dispatch schedule by pairing available drivers, buses, and corridors.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Route Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            Select Corridor Route
          </label>
          <select
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-xl text-xs font-bold text-slate-700"
          >
            {routes.map(r => (
              <option key={r.id} value={r.id}>
                {r.code} - {r.name} ({r.distance} km, {r.duration} mins)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bus Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              Bus Unit
            </label>
            {availableBuses.length === 0 ? (
              <div className="p-2.5 rounded-xl border border-amber-155 bg-amber-50 text-[11px] font-bold text-amber-800 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>No active buses. Set In-Depot/Maintenance units to &quot;Active&quot; in Fleet manager first.</span>
              </div>
            ) : (
              <select
                value={busId}
                onChange={(e) => setBusId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-xl text-xs font-bold text-slate-700"
              >
                {availableBuses.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.model} ({b.plateNumber}) • {b.fuelLevel}% {b.fuelType === 'Electric' ? 'Charge' : 'Fuel'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Driver Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Assigned Driver
            </label>
            {availableDrivers.length === 0 ? (
              <div className="p-2.5 rounded-xl border border-amber-155 bg-amber-50 text-[11px] font-bold text-amber-800 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>No drivers available. Turn Off-Duty drivers to &quot;On Duty&quot; in Fleet manager first.</span>
              </div>
            ) : (
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-xl text-xs font-bold text-slate-700"
              >
                {availableDrivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} (⭐ {d.rating})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Departure Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Departure Time
            </label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-xl text-xs font-bold text-slate-700"
            />
          </div>

          {/* Estimated Arrival Readout */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Estimated Arrival (Auto)
            </label>
            <div className="w-full p-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5">
              <span>{arrivalTime}</span>
              <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase font-sans">Calc ok</span>
            </div>
          </div>
        </div>

        {/* Days of Week Selectors */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Operational Days
          </label>
          <div className="flex flex-wrap gap-1.5" id="days-selector">
            {DAYS_OF_WEEK.map(day => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button & Errors */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-xs font-bold text-rose-700 animate-shake">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-fade-in">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              <span>Run successfully scheduled and dispatched!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={availableBuses.length === 0 || availableDrivers.length === 0}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Schedule Run
          </button>
        </div>
      </form>
    </div>
  );
}