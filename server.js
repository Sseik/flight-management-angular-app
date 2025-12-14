const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
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
  try {
    const { flightId, passenger } = req.body;
    // Використовуємо дефолтний user_id=1, бо у нас немає повноцінної авторизації
    const result = await pool.query(
      `INSERT INTO tickets (flight_id, user_id, seat_number, passenger_info) 
       VALUES ($1, 1, '1A', $2) RETURNING ticket_id`,
      [flightId, JSON.stringify({ name: passenger })]
    );
    res.json({ success: true, ticketId: result.rows[0].ticket_id });
  } catch (err) {
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

app.listen(PORT, () => {
  console.log(`✅ DB Server running on http://localhost:${PORT}`);
});