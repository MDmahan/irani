/* ========== patch-21.js — آیکون ۸ تجهیز روی نقشه ========== */
(function () {
    console.log('🎨 patch-21: بارگذاری...');

    var EQUIP_ICONS = {
        zere:      '🛡️',
        padegan:   '🏭',
        manjanigh: '🎯',
        ahangari:  '⚒️',
        khazane:   '🏦',
        mabad:     '⛪',
        ghale:     '🏯',
        borj:      '🏹'
    };

    var EQUIP_NAMES = {
        zere: 'زره', padegan: 'پادگان', manjanigh: 'منجنیق',
        ahangari: 'آهنگری', khazane: 'خزانه', mabad: 'معبد',
        ghale: 'قلعه', borj: 'برج کماندار'
    };

    /* ============================================================
       تابع مرکزی: به‌روزرسانی مارکرها
       ============================================================ */
    function refreshMarkersIcons() {
        if (!window.game || !game.troopMarkers) return;

        Object.keys(game.troopMarkers).forEach(function (name) {
            var m = game.troopMarkers[name];
            var d = game.provinceData[name];
            if (!m._icon || !d) return;

            var eq = d.equipment || [];
            var fortressCount = d.fortress || 0;

            // شمارش دفاع برای هایلایت
            var armorCount = 0;
            eq.forEach(function (e) { if (e === 'zere') armorCount++; });
            var totalDef = armorCount + fortressCount;

            // ساخت آیکون‌ها
            var icons = '';
            if (fortressCount > 0) icons += '🏰';
            eq.forEach(function (e) {
                if (EQUIP_ICONS[e]) icons += EQUIP_ICONS[e];
            });

            // HTML داخلی مارکر
            var inner = '';
            if (icons) inner += '<div class="equip-line">' + icons + '</div>';
            inner += '<div class="num-line">' + d.troops + '</div>';

            m._icon.innerHTML = inner;
            m._icon.style.borderColor = game.players[d.ownerId].color;
            m._icon.style.boxShadow = totalDef > 0
                ? '0 0 8px gold'
                : '0 1px 4px rgba(0,0,0,0.4)';

            // tooltip با نام تجهیزات
            var eqNames = [];
            if (fortressCount > 0) eqNames.push('🏰 دژ ×' + fortressCount);
            eq.forEach(function (e) {
                if (EQUIP_NAMES[e]) eqNames.push(EQUIP_ICONS[e] + ' ' + EQUIP_NAMES[e]);
            });
            if (m._icon) {
                m._icon.title = eqNames.length > 0
                    ? name + ' — ' + eqNames.join('، ')
                    : name;
            }
        });
    }

    /* ============================================================
       ۱. جایگزین updateAllMarkers (همه جا استفاده می‌شه)
       ============================================================ */
    window.updateAllMarkers = refreshMarkersIcons;

    /* ============================================================
       ۲. هوک در renderAll (اطمینان مضاعف)
       ============================================================ */
    var _origRender = window.renderAll;
    window.renderAll = function () {
        var r = _origRender.apply(this, arguments);
        refreshMarkersIcons();
        // در صورتی که پچ دیگه‌ای بعد از این مارکرها رو تغییر داد
        setTimeout(refreshMarkersIcons, 60);
        return r;
    };

    /* ============================================================
       ۳. هوک در startGame (اطمینان اولیه)
       ============================================================ */
    var _origStart = window.startGame;
    window.startGame = function () {
        var r = _origStart.apply(this, arguments);
        setTimeout(refreshMarkersIcons, 300);
        setTimeout(refreshMarkersIcons, 800);
        setTimeout(refreshMarkersIcons, 1500);
        return r;
    };

    /* ============================================================
       ۴. هوک در Load
       ============================================================ */
    var _origLoad = window.p10LoadGame;
    if (typeof _origLoad === 'function') {
        window.p10LoadGame = function () {
            var r = _origLoad.apply(this, arguments);
            setTimeout(refreshMarkersIcons, 1700);
            setTimeout(refreshMarkersIcons, 2200);
            return r;
        };
    }

    /* ============================================================
       ۵. CSS: اطمینان از جا شدن ۳ آیکون
       ============================================================ */
    var style = document.createElement('style');
    style.textContent = `
        .troop-count .equip-line {
            font-size: 9px;
            line-height: 1;
            letter-spacing: -1.5px;
            color: #1a252f;
            max-width: 100%;
            overflow: hidden;
            white-space: nowrap;
            text-align: center;
        }
        .troop-count .num-line {
            font-size: 13px;
            font-weight: 900;
            line-height: 1;
        }
    `;
    document.head.appendChild(style);

    console.log('✅ patch-21: ۸ تجهیز روی نقشه نمایش داده می‌شود');
})();