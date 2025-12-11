const { sequelize } = require('./src/models');

async function fixIndexes() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const [results] = await sequelize.query(`
            SELECT INDEX_NAME 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND INDEX_NAME != 'PRIMARY';
        `);

        // Filter valid index names (strings) and remove duplicates
        const indexNames = [...new Set(results.map(r => r.INDEX_NAME).filter(Boolean))];

        console.log(`Found ${indexNames.length} indexes to drop.`);

        for (const indexName of indexNames) {
            console.log(`Dropping index: ${indexName}`);
            try {
                await sequelize.query(`DROP INDEX \`${indexName}\` ON Users`);
            } catch (err) {
                console.error(`Failed to drop index ${indexName}:`, err.message);
            }
        }

        console.log('Finished dropping redundant indexes.');

    } catch (error) {
        console.error('Error fixing indexes:', error);
    } finally {
        await sequelize.close();
    }
}

fixIndexes();
