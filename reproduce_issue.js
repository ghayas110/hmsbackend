const { sequelize, TestCategory, TestDefinition } = require('./src/models');

async function reproduceIssue() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Setup: Create a test definition
        const category = await TestCategory.create({
            name: 'Temp Category',
            doctor_id: null // valid now
        });

        const test = await TestDefinition.create({
            category_id: category.id,
            name: 'Original Name',
            parameters: []
        });

        console.log('Original Test:', test.toJSON());

        // Scenario 2: Try to update with INVALID category_id
        console.log('Attempting update with invalid category_id...');
        try {
            await test.update({ category_id: 999999 }); // Assuming this doesn't exist
            console.log('UNEXPECTED: Update with invalid FK worked (should fail).');

        } catch (err) {
            console.log('EXPECTED FAILURE: Update with invalid FK failed.');
            console.log('Error Message:', err.message);
        }

        // Clean up
        await test.destroy();
        await category.destroy();

    } catch (error) {
        console.error('Setup failed:', error);
    } finally {
        await sequelize.close();
    }
}

reproduceIssue();
