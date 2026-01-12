let workers = JSON.parse(localStorage.getItem('workers')) || [];
let workerTypes = JSON.parse(localStorage.getItem('workerTypes')) || [];
let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
let companyLogo = localStorage.getItem('companyLogo') || '';
let currentLanguage = localStorage.getItem('language') || 'ar';

let checkinScanner = null;
let checkoutScanner = null;
let scanCooldown = false;
let currentEditingRecord = null;
let currentQRData = null;

const translations = {
    ar: {
        deleteWorker: 'هل تريد حذف العامل',
        deleteRecords: 'سيتم حذف جميع سجلات الحضور الخاصة به أيضاً',
        success: 'تم بنجاح',
        error: 'خطأ',
        workerAdded: 'تم إضافة العامل',
        workerDeleted: 'تم حذف العامل بنجاح',
        recordEdited: 'تم تعديل السجل بنجاح',
        recordDeleted: 'تم حذف السجل بنجاح',
        noData: 'لا توجد بيانات',
        confirmDelete: 'هل تريد حذف',
        cannotDelete: 'لا يمكن التراجع عن هذه العملية',
        checkedIn: 'تم تسجيل الدخول',
        checkedOut: 'تم تسجيل الخروج',
        alreadyCheckedIn: 'تم تسجيل دخول العامل مسبقاً اليوم',
        notCheckedIn: 'لم يتم تسجيل دخول العامل اليوم',
        workerNotFound: 'عامل غير موجود',
        hours: 'ساعات العمل',
        present: 'حاضر',
        absent: 'غائب',
        inside: 'داخل الموقع',
        left: 'خرج',
        delete: 'حذف'
    },
    en: {
        deleteWorker: 'Do you want to delete worker',
        deleteRecords: 'All attendance records will also be deleted',
        success: 'Success',
        error: 'Error',
        workerAdded: 'Worker added',
        workerDeleted: 'Worker deleted successfully',
        recordEdited: 'Record edited successfully',
        recordDeleted: 'Record deleted successfully',
        noData: 'No data available',
        confirmDelete: 'Do you want to delete',
        cannotDelete: 'This operation cannot be undone',
        checkedIn: 'Checked In',
        checkedOut: 'Checked Out',
        alreadyCheckedIn: 'Worker already checked in today',
        notCheckedIn: 'Worker not checked in today',
        workerNotFound: 'Worker not found',
        hours: 'Work Hours',
        present: 'Present',
        absent: 'Absent',
        inside: 'Inside',
        left: 'Left',
        delete: 'Delete'
    }
};

document.addEventListener('DOMContentLoaded', function() {
    applyLanguage();
    loadCompanyLogo();
    renderWorkerTypes();
    renderWorkers();
    updateAnalytics();
    updateStatus();
    renderReports();
    renderEditTable();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('editDate').value = today;
    document.getElementById('reportStartDate').value = today;
    document.getElementById('reportEndDate').value = today;
});

function toggleLanguage() {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    localStorage.setItem('language', currentLanguage);
    applyLanguage();
}

function applyLanguage() {
    const body = document.body;
    const langText = document.getElementById('langText');
    
    if (currentLanguage === 'en') {
        body.classList.add('en');
        body.setAttribute('dir', 'ltr');
        langText.textContent = 'عربي';
    } else {
        body.classList.remove('en');
        body.setAttribute('dir', 'rtl');
        langText.textContent = 'English';
    }
    
    document.querySelectorAll('[data-ar]').forEach(element => {
        const arText = element.getAttribute('data-ar');
        const enText = element.getAttribute('data-en');
        element.textContent = currentLanguage === 'ar' ? arText : enText;
    });
    
    document.querySelectorAll('[data-ar-placeholder]').forEach(element => {
        const arPlaceholder = element.getAttribute('data-ar-placeholder');
        const enPlaceholder = element.getAttribute('data-en-placeholder');
        element.placeholder = currentLanguage === 'ar' ? arPlaceholder : enPlaceholder;
    });
    
    renderWorkers();
    updateAnalytics();
    updateStatus();
    renderReports();
    renderEditTable();
}

function t(key) {
    return translations[currentLanguage][key] || key;
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    event.target.classList.add('active');
    
    if (tabName === 'analytics') updateAnalytics();
    if (tabName === 'status') updateStatus();
    if (tabName === 'reports') renderReports();
    if (tabName === 'edit') renderEditTable();
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        companyLogo = e.target.result;
        localStorage.setItem('companyLogo', companyLogo);
        loadCompanyLogo();
        alert(t('success'));
    };
    reader.readAsDataURL(file);
}

function loadCompanyLogo() {
    const logoPreviewArea = document.getElementById('logoPreviewArea');
    const logoDisplay = document.getElementById('companyLogoDisplay');
    
    if (companyLogo) {
        logoPreviewArea.innerHTML = `<img src="${companyLogo}" class="logo-preview mx-auto">`;
        logoDisplay.innerHTML = `<img src="${companyLogo}" class="logo-preview">`;
    } else {
        const text = currentLanguage === 'ar' ? 'اضغط لرفع شعار الشركة' : 'Click to upload company logo';
        logoPreviewArea.innerHTML = `
            <p class="text-gray-600 font-semibold">${text}</p>
            <p class="text-sm text-gray-500 mt-2">PNG, JPG, SVG</p>
        `;
        logoDisplay.innerHTML = '';
    }
}

function removeLogo() {
    if (!companyLogo) {
        alert(t('noData'));
        return;
    }
    
    if (confirm(t('confirmDelete'))) {
        companyLogo = '';
        localStorage.removeItem('companyLogo');
        loadCompanyLogo();
        alert(t('success'));
    }
}

function addWorkerType() {
    const input = document.getElementById('newWorkerType');
    const type = input.value.trim();
    
    if (!type) {
        alert(t('error'));
        return;
    }
    
    if (workerTypes.includes(type)) {
        alert(t('error'));
        return;
    }
    
    workerTypes.push(type);
    localStorage.setItem('workerTypes', JSON.stringify(workerTypes));
    input.value = '';
    renderWorkerTypes();
    updateWorkerTypeSelects();
    alert(t('success'));
}

function removeWorkerType(type) {
    const hasWorkers = workers.some(w => w.type === type);
    if (hasWorkers) {
        alert(t('error'));
        return;
    }
    
    if (confirm(`${t('confirmDelete')} "${type}"?`)) {
        workerTypes = workerTypes.filter(t => t !== type);
        localStorage.setItem('workerTypes', JSON.stringify(workerTypes));
        renderWorkerTypes();
        updateWorkerTypeSelects();
    }
}

function renderWorkerTypes() {
    const list = document.getElementById('workerTypesList');
    
    if (workerTypes.length === 0) {
        list.innerHTML = `<p class="text-gray-500">${t('noData')}</p>`;
        return;
    }
    
    list.innerHTML = workerTypes.map(type => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="font-semibold">${type}</span>
            <button onclick="removeWorkerType('${type}')" class="text-red-600 hover:text-red-800 font-bold">
                ${t('delete')}
            </button>
        </div>
    `).join('');
    
    updateWorkerTypeSelects();
}

function updateWorkerTypeSelects() {
    const selects = [
        document.getElementById('workerType'),
        document.getElementById('filterWorkerType'),
        document.getElementById('editWorkerFilter')
    ];
    
    selects.forEach(select => {
        const currentValue = select.value;
        const firstOption = select.querySelector('option:first-child').outerHTML;
        
        select.innerHTML = firstOption + workerTypes.map(type => 
            `<option value="${type}">${type}</option>`
        ).join('');
        
        select.value = currentValue;
    });
}

function addWorker() {
    const name = document.getElementById('workerName').value.trim();
    const type = document.getElementById('workerType').value;
    const phone = document.getElementById('workerPhone').value.trim();
    
    if (!name || !type || !phone) {
        alert(t('error'));
        return;
    }
    
    const workerId = `W${String(workers.length + 1).padStart(4, '0')}`;
    
    const worker = {
        id: workerId,
        name,
        type,
        phone,
        createdAt: new Date().toISOString()
    };
    
    workers.push(worker);
    localStorage.setItem('workers', JSON.stringify(workers));
    
    document.getElementById('workerName').value = '';
    document.getElementById('workerType').value = '';
    document.getElementById('workerPhone').value = '';
    
    renderWorkers();
    updateAnalytics();
    alert(`${t('workerAdded')} "${name}" - ${workerId}`);
}

function deleteWorker(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    
    if (confirm(`${t('deleteWorker')} "${worker.name}"?\n${t('deleteRecords')}`)) {
        workers = workers.filter(w => w.id !== workerId);
        attendance = attendance.filter(a => a.workerId !== workerId);
        
        localStorage.setItem('workers', JSON.stringify(workers));
        localStorage.setItem('attendance', JSON.stringify(attendance));
        
        renderWorkers();
        updateAnalytics();
        alert(t('workerDeleted'));
    }
}

function showQRCode(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    
    currentQRData = { workerId, worker };
    
    const qr = qrcode(0, 'M');
    qr.addData(workerId);
    qr.make();
    const qrDataUrl = qr.createDataURL(8);
    
    document.getElementById('qrCodeDisplay').innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
            <img src="${qrDataUrl}" style="width: 300px; height: 300px;">
            <p class="mt-4 text-xl font-bold text-gray-800">${worker.name}</p>
            <p class="text-gray-600">${worker.type} - ${worker.id}</p>
        </div>
    `;
    
    document.getElementById('qrModal').classList.add('active');
}

function downloadQRCode() {
    if (!currentQRData) return;
    
    const { workerId, worker } = currentQRData;
    
    const qr = qrcode(0, 'M');
    qr.addData(workerId);
    qr.make();
    const qrDataUrl = qr.createDataURL(8);
    
    const link = document.createElement('a');
    link.download = `QR_${worker.name}_${workerId}.png`;
    link.href = qrDataUrl;
    link.click();
}

function printQRCode() {
    if (!currentQRData) return;
    
    const { workerId, worker } = currentQRData;
    printWorkerCard(workerId);
}

function closeQRModal() {
    document.getElementById('qrModal').classList.remove('active');
    currentQRData = null;
}

function printWorkerCard(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    
    const qr = qrcode(0, 'M');
    qr.addData(workerId);
    qr.make();
    const qrDataUrl = qr.createDataURL(4);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${currentLanguage === 'ar' ? 'بطاقة العامل' : 'Worker Card'} - ${worker.name}</title>
            <style>
                @page { margin: 0; }
                body {
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    font-family: 'Cairo', sans-serif;
                }
                .card {
                    width: 350px;
                    height: 220px;
                    background: linear-gradient(135deg, #2C3E50 0%, #3498DB 100%);
                    border-radius: 12px;
                    padding: 20px;
                    color: white;
                    position: relative;
                }
                .logo-container {
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    background: white;
                    padding: 8px;
                    border-radius: 8px;
                    max-width: 120px;
                    max-height: 60px;
                }
                .logo-container img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                }
                .qr-container {
                    position: absolute;
                    bottom: 15px;
                    left: 15px;
                    background: white;
                    padding: 8px;
                    border-radius: 8px;
                }
                .qr-container img {
                    width: 80px;
                    height: 80px;
                }
                .info-container {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    text-align: right;
                }
                .worker-name {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                .worker-type {
                    font-size: 16px;
                    opacity: 0.9;
                    margin-bottom: 8px;
                }
                .worker-id {
                    font-size: 18px;
                    font-weight: 600;
                    background: rgba(255,255,255,0.2);
                    padding: 6px 12px;
                    border-radius: 6px;
                    display: inline-block;
                }
            </style>
        </head>
        <body>
            <div class="card">
                ${companyLogo ? `
                    <div class="logo-container">
                        <img src="${companyLogo}" alt="Company Logo">
                    </div>
                ` : ''}
                <div class="qr-container">
                    <img src="${qrDataUrl}" alt="QR Code">
                </div>
                <div class="info-container">
                    <div class="worker-name">${worker.name}</div>
                    <div class="worker-type">${worker.type}</div>
                    <div class="worker-id">${worker.id}</div>
                </div>
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function renderWorkers() {
    const tbody = document.getElementById('workersTableBody');
    const search = document.getElementById('searchWorker').value.toLowerCase();
    const typeFilter = document.getElementById('filterWorkerType').value;
    
    let filtered = workers.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(search) || 
                            w.id.toLowerCase().includes(search) ||
                            w.phone.includes(search);
        const matchesType = !typeFilter || w.type === typeFilter;
        return matchesSearch && matchesType;
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 py-8">${t('noData')}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map(worker => {
        const todayRecord = getTodayAttendance(worker.id);
        let status;
        if (todayRecord) {
            if (todayRecord.checkOut) {
                status = `<span class="badge badge-info">${t('left')}</span>`;
            } else {
                status = `<span class="badge badge-success">${t('inside')}</span>`;
            }
        } else {
            status = `<span class="badge badge-danger">${t('absent')}</span>`;
        }
        
        const printText = currentLanguage === 'ar' ? 'طباعة البطاقة' : 'Print Card';
        const qrText = currentLanguage === 'ar' ? 'عرض QR' : 'Show QR';
        
        return `
            <tr>
                <td class="font-semibold">${worker.id}</td>
                <td>${worker.name}</td>
                <td>${worker.type}</td>
                <td>${worker.phone}</td>
                <td>${status}</td>
                <td>
                    <div class="flex gap-2">
                        <button onclick="showQRCode('${worker.id}')" class="btn-primary text-sm px-3 py-1">
                            ${qrText}
                        </button>
                        <button onclick="printWorkerCard('${worker.id}')" class="btn-secondary text-sm px-3 py-1">
                            ${printText}
                        </button>
                        <button onclick="deleteWorker('${worker.id}')" class="btn-danger text-sm px-3 py-1">
                            ${t('delete')}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getTodayAttendance(workerId) {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.workerId === workerId && a.date === today);
}

function startCheckinScanner() {
    const container = document.getElementById('checkinScannerContainer');
    container.style.display = 'block';
    
    if (!checkinScanner) {
        checkinScanner = new Html5Qrcode("checkinScanner");
    }
    
    checkinScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onCheckinScanSuccess
    ).catch(err => {
        alert(t('error') + ': ' + err);
    });
    
    renderCheckinHistory();
}

function stopCheckinScanner() {
    if (checkinScanner) {
        checkinScanner.stop().then(() => {
            document.getElementById('checkinScannerContainer').style.display = 'none';
        }).catch(err => {
            console.error('Error stopping scanner:', err);
        });
    }
}

function startCheckoutScanner() {
    const container = document.getElementById('checkoutScannerContainer');
    container.style.display = 'block';
    
    if (!checkoutScanner) {
        checkoutScanner = new Html5Qrcode("checkoutScanner");
    }
    
    checkoutScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onCheckoutScanSuccess
    ).catch(err => {
        alert(t('error') + ': ' + err);
    });
    
    renderCheckoutHistory();
}

function stopCheckoutScanner() {
    if (checkoutScanner) {
        checkoutScanner.stop().then(() => {
            document.getElementById('checkoutScannerContainer').style.display = 'none';
        }).catch(err => {
            console.error('Error stopping scanner:', err);
        });
    }
}

function onCheckinScanSuccess(decodedText) {
    if (scanCooldown) return;
    
    const worker = workers.find(w => w.id === decodedText);
    if (!worker) {
        showMessage('checkinMessage', t('workerNotFound'), false);
        return;
    }
    
    const todayRecord = getTodayAttendance(worker.id);
    if (todayRecord && !todayRecord.checkOut) {
        showMessage('checkinMessage', `${t('alreadyCheckedIn')}: ${worker.name}`, false);
        return;
    }
    
    const now = new Date();
    const record = {
        id: Date.now().toString(),
        workerId: worker.id,
        date: now.toISOString().split('T')[0],
        checkIn: now.toTimeString().split(' ')[0].substring(0, 5),
        checkOut: null,
        hours: null
    };
    
    attendance.push(record);
    localStorage.setItem('attendance', JSON.stringify(attendance));
    
    showMessage('checkinMessage', `${t('checkedIn')}\n${worker.name} - ${worker.type}\n${record.checkIn}`, true);
    
    scanCooldown = true;
    setTimeout(() => scanCooldown = false, 2000);
    
    renderCheckinHistory();
    updateAnalytics();
    updateStatus();
}

function onCheckoutScanSuccess(decodedText) {
    if (scanCooldown) return;
    
    const worker = workers.find(w => w.id === decodedText);
    if (!worker) {
        showMessage('checkoutMessage', t('workerNotFound'), false);
        return;
    }
    
    const todayRecord = getTodayAttendance(worker.id);
    if (!todayRecord) {
        showMessage('checkoutMessage', `${t('notCheckedIn')}: ${worker.name}`, false);
        return;
    }
    
    if (todayRecord.checkOut) {
        showMessage('checkoutMessage', `${worker.name} ${t('left')}`, false);
        return;
    }
    
    const now = new Date();
    todayRecord.checkOut = now.toTimeString().split(' ')[0].substring(0, 5);
    todayRecord.hours = calculateHours(todayRecord.checkIn, todayRecord.checkOut);
    
    localStorage.setItem('attendance', JSON.stringify(attendance));
    
    showMessage('checkoutMessage', `${t('checkedOut')}\n${worker.name} - ${worker.type}\n${todayRecord.checkOut}\n${t('hours')}: ${todayRecord.hours}`, true);
    
    scanCooldown = true;
    setTimeout(() => scanCooldown = false, 2000);
    
    renderCheckoutHistory();
    updateAnalytics();
    updateStatus();
}

function showMessage(elementId, message, isSuccess) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="success-message" style="background: ${isSuccess ? '#D5F4E6' : '#FADBD8'}; border-color: ${isSuccess ? '#27AE60' : '#E74C3C'}; color: ${isSuccess ? '#27AE60' : '#E74C3C'};">${message.replace(/\n/g, '<br>')}</div>`;
    
    setTimeout(() => {
        element.innerHTML = '';
    }, 2000);
}

function calculateHours(checkIn, checkOut) {
    const [h1, m1] = checkIn.split(':').map(Number);
    const [h2, m2] = checkOut.split(':').map(Number);
    const minutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return currentLanguage === 'ar' ? `${hours}س ${mins}د` : `${hours}h ${mins}m`;
}

function renderCheckinHistory() {
    const container = document.getElementById('checkinHistory');
    const today = new Date().toISOString().split('T')[0];
    const todayCheckins = attendance
        .filter(a => a.date === today && a.checkIn)
        .slice(-5)
        .reverse();
    
    if (todayCheckins.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500">${t('noData')}</p>`;
        return;
    }
    
    const title = currentLanguage === 'ar' ? 'آخر عمليات الدخول' : 'Recent Check Ins';
    
    container.innerHTML = `
        <h3 class="font-bold text-lg mb-3">${title}</h3>
        <div class="space-y-2">
            ${todayCheckins.map(record => {
                const worker = workers.find(w => w.id === record.workerId);
                return `
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                            <div class="font-semibold">${worker.name}</div>
                            <div class="text-sm text-gray-600">${worker.type}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-green-600">${record.checkIn}</div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderCheckoutHistory() {
    const container = document.getElementById('checkoutHistory');
    const today = new Date().toISOString().split('T')[0];
    const todayCheckouts = attendance
        .filter(a => a.date === today && a.checkOut)
        .slice(-5)
        .reverse();
    
    if (todayCheckouts.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500">${t('noData')}</p>`;
        return;
    }
    
    const title = currentLanguage === 'ar' ? 'آخر عمليات الخروج' : 'Recent Check Outs';
    
    container.innerHTML = `
        <h3 class="font-bold text-lg mb-3">${title}</h3>
        <div class="space-y-2">
            ${todayCheckouts.map(record => {
                const worker = workers.find(w => w.id === record.workerId);
                return `
                    <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div>
                            <div class="font-semibold">${worker.name}</div>
                            <div class="text-sm text-gray-600">${worker.type}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-blue-600">${record.checkOut}</div>
                            <div class="text-sm text-gray-600">${record.hours}</div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function updateAnalytics() {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);
    
    document.getElementById('totalWorkers').textContent = workers.length;
    document.getElementById('presentToday').textContent = todayAttendance.length;
    document.getElementById('absentToday').textContent = workers.length - todayAttendance.length;
    document.getElementById('currentlyInside').textContent = todayAttendance.filter(a => !a.checkOut).length;
    
    renderAnalyticsTable();
}

function renderAnalyticsTable() {
    const tbody = document.getElementById('analyticsTableBody');
    const today = new Date().toISOString().split('T')[0];
    
    const stats = workerTypes.map(type => {
        const typeWorkers = workers.filter(w => w.type === type);
        const typePresent = typeWorkers.filter(w => {
            const record = getTodayAttendance(w.id);
            return record !== undefined;
        });
        const typeInside = typeWorkers.filter(w => {
            const record = getTodayAttendance(w.id);
            return record && !record.checkOut;
        });
        
        const total = typeWorkers.length;
        const present = typePresent.length;
        const absent = total - present;
        const inside = typeInside.length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        return { type, total, present, absent, inside, percentage };
    });
    
    tbody.innerHTML = stats.map(stat => `
        <tr>
            <td class="font-semibold">${stat.type}</td>
            <td>${stat.total}</td>
            <td><span class="badge badge-success">${stat.present}</span></td>
            <td><span class="badge badge-danger">${stat.absent}</span></td>
            <td><span class="badge badge-info">${stat.inside}</span></td>
            <td>
                <div class="flex items-center gap-2">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: ${stat.percentage}%"></div>
                    </div>
                    <span class="font-semibold">${stat.percentage}%</span>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateStatus() {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);
    
    const present = workers.filter(w => todayAttendance.some(a => a.workerId === w.id));
    const absent = workers.filter(w => !todayAttendance.some(a => a.workerId === w.id));
    
    document.getElementById('presentList').innerHTML = present.length > 0 ? 
        present.map(w => `
            <div class="p-3 bg-green-50 rounded-lg mb-2">
                <div class="font-semibold">${w.name}</div>
                <div class="text-sm text-gray-600">${w.type} - ${w.phone}</div>
            </div>
        `).join('') : 
        `<p class="text-center text-gray-500">${t('noData')}</p>`;
    
    document.getElementById('absentList').innerHTML = absent.length > 0 ?
        absent.map(w => `
            <div class="p-3 bg-red-50 rounded-lg mb-2">
                <div class="font-semibold">${w.name}</div>
                <div class="text-sm text-gray-600">${w.type} - ${w.phone}</div>
            </div>
        `).join('') :
        `<p class="text-center text-gray-500">${t('noData')}</p>`;
}

function renderReports() {
    const tbody = document.getElementById('reportsTableBody');
    
    if (attendance.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-500 py-8">${t('noData')}</td></tr>`;
        return;
    }
    
    const sorted = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sorted.slice(0, 50).map(record => {
        const worker = workers.find(w => w.id === record.workerId);
        const unknownText = currentLanguage === 'ar' ? 'غير معروف' : 'Unknown';
        return `
            <tr>
                <td><input type="checkbox" class="report-checkbox" data-record-id="${record.id}"></td>
                <td>${record.date}</td>
                <td>${worker ? worker.name : unknownText}</td>
                <td>${worker ? worker.type : '-'}</td>
                <td>${record.checkIn}</td>
                <td>${record.checkOut || '-'}</td>
                <td>${record.hours || '-'}</td>
            </tr>
        `;
    }).join('');
}

function selectAllReports() {
    const checked = document.getElementById('selectAllReports').checked;
    document.querySelectorAll('.report-checkbox').forEach(cb => cb.checked = checked);
}

function confirmDeleteSelectedReports() {
    const selected = Array.from(document.querySelectorAll('.report-checkbox:checked'))
        .map(cb => cb.getAttribute('data-record-id'));
    
    if (selected.length === 0) {
        alert(t('noData'));
        return;
    }
    
    const message = currentLanguage === 'ar' ? 
        `هل تريد حذف ${selected.length} سجل؟\n${t('cannotDelete')}` :
        `Delete ${selected.length} records?\n${t('cannotDelete')}`;
    
    if (confirm(message)) {
        attendance = attendance.filter(a => !selected.includes(a.id));
        localStorage.setItem('attendance', JSON.stringify(attendance));
        renderReports();
        renderEditTable();
        updateAnalytics();
        alert(t('recordDeleted'));
    }
}

function renderEditTable() {
    const tbody = document.getElementById('editTableBody');
    const dateFilter = document.getElementById('editDate').value;
    const workerFilter = document.getElementById('editWorkerFilter').value;
    
    let filtered = attendance.filter(a => {
        const matchesDate = !dateFilter || a.date === dateFilter;
        const matchesWorker = !workerFilter || a.workerId === workerFilter;
        return matchesDate && matchesWorker;
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 py-8">${t('noData')}</td></tr>`;
        return;
    }
    
    const editText = currentLanguage === 'ar' ? 'تعديل' : 'Edit';
    const unknownText = currentLanguage === 'ar' ? 'غير معروف' : 'Unknown';
    
    tbody.innerHTML = filtered.map(record => {
        const worker = workers.find(w => w.id === record.workerId);
        return `
            <tr>
                <td>${record.date}</td>
                <td>${worker ? worker.name : unknownText}</td>
                <td>${worker ? worker.type : '-'}</td>
                <td>${record.checkIn}</td>
                <td>${record.checkOut || '-'}</td>
                <td>
                    <div class="flex gap-2">
                        <button onclick="editRecord('${record.id}')" class="btn-primary text-sm px-3 py-1">${editText}</button>
                        <button onclick="deleteRecord('${record.id}')" class="btn-danger text-sm px-3 py-1">${t('delete')}</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function editRecord(recordId) {
    currentEditingRecord = attendance.find(a => a.id === recordId);
    if (!currentEditingRecord) return;
    
    document.getElementById('editCheckinTime').value = currentEditingRecord.checkIn;
    document.getElementById('editCheckoutTime').value = currentEditingRecord.checkOut || '';
    document.getElementById('editRecordModal').classList.add('active');
}

function saveEditedRecord() {
    if (!currentEditingRecord) return;
    
    const newCheckin = document.getElementById('editCheckinTime').value;
    const newCheckout = document.getElementById('editCheckoutTime').value;
    
    if (!newCheckin) {
        alert(t('error'));
        return;
    }
    
    const record = attendance.find(a => a.id === currentEditingRecord.id);
    record.checkIn = newCheckin;
    record.checkOut = newCheckout || null;
    record.hours = newCheckout ? calculateHours(newCheckin, newCheckout) : null;
    
    localStorage.setItem('attendance', JSON.stringify(attendance));
    closeEditRecordModal();
    renderEditTable();
    alert(t('recordEdited'));
}

function deleteRecord(recordId) {
    const record = attendance.find(a => a.id === recordId);
    if (!record) return;
    
    const worker = workers.find(w => w.id === record.workerId);
    const workerName = worker ? worker.name : 'Unknown';
    
    if (confirm(`${t('confirmDelete')} "${workerName}" ${record.date}?`)) {
        attendance = attendance.filter(a => a.id !== recordId);
        localStorage.setItem('attendance', JSON.stringify(attendance));
        renderEditTable();
        updateAnalytics();
        alert(t('recordDeleted'));
    }
}

function closeEditRecordModal() {
    document.getElementById('editRecordModal').classList.remove('active');
    currentEditingRecord = null;
}

function confirmDeleteAllWorkers() {
    const message = currentLanguage === 'ar' ?
        'هل تريد حذف جميع العمال؟\nسيتم حذف جميع سجلات الحضور أيضاً\n\nهذه العملية لا يمكن التراجع عنها' :
        'Delete all workers?\nAll attendance records will also be deleted\n\nThis operation cannot be undone';
    
    showConfirm(message, deleteAllWorkers);
}

function deleteAllWorkers() {
    workers = [];
    attendance = [];
    localStorage.setItem('workers', JSON.stringify(workers));
    localStorage.setItem('attendance', JSON.stringify(attendance));
    renderWorkers();
    updateAnalytics();
    closeConfirmModal();
    alert(t('workerDeleted'));
}

function confirmDeleteAllAttendance() {
    const message = currentLanguage === 'ar' ?
        'هل تريد حذف جميع سجلات الحضور؟\n\nهذه العملية لا يمكن التراجع عنها' :
        'Delete all attendance records?\n\nThis operation cannot be undone';
    
    showConfirm(message, deleteAllAttendance);
}

function deleteAllAttendance() {
    attendance = [];
    localStorage.setItem('attendance', JSON.stringify(attendance));
    renderReports();
    renderEditTable();
    updateAnalytics();
    closeConfirmModal();
    alert(t('recordDeleted'));
}

function confirmDeleteEverything() {
    const message = currentLanguage === 'ar' ?
        'تحذير\n\nهل تريد حذف جميع البيانات؟\nجميع العمال\nجميع سجلات الحضور\nأنواع العمال\nشعار الشركة\n\nهذه العملية لا يمكن التراجع عنها نهائياً' :
        'Warning\n\nDelete all data?\nAll workers\nAll attendance records\nWorker types\nCompany logo\n\nThis operation cannot be undone';
    
    showConfirm(message, deleteEverything);
}

function deleteEverything() {
    workers = [];
    attendance = [];
    workerTypes = [];
    companyLogo = '';
    
    localStorage.clear();
    localStorage.setItem('language', currentLanguage);
    
    renderWorkerTypes();
    renderWorkers();
    renderReports();
    renderEditTable();
    updateAnalytics();
    loadCompanyLogo();
    
    closeConfirmModal();
    alert(t('success'));
}

function exportAnalytics() {
    const today = new Date().toISOString().split('T')[0];
    const data = workerTypes.map(type => {
        const typeWorkers = workers.filter(w => w.type === type);
        const typePresent = typeWorkers.filter(w => getTodayAttendance(w.id));
        
        if (currentLanguage === 'ar') {
            return {
                'نوع العامل': type,
                'الإجمالي': typeWorkers.length,
                'حضروا اليوم': typePresent.length,
                'غائبون': typeWorkers.length - typePresent.length,
                'نسبة الحضور': typeWorkers.length > 0 ? `${Math.round((typePresent.length / typeWorkers.length) * 100)}%` : '0%'
            };
        } else {
            return {
                'Worker Type': type,
                'Total': typeWorkers.length,
                'Present': typePresent.length,
                'Absent': typeWorkers.length - typePresent.length,
                'Attendance %': typeWorkers.length > 0 ? `${Math.round((typePresent.length / typeWorkers.length) * 100)}%` : '0%'
            };
        }
    });
    
    const sheetName = currentLanguage === 'ar' ? 'الإحصائيات' : 'Statistics';
    exportToExcel([{ name: sheetName, data }], `${sheetName}_${today}`);
}

function exportTodayStatus() {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);
    
    const present = workers.filter(w => todayAttendance.some(a => a.workerId === w.id)).map(w => {
        if (currentLanguage === 'ar') {
            return {
                'الاسم': w.name,
                'رقم العامل': w.id,
                'نوع العامل': w.type,
                'رقم الهاتف': w.phone,
                'الحالة': 'حاضر'
            };
        } else {
            return {
                'Name': w.name,
                'Worker ID': w.id,
                'Type': w.type,
                'Phone': w.phone,
                'Status': 'Present'
            };
        }
    });
    
    const absent = workers.filter(w => !todayAttendance.some(a => a.workerId === w.id)).map(w => {
        if (currentLanguage === 'ar') {
            return {
                'الاسم': w.name,
                'رقم العامل': w.id,
                'نوع العامل': w.type,
                'رقم الهاتف': w.phone,
                'الحالة': 'غائب'
            };
        } else {
            return {
                'Name': w.name,
                'Worker ID': w.id,
                'Type': w.type,
                'Phone': w.phone,
                'Status': 'Absent'
            };
        }
    });
    
    const sheets = currentLanguage === 'ar' ? [
        { name: 'الحاضرون', data: present },
        { name: 'الغائبون', data: absent },
        { name: 'الكل', data: [...present, ...absent] }
    ] : [
        { name: 'Present', data: present },
        { name: 'Absent', data: absent },
        { name: 'All', data: [...present, ...absent] }
    ];
    
    const filename = currentLanguage === 'ar' ? `حالة_اليوم_${today}` : `Status_${today}`;
    exportToExcel(sheets, filename);
}

function exportTodayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendance.filter(a => a.date === today);
    
    const sheets = workerTypes.map(type => {
        const typeRecords = todayRecords
            .filter(a => {
                const worker = workers.find(w => w.id === a.workerId);
                return worker && worker.type === type;
            })
            .map(a => {
                const worker = workers.find(w => w.id === a.workerId);
                if (currentLanguage === 'ar') {
                    return {
                        'اسم العامل': worker.name,
                        'رقم العامل': worker.id,
                        'التاريخ': a.date,
                        'وقت الدخول': a.checkIn,
                        'وقت الخروج': a.checkOut || '-',
                        'ساعات العمل': a.hours || '-'
                    };
                } else {
                    return {
                        'Worker Name': worker.name,
                        'Worker ID': worker.id,
                        'Date': a.date,
                        'Check In': a.checkIn,
                        'Check Out': a.checkOut || '-',
                        'Hours': a.hours || '-'
                    };
                }
            });
        
        return { name: type, data: typeRecords };
    });
    
    const allRecords = todayRecords.map(a => {
        const worker = workers.find(w => w.id === a.workerId);
        if (currentLanguage === 'ar') {
            return {
                'اسم العامل': worker.name,
                'رقم العامل': worker.id,
                'نوع العامل': worker.type,
                'التاريخ': a.date,
                'وقت الدخول': a.checkIn,
                'وقت الخروج': a.checkOut || '-',
                'ساعات العمل': a.hours || '-'
            };
        } else {
            return {
                'Worker Name': worker.name,
                'Worker ID': worker.id,
                'Type': worker.type,
                'Date': a.date,
                'Check In': a.checkIn,
                'Check Out': a.checkOut || '-',
                'Hours': a.hours || '-'
            };
        }
    });
    
    const allSheetName = currentLanguage === 'ar' ? 'الكل' : 'All';
    sheets.push({ name: allSheetName, data: allRecords });
    
    const filename = currentLanguage === 'ar' ? `حضور_اليوم_${today}` : `Attendance_${today}`;
    exportToExcel(sheets, filename);
}

function exportDateRangeAttendance() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        alert(t('error'));
        return;
    }
    
    const filtered = attendance.filter(a => a.date >= startDate && a.date <= endDate);
    
    const data = filtered.map(a => {
        const worker = workers.find(w => w.id === a.workerId);
        const unknownText = currentLanguage === 'ar' ? 'غير معروف' : 'Unknown';
        
        if (currentLanguage === 'ar') {
            return {
                'التاريخ': a.date,
                'اسم العامل': worker ? worker.name : unknownText,
                'رقم العامل': a.workerId,
                'نوع العامل': worker ? worker.type : '-',
                'وقت الدخول': a.checkIn,
                'وقت الخروج': a.checkOut || '-',
                'ساعات العمل': a.hours || '-'
            };
        } else {
            return {
                'Date': a.date,
                'Worker Name': worker ? worker.name : unknownText,
                'Worker ID': a.workerId,
                'Type': worker ? worker.type : '-',
                'Check In': a.checkIn,
                'Check Out': a.checkOut || '-',
                'Hours': a.hours || '-'
            };
        }
    });
    
    const sheetName = currentLanguage === 'ar' ? 'السجلات' : 'Records';
    const filename = currentLanguage === 'ar' ? 
        `تقرير_من_${startDate}_الى_${endDate}` :
        `Report_${startDate}_to_${endDate}`;
    
    exportToExcel([{ name: sheetName, data }], filename);
}

function exportAllAttendance() {
    const data = attendance.map(a => {
        const worker = workers.find(w => w.id === a.workerId);
        const unknownText = currentLanguage === 'ar' ? 'غير معروف' : 'Unknown';
        
        if (currentLanguage === 'ar') {
            return {
                'التاريخ': a.date,
                'اسم العامل': worker ? worker.name : unknownText,
                'رقم العامل': a.workerId,
                'نوع العامل': worker ? worker.type : '-',
                'وقت الدخول': a.checkIn,
                'وقت الخروج': a.checkOut || '-',
                'ساعات العمل': a.hours || '-'
            };
        } else {
            return {
                'Date': a.date,
                'Worker Name': worker ? worker.name : unknownText,
                'Worker ID': a.workerId,
                'Type': worker ? worker.type : '-',
                'Check In': a.checkIn,
                'Check Out': a.checkOut || '-',
                'Hours': a.hours || '-'
            };
        }
    });
    
    const sheetName = currentLanguage === 'ar' ? 'كل السجلات' : 'All Records';
    const filename = currentLanguage === 'ar' ? 'جميع_سجلات_الحضور' : 'All_Attendance_Records';
    
    exportToExcel([{ name: sheetName, data }], filename);
}

function exportToExcel(sheets, filename) {
    const wb = XLSX.utils.book_new();
    
    sheets.forEach(sheet => {
        const ws = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

function showConfirm(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmButton').onclick = callback;
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', function() {
    const editWorkerFilter = document.getElementById('editWorkerFilter');
    editWorkerFilter.innerHTML = '<option value="">'+
        (currentLanguage === 'ar' ? 'كل العمال' : 'All Workers') +'</option>' + 
        workers.map(w => `<option value="${w.id}">${w.name} (${w.id})</option>`).join('');
});