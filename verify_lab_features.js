const { sequelize, TestCategory, TestDefinition } = require('./src/models');

async function verifyLabFeatures() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        // Fix potential column issue manually for MySQL
        try {
            console.log('Attempting to modify doctor_id to allow NULL...');
            await sequelize.query('ALTER TABLE TestCategories MODIFY doctor_id INT NULL;');
        } catch (err) {
            console.log('Column modification might have failed or not needed:', err.message);
        }

        // Sync models to ensure new columns exist
        console.log('Syncing models...');
        await sequelize.sync({ alter: true });
        console.log('Models synced.');

        // 1. Create Test Category (mimicking Lab Tech - no doctor_id)
        console.log('Creating Test Category...');
        const categoryData = {
            name: 'Hematology',
            code: 'HEM-001',
            description: 'Blood related tests',
            status: 'active',
            lab_type: 'pathology',
            // doctor_id is undefined/null
        };

        const category = await TestCategory.create(categoryData);
        console.log('Test Category created:', category.toJSON());

        // 2. Create Test Definition with Parameters
        console.log('Creating Test Definition...');
        const testData = {
            category_id: category.id,
            name: 'Complete Blood Count (CBC)',
            parameters: [
                {
                    name: 'WBC',
                    unit: '10^9/L',
                    normal_range_min: 4.5,
                    normal_range_max: 11.0,
                    type: 'number'
                },
                {
                    name: 'RBC',
                    unit: '10^12/L',
                    normal_range_min: 4.5,
                    normal_range_max: 5.9,
                    type: 'number'
                }
            ]
        };

        const test = await TestDefinition.create(testData);
        console.log('Test Definition created:', test.toJSON());

        // 3. Verify Parameters are stored correctly
        if (test.parameters && test.parameters.length === 2 && test.parameters[0].name === 'WBC') {
            console.log('SUCCESS: Parameters stored correctly.');
        } else {
            console.error('FAILURE: Parameters not stored correctly.', test.parameters);
        }

        // 4. Update Test Definition
        console.log('Updating Test Definition...');
        const updatedParams = [
            ...test.parameters,
            { name: 'Platelets', unit: '10^9/L', normal_range_min: 150, normal_range_max: 450, type: 'number' }
        ];

        await test.update({
            name: 'Full Blood Count (FBC)',
            parameters: updatedParams
        });

        const updatedTest = await TestDefinition.findByPk(test.id);
        if (updatedTest.name === 'Full Blood Count (FBC)' && updatedTest.parameters.length === 3) {
            console.log('SUCCESS: Test Definition updated correctly.');
        } else {
            console.error('FAILURE: Test updated failed.');
        }

        // 5. Delete Test Definition
        console.log('Deleting Test Definition...');
        await updatedTest.destroy();

        const deletedTest = await TestDefinition.findByPk(test.id);
        if (!deletedTest) {
            console.log('SUCCESS: Test Definition deleted correctly.');
        } else {
            console.error('FAILURE: Test deletion failed.');
        }

        // Cleanup Category
        console.log('Cleaning up Category...');
        await category.destroy();
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await sequelize.close();
    }
}

verifyLabFeatures();
