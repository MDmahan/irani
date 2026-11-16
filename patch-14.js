/* ========== patch-14.js — حفظ شمارنده حمله و کارت‌ها ========== */
(function () {
    console.log('💾 patch-14: بارگذاری...');

    var SAVE_KEY = 'iran-war-save-v1';

    /* ============================================================
       بخش ۱: ذخیره — فیلدهای گمشده رو به JSON اضافه کن
       ============================================================ */
    var _origSave = window.p10SaveGame;
    if (typeof _origSave === 'function') {
        window.p10SaveGame = function (silent) {
            var result = _origSave.apply(this, arguments);
            if (!result || !window.game) return result;

            try {
                var raw = localStorage.getItem(SAVE_KEY);
                if (!raw) return result;
                var snap = JSON.parse(raw);

                if (!snap.state) snap.state = {};

                // ۱) شمارنده حملات
                snap.state.p14 = {
                    attacksRemaining: (typeof game._attacksRemaining === 'number')
                        ? game._attacksRemaining : 3,
                    savedAt: Date.now()
                };

                // ۲) شمارنده کارت (روی هر بازیکن)
                if (Array.isArray(snap.state.players) && Array.isArray(game.players)) {
                    snap.state.players = snap.state.players.map(function (sp, i) {
                        var rp = game.players[i];
                        if (rp) {
                            sp.p13Conquests = rp._p13Conquests || 0;
                            sp.firstTurnDone = !!rp._firstTurnDone;
                        }
                        return sp;
                    });
                }

                localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
                console.log('💾 patch-14 ذخیره:', {
                    attacks: snap.state.p14.attacksRemaining,
                    conquests: game.players.map(function (p) { return p._p13Conquests || 0; })
                });
            } catch (e) {
                console.warn('patch-14 save:', e);
            }
            return result;
        };
    }

    /* ============================================================
       بخش ۲: بارگذاری — بعد از همه setTimeout ها مقدار رو برگردون
       ============================================================ */
    var _origLoad = window.p10LoadGame;
    if (typeof _origLoad === 'function') {
        window.p10LoadGame = function () {
            // پیش از لود، مقادیر ذخیره‌شده رو بخون
            var saved = null;
            try {
                var raw = localStorage.getItem(SAVE_KEY);
                if (raw) saved = JSON.parse(raw);
            } catch (e) { console.warn('patch-14 pre-read:', e); }

            var result = _origLoad.apply(this, arguments);
            if (!result || !saved || !saved.state) return result;

            // تایمینگ: patch-10→250ms، patch-12→700ms، patch-13→800ms
            // ما در 950ms اجرا می‌شیم تا از همه بعدتر باشیم
            setTimeout(function () {
                if (!window.game || !game.players) return;

                // ۱) شمارنده حملات
                var ar = saved.state.p14 ? saved.state.p14.attacksRemaining : undefined;
                if (typeof ar === 'number' && ar >= 0 && ar <= 3) {
                    game._attacksRemaining = ar;
                }

                // ۲) شمارنده کارت هر بازیکن
                game.players.forEach(function (p, i) {
                    var sp = saved.state.players && saved.state.players[i];
                    if (!sp) return;
                    if (typeof sp.p13Conquests === 'number') {
                        p._p13Conquests = sp.p13Conquests;
                    }
                    if (sp.firstTurnDone !== undefined) {
                        p._firstTurnDone = !!sp.firstTurnDone;
                    }
                });

                if (typeof renderAll === 'function') renderAll();
                console.log('💾 patch-14 بارگذاری:', {
                    attacks: game._attacksRemaining,
                    conquests: game.players.map(function (p) { return p._p13Conquests || 0; })
                });
            }, 950);

            return result;
        };
    }

    /* ============================================================
       بخش ۳: پاک کردن save — شمارنده‌ها هم پاک بشن (طبیعیه)
       ============================================================ */
    var _origDelete = window.p10DeleteSave;
    if (typeof _origDelete === 'function') {
        window.p10DeleteSave = function () {
            try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
            return _origDelete.apply(this, arguments);
        };
    }

    console.log('✅ patch-14: حفظ شمارنده‌ها فعال');
})();