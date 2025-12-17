const BaseEntity = require('./BaseEntity');

class Flight extends BaseEntity {
    constructor(id, flightNumber, status, airline, origin, destination) {
        super(id);
        this.flightNumber = flightNumber;
        this.status = status;

        // АГРЕГАЦІЯ:
        // Ці об'єкти передаються ззовні. Якщо видалити Flight, 
        // Airline та Airport залишаться жити своїм життям.
        this.airline = airline;       // Тип Airline
        this.origin = origin;         // Тип Airport
        this.destination = destination; // Тип Airport

        // КОМПОЗИЦІЯ:
        // Рейс володіє списком квитків.
        // Ми створюємо/зберігаємо їх всередині об'єкта рейсу.
        this.manifest = []; // Масив об'єктів Ticket
    }

    // Метод управління даними
    addTicket(ticket) {
        this.manifest.push(ticket);
    }

    // Бізнес-логіка: розрахунок заповненості
    getPassengerCount() {
        return this.manifest.length;
    }

    // Бізнес-логіка: розрахунок доходу
    getTotalRevenue() {
        return this.manifest.reduce((sum, ticket) => sum + ticket.price, 0);
    }
}

module.exports = Flight;