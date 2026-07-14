// ============================================================
// AUDIO.JS — Motor de sonido de VIMAR
// ============================================================

function playSound(tipo) {
    try { if (audioCtx.state === 'suspended') audioCtx.resume(); }
    catch(e) { return; }
    try {
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const t = audioCtx.currentTime;

        switch (tipo) {
            case 'click':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, t);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.start(t); osc.stop(t + 0.1);
                break;
            case 'delete':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.2);
                osc.start(t); osc.stop(t + 0.2);
                break;
            case 'success':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.setValueAtTime(600, t + 0.1);
                osc.frequency.setValueAtTime(800, t + 0.2);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
                osc.start(t); osc.stop(t + 0.3);
                break;
            case 'sidebar':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, t);
                osc.frequency.exponentialRampToValueAtTime(500, t + 0.15);
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.15);
                osc.start(t); osc.stop(t + 0.15);
                break;
            case 'excel':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, t);
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                osc.start(t); osc.stop(t + 0.4);
                break;
            case 'error':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.setValueAtTime(120, t + 0.1);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.2);
                osc.start(t); osc.stop(t + 0.2);
                break;
            case 'hover':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);
                gain.gain.setValueAtTime(0.02, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.05);
                osc.start(t); osc.stop(t + 0.05);
                break;
        }
    } catch(e) { /* audio no disponible */ }
}