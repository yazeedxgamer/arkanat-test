firebase.initializeApp(config.firebaseConfig);
const messaging = firebase.messaging();
function requestNotificationPermission() {
    messaging.requestPermission()
        .then(() => messaging.getToken({
            vapidKey: "BO_qk6HKfERdBr4geUGLjQKk0D7830kjunWm3CY9q2WMQ2lkj5006t92lY-uVIlGarAZBYGKKz4jCLq7aMYqb7o"
        }))
        .then(token => {
            console.log("توكن FCM:", token);
            // هنا ترسله للسيرفر حقك أو تخزنه حسب حاجتك
        })
        .catch(err => {
            console.error("خطأ أثناء طلب الإذن:", err);
        });
}

messaging.onMessage(payload => {
    console.log("رسالة أثناء فتح الصفحة:", payload);
});

// ==================== بداية الدوال المساعدة للنطاق الجغرافي ====================
// بداية الاستبدال

/**
        const fcmToken = await messaging.getToken({ 
            vapidKey: config.vapidKey,
            serviceWorkerRegistration: readySW // نمرر له النسخة الجاهزة
        });

        if (fcmToken) {
            console.log('تم الحصول على التوكن بنجاح:', fcmToken);
            await supabaseClient
                .from('users')
                .update({ fcm_token: fcmToken })
                .eq('id', currentUser.id);
            
