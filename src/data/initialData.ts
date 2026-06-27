import { Bus, Driver, Route, Schedule, Booking } from '../types';

export const INITIAL_BUSES: Bus[] = [
  { id: 'bus-1', model: 'BYD K9 (Electric)', plateNumber: 'TX-8041-E', capacity: 45, fuelType: 'Electric', fuelLevel: 92, status: 'Active' },
  { id: 'bus-2', model: 'Gillig Low Floor', plateNumber: 'TX-3329-D', capacity: 55, fuelType: 'Diesel', fuelLevel: 78, status: 'Active' },
  { id: 'bus-3', model: 'Volvo 7900 Hybrid', plateNumber: 'TX-1152-H', capacity: 50, fuelType: 'Hybrid', fuelLevel: 85, status: 'Active' },
  { id: 'bus-4', model: 'Proterra Catalyst', plateNumber: 'TX-9098-E', capacity: 40, fuelType: 'Electric', fuelLevel: 42, status: 'Active' },
  { id: 'bus-5', model: 'New Flyer Xcelsior', plateNumber: 'TX-5512-D', capacity: 60, fuelType: 'Diesel', fuelLevel: 100, status: 'In Depot' },
  { id: 'bus-6', model: 'BYD K9 (Electric)', plateNumber: 'TX-4402-E', capacity: 45, fuelType: 'Electric', fuelLevel: 15, status: 'Maintenance' },
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'drv-1', name: 'Marcus Sterling', licenseNumber: 'DL-TX88902', rating: 4.9, phone: '+1 (512) 555-0143', status: 'On Duty', avatarColor: 'bg-emerald-500' },
  { id: 'drv-2', name: 'Sophia Chen', licenseNumber: 'DL-TX11452', rating: 4.8, phone: '+1 (512) 555-0199', status: 'On Duty', avatarColor: 'bg-sky-500' },
  { id: 'drv-3', name: 'Elena Rostova', licenseNumber: 'DL-TX90211', rating: 4.7, phone: '+1 (512) 555-0288', status: 'On Break', avatarColor: 'bg-violet-500' },
  { id: 'drv-4', name: 'David Jenkins', licenseNumber: 'DL-TX66541', rating: 4.9, phone: '+1 (512) 555-0112', status: 'On Duty', avatarColor: 'bg-amber-500' },
  { id: 'drv-5', name: 'Carlos Mendez', licenseNumber: 'DL-TX33871', rating: 4.6, phone: '+1 (512) 555-0301', status: 'Off Duty', avatarColor: 'bg-rose-500' },
  { id: 'drv-6', name: 'Aisha Warren', licenseNumber: 'DL-TX77421', rating: 5.0, phone: '+1 (512) 555-0455', status: 'On Duty', avatarColor: 'bg-teal-500' },
];

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'rt-1',
    name: 'Amritsar - Ludhiana Express',
    code: 'PB-101',
    duration: 180,
    distance: 140,
    color: '#10B981', // emerald
    stops: [
      { name: 'Amritsar Junction', x: 100, y: 150 },
      { name: 'Tarn Taran', x: 250, y: 120 },
      { name: 'Jalandhar Cantt', x: 420, y: 140 },
      { name: 'Phagwara', x: 580, y: 130 },
      { name: 'Ludhiana', x: 700, y: 160 },
    ],
  },
  {
    id: 'rt-2',
    name: 'Chandigarh - Patiala Corridor',
    code: 'PB-204',
    duration: 120,
    distance: 100,
    color: '#0EA5E9', // sky
    stops: [
      { name: 'Chandigarh', x: 120, y: 50 },
      { name: 'Mohali', x: 300, y: 60 },
      { name: 'Kharar', x: 480, y: 80 },
      { name: 'Zirakpur', x: 650, y: 90 },
      { name: 'Patiala', x: 750, y: 220 },
    ],
  },
  {
    id: 'rt-3',
    name: 'Jalandhar Core Loop',
    code: 'PB-302',
    duration: 60,
    distance: 45,
    color: '#8B5CF6', // violet
    stops: [
      { name: 'Jalandhar Cantt', x: 400, y: 200 },
      { name: 'Kartarpur', x: 320, y: 280 },
      { name: 'Nawanshahr', x: 440, y: 350 },
      { name: 'Hoshiarpur', x: 550, y: 280 },
      { name: 'Jalandhar Cantt', x: 400, y: 200 }, // looping back
    ],
  },
  {
    id: 'rt-4',
    name: 'Chandigarh Airport Shuttle',
    code: 'PB-088',
    duration: 45,
    distance: 30,
    color: '#F59E0B', // amber
    stops: [
      { name: 'Chandigarh ISBT', x: 400, y: 200 },
      { name: 'Zirakpur', x: 520, y: 150 },
      { name: 'SAS Nagar (Mohali)', x: 650, y: 250 },
      { name: 'Chandigarh Airport T1', x: 740, y: 320 },
    ],
  },
];

export const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 'sch-1',
    busId: 'bus-1',
    routeId: 'rt-1',
    driverId: 'drv-1',
    departureTime: '08:00',
    arrivalTime: '08:45',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    status: 'En Route',
    progress: 65,
    delay: 0,
    currentStopIndex: 2,
  },
  {
    id: 'sch-2',
    busId: 'bus-2',
    routeId: 'rt-2',
    driverId: 'drv-2',
    departureTime: '08:15',
    arrivalTime: '09:15',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    status: 'Delayed',
    progress: 30,
    delay: 12,
    currentStopIndex: 1,
  },
  {
    id: 'sch-3',
    busId: 'bus-3',
    routeId: 'rt-3',
    driverId: 'drv-4',
    departureTime: '08:45',
    arrivalTime: '09:20',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    status: 'Scheduled',
    progress: 0,
    delay: 0,
    currentStopIndex: 0,
  },
  {
    id: 'sch-4',
    busId: 'bus-4',
    routeId: 'rt-4',
    driverId: 'drv-6',
    departureTime: '09:10',
    arrivalTime: '10:00',
    days: ['Mon', 'Wed', 'Fri'],
    status: 'Scheduled',
    progress: 0,
    delay: 0,
    currentStopIndex: 0,
  },
  {
    id: 'sch-5',
    busId: 'bus-5',
    routeId: 'rt-1',
    driverId: 'drv-3',
    departureTime: '07:00',
    arrivalTime: '07:45',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    status: 'Completed',
    progress: 100,
    delay: 4,
    currentStopIndex: 4,
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bkg-1',
    scheduleId: 'sch-1',
    passengerName: 'Jane Doe',
    seatNumber: '04A',
    fromStop: 'Amritsar Junction',
    toStop: 'Ludhiana',
    date: '2026-06-24',
    price: 450.00,
    boardingTime: '08:00',
    ticketCode: 'TKT-PB101-JD31',
  },
  {
    id: 'bkg-2',
    scheduleId: 'sch-2',
    passengerName: 'Michael Singh',
    seatNumber: '12C',
    fromStop: 'Jalandhar Cantt',
    toStop: 'Patiala',
    date: '2026-06-24',
    price: 620.00,
    boardingTime: '08:15',
    ticketCode: 'TKT-PB204-MS89',
  }
];