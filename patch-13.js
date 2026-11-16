/* ========== patch-13.js — کارت بعد از ۳ فتح (به‌جای ۲) ========== */
(function () {
    console.log('🎴 patch-13: بارگذاری...');

    var CONQUESTS_FOR_CARD = 3;
    var _origLog = window.log;

    /* ====== پچ-۸ کارت رو هر ۲ فتح می‌ده. ما خنثی می‌کنیم و هر ۳ فتح می‌دیم ====== */
    window.log = function (msg) {
        if (!window.game || !game.players) return _origLog(msg);
        var me = game.players[game.currentPlayerIndex];
        if (!me) return _origLog(msg);

        // ۱) کارتی که patch-8 داد (هر ۲ فتح) رو پس بگیر
        if (msg && msg.indexOf('🎴 کارت جدید!') === 0) {
            if (me.hand.length > 0) me.hand.pop();
            _origLog('🎴 [کارت به تعویق افتاد — نیاز به ۳ فتح]');
            return; // پیام patch-8 رو خنثی کن
        }

        // ۲) شمارش فتح‌ها و اعطای کارت در مضرب ۳
        if (msg && msg.indexOf('✅') === 0 && msg.indexOf('فتح') !== -1) {
            me._p13Conquests = (me._p13Conquests || 0) + 1;
            var playerId = me.id;
            setTimeout(function () {
                if (!window.game || game.gameOver) return;
                var p = game.players[playerId];
                if (!p || p.provinces.length === 0) return;
                if (p._p13Conquests % CONQUESTS_FOR_CARD === 0 && p.hand.length < 3) {
                    var pool = ['yuresh', 'sepor', 'kharabkari', 'farakhvan',
                                'dezh', 'savare', 'atashbas', 'toufan'];
                    var newCard = pool[Math.floor(Math.random() * pool.length)];
                    p.hand.push(newCard);
                    _origLog('🎴 کارت جدید (۳ فتح)! دست: ' + p.hand.length + '/3');
                    if (typeof renderAll === 'function') renderAll();
                }
            }, 100);
        }

        return _origLog(msg);
    };

    /* ====== ریست شمارنده در شروع بازی ====== */
    var _origStart = window.startGame;
    window.startGame = function () {
        var r = _origStart.apply(this, arguments);
        if (window.game && game.players) {
            game.players.forEach(function (p) {
                p._p13Conquests = 0;
            });
        }
        setTimeout(function () {
            if (typeof log === 'function') log('🎴 کارت جدید بعد از ۳ فتح اعطا می‌شود');
        }, 400);
        return r;
    };

    /* ====== پشتیبانی از Load ====== */
    var _origLoad = window.p10LoadGame;
    if (typeof _origLoad === 'function') {
        window.p10LoadGame = function () {
            var r = _origLoad.apply(this, arguments);
            setTimeout(function () {
                if (window.game && game.players) {
                    game.players.forEach(function (p) {
                        if (p._p13Conquests === undefined) p._p13Conquests = 0;
                    });
                }
            }, 800);
            return r;
        };
    }

    console.log('✅ patch-13: کارت بعد از ۳ فتح');
})();