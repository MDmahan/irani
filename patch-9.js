/* ========== patch-9.js — چیدمان موبایل (نسخه ایمن) ========== */
(function () {
    console.log('🔧 patch-9: شروع');

    /* ===== ۱. تشخیص دقیق دستگاه ===== */
    function isMobileDevice() {
        var ua = navigator.userAgent || '';
        if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
        if (('ontouchstart' in window) && (navigator.maxTouchPoints > 0)) return true;
        return window.innerWidth <= 768;
    }
    function detectMode() {
        if (!isMobileDevice()) return 'desktop';
        return window.innerWidth > window.innerHeight ? 'mobile-landscape' : 'mobile-portrait';
    }

    /* ===== ۲. مطمئن شو meta viewport سره‌جاست ===== */
    var vp = document.querySelector('meta[name="viewport"]');
    if (!vp) {
        vp = document.createElement('meta');
        vp.name = 'viewport';
        document.head.appendChild(vp);
    }
    vp.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';

    /* ===== ۳. CSS امن — بدون MutationObserver، بدون interval ===== */
    var styleEl = document.createElement('style');
    styleEl.id = 'p9-styles';
    styleEl.textContent = `
        /* ---- مشترک ---- */
        body { overflow: hidden !important; margin: 0 !important; }

        /* ---- دسکتاپ ---- */
        body.layout-desktop { display: flex !important; flex-direction: row !important; height: 100vh !important; }
        body.layout-desktop #map { flex: 1 1 auto !important; min-height: 0 !important; }
        body.layout-desktop #panel { width: 400px !important; min-width: 400px !important; height: 100vh !important; overflow-y: auto !important; }

        /* ---- موبایل عمودی ---- */
        body.layout-mobile-portrait {
            display: flex !important;
            flex-direction: column !important;
            height: 100vh !important;
            height: 100dvh !important;
        }
        body.layout-mobile-portrait #map {
            flex: 0 0 50vh !important;
            flex: 0 0 50dvh !important;
            max-height: 50vh !important;
            max-height: 50dvh !important;
            width: 100% !important;
            min-height: 0 !important;
            order: 1 !important;
            border-bottom: 3px solid #d4af37 !important;
            position: relative !important;
            z-index: 1 !important;
        }
        body.layout-mobile-portrait #panel {
            flex: 1 1 auto !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            height: auto !important;
            order: 2 !important;
            border-radius: 16px 16px 0 0 !important;
            margin-top: -12px !important;
            padding: 10px 12px !important;
            box-shadow: 0 -8px 32px rgba(0,0,0,0.6) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            border-left: none !important;
            position: relative !important;
            z-index: 500 !important;
            pointer-events: auto !important;
        }
        body.layout-mobile-portrait .btn {
            min-height: 44px !important;
            padding: 12px !important;
            font-size: 13px !important;
            margin: 4px 0 !important;
        }
        body.layout-mobile-portrait #log { height: 100px !important; font-size: 11px !important; }
        body.layout-mobile-portrait .section { padding: 8px 10px !important; margin-bottom: 8px !important; }
        body.layout-mobile-portrait #currentPlayerBox > b:first-child { font-size: 15px !important; padding-bottom: 4px !important; }
        body.layout-mobile-portrait .info-line { font-size: 12px !important; }
        body.layout-mobile-portrait .troop-count { width: 32px !important; height: 32px !important; }
        body.layout-mobile-portrait .troop-count .num-line { font-size: 11px !important; }
        body.layout-mobile-portrait .troop-count .equip-line { font-size: 8px !important; letter-spacing: -1.5px !important; }
        body.layout-mobile-portrait .modal-box { max-width: 94vw !important; max-height: 88vh !important; padding: 16px !important; }
        body.layout-mobile-portrait .modal-box h2 { font-size: 16px !important; }
        body.layout-mobile-portrait select { padding: 11px !important; font-size: 13px !important; }
        body.layout-mobile-portrait #panel > h3:first-child { font-size: 16px !important; padding-bottom: 6px !important; margin: 0 0 8px 0 !important; }

        /* ---- موبایل افقی ---- */
        body.layout-mobile-landscape {
            display: flex !important;
            flex-direction: row !important;
            height: 100vh !important;
            height: 100dvh !important;
        }
        body.layout-mobile-landscape #map {
            flex: 1 1 auto !important;
            height: 100vh !important;
            height: 100dvh !important;
            min-height: 0 !important;
            position: relative !important;
            z-index: 1 !important;
        }
        body.layout-mobile-landscape #panel {
            flex: 0 0 320px !important;
            width: 320px !important;
            min-width: 320px !important;
            max-width: 320px !important;
            height: 100vh !important;
            height: 100dvh !important;
            overflow-y: auto !important;
            padding: 10px !important;
            border-radius: 0 !important;
            margin-top: 0 !important;
            position: relative !important;
            z-index: 500 !important;
            pointer-events: auto !important;
        }
    `;
    document.head.appendChild(styleEl);

    /* ===== ۴. اعمال کلاس ===== */
    function applyLayout() {
        var mode = detectMode();
        document.body.classList.remove('layout-desktop', 'layout-mobile-portrait', 'layout-mobile-landscape');
        document.body.classList.add('layout-' + mode);

        var icon = mode === 'desktop' ? '🖥️' : (mode === 'mobile-portrait' ? '📱' : '📱↔');
        var badge = document.getElementById('p9-badge');
        if (badge) badge.textContent = icon + ' ' + window.innerWidth;

        console.log('📐 حالت:', mode, '| عرض:', window.innerWidth, '| ارتفاع:', window.innerHeight);

        setTimeout(function () {
            try { if (window.game && game.map) game.map.invalidateSize(); } catch (e) {}
        }, 150);
    }

    /* ===== ۵. Badge با شمارنده کلیک — برای تست پاسخگویی ===== */
    var clicks = 0;
    var badge = document.createElement('div');
    badge.id = 'p9-badge';
    badge.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:9999999;' +
        'background:#27ae60;color:#fff;padding:6px 12px;border-radius:20px;' +
        'font-size:11px;font-weight:bold;font-family:Tahoma;cursor:pointer;' +
        'box-shadow:0 4px 12px rgba(0,0,0,0.6);user-select:none;';
    badge.onclick = function (e) {
        e.stopPropagation();
        applyLayout();
    };
    document.body.appendChild(badge);

    // شمارنده کلیک — اگر عدد بالا رفت، یعنی صفحه پاسخگو است
    document.addEventListener('click', function () {
        clicks++;
        badge.textContent = '✓ ' + clicks + ' کلیک';
        setTimeout(function () { applyLayout(); }, 800);
    }, true);

    /* ===== ۶. اجرا ===== */
    applyLayout();
    window.addEventListener('resize', applyLayout);
    window.addEventListener('orientationchange', function () { setTimeout(applyLayout, 500); });

    /* ===== ۷. بعد از شروع بازی ===== */
    if (typeof window.startGame === 'function') {
        var _origStart = window.startGame;
        window.startGame = function () {
            _origStart.apply(this, arguments);
            setTimeout(applyLayout, 100);
            setTimeout(applyLayout, 500);
        };
    }

    console.log('✅ patch-9: تمام');
})();