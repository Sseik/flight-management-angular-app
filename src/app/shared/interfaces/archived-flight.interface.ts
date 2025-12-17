export interface ArchivedAirline {
  name: string;
  code: string;
  country: string;
}

export interface ArchivedAirport {
  airportName: string;
  iataCode: string;
  city: string;
  country: string;
}

export interface ArchivedRoute {
  origin: ArchivedAirport;
  destination: ArchivedAirport;
}

export interface ArchivedPassenger {
  fullName: string;
  email: string;
  passport: string;
}

export interface ArchivedTicket {
  ticketNumber: string;
  seat: string;
  price: number;
  bookedAt: string; // Дати з JSON приходять як рядки
  passenger: ArchivedPassenger;
  baggage: { weightKg: number; type: string }[];
}

// Головний інтерфейс документа
export interface ArchivedFlight {
  _id: string; // MongoDB ID
  flightNumber: string;
  status: string;
  archivedAt: string;
  airline: ArchivedAirline;
  schedule: {
    departure: string;
    arrival: string;
  };
  actual: {
    departure: string;
    arrival: string;
  };
  route: ArchivedRoute;
  passengerManifest: ArchivedTicket[];
  stats?: {
    totalPassengers: number;
    totalLuggageWeight: number;
  };
}