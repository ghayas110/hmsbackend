const { sequelize, TestCategory, TestDefinition } = require('./src/models');

async function debugUpdate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Setup
        const category = await TestCategory.create({ name: 'Debug Category' });
        const test = await TestDefinition.create({
            category_id: category.id,
            name: 'Debug Test',
            parameters: []
        });

        console.log('Test Created:', test.id);

        try {
            // Case 1: Stringified parameters (Common parsing issue)
            console.log('Testing Stringified Parameters...');
            const stringParams = JSON.stringify([{ name: 'Test', type: 'number' }]);

            // Simulation of controller handling
            let updates = {};
            const reqBody = { parameters: stringParams };

            // Controller logic simulation
            if (reqBody.parameters !== undefined) {
                updates.parameters = reqBody.parameters;
            }

            await test.update(updates);
            console.log('SUCCESS: Update with stringified parameters worked.');

        } catch (err) {
            console.log('FAILURE: Update with stringified parameters failed.');
            console.log('Error:', err.message);
        }

        try {
            // Case 2: Null Category Update (Constraint violation check)
            console.log('Testing Null Category ID...');

            // This SHOULD fail validation in controller before reaching DB
            // But let's see what DB does if we bypass
            await test.update({ category_id: null });
            console.log('UNEXPECTED: Update with NULL category_id worked (should be NotNull violation).');
        } catch (err) {
            console.log('EXPECTED FAILURE: Update with NULL category_id failed.');
            console.log('Error:', err.message);
        }

        // Cleanup
        await test.destroy();
        await category.destroy();

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await sequelize.close();
    }
}

debugUpdate();
