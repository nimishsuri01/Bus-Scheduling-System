import { Bus, Driver, Schedule, Route } from '../types';
import { Bus as BusIcon, Route as RouteIcon, Users, Clock, AlertTriangle, Battery, ShieldAlert, CheckCircle2 } from 'lucide-react';
import OccupancyRouteCard from './OccupancyRouteCard';

interface DashboardOverviewProps {
  buses: Bus[];
  drivers: Driver[];
  schedules: Schedule[];
  routes: Route[];
  onSelectSchedule: (id: string) => void;
}

export default function DashboardOverview({
  buses,
  drivers,
  schedules,
  routes,
  onSelectSchedule
}: DashboardOverviewProps) {
  // Stat calculations
  const activeBuses = buses.filter(b => b.status === 'Active').length;
  const maintenanceBuses = buses.filter(b => b.status === 'Maintenance').length;
  const onDutyDrivers = drivers.filter(d => d.status === 'On Duty').length;
  const runningSchedules = schedules.filter(s => s.status === 'En Route' || s.status === 'Delayed');
  
  // On-time performance: completed or active with 0 delay / total running or completed
  const activeAndCompleted = schedules.filter(s => s.status === 'Completed' || s.status === 'En Route' || s.status === 'Delayed');
  const onTimeCount = activeAndCompleted.filter(s => s.delay === 0).length;
  const onTimePerformance = activeAndCompleted.length > 0 
    ? Math.round((onTimeCount / activeAndCompleted.length) * 100) 
    : 100;

  // Find critical alerts: low fuel/battery (< 25%) or delayed trips
  const lowFuelBuses = buses.filter(b => b.fuelLevel < 25 && b.status === 'Active');
  const delayedSchedules = schedules.filter(s => s.status === 'Delayed');

  return (
    <div className="space-y-6" id="dashboard-overview">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Fleet Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between" id="metric-fleet-status">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Fleet</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeBuses}</span>
              <span className="text-xs font-medium text-slate-400">/ {buses.length} units</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{maintenanceBuses} in maintenance</span>
            </div>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <BusIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Live Operations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between" id="metric-live-ops">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Trips</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{runningSchedules.length}</span>
              <span className="text-xs font-medium text-slate-400">in transit</span>
            </div>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Tracking Enabled
            </span>
          </div>
          <div className="p-3.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <RouteIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Drivers On-Duty */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between" id="metric-drivers-duty">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Crew Staffing</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{onDutyDrivers}</span>
              <span className="text-xs font-medium text-slate-400">/ {drivers.length} drivers</span>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {drivers.filter(d => d.status === 'On Break').length} on rest breaks
            </span>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: On-Time Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between" id="metric-on-time">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">On-Time Performance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{onTimePerformance}%</span>
            </div>
            <span className={`text-xs font-semibold ${onTimePerformance >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
              Target: &gt;90% average
            </span>
          </div>
          <div className={`p-3.5 rounded-xl border ${onTimePerformance >= 90 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Smart Driver-Shift Matching & Live Occupancy */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm" id="smart-driver-shift-matching">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Smart Driver-Shift Matching</h3>
            <p className="text-xs text-slate-400 font-medium">Live occupancy tracking for each active route and driver pairing.</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">WebSocket passenger flow</span>
        </div>

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
          {runningSchedules.length === 0 ? (
            <div className="xl:col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
              No active routes to display yet. Dispatch a trip to start live occupancy monitoring.
            </div>
          ) : (
            runningSchedules.slice(0, 2).map(sch => {
              const bus = buses.find(b => b.id === sch.busId);
              const route = routes.find(r => r.id === sch.routeId);
              const driver = drivers.find(d => d.id === sch.driverId);

              if (!bus || !route || !driver) return null;

              return (
                <OccupancyRouteCard
                  key={sch.id}
                  route={route}
                  bus={bus}
                  driver={driver}
                  schedule={sch}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Operational Alerts & Diagnostics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="alerts-and-diagnostics">
        {/* Dynamic Alerts Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              Live Operations Room & Alerts
            </h3>
            <span className="text-xs bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-bold text-slate-600">
              {lowFuelBuses.length + delayedSchedules.length} unresolved alerts
            </span>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {lowFuelBuses.length === 0 && delayedSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">All Operations Clear</h4>
                  <p className="text-xs text-slate-400 mt-0.5">No transit delays or fuel shortages reported.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Delayed Bus Alerts */}
                {delayedSchedules.map(sch => {
                  const bus = buses.find(b => b.id === sch.busId);
                  const route = routes.find(r => r.id === sch.routeId);
                  return (
                    <div
                      key={sch.id}
                      onClick={() => onSelectSchedule(sch.id)}
                      className="group cursor-pointer hover:bg-rose-50/50 p-4 rounded-xl border border-rose-200 bg-rose-50/10 flex items-start gap-3 transition-all"
                    >
                      <div className="p-2 bg-rose-100 text-rose-600 rounded-lg mt-0.5 group-hover:scale-105 transition-transform border border-rose-200">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                            Transit Delay
                          </span>
                          <span className="text-xs text-slate-500 font-mono font-bold">+{sch.delay} mins</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {route?.code} - {route?.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Bus <strong className="text-slate-800 font-bold">{bus?.plateNumber}</strong> underperforming departure. Scheduled for {sch.departureTime}, currently delayed.
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Low Fuel Alerts */}
                {lowFuelBuses.map(bus => (
                  <div
                    key={bus.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/10 flex items-start gap-3"
                  >
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg mt-0.5 border border-amber-200">
                      <Battery className="w-4 h-4 animate-bounce" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          Critical Energy Level
                        </span>
                        <span className="text-xs text-slate-600 font-bold">{bus.fuelLevel}% {bus.fuelType === 'Electric' ? 'Charge' : 'Fuel'}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {bus.model} ({bus.plateNumber})
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Severe low {bus.fuelType === 'Electric' ? 'charge' : 'fuel'} level. Action required: schedule return to Depot or allocate maintenance.
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Live Active Trips Overview Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">En Route Progress</h3>
            <p className="text-xs text-slate-400 font-medium">Live operational progress of transit units.</p>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[220px] flex-1 my-3 pr-1">
            {runningSchedules.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col justify-center items-center h-full">
                <p className="text-xs text-slate-400 font-semibold">No buses currently en route.</p>
                <p className="text-[10px] text-slate-400 mt-1">Use the Schedules tab to dispatch.</p>
              </div>
            ) : (
              runningSchedules.map(sch => {
                const bus = buses.find(b => b.id === sch.busId);
                const route = routes.find(r => r.id === sch.routeId);
                return (
                  <div key={sch.id} className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: route?.color || '#000' }}></span>
                        {route?.code}
                      </span>
                      <span className="text-slate-500 font-mono font-bold">
                        {sch.progress}% • {bus?.plateNumber}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-inner"
                        style={{
                          width: `${sch.progress}%`,
                          backgroundColor: route?.color || '#10B981'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 font-bold gap-2">
            <span>FUEL RATIOS</span>
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Electric
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Hybrid
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span> Diesel
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
