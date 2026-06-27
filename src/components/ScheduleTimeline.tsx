import { useState } from 'react';
import { Schedule, Route, Bus, Driver, BusStatus } from '../types';
import { Search, MapPin, Bus as BusIcon, User, Clock, CheckCircle2, Play, AlertCircle, Ban, RefreshCcw, SlidersHorizontal, ChevronRight } from 'lucide-react';

interface ScheduleTimelineProps {
  schedules: Schedule[];
  routes: Route[];
  buses: Bus[];
  drivers: Driver[];
  onDispatch: (id: string) => void;
  onReportDelay: (id: string, mins: number) => void;
  onResolveDelay: (id: string) => void;
  onComplete: (id: string) => void;
  onResetSchedules: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export default function ScheduleTimeline({
  schedules,
  routes,
  buses,
  drivers,
  onDispatch,
  onReportDelay,
  onResolveDelay,
  onComplete,
  onResetSchedules,
  isSimulating,
  onToggleSimulation
}: ScheduleTimelineProps) {
  const [filterRouteId, setFilterRouteId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Get matching object helpers
  const getRoute = (routeId: string) => routes.find(r => r.id === routeId);
  const getBus = (busId: string) => buses.find(b => b.id === busId);
  const getDriver = (driverId: string) => drivers.find(d => d.id === driverId);

  // Filter logic
  const filteredSchedules = schedules.filter(sch => {
    const route = getRoute(sch.routeId);
    const bus = getBus(sch.busId);
    const driver = getDriver(sch.driverId);

    const matchesRoute = filterRouteId === 'all' || sch.routeId === filterRouteId;
    const matchesStatus = filterStatus === 'all' || sch.status === filterStatus;
    
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = query === '' || 
      (route?.name.toLowerCase().includes(query)) ||
      (route?.code.toLowerCase().includes(query)) ||
      (bus?.plateNumber.toLowerCase().includes(query)) ||
      (driver?.name.toLowerCase().includes(query));

    return matchesRoute && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: BusStatus) => {
    switch (status) {
      case 'Scheduled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Scheduled</span>;
      case 'En Route':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            En Route
          </span>
        );
      case 'Delayed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Delayed
          </span>
        );
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">Completed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6" id="schedule-timeline-section">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Live Schedule Dispatcher</h3>
          <p className="text-xs text-slate-400 font-medium">Coordinate and trigger live bus departures, regulate delays, or toggle auto-dispatch simulations.</p>
        </div>

        {/* Simulation Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onResetSchedules}
            className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 flex items-center gap-1.5 text-xs font-bold transition-all"
            title="Reset system back to default state"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Reset Initial State
          </button>

          <button
            onClick={onToggleSimulation}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 border transition-all ${
              isSimulating
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-white animate-ping' : 'bg-slate-400'}`} />
            {isSimulating ? 'Active Auto-Telemetry' : 'Start Auto-Telemetry'}
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by route code, driver, bus plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl text-sm transition-all text-slate-800 font-medium"
            />
          </div>

          {/* Filter toggle trigger */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              showFilters || filterRouteId !== 'all' || filterStatus !== 'all'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Advanced Filters
            {(filterRouteId !== 'all' || filterStatus !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>
        </div>

        {/* Collapsible advanced filters panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-150 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Route filter */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by Route Corridor</label>
              <select
                value={filterRouteId}
                onChange={(e) => setFilterRouteId(e.target.value)}
                className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Corridors</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by Transit Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="En Route">En Route</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Schedules */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="schedules-grid">
        {filteredSchedules.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700">No Matching Schedules Found</h4>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query to find your trips.</p>
            </div>
          </div>
        ) : (
          filteredSchedules.map(sch => {
            const route = getRoute(sch.routeId);
            const bus = getBus(sch.busId);
            const driver = getDriver(sch.driverId);

            if (!route || !bus || !driver) return null;

            return (
              <div
                key={sch.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-sm transition-all hover:shadow-md space-y-4 flex flex-col justify-between"
              >
                {/* Route Header Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded text-[11px] font-extrabold text-white uppercase"
                          style={{ backgroundColor: route.color }}
                        >
                          {route.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate" title={route.name}>
                          {route.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {route.stops[0].name} <ChevronRight className="inline-block w-3 h-3 mx-0.5 text-slate-400" /> {route.stops[route.stops.length - 1].name}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(sch.status)}
                    </div>
                  </div>

                  {/* Segment/Time Details */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Depart / Arrive</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {sch.departureTime} - {sch.arrivalTime}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Bus / Capacity</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <BusIcon className="w-3.5 h-3.5 text-slate-400" />
                        {bus.plateNumber} ({bus.capacity})
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Captain</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {driver.name.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Driving Progress Section */}
                {(sch.status === 'En Route' || sch.status === 'Delayed' || sch.status === 'Completed') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span>Live Progress</span>
                      <span className="font-extrabold text-slate-800">{sch.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${sch.progress}%`,
                          backgroundColor: route.color
                        }}
                      />
                    </div>
                    {/* Current Stop Tagging */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span>{route.stops[sch.currentStopIndex]?.name || 'Origin'}</span>
                      {sch.currentStopIndex < route.stops.length - 1 ? (
                        <span>Next: {route.stops[sch.currentStopIndex + 1]?.name}</span>
                      ) : (
                        <span className="text-emerald-600">Arrived</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Operational Command Controller Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  {/* Delay summary readout if applicable */}
                  <div className="text-xs">
                    {sch.delay > 0 ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                        Schedule Delta: +{sch.delay}m
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        On-Schedule
                      </span>
                    )}
                  </div>

                  {/* Actions buttons based on status */}
                  <div className="flex items-center gap-2">
                    {sch.status === 'Scheduled' && (
                      <button
                        onClick={() => onDispatch(sch.id)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-all border border-blue-700"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Dispatch Route
                      </button>
                    )}

                    {(sch.status === 'En Route' || sch.status === 'Delayed') && (
                      <>
                        {/* Delay simulation toggle trigger */}
                        <button
                          onClick={() => onReportDelay(sch.id, 5)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all"
                        >
                          +5m Delay
                        </button>
                        {sch.delay > 0 && (
                          <button
                            onClick={() => onResolveDelay(sch.id)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-all"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => onComplete(sch.id)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Completed
                        </button>
                      </>
                    )}

                    {sch.status === 'Completed' && (
                      <span className="text-xs text-slate-400 font-semibold italic flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                        Arrived & Dismissed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}