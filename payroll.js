let payrollExportData = []; // لتخزين بيانات مسير الرواتب الجاهزة للتصدير
// بداية الإضافة: أضف هذا الكود في ملف app.js
function formatTimeAMPM(timeString) {
    if (!timeString) return 'غير محدد';
    const [hours, minutes] = timeString.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'م' : 'ص';
    h = h % 12;
    h = h ? h : 12; // الساعة 0 أو 12 تبقى 12
    const m = minutes.padStart(2, '0');
    return `${h}:${m} ${ampm}`;
}
// نهاية الإضافة

async function exportPayrollDataToCsv(data, filename) {
    if (data.length === 0) {
        return alert('لا توجد بيانات للتصدير.');
    }

    // 1. إنشاء مصنف العمل وورقة العمل
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('مسير رواتب', {
        views: [{ rightToLeft: true }] // جعل الورقة تبدأ من اليمين لليسار
    });

    // 2. إضافة الشعار كخلفية شفافة (علامة مائية)
    // !! تم تحديث رابط الشعار هنا !!
    const logoUrl = 'https://i.imgur.com/WTIY72K.png';

    try {
        const response = await fetch(logoUrl);
        const imageBuffer = await response.arrayBuffer();
        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'png',
        });

        worksheet.addBackgroundImage(imageId);
    } catch (e) {
        console.error("لا يمكن تحميل الشعار. تأكد من أن الرابط صحيح ومتاح للعامة.", e);
    }

    // 3. إعدادات التنسيق المتقدمة
    const headerStyle = {
        font: { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'medium', color: { argb: 'FF000000' } } }
    };
    const cellStyle = { font: { name: 'Arial', size: 10 }, alignment: { horizontal: 'center', vertical: 'middle' } };
    const moneyStyle = { ...cellStyle, numFmt: '#,##0.00 "ر.س"' };
    const totalStyle = { ...moneyStyle, font: { ...cellStyle.font, bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } } };

    // 4. تعديل البيانات ومعالجة نوع الموظف
    const processedData = data.map(row => {
        const employeeType = row['المسمى الوظيفي'] === 'حارس بديل' ? 'بديل' : 'اساسي';
        return { ...row, "حالة الموظف": employeeType };
    });

    // 5. تحديد وترتيب الأعمدة
    worksheet.columns = Object.keys(processedData[0]).map(key => ({
        header: key,
        key: key,
        width: 18,
        style: cellStyle
    }));

    // 6. إضافة البيانات وتطبيق التنسيقات
    worksheet.addRows(processedData);

    const nonMoneyColumns = ['ايام العمل', 'ساعات العمل', 'راحة', 'ايام الغياب'];

    worksheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
        row.height = 25;
        row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
            if (rowNumber === 1) {
                cell.style = headerStyle;
                return;
            }

            const key = worksheet.getColumn(colNumber).key;
            if (key === 'اجمالي الراتب' || key === 'مجموع الاستقطاعات' || key === 'الصافي') {
                cell.style = totalStyle;
            }
            
            if (typeof cell.value === 'number' && !nonMoneyColumns.includes(key)) {
                cell.numFmt = moneyStyle.numFmt;
            }
        });
    });

    // 7. إنشاء الملف وتنزيله
    workbook.xlsx.writeBuffer().then(function(buffer) {
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename.replace('.csv', '.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
// ========= نهاية الاستبدال الكامل للدالة =========
// بداية الاستبدال

// --- دوال خاصة بلوحة تحكم مدير النظام ---

// الدالة الرئيسية لتحميل وعرض بيانات لوحة التحكم
async function loadAdminDashboardPage() {
    // إضافة حاوية جديدة للجدول لتجنب استبدال الفلاتر
    if (!document.getElementById('admin-audit-log-table-container')) {
        document.getElementById('admin-audit-log').innerHTML += '<div id="admin-audit-log-table-container"></div>';
        document.getElementById('admin-feedback').innerHTML += '<div id="admin-feedback-container"></div>';
        document.getElementById('admin-error-log').innerHTML += '<div id="admin-error-log-table-container"></div>';
    }

    // تحميل بيانات التبويب الأول (سجل الأحداث) بشكل افتراضي
    loadAuditLogs();

    // إضافة مستمع للنقرات على زر البحث والتبويبات
    const adminPage = document.getElementById('page-admin-dashboard');
    adminPage.addEventListener('click', (event) => {
        event.preventDefault();
        const target = event.target;
        
        // زر البحث
        if (target.closest('#audit-search-btn')) {
            const filters = {
                searchTerm: document.getElementById('audit-search-input').value,
                actionType: document.getElementById('audit-action-filter').value,
                role: document.getElementById('audit-role-filter').value
            };
            loadAuditLogs(filters);
        }

        // التبويبات
        const tabLink = target.closest('.tab-link');
        if (tabLink) {
            adminPage.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
            tabLink.classList.add('active');
            
            const targetTabId = tabLink.dataset.tab;
            adminPage.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(targetTabId)?.classList.add('active');

            if (targetTabId === 'admin-audit-log') loadAuditLogs();
            if (targetTabId === 'admin-feedback') loadFeedback();
            if (targetTabId === 'admin-error-log') loadErrorLogs();
        }
        
        // زر تحديث حالة الشكوى
        const updateFeedbackBtn = target.closest('.update-feedback-status');
        if(updateFeedbackBtn){
             // ... (هذا الكود موجود عندك بالفعل، اتركه كما هو)
        }
    });// الدالة الكاملة والنهائية لتحميل وعرض بيانات لوحة التحكم
async function loadAdminDashboardPage() {
    // تحميل بيانات التبويب الأول (سجل الأحداث) بشكل افتراضي
    loadAuditLogs();

    const adminPage = document.getElementById('page-admin-dashboard');
    
    // استخدام متغير للتأكد من أن مستمع الأوامر يضاف مرة واحدة فقط
    if (!adminPage.dataset.listenerAttached) {
        adminPage.addEventListener('click', async (event) => {
            const target = event.target;
            
            // زر البحث في سجل الأحداث
            if (target.closest('#audit-search-btn')) {
                event.preventDefault();
                const filters = {
                    searchTerm: document.getElementById('audit-search-input').value,
                    actionType: document.getElementById('audit-action-filter').value,
                    role: document.getElementById('audit-role-filter').value
                };
                loadAuditLogs(filters);
            }

            // التبويبات
            const tabLink = target.closest('.tab-link');
            if (tabLink) {
                event.preventDefault();
                adminPage.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
                tabLink.classList.add('active');
                
                const targetTabId = tabLink.dataset.tab;
                adminPage.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(targetTabId)?.classList.add('active');

                if (targetTabId === 'admin-audit-log') loadAuditLogs();
                if (targetTabId === 'admin-feedback') loadFeedback();
                if (targetTabId === 'admin-error-log') loadErrorLogs();
            }
            
            // --- هنا منطق تحديث حالة الشكوى ---
            const updateFeedbackBtn = target.closest('.update-feedback-status');
            if (updateFeedbackBtn) {
                event.preventDefault();
                const feedbackId = updateFeedbackBtn.dataset.id;
                const newStatus = updateFeedbackBtn.dataset.status;

                if (confirm(`هل أنت متأكد من تغيير حالة الرسالة إلى "${newStatus}"؟`)) {
                    updateFeedbackBtn.disabled = true;
                    updateFeedbackBtn.textContent = 'جاري...';
                    
                    const { error } = await supabaseClient
                        .from('feedback')
                        .update({ status: newStatus })
                        .eq('id', feedbackId);

                    if (error) {
                        alert('حدث خطأ أثناء تحديث الحالة.');
                        console.error('Update feedback error:', error);
                    } else {
                        alert('تم تحديث الحالة بنجاح.');
                        loadFeedback(); // إعادة تحميل قائمة الشكاوى لتحديث الواجهة
                    }
                }
            }
        });

        // وضع علامة بأن المستمع قد تم إضافته
        adminPage.dataset.listenerAttached = 'true';
    }
}
}

// دالة لجلب وعرض الاحتياجات التي لم يتم تغطيتها
async function loadUncoveredNeeds() {
    const container = document.getElementById('uncovered-needs-list');
    if (!container || !currentUser) return;
    container.innerHTML = '<p style="text-align: center;">جاري تحليل الجداول...</p>';

    try {
async function generatePayroll() {
    const resultsContainer = document.getElementById('payroll-results-container');
    const startDateString = document.getElementById('payroll-start-date').value;
    const endDateString = document.getElementById('payroll-end-date').value;
    
    // --- بداية الإضافة: هنا تم إضافة الأسطر الثلاثة الناقصة ---
    const regionVal = document.getElementById('payroll-region-filter').value;
    const projectVal = document.getElementById('payroll-project').value;
    const locationVal = document.getElementById('payroll-location').value;
    // --- نهاية الإضافة ---

    if (!startDateString || !endDateString) return alert('الرجاء تحديد تاريخ البداية والنهاية.');
    
    resultsContainer.innerHTML = '<p style="text-align: center;">جاري جلب البيانات وحساب الرواتب...</p>';
    payrollExportData = [];

    try {
        const startDate = new Date(startDateString);
        const endDate = new Date(endDateString);
        endDate.setHours(23, 59, 59, 999);


        let query = supabaseClient
            .from('users')
            .select(`*, job_vacancies!users_vacancy_id_fkey(*, contracts!inner(*))`)
            .not('employment_status', 'in', '("تغطية", "مستقيل")');
        
        if (regionVal) {
            query = query.eq('region', regionVal);
        }
        if (projectVal) {
            // ملاحظة: بما أن المشروع قد يكون قائمة، نستخدم `cs` (contains)
            query = query.filter('project', 'cs', `{${projectVal}}`);
        }
                payrollExportData.push({
                    "اسم الموظف": emp.name,
                    "رقم الهوية": emp.id_number,
                    "حالة الموظف": emp.employment_status,
                    "المشروع": projectName,
                    "ايام العمل": actualWorkDays,
                    "ساعات العمل": totalWorkHours,
                    "قيمة الساعة": hourlyRate,
                    "قيمة اليومية": dailyRate,
                    "الراتب الاساسي": vacancy.base_salary,
                    "بدل السكن": vacancy.housing_allowance,
                    "بدل نقل": vacancy.transport_allowance,
                    "بدلات اخرى": vacancy.other_allowances,
                    "اجمالي الراتب": fullMonthSalary,
                    "راحة": restDays,
                    "عمل اضافي": employeeOvertimeTotal,
                    "المستحق": grossSalary + employeeOvertimeTotal,
                    "استقطاع تأمينات": insuranceDeduction,
                    "خصم الزي": uniformDeduction,
        const tableHeaders = payrollExportData.length > 0 ? Object.keys(payrollExportData[0]).map(key => `<th>${key}</th>`).join('') : '';
        const tableRowsHtml = payrollExportData.map(row => {
            let rowHtml = '<tr>';
            for (const key in row) {
                let value = row[key];
                if (typeof value === 'number' && !nonCurrencyColumns.includes(key)) {
                    value = `${value.toFixed(2)} ر.س`;
                }
                if (row['حالة الموظف'] === 'بديل راحة' && (key === 'قيمة الساعة' || key === 'قيمة اليومية')) {
                    value = 'متغيرة';
                }
                rowHtml += `<td>${value || '-'}</td>`;
            }
            rowHtml += '</tr>';
            return rowHtml;
        }).join('');

        resultsContainer.innerHTML = `<div class="table-header"><h3>مسير رواتب من ${startDateString} إلى ${endDateString}</h3><button id="export-payroll-btn" class="btn btn-success"><i class="ph-bold ph-file-xls"></i> تصدير إلى Excel</button></div><table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRowsHtml}</tbody></table>`;

        await supabaseClient.from('audit_logs').insert({ user_name: currentUser.name, action_type: 'توليد مسير الرواتب', details: { startDate: startDateString, endDate: endDateString, employeeCount: payrollExportData.length } });

    } catch (err) {
        resultsContainer.innerHTML = `<p style="color: red;">حدث خطأ: ${err.message}</p>`;
        console.error("Payroll Error:", err);
    }
}
// ========= نهاية الاستبدال الكامل لدالة generatePayroll =========

async function exportPayrollToExcel(data, filename) {
    if (data.length === 0) return alert('لا توجد بيانات للتصدير.');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('مسير رواتب', {
        views: [{ rightToLeft: true }]
    });

    // --- تم حذف كود إضافة الشعار من هنا ---

    const headerStyle = {
        font: { name: 'Cairo', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thin', color: { argb: 'FF000000' } } }
    };
    const cellStyle = { font: { name: 'Cairo', size: 10 }, alignment: { horizontal: 'center', vertical: 'middle' } };
    const moneyStyle = { ...cellStyle, numFmt: '#,##0.00 "ر.س"' };
    const totalStyle = { ...moneyStyle, font: { ...cellStyle.font, bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } } };

    worksheet.columns = Object.keys(data[0]).map(key => ({
        header: key, key: key, width: 18, style: cellStyle
    }));

    worksheet.addRows(data);

    // --- بداية التعديل: إضافة الأعمدة الجديدة هنا ---
    const nonMoneyColumns = ['ايام العمل', 'ساعات العمل', 'راحة', 'ايام الغياب', 'استئذان', 'انسحاب'];
    // --- نهاية التعديل ---

    worksheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
        row.height = 25;
        row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
            if (rowNumber === 1) {
                cell.style = headerStyle;
                return;
            }
            const key = worksheet.getColumn(colNumber).key;
            if (['اجمالي الراتب', 'مجموع الاستقطاعات', 'الصافي'].includes(key)) {
                cell.style = totalStyle;
            }
            if (typeof cell.value === 'number' && !nonMoneyColumns.includes(key)) {
                cell.numFmt = moneyStyle.numFmt;
            }
        });
    });

    workbook.xlsx.writeBuffer().then(function(buffer) {
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename.replace('.csv', '.xlsx');
        link.click();
    });
}


// --- دالة رئيسية لإدارة تبويبات صفحة المالية ---
async function loadFinanceCoveragePage() {
    loadFinancePendingPage(); // تحميل التبويب الأول افتراضياً

    const financePage = document.getElementById('page-finance-coverage');
    if (financePage && !financePage.dataset.listenerAttached) {
        financePage.querySelector('.tabs').addEventListener('click', (event) => {
            event.preventDefault();
            const tabLink = event.target.closest('.tab-link');
            if (!tabLink) return;

            financePage.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
            tabLink.classList.add('active');
            financePage.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabLink.dataset.tab)?.classList.add('active');

            if (tabLink.dataset.tab === 'finance-pending-tab') {
                loadFinancePendingPage();
            } else if (tabLink.dataset.tab === 'finance-archive-tab') {
                loadFinanceArchivePage();
            }
        });
        financePage.dataset.listenerAttached = 'true';
    }
}

// --- دالة لجلب أرشيف التحويلات المالية ---
async function loadFinanceArchivePage() {
    const container = document.getElementById('finance-archive-container');
    container.innerHTML = '<p style="text-align: center;">جاري تحميل الأرشيف...</p>';
    
    const { data, error } = await supabaseClient
        .from('coverage_payments')
        .select('*')
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

    if (error) { container.innerHTML = '<p style="color:red">خطأ في جلب البيانات.</p>'; return; }
    if (data.length === 0) { container.innerHTML = '<p>لا يوجد دفعات مؤرشفة حالياً.</p>'; return; }

    container.innerHTML = `
        <div class="table-container"><table>
            <thead><tr><th>اسم الحارس</th><th>المبلغ</th><th>تاريخ الوردية</th><th>الآيبان</th><th>الحالة</th></tr></thead>
            <tbody>
                ${data.map(p => `
                    <tr>
                        <td>${p.covering_guard_name}</td>
                        <td>${p.payment_amount} ر.س</td>
                        <td>${p.shift_date}</td>
                        <td>${p.applicant_iban}</td>
                        <td><span class="status active">تم الدفع</span></td>
                    </tr>`).join('')}
            </tbody>
        </table></div>`;
}

// --- دالة لجلب المستحقات بانتظار الدفع ---
async function loadFinancePendingPage() {
    const container = document.getElementById('finance-pending-container');
    container.innerHTML = '<p style="text-align: center;">جاري تحميل المستحقات...</p>';
    
    const { data, error } = await supabaseClient
        .from('coverage_payments')
        .select('*')
        .eq('status', 'pending_finance_transfer')
        .order('created_at', { ascending: false });

    if (error) { container.innerHTML = '<p style="color:red">خطأ في جلب البيانات.</p>'; return; }
    if (data.length === 0) { container.innerHTML = '<p>لا توجد مستحقات بانتظار التحويل حالياً.</p>'; return; }
    
    pendingPaymentsData = data;
    container.innerHTML = `
        <div class="table-container"><table>
            <thead><tr><th>اسم الحارس</th><th>المبلغ</th><th>الآيبان</th><th>البنك</th><th>إجراء</th></tr></thead>
            <tbody>
                ${data.map(p => `
                    <tr>
                        <td>${p.covering_guard_name}</td>
                        <td>${p.payment_amount} ر.س</td>
                        <td>${p.applicant_iban}</td>
                        <td>${p.applicant_bank_name || 'غير محدد'}</td>
                        <td>
                            <button class="btn btn-success finalize-payment-btn" data-payment-id="${p.id}">
                                <i class="ph-bold ph-check-circle"></i> تم التحويل والأرشفة
                            </button>
                        </td>
                    </tr>`).join('')}
            </tbody>
        </table></div>`;
}

// --- دالة تحميل تبويب "أرشيف التحويلات" ---
async function loadPaymentArchive() {
    const container = document.getElementById('finance-archive-container');
    container.innerHTML = '<p style="text-align: center;">جاري تحميل الأرشيف...</p>';

    const { data: archive, error } = await supabaseClient
        .from('payment_archive')
        .select('*, users:paid_by_user_id(name)')
        .order('paid_at', { ascending: false });
        
    if (error) { container.innerHTML = '<p style="color:red;">حدث خطأ.</p>'; return console.error(error); }
    if (archive.length === 0) { container.innerHTML = '<p style="text-align: center;">الأرشيف فارغ حالياً.</p>'; return; }

    const tableHeaders = "<th>تاريخ التحويل</th><th>اسم المستلم</th><th>المبلغ</th><th>الآيبان</th><th>تاريخ الوردية</th><th>تم التحويل بواسطة</th>";
    const tableRows = archive.map(a => `
        <tr>
            <td>${new Date(a.paid_at).toLocaleString('ar-SA')}</td>
            <td>${a.covering_guard_name}</td>
            <td>${a.payment_amount} ر.س</td>
            <td>${a.applicant_iban}</td>
            <td>${new Date(a.shift_date).toLocaleDateString('ar-SA')}</td>
            <td>${a.users.name}</td>
        </tr>
    `).join('');
    container.innerHTML = `<table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>`;
}

// --- دالة توليد مسير الحراس الغائبين للتدقيق ---
async function generateAbsenteeReport() {
    const modal = document.getElementById('absentee-report-modal');
    const body = document.getElementById('absentee-report-body');
    modal.classList.remove('hidden');
    body.innerHTML = '<p style="text-align: center;">جاري تحليل البيانات...</p>';
    absenteeReportData = []; // إفراغ البيانات القديمة

    try {
        const { data: payments, error: e1 } = await supabaseClient
            .from('coverage_payments')
            .select('absent_guard_name, shift_date')
            .eq('status', 'pending_payment');
        if (e1) throw e1;

        if (payments.length === 0) {
            body.innerHTML = '<p style="text-align: center;">لا توجد تغطيات معتمدة لتوليد تقرير لها.</p>';
            return;
        }

        const absentGuardNames = [...new Set(payments.map(p => p.absent_guard_name))].filter(name => name);
        if (absentGuardNames.length === 0) {
            body.innerHTML = '<p style="text-align: center;">لا يوجد أسماء حراس غائبين مسجلة في التغطيات الحالية.</p>';
            return;
        }

        const { data: absentGuards, error: e2 } = await supabaseClient
            .from('users')
            .select('*, job_vacancies!users_vacancy_id_fkey(*)')
            .in('name', absentGuardNames);
        if (e2) throw e2;

        let reportHtml = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>اسم الحارس الغائب</th>
                            <th>تاريخ الغياب</th>
                            <th>قيمة اليومية</th>
                            <th>خصم الغياب (يوميتين)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        let foundAbsence = false;
        payments.forEach(payment => {
            const guard = absentGuards.find(g => g.name === payment.absent_guard_name);
            if (guard && guard.job_vacancies) {
                foundAbsence = true;
                const vacancy = guard.job_vacancies;
                const fullSalary = (vacancy.base_salary || 0) + (vacancy.housing_allowance || 0) + (vacancy.transport_allowance || 0) + (vacancy.other_allowances || 0);
                const dailyRate = fullSalary / 30;
                const absenceDeduction = dailyRate * 2;
                
                reportHtml += `
                    <tr>
                        <td>${guard.name}</td>
                        <td>${new Date(payment.shift_date).toLocaleDateString('ar-SA')}</td>
                        <td>${dailyRate.toFixed(2)} ر.س</td>
                        <td style="color: var(--denied-color); font-weight: bold;">${absenceDeduction.toFixed(2)} ر.س</td>
                    </tr>
                `;

                // تجهيز بيانات التصدير بنفس هيكل المسير الكامل
                absenteeReportData.push({
                    "اسم الموظف": guard.name, "رقم الهوية": guard.id_number, "حالة الموظف": guard.employment_status,
                    "الراتب الاساسي": 0, "بدل السكن": 0, "بدل نقل": 0, "بدلات اخرى": 0,
                    "اجمالي الراتب": 0, "بدل اجازة": 0, "راحة": 0, "عمل اضافي": 0, "المستحق": 0,
                    "ايام الغياب": 1, "استقطاع تأمينات": 0, "خصم الزي": 0, "خصم الغياب": absenceDeduction,
        body.innerHTML = foundAbsence ? reportHtml : '<p style="text-align: center;">لم يتم العثور على بيانات الرواتب للحراس الغائبين.</p>';

    } catch (error) {
        body.innerHTML = `<p style="color:red;">حدث خطأ أثناء توليد التقرير: ${error.message}</p>`;
    }
}

// --- دالة تحميل تبويب "أرشيف التحويلات" ---
async function loadPaymentArchive() {
    const container = document.getElementById('finance-archive-container');
    container.innerHTML = '<p style="text-align: center;">جاري تحميل الأرشيف...</p>';

    const { data: archive, error } = await supabaseClient
        .from('payment_archive')
        .select('*, users:paid_by_user_id(name)')
        .order('paid_at', { ascending: false });
        
    if (error) { container.innerHTML = '<p style="color:red;">حدث خطأ.</p>'; return console.error(error); }
    if (archive.length === 0) { container.innerHTML = '<p style="text-align: center;">الأرشيف فارغ حالياً.</p>'; return; }

    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>تاريخ التحويل</th>
                        <th>اسم المستلم</th>
                        <th>المبلغ</th>
                        <th>الآيبان</th>
                        <th>تاريخ الوردية</th>
                        <th>تم التحويل بواسطة</th>
                    </tr>
                </thead>
                <tbody>
                    ${archive.map(a => `
                        <tr>
                            <td>${new Date(a.paid_at).toLocaleString('ar-SA')}</td>
                            <td>${a.covering_guard_name}</td>
                            <td>${a.payment_amount} ر.س</td>
                            <td>${a.applicant_iban}</td>
                            <td>${new Date(a.shift_date).toLocaleDateString('ar-SA')}</td>
                            <td>${a.users.name}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// --- دالة مطورة لصفحة التوظيف ---
async function loadHolidaysPage() {
    const container = document.getElementById('holidays-list-container');
    container.innerHTML = '<p style="text-align: center;">جاري تحميل...</p>';

    const { data: holidays, error } = await supabaseClient
        .from('official_holidays')
        .select('*')
        .order('holiday_date', { ascending: false });

    if (error) {
        container.innerHTML = '<p style="color:red;">حدث خطأ في جلب العطلات.</p>';
        return console.error(error);
    }
    if (holidays.length === 0) {
        container.innerHTML = '<p style="text-align: center;">لا توجد عطلات مسجلة حالياً.</p>';
        return;
    }

    container.innerHTML = holidays.map(holiday => `
        if (targetPageId === 'page-payroll') {
            document.getElementById('payroll-results-container').innerHTML = '<p style="text-align: center;">الرجاء اختيار الشهر والضغط على "توليد المسير" لعرض البيانات.</p>';
        }
        if (targetPageId === 'page-hr-data-entry') {
            document.getElementById('import-results-container').innerHTML = '';
        }

        if (targetPageId === 'page-my-requests') {
            loadMyRequestsPage();
            requestsSubscription = supabaseClient.channel('public:employee_requests:my_requests')
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'employee_requests',
                    filter: `user_id=eq.${currentUser.id}`
                }, payload => {
                    loadMyRequestsPage();
                })
                .subscribe();
        }

        if (targetPageId === 'page-permission-requests') {
            loadPermissionRequests();
            requestsSubscription = supabaseClient.channel('public:employee_requests:all_permissions')
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'employee_requests',
                    filter: 'request_type=eq.permission'
                }, payload => {
                    loadPermissionRequests();
                })
                .subscribe();
        }
    });
});
// ==========================================================
// ===    نهاية الاستبدال الكامل لمنطق التنقل بين الصفحات    ===
// ==========================================================

// ===================== نهاية الاستبدال =====================



// بداية الاستبدال
// منطق الملء التلقائي الذكي لجميع النماذج (شواغر وموظفين)
document.addEventListener('change', async (event) => {

// --- منطق إظهار حقول الصلاحيات للمدراء والمشرفين ---
    if (event.target.id === 'employee-role') {
        const role = event.target.value;
        const assignmentGroup = document.getElementById('manager-assignment-group');
        const regionGroup = document.getElementById('assign-region-group');
        const projectGroup = document.getElementById('assign-project-group');

        assignmentGroup.classList.add('hidden');
        regionGroup.classList.add('hidden');
        projectGroup.classList.add('hidden');

        if (role === 'ادارة العمليات') {
            assignmentGroup.classList.remove('hidden');
            regionGroup.classList.remove('hidden');
        } else if (role === 'مشرف') {
            assignmentGroup.classList.remove('hidden');
            projectGroup.classList.remove('hidden');
            
            // --- هنا تم التصحيح الكامل ---
            const projectContainer = document.getElementById('assign-project-checkbox-container');
            projectContainer.innerHTML = '<p>جاري تحميل المشاريع...</p>'; // رسالة تحميل مؤقتة
            
            const { data: contracts } = await supabaseClient.from('contracts').select('company_name');
            
            if (contracts) {
                const projectNames = [...new Set(contracts.map(c => c.company_name))];
                // بناء مربعات الاختيار داخل الحاوية الصحيحة
                projectContainer.innerHTML = `
                    <div class="checkbox-grid">
                        ${projectNames.map(p => `<label><input type="checkbox" value="${p}"> ${p}</label>`).join('')}
                    </div>
                `;
            } else {
                projectContainer.innerHTML = '<p>لم يتم العثور على مشاريع.</p>';
            }
            // --- نهاية التصحيح الكامل ---
        }
    }

// --- عند تغيير الشاغر في نافذة تعديل الموظف (النسخة المصححة) ---
    if (event.target.id === 'employee-vacancy') {
        const vacancyId = event.target.value;
        
        // الوصول إلى كل الحقول التي سنقوم بتحديثها
        const regionInput = document.getElementById('employee-region');
        const cityInput = document.getElementById('employee-city');
        const projectDisplay = document.getElementById('employee-project-display');
        exportPayrollToExcel(formattedData, filename); // استخدام نفس دالة التصدير
    } else {
        alert('لا توجد بيانات لتصديرها.');
    }
}

// نهاية الإضافة        



// بداية الإضافة

// --- عند الضغط على "تصدير تقرير الغياب" ---
const exportAbsenteeBtn = event.target.closest('#export-absentee-report-btn');
if (exportAbsenteeBtn) {
    if (absenteeReportData && absenteeReportData.length > 0) {
        const filename = `تقرير-خصم-الغياب-${new Date().toISOString().split('T')[0]}.xlsx`;
        exportPayrollToExcel(absenteeReportData, filename);
    } else {
        alert('لا توجد بيانات لتصديرها.');
    }
}

// نهاية الإضافة


// --- عند الضغط على "اعتماد التغطية" ---
    const approveCoverageBtn = event.target.closest('.approve-coverage-completion-btn');
    if (approveCoverageBtn) {
        const shiftId = approveCoverageBtn.dataset.shiftId;
        const applicantId = approveCoverageBtn.dataset.applicantId;

        if (!confirm('هل أنت متأكد من اعتماد إتمام هذه التغطية؟ سيتم إرسالها للمالية.')) return;
        
        try {
            const { data: applicant, error: e1 } = await supabaseClient.from('coverage_applicants').select('*, coverage_shifts(*)').eq('id', applicantId).single();
            if (e1 || !applicant) throw new Error('لم يتم العثور على بيانات المتقدم.');

            if (applicant.applicant_user_id) { // إذا كان الموظف رسمي
                // تسجيلها كعمل إضافي
                await supabaseClient.from('overtime_records').insert({
                    employee_id: applicant.applicant_user_id,
                    coverage_shift_id: shiftId,
                    overtime_pay: applicant.coverage_shifts.coverage_pay,
                    approved_by: currentUser.id
                });
            } else { // إذا كان متقدم خارجي
                // إرسالها لجدول المالية
                await supabaseClient.from('coverage_payments').insert({
                    coverage_shift_id: shiftId,
                    applicant_id: applicantId,
                    covering_guard_name: applicant.full_name,
                    payment_amount: applicant.coverage_shifts.coverage_pay,
                    applicant_iban: applicant.iban,
                    applicant_bank_name: 'N/A', // يمكن إضافته لاحقاً
                    shift_date: new Date(applicant.coverage_shifts.created_at).toISOString().split('T')[0],
                    notes: `تغطية لـ: ${applicant.coverage_shifts.reason}`
                });
            }

            // إغلاق الوردية نهائياً
            await supabaseClient.from('coverage_shifts').update({ status: 'completed' }).eq('id', shiftId);
            alert('تم اعتماد التغطية بنجاح.');
            loadCoveragePage();

        } catch (error) {
            alert('حدث خطأ: ' + error.message);
        }
    }

    // --- عند الضغط على "استبعاد" ---
    const rejectCoverageBtn = event.target.closest('.reject-coverage-assignment-btn');
    if (rejectCoverageBtn) {
        const shiftId = rejectCoverageBtn.dataset.shiftId;
        const applicantId = rejectCoverageBtn.dataset.applicantId;

        const reason = prompt('الرجاء كتابة سبب الاستبعاد:');
        if (!reason) return;

        try {
            // إعادة فتح الوردية للتقديم من جديد
            await supabaseClient.from('coverage_shifts').update({ status: 'open' }).eq('id', shiftId);
            // رفض المتقدم الحالي
            await supabaseClient.from('coverage_applicants').update({ status: 'rejected', rejection_reason: `تم الاستبعاد بواسطة العمليات: ${reason}` }).eq('id', applicantId);

            alert('تم استبعاد الموظف وإعادة فتح التغطية.');
            loadCoveragePage();

        } catch (error) {
            alert('حدث خطأ: ' + error.message);
        }
    }


// --- منطق تبويبات صفحة المالية ---
    const financeTab = event.target.closest('#page-finance-coverage .tab-link');
    if (financeTab) {
        event.preventDefault();
        const targetTabId = financeTab.dataset.tab;
        financeTab.parentElement.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#page-finance-coverage .tab-content').forEach(c => c.classList.remove('active'));
        financeTab.classList.add('active');
        document.getElementById(targetTabId).classList.add('active');
        
        if (targetTabId === 'finance-pending-tab') loadPendingPayments();
        if (targetTabId === 'finance-archive-tab') loadPaymentArchive();
    }

    // --- عند الضغط على زر "تم التحويل" ---
    const markAsPaidBtn = event.target.closest('.mark-as-paid-btn');
    if (markAsPaidBtn) {
        const paymentId = markAsPaidBtn.dataset.paymentId;
        const applicantId = markAsPaidBtn.dataset.applicantId;

        if (!confirm('هل أنت متأكد؟ سيتم نقل هذا السجل للأرشيف وحذف حساب الموظف المؤقت.')) return;
        markAsPaidBtn.disabled = true;
        markAsPaidBtn.textContent = 'جاري...';

        try {
            const { data: payment, error: e1 } = await supabaseClient.from('coverage_payments').select('*').eq('id', paymentId).single();
            if (e1 || !payment) throw new Error('لم يتم العثور على سجل الدفعة.');
            
            await supabaseClient.from('payment_archive').insert({
                original_payment_id: payment.id,
                covering_guard_name: payment.covering_guard_name,
                payment_amount: payment.payment_amount,
                applicant_iban: payment.applicant_iban,
                shift_date: payment.shift_date,
                paid_by_user_id: currentUser.id
            });

            await supabaseClient.from('coverage_payments').delete().eq('id', paymentId);

            if (applicantId && applicantId !== 'null') {
                const { data: applicant } = await supabaseClient.from('coverage_applicants').select('applicant_user_id').eq('id', applicantId).single();
                if (applicant && applicant.applicant_user_id) {
                    await supabaseClient.functions.invoke('delete-employee-by-id', { body: { user_id: applicant.applicant_user_id } });
                }
            }

            alert('تم تسجيل العملية بنجاح.');
            loadPendingPayments();

        } catch (error) {
            alert('حدث خطأ: ' + error.message);
        } finally {
            markAsPaidBtn.disabled = false;
            markAsPaidBtn.textContent = 'تم التحويل';
        }
    }

    // --- عند الضغط على "توليد مسير الحراس الغائبين" ---
    const generateAbsenteeBtn = event.target.closest('#generate-absentee-report-btn');
    if (generateAbsenteeBtn) {
        generateAbsenteeReport(); // استدعاء الدالة الجديدة
    }
    
// --- عند الضغط على "عرض تفاصيل" متقدم للتغطية ---
    const viewCoverageApplicantBtn = event.target.closest('.view-coverage-applicant-btn');
    if (viewCoverageApplicantBtn) {
        const applicationId = viewCoverageApplicantBtn.dataset.appid;
        const modal = document.getElementById('applicant-details-modal');
        const body = document.getElementById('applicant-details-body');
        
        modal.classList.remove('hidden');
        body.innerHTML = '<p style="text-align: center;">جاري تحميل البيانات...</p>';

        try {
            const { data: application, error } = await supabaseClient
                .from('coverage_applicants')
                .select('*')
                .eq('id', applicationId)
                .single();
            if (error || !application) throw new Error('خطأ في جلب بيانات المتقدم.');

            let idPhotoUrl = "https://placehold.co/400x250/e2e8f0/a0aec0?text=لا+يوجد+مرفق";
            let ibanCertUrl = "https://placehold.co/400x250/e2e8f0/a0aec0?text=لا+يوجد+مرفق";

            if (application.id_photo_url && application.iban_certificate_url) {
                const { data: signedUrls, error: urlError } = await supabaseClient
                    .storage.from('job-applications').createSignedUrls([application.id_photo_url, application.iban_certificate_url], 300);
                if (!urlError) {
                    idPhotoUrl = signedUrls.find(u => u.path === application.id_photo_url)?.signedUrl || idPhotoUrl;
                    ibanCertUrl = signedUrls.find(u => u.path === application.iban_certificate_url)?.signedUrl || ibanCertUrl;
                }
            }
            
            body.innerHTML = `
                <div class="contract-display">
                    <h4>بيانات المتقدم</h4>
                    <p><strong>الاسم:</strong> ${application.full_name || ''}</p>
                    <p><strong>رقم الهوية:</strong> ${application.id_number || ''}</p>
                    <p><strong>رقم الجوال:</strong> ${application.phone_number || ''}</p>
                    <p><strong>الآيبان:</strong> ${application.iban || ''}</p>
                    <hr>
                    <h4>المرفقات (اضغط على الصورة للتكبير)</h4>
                    <div class="attachments-grid">
                        <div>
                            <h5>صورة الهوية</h5>
                            <img src="${idPhotoUrl}" alt="صورة الهوية" class="attachment-image viewable-image">
                        </div>
                        <div>
                            <h5>شهادة الآيبان</h5>
                            <img src="${ibanCertUrl}" alt="شهادة الآيبان" class="attachment-image viewable-image">
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            body.innerHTML = `<p style="color:red;">${error.message}</p>`;
        }
    }

// --- عند الضغط على "بدء عملية التعيين" ---
    const startAssignmentBtn = event.target.closest('#start-assignment-btn');
    if (startAssignmentBtn) {
        const selectedShiftItem = document.querySelector('.coverage-shift-item[style*="border-color: var(--accent-color)"]');
        if (!selectedShiftItem) return alert('الرجاء تحديد فرصة تغطية أولاً.');

        const shiftData = JSON.parse(selectedShiftItem.dataset.shiftId);
        document.getElementById('assignment-modal').classList.remove('hidden');
        populateAssignmentModal(shiftData);
    }

if (event.target.id === 'export-payroll-btn') {
    if (payrollExportData && payrollExportData.length > 0) {
        const startDate = document.getElementById('payroll-start-date').value;
        const endDate = document.getElementById('payroll-end-date').value;
        const filename = `مسير رواتب من ${startDate} إلى ${endDate}.xlsx`;
        exportPayrollToExcel(payrollExportData, filename); // استدعاء الدالة الجديدة
    } else {
        alert('لا توجد بيانات لتصديرها. يرجى توليد المسير أولاً.');
    }
}
// نهاية الكود الجديد والمُصحح
// نهاية الإضافة
    // بداية الإضافة
// زر توليد مسير الرواتب
if (event.target.id === 'generate-payroll-btn') {
    generatePayroll();
}
// نهاية الإضافة

// بداية الإضافة

// بداية الاستبدال
// ========= بداية الاستبدال الكامل لمنطق أزرار الطلبات =========
// بداية الاستبدال

const requestActionBtn = event.target.closest('.request-action-button');
if (requestActionBtn) {
    event.stopPropagation();
    const btn = requestActionBtn;
    btn.disabled = true;

    const action = btn.dataset.action;
    const requestId = btn.dataset.requestId;
    const stage = btn.dataset.approvalStage;
    const requestType = btn.dataset.requestType;
    const userId = btn.dataset.userId;
    const vacancyId = btn.dataset.vacancyId;

    try {
        let updateData = {};
        let successMessage = '';
        let notifyHR = false;

        if (action === 'reject') {
            const reason = prompt('الرجاء إدخال سبب الرفض:');
            if (!reason) { btn.disabled = false; return; }
            updateData = { status: 'مرفوض', rejection_reason: reason };
            successMessage = 'تم رفض الطلب بنجاح.';
        } else if (action === 'approve') {
            if (!confirm('هل أنت متأكد من الموافقة على هذا الإجراء؟')) { btn.disabled = false; return; }

            switch (stage) {
                case 'ops_escalate':
                    updateData = { status: 'بانتظار موافقة الموارد البشرية', ops_approver_id: currentUser.id };
                    successMessage = 'تم رفع الطلب للموارد البشرية.';
            <p><strong>الراتب الأساسي:</strong> ${vacancy.base_salary.toLocaleString('ar-SA')} ر.س</p>
            <p><strong>البدلات:</strong> ${(totalSalary - vacancy.base_salary).toLocaleString('ar-SA')} ر.س</p>
            <p><strong>إجمالي الراتب:</strong> ${totalSalary.toLocaleString('ar-SA')} ر.س</p>
        </div>
    `;
    document.getElementById('view-vacancy-details-modal').classList.remove('hidden');
}

    // --- بداية الإضافة: منطق حذف الموظف ---
    const deleteEmployeeBtn = event.target.closest('.delete-employee-btn');
    if (deleteEmployeeBtn) {
        const userId = deleteEmployeeBtn.dataset.id;
        const authUserId = deleteEmployeeBtn.dataset.authId;

        if (confirm('هل أنت متأكد من حذف هذا الموظف بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.')) {
            // تعطيل الزر لمنع الضغطات المتكررة
            deleteEmployeeBtn.disabled = true;
            deleteEmployeeBtn.innerHTML = '<i class="ph-fill ph-spinner-gap animate-spin"></i>';

            try {
                // استدعاء دالة الخادم التي أنشأناها
                const { data, error } = await supabaseClient.functions.invoke('delete-employee', {
                    body: { 
                        user_id: userId,
                        auth_user_id: authUserId
                    },
                });

                if (error || data.error) {
                    throw new Error(error?.message || data.error);
                }

                alert('تم حذف الموظف بنجاح!');
                // إعادة تحميل قائمة الموظفين وقائمة الشواغر لتحديث العدادات
                loadEmployeeTabData();
                loadVacancyTabData(); 

            } catch (err) {
                alert(`حدث خطأ أثناء حذف الموظف: ${err.message}`);
                console.error("Delete employee error:", err);
                // إعادة تفعيل الزر في حالة الخطأ
                deleteEmployeeBtn.disabled = false;
                deleteEmployeeBtn.innerHTML = '<i class="ph-bold ph-trash"></i> حذف';
            }
        }
    }
    // --- نهاية الإضافة ---


    // عند الضغط على "حذف شاغر"
    if (event.target.closest('.delete-vacancy-btn')) {
        const vacancyId = event.target.closest('.delete-vacancy-btn').dataset.id;
        if (confirm('هل أنت متأكد من رغبتك في حذف هذا الشاغر؟')) {
            const { error } = await supabaseClient.from('job_vacancies').delete().eq('id', vacancyId);
            if (error) {
                alert('حدث خطأ أثناء حذف الشاغر.');
            } else {
                 // --- تصحيح: تم استدعاء الدالة الصحيحة لتحديث القائمة
                loadVacancyTabData();
            }
        }
    }

// (منطق التعديل والحذف سيتم إضافته لاحقاً بنفس الطريقة)

// نهاية الإضافة
    // بداية الإضافة: منطق الأزرار الديناميكية لنافذة العقود

    // --- 2. تعبئة تفاصيل الراتب ---
    document.getElementById('vacancy-base-salary').value = vacancy.base_salary;
    document.getElementById('vacancy-housing').value = vacancy.housing_allowance;
    document.getElementById('vacancy-transport').value = vacancy.transport_allowance;
    document.getElementById('vacancy-other').value = vacancy.other_allowances;

