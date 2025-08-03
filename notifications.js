// بداية الإضافة: دالة إرسال الإشعارات الشاملة

/**
 * دالة لإرسال إشعار لمستخدم معين أو لمجموعة مستخدمين.
 * @param {number[] | number} userIds - الـ ID الخاص بالمستخدم أو مصفوفة من IDs.
 * @param {string} title - عنوان الإشعار.
 * @param {string} body - نص الإشعار.
 * @param {string} [link='/'] - الرابط الذي سيتم فتحه عند النقر.
 */
async function sendNotification(userIds, title, body, link = '/') {
    // التأكد من أن userIds هو مصفوفة دائماً لتسهيل التعامل
    const targetUserIds = Array.isArray(userIds) ? userIds : [userIds];

    if (targetUserIds.length === 0) return;

    try {
        // 1. تجهيز سجلات الإشعارات لحفظها في قاعدة البيانات
        const notificationRecords = targetUserIds.map(id => ({
            user_id: id,
            title: title,
            body: body,
            link: link
        }));

        // 2. حفظ كل الإشعارات في قاعدة البيانات دفعة واحدة
        await supabaseClient.from('notifications').insert(notificationRecords);

        // 3. إرسال الإشعارات الفعلية لكل مستخدم على حدة
        for (const userId of targetUserIds) {
            // استدعاء الوظيفة الخلفية لكل مستخدم
            supabaseClient.functions.invoke('send-fcm-notification', {
                body: { userId, title, body, link },
            }).then(({ data, error }) => {
                if (error) {
                    console.error(`Error invoking FCM for user ${userId}:`, error);
                } else {
                    console.log(`FCM function invoked for user ${userId}:`, data);
                }
            });
        }
    } catch (e) {
        console.error('An unexpected error occurred in sendNotification:', e);
    }
}

// نهاية الإضافة
// --- دوال نظام الإشعارات والتنبيهات ---

// دالة لإظهار تنبيه Toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icon = type === 'success' ? 'ph-check-circle' : 'ph-x-circle';
    toast.className = `toast-message ${type}`;
    toast.innerHTML = `<i class="ph-bold ${icon}"></i> <p>${message}</p>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000); // إزالة التنبيه بعد 4 ثوانٍ
}

// دالة لتحديث عدد الإشعارات في الجرس
// دالة لتحديث عدد الإشعارات في الجرس (النسخة المصححة)
async function updateNotificationBell() {
    if (!currentUser) return;

    // --- بداية التصحيح ---
    // تم تغيير الربط من auth_user_id إلى id ليطابق قاعدة البيانات
    const { count, error } = await supabaseClient
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id) // <-- هنا كان الخطأ
        .eq('is_read', false);
    // --- نهاية التصحيح ---

    const badge = document.getElementById('notification-count-badge');
    if (error) {
        console.error("Error fetching notification count:", error);
        badge.classList.add('hidden');
        return;
    }

    if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// بداية الإضافة
function stopPatrolTracking() {
    if (patrolWatcherId) {
// --- منطق فتح وإغلاق قائمة الإشعارات ---
const bellBtn = event.target.closest('#notification-bell-btn');
const notificationDropdown = document.getElementById('notification-dropdown');

if (bellBtn) {
    const isHidden = notificationDropdown.classList.contains('hidden');
    if (isHidden) {
        // فتح القائمة وتحميل الإشعارات
        notificationDropdown.classList.remove('hidden');
        const content = document.getElementById('notification-list-content');
        content.innerHTML = '<p style="padding: 15px; text-align: center;">جاري التحميل...</p>';
        
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.auth_user_id)
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error || data.length === 0) {
            content.innerHTML = '<p style="padding: 15px; text-align: center;">لا توجد إشعارات.</p>';
        } else {
            content.innerHTML = data.map(n => `
                <div class="notification-item" data-id="${n.id}">
                    <p>${n.title}</p>
                    <small>${new Date(n.created_at).toLocaleString('ar-SA')}</small>
                </div>
            `).join('');
        }
        
        // بعد عرض الإشعارات، قم بتحديثها إلى "مقروءة" وإخفاء النقطة الحمراء
        document.getElementById('notification-count-badge').classList.add('hidden');
        await supabaseClient.from('notifications').update({ is_read: true }).eq('user_id', currentUser.auth_user_id);

    } else {
        notificationDropdown.classList.add('hidden');
    }
} else if (!event.target.closest('#notification-bell-container')) {
    // إغلاق القائمة عند الضغط في أي مكان آخر في الصفحة
    notificationDropdown.classList.add('hidden');
}


// --- منطق فتح نافذة الشكاوى والاقتراحات ---
if (event.target.closest('#open-feedback-modal-btn')) {
    document.getElementById('feedback-modal').classList.remove('hidden');
}



// --- منطق إغلاق نافذة التنبيهات المخصصة ---
if (event.target.closest('#custom-alert-close-btn')) {
    document.getElementById('custom-alert-modal').classList.add('hidden');
}
// بداية الإضافة

// --- عند الضغط على "تصدير المستحقات" ---
const exportPendingBtn = event.target.closest('#export-pending-payments-btn');
if (exportPendingBtn) {
    if (pendingPaymentsData && pendingPaymentsData.length > 0) {
        // تجهيز البيانات بشكل مناسب للتصدير
        const formattedData = pendingPaymentsData.map(p => ({
            "تاريخ الوردية": new Date(p.shift_date).toLocaleDateString('ar-SA'),
            "اسم المستلم": p.covering_guard_name,
            "الحارس الغائب": p.absent_guard_name || 'N/A',
            "المشروع": p.coverage_shifts?.project || 'غير محدد',
// --- منطق تفعيل الإشعارات (النسخة الجديدة والمحسنة) ---
const enableNotificationsBtn = event.target.closest('#enable-notifications-btn');
if (enableNotificationsBtn) {
    enableNotificationsBtn.disabled = true;
    setupPushNotifications(enableNotificationsBtn); // استدعاء الدالة الجديدة
}
// ========= نهاية الاستبدال =========


    // --- منطق فتح وإغلاق القائمة الجانبية في الجوال ---
const menuToggleBtn = event.target.closest('#menu-toggle-btn');
if (menuToggleBtn) {
    document.querySelector('.sidebar').classList.toggle('open');
}

// --- منطق فتح نافذة التبديل ---
const swapBtn = event.target.closest('.swap-assignment-btn');
if (swapBtn) {
    const modal = document.getElementById('swap-employee-modal');
    const vacancyId = swapBtn.dataset.vacancyId;
    const currentUserId = swapBtn.dataset.currentUserId;
    const currentUserName = swapBtn.dataset.currentUserName;

    // تعبئة الحقول بالبيانات الحالية
    document.getElementById('swap-vacancy-id').value = vacancyId;
    document.getElementById('swap-current-user-id').value = currentUserId;
    document.getElementById('swap-current-user-name').value = currentUserName;

    // جلب قائمة الموظفين الآخرين
    const employeeSelect = document.getElementById('swap-new-employee-select');
    employeeSelect.innerHTML = '<option value="">جاري تحميل الموظفين...</option>';
    
    // جلب كل الحراس النشطين ما عدا الحارس الحالي
    const { data: employees, error } = await supabaseClient
        .from('users')
        .select('id, name')
        .eq('employment_status', 'نشط')
        .eq('role', 'حارس أمن')
        .not('id', 'eq', currentUserId);

    if (error) {
        employeeSelect.innerHTML = '<option value="">خطأ في التحميل</option>';
    } else {
        employeeSelect.innerHTML = '<option value="">-- اختر موظفاً بديلاً --</option>';
        employeeSelect.innerHTML += employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
    }
    
    modal.classList.remove('hidden');
}

// --- منطق حفظ التبديل (النسخة المصححة) ---
const saveSwapBtn = event.target.closest('#save-swap-btn');
if (saveSwapBtn) {
    const vacancy_A_Id = document.getElementById('swap-vacancy-id').value;
    const employee_A_Id = document.getElementById('swap-current-user-id').value;
    const employee_B_Id = document.getElementById('swap-new-employee-select').value;

    if (!employee_B_Id) return alert('الرجاء اختيار الموظف البديل.');

    saveSwapBtn.disabled = true;
    saveSwapBtn.textContent = 'جاري التبديل...';

    try {
        // 1. جلب الشاغر الحالي للموظف الجديد (الموظف ب)
        const { data: employeeB_Data, error: e1 } = await supabaseClient
            .from('users').select('vacancy_id').eq('id', employee_B_Id).single();
        if (e1) throw e1;
        const vacancy_B_Id = employeeB_Data.vacancy_id; // قد يكون null

        // 2. تحديث الموظف القديم (أ) وإعطائه شاغر الموظف الجديد (ب)
        const { error: e2 } = await supabaseClient
            .from('users').update({ vacancy_id: vacancy_B_Id }).eq('id', employee_A_Id);
        if (e2) throw e2;

        // 3. تحديث الموظف الجديد (ب) وتعيينه للشاغر المستهدف (أ)
        const { error: e3 } = await supabaseClient
            .from('users').update({ vacancy_id: vacancy_A_Id }).eq('id', employee_B_Id);
        if (e3) throw e3;

        alert('تم تبديل الموظفين بنجاح.');
        document.getElementById('swap-employee-modal').classList.add('hidden');
        loadVacancyTabData(); // تحديث القائمة

    } catch (error) {
        alert('حدث خطأ أثناء عملية التبديل: ' + error.message);
    } finally {
        saveSwapBtn.disabled = false;
        saveSwapBtn.textContent = 'حفظ التبديل';
    }
}

// بداية الإضافة (أضف هذا الكود داخل معالج الأوامر الكبير)
// --- منطق زر الاعتماد النهائي وتوظيف الموظف (متوافق مع الدالة المحسّنة) ---
const finalApproveBtn = event.target.closest('#final-approve-btn');
if (finalApproveBtn) {
    event.preventDefault();
    const submitBtn = finalApproveBtn;
    
    if (!confirm("هل أنت متأكد من اعتماد هذا المرشح؟ سيتم إنشاء حساب له وربطه بالشاغر.")) {
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph-fill ph-spinner-gap animate-spin"></i> جاري التوظيف...';

    const applicationId = document.getElementById('review-app-id').value;
    const vacancyId = document.getElementById('review-vacancy-id').value;

    try {
        const password = document.getElementById('review-password').value;
        const profileData = {
            name: document.getElementById('review-full-name').value,
            id_number: document.getElementById('review-id-number').value,
            phone: document.getElementById('review-phone').value,
            iban: document.getElementById('review-iban').value,
            bank_name: document.getElementById('review-bank-name').value,
            vacancy_id: vacancyId,
            start_of_work_date: new Date().toISOString().split('T')[0],
            employment_status: 'اساسي', // -- هذا هو التعديل الصحيح --
            status: 'active',
            insurance_status: 'غير مسجل'
        };

        const { data: vacancy } = await supabaseClient
            // --- إرسال إشعار لمدراء العمليات ---
            const { data: requestDetails } = await supabaseClient.from('employee_requests').select('users:user_id(name)').eq('id', requestId).single();
            const { data: opsManagers, error: opsError } = await supabaseClient
                .from('users')
                .select('id')
                .eq('role', 'ادارة العمليات')
                .eq('region', currentUser.region);

            if (!opsError && opsManagers) {
                const opsIds = opsManagers.map(ops => ops.id);
                sendNotification(
                    opsIds,
                    'طلب استئذان بانتظار المراجعة',
                    `تم رفع طلب استئذان من الموظف ${requestDetails.users.name} وهو بانتظار موافقتك.`,
                    '#'
                );
            }
            // --- نهاية إرسال الإشعار ---

        } else {
            const reason = prompt('الرجاء كتابة سبب الرفض:');
            if (!reason) { supervisorPermissionBtn.disabled = false; return; }
            updateData = { 
                status: 'مرفوض', 
                rejection_reason: reason,
                supervisor_approver_id: currentUser.id
            };
        }

        const { error } = await supabaseClient.from('employee_requests').update(updateData).eq('id', requestId);
        if (error) throw error;

        alert('تم تحديث الطلب بنجاح.');
        loadSupervisorPermissionRequestsPage();

    } catch(error) {
        alert('حدث خطأ أثناء تحديث الطلب.');
        console.error(error);
    } finally {
        supervisorPermissionBtn.disabled = false;
    }
    return;
}

// نهاية الاستبدال
// نهاية الاستبدال

// بداية الاستبدال

// نهاية الإضافة
    // بداية الإضافة
// --- منطق عام لإغلاق أي نافذة منبثقة ---
if (event.target.closest('.modal-close-btn')) {
    event.target.closest('.modal-overlay').classList.add('hidden');
    return; // إيقاف التنفيذ هنا لأننا لا نحتاج لفحص أي شيء آخر
}
// نهاية الإضافة
// بداية الاستبدال
const myDirectiveTab = event.target.closest('#page-my-directives .tab-link');
if (myDirectiveTab) {
    event.preventDefault();
    const targetTabId = myDirectiveTab.dataset.tab;

    document.querySelectorAll('#page-my-directives .tab-link').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#page-my-directives .tab-content').forEach(c => c.classList.remove('active'));
    myDirectiveTab.classList.add('active');
    document.getElementById(targetTabId).classList.add('active');

    // استدعاء دالة تحميل السجل عند الضغط على تبويبه
    if (targetTabId === 'supervisor-directives-history') {
        loadSupervisorDirectivesHistory();
    }
}
// نهاية الاستبدال

// بداية الإضافة
// --- منطق التنقل بين تبويبات صفحة الزيارات/الجولات ---
const visitPatrolTab = event.target.closest('#page-visits .tab-link');
if (visitPatrolTab) {
    event.preventDefault();
    const targetTabId = visitPatrolTab.dataset.tab;

    document.querySelectorAll('#page-visits .tab-link').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#page-visits .tab-content').forEach(c => c.classList.remove('active'));
    visitPatrolTab.classList.add('active');
    document.getElementById(targetTabId).classList.add('active');

    if (targetTabId === 'patrols-log') {
        loadPatrolsHistory();
    }
}

// --- منطق عرض مسار الجولة على الخريطة ---
const viewPathBtn = event.target.closest('.view-patrol-path-btn');
if (viewPathBtn) {
    const patrolId = viewPathBtn.dataset.patrolId;
    const { data: patrol, error } = await supabaseClient
        .from('patrols')
        .select('path')
        .eq('id', patrolId)
        .single();

    if (error || !patrol || !patrol.path || patrol.path.length === 0) {
        return alert('لا يوجد مسار مسجل لهذه الجولة أو حدث خطأ.');
    }

    // الانتقال إلى صفحة الخريطة
    document.querySelector('a[data-page="page-geo"]').click();

    // إعطاء مهلة بسيطة للخريطة للتحميل قبل رسم المسار
    setTimeout(() => {
        // مسح أي طبقات قديمة على الخريطة
        markersLayer.clearLayers();

        const latLngs = patrol.path.map(p => [p.lat, p.lng]);
        const polyline = L.polyline(latLngs, { color: 'blue' }).addTo(markersLayer);

        // إضافة علامات البداية والنهاية
        const startMarker = L.marker(latLngs[0]).bindPopup('بداية الجولة').addTo(markersLayer);
        const endMarker = L.marker(latLngs[latLngs.length - 1]).bindPopup('نهاية الجولة').addTo(markersLayer);

        // تكبير الخريطة لتناسب المسار
        map.fitBounds(polyline.getBounds());
    }, 500);
}
// نهاية الإضافة

// بداية الاستبدال
// منطق فتح نافذة تسجيل الزيارة للمشرف (يعتمد على العقد)
const addVisitLogBtn = event.target.closest('#add-visit-log-btn');
if (addVisitLogBtn && currentUser && currentUser.contract_id) {
    const modal = document.getElementById('add-visit-modal');
            // --- الإضافة الجديدة: إرسال الإشعارات للجميع ---
            const guardIds = guards.map(g => g.id);
            sendNotification(
                guardIds,
                `توجيه جديد من: ${currentUser.name}`,
                content,
                '#' // يمكنك تغيير الرابط لاحقاً لصفحة التوجيهات
            );
            // --- نهاية الإضافة ---

            alert(`تم إرسال التوجيه بنجاح إلى ${guards.length} موظف.`);

        } else {
            const { error } = await supabaseClient
                .from('directives')
                .insert({ sender_id: currentUser.id, recipient_id: recipientId, content: content });

            if (error) throw error;

            // --- الإضافة الجديدة: إرسال الإشعار للمستلم ---
            sendNotification(
                parseInt(recipientId),
                `توجيه جديد من: ${currentUser.name}`,
                content,
                '#'
            );
            // --- نهاية الإضافة ---

            alert('تم إرسال التوجيه بنجاح.');
        }

        document.getElementById('send-directive-modal').classList.add('hidden');

    } catch (error) {
        alert('حدث خطأ أثناء إرسال التوجيه: ' + error.message);
    } finally {
        sendDirectiveBtn.disabled = false;
        sendDirectiveBtn.textContent = 'إرسال';
    }
}

// نهاية الاستبدال
// ========= نهاية الاستبدال الكامل لمنطق حفظ التوجيه =========

// --- منطق التنقل بين تبويبات صفحة التوجيهات ---
const directiveTab = event.target.closest('#page-directives-ops .tab-link');
if (directiveTab) {
    event.preventDefault();
    const targetTabId = directiveTab.dataset.tab;

    // تفعيل التبويب والصفحة المرتبطة به
    document.querySelectorAll('#page-directives-ops .tab-link').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#page-directives-ops .tab-content').forEach(c => c.classList.remove('active'));
    directiveTab.classList.add('active');
    document.getElementById(targetTabId).classList.add('active');

    // تحميل محتوى التبويب المطلوب
    if (targetTabId === 'ops-directives-history') {
        loadOpsDirectivesHistory();
    }
}
// نهاية الإضافة

    // بداية الإضافة: منطق فتح نافذة إرسال التوجيه
const openDirectiveModalBtn = event.target.closest('.open-directive-modal-btn');
if (openDirectiveModalBtn) {
    const recipientId = openDirectiveModalBtn.dataset.recipientId;
    const recipientName = openDirectiveModalBtn.dataset.recipientName;
    
    const modal = document.getElementById('send-directive-modal');
    document.getElementById('send-directive-modal-title').textContent = `إرسال توجيه إلى: ${recipientName}`;
    document.getElementById('directive-recipient-id').value = recipientId;
    document.getElementById('directive-content').value = ''; // إفراغ الحقل عند الفتح

    modal.classList.remove('hidden');
}
// نهاية الإضافة

    // بداية الاستبدال
// منطق الموارد البشرية للقبول النهائي (مع إنشاء حساب للموظف)
const hrCoverageBtn = event.target.closest('.hr-coverage-action-btn');
if (hrCoverageBtn) {
    const applicantId = hrCoverageBtn.dataset.applicantId;
    const shiftId = hrCoverageBtn.dataset.shiftId;
    const action = hrCoverageBtn.dataset.action;

    hrCoverageBtn.disabled = true;
    hrCoverageBtn.textContent = 'جاري...';

    try {
        if (action === 'approve') {
            if (!confirm('هل أنت متأكد من القبول النهائي؟ سيتم إنشاء حساب للموظف وإغلاق الوردية.')) {
                hrCoverageBtn.disabled = false; hrCoverageBtn.innerHTML = '<i class="ph-bold ph-check-circle"></i> قبول نهائي وتعيين'; return;
            }

            // --- جلب بيانات المتقدم والوردية ---
            const { data: applicant, error: applicantError } = await supabaseClient.from('coverage_applicants').select('*, coverage_shifts(*)').eq('id', applicantId).single();
            if (applicantError || !applicant) throw new Error('لا يمكن العثور على بيانات المتقدم.');
            
            // --- تجهيز بيانات الموظف الجديد ---
            const profileData = {
                name: applicant.full_name,
                id_number: applicant.id_number,
                phone: applicant.phone_number,
                iban: applicant.iban,
                role: 'حارس أمن',
                employee_type: 'تغطية',
                employment_status: 'نشط',
                status: 'active',
                project: applicant.coverage_shifts.project,
 * دالة متكاملة لتهيئة وتسجيل الإشعارات (النسخة النهائية والمستقرة)
 * @param {HTMLButtonElement} btn - الزر الذي تم الضغط عليه لتحديث حالته
 */
async function setupPushNotifications(btn) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('المتصفح لا يدعم الإشعارات.');
        btn.disabled = false;
        return;
    }

    try {
        console.log('طلب الإذن من المستخدم...');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('تم رفض إذن الإشعارات.');
        }

        // --- الخطوة الجديدة: انتظر حتى يصبح الـ Service Worker نشطاً ---
        console.log('الانتظار حتى يصبح ملف الإشعارات جاهزاً...');
        const readySW = await navigator.serviceWorker.ready;
        console.log('ملف الإشعارات جاهز ونشط!', readySW);
        
        console.log('طلب توكن FCM...');
        
        
            alert('تم تفعيل الإشعارات بنجاح!');
            btn.style.color = '#22c55e';
        } else {
             throw new Error('لم يتمكن من الحصول على توكن.');
        }

    } catch (err) {
        console.error('حدث خطأ أثناء إعداد الإشعارات:', err);
        // عرض الرسالة التي ظهرت في الصورة للمستخدم
        alert(`فشل تفعيل الإشعارات:\n${err.message}`);
    } finally {
        btn.disabled = false;
    }
}

// نهاية الاستبدال
// ========= نهاية الإضافة =========

// بداية الإضافة
async function loadSupervisorDirectivesHistory() {
    const container = document.getElementById('supervisor-history-list-container');
    if (!container || !currentUser) return;
    container.innerHTML = '<p style="text-align: center;">جاري تحميل السجل...</p>';

    const { data: directives, error } = await supabaseClient
        .from('directives')
        .select(`*, recipient:recipient_id (name)`)
        .eq('sender_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = '<p style="color:red;">خطأ في جلب السجل.</p>';
        return console.error(error);
    }
    if (directives.length === 0) {
        container.innerHTML = '<p style="text-align: center;">لم تقم بإرسال أي توجيهات بعد.</p>';
        return;
    }

    container.innerHTML = directives.map(d => {
        let statusClass, statusText;
        switch(d.status) {
            case 'accepted': statusClass = 'active'; statusText = 'تم القبول'; break;
            case 'rejected': statusClass = 'inactive'; statusText = 'تم الرفض'; break;
            default: statusClass = 'pending'; statusText = 'مرسل';
        }
        const date = new Date(d.created_at).toLocaleString('ar-SA');
        
        let notesFooter = '';
        if (d.status === 'rejected' && d.rejection_reason) {
            notesFooter = `<div class="request-card-footer"><strong>سبب الرفض:</strong> ${d.rejection_reason}</div>`;
        } else if (d.status === 'accepted' && d.acceptance_notes) {
            notesFooter = `<div class="request-card-footer" style="background-color: #e6f7ff; color: #005f8a; border-top: 1px solid #b3e0ff;"><strong>ملاحظات القبول:</strong> ${d.acceptance_notes}</div>`;
        }
        
        return `
            <div class="request-card" style="margin-bottom:15px;">
                <div class="request-card-header">
                    <h4>إلى: ${d.recipient ? d.recipient.name : 'مستخدم محذوف'}</h4>
                    <span class="status ${statusClass}">${statusText}</span>
                </div>
                <div class="request-card-body">
                    <p>${d.content}</p>
                    <small style="color: var(--text-secondary);">${date}</small>
                    ${notesFooter}
                </div>
            </div>`;
    }).join('');
}
// نهاية الإضافة
// بداية الإضافة
// --- منطق تسجيل الخروج ---
if (event.target.closest('#logout-btn, #logout-btn-mobile')) {
    event.preventDefault(); // منع السلوك الافتراضي للرابط
    
    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            alert('حدث خطأ أثناء تسجيل الخروج: ' + error.message);
        } else {
            // مسح أي بيانات محفوظة للمستخدم من الجلسة الحالية
            currentUser = null;
            sessionStorage.removeItem('currentUser');
            
            // إعادة تحميل الصفحة للعودة إلى شاشة تسجيل الدخول
                    notifyHR = true; // تفعيل إرسال الإشعار للموارد البشرية
                    break;
                
                case 'hr_final':
                    updateData = { status: 'مقبول' };
                    successMessage = 'تمت الموافقة النهائية على الطلب.';
                    
                    // إرسال إشعار للموظف صاحب الطلب
                    sendNotification(
                        parseInt(userId),
                        'تحديث على طلبك',
                        `تمت الموافقة النهائية على طلب ${requestType} الذي قدمته.`,
                        '#'
                    );

                    if ((requestType === 'leave' || requestType === 'resignation') && vacancyId) {
                        await supabaseClient.from('users').update({ vacancy_id: null, employment_status: requestType === 'leave' ? 'اجازة' : 'مستقيل' }).eq('id', userId);
                        await supabaseClient.from('job_vacancies').update({ status: 'open' }).eq('id', vacancyId);
                        successMessage += ' وتم إخلاء الشاغر الوظيفي.';
                    }
                    break;

                default: // حالة خاصة لطلبات الاستئذان التي لا تذهب للموارد البشرية
                    updateData = { status: 'مقبول' };
                    successMessage = 'تمت الموافقة النهائية على طلب الاستئذان.';
                    sendNotification(
                        parseInt(userId), 'تحديث على طلبك', `تمت الموافقة النهائية على طلب استئذانك.`, '#'
                    );
                    break;
            }
        }

        const { error } = await supabaseClient.from('employee_requests').update(updateData).eq('id', requestId);
        if (error) throw error;
        
        // منطق إرسال الإشعار للموارد البشرية
        if (notifyHR) {
            const { data: requestDetails } = await supabaseClient.from('employee_requests').select('request_type, users:user_id(name)').eq('id', requestId).single();
            const { data: hrUsers, error: hrError } = await supabaseClient.from('users').select('id').eq('role', 'ادارة الموارد البشرية');

            if (!hrError && hrUsers) {
                const hrIds = hrUsers.map(hr => hr.id);
                const typeTranslations = { leave: 'إجازة', resignation: 'استقالة', loan: 'سلفة', permission: 'استئذان' };
                const typeText = typeTranslations[requestDetails.request_type] || 'جديد';
                
                sendNotification(
                    hrIds,
                    `طلب ${typeText} بانتظار المراجعة`,
                    `تم رفع طلب ${typeText} من الموظف ${requestDetails.users.name} وهو بانتظار موافقتك النهائية.`,
                    '#'
                );
            }
        }

        alert(successMessage);

    } catch (error) {
        alert(`حدث خطأ: ${error.message}`);
    } finally {
        btn.disabled = false;
        // إعادة تحميل محتوى الصفحات المفتوحة لتحديث البيانات
        if (document.querySelector('#page-leave-requests:not(.hidden)')) loadLeaveRequests();
        if (document.querySelector('#page-resignation-requests:not(.hidden)')) loadResignationRequests();
        if (document.querySelector('#page-loan-requests:not(.hidden)')) loadLoanRequests();
        if (document.querySelector('#page-ops-review-requests:not(.hidden)')) loadOpsReviewRequestsPage();
    }
    return;
}

// نهاية الاستبدال
// ========= نهاية الاستبدال الكامل لمنطق أزرار الطلبات =========
// نهاية الإضافة

    // --- عند الضغط على زر "عرض الشواغر المتاحة" (النسخة الصحيحة) ---
    const viewSlotsBtn = event.target.closest('#view-available-slots-btn');
    if (viewSlotsBtn) {
        const modal = document.getElementById('available-slots-modal');
        const body = document.getElementById('available-slots-body');
        modal.classList.remove('hidden');
        body.innerHTML = '<p style="text-align: center;">جاري حساب الشواغر المتاحة...</p>';

        try {
        let requestTypeText = ''; // لعنوان الإشعار

        // تجميع البيانات من النموذج الصحيح بناءً على نوع الطلب
        switch (requestType) {
            case 'permission':
                const permissionReason = modal.querySelector('#permission-reason').value;
                if (!permissionReason.trim()) { alert('الرجاء كتابة سبب الاستئذان.'); isValid = false; }
                details = { reason: permissionReason };
                requestTypeText = 'استئذان';
                break;
            case 'leave':
                const leaveStartDate = modal.querySelector('#leave-start-date').value;
                const leaveDays = modal.querySelector('#leave-days').value;
                const leaveReason = modal.querySelector('#leave-reason').value;
                if (!leaveStartDate || !leaveDays || !leaveReason.trim()) { alert('الرجاء تعبئة جميع حقول طلب الإجازة.'); isValid = false; }
                details = { start_date: leaveStartDate, days: leaveDays, reason: leaveReason };
                requestTypeText = 'إجازة';
                break;
            case 'loan':
                const loanAmount = modal.querySelector('#loan-amount').value;
                const loanReason = modal.querySelector('#loan-reason').value;
                if (!loanAmount || !loanReason.trim()) { alert('الرجاء تحديد مبلغ السلفة وكتابة السبب.'); isValid = false; }
                details = { amount: loanAmount, reason: loanReason };
                requestTypeText = 'سلفة';
                break;
            case 'resignation':
                const resignationReason = modal.querySelector('#resignation-reason').value;
                if (!resignationReason.trim()) { alert('الرجاء كتابة سبب الاستقالة.'); isValid = false; }
                details = { reason: resignationReason };
                requestTypeText = 'استقالة';
                break;
        }

        if (!isValid) return;

        submitRequestBtn.disabled = true;
        submitRequestBtn.textContent = 'جاري الإرسال...';

        const requestData = {
            user_id: currentUser.id,
            request_type: requestType,
            details: details
        };

        const { error } = await supabaseClient.from('employee_requests').insert([requestData]);

        if (error) {
            console.error('Error submitting request:', error);
            alert('حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.');
            submitRequestBtn.disabled = false;
        } else {
            // --- إرسال إشعار للمدراء ---
            const { data: managers, error: managersError } = await supabaseClient
                .from('users')
                .select('id')
                .or('role.eq.مشرف,role.eq.ادارة العمليات')
                .eq('project', currentUser.project);

            if (managersError) {
                console.error('Could not fetch managers to notify:', managersError);
            } else if (managers && managers.length > 0) {
                const managerIds = managers.map(m => m.id);
                sendNotification(
                    managerIds,
                    `طلب ${requestTypeText} جديد`,
                    `قام الموظف ${currentUser.name} بتقديم طلب ${requestTypeText} جديد.`,
                    '#'
                );
            }
            // --- نهاية إرسال الإشعار ---

            alert('تم إرسال طلبك بنجاح.');
            modal.classList.add('hidden');
            loadMyRequestsPage();
        }
    }

// نهاية الاستبدال
    // ==================== بداية الإضافة ====================
// --- منطق قبول ورفض طلبات الاستئذان للمشرف ---
const actionBtn = event.target.closest('[data-action]');
if (actionBtn && actionBtn.dataset.requestId) {
    const requestId = actionBtn.dataset.requestId;
    const action = actionBtn.dataset.action;
