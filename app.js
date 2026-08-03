
const BASE_URL = 'https://smart-health-manager-19.onrender.com';

let currentUser = null;


document.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    navigateToDashboard();
  } else {
    showView('auth-section');
  }
});


function showView(viewId) {
  document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
  document.getElementById(viewId).classList.remove('hidden');

  const header = document.getElementById('main-header');
  if (viewId === 'auth-section') {
    header.classList.add('hidden');
  } else {
    header.classList.remove('hidden');
    document.getElementById('user-display').innerText = `${currentUser.name} (${currentUser.role.toUpperCase()})`;
  }
}


function navigateToDashboard() {
  if (!currentUser) return showView('auth-section');

  if (currentUser.role === 'patient') {
    showView('patient-view');
    loadPatientData();
  } else if (currentUser.role === 'doctor') {
    showView('doctor-view');
    loadDoctorData();
  } else if (currentUser.role === 'admin') {
    showView('admin-view');
    loadAdminData();
  }
}



function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}

function toggleSpecialization() {
  const role = document.getElementById('reg-role').value;
  document.getElementById('spec-group').classList.toggle('hidden', role !== 'doctor');
}


async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const role = document.getElementById('login-role').value;

  try {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      navigateToDashboard();
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error('Login Connection Error:', err);
    alert('Server connection error.');
  }
}


async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  const specialization = document.getElementById('reg-spec').value;

  try {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, specialization })
    });

    const data = await res.json();

    if (data.success) {
      alert('Registration successful! Redirecting to dashboard...');
      currentUser = data.user;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      navigateToDashboard();
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error('Registration Connection Error:', err);
    alert('Server connection error.');
  }
}

function logout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  showView('auth-section');
}


async function loadPatientData() {
  try {
   
    const docRes = await fetch(`${BASE_URL}/api/doctors`);
    const doctors = await docRes.json();
    const select = document.getElementById('book-doctor');
    select.innerHTML = doctors.map(d => `<option value="${d.id}">${d.name} (${d.specialization})</option>`).join('');

  
    const apptRes = await fetch(`${BASE_URL}/api/appointments?role=patient&userId=${currentUser.id}`);
    const appointments = await apptRes.json();

    const container = document.getElementById('patient-appointments-list');
    if (appointments.length === 0) {
      container.innerHTML = '<p>No appointments booked yet.</p>';
      return;
    }

    container.innerHTML = appointments.map(a => `
      <div class="appt-item">
        <div style="display:flex; justify-content:space-between;">
          <strong>${a.doctorName}</strong>
          <span class="badge ${a.status === 'Solved' ? 'badge-solved' : 'badge-pending'}">${a.status}</span>
        </div>
        <p><small>📅 ${a.date} at ${a.time}</small></p>
        <p><strong>Reason:</strong> ${a.reason}</p>
        ${a.status === 'Solved' ? `
          <button onclick="generateHealthReport(${JSON.stringify(a).replace(/"/g, '&quot;')})" class="btn btn-success btn-block mt-20">📄 View Health Report</button>
        ` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error('Patient Load Error:', err);
  }
}


async function handleBookAppointment(e) {
  e.preventDefault();
  const doctorId = document.getElementById('book-doctor').value;
  const date = document.getElementById('book-date').value;
  const time = document.getElementById('book-time').value;
  const reason = document.getElementById('book-reason').value;

  try {
    const res = await fetch(`${BASE_URL}/api/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.id,
        patientName: currentUser.name,
        doctorId,
        date,
        time,
        reason
      })
    });

    const data = await res.json();
    if (data.success) {
      alert('Appointment booked successfully!');
      document.getElementById('book-reason').value = '';
      loadPatientData();
    }
  } catch (err) {
    console.error('Booking Error:', err);
  }
}


async function loadDoctorData() {
  try {
    const res = await fetch(`${BASE_URL}/api/appointments?role=doctor&userId=${currentUser.id}`);
    const appointments = await res.json();

    const container = document.getElementById('doctor-appointments-list');
    if (appointments.length === 0) {
      container.innerHTML = '<p>No appointments currently booked.</p>';
      return;
    }

    container.innerHTML = appointments.map(a => `
      <div class="appt-item">
        <div style="display:flex; justify-content:space-between;">
          <strong>Patient: ${a.patientName}</strong>
          <span class="badge ${a.status === 'Solved' ? 'badge-solved' : 'badge-pending'}">${a.status}</span>
        </div>
        <p><small>📅 ${a.date} at ${a.time}</small></p>
        <p><strong>Reason:</strong> ${a.reason}</p>
        
        ${a.status === 'Pending' ? `
          <div class="mt-20">
            <textarea id="diag-${a.id}" placeholder="Enter Diagnosis..." rows="2" style="width:100%; margin-bottom:5px;"></textarea>
            <textarea id="presc-${a.id}" placeholder="Enter Prescriptions..." rows="2" style="width:100%; margin-bottom:5px;"></textarea>
            <button onclick="markAsSolved(${a.id})" class="btn btn-primary">Mark as Solved</button>
          </div>
        ` : `
          <div style="margin-top:10px; background:#e8f8f5; padding:8px; border-radius:4px;">
            <p><strong>Diagnosis:</strong> ${a.diagnosis}</p>
            <p><strong>Prescription:</strong> ${a.prescriptions}</p>
          </div>
        `}
      </div>
    `).join('');
  } catch (err) {
    console.error('Doctor Load Error:', err);
  }
}


async function markAsSolved(appointmentId) {
  const diagnosis = document.getElementById(`diag-${appointmentId}`).value;
  const prescriptions = document.getElementById(`presc-${appointmentId}`).value;

  if (!diagnosis || !prescriptions) {
    return alert('Please enter both diagnosis and prescriptions.');
  }

  try {
    const res = await fetch(`${BASE_URL}/api/appointments/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, diagnosis, prescriptions })
    });

    const data = await res.json();
    if (data.success) {
      loadDoctorData();
    }
  } catch (err) {
    console.error('Solve Error:', err);
  }
}


async function loadAdminData() {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`);
    const data = await res.json();

    document.getElementById('admin-doc-count').innerText = data.totalDoctors;
    document.getElementById('admin-pat-count').innerText = data.totalPatients;
    document.getElementById('admin-solved-count').innerText = data.solvedCases;

 
    document.getElementById('admin-doctors-table').innerHTML = data.doctorsList.map(d => `
      <tr><td>${d.id}</td><td>${d.name}</td><td>${d.email}</td><td>${d.specialization}</td></tr>
    `).join('');

   
    document.getElementById('admin-patients-table').innerHTML = data.patientsList.map(p => `
      <tr><td>${p.id}</td><td>${p.name}</td><td>${p.email}</td></tr>
    `).join('');
  } catch (err) {
    console.error('Admin Load Error:', err);
  }
}



function generateHealthReport(appt) {
  document.getElementById('rep-date').innerText = new Date().toLocaleDateString();
  document.getElementById('rep-patient').innerText = appt.patientName;
  document.getElementById('rep-doctor').innerText = appt.doctorName;
  document.getElementById('rep-appt-date').innerText = `${appt.date} (${appt.time})`;
  document.getElementById('rep-reason').innerText = appt.reason;
  document.getElementById('rep-diagnosis').innerText = appt.diagnosis;
  document.getElementById('rep-prescriptions').innerText = appt.prescriptions;

  document.getElementById('report-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('report-modal').classList.add('hidden');
}
