const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

mongoose.connect('mongodb://127.0.0.1:27017/flight_archive')
  .then(() => console.log('✅ Connected to MongoDB (flight_archive)'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Мапінг адаптований під вашу схему БД
const mapFlight = (row) => ({
  flightId: row.flight_id,       // У вашій базі це flight_id
  flightNumber: row.flight_number,
  origin: row.origin_city,       // Ми отримаємо це через JOIN
  destination: row.dest_city,    // Ми отримаємо це через JOIN
  departureTime: row.scheduled_departure, // Правильна назва колонки
  arrivalTime: row.scheduled_arrival,     // Правильна назва колонки
  status: row.status,
  // Оскільки в таблиці flights немає ціни, ставимо заглушку або беремо дефолт
  price: 150.00, 
  currency: 'USD'
});

// --- ЕНДПОЇНТИ ---

// 1. GET /api/flights (Складний запит з JOIN для отримання назв міст)
app.get('/api/flights', async (req, res) => {
  try {
    const query = `
      SELECT 
        f.flight_id, 
        f.flight_number, 
        f.scheduled_departure, 
        f.scheduled_arrival, 
        f.status,
        dep_city.name as origin_city,
        arr_city.name as dest_city
      FROM flights f
      JOIN airports dep_a ON f.dep_airport_id = dep_a.airport_id
      JOIN cities dep_city ON dep_a.city_id = dep_city.city_id
      JOIN airports arr_a ON f.arr_airport_id = arr_a.airport_id
      JOIN cities arr_city ON arr_a.city_id = arr_city.city_id
      ORDER BY f.scheduled_departure ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows.map(mapFlight));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// 2. GET /api/flights/:id
app.get('/api/flights/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Той самий JOIN, але для одного рейсу
    const query = `
      SELECT 
        f.flight_id, f.flight_number, f.scheduled_departure, f.scheduled_arrival, f.status,
        dep_city.name as origin_city, arr_city.name as dest_city
      FROM flights f
      JOIN airports dep_a ON f.dep_airport_id = dep_a.airport_id
      JOIN cities dep_city ON dep_a.city_id = dep_city.city_id
      JOIN airports arr_a ON f.arr_airport_id = arr_a.airport_id
      JOIN cities arr_city ON arr_a.city_id = arr_city.city_id
      WHERE f.flight_id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length > 0) {
      res.json(mapFlight(result.rows[0]));
    } else {
      res.status(404).json({ error: 'Flight not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/flights (Спрощений: вимагає ID аеропортів, або хардкод)
app.post('/api/flights', async (req, res) => {
  try {
    // Увага: Ваша БД вимагає ID аеропортів, а не назви міст.
    // Для спрощення лабораторної ми знайдемо перші ліпші ID або використаємо дефолтні (1 та 2).
    const { flightNumber, departureTime, arrivalTime, status } = req.body;
    
    const result = await pool.query(
      `INSERT INTO flights 
       (flight_number, airline_id, dep_airport_id, arr_airport_id, scheduled_departure, scheduled_arrival, status) 
       VALUES ($1, 1, 1, 2, $2, $3, $4) 
       RETURNING flight_id`, // Повертаємо хоча б ID
      [flightNumber, departureTime, arrivalTime, status || 'Scheduled']
    );
    // Повертаємо успіх (без повного об'єкта, щоб не ускладнювати запит)
    res.json({ success: true, flightId: result.rows[0].flight_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT /api/flights/:id (Тільки статус)
app.put('/api/flights/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    
    const result = await pool.query(
      `UPDATE flights SET status = COALESCE($1, status) WHERE flight_id = $2 RETURNING *`,
      [status, id]
    );
    
    if (result.rows.length > 0) {
      res.json({ success: true, status: result.rows[0].status });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE /api/flights/:id
app.delete('/api/flights/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Спочатку видаляємо квитки, бо є Foreign Key constraint
    await pool.query('DELETE FROM tickets WHERE flight_id = $1', [id]);
    const result = await pool.query('DELETE FROM flights WHERE flight_id = $1', [id]);
    
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/search
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    // Пошук по назві міста через JOIN
    const query = `
      SELECT 
        f.flight_id, f.flight_number, f.scheduled_departure, f.scheduled_arrival, f.status,
        dep_city.name as origin_city, arr_city.name as dest_city
      FROM flights f
      JOIN airports dep_a ON f.dep_airport_id = dep_a.airport_id
      JOIN cities dep_city ON dep_a.city_id = dep_city.city_id
      JOIN airports arr_a ON f.arr_airport_id = arr_a.airport_id
      JOIN cities arr_city ON arr_a.city_id = arr_city.city_id
      WHERE LOWER(dep_city.name) LIKE LOWER($1) OR LOWER(arr_city.name) LIKE LOWER($1)
    `;
    const result = await pool.query(query, [`%${q}%`]);
    res.json(result.rows.map(mapFlight));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET /api/airports (Список міст)
app.get('/api/airports', async (req, res) => {
  try {
    const result = await pool.query("SELECT name FROM cities ORDER BY name");
    res.json(result.rows.map(row => row.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/bookings (Створення квитка)
app.post('/api/bookings', async (req, res) => {
  const { flightId, userId } = req.body;

  if (!flightId || !userId) {
    return res.status(400).json({ error: 'Flight ID and User ID are required' });
  }

  try {
    // Генеруємо випадкове місце (наприклад, 12A), бо в базі це поле NOT NULL
    const randomSeat = Math.floor(Math.random() * 30 + 1) + ['A', 'B', 'C'][Math.floor(Math.random() * 3)];

    const result = await pool.query(
      // ВИПРАВЛЕНО: 
      // 1. booking_time -> booking_date
      // 2. Додано seat_number (обов'язкове поле)
      `INSERT INTO tickets (flight_id, user_id, booking_date, seat_number) 
       VALUES ($1, $2, NOW(), $3) 
       RETURNING ticket_id`,
      [flightId, userId, randomSeat]
    );
    
    res.json({ success: true, ticketId: result.rows[0].ticket_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/bookings (Тепер з реальним іменем користувача та містами)
app.get('/api/bookings', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.ticket_id, 
        f.flight_number, 
        u.username,                  -- Беремо username з таблиці users
        dep_city.name as origin_city, -- Беремо реальне місто вильоту
        arr_city.name as dest_city    -- Беремо реальне місто прильоту
      FROM tickets t
      JOIN flights f ON t.flight_id = f.flight_id
      JOIN users u ON t.user_id = u.user_id
      JOIN airports dep_a ON f.dep_airport_id = dep_a.airport_id
      JOIN cities dep_city ON dep_a.city_id = dep_city.city_id
      JOIN airports arr_a ON f.arr_airport_id = arr_a.airport_id
      JOIN cities arr_city ON arr_a.city_id = arr_city.city_id
      ORDER BY t.ticket_id DESC      -- Спочатку найновіші
      LIMIT 50
    `;
    
    const result = await pool.query(query);
    
    // Мапимо результати для фронтенду
    const bookings = result.rows.map(row => ({
      id: row.ticket_id,
      flight_number: row.flight_number,
      passenger_name: row.username, 
      origin: row.origin_city,
      destination: row.dest_city
    }));
    
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 10. GET /api/stats
app.get('/api/stats', async (req, res) => {
  try {
    const flightsCount = await pool.query("SELECT COUNT(*) FROM flights");
    const ticketsCount = await pool.query("SELECT COUNT(*) FROM tickets");
    const delayedCount = await pool.query("SELECT COUNT(*) FROM flights WHERE status = 'Delayed'");
    
    res.json({
      totalFlights: parseInt(flightsCount.rows[0].count),
      totalBookings: parseInt(ticketsCount.rows[0].count),
      delayed: parseInt(delayedCount.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, username FROM users ORDER BY username');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/flights/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE flights SET status = $1 WHERE flight_id = $2 RETURNING status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    res.json({ success: true, status: result.rows[0].status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const ArchivedFlight = require('./src/backend/models/ArchivedFlight'); 
const ArchiveService = require('./src/backend/services/ArchiveService');

// --- ЕНДПОЇНТ МІГРАЦІЇ (ETL Process) ---
app.post('/api/archive', async (req, res) => {
  const { fromDate, toDate } = req.body;
  
  // Створюємо екземпляр сервісу, передаючи йому пул з'єднань
  const archiveService = new ArchiveService(pool);

  try {
    // Вся складна логіка тепер всередині методу класу
    const result = await archiveService.archiveFlights(fromDate, toDate);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/archive/list', async (req, res) => {
  try {
    console.log('📥 Отримано запит на список архіву...');
    const docs = await ArchivedFlight.find().sort({ archivedAt: -1 }).limit(50);
    console.log(`📤 Знайдено документів у MongoDB: ${docs.length}`);
    res.json(docs);
  } catch (err) {
    console.error('❌ Помилка читання архіву:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- ЗАВДАННЯ 5: Аналітичні запити MongoDB ---

// Допоміжна модель для рейтингу (щоб було з чим робити JOIN)
const RatingSchema = new mongoose.Schema({ airline: String, rating: Number });
const AirlineRating = mongoose.model('AirlineRating', RatingSchema, 'airline_ratings');

// Ендпоїнт для генерації тестових рейтингів (щоб запит В працював)
app.post('/api/analytics/seed-ratings', async (req, res) => {
  await AirlineRating.deleteMany({});
  await AirlineRating.insertMany([
    { airline: 'Air France', rating: 4.8 },
    { airline: 'Lviv Airlines', rating: 4.2 },
    { airline: 'Kharkiv Wings', rating: 3.9 },
    { airline: 'Odesa Air', rating: 4.5 }
  ]);
  res.json({ success: true, message: 'Рейтинги створено!' });
});

// А) Вибірка з умовами та сортуванням
// Знайти всі скасовані рейси з Парижа, сортувати за датою вильоту
app.get('/api/analytics/query-a', async (req, res) => {
  try {
    const result = await ArchivedFlight.find({
      status: 'Cancelled',
      'route.origin.city': 'Paris'
    })
    .sort({ 'schedule.departure': -1 }) // Сортування: від нових до старих
    .select('flightNumber airline.name route.origin.city route.destination.city status schedule.departure'); // Проєкція (вибрати тільки ці поля)
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Б) Групування та агрегація
// Порахувати кількість польотів та середню ціну квитка для кожної авіакомпанії
app.get('/api/analytics/query-b', async (req, res) => {
  try {
    const result = await ArchivedFlight.aggregate([
      { $unwind: "$passengerManifest" }, // Розгортаємо масив квитків, щоб рахувати середню ціну
      {
        $group: {
          _id: "$airline.name", // Групуємо по імені авіакомпанії
          totalFlights: { $addToSet: "$flightNumber" }, // Збираємо унікальні рейси (бо після unwind їх стало багато)
          avgPrice: { $avg: "$passengerManifest.price" }, // Середня ціна
          totalRevenue: { $sum: "$passengerManifest.price" } // Загальний виторг
        }
      },
      {
        $project: {
          airline: "$_id",
          flightCount: { $size: "$totalFlights" },
          avgPrice: { $round: ["$avgPrice", 2] }, // Округлення
          totalRevenue: 1,
          _id: 0
        }
      },
      { $sort: { totalRevenue: -1 } } // Сортуємо за виторгом
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// В) З'єднання ($lookup)
// Отримати список рейсів і "підтягнути" рейтинг авіакомпанії з іншої колекції
app.get('/api/analytics/query-c', async (req, res) => {
  try {
    const result = await ArchivedFlight.aggregate([
      { $limit: 10 }, // Беремо тільки 10 останніх для прикладу
      {
        $lookup: {
          from: "airline_ratings",      // З якою колекцією з'єднуємо
          localField: "airline.name",   // Поле в ArchivedFlight
          foreignField: "airline",      // Поле в airline_ratings
          as: "ratingInfo"              // Куди записати результат
        }
      },
      {
        $project: {
          flightNumber: 1,
          "airline.name": 1,
          rating: { $arrayElemAt: ["$ratingInfo.rating", 0] } // Дістаємо число з масиву
        }
      }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ DB Server running on http://localhost:${PORT}`);
});