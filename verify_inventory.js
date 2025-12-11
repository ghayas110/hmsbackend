const { Inventory, sequelize } = require('./src/models');

async function verifyInventory() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const count = await Inventory.count();
        console.log(`Total inventory items: ${count}`);

        const items = await Inventory.findAll({ limit: 5 });
        console.log('Sample items:', JSON.stringify(items, null, 2));

    } catch (error) {
        console.error('Error verifying inventory:', error);
    } finally {
        await sequelize.close();
    }
}

verifyInventory();
