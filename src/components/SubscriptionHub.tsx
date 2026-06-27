import React, { useState } from 'react';
import { Route, Subscription, LiveNotification } from '../types';
import { Bell, BellRing, BellOff, MapPin, Route as RouteIcon, ShieldAlert, Trash2, Check, RefreshCw } from 'lucide-react';

interface SubscriptionHubProps {
  routes: Route[];
  subscriptions: Subscription[];
  notifications: LiveNotification[];
  onAddSubscription: (sub: Omit<Subscription, 'id'>) => void;
  onDeleteSubscription: (id: string) => void;
  onClearNotifications: () => void;
  onMarkNotificationRead: (id: string) => void;
}

export default function SubscriptionHub({
  routes,
  subscriptions,
  notifications,
  onAddSubscription,
  onDeleteSubscription,
  onClearNotifications,
  onMarkNotificationRead
}: SubscriptionHubProps) {
  // Local form state
  const [subType, setSubType] = useState<'route' | 'stop'>('route');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes.length > 0 ? routes[0].id : '');
  const [selectedStopName, setSelectedStopName] = useState<string>('');
  const [alertOnDelays, setAlertOnDelays] = useState<boolean>(true);
  const [alertOnApproaching, setAlertOnApproaching] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Group all unique stops across all routes for selection
  const allStops = Array.from(
    new Set(routes.flatMap(r => r.stops.map(s => s.name)))
  ).sort();

  // Set default stop if stops exist
  React.useEffect(() => {
    if (allStops.length > 0 && !selectedStopName) {
      setSelectedStopName(allStops[0]);
    }
  }, [allStops, selectedStopName]);

  const handleSubmitSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    let targetId = '';
    let targetName = '';

    if (subType === 'route') {
      const route = routes.find(r => r.id === selectedRouteId);
      if (!route) return;
      targetId = route.id;
      targetName = `${route.code} Line - ${route.name}`;
    } else {
      targetId = selectedStopName;
      targetName = `Stop: ${selectedStopName}`;
    }

    // Check if already subscribed
    const isDuplicate = subscriptions.some(
      s => s.type === subType && s.targetId === targetId
    );

    if (isDuplicate) {
      setSuccessMessage('⚠️ You are already subscribed to this transit element.');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    onAddSubscription({
      type: subType,
      targetId,
      targetName,
      alertOnDelays,
      alertOnApproaching
    });

    setSuccessMessage(`🔔 Subscribed to ${targetName} successfully!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="subscription-hub">
      {/* Subscribe Setup Panel (5 cols) */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-blue-600 animate-bounce" style={{ animationDuration: '3s' }} />
              Alert Notification Hub
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Subscribe to corridors or transit hubs. Receive push alerts for congestion, delayed coaches, or oncoming buses.
            </p>
          </div>

          <form onSubmit={handleSubmitSubscription} className="space-y-4">
            {/* Toggle Switch Subscription Type */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setSubType('route')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  subType === 'route' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <RouteIcon className="w-3.5 h-3.5" /> Route Line
              </button>
              <button
                type="button"
                onClick={() => setSubType('stop')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  subType === 'stop' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> Stop Station
              </button>
            </div>

            {/* Target Select Dropdown */}
            {subType === 'route' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Route Corridor</label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-bold text-slate-700"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Stop Station</label>
                <select
                  value={selectedStopName}
                  onChange={(e) => setSelectedStopName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-bold text-slate-700"
                >
                  {allStops.map(stop => (
                    <option key={stop} value={stop}>{stop}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Notification Checkboxes */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Notification preferences
              </span>
              <label className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={alertOnDelays}
                  onChange={(e) => setAlertOnDelays(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Congestion, Delays & Changes
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={alertOnApproaching}
                  onChange={(e) => setAlertOnApproaching(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Approaching/Oncoming Bus Alerts
              </label>
            </div>

            {successMessage && (
              <p className="text-xs text-blue-700 font-bold text-center bg-blue-50/50 p-2 rounded-lg border border-blue-100/50 animate-pulse">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              Subscribe to Push Alerts
            </button>
          </form>
        </div>

        {/* Display Active Subscriptions count */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span>ACTIVE SUBSCRIBED SERVICES</span>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
            {subscriptions.length} elements
          </span>
        </div>
      </div>

      {/* Subscriptions List + Live Logs Console (7 cols) */}
      <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Subscriptions Subpanel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-slate-500" /> Active Subscriptions
            </h4>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {subscriptions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-xs border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                  <BellOff className="w-5 h-5 mx-auto text-slate-300 mb-1" />
                  No active subscriptions.
                </div>
              ) : (
                subscriptions.map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1">
                        {sub.type === 'route' ? (
                          <RouteIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )}
                        <span className="font-bold text-slate-700 truncate block">
                          {sub.targetName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase">
                        {sub.alertOnDelays && <span>• Delays</span>}
                        {sub.alertOnApproaching && <span>• Approaching</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteSubscription(sub.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0"
                      title="Unsubscribe alerts"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 leading-normal">
            ⚙️ Alerts are evaluated on every simulated bus movement. Keep browser active to trigger live visual alerts.
          </div>
        </div>

        {/* Live System Alerts Log Console */}
        <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" /> Live Alert Log ({notifications.length})
              </h4>
              {notifications.length > 0 && (
                <button
                  onClick={onClearNotifications}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 text-xs font-mono">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-600 italic">
                  &gt; Console Idle. No active alerts.
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => onMarkNotificationRead(notif.id)}
                    className={`p-2 rounded-lg border text-[11px] leading-tight transition-all cursor-pointer relative flex flex-col justify-between gap-1 ${
                      notif.read
                        ? 'bg-slate-900/40 border-slate-900 text-slate-500'
                        : notif.type === 'delay'
                        ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                        : notif.type === 'approaching'
                        ? 'bg-blue-950/40 border-blue-900/60 text-blue-300'
                        : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-extrabold tracking-wide uppercase text-[9px]">
                        {notif.type === 'delay' ? '⚠️ DELAY' : notif.type === 'approaching' ? '🔔 APPROACHING' : '⚡ DISPATCH'}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold">{notif.timestamp}</span>
                    </div>
                    <span className="text-xs font-semibold font-sans">{notif.message}</span>
                    {!notif.read && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-semibold border-t border-slate-900 pt-3 flex items-center justify-between">
            <span>STATUS: LIVE FEED LISTENING</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              ONLINE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}