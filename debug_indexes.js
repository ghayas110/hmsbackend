const { sequelize } = require('./src/models');

async function debugIndexes() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const [results, metadata] = await sequelize.query(`
            SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users';
        `);

        console.log('Current Indexes on Users table:');
        console.table(results);

        console.log(`Total count: ${results.length}`);
    } catch (error) {
        console.error('Error querying indexes:', error);
    } finally {
        await sequelize.close();
    }
}

debugIndexes();
