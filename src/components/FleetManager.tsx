import { useState } from 'react';
import { Bus, Driver, FuelType } from '../types';
import { Battery, Zap, CheckCircle2, AlertTriangle, ShieldAlert, Wrench, Smartphone, Star, Clock, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

interface FleetManagerProps {
  buses: Bus[];
  drivers: Driver[];
  onUpdateBusStatus: (id: string, status: 'Active' | 'Maintenance' | 'In Depot') => void;
  onChargeBus: (id: string) => void;
  onUpdateDriverStatus: (id: string, status: 'On Duty' | 'Off Duty' | 'On Break') => void;
}

export default function FleetManager({
  buses,
  drivers,
  onUpdateBusStatus,
  onChargeBus,
  onUpdateDriverStatus
}: FleetManagerProps) {
  const [activeTab, setActiveTab] = useState<'buses' | 'drivers'>('buses');
  const [chargingBusId, setChargingBusId] = useState<string | null>(null);

  const triggerChargingAnimation = (id: string) => {
    setChargingBusId(id);
    onChargeBus(id);
    setTimeout(() => {
      setChargingBusId(null);
    }, 1500); // clear simulated charging indicator
  };

  const getFuelBadge = (type: FuelType, level: number) => {
    let barColor = 'bg-emerald-500';
    if (level < 25) barColor = 'bg-rose-500';
    else if (level < 60) barColor = 'bg-amber-500';

    return (
      <div className="space-y-1 w-full max-w-[140px]">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            {type === 'Electric' ? <Zap className="w-3.5 h-3.5 text-amber-500" /> : <Battery className="w-3.5 h-3.5 text-slate-400" />}
            {type}
          </span>
          <span className={`${level < 25 ? 'text-rose-600 font-bold' : ''}`}>{level}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${level}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="fleet-manager">
      {/* Tab Select Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-lg font-bold text-slate-900">Fleet & Personnel Directory</h3>
          <p className="text-xs text-slate-500">Manage vehicle charge levels, maintenance protocols, and staffing shifts.</p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit" id="tab-controls">
          <button
            onClick={() => setActiveTab('buses')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'buses'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buses & Charge Status
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'drivers'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Driver Roster
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* BUSES LIST TAB */}
        {activeTab === 'buses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="buses-list">
            {buses.map(bus => (
              <div
                key={bus.id}
                className={`p-5 rounded-xl border transition-all ${
                  bus.status === 'Maintenance'
                    ? 'bg-rose-50/20 border-rose-200'
                    : bus.status === 'In Depot'
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-white border-slate-200/80 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-900">{bus.model}</span>
                      <span className="text-[10px] font-bold font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                        {bus.plateNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Passenger Capacity: {bus.capacity} seats</p>
                  </div>

                  {/* Status Indicator Badge */}
                  <div>
                    {bus.status === 'Active' && (
                      <span className="text-[10px] font-extrabold bg-blue-100 border border-blue-200 text-blue-800 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        Active
                      </span>
                    )}
                    {bus.status === 'In Depot' && (
                      <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        In Depot
                      </span>
                    )}
                    {bus.status === 'Maintenance' && (
                      <span className="text-[10px] font-extrabold bg-rose-100 border border-rose-200 text-rose-800 px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <Wrench className="w-3 h-3" />
                        Maintenance
                      </span>
                    )}
                  </div>
                </div>

                {/* Energy & Action Row */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  {/* Battery level indicator */}
                  {getFuelBadge(bus.fuelType, bus.fuelLevel)}

                  {/* Status toggle adjustments */}
                  <div className="flex items-center gap-2">
                    {/* Charging trigger button for electric buses */}
                    {bus.fuelType === 'Electric' && bus.status !== 'Active' && (
                      <button
                        onClick={() => triggerChargingAnimation(bus.id)}
                        disabled={chargingBusId === bus.id || bus.fuelLevel >= 100}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                          bus.fuelLevel >= 100
                            ? 'bg-slate-100 text-slate-400 border-slate-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {chargingBusId === bus.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Charging...
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 fill-current animate-bounce" />
                            Plug-In Charge
                          </>
                        )}
                      </button>
                    )}

                    {/* Maintenance toggle buttons */}
                    {bus.status === 'Maintenance' ? (
                      <button
                        onClick={() => onUpdateBusStatus(bus.id, 'In Depot')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete Service
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateBusStatus(bus.id, 'Maintenance')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Service Bus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DRIVERS LIST TAB */}
        {activeTab === 'drivers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="drivers-list">
            {drivers.map(driver => (
              <div
                key={driver.id}
                className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-start gap-4 hover:shadow-md transition-all"
              >
                {/* Driver Initial Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-lg ${driver.avatarColor} shadow-inner shrink-0`}>
                  {driver.name.split(' ').map(n => n[0]).join('')}
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-900 leading-tight">{driver.name}</h4>
                      <span className="text-[10px] font-mono font-bold text-slate-400">License: {driver.licenseNumber}</span>
                    </div>

                    {/* Duty Shift Indicator */}
                    <div>
                      {driver.status === 'On Duty' && (
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          On Duty
                        </span>
                      )}
                      {driver.status === 'On Break' && (
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          On Break
                        </span>
                      )}
                      {driver.status === 'Off Duty' && (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Off Duty
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating / Contact details */}
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-bold text-slate-800">
                      <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />
                      {driver.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                      {driver.phone}
                    </span>
                  </div>

                  {/* Operational Switch Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Actions:</span>
                    <div className="flex gap-1.5">
                      {driver.status !== 'On Duty' && (
                        <button
                          onClick={() => onUpdateDriverStatus(driver.id, 'On Duty')}
                          className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-all cursor-pointer border border-blue-100"
                        >
                          Put On-Duty
                        </button>
                      )}
                      {driver.status !== 'On Break' && driver.status !== 'Off Duty' && (
                        <button
                          onClick={() => onUpdateDriverStatus(driver.id, 'On Break')}
                          className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 rounded transition-all cursor-pointer border border-amber-100"
                        >
                          Give Break
                        </button>
                      )}
                      {driver.status !== 'Off Duty' && (
                        <button
                          onClick={() => onUpdateDriverStatus(driver.id, 'Off Duty')}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-all cursor-pointer border border-slate-200"
                        >
                          Sign-Off
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
