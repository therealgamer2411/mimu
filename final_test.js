// استدعاء الحزمة الجديدة
const OpenRAG = require('openrag-sdk2026');

// الاتصال باستخدام المفتاح الذي وضعته في Supabase
const client = new OpenRAG({ 
    apiKey: 'sk_zeunhnu8p2kbztfuymz4qp' 
});

(async () => {
    try {
        console.log("1. 🌐 Connecting to OpenRAG Grid...");
        await client.connect();
        console.log("✅ Connected to Server!");

        console.log("2. 🔍 Searching for a Gamer Node...");
        // سنطلب معرفة الـ IP لنثبت أنه IP هاتفك وليس سيرفر
        const responseBody = await client.fetch('https://api.ipify.org?format=json');
        
        console.log("\n🎉 WOOHOO! Data Received from Residential IP:");
        console.log(responseBody); // يجب أن يطبع IP هاتفك المحمول

    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        client.disconnect();
        process.exit(0);
    }
})();