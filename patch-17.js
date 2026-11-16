/* ========== patch-17.js — اصلاح درآمد بازیکن اول بعد از اصلاح مناطق ========== */
(function () {
    console.log('🔧 patch-17: بارگذاری...');

    var _origStart = window.startGame;
    window.startGame = function () {
        var r = _origStart.apply(this, arguments);

        // patch-16 در 700ms اصلاح رو انجام می‌ده، ما در 900ms
        setTimeout(function () {
            if (!window.game || !game.players || game.gameOver) return;

            var me = game.players[game.currentPlayerIndex];
            if (!me || me.provinces.length === 0) return;

            // درآمد رو دقیق دوباره حساب کن
            var normalIncome = 3 + Math.floor(me.provinces.length / 3);
            var regionBonus = 0;
            if (game.regions) {
                game.regions.forEach(function (region) {
                    if (!region.provinces.length) return;
                    var owns = region.provinces.every(function (prov) {
                        return game.provinceData[prov] && game.provinceData[prov].ownerId === me.id;
                    });
                    if (owns) regionBonus += region.bonus;
                });
            }
            var correct = normalIncome + regionBonus;
            var old = me.pendingTroops || 0;

            if (old !== correct) {
                console.log('🔧 اصلاح درآمد ' + me.name + ': ' + old + ' → ' + correct);
                me.pendingTroops = correct;
                if (typeof window.log === 'function') {
                    log('🔧 درآمد ' + me.name + ' اصلاح شد: ' + old + ' → ' + correct);
                }
                if (typeof renderAll === 'function') renderAll();
            } else {
                console.log('✅ درآمد ' + me.name + ' درسته: ' + correct);
            }
        }, 900);

        return r;
    };

    /* ============================================================
       پشتیبانی از Load (اگر وسط بازی لود شد)
       ============================================================ */
    var _origLoad = window.p10LoadGame;
    if (typeof _origLoad === 'function') {
        window.p10LoadGame = function () {
            var r = _origLoad.apply(this, arguments);
            setTimeout(function () {
                if (!window.game || !game.players) return;
                var me = game.players[game.currentPlayerIndex];
                if (!me || me.provinces.length === 0) return;
                if (me.pendingTroops <= 0) return; // درآمد نگرفته، دست نزن

                var normalIncome = 3 + Math.floor(me.provinces.length / 3);
                var regionBonus = 0;
                if (game.regions) {
                    game.regions.forEach(function (region) {
                        if (!region.provinces.length) return;
                        var owns = region.provinces.every(function (prov) {
                            return game.provinceData[prov] && game.provinceData[prov].ownerId === me.id;
                        });
                        if (owns) regionBonus += region.bonus;
                    });
                }
                var correct = normalIncome + regionBonus;
                if (me.pendingTroops !== correct) {
                    console.log('🔧 (Load) اصلاح درآمد ' + me.name + ': ' + me.pendingTroops + ' → ' + correct);
                    me.pendingTroops = correct;
                    if (typeof renderAll === 'function') renderAll();
                }
            }, 1500);
            return r;
        };
    }

    console.log('✅ patch-17: اصلاح درآمد بازیکن اول');
})();