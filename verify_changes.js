const API_URL = 'http://localhost:8001/api'; // Adjust port if necessary

// Helper to log results
const logResult = (testName, success, data) => {
    console.log(`[${success ? 'PASS' : 'FAIL'}] ${testName}`);
    if (!success) console.error(data);
    else if (data) console.log(data);
};

async function runTests() {
    try {
        console.log("Please run this script with a valid doctor token as an argument: node verify_changes.js <token>");
        const token = process.argv[2];

        if (!token) {
            console.error("No token provided. Please provide a valid doctor JWT token.");
            process.exit(1);
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Fetch appointments
        console.log("\nFetching appointments...");
        const appointmentsRes = await fetch(`${API_URL}/doctors/appointments`, { headers });
        const appointments = await appointmentsRes.json();

        if (!appointmentsRes.ok) {
            console.error("Failed to fetch appointments:", appointments);
            return;
        }

        if (appointments.length === 0) {
            console.error("No appointments found to test with.");
            return;
        }

        const appointmentId = appointments[0].id;
        console.log(`Using Appointment ID: ${appointmentId}`);

        // 3. Update Appointment
        console.log("\nTesting Update Appointment...");
        const updateAppRes = await fetch(`${API_URL}/doctors/appointments/${appointmentId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ notes: "Updated notes by verification script" })
        });
        const updateAppData = await updateAppRes.json();
        logResult("Update Appointment", updateAppRes.ok, updateAppData);

        // 4. Create a dummy prescription
        console.log("\nCreating a test prescription...");
        const createPresRes = await fetch(`${API_URL}/doctors/prescriptions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                appointment_id: appointmentId,
                medicines: [{ name: "Test Med", dosage: "10mg", frequency: "Once a day", duration: "5 days" }],
                notes: "Test prescription"
            })
        });
        const createPresData = await createPresRes.json();

        if (!createPresRes.ok) {
            console.error("Failed to create prescription:", createPresData);
            return;
        }

        const prescriptionId = createPresData.prescription.id;
        console.log(`Created Prescription ID: ${prescriptionId}`);

        // 5. Update Prescription
        console.log("\nTesting Update Prescription...");
        const updatePresRes = await fetch(`${API_URL}/doctors/prescriptions/${prescriptionId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ notes: "Updated prescription notes by verification script" })
        });
        const updatePresData = await updatePresRes.json();
        logResult("Update Prescription", updatePresRes.ok, updatePresData);

        // 6. Delete Prescription
        console.log("\nTesting Delete Prescription...");
        const deletePresRes = await fetch(`${API_URL}/doctors/prescriptions/${prescriptionId}`, {
            method: 'DELETE',
            headers
        });
        const deletePresData = await deletePresRes.json();
        logResult("Delete Prescription", deletePresRes.ok, deletePresData);

        // 7. Delete Appointment (Skipped)
        console.log("\nSkipping Delete Appointment test on existing data to avoid data loss.");
        console.log("To test delete appointment, please manually delete an appointment you don't need.");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

runTests();
