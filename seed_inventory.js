const { Inventory, sequelize } = require('./src/models');

const medicines = [
    { medicine_name: 'Paracetamol', stock: 500, price: 5.00, expiry_date: '2026-12-31', category: 'Analgesic', supplier: 'PharmaCorp', min_stock: 50 },
    { medicine_name: 'Amoxicillin', stock: 200, price: 15.00, expiry_date: '2025-06-30', category: 'Antibiotic', supplier: 'MediSupply', min_stock: 20 },
    { medicine_name: 'Ibuprofen', stock: 300, price: 8.00, expiry_date: '2026-06-30', category: 'Analgesic', supplier: 'PharmaCorp', min_stock: 30 },
    { medicine_name: 'Metformin', stock: 400, price: 10.00, expiry_date: '2027-01-15', category: 'Antidiabetic', supplier: 'HealthCo', min_stock: 40 },
    { medicine_name: 'Atorvastatin', stock: 150, price: 25.00, expiry_date: '2025-11-30', category: 'Cardiovascular', supplier: 'MediSupply', min_stock: 15 },
    { medicine_name: 'Omeprazole', stock: 250, price: 12.00, expiry_date: '2026-03-31', category: 'Gastrointestinal', supplier: 'HealthCo', min_stock: 25 },
    { medicine_name: 'Lisinopril', stock: 100, price: 20.00, expiry_date: '2025-08-31', category: 'Cardiovascular', supplier: 'PharmaCorp', min_stock: 10 },
    { medicine_name: 'Amlodipine', stock: 120, price: 18.00, expiry_date: '2026-02-28', category: 'Cardiovascular', supplier: 'MediSupply', min_stock: 12 },
    { medicine_name: 'Levothyroxine', stock: 80, price: 30.00, expiry_date: '2025-10-31', category: 'Hormone', supplier: 'HealthCo', min_stock: 8 },
    { medicine_name: 'Metoprolol', stock: 110, price: 22.00, expiry_date: '2026-05-31', category: 'Cardiovascular', supplier: 'PharmaCorp', min_stock: 11 },
    { medicine_name: 'Azithromycin', stock: 60, price: 40.00, expiry_date: '2025-04-30', category: 'Antibiotic', supplier: 'MediSupply', min_stock: 6 },
    { medicine_name: 'Simvastatin', stock: 130, price: 24.00, expiry_date: '2026-09-30', category: 'Cardiovascular', supplier: 'HealthCo', min_stock: 13 },
    { medicine_name: 'Losartan', stock: 90, price: 28.00, expiry_date: '2025-12-31', category: 'Cardiovascular', supplier: 'PharmaCorp', min_stock: 9 },
    { medicine_name: 'Gabapentin', stock: 70, price: 35.00, expiry_date: '2026-07-31', category: 'Analgesic', supplier: 'MediSupply', min_stock: 7 },
    { medicine_name: 'Hydrochlorothiazide', stock: 140, price: 16.00, expiry_date: '2025-09-30', category: 'Cardiovascular', supplier: 'HealthCo', min_stock: 14 },
    { medicine_name: 'Sertraline', stock: 50, price: 50.00, expiry_date: '2026-01-31', category: 'Psychotropic', supplier: 'PharmaCorp', min_stock: 5 },
    { medicine_name: 'Furosemide', stock: 160, price: 14.00, expiry_date: '2025-07-31', category: 'Cardiovascular', supplier: 'MediSupply', min_stock: 16 },
    { medicine_name: 'Pantoprazole', stock: 220, price: 13.00, expiry_date: '2026-04-30', category: 'Gastrointestinal', supplier: 'HealthCo', min_stock: 22 },
    { medicine_name: 'Tamsulosin', stock: 85, price: 32.00, expiry_date: '2025-11-15', category: 'Urological', supplier: 'PharmaCorp', min_stock: 9 },
    { medicine_name: 'Cetirizine', stock: 350, price: 6.00, expiry_date: '2027-02-28', category: 'Antihistamine', supplier: 'MediSupply', min_stock: 35 }
];

async function seedInventory() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Clearing existing inventory...');
        await Inventory.destroy({ where: {} });

        console.log('Seeding inventory...');
        await Inventory.bulkCreate(medicines);

        console.log('Seeding complete. 20 medicines added.');
    } catch (error) {
        console.error('Error seeding inventory:', error);
    } finally {
        await sequelize.close();
    }
}

seedInventory();
