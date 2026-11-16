/* ========== patch-9.js — چیدمان موبایل قدرتمند ========== */
(function () {
    console.log('💪 patch-9: بارگذاری شد. عرض:', window.innerWidth);

    function isMobile() { return window.innerWidth <= 768; }
    function isLandscape() { return window.innerWidth > window.innerHeight; }

    function forceLayout() {
        var body = document.body;
        var map = document.getElementById('map');
        var panel = document.getElementById('panel');
        if (!body || !map || !panel) return;

        var S = function (el, prop, val) { el.style.setProperty(prop, val, 'important'); };

        // پاک کردن استایل‌های قبلی
        body.style.cssText = '';
        map.style.cssText = '';
        panel.style.cssText = '';

        if (!isMobile()) {
            S(body, 'display', 'flex');
            S(body, 'flex-direction', 'row');
            S(body, 'height', '100vh');
            S(body, 'margin', '0');
            S(body, 'overflow', 'hidden');
            S(map, 'flex', '1 1 auto');
            S(map, 'position', 'relative');
            S(panel, 'width', '400px');
            S(panel, 'min-width', '400px');
            S(panel, 'height', '100vh');
            S(panel, 'overflow-y', 'auto');
        } else if (isLandscape()) {
            S(body, 'display', 'flex');
            S(body, 'flex-direction', 'row');
            S(body, 'height', '100vh');
            S(body, 'margin', '0');
            S(body, 'overflow', 'hidden');
            S(map, 'flex', '1 1 auto');
            S(map, 'height', '100vh');
            S(map, 'position', 'relative');
            S(panel, 'flex', '0 0 320px');
            S(panel, 'width', '320px');
            S(panel, 'min-width', '320px');
            S(panel, 'height', '100vh');
            S(panel, 'overflow-y', 'auto');
            S(panel, 'padding', '10px');
        } else {
            // ====== موبایل عمودی — حالت اصلی ======
            S(body, 'display', 'flex');
            S(body, 'flex-direction', 'column');
            S(body, 'height', '100vh');
            S(body, 'height', '100dvh');
            S(body, 'margin', '0');
            S(body, 'overflow', 'hidden');
            S(body, 'width', '100vw');

            S(map, 'flex', '0 0 50vh');
            S(map, 'flex', '0 0 50dvh');
            S(map, 'width', '100%');
            S(map, 'min-height', '0');
            S(map, 'max-height', '50vh');
            S(map, 'max-height', '50dvh');
            S(map, 'position', 'relative');
            S(map, 'order', '1');
            S(map, 'border-bottom', '3px solid #d4af37');
            S(map, 'z-index', '1');

            S(panel, 'flex', '1 1 auto');
            S(panel, 'width', '100%');
            S(panel, 'min-width', '0');
            S(panel, 'max-width', '100%');
            S(panel, 'height', 'auto');
            S(panel, 'order', '2');
            S(panel, 'overflow-y', 'auto');
            S(panel, 'overflow-x', 'hidden');
            S(panel, 'padding', '10px 12px');
            S(panel, 'border-radius', '16px 16px 0 0');
            S(panel, 'margin-top', '-12px');
            S(panel, 'box-shadow', '0 -8px 32px rgba(0,0,0,0.6)');
            S(panel, 'border-left', 'none');
            S(panel, 'z-index', '500');
            S(panel, 'position', 'relative');
        }

        // بزرگ‌تر کردن دکمه‌ها و لاگ روی موبایل
        if (isMobile()) {
            var btns = document.querySelectorAll('.btn');
            for (var i = 0; i < btns.length; i++) {
                S(btns[i], 'padding', '12px');
                S(btns[i], 'font-size', '13px');
                S(btns[i], 'min-height', '42px');
            }
            var logs = document.querySelectorAll('#log');
            for (var j = 0; j < logs.length; j++) {
                S(logs[j], 'height', '120px');
                S(logs[j], 'font-size', '11px');
            }
        }

        setTimeout(function () {
            try { if (window.game && game.map) game.map.invalidateSize(); } catch (e) {}
        }, 200);
    }

    // اجرای فوری
    forceLayout();

    // تکرار در ۵ ثانیه اول (اگر چیزی استایل رو ریست کرد)
    var count = 0;
    var iv = setInterval(function () {
        forceLayout();
        count++;
        if (count >= 10) clearInterval(iv);
    }, 500);

    // واکنش به تغییر اندازه / چرخش
    window.addEventListener('resize', forceLayout);
    window.addEventListener('orientationchange', function () { setTimeout(forceLayout, 500); });

    // اجرا بعد از شروع بازی
    if (typeof window.startGame === 'function') {
        var _orig = window.startGame;
        window.startGame = function () {
            _orig.apply(this, arguments);
            setTimeout(forceLayout, 100);
            setTimeout(forceLayout, 500);
        };
    }

    // MutationObserver — اگر کسی style رو تغییر داد
    try {
        var obs = new MutationObserver(function () { forceLayout(); });
        ['map', 'panel'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) obs.observe(el, { attributes: true, attributeFilter: ['style'] });
        });
    } catch (e) { console.log('MutationObserver:', e); }

    // ===== Badge دیباگ =====
    var badge = document.createElement('div');
    badge.id = 'debug-badge-p9';
    badge.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:9999999;' +
        'background:#e74c3c;color:#fff;padding:8px 14px;border-radius:20px;' +
        'font-size:13px;font-weight:bold;font-family:Tahoma;cursor:pointer;' +
        'box-shadow:0 4px 12px rgba(0,0,0,0.8);border:2px solid #fff;';
    badge.textContent = 'P9 ✓ ' + window.innerWidth;
    badge.onclick = function () {
        forceLayout();
        badge.textContent = 'P9 ✓ اعمال شد';
        setTimeout(function () { badge.textContent = 'P9 ✓ ' + window.innerWidth; }, 1500);
    };
    document.body.appendChild(badge);

    window.addEventListener('resize', function () {
        badge.textContent = 'P9 ✓ ' + window.innerWidth;
    });

    console.log('✅ patch-9: تمام');
})();