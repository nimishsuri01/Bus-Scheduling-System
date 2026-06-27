import { useState } from 'react';
import { Route, Schedule, Bus, Driver } from '../types';
import { MapPin, Clock, User, Bus as BusIcon, ArrowRight, Activity, Bell } from 'lucide-react';

interface LiveTrackingBoardProps {
  schedules: Schedule[];
  routes: Route[];
  buses: Bus[];
  drivers: Driver[];
}

export default function LiveTrackingBoard({
  schedules,
  routes,
  buses,
  drivers
}: LiveTrackingBoardProps) {
  const activeSchedules = schedules.filter(
    s => s.status === 'En Route' || s.status === 'Delayed'
  );
  
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    activeSchedules.length > 0 ? activeSchedules[0].id : ''
  );

  // If previous selection became inactive, fallback to first active
  const activeSch = activeSchedules.find(s => s.id === selectedScheduleId) || activeSchedules[0];

  // Helper to parse HH:MM and add minutes
  const calculateETA = (departureTime: string, elapsedMinutes: number) => {
    try {
      const [hoursStr, minutesStr] = departureTime.split(':');
      const date = new Date();
      date.setHours(parseInt(hoursStr, 10));
      date.setMinutes(parseInt(minutesStr, 10));
      date.setSeconds(0);
      
      date.setMinutes(date.getMinutes() + elapsedMinutes);
      
      let hrs = date.getHours();
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12;
      hrs = hrs ? hrs : 12; // hour 0 should be 12
      const mins = String(date.getMinutes()).padStart(2, '0');
      
      return `${String(hrs).padStart(2, '0')}:${mins} ${ampm}`;
    } catch {
      return departureTime;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6" id="live-tracking-board">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
            Real-Time Stop ETA Tracker
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Monitor real-time stop-by-stop ETAs, adjusted dynamically for active buses and transit delays.
          </p>
        </div>

        {/* Bus Selector */}
        {activeSchedules.length > 0 && (
          <select
            value={activeSch?.id || ''}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-bold text-slate-700 max-w-xs"
          >
            {activeSchedules.map(sch => {
              const r = routes.find(route => route.id === sch.routeId);
              const b = buses.find(bus => bus.id === sch.busId);
              return (
                <option key={sch.id} value={sch.id}>
                  {r?.code} • {b?.plateNumber} ({sch.status})
                </option>
              );
            })}
          </select>
        )}
      </div>

      {activeSchedules.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <BusIcon className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-700">No Active Runs Tracking</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Go to the <strong>Schedules Dispatch</strong> tab and dispatch a scheduled bus corridor run to see real-time tracking and live ETAs.
            </p>
          </div>
        </div>
      ) : (
        activeSch && (() => {
          const route = routes.find(r => r.id === activeSch.routeId);
          const bus = buses.find(b => b.id === activeSch.busId);
          const driver = drivers.find(d => d.id === activeSch.driverId);
          if (!route) return null;

          const stopsCount = route.stops.length;
          const segmentMinutes = stopsCount > 1 ? Math.round(route.duration / (stopsCount - 1)) : 0;

          return (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="tracking-detail-layout">
              {/* Bus Details Summary Box (4 cols) */}
              <div className="md:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2.5 py-0.5 rounded uppercase">
                      {route.code} Line
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeSch.status === 'Delayed' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {activeSch.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">{route.name}</h4>

                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Assigned Bus:</span>
                      <strong className="text-slate-800 font-semibold">{bus?.model} ({bus?.plateNumber})</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Battery/Fuel:</span>
                      <span className={`font-bold ${bus && bus.fuelLevel < 25 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                        {bus?.fuelLevel}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Driver:</span>
                      <strong className="text-slate-800 font-semibold">{driver?.name}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Active Delay:</span>
                      <strong className={`font-bold ${activeSch.delay > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {activeSch.delay > 0 ? `+${activeSch.delay} min` : 'None (On Time)'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="space-y-1 pt-3 border-t border-slate-200">
                  <div className="flex justify-between text-[11px] text-slate-500 font-bold uppercase">
                    <span>Route progress</span>
                    <span>{activeSch.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${activeSch.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stop ETA Vertical Timeline (8 cols) */}
              <div className="md:col-span-8 space-y-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Transit stops & arrival estimations
                </span>

                <div className="relative pl-6 space-y-5 border-l-2 border-slate-100">
                  {route.stops.map((stop, index) => {
                    // Check if stop has already been passed
                    const isPassed = index < activeSch.currentStopIndex;
                    const isCurrent = index === activeSch.currentStopIndex;
                    const isUpcoming = index > activeSch.currentStopIndex;

                    // Calculate ETA in minutes based on segment index and delay
                    const baseMinutes = index * segmentMinutes;
                    const totalMinutes = baseMinutes + activeSch.delay;
                    const etaTime = calculateETA(activeSch.departureTime, totalMinutes);

                    return (
                      <div key={stop.name} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Bullet point nodes */}
                        <div
                          className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                            isPassed
                              ? 'border-slate-300 bg-slate-100 text-slate-400'
                              : isCurrent
                              ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                          {isPassed && <span className="w-1 h-1 rounded-full bg-slate-400" />}
                        </div>

                        {/* Stop Name & Info */}
                        <div className="space-y-0.5">
                          <h5 className={`text-xs font-bold transition-colors ${isPassed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {stop.name}
                          </h5>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-blue-600 font-extrabold animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Currently Approaching Stop
                            </span>
                          )}
                          {isPassed && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Departed
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Scheduled Segment
                            </span>
                          )}
                        </div>

                        {/* ETA Timestamp & Status badge */}
                        <div className="flex items-center gap-3 text-right">
                          <div className="space-y-0.5">
                            <span className={`block text-xs font-mono font-bold ${isPassed ? 'text-slate-400' : 'text-slate-700'}`}>
                              {etaTime}
                            </span>
                            {activeSch.delay > 0 && !isPassed && (
                              <span className="text-[9px] text-rose-500 font-bold block bg-rose-50 border border-rose-100 px-1 py-0.2 rounded uppercase">
                                +{activeSch.delay}m delay
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
