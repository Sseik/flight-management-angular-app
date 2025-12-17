const mongoose = require('mongoose');

// 1. Сутність "Пасажир/Квиток" (вкладена)
const TicketSchema = new mongoose.Schema({
  ticketNumber: String,
  seat: String,
  price: Number,
  bookedAt: Date,
  passenger: {
    fullName: String,
    email: String,
    passport: String
  },
  baggage: [{
    weightKg: Number,
    type: { type: String } 
  }]
}, { _id: false });

// 2. Сутність "Маршрут/Аеропорт" (вкладена)
const AirportInfoSchema = new mongoose.Schema({
  airportName: String,
  iataCode: String,
  city: String,
  country: String
}, { _id: false });

// 3. Головна сутність "Рейс" (корінь документа)
const ArchivedFlightSchema = new mongoose.Schema({
  // Метадані архіву
  archivedAt: { type: Date, default: Date.now },
  
  // Дані рейсу
  flightNumber: { type: String, required: true, index: true }, // Індекс для швидкого пошуку
  status: String,
  
  airline: {
    name: String,
    code: String,
    country: String
  },
  
  // Часові мітки
  schedule: {
    departure: Date,
    arrival: Date
  },
  actual: {
    departure: Date,
    arrival: Date
  },

  // Маршрут (Origin -> Destination)
  route: {
    origin: AirportInfoSchema,
    destination: AirportInfoSchema
  },

  // Список квитків (масив вкладених документів)
  passengerManifest: [TicketSchema],

  // Агреговані дані (для швидкої аналітики без перерахунку масиву)
  stats: {
    totalPassengers: Number,
    totalLuggageWeight: Number
  }
});

// Створення моделі
const ArchivedFlight = mongoose.model('ArchivedFlight', ArchivedFlightSchema, 'archivedflights');

module.exports = ArchivedFlight;