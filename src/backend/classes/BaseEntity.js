/**
 * Базовий клас.
 * Реалізує принцип: СПАДКУВАННЯ (Inheritance).
 */
class BaseEntity {
    constructor(id) {
        this.id = id;
    }

    // Загальний метод для всіх сутностей
    getId() {
        return this.id;
    }
}

module.exports = BaseEntity;