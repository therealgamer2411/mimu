const io = require('socket.io-client');
const SimplePeer = require('simple-peer');
const wrtc = require('@roamhq/wrtc');

// 🔥 تأكد أن هذا الرابط هو رابط Koyeb الخاص بك وليس Localhost 🔥
const SERVER_URL = "https://openrag-grid.koyeb.app"; 

const socket = io(SERVER_URL);
let iceServers = [];

console.log("🔫 Sniper Started. Connecting to Koyeb...");

socket.on('connect', () => {
    console.log("✅ Connected to Server.");
});

socket.on('CONFIG', (data) => {
    iceServers = data.iceServers;
    console.log("⚙️ Config Loaded. Hunting for Phone...");
    
    // البحث كل 3 ثواني
    setInterval(() => {
        socket.emit('FIND_NODE');
    }, 3000);
});

socket.on('NODE_FOUND', ({ targetId }) => {
    console.log(`🎯 TARGET FOUND: ${targetId}. Connecting...`);
    
    const p = new SimplePeer({
        initiator: true,
        trickle: true,
        wrtc: wrtc,
        config: {
            iceServers: iceServers,
            iceTransportPolicy: 'relay' // 🔥 إجبار Relay من جهة الكمبيوتر أيضاً
        }
    });

    p.on('signal', (data) => {
        socket.emit('SIGNAL', { target: targetId, signal: data });
    });

    socket.on('SIGNAL', (data) => {
        if (data.sender === targetId) p.signal(data.signal);
    });

    p.on('connect', () => {
        console.log("\n🚀🚀🚀 BOOM! CONNECTION ESTABLISHED! 🚀🚀🚀");
        p.send(JSON.stringify({ url: "test" }));
    });

    p.on('data', (data) => {
        console.log("📦 Response from Phone:", JSON.parse(data.toString()));
        process.exit(0);
    });
});
