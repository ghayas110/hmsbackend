const { sequelize, TestDefinition } = require('./src/models');

async function checkId() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const idToCheck = 35;
        console.log(`Checking for TestDefinition with ID: ${idToCheck}`);

        const test = await TestDefinition.findByPk(idToCheck);

        if (test) {
            console.log('FOUND:', test.toJSON());
        } else {
            console.log('NOT FOUND: ID', idToCheck, 'does not exist.');

            // List recent IDs to help debugging
            const recent = await TestDefinition.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'name']
            });
            console.log('Most recent TestDefinitions:', recent.map(t => t.toJSON()));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkId();
