// src/backend/services/ArchiveService.js
const ArchivedFlight = require('../models/ArchivedFlight');
const Flight = require('../classes/Flight');
const { Airline, Airport } = require('../classes/RefEntities'); 
const { Ticket, Passenger } = require('../classes/Ticket');

class ArchiveService {
  constructor(pgPool) {
    this.pool = pgPool; // Впровадження залежності (Dependency Injection)
  }

  /**
   * Головний метод: Виконує ETL процес (Extract -> Transform -> Load)
   */
  async archiveFlights(fromDate, toDate) {
    const client = await this.pool.connect();
    
    try {
      console.log(`📦 [Service] Start archiving: ${fromDate} - ${toDate}`);

      // 1. EXTRACT: Отримуємо ID рейсів
      const flightIds = await this._getCandidates(client, fromDate, toDate);
      
      if (flightIds.length === 0) {
        return { success: true, count: 0, message: 'No flights found' };
      }

      await client.query('BEGIN'); // Старт транзакції PostgreSQL

      let processedCount = 0;
      for (const id of flightIds) {
        // 2. TRANSFORM: Збираємо дані та формуємо документ
        const flightData = await this._getFlightDetails(client, id);
        const ticketsData = await this._getTicketsAndBaggage(client, id);
        
        const mongoDoc = this._mapToMongoModel(flightData, ticketsData);

        // 3. LOAD: Зберігаємо в MongoDB
        await mongoDoc.save();

        // 4. CLEANUP: Видаляємо з PostgreSQL
        await this._deleteFromPostgres(client, id);

        processedCount++;
      }

      await client.query('COMMIT');
      console.log(`✅ [Service] Archived ${processedCount} flights.`);
      return { success: true, count: processedCount };

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ [Service] Error:', err);
      throw err; // Прокидаємо помилку нагору
    } finally {
      client.release();
    }
  }

  // --- PRIVATE HELPER METHODS (Інкапсуляція) ---

  async _getCandidates(client, from, to) {
    const query = `
      SELECT flight_id FROM flights 
      WHERE (status = 'Arrived' OR status = 'Cancelled')
      AND scheduled_departure BETWEEN $1 AND $2
    `;
    const res = await client.query(query, [from, to]);
    return res.rows.map(row => row.flight_id);
  }

  async _getFlightDetails(client, flightId) {
    const query = `
        SELECT 
          f.flight_number, f.status, f.scheduled_departure, f.scheduled_arrival,
          f.actual_departure, f.actual_arrival,
          al.name as airline_name, al.airline_code, al.country as airline_country,
          dep_a.name as dep_airport, dep_a.iata_code as dep_code, dep_c.name as dep_city, dep_cnt.name as dep_country,
          arr_a.name as arr_airport, arr_a.iata_code as arr_code, arr_c.name as arr_city, arr_cnt.name as arr_country
        FROM flights f
        JOIN airlines al ON f.airline_id = al.airline_id
        JOIN airports dep_a ON f.dep_airport_id = dep_a.airport_id
        JOIN cities dep_c ON dep_a.city_id = dep_c.city_id
        JOIN countries dep_cnt ON dep_c.country_id = dep_cnt.country_id
        JOIN airports arr_a ON f.arr_airport_id = arr_a.airport_id
        JOIN cities arr_c ON arr_a.city_id = arr_c.city_id
        JOIN countries arr_cnt ON arr_c.country_id = arr_cnt.country_id
        WHERE f.flight_id = $1
    `;
    return (await client.query(query, [flightId])).rows[0];
  }

  async _getTicketsAndBaggage(client, flightId) {
    const query = `
        SELECT 
          t.ticket_id, t.seat_number, t.price, t.booking_date, t.passenger_info,
          u.username as passenger_name, u.email,
          COALESCE(json_agg(json_build_object('weightKg', b.weight_kg, 'type', b.type)) 
                   FILTER (WHERE b.bag_id IS NOT NULL), '[]'::json) as baggage
        FROM tickets t
        JOIN users u ON t.user_id = u.user_id
        LEFT JOIN baggage b ON t.ticket_id = b.ticket_id
        WHERE t.flight_id = $1
        GROUP BY t.ticket_id, u.user_id
    `;
    return (await client.query(query, [flightId])).rows;
  }

  _mapToMongoModel(fData, tData) {
    // --- ЕТАП 1: Створення об'єктів бізнес-логіки (OOP Classes) ---
    // Це демонструє виконання Завдання 6 (Агрегація, Композиція)

    // 1. Створюємо об'єкти-довідники (Агрегація)
    // Ми передаємо null замість ID, бо в архіві старі ID не грають ролі, 
    // головне - зберегти дані.
    const airlineObj = new Airline(null, fData.airline_name, fData.airline_code, fData.airline_country);
    
    const originObj = new Airport(null, fData.dep_airport, fData.dep_code, fData.dep_city);
    // Додаємо країну вручну, якщо вона є в класі, але немає в конструкторі (залежить від вашої реалізації)
    originObj.country = fData.dep_country; 

    const destObj = new Airport(null, fData.arr_airport, fData.arr_code, fData.arr_city);
    destObj.country = fData.arr_country;

    // 2. Створюємо Головний Об'єкт Рейсу
    const flightModel = new Flight(
        null, 
        fData.flight_number, 
        fData.status, 
        airlineObj, 
        originObj, 
        destObj
    );

    // Додаємо дані про час (які не ввійшли в базовий конструктор класу, але потрібні для Mongo)
    flightModel.schedule = {
        departure: fData.scheduled_departure,
        arrival: fData.scheduled_arrival
    };
    flightModel.actual = {
        departure: fData.actual_departure,
        arrival: fData.actual_arrival
    };

    // 3. Наповнюємо квитками (Композиція)
    tData.forEach(t => {
        // Створюємо Пасажира (Асоціація)
        const passengerObj = new Passenger(t.user_id, t.passenger_name, t.email, t.passenger_info?.passport || 'N/A');
        
        // Створюємо Квиток
        const ticketObj = new Ticket(t.ticket_id, t.seat_number, parseFloat(t.price), passengerObj);
        
        // Додаємо інформацію про покупку
        ticketObj.bookedAt = t.booking_date; 

        // Обробка багажу та додавання до квитка
        let rawBaggage = [];
        // Захист від того, що Postgres іноді повертає рядок JSON, а іноді об'єкт
        if (Array.isArray(t.baggage)) {
            rawBaggage = t.baggage;
        } else if (typeof t.baggage === 'string') {
            try { 
                rawBaggage = JSON.parse(t.baggage); 
            } catch(e) { 
                console.error('Baggage parse error', e);
                rawBaggage = []; 
            }
        }

        // Використовуємо метод класу Ticket для додавання багажу
        rawBaggage.forEach(b => {
            ticketObj.addBaggage(b.weightKg, b.type);
        });

        // Використовуємо метод класу Flight для додавання квитка
        flightModel.addTicket(ticketObj);
    });

    // --- ЕТАП 2: Мапінг на схему Mongoose ---
    // Тепер ми беремо дані з нашої чистої OOP моделі (flightModel) 
    // і перекладаємо їх у формат, який очікує MongoDB.

    return new ArchivedFlight({
        flightNumber: flightModel.flightNumber,
        status: flightModel.status,
        archivedAt: new Date(),
        airline: {
            name: flightModel.airline.name,
            code: flightModel.airline.code,
            country: flightModel.airline.country
        },
        schedule: flightModel.schedule,
        actual: flightModel.actual,
        route: {
            origin: {
                airportName: flightModel.origin.name,
                iataCode: flightModel.origin.iataCode,
                city: flightModel.origin.city,
                country: flightModel.origin.country
            },
            destination: {
                airportName: flightModel.destination.name,
                iataCode: flightModel.destination.iataCode,
                city: flightModel.destination.city,
                country: flightModel.destination.country
            }
        },
        // Мапимо масив об'єктів Ticket в структуру документу Mongo
        passengerManifest: flightModel.manifest.map(ticket => ({
            ticketNumber: `T-${ticket.id}`, // Використовуємо геттер або поле класу
            seat: ticket.seat,
            price: ticket.price,
            bookedAt: ticket.bookedAt,
            passenger: {
                fullName: ticket.passenger.fullName,
                email: ticket.passenger.email,
                passport: ticket.passenger.passport
            },
            baggage: ticket.baggage // Клас Ticket зберігає це в this.baggage
        }))
    });
  }

  async _deleteFromPostgres(client, flightId) {
      await client.query(`DELETE FROM baggage WHERE ticket_id IN (SELECT ticket_id FROM tickets WHERE flight_id = $1)`, [flightId]);
      await client.query('DELETE FROM tickets WHERE flight_id = $1', [flightId]);
      await client.query('DELETE FROM flights WHERE flight_id = $1', [flightId]);
  }
}

module.exports = ArchiveService;