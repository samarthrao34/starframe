const Database = require('./Database');

class Commission {
    static async create(commission) {
        const { id, name, email, phone, location, service, budget, timeline, purpose, description, references, gst } = commission;
        // store references into reference_links column
        await Database.run('INSERT INTO commissions (id, name, email, phone, location, service, budget, timeline, purpose, description, reference_links, gst) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, name, email, phone, location, service, budget, timeline, purpose, description, references, gst]);
        return commission;
    }

    static async findAll() {
        const commissions = await Database.all('SELECT * FROM commissions');
        return commissions;
    }

    static async findById(id) {
        const commission = await Database.get('SELECT * FROM commissions WHERE id = ?', id);
        return commission;
    }
}

module.exports = Commission;