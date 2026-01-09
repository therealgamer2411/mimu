const io = require('socket.io-client');
const SimplePeer = require('simple-peer');
const wrtc = require('@roamhq/wrtc');

class OpenRAG {
    constructor(config) {
        if (!config || !config.apiKey) throw new Error("OpenRAG: API Key is required.");

        this.apiKey = config.apiKey;
        this.serverUrl = config.serverUrl || 'https://openrag-grid.koyeb.app'; 
        this.iceServers = []; // سنستلمها من السيرفر
        this.socket = null;
        this.isConnected = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = io(this.serverUrl, {
                auth: { token: this.apiKey },
                reconnection: true,
                rejectUnauthorized: false
            });

            this.socket.on('connect', () => { 
                this.isConnected = true; 
                resolve(true); 
            });

            // استلام إعدادات Metered من السيرفر
            this.socket.on('ICE_CONFIG', (data) => {
                if(data && data.iceServers) {
                    this.iceServers = data.iceServers;
                    // console.log("🌩️ SDK: Received Metered Configuration");
                }
            });

            this.socket.on('connect_error', (err) => reject(new Error(`Connection Failed: ${err.message}`)));
        });
    }

    async fetch(targetUrl) {
        if (!this.isConnected) throw new Error("Not connected.");

        return new Promise((resolve, reject) => {
            this.socket.emit('REQUEST_PEER');

            const onPeerFound = ({ targetId }) => {
                this.socket.off('PEER_FOUND', onPeerFound);
                this._startP2P(targetId, targetUrl, resolve, reject);
            };

            const onNoPeers = () => {
                this.socket.off('PEER_FOUND', onPeerFound);
                reject(new Error("No nodes available."));
            };

            this.socket.on('PEER_FOUND', onPeerFound);
            this.socket.once('NO_PEERS_AVAILABLE', onNoPeers);

            setTimeout(() => {
                this.socket.off('PEER_FOUND', onPeerFound);
                this.socket.off('NO_PEERS_AVAILABLE', onNoPeers);
                reject(new Error("Timeout: No Peer Found."));
            }, 60000); // دقيقة كاملة
        });
    }

    _startP2P(targetId, targetUrl, resolve, reject) {
        const p = new SimplePeer({
            initiator: true,
            trickle: true, 
            wrtc: wrtc,
            config: { iceServers: this.iceServers }
        });

        p.on('signal', (data) => {
            this.socket.emit('SIGNAL_MESSAGE', { targetId, signal: data });
        });

        const onSignal = (data) => {
            if (data.senderId === targetId) {
                const signal = data.signal;

                // 🔥 الفلتر السحري: Codespaces TCP Enforcer 🔥
                // إذا كانت الإشارة عبارة عن "candidate" (عنوان IP)
                if (signal.type === 'candidate' && signal.candidate) {
                    const candidateStr = signal.candidate.candidate.toLowerCase();
                    
                    // 1. نرفض IPv6 (الذي يحتوي على نقطتين :)
                    // 2. نرفض UDP (نقبل فقط ما يحتوي على tcp)
                    // ملاحظة: Metered يرسل TCP candidates
                    if (candidateStr.indexOf(':') !== -1 && !candidateStr.includes('tcp')) {
                        // console.log("Ignored non-TCP candidate");
                        return; 
                    }
                }
                
                // إذا عبر الفلتر، نطبقه
                try {
                    p.signal(signal);
                } catch(e) { /* تجاهل الأخطاء العشوائية */ }
            }
        };
        this.socket.on('SIGNAL_RECEIVED', onSignal);

        p.on('connect', () => {
            p.send(JSON.stringify({ url: targetUrl }));
        });

        p.on('data', (data) => {
            const response = JSON.parse(data.toString());
            this.socket.off('SIGNAL_RECEIVED', onSignal);
            p.destroy();

            if (response.status === 200) resolve(response.body);
            else reject(new Error(response.error || "Fetch Failed"));
        });

        p.on('error', (err) => {
            this.socket.off('SIGNAL_RECEIVED', onSignal);
            // نتجاهل أخطاء قطع الاتصال الطبيعية
            if (err.code === 'ERR_DATA_CHANNEL') return;
            reject(err);
        });
    }

    disconnect() {
        if (this.socket) this.socket.disconnect();
    }
}

module.exports = OpenRAG;
