const BaseEntity = require('./BaseEntity');

class Airline extends BaseEntity {
    constructor(id, name, code, country) {
        super(id);
        this.name = name;
        this.code = code;
        this.country = country;
    }
}

class Airport extends BaseEntity {
    constructor(id, name, iataCode, city) {
        super(id);
        this.name = name;
        this.iataCode = iataCode;
        this.city = city;
    }
}

module.exports = { Airline, Airport };