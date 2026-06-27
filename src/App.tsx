import { useState, useEffect, useRef } from 'react';
import { Bus, Driver, Route, Schedule, Booking, Subscription, LiveNotification } from './types';
import {
  INITIAL_BUSES,
  INITIAL_DRIVERS,
  INITIAL_ROUTES,
  INITIAL_SCHEDULES,
  INITIAL_BOOKINGS
} from './data/initialData';

import DashboardOverview from './components/DashboardOverview';
import RouteMap from './components/RouteMap';
import ScheduleTimeline from './components/ScheduleTimeline';
import ScheduleForm from './components/ScheduleForm';
import FleetManager from './components/FleetManager';
import BookingSystem from './components/BookingSystem';
import LiveTrackingBoard from './components/LiveTrackingBoard';
import SubscriptionHub from './components/SubscriptionHub';

import { LayoutDashboard, CalendarDays, Bus as BusIcon, Ticket, Clock, RefreshCcw, Bell } from 'lucide-react';

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedules' | 'fleet' | 'bookings'>('dashboard');

  // Core Persistent State
  const [buses, setBuses] = useState<Bus[]>(() => {
    const saved = localStorage.getItem('transit_buses');
    return saved ? JSON.parse(saved) : INITIAL_BUSES;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('transit_drivers');
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem('transit_schedules');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('transit_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  // Subscriptions & live notifications state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('transit_subscriptions');
    return saved ? JSON.parse(saved) : [
      { id: 'sub-1', type: 'route', targetId: 'route-1', targetName: '101 Line - West Corridor', alertOnDelays: true, alertOnApproaching: true }
    ];
  });

  const [notifications, setNotifications] = useState<LiveNotification[]>(() => {
    const saved = localStorage.getItem('transit_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [toasts, setToasts] = useState<LiveNotification[]>([]);

  // Constants
  const routes: Route[] = INITIAL_ROUTES;

  // Real-Time System Clock State
  const [systemTime, setSystemTime] = useState<string>('');

  // Auto-Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('transit_buses', JSON.stringify(buses));
  }, [buses]);

  useEffect(() => {
    localStorage.setItem('transit_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('transit_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('transit_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('transit_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('transit_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // System clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setSystemTime(`${hrs}:${mins}:${secs}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Secure dynamic notification creator helper
  const addNotification = (
    title: string,
    message: string,
    type: 'delay' | 'approaching' | 'cancellation' | 'info' | 'success'
  ) => {
    const newNotif: LiveNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      read: false
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 40));
    setToasts(prev => [...prev, newNotif]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 4500);
  };

  // Automated Progress Simulator (Ticks en-route buses)
  useEffect(() => {
    if (isSimulating) {
      simIntervalRef.current = setInterval(() => {
        setSchedules(prevSchedules => {
          return prevSchedules.map(sch => {
            if (sch.status === 'En Route' || sch.status === 'Delayed') {
              const route = routes.find(r => r.id === sch.routeId);
              const stopsCount = route ? route.stops.length : 1;
              const nextProgress = sch.progress + Math.floor(Math.random() * 4) + 2; // Increment by 2-5%

              if (nextProgress >= 100) {
                // Trip complete - free the associated bus and set status
                setBuses(prevBuses =>
                  prevBuses.map(b => (b.id === sch.busId ? { ...b, status: 'In Depot', fuelLevel: Math.max(10, b.fuelLevel - 15) } : b))
                );

                if (route) {
                  const finalStop = route.stops[stopsCount - 1]?.name || 'Terminus';
                  const hasSub = subscriptions.some(sub => sub.type === 'route' && sub.targetId === route.id);
                  if (hasSub) {
                    addNotification(
                      'Trip Completed',
                      `✅ Coach on ${route.code} Line has safely arrived at final terminus '${finalStop}'.`,
                      'success'
                    );
                  }
                }

                return {
                  ...sch,
                  progress: 100,
                  status: 'Completed',
                  currentStopIndex: stopsCount - 1
                };
              }

              // Update index based on progress segments
              const currentStopIndex = Math.min(
                stopsCount - 1,
                Math.floor((nextProgress / 100) * stopsCount)
              );

              // Detect stop advancement
              if (currentStopIndex !== sch.currentStopIndex && route) {
                const stopName = route.stops[currentStopIndex]?.name;
                const hasSub = subscriptions.some(
                  sub => (sub.type === 'route' && sub.targetId === route.id && sub.alertOnApproaching) ||
                         (sub.type === 'stop' && sub.targetId === stopName && sub.alertOnApproaching)
                );

                if (hasSub) {
                  addNotification(
                    'Coach Approaching',
                    `🔔 Bus Coach on ${route.code} Line is approaching station stop '${stopName}'!`,
                    'approaching'
                  );
                }
              }

              return {
                ...sch,
                progress: nextProgress,
                currentStopIndex
              };
            }
            return sch;
          });
        });
      }, 3500);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating, routes, subscriptions]);

  // Handlers
  const handleDispatch = (scheduleId: string) => {
    setSchedules(prev =>
      prev.map(sch => {
        if (sch.id === scheduleId) {
          const route = routes.find(r => r.id === sch.routeId);
          if (route) {
            const firstStop = route.stops[0]?.name || 'Origin';
            const hasSub = subscriptions.some(sub => sub.type === 'route' && sub.targetId === route.id);
            if (hasSub) {
              addNotification(
                'Corridor Dispatched',
                `⚡ Dispatch Alert: Coach on ${route.code} Line has left ${firstStop} Terminal.`,
                'success'
              );
            }
          }
          // Lock bus status to active
          setBuses(prevBuses =>
            prevBuses.map(b => (b.id === sch.busId ? { ...b, status: 'Active' } : b))
          );
          return { ...sch, status: 'En Route', progress: 1, currentStopIndex: 0 };
        }
        return sch;
      })
    );
  };

  const handleReportDelay = (scheduleId: string, mins: number) => {
    setSchedules(prev =>
      prev.map(sch => {
        if (sch.id === scheduleId) {
          const route = routes.find(r => r.id === sch.routeId);
          if (route) {
            const hasSub = subscriptions.some(
              sub => (sub.type === 'route' && sub.targetId === route.id && sub.alertOnDelays) ||
                     (sub.type === 'stop' && route.stops.some(s => s.name === sub.targetId) && sub.alertOnDelays)
            );
            if (hasSub) {
              addNotification(
                'Corridor Congested',
                `⚠️ Delay Alert: ${route.code} Line is delayed by +${sch.delay + mins}m due to traffic congestion.`,
                'delay'
              );
            }
          }
          return { ...sch, status: 'Delayed', delay: sch.delay + mins };
        }
        return sch;
      })
    );
  };

  const handleResolveDelay = (scheduleId: string) => {
    setSchedules(prev =>
      prev.map(sch => {
        if (sch.id === scheduleId) {
          const route = routes.find(r => r.id === sch.routeId);
          if (route) {
            const hasSub = subscriptions.some(sub => sub.type === 'route' && sub.targetId === route.id);
            if (hasSub) {
              addNotification(
                'Corridor Clear',
                `⚡ Congestion cleared for Corridor ${route.code}. Normal runtime resume.`,
                'success'
              );
            }
          }
          return { ...sch, status: 'En Route', delay: 0 };
        }
        return sch;
      })
    );
  };

  const handleComplete = (scheduleId: string) => {
    setSchedules(prev =>
      prev.map(sch => {
        if (sch.id === scheduleId) {
          // Send bus back to depot
          setBuses(prevBuses =>
            prevBuses.map(b => (b.id === sch.busId ? { ...b, status: 'In Depot', fuelLevel: Math.max(10, b.fuelLevel - 15) } : b))
          );
          const route = routes.find(r => r.id === sch.routeId);
          return {
            ...sch,
            status: 'Completed',
            progress: 100,
            currentStopIndex: route ? route.stops.length - 1 : 0
          };
        }
        return sch;
      })
    );
  };

  const handleCreateSchedule = (scheduleData: Omit<Schedule, 'id' | 'status' | 'progress' | 'delay' | 'currentStopIndex'>) => {
    const newSchedule: Schedule = {
      ...scheduleData,
      id: `sch-${Date.now()}`,
      status: 'Scheduled',
      progress: 0,
      delay: 0,
      currentStopIndex: 0
    };
    setSchedules(prev => [newSchedule, ...prev]);
  };

  const handleUpdateBusStatus = (busId: string, status: 'Active' | 'Maintenance' | 'In Depot') => {
    setBuses(prev => prev.map(b => (b.id === busId ? { ...b, status } : b)));
  };

  const handleChargeBus = (busId: string) => {
    setBuses(prev => prev.map(b => (b.id === busId ? { ...b, fuelLevel: 100 } : b)));
  };

  const handleUpdateDriverStatus = (driverId: string, status: 'On Duty' | 'Off Duty' | 'On Break') => {
    setDrivers(prev => prev.map(d => (d.id === driverId ? { ...d, status } : d)));
  };

  const handleAddBooking = (bookingData: Omit<Booking, 'id' | 'ticketCode'>) => {
    const ticketCode = `TKT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const newBooking: Booking = {
      ...bookingData,
      id: `bkg-${Date.now()}`,
      ticketCode
    };
    setBookings(prev => [newBooking, ...prev]);
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  const handleAddSubscription = (subData: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = {
      ...subData,
      id: `sub-${Date.now()}`
    };
    setSubscriptions(prev => [newSub, ...prev]);
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleResetSchedules = () => {
    setBuses(INITIAL_BUSES);
    setDrivers(INITIAL_DRIVERS);
    setSchedules(INITIAL_SCHEDULES);
    setBookings(INITIAL_BOOKINGS);
  };

  // Helper function to allow clicking alerts to auto-route schedule triggers
  const handleSelectScheduleFromAlert = (id: string) => {
    setActiveTab('schedules');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-slate-950 flex-shrink-0 flex-col border-r border-slate-900">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-900">
          <div className="flex items-center space-x-3 text-blue-400 font-extrabold text-xl tracking-tight uppercase">
            <span className="bg-blue-600 text-white px-2 py-1 rounded shadow-sm flex items-center justify-center">
              <BusIcon className="w-5 h-5 fill-current" />
            </span>
            <span className="text-white">MetroLink</span>
          </div>
        </div>

        {/* Navigation Tabs Links */}
        <nav className="flex-grow p-4 space-y-1.5" id="nav-tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5 mr-3" />
            Overview & Maps
          </button>

          <button
            onClick={() => setActiveTab('schedules')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'schedules'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <CalendarDays className="w-4.5 h-4.5 mr-3" />
            Schedules Dispatch
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'fleet'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <BusIcon className="w-4.5 h-4.5 mr-3" />
            Fleet & Drivers
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Ticket className="w-4.5 h-4.5 mr-3" />
            Reservation
          </button>
        </nav>

        {/* Footer/Status block */}
        <div className="p-6 border-t border-slate-900 text-slate-500 text-xs space-y-1 bg-slate-950/40">
          <p className="font-semibold">Terminal A - West Hub</p>
          <p className="flex items-center gap-1.5 font-medium">
            System Status: <span className="text-emerald-500 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Optimal</span>
          </p>
          <p className="text-[10px] text-slate-600 mt-1">Console v2.6.4</p>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm" id="main-header">
          {/* Mobile view title & Hamburger/Tabs */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operations</span>
            <span className="text-slate-300">/</span>
            <h1 className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' && 'Central Schedule Dashboard'}
              {activeTab === 'schedules' && 'Live Corridor Despatch Room'}
              {activeTab === 'fleet' && 'Fleet Charge & Crew Directory'}
              {activeTab === 'bookings' && 'Voucher Seating Reservations'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Clock telemetry readouts */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 font-mono text-slate-700 font-extrabold bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">
                <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span>{systemTime || '08:42:15 AM'}</span>
              </div>
              <div className="hidden sm:block text-right">
                <span className="block font-bold text-slate-400 text-[9px] uppercase tracking-wider leading-none">Telemetry</span>
                <span className="font-mono font-bold text-slate-500 text-[10px]">GMT-7 DST</span>
              </div>
            </div>

            {/* Profile Avatar */}
            <div className="h-8 w-8 bg-blue-100 text-blue-700 border border-blue-200 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
              JD
            </div>
          </div>
        </header>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden bg-slate-900 p-2 flex justify-around border-b border-slate-800 flex-shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`p-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
            title="Overview"
          >
            <LayoutDashboard className="w-5 h-5 mx-auto" />
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`p-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'schedules' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
            title="Schedules"
          >
            <CalendarDays className="w-5 h-5 mx-auto" />
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`p-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'fleet' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
            title="Fleet"
          >
            <BusIcon className="w-5 h-5 mx-auto" />
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`p-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bookings' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
            title="Bookings"
          >
            <Ticket className="w-5 h-5 mx-auto" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-grow p-4 md:p-8 overflow-y-auto space-y-6">
          {/* TAB VIEW 1: DASHBOARD & MAPS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Live Operational Metrics summary row */}
              <DashboardOverview
                buses={buses}
                drivers={drivers}
                schedules={schedules}
                routes={routes}
                onSelectSchedule={handleSelectScheduleFromAlert}
              />

              {/* Vector Schematic Track map */}
              <RouteMap
                routes={routes}
                schedules={schedules}
                buses={buses}
                drivers={drivers}
              />

              {/* Live Route & Stop ETA Tracking Board */}
              <LiveTrackingBoard
                schedules={schedules}
                routes={routes}
                buses={buses}
                drivers={drivers}
              />

              {/* Live Alert Notification and Subscriptions Console */}
              <SubscriptionHub
                routes={routes}
                subscriptions={subscriptions}
                notifications={notifications}
                onAddSubscription={handleAddSubscription}
                onDeleteSubscription={handleDeleteSubscription}
                onClearNotifications={handleClearNotifications}
                onMarkNotificationRead={handleMarkNotificationRead}
              />
            </div>
          )}

          {/* TAB VIEW 2: SCHEDULES & CREATE SCHEDULE */}
          {activeTab === 'schedules' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200" id="schedules-view-layout">
              {/* Live schedule dispatch roster */}
              <div className="lg:col-span-8">
                <ScheduleTimeline
                  schedules={schedules}
                  routes={routes}
                  buses={buses}
                  drivers={drivers}
                  onDispatch={handleDispatch}
                  onReportDelay={handleReportDelay}
                  onResolveDelay={handleResolveDelay}
                  onComplete={handleComplete}
                  onResetSchedules={handleResetSchedules}
                  isSimulating={isSimulating}
                  onToggleSimulation={() => setIsSimulating(!isSimulating)}
                />
              </div>

              {/* Schedule new run creator form */}
              <div className="lg:col-span-4">
                <ScheduleForm
                  routes={routes}
                  buses={buses}
                  drivers={drivers}
                  onCreateSchedule={handleCreateSchedule}
                />
              </div>
            </div>
          )}

          {/* TAB VIEW 3: FLEET & DRIVERS */}
          {activeTab === 'fleet' && (
            <div className="animate-in fade-in duration-200">
              <FleetManager
                buses={buses}
                drivers={drivers}
                onUpdateBusStatus={handleUpdateBusStatus}
                onChargeBus={handleChargeBus}
                onUpdateDriverStatus={handleUpdateDriverStatus}
              />
            </div>
          )}

          {/* TAB VIEW 4: RESERVATIONS */}
          {activeTab === 'bookings' && (
            <div className="animate-in fade-in duration-200">
              <BookingSystem
                routes={routes}
                schedules={schedules}
                bookings={bookings}
                onAddBooking={handleAddBooking}
                onCancelBooking={handleCancelBooking}
              />
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <footer className="bg-white border-t border-slate-200 py-3 text-center text-[10px] text-slate-400 font-bold tracking-wider uppercase flex-shrink-0">
          MetroLink City Transit Board • Municipal Central Dispatch Hub v2.6.4 • Secure Connection Verified
        </footer>
      </main>

      {/* Floating Push Notification Toast Portal Stack */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full pointer-events-none" id="live-toasts-portal">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl shadow-xl border text-white pointer-events-auto flex items-start gap-3 transition-all duration-300 animate-slide-in-right ${
              toast.type === 'delay'
                ? 'bg-rose-900 border-rose-850'
                : toast.type === 'approaching'
                ? 'bg-blue-900 border-blue-850'
                : 'bg-emerald-900 border-emerald-850'
            }`}
          >
            <div className="p-1 bg-white/10 rounded-lg">
              <Bell className="w-4.5 h-4.5 text-white animate-ring" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-200 leading-none">
                  {toast.title}
                </span>
                <span className="text-[8px] font-mono opacity-60 leading-none font-bold shrink-0">{toast.timestamp}</span>
              </div>
              <p className="text-xs font-semibold leading-normal mt-1">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}