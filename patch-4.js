/* ========== patch-4.js — رفع باگ: فیلدهای تعریف‌نشده در renderAll ========== */
(function () {
    console.log('🔧 patch-4: ایمن‌سازی renderAll...');

    var _origRender = window.renderAll;

    window.renderAll = function () {
        if (typeof game !== 'undefined' && game && game.players) {
            game.players.forEach(function (p) {
                if (!p.hand) p.hand = [];
                if (p.pendingTroops === undefined) p.pendingTroops = 0;
                if (p.attackBuff === undefined) p.attackBuff = 0;
                if (p.attackDebuff === undefined) p.attackDebuff = 0;
                if (p.hasShield === undefined) p.hasShield = false;
                if (p.truceActive === undefined) p.truceActive = false;
                if (p.conquestCounter === undefined) p.conquestCounter = 0;
            });
            if (game.provinceData) {
                Object.keys(game.provinceData).forEach(function (n) {
                    if (game.provinceData[n].troops === undefined) game.provinceData[n].troops = 2;
                    if (game.provinceData[n].fortress === undefined) game.provinceData[n].fortress = 0;
                });
            }
        }
        return _origRender();
    };

    console.log('✅ patch-4: renderAll ایمن شد');
})();