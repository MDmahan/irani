/* ========== patch-11.js — انیمیشن، صدا، افکت بصری ========== */
(function () {
    console.log('🎬 patch-11: بارگذاری...');

    /* ============================================================
       بخش ۱: سیستم صدا با Web Audio API
       ============================================================ */
    var audioCtx = null;
    var soundEnabled = true;

    try {
        var savedSound = localStorage.getItem('iran-war-sound');
        if (savedSound === 'off') soundEnabled = false;
    } catch (e) {}

    function initAudio() {
        if (audioCtx) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio Context ساخته شد');
        } catch (e) {
            console.warn('❌ Audio در دسترس نیست:', e);
        }
    }

    // iOS/iPadOS نیاز به اولین gesture داره
    var audioUnlocked = false;
    function unlockAudio() {
        initAudio();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().then(function () {
                audioUnlocked = true;
                console.log('🔓 Audio unlocked');
            });
        } else if (audioCtx) {
            audioUnlocked = true;
        }
    }
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    document.addEventListener('click', unlockAudio, { once: true });

    function beep(freq, duration, type, vol) {
        if (!audioCtx || !soundEnabled) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        try {
            var osc = audioCtx.createOscillator();
            var gain = audioCtx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            var now = audioCtx.currentTime;
            gain.gain.setValueAtTime(vol || 0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {}
    }

    function noiseBurst(duration, freq, vol) {
        if (!audioCtx || !soundEnabled) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        try {
            var bufSize = audioCtx.sampleRate * duration;
            var buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
            var data = buf.getChannelData(0);
            for (var i = 0; i < bufSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2.5);
            }
            var src = audioCtx.createBufferSource();
            src.buffer = buf;
            var filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = freq || 2000;
            filter.Q.value = 1.5;
            var gain = audioCtx.createGain();
            gain.gain.value = vol || 0.25;
            src.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            src.start();
        } catch (e) {}
    }

    function playSound(name) {
        if (!soundEnabled || !audioCtx) return;
        switch (name) {
            case 'sword':
                noiseBurst(0.18, 2200, 0.3);
                break;
            case 'victory':
                beep(523, 0.1, 'triangle', 0.2);
                setTimeout(function () { beep(659, 0.1, 'triangle', 0.2); }, 100);
                setTimeout(function () { beep(784, 0.12, 'triangle', 0.2); }, 200);
                setTimeout(function () { beep(1047, 0.35, 'triangle', 0.25); }, 340);
                break;
            case 'defeat':
                beep(392, 0.15, 'sawtooth', 0.2);
                setTimeout(function () { beep(311, 0.18, 'sawtooth', 0.2); }, 150);
                setTimeout(function () { beep(233, 0.3, 'sawtooth', 0.22); }, 330);
                break;
            case 'coin':
                beep(1200, 0.05, 'square', 0.15);
                setTimeout(function () { beep(1600, 0.08, 'square', 0.15); }, 50);
                break;
            case 'war':
                beep(150, 0.25, 'sawtooth', 0.25);
                setTimeout(function () { beep(120, 0.2, 'sawtooth', 0.2); }, 200);
                break;
            case 'capture':
                beep(600, 0.1, 'sine', 0.2);
                setTimeout(function () { beep(900, 0.15, 'sine', 0.22); }, 100);
                setTimeout(function () { beep(1200, 0.25, 'sine', 0.25); }, 220);
                break;
            case 'dice':
                for (var i = 0; i < 4; i++) {
                    (function (delay) {
                        setTimeout(function () {
                            beep(500 + Math.random() * 500, 0.03, 'square', 0.12);
                        }, delay);
                    })(i * 55);
                }
                break;
            case 'click':
                beep(800, 0.04, 'sine', 0.1);
                break;
            case 'kill':
                noiseBurst(0.3, 800, 0.3);
                setTimeout(function () { beep(200, 0.5, 'sawtooth', 0.2); }, 150);
                break;
        }
    }

    window.playSound = playSound;

    /* ============================================================
       بخش ۲: خط حمله متحرک
       ============================================================ */
    function drawAttackLine(srcName, tgtName) {
        if (!window.game || !game.map) return;
        var srcLyr = game.provinceLayers[srcName];
        var tgtLyr = game.provinceLayers[tgtName];
        if (!srcLyr || !tgtLyr) return;

        var srcC = srcLyr.getBounds().getCenter();
        var tgtC = tgtLyr.getBounds().getCenter();

        var line = L.polyline(
            [[srcC.lat, srcC.lng], [tgtC.lat, tgtC.lng]],
            { color: '#e74c3c', weight: 4, opacity: 1, dashArray: '12,8', lineCap: 'round' }
        ).addTo(game.map);

        // نقطه شروع با انیمیشن رشد
        var startMarker = L.circleMarker([srcC.lat, srcC.lng], {
            radius: 3, color: '#ffeb3b', fillColor: '#ffeb3b', fillOpacity: 1, weight: 0
        }).addTo(game.map);

        var dashOffset = 0;
        var progress = 0;
        var iv = setInterval(function () {
            progress += 0.08;
            if (progress >= 1) {
                clearInterval(iv);
                line.setStyle({ opacity: 0.3 });
                setTimeout(function () {
                    try { game.map.removeLayer(line); game.map.removeLayer(startMarker); } catch (e) {}
                }, 600);
                return;
            }
            dashOffset -= 4;
            line.setStyle({ dashOffset: dashOffset });
            startMarker.setRadius(3 + progress * 6);
        }, 40);
    }

    /* ============================================================
       بخش ۳: فلاش فتح استان
       ============================================================ */
    function flashCapture(name, color) {
        if (!window.game || !game.provinceLayers) return;
        var lyr = game.provinceLayers[name];
        if (!lyr) return;
        var flashes = 0;
        var iv = setInterval(function () {
            lyr.setStyle({ color: '#f1c40f', weight: 6 });
            setTimeout(function () {
                try { lyr.setStyle({ color: '#fff', weight: 1.5 }); } catch (e) {}
            }, 200);
            flashes++;
            if (flashes >= 3) {
                clearInterval(iv);
                try { lyr.setStyle({ weight: 1.5, color: '#fff' }); } catch (e) {}
            }
        }, 400);
    }

    /* ============================================================
       بخش ۴: هوک روی لاگ برای صدا و افکت
       ============================================================ */
    var _origLog_p11 = window.log;
    window.log = function (msg) {
        if (msg && typeof msg === 'string') {
            var m = msg.trim();

            if (m.indexOf('⚔️') === 0 && m.indexOf('→') !== -1) {
                playSound('sword');
            }
            if (m.indexOf('📢') === 0 && m.indexOf('جنگ') !== -1) {
                playSound('war');
            }
            if (m.indexOf('✅') === 0 && m.indexOf('فتح') !== -1) {
                playSound('capture');
                var match = m.match(/استان\s+([^\s]+)\s+را\s+فتح/);
                if (match && match[1]) {
                    setTimeout(function () { flashCapture(match[1]); }, 100);
                }
            }
            if (m.indexOf('❌') === 0 && m.indexOf('ناکام') !== -1) {
                playSound('defeat');
            }
            if (m.indexOf('💀') === 0) {
                playSound('kill');
            }
            if (m.indexOf('🎴') === 0 || m.indexOf('💰') === 0) {
                playSound('coin');
            }
        }
        return _origLog_p11.apply(this, arguments);
    };

    /* ============================================================
       بخش ۵: هوک روی onProvinceClick برای خط حمله
       ============================================================ */
    var _origClick_p11 = window.onProvinceClick;
    window.onProvinceClick = function (name) {
        var wasAttackMode = window.game && game.actionMode === 'attack';
        var prevSource = window.game && game.attackSource;

        var r = _origClick_p11.apply(this, arguments);

        // اگر مودال حمله باز شد، خط حمله بکش
        setTimeout(function () {
            if (wasAttackMode && prevSource && window.game &&
                game.attackSource === prevSource &&
                document.getElementById('troop-select-overlay')) {
                drawAttackLine(prevSource, name);
                playSound('sword');
            }
        }, 60);

        return r;
    };

    /* ============================================================
       بخش ۶: هوک روی confirm دکمه حمله برای صدا
       ============================================================ */
    var _origOnReady = window.onGameReady;
    function setupBattleSoundHooks() {
        // listener رویداد روی بدنه برای دکمه‌های مودال
        document.addEventListener('click', function (e) {
            if (!e.target) return;
            if (e.target.id === 'troop-confirm') {
                playSound('dice');
            }
            if (e.target.id === 'troop-cancel') {
                playSound('click');
            }
        }, true);
    }
    setupBattleSoundHooks();

    /* ============================================================
       بخش ۷: صدا روی کلیک دکمه‌های پنل
       ============================================================ */
    document.addEventListener('click', function (e) {
        if (!e.target || !e.target.classList) return;
        if (e.target.classList.contains('btn') ||
            e.target.classList.contains('p10-menu-btn') ||
            e.target.classList.contains('modal-btn-yes') ||
            e.target.classList.contains('modal-btn-no')) {
            playSound('click');
        }
    }, true);

    /* ============================================================
       بخش ۸: دکمه صدا در منو
       ============================================================ */
    function addSoundToggle() {
        var menu = document.getElementById('p10-overlay-menu');
        if (!menu || document.getElementById('p11-sound-toggle')) return;

        var btn = document.createElement('button');
        btn.id = 'p11-sound-toggle';
        btn.className = 'p10-menu-btn secondary';
        btn.style.fontSize = '14px';
        btn.style.minWidth = '200px';
        btn.style.padding = '12px 24px';
        updateSoundBtnText(btn);

        btn.onclick = function () {
            soundEnabled = !soundEnabled;
            try {
                localStorage.setItem('iran-war-sound', soundEnabled ? 'on' : 'off');
            } catch (e) {}
            updateSoundBtnText(btn);
            if (soundEnabled) {
                initAudio();
                playSound('coin');
            }
        };

        // بعد از دکمه قوانین
        var rulesBtn = document.getElementById('p10-btn-rules');
        if (rulesBtn && rulesBtn.parentNode) {
            rulesBtn.parentNode.insertBefore(btn, rulesBtn.nextSibling);
        } else {
            menu.appendChild(btn);
        }
    }

    function updateSoundBtnText(btn) {
        btn.innerHTML = soundEnabled ? '🔊 صدا: روشن' : '🔇 صدا: خاموش';
        btn.style.background = soundEnabled
            ? 'linear-gradient(135deg, #27ae60, #1e8449)'
            : 'linear-gradient(135deg, #7f8c8d, #5d6d7e)';
    }

    // چند بار تلاش کن تا منو ساخته بشه
    var menuCheckCount = 0;
    var menuCheckIv = setInterval(function () {
        if (document.getElementById('p10-overlay-menu')) {
            addSoundToggle();
            if (document.getElementById('p11-sound-toggle')) clearInterval(menuCheckIv);
        }
        menuCheckCount++;
        if (menuCheckCount > 40) clearInterval(menuCheckIv);
    }, 100);

    /* ============================================================
       بخش ۹: افکت بصری حمله روی استان هدف
       ============================================================ */
    var _origShowAttackModal = null; // internal، قابل دسترسی نیست
    // به جای اون، افکت رو با CSS روی overlay انجام می‌دیم

    var animStyle = document.createElement('style');
    animStyle.textContent = `
        @keyframes p11-pulse-border {
            0%, 100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
            50% { box-shadow: 0 0 0 12px rgba(231, 76, 60, 0); }
        }
        @keyframes p11-shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
        }
        .troop-select-shake {
            animation: p11-shake 0.3s ease-in-out;
        }
        .p11-toast {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.95), rgba(184, 148, 31, 0.95));
            color: #0a0f1a;
            padding: 20px 40px;
            border-radius: 16px;
            font-size: 24px;
            font-weight: 900;
            font-family: Tahoma, sans-serif;
            z-index: 99999;
            opacity: 0;
            pointer-events: none;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
            letter-spacing: 2px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            text-align: center;
        }
        .p11-toast.show {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    `;
    document.head.appendChild(animStyle);

    window.p11Toast = function (text, duration) {
        var el = document.createElement('div');
        el.className = 'p11-toast';
        el.textContent = text;
        document.body.appendChild(el);
        requestAnimationFrame(function () {
            el.classList.add('show');
        });
        setTimeout(function () {
            el.classList.remove('show');
            setTimeout(function () {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 350);
        }, duration || 1200);
    };

    /* ============================================================
       بخش ۱۰: Toast برای پیروزی نبرد
       ============================================================ */
    var _origLog_p11b = window.log;
    window.log = function (msg) {
        if (msg && typeof msg === 'string') {
            var m = msg.trim();
            if (m.indexOf('✅') === 0 && m.indexOf('فتح') !== -1) {
                var nameMatch = m.match(/استان\s+([^\s]+)\s+را\s+فتح/);
                if (nameMatch) window.p11Toast('⚔️ فتح شد: ' + nameMatch[1], 1400);
            }
            if (m.indexOf('💀') === 0 && m.indexOf('حذف') !== -1) {
                window.p11Toast('💀 بازیکن حذف شد!', 1600);
            }
        }
        return _origLog_p11b.apply(this, arguments);
    };

    console.log('✅ patch-11: انیمیشن + صدا + افکت فعال');
})();