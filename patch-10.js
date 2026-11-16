/* ========== patch-10.js — چیدمان موبایل اجباری با JS ========== */
(function () {
    console.log('📱 patch-10: شروع...');
    console.log('📏 عرض:', window.innerWidth, 'ارتفاع:', window.innerHeight);

    function isMobile() { return window.innerWidth <= 768; }
    function isLandscape() { return window.innerWidth > window.innerHeight; }

    function applyLayout() {
        var map = document.getElementById('map');
        var panel = document.getElementById('panel');
        var body = document.body;
        if (!map || !panel) { console.log('❌ map/panel نیست'); return; }

        if (!isMobile()) {
            // دسکتاپ
            body.style.cssText = 'display:flex !important;flex-direction:row !important;height:100vh !important;overflow:hidden !important;margin:0 !important;';
            map.style.cssText = 'flex:1 1 auto !important;position:relative !important;';
            panel.style.cssText = 'width:400px !important;min-width:400px !important;overflow-y:auto !important;';
            console.log('🖥️ دسکتاپ');
        } else if (isLandscape()) {
            // موبایل افقی
            body.style.cssText = 'display:flex !important;flex-direction:row !important;height:100vh !important;height:100dvh !important;overflow:hidden !important;margin:0 !important;';
            map.style.cssText = 'flex:1 1 auto !important;height:100vh !important;height:100dvh !important;position:relative !important;';
            panel.style.cssText = 'flex:0 0 300px !important;width:300px !important;min-width:300px !important;max-width:300px !important;height:100vh !important;height:100dvh !important;overflow-y:auto !important;padding:10px !important;';
            console.log('📱 افقی');
        } else {
            // موبایل عمودی — مهم‌ترین حالت
            body.style.cssText = 'display:flex !important;flex-direction:column !important;height:100vh !important;height:100dvh !important;overflow:hidden !important;margin:0 !important;';
            map.style.cssText = 'flex:0 0 55vh !important;flex:0 0 55dvh !important;width:100% !important;min-height:0 !important;position:relative !important;order:1 !important;border-bottom:3px solid #d4af37 !important;';
            panel.style.cssText = 'flex:1 1 auto !important;width:100% !important;min-width:0 !important;max-width:100% !important;height:auto !important;order:2 !important;padding:10px 12px !important;overflow-y:auto !important;overflow-x:hidden !important;border-left:none !important;box-shadow:0 -8px 32px rgba(0,0,0,0.6) !important;border-radius:16px 16px 0 0 !important;margin-top:-12px !important;';
            console.log('📱 عمودی');
        }

        setTimeout(function () {
            if (window.game && game.map) game.map.invalidateSize();
        }, 200);
    }

    // اعمال فوری
    applyLayout();
    window.addEventListener('resize', applyLayout);
    window.addEventListener('orientationchange', function () { setTimeout(applyLayout, 500); });

    var _origStart = window.startGame;
    window.startGame = function () {
        _origStart.apply(this, arguments);
        setTimeout(applyLayout, 100);
    };

    // ===== Badge دیباگ (قابل کلیک) =====
    var badge = document.createElement('div');
    badge.id = 'layout-debug';
    badge.style.cssText = 'position:fixed;bottom:8px;right:8px;z-index:99999;' +
        'background:#2c3e50;color:#f1c40f;padding:6px 10px;border-radius:6px;' +
        'font-size:11px;font-family:Tahoma;border:1px solid #d4af37;cursor:pointer;' +
        'box-shadow:0 4px 12px rgba(0,0,0,0.5);';
    badge.textContent = (isMobile() ? '📱' : '🖥️') + ' ' + window.innerWidth + 'px';
    badge.title = 'کلیک کن تا چیدمان دوباره اعمال شه';
    badge.onclick = applyLayout;
    document.body.appendChild(badge);

    window.addEventListener('resize', function () {
        badge.textContent = (isMobile() ? '📱' : '🖥️') + ' ' + window.innerWidth + 'px';
    });

    console.log('✅ patch-10: تمام');
})();