const { Doctor, TestCategory, TestDefinition, sequelize } = require('./src/models');

const testCategories = [
    {
        name: 'Hematology',
        code: 'HEM',
        description: 'Blood related tests',
        lab_type: 'pathology',
        tests: ['CBC', 'ESR', 'Blood Group', 'Hemoglobin', 'Platelet Count']
    },
    {
        name: 'Biochemistry',
        code: 'BIO',
        description: 'Chemical analysis of body fluids',
        lab_type: 'pathology',
        tests: ['Lipid Profile', 'Liver Function Test', 'Kidney Function Test', 'Blood Sugar Fasting', 'HbA1c']
    },
    {
        name: 'Radiology',
        code: 'RAD',
        description: 'Imaging tests',
        lab_type: 'radiology',
        tests: ['X-Ray Chest', 'Ultrasound Abdomen', 'CT Scan Head', 'MRI Brain']
    },
    {
        name: 'Microbiology',
        code: 'MICRO',
        description: 'Study of microorganisms',
        lab_type: 'pathology',
        tests: ['Urine Culture', 'Blood Culture', 'Sputum Culture']
    },
    {
        name: 'Serology',
        code: 'SERO',
        description: 'Serum analysis',
        lab_type: 'pathology',
        tests: ['Dengue NS1', 'Typhoid IgG/IgM', 'Hepatitis B Surface Antigen']
    }
];

async function seedTests() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Find a doctor to assign these categories to
        const doctor = await Doctor.findOne();
        if (!doctor) {
            console.error('No doctors found in the database. Please create a doctor first.');
            process.exit(1);
        }
        console.log(`Using Doctor ID: ${doctor.id} for seeding.`);

        // Clear existing (optional, but good for clean seed)
        // await TestDefinition.destroy({ where: {} });
        // await TestCategory.destroy({ where: {} });

        for (const catData of testCategories) {
            // Create Category
            const [category, created] = await TestCategory.findOrCreate({
                where: { code: catData.code, doctor_id: doctor.id },
                defaults: {
                    name: catData.name,
                    description: catData.description,
                    lab_type: catData.lab_type,
                    doctor_id: doctor.id
                }
            });

            if (created) {
                console.log(`Created Category: ${category.name}`);
            } else {
                console.log(`Category exists: ${category.name}`);
            }

            // Create Definitions
            for (const testName of catData.tests) {
                const [test, testCreated] = await TestDefinition.findOrCreate({
                    where: { category_id: category.id, name: testName },
                    defaults: {
                        category_id: category.id,
                        name: testName
                    }
                });
                if (testCreated) {
                    console.log(`  - Added Test: ${testName}`);
                }
            }
        }

        console.log('Seeding complete.');

    } catch (error) {
        console.error('Error seeding tests:', error);
    } finally {
        await sequelize.close();
    }
}

seedTests();
