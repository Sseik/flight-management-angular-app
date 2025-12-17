// Для Запиту А (Фільтрація)
export interface FilteredFlightResult {
  flightNumber: string;
  status: string;
  airline: { name: string };
  route: { origin: { city: string } };
  schedule: { departure: string };
}

// Для Запиту Б (Агрегація)
export interface AirlineStatsResult {
  airline: string;
  flightCount: number;
  avgPrice: number;
  totalRevenue: number;
}

// Для Запиту В (Lookup / Рейтинг)
export interface RatedFlightResult {
  flightNumber: string;
  airline: { name: string };
  rating: number;
}

// Об'єднаний тип для таблиці (щоб компонент знав, що це один з цих варіантів)
export type AnalyticsResultItem = FilteredFlightResult | AirlineStatsResult | RatedFlightResult;