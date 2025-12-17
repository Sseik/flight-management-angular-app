const BaseEntity = require('./BaseEntity');

class Passenger extends BaseEntity {
    constructor(id, fullName, email, passport) {
        super(id);
        this.fullName = fullName;
        this.email = email;
        this.passport = passport;
    }
}

class Ticket extends BaseEntity {
    constructor(id, seat, price, passenger) {
        super(id);
        this.seat = seat;
        this.price = price;
        
        // Асоціація: Квиток знає про пасажира
        this.passenger = passenger; // Об'єкт типу Passenger
        
        this.baggage = []; // Масив даних (як в умові)
    }

    addBaggage(weight, type) {
        this.baggage.push({ weight, type });
    }
}

module.exports = { Ticket, Passenger };