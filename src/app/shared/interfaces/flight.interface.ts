export interface Flight {
  flightId: number;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: Date;
  arrivalTime: Date;
  status: 'Scheduled' | 'On Time' | 'Delayed' | 'Cancelled' | 'Departed' | 'Arrived';
  price: number;
  currency: string;
}