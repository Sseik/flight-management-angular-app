export interface SystemStats {
  totalFlights: number;
  totalBookings: number;
  delayed: number;
}

export interface BookingRequest {
  flightId: number;
  passenger: string;
}

export interface Booking {
  id: number;
  passenger_name: string; // Назва поля як у базі даних
  flight_number: string;
  origin: string;
  destination: string;
}

export interface ApiResponse {
  success: boolean;
  booking?: Booking;
}

export interface User {
  user_id: number;
  username: string;
}