let currentUser = null;
let currentRole = null;
let cachedAppointments = [];
let chartInstance = null;


function navigateTo(viewId) {
    const views = ['view-login', 'view-patient', 'view-doctor', 'view-administrator'];
    
    // Hide all view screens completely
    views.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });

   
    document.getElementById(viewId).classList.remove('hidden');

    // Trigger stateful pipeline updates dependent on view targeted
    if (viewId === 'view-patient' || viewId === 'view-doctor') {
        fetchAppointmentsData();
    } else if (viewId === 'view-administrator') {
        loadAdminDashboardMetrics();
    }
}


document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = document.getElementById('loginRole').value;
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        const data = await response.json();

        if (data.success) {
            currentUser = data.username;
            currentRole = data.role;

            // Show UI elements
            document.getElementById('userInfo').classList.remove('hidden');
            document.getElementById('userInfo').classList.add('flex');
            document.getElementById('displayUser').innerText = `${currentUser} (${currentRole.toUpperCase()})`;

        
            navigateTo(`view-${currentRole}`);
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error("Auth security exception validation error:", err);
    }
});


async function fetchAppointmentsData() {
    try {
        const res = await fetch('/api/appointments');
        cachedAppointments = await res.json();
        
        if (currentRole === 'patient') {
            renderPatientAppointments();
        } else if (currentRole === 'doctor') {
            renderDoctorAppointments();
        }
    } catch (err) {
        console.error("Could not fetch appointments registry stream:", err);
    }
}

 
function renderPatientAppointments() {
    const container = document.getElementById('patientBookingStatusList');
    document.querySelectorAll('.pat-name').forEach(el => el.innerText = currentUser);
    
    container.innerHTML = cachedAppointments.map(app => {
        let statusColor = app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
        return `
            <div class="p-3 bg-slate-50 rounded border flex justify-between items-center">
                <div>
                    <span class="font-bold text-slate-700">${app.doctorSpecialization} Unit</span>
                    <span class="text-xs block text-slate-400">Scheduled Date: ${app.date}</span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}">${app.status}</span>
            </div>
        `;
    }).join('');
}

document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const spec = document.getElementById('bookSpec').value;
    const date = document.getElementById('bookDate').value;

    // Simulate pushing onto local cache stack object structure instantly
    cachedAppointments.push({
        id: Date.now(),
        patientName: currentUser,
        doctorSpecialization: spec,
        date: date,
        status: "Pending"
    });
    
    renderPatientAppointments();
    alert("Appointment safely submitted! Your Doctor will examine the request shortly.");
    document.getElementById('bookingForm').reset();
});


function renderDoctorAppointments() {
    const tbody = document.getElementById('doctorBookingTable');
    tbody.innerHTML = cachedAppointments.map(app => {
        return `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-3 font-medium">${app.patientName}</td>
                <td class="p-3 text-slate-500">${app.doctorSpecialization}</td>
                <td class="p-3">${app.date}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded text-xs ${app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-800'}">${app.status}</span></td>
                <td class="p-3">
                    ${app.status === 'Pending' ? 
                        `<button onclick="updateStatus('${app.id}', 'Approved')" class="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 text-xs rounded transition font-bold">Approve Link</button>` 
                        : `<span class="text-xs text-slate-400 italic">No Actions Pending</span>`
                    }
                </td>
            </tr>
        `;
    }).join('');
}

async function updateStatus(id, newStatus) {
    try {
        const response = await fetch('/api/appointments/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus })
        });
        const data = await response.json();
        if (data.success) {
            fetchAppointmentsData();
        }
    } catch (err) {
        console.error("Action error processing update tracking payload:", err);
    }
}

 
async function triggerAIReport() {
    const outputBox = document.getElementById('aiOutputBox');
    outputBox.innerText = "Synthesizing clinical trends via AI core algorithms...";
    try {
        const res = await fetch('/api/ai/report');
        const data = await res.json();
        setTimeout(() => {
            outputBox.innerText = `"${data.report}"`;
        }, 600);
    } catch (err) {
        outputBox.innerText = "Error syncing with remote inference report pipelines.";
    }
}

 
async function loadAdminDashboardMetrics() {
    try {
        const statsRes = await fetch('/api/admin/stats');
        const stats = await statsRes.json();
        
        const appointmentsRes = await fetch('/api/appointments');
        const appointmentsList = await appointmentsRes.json();

        // Update Text Metrics
        document.getElementById('statDoctors').innerText = stats.doctorsCount;
        document.getElementById('statPatients').innerText = stats.patientsCount;
        document.getElementById('statCases').innerText = stats.solvedCases;

        // Render Combined Global Master Logs 
        const logsContainer = document.getElementById('adminGlobalRegistry');
        let combinedLogsHTML = appointmentsList.map(app => `
            <div class="p-3 bg-slate-50 border rounded-lg text-xs flex justify-between">
                <div> <strong>Patient Record:</strong> ${app.patientName} &rarr; Requested Spec: ${app.doctorSpecialization}</div>
                <div class="text-slate-400">Date: ${app.date} | Status: <span class="font-bold text-slate-600">${app.status}</span></div>
            </div>
        `).join('');
        
        logsContainer.innerHTML = combinedLogsHTML || `<p class="text-slate-400 text-sm">No recorded registry profiles current.</p>`;


        renderChartVisuals(stats.doctorsCount, stats.patientsCount, stats.solvedCases);

    } catch (err) {
        console.error("Critical Admin Core sync dashboard state failure:", err);
    }
}


function renderChartVisuals(docs, pats, cases) {
    const ctx = document.getElementById('adminChart').getContext('2d');
    if (chartInstance) {
        chartInstance.destroy();
    }
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Doctors', 'Patients', 'Solved Cases'],
            datasets: [{
                data: [docs, pats, cases],
                backgroundColor: ['#0d9488', '#f59e0b', '#10b981'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
        }
    });
}


function logout() {
    currentUser = null;
    currentRole = null;
    document.getElementById('userInfo').classList.remove('flex');
    document.getElementById('userInfo').classList.add('hidden');
    document.getElementById('loginForm').reset();
    navigateTo('view-login');
}
