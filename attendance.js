            <div class="attendance-accordion" style="margin-bottom: 20px;">
                <details open>
                    <summary style="font-size: 1.3rem;">
                            <div class="attendance-card">
                                <span>${applicant.full_name}</span>
                                <div style="display: flex; gap: 10px;">
                                    <button class="btn btn-secondary btn-sm view-coverage-applicant-btn" data-appid="${applicant.applicant_id}">
                                        <i class="ph-bold ph-eye"></i> عرض التفاصيل
                                    </button>
                                    <button class="btn btn-success btn-sm nominate-coverage-applicant-btn" data-appid="${applicant.applicant_id}" data-shiftid="${shiftId}">
                                        <i class="ph-bold ph-check-fat"></i> ترشيح
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </details>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', groupHtml);
    }
}


async function loadArchivePage(requestType) {
    const containerId = `archive-${requestType}-tab`;
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `<p style="text-align: center; padding-top: 20px;">جاري تحميل الأرشيف...</p>`;
    
    const { data: requests, error } = await supabaseClient
        .from('employee_requests')
        .select(`*, users:user_id(name)`)
        .eq('request_type', requestType)
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<p style="color:red;">حدث خطأ في تحميل الأرشيف.</p>`;
        return console.error(error);
    }
    if (requests.length === 0) {
        container.innerHTML = `<p style="text-align: center;">لا توجد طلبات في الأرشيف.</p>`;
        return;
    }
    // إعادة استخدام نفس تصميم بطاقات المراجعة
    container.innerHTML = `<div class="all-requests-container" style="padding-top:20px;">${requests.map(request => {
        const headerStatusClass = request.status === 'مقبول' ? 'status-approved' : (request.status === 'مرفوض' ? 'status-denied' : 'status-pending');
        let detailsHtml = '';
        if (request.details) {
            if (request.details.days) detailsHtml += `<p><strong>المدة:</strong> ${request.details.days} أيام</p>`;
            if (request.details.amount) detailsHtml += `<p><strong>المبلغ:</strong> ${request.details.amount} ر.س</p>`;
            if (request.details.reason) detailsHtml += `<p><strong>السبب:</strong> ${request.details.reason}</p>`;
        }
        return `<div class="review-request-card"><div class="review-request-header ${headerStatusClass}"><h4>طلب من: ${request.users ? request.users.name : 'غير معروف'}</h4><span class="status-badge">${request.status}</span></div><div class="review-request-body">${detailsHtml}</div></div>`;
    }).join('')}</div>`;
}

// بداية الاستبدال
// ==========================================================
// ===   بداية الاستبدال الكامل لدالة loadOpsReviewRequestsPage   ===
// ==========================================================
async function loadOpsReviewRequestsPage() {
    const container = document.getElementById('ops-review-requests-container');
    if (!container || !currentUser || !currentUser.region) { 
        container.innerHTML = '<p>لا يمكن عرض الصفحة. الرجاء التأكد من تعيين منطقة لحسابك.</p>';
        return;
    }
    container.innerHTML = '<p style="text-align: center;">جاري تحميل الطلبات...</p>';

    // --- هنا التصحيح: تم تغيير الفلترة من project إلى region ---
    const { data: requests, error } = await supabaseClient
        .from('employee_requests')
        .select(`*, users:user_id!inner(name, region)`)
        .eq('status', 'معلق')
        .eq('users.region', currentUser.region); // <-- الفلترة الصحيحة حسب المنطقة

    if (error) { 
        container.innerHTML = '<p style="color:red;">حدث خطأ في جلب الطلبات.</p>'; 
        return console.error(error);
    }
    if (requests.length === 0) { 
        container.innerHTML = '<p style="text-align: center;">لا توجد طلبات معلقة من الموظفين في منطقتك حالياً.</p>'; 
        return;
    }
    
    container.innerHTML = '';
    requests.forEach(request => {
        const requestTypeTranslations = { leave: 'إجازة', resignation: 'استقالة', loan: 'سلفة', permission: 'استئذان' };
        const typeText = requestTypeTranslations[request.request_type] || request.request_type;
        let detailsHtml = '';
        if (request.details) {
            if (request.details.days) detailsHtml += `<p><strong>المدة:</strong> ${request.details.days} أيام</p>`;
            if (request.details.amount) detailsHtml += `<p><strong>المبلغ:</strong> ${request.details.amount} ر.س</p>`;
            if (request.details.reason) detailsHtml += `<p><strong>السبب:</strong> ${request.details.reason}</p>`;
        }
        const cardHtml = `
            <div class="review-request-card">
                <div class="review-request-header status-pending">
                    <h4>طلب ${typeText}</h4>
                    <span class="status-badge">${request.status}</span>
                </div>
                <div class="review-request-body">
                    <div class="request-meta-grid" style="grid-template-columns: 1fr;">
                        <div class="request-meta-item">
                            <i class="ph-bold ph-user-circle"></i>
                            <span><strong>مقدم الطلب:</strong> ${request.users ? request.users.name : 'غير معروف'}</span>
                        </div>
                    </div>
                    <div class="request-main-details">${detailsHtml}</div>
                </div>
                <div class="review-request-footer">
                    <button class="btn btn-success request-action-button" data-approval-stage="ops_escalate" data-action="approve" data-request-id="${request.id}">
                        <i class="ph-bold ph-arrow-fat-up"></i>اعتماد 
                    </button>
                    <button class="btn btn-danger request-action-button" data-approval-stage="ops_escalate" data-action="reject" data-request-id="${request.id}">
                        <i class="ph-bold ph-x-circle"></i> رفض مباشر
                    </button>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}
// ==========================================================
// ===    نهاية الاستبدال الكامل للدالة    ===
// ==========================================================
// نهاية الاستبدال
// بداية الإضافة
// ==========================================================
// ===   بداية الاستبدال الكامل لدالة loadOpsDirectivesPage   ===
// ==========================================================
async function loadOpsDirectivesPage() {
    const container = document.getElementById('ops-users-list-container');
    if (!container || !currentUser) return;
    container.innerHTML = '<p style="text-align: center;">جاري تحميل قائمة الموظفين...</p>';

    // --- هنا التصحيح: تم تغيير الفلترة من project إلى region ---
    const { data: users, error } = await supabaseClient
        .from('users')
            <div class="attendance-card">
                <div>
                    <span>${user.name}</span>
// بداية الاستبدال: دالة عرض الحضور لمدير العمليات (مع التحقق من الجداول)
// دالة عرض الحضور (النسخة الجديدة مع عرض حالة الانسحاب)
// ==========================================================
// ===   بداية الاستبدال الكامل لدالة loadGuardAttendancePage   ===
// ==========================================================
async function loadGuardAttendancePage() {
    const container = document.getElementById('guard-attendance-container');
    container.innerHTML = '<p style="text-align: center;">جاري تحميل بيانات الفريق...</p>';
    
    console.log("--- Diagnostic: Starting loadGuardAttendancePage ---");
    
    if (!currentUser || !['ادارة العمليات', 'مشرف', 'مدير النظام'].includes(currentUser.role)) {
        console.error("Diagnostic: User not logged in or doesn't have the correct role.");
        return;
    }
    
    console.log("Diagnostic: Current user object:", currentUser);

    try {
        let guards = [];
        let queryError = null;

        let query = supabaseClient
            .from('users')
        const { data: attendanceRecords, error: e2 } = await supabaseClient.from('attendance').select('guard_id, created_at, status').gte('created_at', yesterday);
        if (e2) throw e2;

        if (!guards || guards.length === 0) {
            container.innerHTML = '<p style="text-align: center;">لا يوجد حراس أمن في نطاق صلاحياتك حالياً.</p>';
            console.warn("Diagnostic: No guards found after query execution.");
            return;
        }

        // ... (باقي الكود يبقى كما هو)
        const now = new Date();
        const currentDay = now.toLocaleString('en-US', { weekday: 'short' });
        const isAdmin = currentUser.role === 'مدير النظام';
        let guardsStatusHtml = '';

        for (const guard of guards) {
            const isCoverageGuard = guard.employment_status === 'تغطية';
            const shift = guard.job_vacancies?.schedule_details?.[0];
            let status = { text: 'في راحة', class: 'off' };
            let actionButton = '';
            let adminEditButton = '';

            if (isAdmin) {
                adminEditButton = `<button class="btn btn-secondary btn-sm admin-manual-attendance-btn" data-guard-id="${guard.id}" data-guard-name="${guard.name}" title="تعديل يدوي"><i class="ph-bold ph-pencil-simple"></i></button>`;
            }

            const latestAttendance = attendanceRecords.filter(r => r.guard_id === guard.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];

            if (isCoverageGuard) {
                status.text = "تغطية";
                 if (latestAttendance && latestAttendance.status === 'حاضر') {
                    const checkInTime = new Date(latestAttendance.created_at).toLocaleTimeString('ar-SA', { timeStyle: 'short' });
                    status.text = `حاضر (تغطية)`;
                    status.class = 'present';
                }
            } else if (shift && shift.days && shift.days.includes(currentDay)) {
                 if (latestAttendance && latestAttendance.status !== 'اكمل المناوبة') {
                    const checkInTime = new Date(latestAttendance.created_at).toLocaleTimeString('ar-SA', { timeStyle: 'short' });
                    if (latestAttendance.status === 'حاضر') {
                        status = { text: `حاضر (منذ ${checkInTime})`, class: 'present' };
                        actionButton = `<button class="btn btn-secondary btn-sm view-on-map-btn" data-guard-id="${guard.id}" title="عرض في الخريطة"><i class="ph-bold ph-map-pin-line"></i></button>`;
                    } else if (latestAttendance.status === 'انسحاب') {
                        status = { text: `منسحب (منذ ${checkInTime})`, class: 'absent' };
                        if (currentUser.role === 'ادارة العمليات' || currentUser.role === 'مشرف') {
            guardsStatusHtml += `<div class="attendance-card ${status.class}"><div><span>${guard.name}</span><p class="time">${projectDisplay || ''} / ${guard.location || ''}</p></div><div style="display: flex; align-items: center; gap: 10px;"><span class="status-text">${status.text}</span>${actionButton}${directiveButton}${adminEditButton}</div></div>`;
        }
        container.innerHTML = `<div class="attendance-list">${guardsStatusHtml}</div>`;
    } catch (err) {
        container.innerHTML = `<p style="color: red;">حدث خطأ: ${err.message}</p>`;
        console.error("Diagnostic: Guard Attendance Error:", err);
    }
}
// ==========================================================
// ===    نهاية الاستبدال الكامل لدالة loadGuardAttendancePage    ===
// ==========================================================
// نهاية الاستبدال
// ========= بداية الاستبدال الكامل للدالة (مع رابط الشعار المحدث) =========
        const { data: attendanceRecords, error: e2 } = await supabaseClient.from('attendance').select('guard_id, status').gte('created_at', yesterday);
        if (e2) throw e2;

        // --- الخطوة الجديدة: جلب الحراس الذين تم إنشاء تغطية لهم بالفعل ---
        const { data: coveredShifts, error: e3 } = await supabaseClient.from('coverage_shifts').select('covered_user_id').not('covered_user_id', 'is', null);
        if (e3) throw e3;
        const coveredGuardIds = new Set(coveredShifts.map(s => s.covered_user_id));
        // --- نهاية الخطوة الجديدة ---

        const now = new Date();
        const currentDay = now.toLocaleString('en-US', { weekday: 'short' });
        const uncoveredGuards = [];

        for (const guard of guards) {
            // --- هنا التعديل: التأكد من أن الحارس لم يتم تغطيته بعد ---
            if (coveredGuardIds.has(guard.id)) {
                continue; // تخطي هذا الحارس لأنه مغطى بالفعل
            }

            const shift = guard.job_vacancies?.schedule_details?.[0];
            if (shift && shift.days && shift.days.includes(currentDay)) {
                const latestAttendance = attendanceRecords.find(r => r.guard_id === guard.id);
                if (!latestAttendance || (latestAttendance.status !== 'حاضر' && latestAttendance.status !== 'اكمل المناوبة')) {
                    const startTime = new Date(now);
                    const [startHours, startMinutes] = shift.start_time.split(':');
                    startTime.setHours(startHours, startMinutes, 0, 0);
                    if (now >= startTime) {
                        uncoveredGuards.push({ guard, shift });
                    }
                }
            }
        }

        if (uncoveredGuards.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">لا يوجد غياب أو نقص حالياً.</p>';
            return;
        }

        container.innerHTML = '';
        uncoveredGuards.forEach(({ guard, shift }) => {
// --- دالة لبناء واجهة صفحة الحضور للحارس مع التحقق من الحالة (نسخة مصححة) ---
// ==================== بداية الاستبدال ====================
async function loadAttendancePage() {
    const attendanceContent = document.querySelector('#page-attendance');
    attendanceContent.innerHTML = `
        <div class="page-header"><h3>تسجيل الحضور والانصراف</h3></div>
        <div class="attendance-card">
            <div id="attendance-status" class="attendance-status-text"><p>جاري التحقق من حالتك...</p></div>
            <div id="attendance-actions">
                <button id="check-in-btn" class="btn btn-success btn-lg hidden">تسجيل حضور</button>
                <button id="check-out-btn" class="btn btn-danger btn-lg hidden">تسجيل انصراف</button>
            </div>
        document.getElementById('attendance-status').innerHTML = '<p>الرجاء تسجيل الدخول أولاً.</p>';
        return;
    }

    try {
        const { data: openRecord, error: attendanceError } = await supabaseClient
            .from('attendance')
            .select('id, created_at, status')
            .eq('guard_id', currentUser.id)
            .is('checkout_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (attendanceError && attendanceError.code !== 'PGRST116') {
            throw attendanceError;
        }

        const statusText = document.getElementById('attendance-status');
        const checkInBtn = document.getElementById('check-in-btn');
        const checkOutBtn = document.getElementById('check-out-btn');

        if (openRecord) {
            const clockInTime = new Date(openRecord.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

            if (openRecord.status === 'انسحاب') {
                statusText.innerHTML = `<p style="color: var(--denied-color);">حالتك الحالية: <strong>منسحب</strong>. يرجى التواصل مع مشرفك.</p>`;
                stopPersistentTracking();
            } else {
                statusText.innerHTML = `<p>حالتك الحالية: <strong>مسجل حضور</strong> منذ الساعة ${clockInTime}</p>`;
                checkOutBtn.classList.remove('hidden');
                checkOutBtn.dataset.attendanceId = openRecord.id;

                // --- هنا التعديل المهم: استخدام نفس طريقة جلب البيانات الناجحة ---
                const { data: fullUser, error: userError } = await supabaseClient
                    .from('users')
                    .select('*, job_vacancies:job_vacancies!users_vacancy_id_fkey(*, contracts(*))')
                    .eq('id', currentUser.id)
                    .single();

                if (userError || !fullUser || !fullUser.job_vacancies) {
            statusText.innerHTML = `<p>حالتك الحالية: <strong>لم تسجل حضور بعد</strong></p>`;
            checkInBtn.classList.remove('hidden');
            stopPersistentTracking();
        }
    } catch (error) {
        document.getElementById('attendance-status').innerHTML = `<p style="color: var(--denied-color);">${error.message}</p>`;
        console.error("Attendance Page Error:", error);
        stopPersistentTracking();
    }
}
// دالة لجلب وعرض إحصائيات الخريطة
// ==========================================================
// ===   بداية الاستبدال الكامل لدالة loadMapStatistics   ===
// ==========================================================
async function loadMapStatistics() {
    const presentEl = document.getElementById('map-stats-present');
    const scheduledEl = document.getElementById('map-stats-scheduled');
    const coverageEl = document.getElementById('map-stats-coverage');
    const vacanciesEl = document.getElementById('map-stats-vacancies');

    if (!presentEl || !currentUser) return;

    presentEl.textContent = '...';
    scheduledEl.textContent = '...';
    coverageEl.textContent = '...';
    vacanciesEl.textContent = '...';

    try {
        let baseQuery = supabaseClient.from('users').select('id, job_vacancies!users_vacancy_id_fkey(schedule_details)');

        if (currentUser.role === 'ادارة العمليات') {
            baseQuery = baseQuery.eq('region', currentUser.region);
        } else if (currentUser.role === 'مشرف') {
            baseQuery = createProjectFilter(baseQuery, currentUser.project);
        }

        const { data: scheduledUsers, error: e1 } = await baseQuery.eq('role', 'حارس أمن').eq('employment_status', 'اساسي');
        if (e1) throw e1;

        const currentDay = new Date().toLocaleString('en-US', { weekday: 'short' });
        const scheduledTodayUsers = scheduledUsers.filter(user => 
            user.job_vacancies?.schedule_details?.[0]?.days.includes(currentDay)
        );
        scheduledEl.textContent = scheduledTodayUsers.length;
        
        const scheduledTodayIds = scheduledTodayUsers.map(u => u.id);

        if (scheduledTodayIds.length > 0) {
            const { count: presentCount, error: e2 } = await supabaseClient
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .in('guard_id', scheduledTodayIds)
                .eq('status', 'حاضر');
            if (e2) throw e2;
            presentEl.textContent = presentCount || 0;
        } else {
            presentEl.textContent = 0;
        }

        let coverageQuery = supabaseClient.from('users').select('*', { count: 'exact', head: true }).eq('employment_status', 'تغطية');
        if (currentUser.role === 'ادارة العمليات') coverageQuery = coverageQuery.eq('region', currentUser.region);
        if (currentUser.role === 'مشرف') coverageQuery = createProjectFilter(coverageQuery, currentUser.project);
        const { count: coverageCount, error: e3 } = await coverageQuery;
        if (e3) throw e3;
        coverageEl.textContent = coverageCount || 0;

        let vacancyQuery = supabaseClient.from('job_vacancies').select('*', { count: 'exact', head: true }).eq('status', 'open');
        if (currentUser.role === 'ادارة العمليات') vacancyQuery = vacancyQuery.eq('region', currentUser.region);
        
        // -- بداية التعديل: استخدام طريقة الفلترة الصحيحة للشواغر --
        if (currentUser.role === 'مشرف') {
            // نستخدم .in() للبحث عن المشاريع (لأن عمود المشروع نصي وليس قائمة)
            vacancyQuery = vacancyQuery.in('project', currentUser.project);
        }
        // -- نهاية التعديل --

        const { count: vacancyCount, error: e4 } = await vacancyQuery;
        if (e4) throw e4;
        vacanciesEl.textContent = vacancyCount || 0;

    } catch(error) {
        console.error("Failed to load map statistics:", error);
        presentEl.textContent = 'خطأ';
    }
}
// ==========================================================
// ===    نهاية الاستبدال الكامل لدالة loadMapStatistics    ===
// ==========================================================
async function startPersistentTracking(fullUser, attendanceId) {
    stopPersistentTracking(); // إيقاف أي مؤقت قديم أولاً

                        await supabaseClient.from('attendance').update({ status: 'انسحاب', checkout_at: new Date() }).eq('id', attendanceId);
                        loadAttendancePage();
                    }
                },
                handleTrackingError,
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        };

        // قم بتشغيل الدالة مرة واحدة فوراً
        const { data: presentAttendance, error: attendanceError } = await supabaseClient
            .from('attendance')
            .select('guard_id')
            .eq('status', 'حاضر');

        if (attendanceError) throw attendanceError;
        if (!presentAttendance || presentAttendance.length === 0) {
            console.log("No guards are currently checked in.");
            return;
        }

        const presentGuardIds = presentAttendance.map(att => att.guard_id);

        const { data: presentGuards, error: guardsError } = await supabaseClient
            .from('users')
        mapSubscription = supabaseClient.channel('public-locations-and-attendance')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance' }, (payload) => {
                if (payload.new.checkout_at && guardMarkers.has(payload.new.guard_id)) {
                    const markerToRemove = guardMarkers.get(payload.new.guard_id);
                    markersLayer.removeLayer(markerToRemove);
                    guardMarkers.delete(payload.new.guard_id);
                }
            })
            .subscribe();

    } catch (error) {
        console.error('خطأ في جلب مواقع الحراس:', error);
    }
}
// ==========================================================
// ===    نهاية الاستبدال الكامل لدالة initializeMap    ===
// ==========================================================
// ========= نهاية الاستبدال الكامل للدالة =========
// ------------------------------------
// ------------------------------------

// ------------------------------------

// --- الخطوة 14: دالة لجلب وعرض الجداول والمناوبات ---
async function fetchSchedules() {
    const schedulesContent = document.querySelector('#page-schedules');
    schedulesContent.innerHTML = '<p style="text-align: center;">جاري تحميل الجداول...</p>';

    const { data: schedules, error } = await supabaseClient
        .from('schedules')
        .select(`
            start_time,
            end_time,
            users ( name ),
            clients ( name )
        `)
        .order('start_time', { ascending: true }); // ترتيب المناوبات حسب وقت البداية

    if (error) {
        console.error('خطأ في جلب الجداول:', error);
        schedulesContent.innerHTML = '<p style="text-align: center;">حدث خطأ أثناء تحميل الجداول.</p>';
        return;
    }

    if (schedules.length === 0) {
        schedulesContent.innerHTML = '<p style="text-align: center;">لا توجد مناوبات مجدولة حالياً.</p>';
        return;
    }

    schedulesContent.innerHTML = ''; // مسح رسالة التحميل

    // تجميع المناوبات حسب اليوم
    const groupedByDay = schedules.reduce((acc, schedule) => {
        const date = new Date(schedule.start_time).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(schedule);
        return acc;
    }, {});

    // إنشاء كود HTML لكل مجموعة يوم
    for (const day in groupedByDay) {
        const dayContainer = document.createElement('div');
        dayContainer.className = 'schedule-day-group';

        let dayHtml = `<h3>${day}</h3><div class="shifts-container">`;

        groupedByDay[day].forEach(shift => {
            const startTime = new Date(shift.start_time).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true });
            const endTime = new Date(shift.end_time).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true });

            dayHtml += `
                <div class="shift-card">
                    <div class="shift-time">${startTime} - ${endTime}</div>
                    <div class="shift-details">
                        <p><strong>الحارس:</strong> ${shift.users ? shift.users.name : 'غير محدد'}</p>
        <div class="attendance-card">
            <div>
                <span>${emp.name}</span>
                <p class="time">${emp.role} - ${emp.project || 'غير محدد'}</p>
            </div>
            <button class="btn btn-danger add-penalty-btn" data-user-id="${emp.id}" data-user-name="${emp.name}">
                <i class="ph-bold ph-minus-circle"></i> إضافة عقوبة
            </button>
        </div>
    `).join('');
    container.innerHTML = `<div class="attendance-list">${employeeCards}</div>`;
}

// بداية الاستبدال
async function loadOpsDirectivesHistory() {
    const container = document.getElementById('ops-history-list-container');
    if (!container || !currentUser) return;
    container.innerHTML = '<p style="text-align: center;">جاري تحميل السجل...</p>';

    const { data: directives, error } = await supabaseClient
        .from('directives')
        .select(`*, recipient:recipient_id (name)`)
        .eq('sender_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = '<p style="text-align: center; color: red;">حدث خطأ في جلب السجل.</p>';
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
        
        // --- هنا الجزء الجديد لعرض الملاحظات ---
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
            </div>
        `;
    }).join('');
}
// نهاية الاستبدال
// ------------------------------------

// بداية الاستبدال
async function loadMyVisitsPage() {
    const container = document.getElementById('my-visits-list-container');
    if (!container || !currentUser) return;
    container.innerHTML = '<p style="text-align: center;">جاري تحميل سجل زياراتك...</p>';

    // تصحيح: تم تغيير الربط من clients إلى contracts
    const { data: visits, error } = await supabaseClient
        .from('visits')
        .select(`*, contracts (company_name)`) // الربط مع العقود
        .eq('user_id', currentUser.id)
        .order('visit_time', { ascending: false });

    if (error) {
        container.innerHTML = '<p style="text-align: center; color: red;">حدث خطأ في جلب السجل.</p>';
        return console.error(error);
    }

    if (visits.length === 0) {
        container.innerHTML = '<p style="text-align: center;">لم تقم بتسجيل أي زيارات بعد.</p>';
        return;
    }

    container.innerHTML = visits.map(visit => {
        const visitTimestamp = new Date(visit.visit_time);
        const visitDate = visitTimestamp.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });
        const visitTime = visitTimestamp.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' });

            <div class="attendance-accordion" style="margin-bottom: 20px;">
                <details open>
                    <summary style="font-size: 1.3rem;">
                            <div class="attendance-card">
                                <span>${applicant.applicant_data.full_name}</span>
                                <div>
                                    <button class="btn btn-secondary btn-sm view-applicant-details-btn" data-appid="${applicant.id}">عرض التفاصيل</button>
                                    <button class="btn btn-success btn-sm nominate-applicant-btn" data-appid="${applicant.id}" data-vid="${vacancyId}">
                                        <i class="ph-bold ph-check-fat"></i> ترشيح
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </details>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', groupHtml);
    }
}
// نهاية الإضافة


// بداية الإضافة
async function loadOpsNomineesPage() {
    const container = document.getElementById('ops-nominees-container');
    if (!container || !currentUser || !currentUser.region) return;
    container.innerHTML = '<p style="text-align: center;">جاري تحميل المرشحين...</p>';

    // -- بداية التعديل: فلترة حسب منطقة المدير --
    const { data: applications, error } = await supabaseClient
        .from('job_applications')
        .select(`*, 
            guardsContainer.innerHTML = guards.map(guard => `<div class="attendance-card"><div><span>${guard.name}</span><p class="time">${guard.location || 'غير محدد'}</p></div><button class="btn btn-primary open-directive-modal-btn" data-recipient-id="${guard.id}" data-recipient-name="${guard.name}"><i class="ph-bold ph-paper-plane-tilt"></i> إرسال توجيه</button></div>`).join('');
        }
    }
}
// نهاية الاستبدال

async function loadOpenVacanciesForCoverage() {
    const container = document.getElementById('open-vacancies-for-coverage-container');
    if (!container || !currentUser) return;
    container.innerHTML = '<p style="text-align: center;">جاري تحميل الشواغر...</p>';

    // --- بداية التصحيح: إضافة فلتر is_temporarily_covered ---
    let query = supabaseClient.from('job_vacancies')
        .select('*, schedule_details')
        .eq('status', 'open')
        .eq('is_temporarily_covered', false);
    // --- نهاية التصحيح ---
    
    if (currentUser.role === 'ادارة العمليات') query = query.eq('region', currentUser.region);
    else if (currentUser.role === 'مشرف') query = createProjectFilter(query, currentUser.project);

    const { data: vacancies, error } = await query;
    if (error) { container.innerHTML = '<p style="color:red">خطأ في جلب البيانات.</p>'; return; }
    if (vacancies.length === 0) { container.innerHTML = '<p>لا توجد شواغر مفتوحة حالياً.</p>'; return; }
    
    container.innerHTML = '';
    vacancies.forEach(vacancy => {
        const shift = vacancy.schedule_details ? vacancy.schedule_details[0] : {};
        const shiftData = {
            project: vacancy.project,
async function loadHrAttendanceLogPage(filters = {}) {
    const container = document.getElementById('hr-attendance-accordion-container');
    container.innerHTML = '<p style="text-align: center;">جاري تحميل السجلات...</p>';

    try {
        let query = supabaseClient.from('attendance').select(`*, users ( name, region, project, location )`).order('created_at', { ascending: false });

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
        if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
        if (filters.project) query = query.ilike('users.project', `%${filters.project}%`);
                    <th>الحارس</th><th>الحضور</th><th>الانصراف</th><th>الحالة</th>
                    ${isAdmin ? '<th>إجراء</th>' : ''}
                </tr></thead><tbody>
                ${records.map(r => `
                    <tr>
                        <td>${r.users.name}</td>
                        <td>${r.created_at ? new Date(r.created_at).toLocaleString('ar-SA') : '-'}</td>
                        <td>${r.checkout_at ? new Date(r.checkout_at).toLocaleString('ar-SA') : '-'}</td>
                        <td><span class="status ${r.status === 'حاضر' ? 'active' : 'inactive'}">${r.status}</span></td>
                        ${isAdmin ? `<td><button class="btn btn-secondary btn-sm admin-edit-attendance-btn" data-id="${r.id}" data-name="${r.users.name}"><i class="ph-bold ph-pencil-simple"></i></button></td>` : ''}
                    </tr>
                `).join('')}
                </tbody></table>
            `;
            accordionHtml += `<details open><summary>${groupName}</summary><div class="content">${recordsTable}</div></details>`;
        }
        container.innerHTML = accordionHtml || '<p>لا توجد بيانات.</p>';

    } catch (err) {
        container.innerHTML = `<p style="color: red;">حدث خطأ: ${err.message}</p>`;
        console.error("HR Attendance Log Error:", err);
    }
}


// ========= نهاية الاستبدال الكامل للدالة =========

// ========= بداية الاستبدال الكامل لدالة generatePayroll (مع خصم التأخير واستثناء الموظفين) =========
            { data: attendanceRecords, error: e2 }, { data: leaveRecords, error: e3 }, 
            { data: penalties, error: e4 }, { data: officialHolidays, error: e5 },
            { data: permissionRequests, error: e6 }, { data: overtimeRecords, error: e7 }
        ] = await Promise.all([
            supabaseClient.from('attendance').select('*').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
            supabaseClient.from('employee_requests').select('user_id, details->>start_date, details->>days').eq('request_type', 'leave').eq('status', 'مقبول'),
            supabaseClient.from('penalties').select('user_id, amount').gte('deduction_date', startDateString).lte('deduction_date', endDateString),
            supabaseClient.from('official_holidays').select('holiday_date').gte('holiday_date', startDateString).lte('holiday_date', endDateString),
            supabaseClient.from('employee_requests').select('user_id, created_at').eq('request_type', 'permission').eq('status', 'مقبول').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
            supabaseClient.from('overtime_records').select('employee_id, overtime_pay').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
        ]);

        if (e1 || e2 || e3 || e4 || e5 || e6 || e7) throw (e1 || e2 || e3 || e4 || e5 || e6 || e7);

        if (allEmployees.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align: center;">لم يتم العثور على موظفين.</p>';
            return;
        }

        const holidayDates = new Set(officialHolidays.map(h => new Date(h.holiday_date).toDateString()));
        const primaryGuards = allEmployees.filter(emp => emp.employment_status === 'اساسي');

        for (const emp of allEmployees) {
            if (emp.employment_status === 'بديل راحة') {
                // (منطق البديل يبقى كما هو)
            } else {
                const vacancy = emp.job_vacancies;
                if (!vacancy || !vacancy.schedule_details?.length) continue;
                
                const shift = vacancy.schedule_details[0];
                const fullMonthSalary = (vacancy.base_salary || 0) + (vacancy.housing_allowance || 0) + (vacancy.transport_allowance || 0) + (vacancy.other_allowances || 0);
                const dailyRate = fullMonthSalary / 30;
                const hourlyRate = dailyRate / (shift.work_hours || 8);
                
                let scheduledWorkDays = 0, restDays = 0, absentDays = 0, totalLatenessMinutes = 0;
                const empStartDate = emp.start_of_work_date ? new Date(emp.start_of_work_date) : null;
                const effectiveStartDate = (empStartDate && empStartDate > startDate) ? empStartDate : startDate;

                for (let day = new Date(effectiveStartDate); day <= endDate; day.setDate(day.getDate() + 1)) {
                    const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
                    if ((shift.days || []).includes(dayName)) {
                        scheduledWorkDays++;
                        const attendanceRecord = attendanceRecords.find(att => att.guard_id === emp.id && new Date(att.created_at).toDateString() === day.toDateString());
                        const isOnLeave = leaveRecords.some(leave => { const d = new Date(leave['details->>start_date']); return leave.user_id === emp.id && day >= d && day < new Date(d.setDate(d.getDate() + parseInt(leave['details->>days']))); });
                        
                        if (attendanceRecord) {
                            const shiftStartTime = new Date(day);
                            const [startHours, startMinutes] = shift.start_time.split(':');
                            shiftStartTime.setHours(startHours, startMinutes, 0, 0);
                            const checkinTime = new Date(attendanceRecord.created_at);
                            if (checkinTime > shiftStartTime) {
                                const latenessMs = checkinTime - shiftStartTime;
                                totalLatenessMinutes += Math.round(latenessMs / 60000);
                            }
                        } else if (!isOnLeave && !holidayDates.has(day.toDateString())) {
                            absentDays++;
                        }
                    } else { restDays++; }
                }

                // --- بداية التعديلات المطلوبة ---
                const actualWorkDays = scheduledWorkDays - absentDays;
                const totalWorkHours = actualWorkDays * (shift.work_hours || 8);
                const permissionRecords = permissionRequests.filter(req => req.user_id === emp.id);
                const withdrawalRecords = attendanceRecords.filter(att => att.guard_id === emp.id && att.status === 'انسحاب');
                const projectName = Array.isArray(emp.project) ? emp.project.join(', ') : (emp.project || '');

                const absenceDeduction = (absentDays * 2) * dailyRate;
                const latenessDeduction = (totalLatenessMinutes * (hourlyRate / 60));
                const withdrawalDeductionValue = (dailyRate * withdrawalRecords.length) + (dailyRate * 2 * withdrawalRecords.length);
                const permissionDeductionValue = dailyRate * permissionRecords.length;
                // --- نهاية التعديلات المطلوبة ---

                let grossSalary = fullMonthSalary;
                if (empStartDate && empStartDate > startDate) {
                    const daysInMonth = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
                    grossSalary = (fullMonthSalary / daysInMonth) * scheduledWorkDays;
                }
                
                const employeeOvertimeTotal = overtimeRecords.filter(o => o.employee_id === emp.id).reduce((total, o) => total + (o.overtime_pay || 0), 0);
                const otherDeductions = penalties.filter(p => p.user_id === emp.id).reduce((total, p) => total + (p.amount || 0), 0);
                const isFirstMonth = empStartDate && empStartDate >= startDate && empStartDate <= endDate;
                const uniformDeduction = isFirstMonth ? 150 : 0;
                const insuranceDeduction = emp.insurance_status === 'مسجل' ? (emp.insurance_deduction_amount || 0) : 0;
                
                const totalDeductions = absenceDeduction + latenessDeduction + otherDeductions + uniformDeduction + insuranceDeduction + withdrawalDeductionValue + permissionDeductionValue;
                const netSalary = (grossSalary + employeeOvertimeTotal) - totalDeductions;
                
                    "خصم تأخير": latenessDeduction,
                    "استئذان": permissionRecords.length, // عدد أيام الاستئذان
                    "انسحاب": withdrawalRecords.length, // عدد أيام الانسحاب
                    "ايام الغياب": absentDays,
                    "خصم الغياب": absenceDeduction,
                    "خصومات اخرى": otherDeductions,
                    "مجموع الاستقطاعات": totalDeductions,
                    "الصافي": netSalary,
                    "الايبان": emp.iban,
                    "البنك": emp.bank_name,
                });
            }
        }
        
        // (باقي الكود لعرض الجدول في الصفحة لم يتغير)
                    "خصم تأخير": 0, "مجموع الاستقطاعات": absenceDeduction, "الصافي": -absenceDeduction,
                    "الايبان": guard.iban, "البنك": guard.bank_name, "المنطقة": guard.region,
                    "المدينة": guard.city, "حالة التأمينات": guard.insurance_status
                });
            }
        });

        reportHtml += `</tbody></table></div>`;
        <div class="attendance-card" style="padding: 15px; margin-bottom: 10px;">
            <div>
                <span>${holiday.description}</span>
                <p class="time">${new Date(holiday.holiday_date).toLocaleDateString('ar-SA')}</p>
            </div>
            <button class="btn-action delete-holiday-btn" data-id="${holiday.id}" title="حذف العطلة">
                <i class="ph-bold ph-trash"></i>
            </button>
        </div>
    `).join('');
}

// --- دالة صفحة التوظيف مع تفعيل السحب والإفلات والفلترة ---
async function loadHiringPage() {
    const vacanciesContainer = document.getElementById('hiring-vacancies-container');
    const historyContainer = document.getElementById('hiring-requests-history-container');

    vacanciesContainer.innerHTML = '<p>جاري تحميل الشواغر...</p>';
    historyContainer.innerHTML = '<p>جاري تحميل طلباتك...</p>';

    // جلب البيانات بشكل متوازي
    const [
        { data: vacancies, error: e1 },
        { data: requests, error: e2 }
    ] = await Promise.all([
        supabaseClient.from('job_vacancies').select('*').eq('status', 'open'),
        supabaseClient.from('employee_requests').select('*').eq('request_type', 'hiring').eq('user_id', currentUser.id).order('created_at', { ascending: false })
    ]);

    // 1. عرض الشواغر المفتوحة
    if (e1) {
        vacanciesContainer.innerHTML = '<p style="color:red;">خطأ في تحميل الشواغر.</p>';
    } else if (vacancies.length === 0) {
        vacanciesContainer.innerHTML = '<p>لا توجد شواغر مفتوحة حالياً.</p>';
    } else {
        vacanciesContainer.innerHTML = '';
        vacancies.forEach(vacancy => {
            const cardHtml = `
            <div class="contract-card">
                <div class="contract-card-header"><h4>${vacancy.title}</h4></div>
                <div class="contract-card-body">
                    <option value="attendance">تقرير الحضور والإنصراف</option>
                    <option value="client_sites">تقرير مواقع العملاء</option>
                    <option value="visits">تقرير الزيارات الميدانية</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="date-from">من تاريخ</label>
                <input type="date" id="date-from">
            </div>
            <div class="filter-group">
                <label for="date-to">إلى تاريخ</label>
                <input type="date" id="date-to">
            </div>
            <div class="filter-group">
                <label for="supervisor-select">المشرف</label>
                <select id="supervisor-select">
                    <option value="">الكل</option>
                    ${createOptions(supervisors)}
                </select>
            </div>
            <div class="filter-group">
    // بداية الإضافة: ربط فلاتر صفحة سجل الحضور

// نهاية الإضافة
    
    // --- بداية الإضافة: تفعيل فلاتر صفحة الموظفين ---
    const employeeSearchInput = document.getElementById('employee-search-input');
    const employeeRoleFilter = document.getElementById('employee-role-filter');
    const employeeProjectFilter = document.getElementById('employee-project-filter');

    if(employeeSearchInput) {
        employeeSearchInput.addEventListener('keyup', () => {
            // نتأكد من وجود الدالة قبل استدعائها
            if (typeof loadEmployeeTabData === 'function') {
                loadEmployeeTabData();
            }
        });
    }
    if(employeeRoleFilter) {
        employeeRoleFilter.addEventListener('change', () => {
            if (typeof loadEmployeeTabData === 'function') {
                loadEmployeeTabData();
            }
        });
    }
    if(employeeProjectFilter) {
        employeeProjectFilter.addEventListener('keyup', () => {
            if (typeof loadEmployeeTabData === 'function') {
                loadEmployeeTabData();
            }
        });
    }
    // --- نهاية الإضافة ---


    console.log('DOM fully loaded and parsed. Initializing listeners.');
    // --- NEW: Check for existing session ---
    // --- NEW: Check for existing session ---
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        // إذا وجدنا مستخدم محفوظ، نستخدم بياناته
        currentUser = JSON.parse(savedUser);
        
        // تحديث الواجهة بناءً على دور المستخدم المحفوظ
        updateUIVisibility(currentUser.role);
        
        // إخفاء صفحة تسجيل الدخول وإظهار لوحة التحكم
        document.getElementById('login-page').style.display = 'none';
        document.querySelector('.dashboard-container').classList.remove('hidden');
        
        // تحديث رسالة الترحيب
        const userProfileSpan = document.querySelector('.user-profile span');
        if (userProfileSpan) userProfileSpan.textContent = `مرحباً، ${currentUser.name}`;

        displayActiveAnnouncements(); // <-- هذا هو السطر الجديد والمهم

        // افتح الصفحة الأولى المتاحة (أو الصفحة المحفوظة في الرابط، سنتعامل معها في الخطوة 3)
        const lastPageId = sessionStorage.getItem('lastVisitedPage');
        let pageToOpenLink = null;

        // تحقق إذا كان هناك صفحة محفوظة
        if (lastPageId) {
            // حاول العثور على رابط الصفحة المحفوظة
            pageToOpenLink = document.querySelector(`.sidebar-nav a[data-page="${lastPageId}"]`);
            // تأكد من أن الرابط موجود وأن المستخدم يملك صلاحية رؤيته
            if (pageToOpenLink && pageToOpenLink.parentElement.style.display !== 'none') {
                // تم العثور على صفحة صالحة، سيتم فتحها
            } else {
                // إذا كانت الصفحة المحفوظة غير صالحة (مثلاً تم تغيير صلاحيات المستخدم)، تجاهلها
                pageToOpenLink = null;
            }
        }

        // إذا لم نجد صفحة صالحة محفوظة، نعود للخيار الافتراضي (فتح أول صفحة في القائمة)
        if (!pageToOpenLink) {
            pageToOpenLink = document.querySelector('.sidebar-nav li[style*="display: block"] a');
        }

        // أخيراً، قم بفتح الصفحة التي تم تحديدها
        if (pageToOpenLink) {
            pageToOpenLink.click();
        }
    }
    // --- END: Check for existing session ---

    // --- 1. منطق التنقل بين الصفحات ---
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const pageContents = document.querySelectorAll('.page-content');
    const mainTitle = document.getElementById('main-title');

    // ==================== بداية الاستبدال ====================
// ==========================================================
// ===   بداية الاستبدال الكامل لمنطق التنقل بين الصفحات   ===
// ==========================================================
// دالة جديدة ومهمة لإعادة جلب بيانات المستخدم الحالي من قاعدة البيانات
async function refreshCurrentUser() {
    if (currentUser && currentUser.id) {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        if (data) {
            currentUser = data;
            sessionStorage.setItem('currentUser', JSON.stringify(data)); // تحديث البيانات المحفوظة
            console.log("User data refreshed:", currentUser);
        }
    }
}

navLinks.forEach(link => {
    link.addEventListener('click', async function(event) { // تم تحويلها إلى async
        event.preventDefault();
        
        // --- هنا تم إضافة السطر الجديد والمهم ---
        await refreshCurrentUser(); // نضمن تحديث بيانات المستخدم قبل فتح أي صفحة

        const targetPageId = this.dataset.page;
        if (!targetPageId) return;

        sessionStorage.setItem('lastVisitedPage', targetPageId);

        if (mapSubscription) {
            supabaseClient.removeChannel(mapSubscription);
            mapSubscription = null;
        }
        if (requestsSubscription) {
            supabaseClient.removeChannel(requestsSubscription);
            requestsSubscription = null;
        }

        mainTitle.textContent = this.querySelector('span').textContent;
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        this.classList.add('active');
        pageContents.forEach(page => page.classList.add('hidden'));

        const targetPage = document.getElementById(targetPageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }

        // استدعاء الدوال الخاصة بكل صفحة (هذا الجزء يبقى كما هو)
        if (targetPageId === 'page-clients') fetchClients();
        if (targetPageId === 'page-users') fetchUsers();
        if (targetPageId === 'page-jobs') fetchJobs();
        if (targetPageId === 'page-geo') initializeMap();
        if (targetPageId === 'page-schedules') fetchSchedules();
        if (targetPageId === 'page-coverage') loadCoveragePage();
        if (targetPageId === 'page-visits') fetchVisits();
        if (targetPageId === 'page-reports') loadReportsPage();
        if (targetPageId === 'page-attendance') loadAttendancePage();
        if (targetPageId === 'page-guard-attendance') loadGuardAttendancePage();
        if (targetPageId === 'page-patrol') loadSupervisorPatrolPage();
        if (targetPageId === 'page-contracts') fetchContracts();
        if (targetPageId === 'page-vacancies') loadVacancyTabData();
        if (targetPageId === 'page-employees') loadEmployeeTabData();
        if (targetPageId === 'page-requests-review') loadRequestsReviewPage();
        if (targetPageId === 'page-hiring') loadHiringPage();
        if (targetPageId === 'page-penalties') loadPenaltiesPage();
        if (targetPageId === 'page-coverage-requests') loadCoverageRequestsPage();
        if (targetPageId === 'page-directives-ops') loadOpsDirectivesPage();
        if (targetPageId === 'page-my-directives') loadMyDirectivesPage();
        if (targetPageId === 'page-my-visits') loadMyVisitsPage();
        if (targetPageId === 'page-my-schedule') loadMySchedulePage();
        if (targetPageId === 'page-ops-review-requests') loadOpsReviewRequestsPage();
        if (targetPageId === 'page-announcements') loadAnnouncementsPage();
        if (targetPageId === 'page-supervisor-schedules') loadSupervisorSchedulesPage();
        if (targetPageId === 'page-supervisor-permission-requests') loadSupervisorPermissionRequestsPage();
        if (targetPageId === 'page-supervisor-applications') loadSupervisorApplicationsPage();
        if (targetPageId === 'page-ops-nominees') loadOpsNomineesPage();
        if (targetPageId === 'page-admin-dashboard') loadAdminDashboardPage();
        if (targetPageId === 'page-supervisor-coverage-apps') loadSupervisorCoverageAppsPage();
        if (targetPageId === 'page-hr-ops-hiring') loadHrOpsHiringPage();
        if (targetPageId === 'page-user-management') loadUserManagementPage();
        if (targetPageId === 'page-finance-coverage') loadFinanceCoveragePage();
        if (targetPageId === 'page-official-holidays') loadHolidaysPage();
        if (targetPageId === 'page-operations-requests') loadOperationsRequestsPage();
        if (targetPageId === 'page-my-profile') loadMyProfilePage();
        if (targetPageId === 'page-leave-requests') loadLeaveRequests();
        if (targetPageId === 'page-requests-archive') loadArchivePage('leave');
        if (targetPageId === 'page-resignation-requests') loadResignationRequests();
        if (targetPageId === 'page-loan-requests') loadLoanRequests();
        if (targetPageId === 'page-hr-attendance-log') loadHrAttendanceLogPage();
// --- منطق تعديل الحضور من قبل مدير النظام (نسخة مطورة) ---

// فتح النافذة (من سجل الحضور أو صفحة المتابعة)
const editAttendanceBtn = event.target.closest('.admin-edit-attendance-btn, .admin-manual-attendance-btn');
if (editAttendanceBtn) {
    const attendanceId = editAttendanceBtn.dataset.id; // قد يكون غير موجود
    const guardId = editAttendanceBtn.dataset.guardId; // قد يكون غير موجود
    const guardName = editAttendanceBtn.dataset.name;
    const modal = document.getElementById('admin-edit-attendance-modal');

    document.getElementById('edit-attendance-title').textContent = `تعديل سجل: ${guardName}`;
    
    // إعادة تعيين الحقول
    document.getElementById('edit-attendance-id').value = '';
    document.getElementById('edit-attendance-status').value = 'حاضر';
    document.getElementById('edit-checkin-time').value = '';
    document.getElementById('edit-checkout-time').value = '';

    // دالة مساعدة لتحويل التوقيت
    const toLocalISOString = (date) => {
        if (!date) return '';
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    let record;
    if (attendanceId) { // إذا جئنا من صفحة سجل الحضور
        const { data } = await supabaseClient.from('attendance').select('*').eq('id', attendanceId).single();
        record = data;
    } else { // إذا جئنا من صفحة متابعة الحراس
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { data } = await supabaseClient.from('attendance').select('*').eq('guard_id', guardId).gte('created_at', todayStart.toISOString()).order('created_at', {ascending: false}).limit(1).single();
        record = data;
    }

    if (record) { // إذا وجدنا سجل لليوم، نعبئ البيانات
        document.getElementById('edit-attendance-id').value = record.id;
        document.getElementById('edit-attendance-status').value = record.status;
        document.getElementById('edit-checkin-time').value = toLocalISOString(record.created_at);
        document.getElementById('edit-checkout-time').value = toLocalISOString(record.checkout_at);
    } else { // إذا لم نجد سجل (حالة غياب)، نجهز لإنشاء سجل جديد
        document.getElementById('edit-attendance-id').value = ''; // فارغ للإشارة إلى أنه سجل جديد
        document.getElementById('edit-checkin-time').dataset.guardId = guardId; // نخزن هوية الحارس هنا
        document.getElementById('edit-checkin-time').dataset.guardName = guardName;
    }
    
    modal.classList.remove('hidden');
}

// حفظ التعديلات (للإنشاء والتحديث)
const saveAttendanceBtn = event.target.closest('#save-attendance-changes-btn');
if (saveAttendanceBtn) {
    const attendanceId = document.getElementById('edit-attendance-id').value;
    const checkinInput = document.getElementById('edit-checkin-time');
    
    const updateData = {
        status: document.getElementById('edit-attendance-status').value,
        created_at: checkinInput.value ? new Date(checkinInput.value) : null,
        checkout_at: document.getElementById('edit-checkout-time').value ? new Date(document.getElementById('edit-checkout-time').value) : null
    };

    saveAttendanceBtn.disabled = true;
    let error;

    if (attendanceId) {
        // --- وضع التحديث ---
        ({ error } = await supabaseClient.from('attendance').update(updateData).eq('id', attendanceId));
    } else {
        // --- وضع الإنشاء (للغائب) ---
        updateData.guard_id = checkinInput.dataset.guardId;
        updateData.guard_name = checkinInput.dataset.guardName;
        ({ error } = await supabaseClient.from('attendance').insert(updateData));
    }

    if (error) {
        showToast('فشل تحديث السجل.', 'error');
        console.error("Attendance edit error:", error);
    } else {
        showToast('تم تحديث السجل بنجاح.', 'success');
        document.getElementById('admin-edit-attendance-modal').classList.add('hidden');
        await supabaseClient.from('audit_logs').insert({
            user_name: currentUser.name, action_type: 'تعديل سجل حضور يدوي',
            details: { modified_record_id: attendanceId || 'new', new_status: updateData.status }
        });
        
        // تحديث الواجهة التي نحن فيها
        if (document.querySelector('#page-hr-attendance-log:not(.hidden)')) loadHrAttendanceLogPage();
        if (document.querySelector('#page-guard-attendance:not(.hidden)')) loadGuardAttendancePage();
    }
    saveAttendanceBtn.disabled = false;
}

// --- منطق زر إعادة تعيين كلمة المرور ---
const resetPasswordBtn = event.target.closest('.admin-reset-password-btn');
if (resetPasswordBtn) {
    const authUserId = resetPasswordBtn.dataset.authId;
    const newPassword = prompt("الرجاء إدخال كلمة المرور الجديدة للمستخدم (6 أحرف على الأقل):");

    if (newPassword && newPassword.length >= 6) {
        if (confirm(`هل أنت متأكد من تغيير كلمة المرور؟`)) {
            resetPasswordBtn.disabled = true;

            const { data, error } = await supabaseClient.functions.invoke('update-employee-password', {
                body: { auth_id: authUserId, new_password: newPassword }
            });

            if (error || data.error) {
                showToast(error?.message || data.error, 'error');
            } else {
                showToast('تم تحديث كلمة المرور بنجاح!', 'success');
            }

            resetPasswordBtn.disabled = false;
        }
    } else if (newPassword) {
        alert('كلمة المرور قصيرة جدًا.');
    }
}


// --- منطق زر تسجيل الدخول كمستخدم آخر ---
const loginAsBtn = event.target.closest('.admin-login-as-btn');
if (loginAsBtn) {
    const targetUserId = loginAsBtn.dataset.userId;
    const targetUserName = loginAsBtn.dataset.userName;
    if (confirm(`هل أنت متأكد من رغبتك في تسجيل الدخول بحساب "${targetUserName}"؟`)) {
        try {
            // 1. حفظ جلسة المدير الحالية
            const { data: { session } } = await supabaseClient.auth.getSession();
            localStorage.setItem('admin_session', JSON.stringify(session));

            // 2. استدعاء الوظيفة الخلفية للحصول على توكن مؤقت
            const { data, error } = await supabaseClient.functions.invoke('admin-impersonate', {
                body: { target_user_id: targetUserId }
            });

            if (error || data.error) throw new Error(error?.message || data.error);

            // 3. استخدام التوكن المؤقت لتسجيل الدخول
            await supabaseClient.auth.setSession({
                access_token: data.access_token,
                refresh_token: session.refresh_token // يمكن استخدام نفس الرفرش توكن
            });

            // 4. إعادة تحميل الصفحة
// --- عند الضغط على زر "تسجيل حضور" (مع التحقق من النطاق الجغرافي) ---
// بداية الاستبدال

// ==========================================================
// ===   بداية الاستبدال الكامل لمنطق زر تسجيل الحضور   ===
// ==========================================================
if (event.target.closest('#check-in-btn')) {
    const checkInBtn = event.target.closest('#check-in-btn');
    checkInBtn.disabled = true;
    checkInBtn.innerHTML = '<i class="ph-fill ph-spinner-gap animate-spin"></i> التحقق...';

        checkInBtn.innerHTML = 'تسجيل حضور';
    };

    try {
        if (!currentUser.vacancy_id) throw new Error('أنت غير معين على شاغر وظيفي حالياً.');
        
        // --- بداية التعديل 1: جلب كل البيانات المطلوبة من الشاغر ---
        const { data: vacancy, error: e1 } = await supabaseClient
            .from('job_vacancies')
                const { error: insertError } = await supabaseClient.from('attendance').insert({
                    guard_id: currentUser.id,
                    guard_name: currentUser.name,
                    vacancy_id: currentUser.vacancy_id,
                    project: vacancy.project,
                    throw new Error('حدث خطأ أثناء محاولة تسجيل حضورك في قاعدة البيانات.');
                }
                
                showCustomAlert('نجاح', 'تم تسجيل حضورك بنجاح.', 'success');
                loadAttendancePage();
            } catch (innerError) {
                showCustomAlert('خطأ', innerError.message, 'error');
                checkInBtn.disabled = false;
                checkInBtn.innerHTML = 'تسجيل حضور';
            }
        checkInBtn.innerHTML = 'تسجيل حضور';
    }
}

// نهاية الاستبدال


// --- منطق أزرار تعيين التغطية لمدير العمليات ---
    const assignCoverageBtn = event.target.closest('.assign-coverage-btn');
    if (assignCoverageBtn) {
        const type = assignCoverageBtn.dataset.type;
        const shiftId = assignCoverageBtn.dataset.shiftId;

        assignCoverageBtn.disabled = true;

        try {
            if (type === 'external') {
                const applicantId = assignCoverageBtn.dataset.applicantId;
                if (!confirm('هل أنت متأكد؟ سيتم رفع طلب هذا المرشح للموارد البشرية.')) return;

                await supabaseClient.from('coverage_applicants').update({ status: 'pending_hr' }).eq('id', applicantId);
                await supabaseClient.from('coverage_shifts').update({ status: 'closed' }).eq('id', shiftId);
                alert('تم رفع الطلب بنجاح.');

            } else if (type === 'overtime' || type === 'direct') {
                const employeeId = assignCoverageBtn.dataset.employeeId;
                const overtimePay = parseFloat(assignCoverageBtn.dataset.pay);
                if (!confirm(`هل أنت متأكد من تعيين هذا الموظف؟ سيتم تسجيل ${overtimePay} ر.س كعمل إضافي له.`)) return;
                
                // تسجيلها في جدول العمل الإضافي
                await supabaseClient.from('overtime_records').insert({
                    employee_id: employeeId,
                    coverage_shift_id: shiftId,
                    overtime_pay: overtimePay,
                    approved_by: currentUser.id
                });
                
                // إغلاق الوردية
                await supabaseClient.from('coverage_shifts').update({ status: 'closed' }).eq('id', shiftId);
                
                // رفض باقي المتقدمين (إن وجدوا)
                await supabaseClient.from('coverage_applicants').update({ status: 'rejected', rejection_reason: 'تم اختيار موظف آخر للتغطية' }).eq('shift_id', shiftId);

                alert('تم تعيين الموظف للتغطية بنجاح.');
            }

            // تحديث الواجهة
            loadCoveragePage();
            document.getElementById('coverage-details-panel').innerHTML = '<p style="text-align: center; padding: 40px;">تمت معالجة الطلب بنجاح.</p>';

        } catch (error) {
            alert('حدث خطأ: ' + error.message);
        } finally {
            assignCoverageBtn.disabled = false;
        }
    }


// --- عند الضغط على فرصة تغطية لعرض تفاصيلها ---
    const coverageItem = event.target.closest('.coverage-shift-item');
    if (coverageItem) {
        // إزالة التحديد من جميع العناصر وإضافته للعنصر المحدد
        document.querySelectorAll('.coverage-shift-item').forEach(item => item.style.borderColor = 'var(--border-color)');
        coverageItem.style.borderColor = 'var(--accent-color)';
        
        const shiftData = JSON.parse(coverageItem.dataset.shiftId);
        displayCoverageDetails(shiftData);
    }


// --- منطق أزرار مراجعة طلبات التغطية لمدير العمليات ---
    // --- منطق أزرار مراجعة طلبات التغطية لمدير العمليات (النسخة الجديدة مع الاعتماد النهائي) ---
// --- منطق أزرار مراجعة طلبات التغطية لمدير العمليات ---
const opsCoverageBtn = event.target.closest('.ops-coverage-action-btn');
if (opsCoverageBtn) {
    const applicantId = opsCoverageBtn.dataset.applicantId;
    const shiftId = opsCoverageBtn.dataset.shiftId;
    const action = opsCoverageBtn.dataset.action;

    opsCoverageBtn.disabled = true;

    try {
        if (action === 'approve_employee') {
            if (!confirm('هل أنت متأكد؟ سيتم تعيين هذا الموظف للتغطية كعمل إضافي.')) { opsCoverageBtn.disabled = false; return; }
            
            const { data: shift, error: e1 } = await supabaseClient.from('coverage_shifts').select('coverage_pay').eq('id', shiftId).single();
            const { data: applicant, error: e2 } = await supabaseClient.from('coverage_applicants').select('applicant_user_id').eq('id', applicantId).single();
            if (e1 || e2) throw new Error('فشل جلب البيانات.');

            await supabaseClient.from('overtime_records').insert({
                employee_id: applicant.applicant_user_id,
                coverage_shift_id: shiftId,
                overtime_pay: shift.coverage_pay,
                approved_by: currentUser.id
            });
            
            await supabaseClient.from('coverage_applicants').update({ status: 'ops_final_approved' }).eq('id', applicantId);
            await supabaseClient.from('coverage_shifts').update({ status: 'closed' }).eq('id', shiftId);
            showToast('تم تعيين الموظف للتغطية بنجاح.', 'success');

        } else if (action === 'approve_external') {
            if (!confirm('هل أنت متأكد؟ سيتم إنشاء حساب مؤقت للمتقدم وإغلاق هذه التغطية.')) { opsCoverageBtn.disabled = false; return; }
            
            // --- هنا التصحيح: تم إضافة shift_id للبيانات المرسلة ---
            const { data, error } = await supabaseClient.functions.invoke('assign-coverage-guard', {
                body: { 
                    applicant_id: applicantId,
                    shift_id: shiftId 
                }
            });
        
            if (error || data.error) {
                throw new Error(error?.message || data.error);
            }
            
            await supabaseClient.from('coverage_shifts').update({ status: 'closed' }).eq('id', shiftId);

            showToast('تم اعتماد المتقدم وتسكينه بنجاح. تم إغلاق التغطية.', 'success');

        } else if (action === 'reject') {
            const reason = prompt('الرجاء كتابة سبب الرفض:');
            if (reason) {
                await supabaseClient.from('coverage_applicants').update({ status: 'rejected', rejection_reason: reason }).eq('id', applicantId);
                showToast('تم رفض الطلب.', 'success');
            }
        }
        
        loadCoverageRequestsPage(); // إعادة تحميل الصفحة

    } catch (error) {
        showToast(`حدث خطأ: ${error.message}`, 'error');
    } finally {
        opsCoverageBtn.disabled = false;
    }
}


// --- عند الضغط على زر "ترشيح" متقدم للتغطية ---
    const nominateCoverageBtn = event.target.closest('.nominate-coverage-applicant-btn');
    if (nominateCoverageBtn) {
        const applicationId = nominateCoverageBtn.dataset.appid;
        const shiftId = nominateCoverageBtn.dataset.shiftid;

        if (!confirm('هل أنت متأكد من ترشيح هذا المتقدم؟ سيتم إرسال طلبه لمدير العمليات وإخفاء باقي المتقدمين.')) return;

        nominateCoverageBtn.disabled = true;
        nominateCoverageBtn.textContent = 'جاري...';

        try {
            // 1. تحديث حالة المتقدم المرشح إلى "بانتظار موافقة العمليات"
            const { error: e1 } = await supabaseClient.from('coverage_applicants')
                .update({ status: 'pending_ops', supervisor_approver_id: currentUser.id })
                .eq('id', applicationId);
            if (e1) throw e1;
            
            // 2. تحديث حالة باقي المتقدمين لنفس الوردية إلى "لم يتم الترشيح"
            const { error: e2 } = await supabaseClient.from('coverage_applicants')
                .update({ status: 'not_nominated' })
                .eq('shift_id', shiftId)
                .not('id', 'eq', applicationId);
            if (e2) console.warn("Could not update other applicants:", e2);

            alert('تم ترشيح المتقدم بنجاح!');
            loadSupervisorCoverageAppsPage(); // إعادة تحميل الصفحة

        } catch (error) {
            alert('حدث خطأ أثناء عملية الترشيح: ' + error.message);
        } finally {
            nominateCoverageBtn.disabled = false;
            nominateCoverageBtn.textContent = 'ترشيح';
        }
    }

// --- عند الضغط على زر "عرض تفاصيل العقد" ---
if (event.target.closest('.view-contract-btn')) {
    const contractId = event.target.closest('.view-contract-btn').dataset.id;
    const modal = document.getElementById('view-contract-modal');
    const body = document.getElementById('contract-view-body');
    const title = document.getElementById('view-contract-title');

    modal.classList.remove('hidden');
    body.innerHTML = '<p style="text-align: center;">جاري تحميل البيانات...</p>';

    const { data: contract, error } = await supabaseClient
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

    if (error || !contract) {
        body.innerHTML = '<p style="color:red;">حدث خطأ في جلب بيانات العقد.</p>';
        return;
    }

    title.textContent = `تفاصيل عقد: ${contract.company_name}`;

    let detailsHtml = `
        <div class="contract-display">
            <h3>المعلومات الأساسية</h3>
            <p><strong>اسم المشروع:</strong> ${contract.company_name || 'غير محدد'}</p>
            <p><strong>تاريخ نهاية العقد:</strong> ${contract.end_date ? new Date(contract.end_date).toLocaleDateString('ar-SA') : 'غير محدد'}</p>
            <p><strong>المنطقة:</strong> ${contract.region || 'غير محدد'}</p>
            <p><strong>المدينة:</strong> ${(contract.city || []).join('، ') || 'غير محدد'}</p>
            <hr>
            <h3>المواقع والورديات</h3>
        </div>
    `;

// زر البحث في صفحة سجل الحضور (هذا هو المكان الصحيح له)
    if (event.target.id === 'hr-attendance-search-btn') {
        const filters = {
            dateFrom: document.getElementById('hr-attendance-from').value,
            dateTo: document.getElementById('hr-attendance-to').value,
            status: document.getElementById('hr-attendance-status').value,
            project: document.getElementById('hr-attendance-project').value,
            location: document.getElementById('hr-attendance-location').value
        };
        // تعديل تاريخ "إلى" ليشمل اليوم كاملاً
        if (filters.dateTo) {
            let toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            filters.dateTo = toDate.toISOString();
        }
        loadHrAttendanceLogPage(filters);
    }
   

    // --- بداية الإضافة: منطق البحث في الخريطة ---
    const mapSearchBtn = event.target.closest('#map-search-btn');
    if (mapSearchBtn) {
        const searchTerm = document.getElementById('map-search-input').value.toLowerCase();
        if (!searchTerm) return;

        const foundGuard = allGuardsOnMap.find(g => g.name.toLowerCase().includes(searchTerm));
        
        if (foundGuard && guardMarkers.has(foundGuard.id)) {
            const marker = guardMarkers.get(foundGuard.id);
            map.setView(marker.getLatLng(), 16); // تقريب الخريطة على الحارس
            marker.openPopup(); // فتح النافذة المنبثقة
        } else {
            alert('لم يتم العثور على حارس بهذا الاسم.');
        }
    }
    // --- نهاية الإضافة ---

    // --- بداية الإضافة: منطق فتح نافذة الإرسال للجميع ---
const sendToAllBtn = event.target.closest('#send-to-all-guards-btn');
if (sendToAllBtn) {
    const modal = document.getElementById('send-directive-modal');
    document.getElementById('send-directive-modal-title').textContent = 'إرسال توجيه لجميع الحراس';
    // نستخدم "all" كقيمة خاصة لتمييز الإرسال الجماعي
    document.getElementById('directive-recipient-id').value = 'all';
    document.getElementById('directive-content').value = '';
    modal.classList.remove('hidden');
}
// --- نهاية الإضافة ---

// --- منطق فتح نافذة إضافة عقوبة ---
    const addPenaltyBtn = event.target.closest('.add-penalty-btn');
    if (addPenaltyBtn) {
        const modal = document.getElementById('add-penalty-modal');
        const userId = addPenaltyBtn.dataset.userId;
        const userName = addPenaltyBtn.dataset.userName;

        document.getElementById('penalty-modal-title').textContent = `إضافة عقوبة جديدة لـ: ${userName}`;
        document.getElementById('penalty-user-id').value = userId;
        document.getElementById('penalty-reason').value = '';
        document.getElementById('penalty-amount').value = '';
        document.getElementById('penalty-date').valueAsDate = new Date(); // التاريخ الافتراضي هو اليوم
        modal.classList.remove('hidden');
    }

    // --- منطق حفظ العقوبة ---
    const savePenaltyBtn = event.target.closest('#save-penalty-btn');
    if (savePenaltyBtn) {
        const penaltyData = {
            user_id: document.getElementById('penalty-user-id').value,
            reason: document.getElementById('penalty-reason').value,
            amount: parseFloat(document.getElementById('penalty-amount').value) || 0,
            deduction_date: document.getElementById('penalty-date').value
        };

        if (!penaltyData.reason || penaltyData.amount <= 0 || !penaltyData.deduction_date) {
            return alert('الرجاء تعبئة جميع الحقول بشكل صحيح.');
        }

        savePenaltyBtn.disabled = true;
        savePenaltyBtn.textContent = 'جاري الحفظ...';

        const { error } = await supabaseClient.from('penalties').insert(penaltyData);
        if (error) {
            alert('حدث خطأ أثناء حفظ العقوبة: ' + error.message);
        } else {
            alert('تم تسجيل العقوبة بنجاح!');
            document.getElementById('add-penalty-modal').classList.add('hidden');
        }
        
        savePenaltyBtn.disabled = false;
        savePenaltyBtn.textContent = 'حفظ وتطبيق الخصم';
    }

    // --- منطق تغيير كلمة المرور ---
const changePasswordBtn = event.target.closest('#change-password-btn');
if (changePasswordBtn) {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;

    // التحقق من صحة المدخلات
    if (!newPassword || newPassword.length < 6) {
        return alert('كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف.');
    }
    if (newPassword !== confirmPassword) {
        return alert('كلمتا المرور غير متطابقتين.');
    }

    changePasswordBtn.disabled = true;
    changePasswordBtn.textContent = 'جاري التحديث...';

    try {
        // استخدام الدالة الرسمية من Supabase لتحديث كلمة مرور المستخدم الحالي
        const { data, error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        alert('تم تحديث كلمة المرور بنجاح!');
        // إفراغ الحقول بعد النجاح
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-new-password').value = '';

    } catch (error) {
        alert(`حدث خطأ أثناء تحديث كلمة المرور: ${error.message}`);
    } finally {
        changePasswordBtn.disabled = false;
        changePasswordBtn.textContent = 'تحديث كلمة المرور';
    }
}

// ========= بداية الاستبدال =========
    // الحالة الأولى: الزر قادم من صفحة "حضور الحراس" ويحتوي على بيانات وردية
    if (addToCoverageBtn.dataset.shift) {
        const shiftData = JSON.parse(addToCoverageBtn.dataset.shift);

        // تعبئة النافذة ببيانات الوردية للغائب
        document.getElementById('coverage-start-time').value = shiftData.start_time || '';
        document.getElementById('coverage-end-time').value = shiftData.end_time || '';
        document.getElementById('coverage-pay').value = ''; // يترك فارغاً لمدير العمليات
        document.getElementById('coverage-reason').value = 'غياب'; // سبب افتراضي
        
        // حفظ بيانات الوردية الأصلية كاملة
        document.getElementById('coverage-original-shift-details').value = JSON.stringify(shiftData);
        modal.classList.remove('hidden');

    } 
    // الحالة الثانية: الزر قادم من صفحة "التوظيف" ويحتوي على هوية الشاغر
    else if (addToCoverageBtn.dataset.id) { 
        const vacancyId = addToCoverageBtn.dataset.id;
        
        // جلب بيانات الشاغر من قاعدة البيانات
        const { data: vacancy, error } = await supabaseClient
            .from('job_vacancies')
    // --- NEW: Attendance Check-in/Check-out Logic (نسخة مصححة) ---
    const checkInBtn = event.target.closest('#check-in-btn');
    const checkOutBtn = event.target.closest('#check-out-btn');



// عند الضغط على زر "تسجيل انصراف"
// ==================== بداية الاستبدال ====================
// عند الضغط على زر "تسجيل انصراف"
if (checkOutBtn) {
    if (confirm('هل أنت متأكد من أنك تريد تسجيل الانصراف الآن؟')) {

        // تعطيل الزر لمنع الضغطات المتكررة وعرض مؤشر التحميل
        checkOutBtn.disabled = true;
        checkOutBtn.innerHTML = '<i class="ph-fill ph-spinner-gap animate-spin"></i> جاري ...';

            .from('attendance')
            .update({
                checkout_at: new Date(),
                status: 'اكمل المناوبة'
            })
            .eq('id', checkOutBtn.dataset.attendanceId);

        // ثالثاً: إبلاغ المستخدم بالنتيجة الحقيقية
        if (error) {
            alert('فشل تسجيل الانصراف. سيتم تحديث الواجهة لتعكس الحالة الصحيحة.');
            console.error('Checkout Error:', error);
        } else {
            alert('تم تسجيل انصرافك بنجاح.');
        }

        // رابعاً (الأهم): دائماً نُعيد تحميل الواجهة من قاعدة البيانات
        // لضمان عرض الحالة الصحيحة 100%
        loadAttendancePage(); 
    }
}
// ===================== نهاية الاستبدال =====================
// ===================== نهاية الاستبدال =====================
// ===================== نهاية الاستبدال =====================
// ===================== نهاية الاستبدال =====================

    // عند الضغط على زر "تسجيل انصراف"
    // ==================== بداية الاستبدال ====================
// عند الضغط على زر "تسجيل انصراف"

// ===================== نهاية الاستبدال =====================
// --- NEW: Guard Request Submission Logic ---
    // بداية الاستبدال

    const submitRequestBtn = event.target.closest('.btn-submit-request');
    if (submitRequestBtn) {
        event.preventDefault();
        
        const requestType = submitRequestBtn.dataset.requestType;
        if (!requestType || !currentUser) return;

        const modal = submitRequestBtn.closest('.modal-overlay');
        let details = {};
        let isValid = true;
// --- الخطوة 31: دالة لبناء واجهة صفحة الحضور للحارس ---
// --- الخطوة 31: دالة لبناء واجهة صفحة الحضور للحارس مع التحقق من الحالة ---


// ==================== بداية الاستبدال ====================

// ------------------------------------
}
// ------------------------------------

// --- الخطوة 33: دالة لبناء واجهة صفحة "طلباتي" للحارس ---
// --- الخطوة 35: تحديث دالة "طلباتي" بتصميم جديد ---
async function loadMyRequestsPage() {
    // 1. إعادة بناء هيكل الصفحة (هذا الجزء لا يتغير)
    const requestsContent = document.querySelector('#page-my-requests');
    requestsContent.innerHTML = `
        <div class="page-header"><h3>رفع طلب جديد</h3></div>
        <div class="requests-actions-container">
            <button class="request-action-card" data-request-type="permission" style="--card-color: #0d6efd;"><i class="ph-fill ph-clock-countdown"></i><h4>طلب استئذان</h4></button>
            <button class="request-action-card" data-request-type="leave" style="--card-color: #198754;"><i class="ph-fill ph-calendar-blank"></i><h4>طلب إجازة</h4></button>
            <button class="request-action-card" data-request-type="loan" style="--card-color: #ffc107;"><i class="ph-fill ph-hand-coins"></i><h4>طلب سلفة</h4></button>
            <button class="request-action-card" data-request-type="resignation" style="--card-color: #dc3545;"><i class="ph-fill ph-file-x"></i><h4>طلب استقالة</h4></button>
        </div>
        <div class="page-header" style="margin-top: 40px;"><h3>متابعة طلباتك السابقة</h3></div>
        <div id="past-requests-list"><p style="text-align: center; padding: 20px; color: var(--text-secondary);">جاري تحميل طلباتك...</p></div>
    `;

    // 2. الوصول إلى حاوية عرض الطلبات وقائمة الطلبات السابقة
    const pastRequestsList = document.getElementById('past-requests-list');

    // 3. التحقق من وجود مستخدم مسجل دخوله
    if (!currentUser) {
        pastRequestsList.innerHTML = '<p>الرجاء تسجيل الدخول لعرض طلباتك.</p>';
        return;
    }

    // 4. جلب الطلبات الخاصة بالمستخدم الحالي من قاعدة البيانات
    const { data: requests, error } = await supabaseClient
        .from('employee_requests')
        .select('*')
        .eq('user_id', currentUser.id) // فلترة الطلبات للمستخدم الحالي فقط
        .order('created_at', { ascending: false }); // عرض الأحدث أولاً

    if (error) {
        console.error('خطأ في جلب الطلبات:', error);
        pastRequestsList.innerHTML = '<p>حدث خطأ أثناء تحميل الطلبات.</p>';
        return;
    }

    // 5. التحقق إذا لم يكن هناك طلبات
    if (requests.length === 0) {
        pastRequestsList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">لا توجد طلبات سابقة لعرضها.</p>';
        return;
    }

    // 6. مسح رسالة التحميل وتجهيز لعرض الطلبات
    pastRequestsList.innerHTML = '';

    // 7. المرور على كل طلب وإنشاء بطاقة عرض له
    requests.forEach(request => {
        // تحديد النص واللون الخاص بحالة الطلب
        let statusClass, statusText;
        switch (request.status) {
            case 'مقبول':
                statusClass = 'approved'; statusText = 'مقبول'; break;
            case 'مرفوض':
                statusClass = 'denied'; statusText = 'مرفوض'; break;
            default:
                statusClass = 'pending'; statusText = 'معلق';
        }
        
        // ترجمة نوع الطلب للعربية
        let requestTypeText;
        switch(request.request_type) {
            case 'leave': requestTypeText = 'طلب إجازة'; break;
            case 'loan': requestTypeText = 'طلب سلفة'; break;
            case 'permission': requestTypeText = 'طلب استئذان'; break;
            case 'resignation': requestTypeText = 'طلب استقالة'; break;
            default: requestTypeText = request.request_type;
        }

        const requestCard = `
            <div class="request-card">
                <div class="request-card-header">
                    <h4>${requestTypeText}</h4>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="request-card-body">
                    <p><strong>تاريخ الطلب:</strong> ${new Date(request.created_at).toLocaleDateString('ar-SA')}</p>
                    ${request.details && request.details.reason ? `<p><strong>السبب:</strong> ${request.details.reason}</p>` : ''}
                    ${request.details && request.details.days ? `<p><strong>عدد الأيام:</strong> ${request.details.days}</p>` : ''}
                    ${request.details && request.details.amount ? `<p><strong>المبلغ:</strong> ${request.details.amount} ر.س</p>` : ''}
                </div>
                ${request.status === 'مرفوض' && request.rejection_reason ? `
                <div class="request-card-footer">
                    <strong>سبب الرفض:</strong> ${request.rejection_reason}
                </div>` : ''}
            </div>
        `;
        pastRequestsList.insertAdjacentHTML('beforeend', requestCard);
    });



// نهاية الإضافة
// ==================== بداية الإضافة ====================
// ==========================================================
// ===     بداية دالة عرض الإعلانات النشطة للمستخدمين     ===
// ==========================================================

// ==========================================================
// ===      نهاية دالة عرض الإعلانات النشطة للمستخدمين      ===
// ==========================================================
// ===================== نهاية الإضافة =====================

}
// ==================== بداية كود تفعيل نافذة عرض الصورة المكبرة ====================
document.addEventListener('DOMContentLoaded', () => {

// --- منطق صفحة إدخال البيانات الجديدة ---
const dataEntryPage = document.getElementById('page-hr-data-entry');
if(dataEntryPage) {
    // زر تحميل القالب
    const downloadBtn = document.getElementById('download-template-btn');
    downloadBtn.addEventListener('click', downloadEmployeeTemplate);

    // زر رفع الملف
    const uploadBtn = document.getElementById('upload-employees-file-btn');
    const fileInput = document.getElementById('employees-file-input');
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            processEmployeeFile(file);
        }
    });
}


// --- منطق إرسال الشكوى أو الاقتراح ---
document.getElementById('feedback-form')?.addEventListener('submit', async function(event) {
    event.preventDefault();
    const content = document.getElementById('feedback-content').value;
    if (!content.trim()) return alert('الرجاء كتابة محتوى الرسالة.');

    const feedbackData = {
        user_id: currentUser?.auth_user_id || null,
        user_name: currentUser?.name || 'زائر',
        feedback_type: document.getElementById('feedback-type').value,
        content: content,
        status: 'جديدة'
    };

    const { error } = await supabaseClient.from('feedback').insert(feedbackData);
    if (error) {
        alert('حدث خطأ أثناء الإرسال.');
    } else {
        alert('تم إرسال رسالتك بنجاح. شكراً لك.');
        document.getElementById('feedback-modal').classList.add('hidden');
        this.reset();
    }
});

    
    // لا تفعل شيئاً إذا لم نجد هذه العناصر (لأن الكود قد يعمل في صفحات أخرى)
    const imageViewerModal = document.getElementById('image-viewer-modal');
    if (!imageViewerModal) return; 

    const zoomedImage = document.getElementById('zoomed-image');
    const closeBtn = imageViewerModal.querySelector('.modal-close-btn');

    // وظيفة إغلاق النافذة
    const closeModal = () => {
        imageViewerModal.classList.add('hidden');
        zoomedImage.src = ''; // إفراغ الصورة لمنع ظهورها للحظة عند الفتح مرة أخرى
    };

    // المستمع الرئيسي الذي يراقب كل النقرات في الصفحة
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // التحقق إذا كانت الصورة قابلة للعرض
        if (target.classList.contains('viewable-image')) {
            // التحقق من أن الرابط ليس صورة placeholder
            if (target.src && !target.src.endsWith('placeholder.png')) {
                zoomedImage.src = target.src;
                imageViewerModal.classList.remove('hidden');
            } else {
                alert('لا يمكن عرض هذه الصورة حالياً.');
            }
        }
    });

    // ربط زر الإغلاق
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // ربط النقر على الخلفية للإغلاق
    imageViewerModal.addEventListener('click', (event) => {
        // يتم الإغلاق فقط عند النقر على الخلفية نفسها وليس على الصورة
        if (event.target === imageViewerModal) {
            closeModal();
        }
    });
});
// ==================== نهاية كود تفعيل نافذة عرض الصورة المكبرة ====================
// ------------------------------------
// ------------------------------------

// =========================================================================
