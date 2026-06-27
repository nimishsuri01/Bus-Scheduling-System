export type BusStatus = 'Scheduled' | 'En Route' | 'Completed' | 'Delayed' | 'Maintenance' | 'Depot';

export type FuelType = 'Electric' | 'Diesel' | 'Hybrid';

export interface Bus {
  id: string;
  model: string;
  plateNumber: string;
  capacity: number;
  fuelType: FuelType;
  fuelLevel: number; // percentage
  status: 'Active' | 'Maintenance' | 'In Depot';
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  rating: number;
  phone: string;
  status: 'On Duty' | 'Off Duty' | 'On Break';
  avatarColor: string;
}

export interface Route {
  id: string;
  name: string;
  code: string; // e.g. "101", "EX-2"
  stops: { name: string; x: number; y: number }[]; // custom coordinates for our interactive visual map
  duration: number; // in minutes
  distance: number; // in km
  color: string; // hex color for drawing
}

export interface Schedule {
  id: string;
  busId: string;
  routeId: string;
  driverId: string;
  departureTime: string; // "HH:MM" format
  arrivalTime: string; // "HH:MM" format
  days: string[]; // e.g. ["Mon", "Tue", "Wed"]
  status: BusStatus;
  progress: number; // 0 to 100
  delay: number; // in minutes
  currentStopIndex: number;
}

export interface Booking {
  id: string;
  scheduleId: string;
  passengerName: string;
  seatNumber: string;
  fromStop: string;
  toStop: string;
  date: string;
  price: number;
  boardingTime: string;
  ticketCode: string;
}

export interface Subscription {
  id: string;
  type: 'route' | 'stop';
  targetId: string; // routeId or stop name
  targetName: string; // display name
  alertOnDelays: boolean;
  alertOnApproaching: boolean;
}

export interface TicketPass {
  id: string;
  type: 'single' | 'day_pass' | 'monthly_pass' | 'multi_ride';
  price: number;
  purchaseDate: string;
  expiryDate: string;
  remainingRides?: number;
  ticketCode: string;
  passengerName: string;
  routeCode?: string;
  fromStop?: string;
  toStop?: string;
  seatNumber?: string;
}

export interface LiveNotification {
  id: string;
  title: string;
  message: string;
  type: 'delay' | 'approaching' | 'cancellation' | 'info' | 'success';
  timestamp: string;
  read: boolean;
}