const API_BASE_URL = 'https://your-render-backend-url.onrender.com';

let currentUser = null;
let chartInstance = null;

function navigateTo(viewId) {
    const views = ['view-login', 'view-patient', 'view-doctor', 'view-administrator'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const targetEl = document.getElementById(viewId);
    if (targetEl) targetEl.classList.remove('hidden');

    if (viewId === 'view-patient' || viewId === 'view-doctor') {
        loadAppointments();
    } else if (viewId === 'view-administrator') {
        loadAdminData();
    }
}

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = document.getElementById('loginRole').value;
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.user;
            const userInfo = document.getElementById('userInfo');
            userInfo.classList.remove('hidden');
            userInfo.classList.add('flex');
            document.getElementById('displayUser').innerText = `${currentUser.name} (${currentUser.role})`;

            if (currentUser.role === 'patient') {
                document.getElementById('patName').innerText = currentUser.name;
                document.getElementById('patId').innerText = currentUser.medicalId || 'PH-84920';
            }

            navigateTo(`view-${currentUser.role}`);
        } else {
            alert(data.message || 'Authentication failed');
        }
    } catch (err) {
        console.error("Authentication Error:", err);
        alert('Failed to connect to the backend server. Verify API_BASE_URL and CORS settings.');
    }
});

async function loadAppointments() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/appointments`);
        const appointments = await res.json();

        if (currentUser && currentUser.role === 'patient') {
            const list = document.getElementById('patientBookingStatusList');
            const myBookings = appointments.filter(a => a.patientName === currentUser.name || a.patientName === "Alex Mercer");

            list.innerHTML = myBookings.map(app => `
                <div class="p-3 bg-slate-50 rounded border flex justify-between items-center">
                    <div>
                        <span class="font-bold text-slate-700">${app.doctorSpecialization}</span>
                        <span class="text-xs block text-slate-400">Date: ${app.date}</span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${app.status}</span>
                </div>
            `).join('');
        } else if (currentUser && currentUser.role === 'doctor') {
            const tbody = document.getElementById('doctorBookingTable');
            tbody.innerHTML = appointments.map(app => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="p-3 font-medium">${app.patientName}</td>
                    <td class="p-3 text-slate-500">${app.doctorSpecialization}</td>
                    <td class="p-3">${app.date}</td>
                    <td class="p-3"><span class="px-2 py-0.5 rounded text-xs ${app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${app.status}</span></td>
                    <td class="p-3">
                        ${app.status === 'Pending' ? 
                            `<button onclick="approveAppointment('${app.id}')" class="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 text-xs rounded font-bold">Approve</button>` : 
                            `<span class="text-xs text-slate-400 italic">Approved</span>`}
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error("Error loading appointments:", err);
    }
}

document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const doctorSpecialization = document.getElementById('bookSpec').value;
    const date = document.getElementById('bookDate').value;

    try {
        const res = await fetch(`${API_BASE_URL}/api/appointments/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patientName: currentUser ? currentUser.name : 'Patient',
                doctorSpecialization,
                date
            })
        });

        const data = await res.json();
        if (data.success) {
            alert('Booking request submitted!');
            document.getElementById('bookingForm').reset();
            loadAppointments();
        }
    } catch (err) {
        console.error("Booking Error:", err);
    }
});

async function approveAppointment(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/appointments/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'Approved' })
        });

        const data = await res.json();
        if (data.success) {
            loadAppointments();
        }
    } catch (err) {
        console.error("Approve Appointment Error:", err);
    }
}

async function triggerAIReport() {
    const box = document.getElementById('aiOutputBox');
    if (box) box.innerText = "Analyzing health data with AI diagnostics engine...";
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/ai/recovery-report`);
        const data = await res.json();
        
        setTimeout(() => {
            if (box) box.innerText = `"${data.report}"`;
        }, 500);
    } catch (err) {
        console.error("AI Report Error:", err);
        if (box) box.innerText = "Error generating AI report.";
    }
}

async function loadAdminData() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/metrics`);
        const data = await res.json();

        document.getElementById('statDoctors').innerText = data.stats.doctorsCount;
        document.getElementById('statPatients').innerText = data.stats.patientsCount;
        document.getElementById('statCases').innerText = data.stats.solvedCases;

        const registry = document.getElementById('adminGlobalRegistry');
        registry.innerHTML = data.appointments.map(app => `
            <div class="p-3 bg-slate-50 border rounded-lg text-xs flex justify-between">
                <div><strong>Patient:</strong> ${app.patientName} (${app.doctorSpecialization})</div>
                <div class="text-slate-500">Date: ${app.date} | Status: <strong>${app.status}</strong></div>
            </div>
        `).join('');

        renderChart(data.stats.doctorsCount, data.stats.patientsCount, data.stats.solvedCases);
    } catch (err) {
        console.error("Error loading admin metrics:", err);
    }
}

function renderChart(docs, pats, cases) {
    const canvas = document.getElementById('adminChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Doctors', 'Patients', 'Solved Cases'],
            datasets: [{
                data: [docs, pats, cases],
                backgroundColor: ['#0d9488', '#f59e0b', '#10b981']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function logout() {
    currentUser = null;
    document.getElementById('userInfo').classList.add('hidden');
    document.getElementById('loginForm').reset();
    navigateTo('view-login');
}
