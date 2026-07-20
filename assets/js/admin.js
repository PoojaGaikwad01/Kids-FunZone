// Admin Panel Javascript File for Kids FunZone

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Collapse/Expand Toggle
    const sidebar = document.getElementById('adminSidebar');
    const mainContent = document.getElementById('adminMain');
    const toggleBtn = document.getElementById('sidebarToggle');

    if (toggleBtn && sidebar && mainContent) {
        // Load initial state
        const isCollapsed = localStorage.getItem('adminSidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }

        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            localStorage.setItem('adminSidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }

    // 2. LocalStorage Data Seeding for Kids FunZone State Management
    seedMockData();

    // 3. Search and Filter Table logic
    setupTableSearch();

    // 4. Live Play Zone Check-In & Check-Out Interactions
    setupCheckInSystem();

    // 5. Wallet Recharge & Adjustments
    setupWalletSystem();

    // 6. Birthday Party Admin Booking Handler
    setupAdminPartyBooking();

    // 7. Password Visibility Eye Toggle Handler
    setupPasswordToggle();

    // 8. Customer Registration Handler
    setupCustomerRegistration();
    setupReturningCustomerCheckIn();

    // 9. Footer Management (Settings > Footer Management tab)
    setupFooterManagement();

    // 10. Back to Top Button
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.classList.toggle('visible', window.scrollY > 300);
        });
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Master UI Data & Card Summary Refresh
    refreshAdminDataUI();
});

function setupCustomerRegistration() {
    const form = document.getElementById('addCustomerForm');
    if (!form) return;

    if (form.dataset.initialized === 'true') return;
    form.dataset.initialized = 'true';

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const pId = Date.now();
        const firstName = document.getElementById('custFirstName').value;
        const lastName = document.getElementById('custLastName').value;
        const phone = document.getElementById('custPhone').value;
        const walletBal = parseFloat(document.getElementById('custWallet').value) || 0;
        const childFirst = document.getElementById('childFirstName').value;
        const childLast = document.getElementById('childLastName').value;
        const childDob = document.getElementById('childDob').value;
        const playDuration = parseInt(document.getElementById('childPlayDuration').value) || 0;

        const custs = JSON.parse(localStorage.getItem('kfz_customers') || '[]');
        custs.push({
            id: pId,
            firstName,
            lastName,
            phone,
            walletBalance: 0,
            loyaltyPoints: 0,
            created: new Date().toISOString().split('T')[0]
        });
        localStorage.setItem('kfz_customers', JSON.stringify(custs));

        const children = JSON.parse(localStorage.getItem('kfz_children') || '[]');
        const newChildId = Date.now() + 1;
        children.push({
            id: newChildId,
            parentId: pId,
            firstName: childFirst,
            lastName: childLast,
            dob: childDob
        });
        localStorage.setItem('kfz_children', JSON.stringify(children));

        if (playDuration > 0) {
            const checkins = JSON.parse(localStorage.getItem('kfz_checkins') || '[]');
            const rateMap = { 60: 250, 90: 350, 120: 450, 180: 600 };
            const baseAmount = rateMap[playDuration] || 250;
            checkins.unshift({
                id: Date.now() + 2,
                childName: `${childFirst} ${childLast}`,
                parentName: `${firstName} ${lastName}`,
                checkInTime: new Date().toISOString(),
                plannedDuration: playDuration,
                baseAmount: baseAmount,
                status: 'checked_in'
            });
            localStorage.setItem('kfz_checkins', JSON.stringify(checkins));
        }

        const modalEl = document.getElementById('addCustomerModal');
        if (modalEl && window.bootstrap) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
        form.reset();

        refreshAdminDataUI();

        if (typeof renderCustomersList === 'function') {
            renderCustomersList();
        }

        if (typeof openChildProfile === 'function') {
            openChildProfile(newChildId);
        } else {
            window.location.href = 'customers.html';
        }
    });
}

// ── Returning Customer Search & Check-In Module ──────────────────────────
function setupReturningCustomerCheckIn() {
    const searchInput = document.getElementById('checkinSearchInput');
    const searchResults = document.getElementById('checkinSearchResults');
    const modalEl = document.getElementById('addCustomerModal');

    if (modalEl) {
        modalEl.addEventListener('show.bs.modal', () => {
            resetCheckInModalView();
        });
    }

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 2) {
            if (searchResults) searchResults.style.display = 'none';
            return;
        }

        const children = JSON.parse(localStorage.getItem('kfz_children') || '[]');
        const customers = JSON.parse(localStorage.getItem('kfz_customers') || '[]');
        const matches = [];

        children.forEach(c => {
            const p = customers.find(cust => cust.id === c.parentId) || { firstName: 'Parent', lastName: c.lastName, phone: '' };
            const childName = `${c.firstName} ${c.lastName}`.toLowerCase();
            const parentName = `${p.firstName} ${p.lastName}`.toLowerCase();
            const phone = (p.phone || '').toLowerCase();

            if (childName.includes(query) || parentName.includes(query) || phone.includes(query)) {
                matches.push({ child: c, parent: p });
            }
        });

        if (matches.length > 0 && searchResults) {
            searchResults.innerHTML = matches.map(m => `
                <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2" onclick="selectReturningCustomer(${m.child.id})">
                    <div>
                        <strong class="text-dark">${m.child.firstName} ${m.child.lastName}</strong>
                        <small class="text-muted d-block">Parent: ${m.parent.firstName} ${m.parent.lastName} (${m.parent.phone})</small>
                    </div>
                    <span class="badge bg-primary rounded-pill">Select</span>
                </button>
            `).join('');
            searchResults.style.display = 'block';
        } else if (searchResults) {
            searchResults.innerHTML = `<div class="list-group-item text-muted py-2 small">No matching customer found. Fill form below to register new family.</div>`;
            searchResults.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (searchResults && searchInput && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

function selectReturningCustomer(childId) {
    const searchResults = document.getElementById('checkinSearchResults');
    if (searchResults) searchResults.style.display = 'none';

    const children = JSON.parse(localStorage.getItem('kfz_children') || '[]');
    const customers = JSON.parse(localStorage.getItem('kfz_customers') || '[]');
    const checkins = JSON.parse(localStorage.getItem('kfz_checkins') || '[]');
    const memberships = JSON.parse(localStorage.getItem('kfz_memberships') || '[]');

    const child = children.find(c => c.id === childId);
    if (!child) return;

    const parent = customers.find(p => p.id === child.parentId) || { firstName: 'Parent', lastName: child.lastName, phone: '—' };
    const childFullName = `${child.firstName} ${child.lastName}`;
    const parentFullName = `${parent.firstName} ${parent.lastName}`;

    const childCheckins = checkins.filter(c => c.childName.trim().toLowerCase() === childFullName.trim().toLowerCase());
    const totalVisits = childCheckins.length;
    const lastVisit = childCheckins.length > 0
        ? new Date(childCheckins[0].checkInTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'First Visit';

    const activeMem = memberships.find(m => (m.childName === childFullName || m.phone === parent.phone) && m.status === 'Active');
    const memStatus = activeMem ? `${activeMem.type} (Active)` : 'Standard Guest';

    const isCurrentlyInside = checkins.some(c => c.childName.trim().toLowerCase() === childFullName.trim().toLowerCase() && c.status === 'checked_in');

    const foundContainer = document.getElementById('foundCustomerCardContainer');
    const formContainer = document.getElementById('newCustomerFormContainer');

    if (foundContainer) {
        if (isCurrentlyInside) {
            foundContainer.innerHTML = `
                <div class="adm-card p-3 mb-3 border-warning" style="background:#fffbeb; border:1px solid #fef3c7; border-radius:12px;">
                    <div class="d-flex align-items-center gap-2 text-warning-emphasis mb-2">
                        <i class="bi bi-exclamation-triangle-fill fs-4"></i>
                        <div>
                            <h6 class="mb-0 fw-bold">This customer is already inside the play zone.</h6>
                            <small class="text-muted">${childFullName} is currently playing in active session.</small>
                        </div>
                    </div>
                    <div class="row g-2 small text-secondary mb-3">
                        <div class="col-6"><strong>Parent:</strong> ${parentFullName}</div>
                        <div class="col-6"><strong>Phone:</strong> ${parent.phone}</div>
                    </div>
                    <button type="button" class="adm-btn adm-btn-secondary w-100 mb-2" onclick="openChildProfile(${child.id})">
                        <i class="bi bi-eye"></i> View Current Session & Profile
                    </button>
                    <button type="button" class="btn btn-link btn-sm w-100 text-muted" onclick="resetCheckInModalView()">
                        ← Back to Search / New Customer
                    </button>
                </div>
            `;
        } else {
            foundContainer.innerHTML = `
                <div class="adm-card p-3 mb-3" style="background:#f0f9ff; border:1.5px solid #bae6fd; border-radius:12px;">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h5 class="fw-bold text-dark mb-0">${childFullName}</h5>
                            <span class="adm-text-secondary small">Parent: <strong>${parentFullName}</strong> (${parent.phone})</span>
                        </div>
                        <span class="badge bg-success">${memStatus}</span>
                    </div>
                    <div class="row g-2 small text-dark mb-3" style="background:#ffffff; padding:12px; border-radius:8px; border:1px solid #e0f2fe;">
                        <div class="col-md-6"><strong>Date of Birth:</strong> ${child.dob || 'Not specified'} (${calcAge(child.dob)} yrs)</div>
                        <div class="col-md-6"><strong>Total Previous Visits:</strong> ${totalVisits} visits</div>
                        <div class="col-md-12"><strong>Last Visit Date:</strong> ${lastVisit}</div>
                    </div>
                    <div class="mb-3">
                        <label class="adm-form-label small fw-semibold">Select Play Session Duration</label>
                        <select class="adm-form-select" id="returningDurationSelect">
                            <option value="60">1 Hour — ₹250</option>
                            <option value="90">1.5 Hours — ₹350</option>
                            <option value="120">2 Hours — ₹450</option>
                            <option value="180">3 Hours — ₹600</option>
                        </select>
                    </div>
                    <button type="button" class="adm-btn adm-btn-primary w-100 py-2 fs-6" style="justify-content:center;" onclick="confirmReturningCustomerCheckIn(${child.id})">
                        <i class="bi bi-check-circle-fill me-1"></i> ✅ Check In
                    </button>
                    <button type="button" class="btn btn-link btn-sm w-100 mt-2 text-muted" onclick="resetCheckInModalView()">
                        ← Search Different Customer / Register New
                    </button>
                </div>
            `;
        }
        foundContainer.style.display = 'block';
        if (formContainer) formContainer.style.display = 'none';
    }
}

function confirmReturningCustomerCheckIn(childId) {
    const children = JSON.parse(localStorage.getItem('kfz_children') || '[]');
    const customers = JSON.parse(localStorage.getItem('kfz_customers') || '[]');
    const checkins = JSON.parse(localStorage.getItem('kfz_checkins') || '[]');

    const child = children.find(c => c.id === childId);
    if (!child) return;

    const parent = customers.find(p => p.id === child.parentId) || { id: child.parentId, firstName: 'Parent', lastName: child.lastName, phone: '—' };
    const childFullName = `${child.firstName} ${child.lastName}`;
    const parentFullName = `${parent.firstName} ${parent.lastName}`;

    const durationSelect = document.getElementById('returningDurationSelect');
    const duration = parseInt(durationSelect ? durationSelect.value : 60);

    const priceMap = { 60: 250, 90: 350, 120: 450, 180: 600 };
    const price = priceMap[duration] || 250;
    const billNo = 'BILL-' + Math.floor(100000 + Math.random() * 900000);

    const newCheckin = {
        id: Date.now(),
        customerId: parent.id,
        childId: child.id,
        childName: childFullName,
        parentName: parentFullName,
        phone: parent.phone,
        checkInTime: new Date().toISOString(),
        plannedDuration: duration,
        baseAmount: price,
        billNumber: billNo,
        status: 'checked_in'
    };

    checkins.unshift(newCheckin);
    localStorage.setItem('kfz_checkins', JSON.stringify(checkins));

    const visits = JSON.parse(localStorage.getItem('kfz_visits') || '[]');
    visits.unshift({
        visitId: newCheckin.id,
        customerId: parent.id,
        childId: child.id,
        childName: childFullName,
        parentName: parentFullName,
        phone: parent.phone,
        visitDate: new Date().toISOString().split('T')[0],
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sessionDuration: duration,
        billNumber: billNo,
        amountPaid: price,
        status: 'checked_in'
    });
    localStorage.setItem('kfz_visits', JSON.stringify(visits));

    const modalEl = document.getElementById('addCustomerModal');
    if (modalEl && window.bootstrap) {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
    }

    if (typeof refreshAdminDataUI === 'function') refreshAdminDataUI();
    if (typeof renderCustomersList === 'function') renderCustomersList();

    alert(`✅ Check-in successful for ${childFullName}!\nBill Number: ${billNo}\nAmount: ₹${price}\nStatus: Currently Playing`);
}

function resetCheckInModalView() {
    const foundContainer = document.getElementById('foundCustomerCardContainer');
    const formContainer = document.getElementById('newCustomerFormContainer');
    const searchInput = document.getElementById('checkinSearchInput');
    const searchResults = document.getElementById('checkinSearchResults');

    if (foundContainer) foundContainer.style.display = 'none';
    if (formContainer) formContainer.style.display = 'block';
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.style.display = 'none';
}

// Birthday bookings & memberships live in MySQL now (via the Flask API), not localStorage.
async function fetchBirthdaysFromApi() {
    try {
        const res = await fetch('/api/birthdays', { credentials: 'same-origin' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        return [];
    }
}

async function fetchMembershipsFromApi() {
    try {
        const res = await fetch('/api/memberships', { credentials: 'same-origin' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        return [];
    }
}

async function refreshAdminDataUI() {
    const [birthdays, memberships] = await Promise.all([
        fetchBirthdaysFromApi(),
        fetchMembershipsFromApi()
    ]);
    updateSummaryStats(birthdays, memberships);
    renderCheckinsTable();
    renderCheckoutsTable();
    renderTodayCheckinsTable();
    renderPartyBookingsTable(birthdays);
    renderUpcomingBirthdays(birthdays);
}

function setupPasswordToggle() {
    document.querySelectorAll('.toggle-password-btn, #togglePasswordBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.position-relative');
            const input = wrapper ? wrapper.querySelector('input') : document.getElementById('loginPassword');
            const icon = btn.querySelector('i');
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'bi bi-eye-slash-fill';
                } else {
                    input.type = 'password';
                    icon.className = 'bi bi-eye-fill';
                }
            }
        });
    });
}

// Footer Management: edit the public site's footer content (Settings > Footer Management)
const DEFAULT_FOOTER_SETTINGS = {
    tagline: "Chhatrapati Sambhajinagar's leading active soft play zone and café, engineering happy memories for families with supreme safety regulations.",
    facebook: '#',
    instagram: '#',
    youtube: '#',
    address: 'Motiwala Nagar, Seven Hills, Chhatrapati Sambhajinagar',
    phone: '+91 98230 12345',
    email: 'fun@kidsfunzone.in'
};

function getFooterSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('kfz_footer_settings'));
        return saved ? { ...DEFAULT_FOOTER_SETTINGS, ...saved } : { ...DEFAULT_FOOTER_SETTINGS };
    } catch (e) {
        return { ...DEFAULT_FOOTER_SETTINGS };
    }
}

function setupFooterManagement() {
    const form = document.getElementById('footerSettingsForm');
    if (!form) return;

    const fields = {
        tagline: document.getElementById('footerTaglineInput'),
        facebook: document.getElementById('footerFacebookInput'),
        instagram: document.getElementById('footerInstagramInput'),
        youtube: document.getElementById('footerYoutubeInput'),
        address: document.getElementById('footerAddressInput'),
        phone: document.getElementById('footerPhoneInput'),
        email: document.getElementById('footerEmailInput')
    };

    function populateForm(settings) {
        Object.keys(fields).forEach(key => {
            if (fields[key]) fields[key].value = settings[key] || '';
        });
    }

    populateForm(getFooterSettings());

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const settings = {};
        Object.keys(fields).forEach(key => {
            if (fields[key]) settings[key] = fields[key].value.trim();
        });
        localStorage.setItem('kfz_footer_settings', JSON.stringify(settings));

        if (window.showToast) {
            showToast('Footer Updated', 'Footer content saved and now live on the public website.', 'success');
        } else {
            alert('Footer content saved and now live on the public website.');
        }
    });

    const resetBtn = document.getElementById('footerResetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            localStorage.removeItem('kfz_footer_settings');
            populateForm(DEFAULT_FOOTER_SETTINGS);
            if (window.showToast) {
                showToast('Footer Reset', 'Footer content restored to defaults.', 'primary');
            } else {
                alert('Footer content restored to defaults.');
            }
        });
    }
}

// Seed mock records in LocalStorage if not exists
function seedMockData() {
    // Reset/ensure all admin data starts clean from 0
    if (!localStorage.getItem('kfz_initialized') || localStorage.getItem('kfz_clean_v2') !== 'true') {
        localStorage.setItem('kfz_customers', JSON.stringify([]));
        localStorage.setItem('kfz_children', JSON.stringify([]));
        localStorage.setItem('kfz_checkins', JSON.stringify([]));
        localStorage.setItem('kfz_birthdays', JSON.stringify([]));
        localStorage.setItem('kfz_memberships', JSON.stringify([]));
        localStorage.setItem('kfz_invoices', JSON.stringify([]));
        localStorage.setItem('kfz_initialized', 'true');
        localStorage.setItem('kfz_clean_v2', 'true');
    }
}

// Helper to calculate past ISO strings
function getPastTimeString(minusMinutes) {
    const d = new Date();
    d.setMinutes(d.getMinutes() - minusMinutes);
    return d.toISOString();
}

// 3. Setup Table Search & Filter
function setupTableSearch() {
    const searchInputs = document.querySelectorAll('.table-search-input');
    searchInputs.forEach(input => {
        input.addEventListener('keyup', (e) => {
            const query = e.target.value.toLowerCase();
            const tableId = e.target.getAttribute('data-table-target');
            const table = document.getElementById(tableId);
            if (!table) return;

            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    });
}

// 4. Live Play Zone Check-In & Check-Out Interactions
function setupCheckInSystem() {
    const checkinForm = document.getElementById('adminCheckInForm');

    // Populate Children list in Select Check-In Modal
    const childSelect = document.getElementById('checkinChildSelect');
    if (childSelect) {
        const children = JSON.parse(localStorage.getItem('kfz_children') || '[]');
        childSelect.innerHTML = '<option value="">Select Child...</option>';
        children.forEach(c => {
            childSelect.innerHTML += `<option value="${c.id}">${c.firstName} ${c.lastName}</option>`;
        });
    }

    if (checkinForm) {
        checkinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const childId = parseInt(document.getElementById('checkinChildSelect').value);
            const duration = parseInt(document.getElementById('checkinDurationSelect').value);
            
            if (!childId) return;

            const children = JSON.parse(localStorage.getItem('kfz_children') || '[]');
            const child = children.find(c => c.id === childId);
            if (!child) return;

            const customers = JSON.parse(localStorage.getItem('kfz_customers') || '[]');
            const parent = customers.find(cust => cust.id === child.parentId);
            const parentName = parent ? `${parent.firstName} ${parent.lastName}` : 'Unknown';

            const checkins = JSON.parse(localStorage.getItem('kfz_checkins') || '[]');
            
            // Calculate base amount (e.g. 250 for 60m, 350 for 90m, 450 for 120m)
            let baseAmount = 250;
            if (duration === 90) baseAmount = 350;
            else if (duration === 120) baseAmount = 450;
            else if (duration > 120) baseAmount = 600;

            const newCheckin = {
                id: Date.now(),
                childId: childId,
                childName: `${child.firstName} ${child.lastName}`,
                parentName: parentName,
                checkInTime: new Date().toISOString(),
                plannedDuration: duration,
                status: 'checked_in',
                baseAmount: baseAmount,
                totalAmount: baseAmount
            };

            checkins.push(newCheckin);
            localStorage.setItem('kfz_checkins', JSON.stringify(checkins));
            
            // Close Modal
            const modalEl = document.getElementById('checkinModal');
            if (modalEl && window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }

            checkinForm.reset();
            refreshAdminDataUI();
            
            if (window.showToast) {
                showToast('Checked In', `${newCheckin.childName} has checked in successfully!`, 'success');
            } else {
                alert(`${newCheckin.childName} has checked in successfully!`);
            }
        });
    }
}

function renderCheckinsTable() {
    const checkinsTableBody = document.querySelector('#checkinsTable tbody');
    if (!checkinsTableBody) return;

    const checkins = JSON.parse(localStorage.getItem('kfz_checkins') || '[]');
    checkinsTableBody.innerHTML = '';

    const liveCheckins = checkins.filter(c => c.status === 'checked_in');

    if (liveCheckins.length === 0) {
        checkinsTableBody.innerHTML = '<tr><td colspan="8" class="text-center adm-text-muted py-4">No children currently in the Play Zone.</td></tr>';
        return;
    }

    liveCheckins.forEach((item, idx) => {
        const timeIn = new Date(item.checkInTime);
        const diffMins = Math.floor((new Date() - timeIn) / 60000);
        
        // Progress percentage
        const progress = Math.min(100, Math.floor((diffMins / item.plannedDuration) * 100));
        const progressColor = progress >= 100 ? 'bg-danger' : progress > 80 ? 'bg-warning' : 'bg-primary';

        checkinsTableBody.innerHTML += `
            <tr data-id="${item.id}">
                <td class="adm-fw-600 text-center" style="width: 50px;">${idx + 1}</td>
                <td class="adm-fw-600">${item.childName}</td>
                <td>${item.parentName}</td>
                <td class="adm-text-secondary">${timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td class="adm-text-secondary">${item.plannedDuration} Mins</td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2 small adm-text-secondary">${diffMins}m elapsed</span>
                        <div class="progress flex-grow-1" style="height: 6px; min-width: 80px; background: rgba(255,255,255,0.06);">
                            <div class="progress-bar ${progressColor}" role="progressbar" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </td>
                <td><span class="adm-badge adm-badge-accent">Active</span></td>
                <td>
                    <button class="adm-btn adm-btn-secondary adm-btn-sm btn-checkout" data-id="${item.id}">
                        <i class="bi bi-box-arrow-right"></i> Check Out
                    </button>
                </td>
            </tr>
        `;
    });

    // Attach Checkout Event Handlers
    document.querySelectorAll('#checkinsTable .btn-checkout').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            triggerCheckOut(id);
        });
    });
}

function updateSummaryStats(birthdays, memberships) {
    const checkins = JSON.parse(localStorage.getItem('kfz_checkins') || '[]');
    const liveCount = checkins.filter(c => c.status === 'checked_in').length;
    const checkoutCount = checkins.filter(c => c.status === 'checked_out').length;
    const totalTodayCount = checkins.length;

    const statVisitors = document.getElementById('statVisitors');
    if (statVisitors) statVisitors.innerText = totalTodayCount;

    const statPlaying = document.getElementById('statPlaying');
    if (statPlaying) statPlaying.innerText = liveCount;

    const statCheckouts = document.getElementById('statCheckouts');
    if (statCheckouts) statCheckouts.innerText = checkoutCount;

    const statParties = document.getElementById('statParties');
    if (statParties) {
        statParties.innerText = (birthdays || []).length;
    }

    const statMembers = document.getElementById('statMembers');
    if (statMembers) {
        statMembers.innerText = (memberships || []).length;
    }
}

function renderCheckoutsTable() {
    const checkoutsTableBody = document.querySelector('#checkoutsTable tbody');
    if (!checkoutsTableBody) return;

    const checkins = JSON.parse(localStorage.getItem('kfz_checkins') || '[]');
    const completedCheckouts = checkins.filter(c => c.status === 'checked_out');

    checkoutsTableBody.innerHTML = '';

    if (completedCheckouts.length === 0) {
        checkoutsTableBody.innerHTML = '<tr><td colspan="8" class="text-center adm-text-muted py-4">No completed check-outs recorded yet.</td></tr>';
        return;
    }

    completedCheckouts.forEach((item, idx) => {
        const timeOutStr = item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
        const methodBadge = item.paymentMethod === 'wallet' ? 'adm-badge-warning' : item.paymentMethod === 'card' ? 'adm-badge-purple' : 'adm-badge-accent';
        const methodName = item.paymentMethod ? item.paymentMethod.toUpperCase() : 'CASH';

        checkoutsTableBody.innerHTML += `
            <tr>
                <td class="adm-fw-600 text-center" style="width: 50px;">${idx + 1}</td>
                <td class="adm-fw-600">${item.childName}</td>
                <td>${item.parentName}</td>
                <td class="adm-text-secondary">${timeOutStr}</td>
                <td>${item.actualDuration || item.plannedDuration} Mins</td>
                <td class="adm-fw-700">₹${item.totalAmount || item.baseAmount}</td>
                <td><span class="adm-badge ${methodBadge}">${methodName}</span></td>
                <td><span class="adm-badge adm-badge-success">Completed</span></td>
            </tr>
        `;
    });
}

function triggerCheckOut(id) {
    const checkins = JSON.parse(localStorage.getItem('kfz_checkins') || '[]');
    const checkin = checkins.find(c => c.id === id);
    if (!checkin) return;

    // Calculate actual elapsed minutes
    const timeIn = new Date(checkin.checkInTime);
    const actualDuration = Math.max(5, Math.floor((new Date() - timeIn) / 60000)); // minimum 5 mins for testing
    
    // Pricing configuration
    const gracePeriod = 10;
    const overtimeRatePerMin = 5; // ₹5 per minute overtime

    const overtimeMins = Math.max(0, actualDuration - checkin.plannedDuration);
    let overtimeCharge = 0.0;
    if (overtimeMins > gracePeriod) {
        overtimeCharge = overtimeMins * overtimeRatePerMin;
    }

    const discount = 0.0; // static for now
    const totalAmount = checkin.baseAmount + overtimeCharge - discount;

    // Set checkout modal values
    const modalEl = document.getElementById('checkoutModal');
    if (!modalEl) {
        // If not on page with checkoutModal, just check out
        checkin.status = 'checked_out';
        checkin.actualDuration = actualDuration;
        checkin.overtimeAmount = overtimeCharge;
        checkin.totalAmount = totalAmount;
        localStorage.setItem('kfz_checkins', JSON.stringify(checkins));
        refreshAdminDataUI();
        alert(`Checked out ${checkin.childName}. Total Amount: ₹${totalAmount}`);
        return;
    }

    document.getElementById('co_checkin_id').value = id;
    document.getElementById('co_child_name').innerText = checkin.childName;
    document.getElementById('co_parent_name').innerText = checkin.parentName;
    document.getElementById('co_planned_duration').innerText = `${checkin.plannedDuration} Mins`;
    document.getElementById('co_actual_duration').innerText = `${actualDuration} Mins`;
    document.getElementById('co_overtime').innerText = `${overtimeMins} Mins (Grace: ${gracePeriod}m)`;
    document.getElementById('co_base_charge').innerText = `₹${checkin.baseAmount}`;
    document.getElementById('co_overtime_charge').innerText = `₹${overtimeCharge}`;
    document.getElementById('co_total_charge').innerText = `₹${totalAmount}`;

    // Get parent wallet status
    const customers = JSON.parse(localStorage.getItem('kfz_customers') || '[]');
    const parent = customers.find(c => `${c.firstName} ${c.lastName}` === checkin.parentName);
    const walletBalance = parent ? parent.walletBalance : 0.0;
    
    const walletLabel = document.getElementById('co_wallet_balance');
    const payMethodSelect = document.getElementById('co_payment_method');
    
    if (walletLabel) {
        walletLabel.innerText = `₹${walletBalance.toFixed(2)}`;
    }

    // Toggle wallet option in dropdown based on balance
    if (payMethodSelect) {
        const walletOption = payMethodSelect.querySelector('option[value="wallet"]');
        if (walletOption) {
            if (walletBalance < totalAmount) {
                walletOption.disabled = true;
                walletOption.innerText = `Loyalty Wallet (Insufficient: ₹${walletBalance.toFixed(2)})`;
            } else {
                walletOption.disabled = false;
                walletOption.innerText = `Loyalty Wallet (Balance: ₹${walletBalance.toFixed(2)})`;
            }
        }
    }

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    // Handle checkout payment submission
    const payBtn = document.getElementById('btnConfirmCheckoutPay');
    if (payBtn) {
        // Remove existing listener to prevent duplicate clicks
        const newPayBtn = payBtn.cloneNode(true);
        payBtn.parentNode.replaceChild(newPayBtn, payBtn);

        newPayBtn.addEventListener('click', () => {
            const payMethod = document.getElementById('co_payment_method').value;
            
            // Perform simulated checkout transaction
            const checkinsList = JSON.parse(localStorage.getItem('kfz_checkins') || '[]');
            const cItem = checkinsList.find(c => c.id === id);
            
            if (cItem) {
                cItem.status = 'checked_out';
                cItem.actualDuration = actualDuration;
                cItem.overtimeAmount = overtimeCharge;
                cItem.totalAmount = totalAmount;
                cItem.paymentStatus = 'paid';
                cItem.paymentMethod = payMethod;
                
                // Deduct from wallet if wallet selected
                if (payMethod === 'wallet' && parent) {
                    const custs = JSON.parse(localStorage.getItem('kfz_customers') || '[]');
                    const cIndex = custs.findIndex(cust => cust.id === parent.id);
                    if (cIndex !== -1 && custs[cIndex].walletBalance >= totalAmount) {
                        custs[cIndex].walletBalance = parseFloat((custs[cIndex].walletBalance - totalAmount).toFixed(2));
                        // Add points
                        custs[cIndex].loyaltyPoints += Math.floor(totalAmount / 10);
                        localStorage.setItem('kfz_customers', JSON.stringify(custs));
                    }
                }
                
                localStorage.setItem('kfz_checkins', JSON.stringify(checkinsList));
            }

            // Create invoice simulation
            createMockInvoice(cItem, payMethod);

            bsModal.hide();
            refreshAdminDataUI();

            if (window.showToast) {
                showToast('Checked Out', `${checkin.childName} checked out successfully!`, 'success');
            } else {
                alert(`${checkin.childName} checked out successfully!`);
            }
        });
    }
}

function createMockInvoice(checkinItem, paymentMethod) {
    const invoices = JSON.parse(localStorage.getItem('kfz_invoices') || '[]');
    const newInvoice = {
        id: 'INV-' + Math.floor(100000 + Math.random() * 900000),
        customerName: checkinItem.parentName,
        childName: checkinItem.childName,
        date: new Date().toLocaleDateString(),
        amount: checkinItem.totalAmount,
        status: 'Paid',
        paymentMethod: paymentMethod
    };
    invoices.unshift(newInvoice);
    localStorage.setItem('kfz_invoices', JSON.stringify(invoices));
}

// 5. Loyalty Wallet Recharge & Adjustments
function setupWalletSystem() {
    const rechargeForm = document.getElementById('walletRechargeForm');
    if (rechargeForm) {
        // Populate parent select
        const parentSelect = document.getElementById('walletParentSelect');
        const customers = JSON.parse(localStorage.getItem('kfz_customers') || '[]');
        if (parentSelect) {
            parentSelect.innerHTML = '<option value="">Select Parent...</option>';
            customers.forEach(c => {
                parentSelect.innerHTML += `<option value="${c.id}">${c.firstName} ${c.lastName} (Bal: ₹${c.walletBalance.toFixed(2)})</option>`;
            });
        }

        rechargeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const parentId = parseInt(document.getElementById('walletParentSelect').value);
            const amount = parseFloat(document.getElementById('walletAmount').value);
            
            if (!parentId || isNaN(amount) || amount <= 0) return;

            const custs = JSON.parse(localStorage.getItem('kfz_customers') || '[]');
            const cIndex = custs.findIndex(c => c.id === parentId);
            
            if (cIndex !== -1) {
                custs[cIndex].walletBalance = parseFloat((custs[cIndex].walletBalance + amount).toFixed(2));
                // 1 point for every 10 ₹ recharge
                custs[cIndex].loyaltyPoints += Math.floor(amount / 10);
                localStorage.setItem('kfz_customers', JSON.stringify(custs));

                // Log Transaction
                const transactions = JSON.parse(localStorage.getItem('kfz_transactions') || '[]');
                transactions.unshift({
                    id: Date.now(),
                    customerName: `${custs[cIndex].firstName} ${custs[cIndex].lastName}`,
                    amount: amount,
                    type: 'Recharge',
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('kfz_transactions', JSON.stringify(transactions));
            }

            const modalEl = document.getElementById('walletModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            rechargeForm.reset();
            location.reload(); // Quick refresh to update tables & grids
        });
    }
}

function renderTodayCheckinsTable() {
    const todayTableBody = document.querySelector('#todayCheckinsTable tbody');
    if (!todayTableBody) return;

    const checkins = JSON.parse(localStorage.getItem('kfz_checkins') || '[]');
    todayTableBody.innerHTML = '';

    if (checkins.length === 0) {
        todayTableBody.innerHTML = '<tr><td colspan="7" class="text-center adm-text-muted py-4">No check-ins recorded today yet.</td></tr>';
        return;
    }

    checkins.forEach((item, idx) => {
        const timeIn = new Date(item.checkInTime);
        const statusBadge = item.status === 'checked_in' ? '<span class="adm-badge adm-badge-accent">Active Playing</span>' : '<span class="adm-badge adm-badge-success">Checked Out</span>';
        const actionBtn = item.status === 'checked_in' ? `<button class="adm-btn adm-btn-secondary adm-btn-sm btn-checkout" data-id="${item.id}"><i class="bi bi-box-arrow-right"></i> Check Out</button>` : '<span class="adm-text-muted small">Completed</span>';

        todayTableBody.innerHTML += `
            <tr data-id="${item.id}">
                <td class="adm-fw-600 text-center" style="width: 50px;">${idx + 1}</td>
                <td class="adm-fw-600">${item.childName}</td>
                <td>${item.parentName}</td>
                <td class="adm-text-secondary">${timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td class="adm-text-secondary">${item.plannedDuration} Mins</td>
                <td>${statusBadge}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });

    document.querySelectorAll('#todayCheckinsTable .btn-checkout').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            triggerCheckOut(id);
        });
    });
}

function renderPartyBookingsTable(birthdaysArg) {
    const partyTableBody = document.querySelector('#partyBookingsTable tbody');
    if (partyTableBody) {
        const birthdays = birthdaysArg || [];
        partyTableBody.innerHTML = '';

        if (birthdays.length === 0) {
            partyTableBody.innerHTML = '<tr><td colspan="9" class="text-center adm-text-muted py-4">No party bookings available.</td></tr>';
        } else {
            birthdays.forEach((item, idx) => {
                const badgeColor = item.package === 'Platinum' ? 'adm-badge-purple' : item.package === 'Gold' ? 'adm-badge-warning' : 'adm-badge-accent';
                const statusBadge = item.status === 'completed' ? '<span class="adm-badge adm-badge-success">Completed</span>' : '<span class="adm-badge adm-badge-live">Booked</span>';

                partyTableBody.innerHTML += `
                    <tr>
                        <td class="adm-fw-600 text-center" style="width: 50px;">${idx + 1}</td>
                        <td class="adm-fw-600">${item.childName}</td>
                        <td>${item.parentName}</td>
                        <td class="adm-text-secondary">${item.date}</td>
                        <td class="adm-text-secondary">${item.timeSlot}</td>
                        <td><span class="adm-badge ${badgeColor}">${item.package}</span></td>
                        <td>${item.guests} Guests</td>
                        <td class="adm-fw-700">₹${(item.amount || 24999).toLocaleString()}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            });
        }
    }
}

function renderUpcomingBirthdays(birthdaysArg) {
    const upcomingContainer = document.getElementById('upcomingBirthdays');
    if (!upcomingContainer) return;

    const birthdays = birthdaysArg || [];
    upcomingContainer.innerHTML = '';

    if (birthdays.length === 0) {
        upcomingContainer.innerHTML = '<div class="text-center adm-text-muted py-3">No upcoming birthday parties.</div>';
        return;
    }

    // Display top 4 upcoming bookings
    birthdays.slice(0, 4).forEach(item => {
        const badgeClass = item.package === 'Platinum' ? 'adm-badge-purple' : item.package === 'Gold' ? 'adm-badge-warning' : 'adm-badge-accent';
        const titleText = item.childAge ? `${item.childName}'s ${item.childAge}th Birthday` : `${item.childName}'s Birthday`;

        upcomingContainer.innerHTML += `
            <div class="adm-booking-card">
              <div class="adm-booking-card-top">
                <span class="adm-booking-name">${titleText}</span>
                <span class="adm-badge ${badgeClass}">${item.package}</span>
              </div>
              <div class="adm-booking-meta">
                <i class="bi bi-calendar3"></i> ${item.date || 'Scheduled'}
                <i class="bi bi-dot"></i>
                <i class="bi bi-people"></i> ${item.guests || 50} Guests
              </div>
            </div>
        `;
    });
}

function setupAdminPartyBooking() {
    const adminForm = document.getElementById('adminBookPartyForm');
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const childName = document.getElementById('admBookChildName').value;
            const parentName = document.getElementById('admBookParentName').value;
            const phone = document.getElementById('admBookPhone').value;
            const childAge = document.getElementById('admBookChildAge').value;
            const date = document.getElementById('admBookDate').value;
            const timeSlot = document.getElementById('admBookTimeSlot').value;
            const pkg = document.getElementById('admBookPackage').value;
            const guests = parseInt(document.getElementById('admBookGuests').value) || 50;
            const notes = document.getElementById('admBookNotes').value;

            const submitBtn = adminForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const res = await fetch('/api/birthdays', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        childName, parentName, phone, childAge,
                        date, timeSlot, package: pkg, guests, notes
                    })
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    alert(err.error || 'Something went wrong creating this booking. Please try again.');
                    return;
                }

                const modalEl = document.getElementById('adminBookPartyModal');
                if (modalEl && window.bootstrap) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }

                adminForm.reset();
                refreshAdminDataUI();

                alert(`Birthday Party for ${childName} booked successfully!`);
            } catch (err) {
                alert('Could not reach the server. Please check your connection and try again.');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
}
