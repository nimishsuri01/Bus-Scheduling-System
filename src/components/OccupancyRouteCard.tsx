import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, Users, UserRound } from 'lucide-react';
import { Bus, Driver, Route, Schedule } from '../types';

interface OccupancyRouteCardProps {
  route: Route;
  bus: Bus;
  driver: Driver;
  schedule: Schedule;
}

export default function OccupancyRouteCard({ route, bus, driver, schedule }: OccupancyRouteCardProps) {
  const [passengerCount, setPassengerCount] = useState(() => {
    const baseline = Math.round((bus.capacity * (schedule.progress || 0)) / 100);
    return Math.max(0, Math.min(bus.capacity, baseline + 6));
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPassengerCount(prev => {
        const step = Math.random() > 0.55 ? 2 : -1;
        const next = prev + step;
        return Math.max(0, Math.min(bus.capacity, next));
      });
    }, 2200);

    return () => window.clearInterval(interval);
  }, [bus.capacity]);

  const occupancyRatio = useMemo(() => passengerCount / bus.capacity, [passengerCount, bus.capacity]);

  const occupancyState = occupancyRatio >= 0.75 ? 'High' : occupancyRatio >= 0.45 ? 'Medium' : 'Low';
  const occupancyColor = occupancyState === 'High' ? 'bg-rose-500' : occupancyState === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';
  const occupancyBorder = occupancyState === 'High' ? 'border-rose-200 bg-rose-50/60' : occupancyState === 'Medium' ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60';
  const badgeText = occupancyState === 'High' ? 'High Load' : occupancyState === 'Medium' ? 'Medium Load' : 'Low Load';

  const shiftRecommendation = occupancyState === 'High'
    ? 'Relief driver recommended'
    : occupancyState === 'Medium'
      ? 'Current driver remains suitable'
      : 'Standby driver optional';

  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition-all ${occupancyBorder}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Live Occupancy</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              <Activity className="h-3 w-3" /> WebSocket stream
            </span>
          </div>
          <h4 className="mt-1 text-sm font-extrabold text-slate-900">{route.code} • {route.name}</h4>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${occupancyColor}`}>
          <span className="h-2 w-2 rounded-full bg-white" />
          {badgeText}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {passengerCount}/{bus.capacity} seats occupied
        </span>
        <span className="font-semibold text-slate-700">{Math.round(occupancyRatio * 100)}%</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all duration-500 ${occupancyColor}`} style={{ width: `${Math.round(occupancyRatio * 100)}%` }} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-slate-500" />
          <span>
            Driver <strong className="text-slate-900">{driver.name}</strong>
          </span>
        </div>
        <span className="font-semibold text-slate-700">{shiftRecommendation}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
        <span>Route {schedule.departureTime} → {schedule.arrivalTime}</span>
        <span className="flex items-center gap-1.5 text-slate-700">
          Match status
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}
