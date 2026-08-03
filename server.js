const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, 'public')));


const db = {
  users: [
    { id: 1, name: "Admin System", email: "admin@hospital.com", password: "123", role: "admin" },
    { id: 2, name: "Dr. Sarah Jenkins", email: "sarah@hospital.com", password: "123", role: "doctor", specialization: "Cardiology" },
    { id: 3, name: "John Doe", email: "john@gmail.com", password: "123", role: "patient" }
  ],
  appointments: [
    { 
      id: 101, 
      patientId: 3, 
      patientName: "John Doe", 
      doctorId: 2, 
      doctorName: "Dr. Sarah Jenkins", 
      date: "2026-08-10", 
      time: "10:00", 
      reason: "Annual Heart Checkup", 
      status: "Solved", 
      diagnosis: "Normal Sinus Rhythm. Blood pressure 120/80.", 
      prescriptions: "Multivitamins once daily." 
    }
  ],
  stats: {
    solvedCases: 42
  }
};




app.post('/api/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = db.users.find(u => u.email === email && u.password === password && u.role === role);
  
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials or role selection." });
  }
});


app.post('/api/register', (req, res) => {
  const { name, email, password, role, specialization } = req.body;
  
  const existing = db.users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ success: false, message: "Email is already registered." });
  }

  const newUser = {
    id: db.users.length + 1,
    name,
    email,
    password,
    role,
    specialization: role === 'doctor' ? (specialization || 'General Physician') : undefined
  };

  db.users.push(newUser);
  res.json({ success: true, user: newUser });
});


app.get('/api/doctors', (req, res) => {
  const doctors = db.users.filter(u => u.role === 'doctor');
  res.json(doctors);
});


app.get('/api/admin/dashboard', (req, res) => {
  const doctors = db.users.filter(u => u.role === 'doctor');
  const patients = db.users.filter(u => u.role === 'patient');
  
  res.json({
    totalDoctors: doctors.length,
    totalPatients: patients.length,
    solvedCases: db.stats.solvedCases,
    doctorsList: doctors.map(d => ({ id: d.id, name: d.name, email: d.email, specialization: d.specialization })),
    patientsList: patients.map(p => ({ id: p.id, name: p.name, email: p.email }))
  });
});


app.post('/api/appointments/book', (req, res) => {
  const { patientId, patientName, doctorId, date, time, reason } = req.body;
  const doctor = db.users.find(u => u.id === parseInt(doctorId));

  const newAppointment = {
    id: db.appointments.length + 101,
    patientId,
    patientName,
    doctorId: parseInt(doctorId),
    doctorName: doctor ? doctor.name : 'Unassigned',
    date,
    time,
    reason,
    status: 'Pending',
    diagnosis: '',
    prescriptions: ''
  };

  db.appointments.push(newAppointment);
  res.json({ success: true, appointment: newAppointment });
});


app.get('/api/appointments', (req, res) => {
  const { role, userId } = req.query;
  const id = parseInt(userId);

  let filtered = [];
  if (role === 'patient') {
    filtered = db.appointments.filter(a => a.patientId === id);
  } else if (role === 'doctor') {
    filtered = db.appointments.filter(a => a.doctorId === id);
  } else if (role === 'admin') {
    filtered = db.appointments;
  }

  res.json(filtered);
});


app.post('/api/appointments/solve', (req, res) => {
  const { appointmentId, diagnosis, prescriptions } = req.body;
  const appt = db.appointments.find(a => a.id === parseInt(appointmentId));

  if (appt) {
    appt.status = 'Solved';
    appt.diagnosis = diagnosis;
    appt.prescriptions = prescriptions;
    db.stats.solvedCases += 1;
    res.json({ success: true, appointment: appt });
  } else {
    res.status(404).json({ success: false, message: 'Appointment record not found.' });
  }
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server executing at http://localhost:${PORT}`);
});
