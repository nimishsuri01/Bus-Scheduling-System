import { useState } from 'react';
import { Route, Schedule, Bus, Driver } from '../types';
import { Compass, Info, MapPin, Navigation } from 'lucide-react';

interface RouteMapProps {
  routes: Route[];
  schedules: Schedule[];
  buses: Bus[];
  drivers: Driver[];
}

export default function RouteMap({ routes, schedules, buses, drivers }: RouteMapProps) {
  const [hoveredStop, setHoveredStop] = useState<{ name: string; x: number; y: number; routes: string[] } | null>(null);
  const [hoveredBus, setHoveredBus] = useState<{
    id: string;
    plateNumber: string;
    routeName: string;
    driverName: string;
    progress: number;
    delay: number;
    status: string;
    x: number;
    y: number;
  } | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Helper: Calculate bus position along stops based on its route progress (0 - 100)
  const getBusCoordinates = (route: Route, progress: number) => {
    const stops = route.stops;
    if (stops.length < 2) return { x: 100, y: 100 };
    if (progress <= 0) return { x: stops[0].x, y: stops[0].y };
    if (progress >= 100) return { x: stops[stops.length - 1].x, y: stops[stops.length - 1].y };

    const segments = stops.length - 1;
    const segmentWidth = 100 / segments;
    const currentSegmentIndex = Math.floor(progress / segmentWidth);
    const segmentProgress = (progress % segmentWidth) / segmentWidth;

    const startStop = stops[currentSegmentIndex];
    const endStop = stops[currentSegmentIndex + 1] || stops[stops.length - 1];

    const x = startStop.x + (endStop.x - startStop.x) * segmentProgress;
    const y = startStop.y + (endStop.y - startStop.y) * segmentProgress;

    return { x, y };
  };

  // Compile active bus markers on the map
  const activeBuses = schedules
    .filter(sch => sch.status === 'En Route' || sch.status === 'Delayed')
    .map(sch => {
      const route = routes.find(r => r.id === sch.routeId);
      const bus = buses.find(b => b.id === sch.busId);
      const driver = drivers.find(d => d.id === sch.driverId);

      if (!route || !bus) return null;

      const coords = getBusCoordinates(route, sch.progress);

      return {
        id: sch.id,
        plateNumber: bus.plateNumber,
        routeName: `${route.code} • ${route.name}`,
        driverName: driver ? driver.name : 'Unknown Driver',
        progress: sch.progress,
        delay: sch.delay,
        status: sch.status,
        color: route.color,
        ...coords,
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  // Group all unique stops to draw standard nodes and find what routes pass through them
  const allStops = routes.flatMap(route => 
    route.stops.map(stop => ({
      ...stop,
      routeCode: route.code,
      routeColor: route.color,
      routeId: route.id,
    }))
  );

  const uniqueStops = allStops.reduce((acc, current) => {
    const existing = acc.find(item => item.name === current.name);
    if (existing) {
      if (!existing.routes.includes(current.routeCode)) {
        existing.routes.push(current.routeCode);
      }
    } else {
      acc.push({
        name: current.name,
        x: current.x,
        y: current.y,
        routes: [current.routeCode],
      });
    }
    return acc;
  }, [] as { name: string; x: number; y: number; routes: string[] }[]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6" id="route-map-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600 animate-spin" style={{ animationDuration: '8s' }} />
            Interactive Metro Transit Map
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Pulsing markers show en-route buses. Click a route label below to isolate and inspect individual corridors.
          </p>
        </div>

        {/* Route Filter Labels */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRouteId(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              selectedRouteId === null
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Show All Routes
          </button>
          {routes.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRouteId(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all`}
              style={{
                borderColor: selectedRouteId === r.id ? r.color : '#E2E8F0',
                backgroundColor: selectedRouteId === r.id ? `${r.color}15` : '#FFFFFF',
                color: selectedRouteId === r.id ? r.color : '#475569'
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
              {r.code}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative border border-slate-200 rounded-2xl bg-slate-950 p-4 overflow-hidden shadow-inner flex items-center justify-center min-h-[420px]" id="svg-map-canvas">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

        <svg
          viewBox="0 0 850 420"
          className="w-full max-w-[850px] relative z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DRAW ROUTE PATH LINES */}
          {routes.map(route => {
            const isDimmed = selectedRouteId !== null && selectedRouteId !== route.id;
            if (route.stops.length < 2) return null;

            // Generate SVG path code using stops coordinates
            let pathData = `M ${route.stops[0].x} ${route.stops[0].y}`;
            for (let i = 1; i < route.stops.length; i++) {
              pathData += ` L ${route.stops[i].x} ${route.stops[i].y}`;
            }

            return (
              <g key={route.id} className="transition-opacity duration-300" style={{ opacity: isDimmed ? 0.15 : 0.85 }}>
                {/* Glow layer */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={route.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-25 blur-sm"
                />
                {/* Solid main line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={route.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* DRAW ROUTE STOPS (NODES) */}
          {uniqueStops.map((stop, idx) => {
            // Check if stop is related to selected route
            const isDimmed = selectedRouteId !== null && 
              !routes.find(r => r.id === selectedRouteId)?.stops.some(s => s.name === stop.name);

            return (
              <g
                key={idx}
                className="cursor-pointer transition-opacity duration-300"
                style={{ opacity: isDimmed ? 0.2 : 1 }}
                onMouseEnter={() => setHoveredStop(stop)}
                onMouseLeave={() => setHoveredStop(null)}
              >
                {/* Ripple ring for hover or terminal stations */}
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r="9"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="1.5"
                  className="opacity-40 animate-ping"
                  style={{ animationDuration: '3s', transformOrigin: `${stop.x}px ${stop.y}px` }}
                />
                {/* Outer ring */}
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r="6.5"
                  fill="#090d16"
                  stroke="#fff"
                  strokeWidth="2"
                />
                {/* Inner center dot */}
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r="2.5"
                  fill="#3b82f6"
                />
                {/* Stop Label (rendered inline conditionally or with nice background inside SVG) */}
                <text
                  x={stop.x}
                  y={stop.y - 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none select-none font-sans drop-shadow-sm"
                >
                  {stop.name.length > 15 ? `${stop.name.slice(0, 15)}...` : stop.name}
                </text>
              </g>
            );
          })}

          {/* DRAW BUS VEHICLE MARKERS (PULSING ACTIVE BUSES) */}
          {activeBuses.map(bus => {
            const isDimmed = selectedRouteId !== null && 
              !schedules.find(s => s.id === bus.id && s.routeId === selectedRouteId);

            return (
              <g
                key={bus.id}
                className="cursor-pointer transition-all duration-300"
                style={{ opacity: isDimmed ? 0.15 : 1 }}
                onMouseEnter={() => setHoveredBus(bus)}
                onMouseLeave={() => setHoveredBus(null)}
              >
                {/* Outer radar ping */}
                <circle
                  cx={bus.x}
                  cy={bus.y}
                  r="18"
                  fill="none"
                  stroke={bus.color}
                  strokeWidth="2"
                  className="animate-ping opacity-60"
                  style={{ transformOrigin: `${bus.x}px ${bus.y}px`, animationDuration: '2s' }}
                />
                {/* Bus marker backdrop */}
                <circle
                  cx={bus.x}
                  cy={bus.y}
                  r="11"
                  fill={bus.color}
                  className="shadow-md"
                />
                {/* Bus inner glow indicator */}
                <circle
                  cx={bus.x}
                  cy={bus.y}
                  r="8"
                  fill="#0F172A"
                />
                {/* White Navigation Arrow */}
                <polygon
                  points={`${bus.x},${bus.y - 5} ${bus.x + 4},${bus.y + 4} ${bus.x},${bus.y + 2} ${bus.x - 4},${bus.y + 4}`}
                  fill="#fff"
                  className="origin-center"
                  style={{ transform: `rotate(${bus.progress * 4.5}deg)`, transformOrigin: `${bus.x}px ${bus.y}px` }}
                />
              </g>
            );
          })}
        </svg>

        {/* STOP INFO TOOLTIP PANEL OVERLAY */}
        {hoveredStop && (
          <div
            className="absolute z-20 bg-slate-900/95 border border-slate-700 text-white p-3 rounded-xl shadow-xl space-y-1.5 backdrop-blur-md pointer-events-none max-w-xs animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: `${Math.min(80, Math.max(5, (hoveredStop.x / 850) * 100))}%`,
              top: `${Math.min(75, Math.max(10, (hoveredStop.y / 420) * 100 + 5))}%`
            }}
          >
            <div className="flex items-center gap-1 text-blue-400">
              <MapPin className="w-4 h-4 fill-current" />
              <span className="text-xs font-bold uppercase tracking-wider">Station Details</span>
            </div>
            <h4 className="text-sm font-bold text-white">{hoveredStop.name}</h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-400">Lines:</span>
              {hoveredStop.routes.map(code => (
                <span key={code} className="text-[9px] font-bold bg-slate-850 px-1.5 py-0.5 rounded text-blue-300">
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* BUS INFO TOOLTIP PANEL OVERLAY */}
        {hoveredBus && (
          <div
            className="absolute z-20 bg-slate-950/95 border border-slate-800 text-white p-4 rounded-xl shadow-2xl space-y-2 backdrop-blur-md pointer-events-none w-64 animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: `${Math.min(75, Math.max(5, (hoveredBus.x / 850) * 100))}%`,
              top: `${Math.min(70, Math.max(10, (hoveredBus.y / 420) * 100 - 30))}%`
            }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${hoveredBus.status === 'Delayed' ? 'bg-rose-950 text-rose-300 border border-rose-800/40' : 'bg-blue-950 text-blue-300 border border-blue-800/40'}`}>
                {hoveredBus.status === 'Delayed' ? '⚠️ Delayed' : '⚡ En Route'}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">{hoveredBus.progress}% Complete</span>
            </div>

            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-white leading-tight">{hoveredBus.routeName}</h4>
              <p className="text-[11px] text-slate-400">Bus Unit: <strong className="font-semibold text-white">{hoveredBus.plateNumber}</strong></p>
            </div>

            <div className="pt-1.5 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[10px] text-slate-300">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Captain</span>
                <span className="font-semibold">{hoveredBus.driverName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Schedule Delta</span>
                <span className={`font-semibold ${hoveredBus.delay > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                  {hoveredBus.delay > 0 ? `+${hoveredBus.delay} mins` : 'On Time'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Legend Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-500 font-medium">
            The telemetry coordinates are automatically generated and matched against live dispatcher routes.
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-bold shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            </span>
            Station Nodes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 animate-pulse inline-block"></span>
            Pulsing Transit Bus
          </span>
        </div>
      </div>
    </div>
  );
}
