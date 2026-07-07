const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


let adminStats = { doctorsCount: 12, patientsCount: 148, solvedCases: 94 };
let appointments = [
    { id: 1, patientName: "Alex Mercer", doctorSpecialization: "Cardiology", date: "2026-07-15", status: "Pending" },
    { id: 2, patientName: "Sarah Connor", doctorSpecialization: "Neurology", date: "2026-07-12", status: "Approved" }
];


app.post('/api/auth/login', (req, require, res) => {
    const { username, password, role } = req.body;
    
    // Simple verification rule (In production, use bcrypt + JWT + MongoDB validation)
    if (password === "secure123" && username.trim() !== "") {
        return res.json({ success: true, role: role, username: username });
    }
    res.status(401).json({ success: false, message: "Invalid credentials. Use 'secure123' for testing." });
});


app.get('/api/admin/stats', (req, res) => {
    res.json(adminStats);
});


app.get('/api/appointments', (req, res) => {
    res.json(appointments);
});


app.post('/api/appointments/update', (req, res) => {
    const { id, status } = req.body;
    const appointment = appointments.find(a => a.id === parseInt(id));
    if (appointment) {
        appointment.status = status;
        if (status === "Approved") adminStats.solvedCases += 1; // Increment solved cases simulation
        return res.json({ success: true, appointments });
    }
    res.status(400).json({ success: false, message: "Appointment not found." });
});


app.get('/api/ai/report', (req, res) => {
    const reports = [
        "Based on deep longitudinal analysis, patient show 84% cardiovascular efficiency recovery. Recommended: Reduce sodium intake by 15%, resume low-impact aerobic exercise.",
        "Neurological recovery metrics look highly favorable. Cognitive stress parameters decreased by 22%. Recommended structural sleep pattern adjustment (7.5 hours/day)."
    ];
    const randomReport = reports[Math.floor(Math.random() * reports.length)];
    res.json({ report: randomReport });
});


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Smart Health Manager operating securely on port ${PORT}`));
