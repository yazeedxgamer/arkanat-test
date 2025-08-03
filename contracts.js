// ===       دالة تحميل قالب إدخال العقود بالعربي        ===
// ==========================================================
async function downloadContractTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('قالب إدخال المشاريع');

    // استخدام عناوين قصيرة ومباشرة
    worksheet.columns = [
        { header: 'اسم المشروع', key: 'ProjectName', width: 40 },
        { header: 'تاريخ نهاية العقد', key: 'ContractEndDate', width: 20 },
        { header: 'المنطقة', key: 'ContractRegion', width: 15 },
        { header: 'المدينة', key: 'City', width: 20 },
async function processContractFile(file) {
    const resultsContainer = document.getElementById('contract-import-results-container');
    const uploadBtn = document.getElementById('import-contracts-btn');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="ph-fill ph-spinner-gap animate-spin"></i> جاري المعالجة...';
    resultsContainer.innerHTML = '<p style="text-align:center; padding: 20px;">بدأت المعالجة، يرجى الانتظار...</p>';

    try {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet(1);

        const headerMap = {};
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headerMap[cell.value] = colNumber;
        });
        
        const dayMap = { '1': 'Sun', '2': 'Mon', '3': 'Tue', '4': 'Wed', '5': 'Thu', '6': 'Fri', '7': 'Sat' };
        const groupedData = {};

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1) {
                const projectName = row.getCell(headerMap['اسم المشروع']).value;
// ===       دالة تحميل قالب إدخال العقود بالعربي        ===
// ==========================================================


// ==========================================================
// ===        الدالة الرئيسية لمعالجة ملف العقود           ===
// ==========================================================
async function processContractFile(file) {
    const resultsContainer = document.getElementById('contract-import-results-container');
    const uploadBtn = document.getElementById('import-contracts-btn');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="ph-fill ph-spinner-gap animate-spin"></i> جاري المعالجة...';
    resultsContainer.innerHTML = '<p style="text-align:center; padding: 20px;">بدأت المعالجة، يرجى الانتظار...</p>';

    try {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet(1);

        const headerMap = {};
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headerMap[cell.value] = colNumber;
        });
        
        const dayMap = { '1': 'Sun', '2': 'Mon', '3': 'Tue', '4': 'Wed', '5': 'Thu', '6': 'Fri', '7': 'Sat' };
        const groupedData = {};

        // --- بداية التعديل: تغيير طريقة قراءة الصفوف ---
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            if (row.cellCount === 0) continue; // تخطي الصفوف الفارغة تمامًا

            const projectName = row.getCell(headerMap['اسم المشروع']).value;
            processContractFile(file);
        }
    });
}

// تعديل بسيط على زر إضافة عقد جديد ليعمل مع الزر الجديد
const addContractBtn = document.getElementById('add-contract-btn');
if(addContractBtn) {
    addContractBtn.addEventListener('click', () => {
        // هذا الكود موجود بالفعل لديك في مكان آخر، فقط نتأكد من وجود المستمع
        // يمكنك ترك هذا فارغًا إذا كان الكود موجودًا بالفعل
    });
}



// ==========================================================
// ===            بداية منطق حفظ الإعلانات              ===
// ==========================================================
document.getElementById('announcement-form')?.addEventListener('submit', async function(event) {
    event.preventDefault();
    const saveBtn = document.getElementById('save-announcement-btn');
    saveBtn.disabled = true;

    const annId = document.getElementById('announcement-id').value;
    const annData = {
        title: document.getElementById('announcement-title').value,
        content: document.getElementById('announcement-content').value,
        type: document.getElementById('announcement-type').value,
        start_date: new Date(document.getElementById('announcement-start-date').value).toISOString(),
        end_date: new Date(document.getElementById('announcement-end-date').value).toISOString(),
        is_active: true,
        created_by: currentUser.name
    };

    const { error } = annId
        ? await supabaseClient.from('announcements').update(annData).eq('id', annId)
        : await supabaseClient.from('announcements').insert(annData);

    if (error) {
        alert('حدث خطأ: ' + error.message);
    } else {
        alert('تم حفظ الإعلان بنجاح.');
        loadAnnouncementsPage(); // تحديث القائمة والنموذج
    }
    saveBtn.disabled = false;
});
// ==========================================================
// ===             نهاية منطق حفظ الإعلانات               ===
// ==========================================================


// بداية الإضافة: التحقق من وجود جلسة مدير محفوظة
if (localStorage.getItem('admin_session')) {
    document.getElementById('return-to-admin-banner').classList.remove('hidden');
    // إضافة هامش علوي للمحتوى الرئيسي لتجنب تداخله مع الشريط
    document.querySelector('.main-content').style.paddingTop = '60px';
}
// نهاية الإضافة

    // بداية الإضافة: إظهار حقل مبلغ التأمينات عند الحاجة
document.addEventListener('change', (event) => {
    if (event.target.id === 'employee-insurance') {
        const amountGroup = document.getElementById('insurance-amount-group');
        if (event.target.value === 'مسجل') {
            amountGroup.classList.remove('hidden');
        } else {
            amountGroup.classList.add('hidden');
            document.getElementById('employee-insurance-amount').value = 0;
        }
    }
});
// نهاية الإضافة

const penaltySearchInput = document.getElementById('penalty-employee-search');
    if(penaltySearchInput) {
        penaltySearchInput.addEventListener('keyup', () => {
            loadPenaltiesPage(penaltySearchInput.value);
        });
    }

    // --- إضافة أيقونة لزر القائمة في الجوال ---
const menuBtn = document.getElementById('menu-toggle-btn');
if (menuBtn) {
    menuBtn.innerHTML = '<i class="ph-bold ph-list"></i>';
}
