const { TestCategory, TestDefinition, sequelize } = require('./src/models');

async function verifyTests() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const categories = await TestCategory.findAll({
            include: [TestDefinition]
        });

        console.log(`Total Categories: ${categories.length}`);

        categories.forEach(cat => {
            console.log(`- Category: ${cat.name} (${cat.TestDefinitions.length} tests)`);
            if (cat.TestDefinitions.length > 0) {
                console.log(`  Tests: ${cat.TestDefinitions.map(t => t.name).join(', ')}`);
            }
        });

    } catch (error) {
        console.error('Error verifying tests:', error);
    } finally {
        await sequelize.close();
    }
}

verifyTests();
