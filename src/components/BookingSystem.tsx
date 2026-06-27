import React, { useState, useEffect } from 'react';
import { Route, Schedule, Booking } from '../types';
import { Search, MapPin, User, Armchair, Check, Ticket, QrCode, AlertCircle, Trash2, Calendar, CreditCard, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

interface BookingSystemProps {
  routes: Route[];
  schedules: Schedule[];
  bookings: Booking[];
  onAddBooking: (bookingData: Omit<Booking, 'id' | 'ticketCode'>) => void;
  onCancelBooking: (id: string) => void;
}

const OCCUPIED_SEATS_SEED = ['02A', '02B', '05C', '06D', '08A', '10B'];

export default function BookingSystem({
  routes,
  schedules,
  bookings,
  onAddBooking,
  onCancelBooking
}: BookingSystemProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [fromStop, setFromStop] = useState<string>('');
  const [toStop, setToStop] = useState<string>('');
  const [passengerName, setPassengerName] = useState<string>('');
  const [selectedSeat, setSelectedSeat] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ticketView, setTicketView] = useState<Booking | null>(null);

  // New fare and secure payment state
  const [ticketClass, setTicketClass] = useState<'single' | 'day_pass' | 'multi_ride'>('single');
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [paymentState, setPaymentState] = useState<'idle' | 'authorizing' | 'success'>('idle');
  const [paymentStepMsg, setPaymentStepMsg] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const activeRoute = routes.find(r => r.id === selectedRouteId);
  
  // Available schedules for chosen route (only En Route, Scheduled, Delayed)
  const availableSchedules = schedules.filter(s => s.routeId === selectedRouteId && s.status !== 'Completed');

  // Trigger default selection updates
  useEffect(() => {
    if (routes.length > 0 && !selectedRouteId) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  useEffect(() => {
    if (selectedRouteId) {
      const relatedSchedules = schedules.filter(s => s.routeId === selectedRouteId && s.status !== 'Completed');
      if (relatedSchedules.length > 0) {
        setSelectedScheduleId(relatedSchedules[0].id);
      } else {
        setSelectedScheduleId('');
      }

      const route = routes.find(r => r.id === selectedRouteId);
      if (route && route.stops.length >= 2) {
        setFromStop(route.stops[0].name);
        setToStop(route.stops[route.stops.length - 1].name);
      }
      setSelectedSeat('');
    }
  }, [selectedRouteId, schedules, routes]);

  // Adjust destination stops when origin changes to prevent backing up
  useEffect(() => {
    if (activeRoute && fromStop) {
      const fromIndex = activeRoute.stops.findIndex(s => s.name === fromStop);
      const remainingStops = activeRoute.stops.slice(fromIndex + 1);
      if (remainingStops.length > 0) {
        setToStop(remainingStops[0].name);
      } else {
        setToStop('');
      }
    }
  }, [fromStop, activeRoute]);

  // Calculate fare dynamically:
  // - Single: $2.00 flat boarding + $0.75 per stop segment traveled
  // - Day Pass: $6.50
  // - Multi-Ride: $15.00
  const calculatePrice = () => {
    if (ticketClass === 'day_pass') return 6.50;
    if (ticketClass === 'multi_ride') return 15.00;

    if (!activeRoute || !fromStop || !toStop) return 2.00;
    const fromIndex = activeRoute.stops.findIndex(s => s.name === fromStop);
    const toIndex = activeRoute.stops.findIndex(s => s.name === toStop);
    const segmentsTraveled = Math.max(1, toIndex - fromIndex);
    return 2.00 + segmentsTraveled * 0.75;
  };

  const handleSeatClick = (seatCode: string) => {
    if (OCCUPIED_SEATS_SEED.includes(seatCode)) return; // Occupied
    setSelectedSeat(selectedSeat === seatCode ? '' : seatCode);
  };

  // Detect card brand based on numbers
  const getCardBrand = (number: string) => {
    const clean = number.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'American Express';
    if (/^6(?:011|5)/.test(clean)) return 'Discover';
    return 'Credit Card';
  };

  // Format Card Number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const chunks = raw.match(/.{1,4}/g);
    setCardNumber(chunks ? chunks.join(' ').slice(0, 19) : '');
  };

  // Format Expiry Month/Year (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2, 4);
    }
    setCardExpiry(raw.slice(0, 5));
  };

  // Handle opening checkout modal
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedScheduleId) {
      setErrorMsg('Please select a departing bus trip schedule.');
      return;
    }
    if (!fromStop || !toStop) {
      setErrorMsg('Ensure both boarding and arrival station stops are selected.');
      return;
    }
    if (!passengerName.trim()) {
      setErrorMsg('Please enter passenger name for booking validation.');
      return;
    }
    if (!selectedSeat) {
      setErrorMsg('Please select an available seat from the bus map grid.');
      return;
    }

    // Reset payment values & open checkout
    setCardNumber('');
    setCardHolder(passengerName);
    setCardExpiry('');
    setCardCvv('');
    setPaymentError(null);
    setPaymentState('idle');
    setShowCheckout(true);
  };

  // Secure payment simulation
  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 13) {
      setPaymentError('Invalid credit card number. Please provide a valid 16-digit card.');
      return;
    }
    if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
      setPaymentError('Expiry date must be in MM/YY format.');
      return;
    }
    if (cardCvv.length < 3) {
      setPaymentError('CVV code must be at least 3 digits.');
      return;
    }

    // Begin payment process
    setPaymentState('authorizing');
    setPaymentStepMsg('Securing 256-bit SSL encrypted connection...');

    setTimeout(() => {
      setPaymentStepMsg('Verifying credentials & checking fraud thresholds...');
      setTimeout(() => {
        setPaymentStepMsg('Authorizing ticket transaction with payment network...');
        setTimeout(() => {
          setPaymentStepMsg('Payment captured successfully! Storing block hash...');
          setTimeout(() => {
            setPaymentState('success');
            
            // Confirm actual booking state
            const schedule = schedules.find(s => s.id === selectedScheduleId);
            const price = calculatePrice();

            onAddBooking({
              scheduleId: selectedScheduleId,
              passengerName,
              seatNumber: selectedSeat,
              fromStop,
              toStop,
              date: new Date().toISOString().split('T')[0],
              price,
              boardingTime: schedule ? schedule.departureTime : '08:00',
            });

            // Close checkout after brief delay
            setTimeout(() => {
              setShowCheckout(false);
              setPaymentState('idle');
              setPassengerName('');
              setSelectedSeat('');
            }, 1500);

          }, 800);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // Generate Bus Seating Grid UI Helper (2 columns - Aisle - 2 columns)
  const renderSeatingGrid = () => {
    const rows = 8;
    const columns = ['A', 'B', 'C', 'D'];

    return (
      <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50 space-y-3" id="seating-grid">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-2 border-b border-slate-200">
          <span className="flex items-center gap-1">
            <Armchair className="w-3.5 h-3.5" /> Bus Front (Driver Deck)
          </span>
          <span className="text-[10px]">Aisle Separator</span>
        </div>

        <div className="grid grid-cols-5 gap-y-2 gap-x-1.5 justify-items-center">
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const rowNum = String(rowIndex + 1).padStart(2, '0');
            return (
              <React.Fragment key={rowIndex}>
                {/* Columns A & B */}
                {columns.slice(0, 2).map(col => {
                  const seatCode = `${rowNum}${col}`;
                  const isOccupied = OCCUPIED_SEATS_SEED.includes(seatCode);
                  const isSelected = selectedSeat === seatCode;

                  return (
                    <button
                      key={seatCode}
                      type="button"
                      onClick={() => handleSeatClick(seatCode)}
                      className={`w-9 h-9 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isOccupied
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      <Armchair className="w-4 h-4 shrink-0" />
                      <span>{seatCode}</span>
                    </button>
                  );
                })}

                {/* AISLE SEPARATING COLUMN */}
                <div className="w-4 flex items-center justify-center text-[9px] font-bold text-slate-300 font-mono">
                  {rowNum}
                </div>

                {/* Columns C & D */}
                {columns.slice(2, 4).map(col => {
                  const seatCode = `${rowNum}${col}`;
                  const isOccupied = OCCUPIED_SEATS_SEED.includes(seatCode);
                  const isSelected = selectedSeat === seatCode;

                  return (
                    <button
                      key={seatCode}
                      type="button"
                      onClick={() => handleSeatClick(seatCode)}
                      className={`w-9 h-9 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isOccupied
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      <Armchair className="w-4 h-4 shrink-0" />
                      <span>{seatCode}</span>
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 font-bold pt-3 border-t border-slate-200">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-white border border-slate-200" /> Available
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> Occupied
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-600" /> Chosen
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="booking-system">
      {/* Booking Form Card (left 7 cols) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 lg:col-span-7">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-600" />
            Passenger Seat Reservation
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Reserve individual seats, calculate travel pricing based on terminal zones, and print QR codes.
          </p>
        </div>

        <form onSubmit={handleConfirmBooking} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Choose Route */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Transit Corridor</label>
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

            {/* Choose Schedule */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Scheduled Departures</label>
              {availableSchedules.length === 0 ? (
                <div className="p-2.5 rounded-xl border border-amber-155 bg-amber-50 text-[11px] font-bold text-amber-800">
                  No departing runs available on this route.
                </div>
              ) : (
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-bold text-slate-700"
                >
                  {availableSchedules.map(sch => (
                    <option key={sch.id} value={sch.id}>
                      {sch.departureTime} (Progress: {sch.progress}%)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* From Stop */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Boarding Station
              </label>
              <select
                value={fromStop}
                onChange={(e) => setFromStop(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-bold text-slate-700"
              >
                {activeRoute?.stops.map((stop, idx) => (
                  // Hide last stop as you can't board at final terminal destination
                  idx < activeRoute.stops.length - 1 && (
                    <option key={stop.name} value={stop.name}>{stop.name}</option>
                  )
                ))}
              </select>
            </div>

            {/* To Stop */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Destination Terminal
              </label>
              <select
                value={toStop}
                onChange={(e) => setToStop(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-bold text-slate-700"
              >
                {activeRoute?.stops.map((stop, idx) => {
                  const fromIndex = activeRoute.stops.findIndex(s => s.name === fromStop);
                  // Only allow choosing stops that occur AFTER the selected boarding stop!
                  if (idx > fromIndex) {
                    return <option key={stop.name} value={stop.name}>{stop.name}</option>;
                  }
                  return null;
                })}
              </select>
            </div>
          </div>

          {/* Fare Type / Pass Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">3. Select Fare Class / Ticket Package</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTicketClass('single')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  ticketClass === 'single'
                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Single Trip</span>
                <span className="text-xs font-extrabold text-slate-800 mt-1">Zone segments</span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">Calculated based on distance</span>
              </button>
              
              <button
                type="button"
                onClick={() => setTicketClass('day_pass')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  ticketClass === 'day_pass'
                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Commuter Day Pass</span>
                <span className="text-xs font-extrabold text-slate-800 mt-1">$6.50 Unlimited</span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">24 hours system-wide travel</span>
              </button>

              <button
                type="button"
                onClick={() => setTicketClass('multi_ride')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  ticketClass === 'multi_ride'
                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Multi-Ride Commuter Book</span>
                <span className="text-xs font-extrabold text-slate-800 mt-1">$15.00 Booklet</span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">10 voucher rides (15% off)</span>
              </button>
            </div>
          </div>

          {/* Passenger Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> 4. Passenger Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Liam Henderson"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl text-xs font-bold text-slate-800"
            />
          </div>

          {/* Dynamic Price Display Card */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-blue-800">Dynamic Ticket Fare</span>
              <p className="text-xs text-blue-700 font-medium">
                {ticketClass === 'single'
                  ? `Calculated zone segments traveled: $${calculatePrice().toFixed(2)}`
                  : ticketClass === 'day_pass'
                  ? 'Flat Unlimited system-wide Day Pass fare'
                  : 'Commuter package discount: Pack of 10 segment rides'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-900">${calculatePrice().toFixed(2)}</span>
            </div>
          </div>

          {/* Action Trigger Submit */}
          <div className="space-y-3 pt-2">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedSeat || !selectedScheduleId || !passengerName.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Proceed to Secure Payment Gateway
            </button>
          </div>

        </form>
      </div>

      {/* Seating Layout Selector (right 5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Seating map section */}
        {renderSeatingGrid()}
      </div>

      {/* Ticket Logs & Passes List Section (Full Width Bottom) */}
      <div className="col-span-full border-t border-slate-200/80 pt-6 space-y-4">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5 tracking-tight">
          <Ticket className="w-4.5 h-4.5 text-blue-600" /> Active Boarding Passes ({bookings.length})
        </h4>

        {bookings.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No bookings recorded. Create an active seat reservation above.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map(bkg => {
              const schedule = schedules.find(s => s.id === bkg.scheduleId);
              const route = schedule ? routes.find(r => r.id === schedule.routeId) : null;

              return (
                <div
                  key={bkg.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold bg-slate-900 text-white px-2 py-0.5 rounded">
                          {route?.code || 'BUS'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 font-mono">{bkg.ticketCode}</span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-950">{bkg.passengerName}</h5>
                    </div>

                    <button
                      onClick={() => onCancelBooking(bkg.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Void / Refund boarding pass"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Travel details summary */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">From Station</span>
                      <span className="font-bold text-slate-700 truncate block">{bkg.fromStop}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">To Station</span>
                      <span className="font-bold text-slate-700 truncate block">{bkg.toStop}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Seat / Fare</span>
                      <span className="font-bold text-slate-800">Seat {bkg.seatNumber} • ${bkg.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Date / Time</span>
                      <span className="font-bold text-slate-700">{bkg.date} @ {bkg.boardingTime}</span>
                    </div>
                  </div>

                  {/* Visual Boarding pass overlay option */}
                  <button
                    type="button"
                    onClick={() => setTicketView(bkg)}
                    className="w-full py-1.5 text-center text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-100/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-blue-600" /> View Boarding Pass Ticket
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOARDING PASS DIGITAL MODAL POPUP */}
      {ticketView && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 p-6 w-full max-w-sm shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setTicketView(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900 p-1.5 rounded-full border border-slate-800 cursor-pointer"
            >
              &times;
            </button>

            {/* Ticket Header styling */}
            <div className="flex flex-col items-center justify-center text-center space-y-1.5 pt-2">
              <Ticket className="w-8 h-8 text-blue-400" />
              <h4 className="text-base font-bold text-white tracking-wide">METRO DISPATCH AUTHORITY</h4>
              <span className="text-[10px] tracking-wider text-slate-400 uppercase font-bold">City Transit Boarding Voucher</span>
            </div>

            {/* Dashed notch separator */}
            <div className="relative border-t-2 border-dashed border-slate-800 my-4 flex items-center justify-between">
              <div className="w-4 h-4 bg-slate-900 rounded-full absolute -left-8 -top-2 border border-slate-800" />
              <div className="w-4 h-4 bg-slate-900 rounded-full absolute -right-8 -top-2 border border-slate-800" />
            </div>

            {/* Passenger specifications layout */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Passenger Name</span>
                  <span className="font-extrabold text-white text-sm">{ticketView.passengerName}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Voucher Code</span>
                  <span className="font-mono text-blue-400 text-sm font-bold">{ticketView.ticketCode}</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Boarding / Destination</span>
                <span className="font-bold text-white block">{ticketView.fromStop}</span>
                <span className="text-[9px] text-slate-400 uppercase block font-bold my-0.5">To Transit Segment</span>
                <span className="font-bold text-white block">{ticketView.toStop}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-500 block">Assigned Seat</span>
                  <span className="font-bold text-white">{ticketView.seatNumber}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-500 block">Departure</span>
                  <span className="font-bold text-white">{ticketView.boardingTime}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-500 block">Fare Paid</span>
                  <span className="font-bold text-blue-400">${ticketView.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Simulated QR Code matrix box */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl w-fit mx-auto border border-slate-200">
              <div className="w-28 h-28 grid grid-cols-7 gap-1 bg-slate-950 p-1 rounded-md">
                {/* Simulated QR-code pattern tiles */}
                {Array.from({ length: 49 }).map((_, idx) => {
                  const isBlack = (idx * 7 + (idx % 3) * 5 + 3) % 2 === 0 || idx < 12 || idx > 37;
                  return (
                    <div
                      key={idx}
                      className={`w-full h-full rounded-[2px] ${isBlack ? 'bg-slate-950' : 'bg-white'}`}
                    />
                  );
                })}
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-500 mt-2">VOUCHER SECURE TICKET VERIFIED</span>
            </div>
          </div>
        </div>
      )}

      {/* SECURE CHECKOUT PAYMENT GATEWAY MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            {/* Header branding */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded-lg">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold tracking-tight">SecurePay Gateway</h4>
                  <p className="text-[10px] text-slate-400 font-medium">PCI-DSS Compliant • 256-bit SSL</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Due</span>
                <span className="text-lg font-extrabold text-blue-400">${calculatePrice().toFixed(2)}</span>
              </div>
            </div>

            {/* Core body */}
            <div className="p-6 space-y-6">
              {paymentState === 'idle' && (
                <form onSubmit={handleExecutePayment} className="space-y-4">
                  {/* Dynamic interactive debit/credit card mockup preview */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white p-4 rounded-2xl shadow-md relative overflow-hidden space-y-5 border border-slate-750">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-mono tracking-widest text-slate-400">TRANSIT COMMUTER ACCREDITED</span>
                      <span className="text-xs font-bold font-mono tracking-wider text-blue-400 uppercase">
                        {getCardBrand(cardNumber)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Card Number</span>
                      <span className="text-sm font-mono tracking-widest font-semibold block">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Cardholder</span>
                        <span className="text-xs font-medium truncate block uppercase font-mono">
                          {cardHolder || passengerName || 'VALUED COMMUTER'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Expires</span>
                        <span className="text-xs font-mono font-bold block">
                          {cardExpiry || 'MM/YY'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fields input */}
                  <div className="space-y-3.5">
                    {/* Number input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Credit Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4000 1234 5678 9010"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 pl-10"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    {/* Expiry / CVV Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expiry Date</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security CVV</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="•••"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] font-bold text-rose-700 flex items-center gap-1.5 leading-snug">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCheckout(false)}
                      className="w-1/3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4.5 h-4.5" />
                      Authorize & Pay
                    </button>
                  </div>
                </form>
              )}

              {paymentState === 'authorizing' && (
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-slate-800">Authorization Pending</p>
                    <p className="text-xs text-slate-500 font-semibold font-mono animate-pulse">
                      {paymentStepMsg}
                    </p>
                  </div>
                </div>
              )}

              {paymentState === 'success' && (
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-4 animate-scale-up">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 ring-8 ring-emerald-50">
                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-extrabold text-slate-900">Payment Secured</p>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      Transaction Capture Successful!
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-semibold">
              🔒 Encrypted with Advanced TLS 1.3 encryption. We do not store credit card credentials.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

