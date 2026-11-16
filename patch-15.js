/* ========== patch-15.js — حملات پلکانی (1 → 2 → 3) ========== */
(function () {
    console.log('⚔️ patch-15: بارگذاری...');

    /* ============================================================
       ۱. منطق پایه
       ============================================================ */
    function getMaxAttacks(player) {
        var played = (player && player._p15TurnsPlayed) || 0;
        return Math.min(3, played + 1);
    }

    function applyAttacksForCurrent() {
        if (!window.game || !game.players) return;
        var me = game.players[game.currentPlayerIndex];
        if (!me) return;
        game._attacksRemaining = getMaxAttacks(me);
    }

    function getTurnLabel(player) {
        var played = (player && player._p15TurnsPlayed) || 0;
        var n = played + 1;
        if (n === 1) return '🥇 نوبت اول — ۱ حمله';
        if (n === 2) return '🥈 نوبت دوم — ۲ حمله';
        return '⚔️ نوبت ' + n + ' — ۳ حمله';
    }

    /* ============================================================
       ۲. شروع بازی → همه صفر
       ============================================================ */
    var _origStart = window.startGame;
    window.startGame = function () {
        var r = _origStart.apply(this, arguments);
        if (window.game && game.players) {
            game.players.forEach(function (p) { p._p15TurnsPlayed = 0; });
            applyAttacksForCurrent();
            setTimeout(function () {
                if (typeof window.log === 'function') {
                    log('⚔️ حملات پلکانی: نوبت اول=۱، دوم=۲، سوم+=۳');
                }
                if (typeof renderAll === 'function') renderAll();
            }, 500);
        }
        return r;
    };

    /* ============================================================
       ۳. پایان نوبت → شمارنده بازیکن قبلی ++
       ============================================================ */
    var _origEndTurn = window.endTurn;
    window.endTurn = function () {
        var prevPlayer = (window.game && game.players)
            ? game.players[game.currentPlayerIndex] : null;

        var r = _origEndTurn.apply(this, arguments);

        if (!window.game || game.gameOver || !game.players) return r;

        var curPlayer = game.players[game.currentPlayerIndex];
        if (curPlayer && curPlayer !== prevPlayer) {
            if (prevPlayer) {
                prevPlayer._p15TurnsPlayed = (prevPlayer._p15TurnsPlayed || 0) + 1;
            }
            applyAttacksForCurrent();
            if (typeof renderAll === 'function') renderAll();
        }
        return r;
    };

    /* ============================================================
       ۴. render → نمایش درست max
       ============================================================ */
    var _origRender = window.renderAll;
    window.renderAll = function () {
        var r = _origRender.apply(this, arguments);
        if (!window.game || game.gameOver || !game.players) return r;

        var me = game.players[game.currentPlayerIndex];
        if (!me) return r;

        var max = getMaxAttacks(me);
        var remaining = (typeof game._attacksRemaining === 'number')
            ? game._attacksRemaining : max;

        var line = document.getElementById('p12-attacks-line');
        if (line) {
            line.innerHTML = '⚔️ حملات: ' + remaining + ' / ' + max + ' — ' + getTurnLabel(me);
            line.style.color = remaining === 0
                ? '#7f8c8d'
                : (remaining === 1 ? '#e67e22' : '#e74c3c');
        }
        return r;
    };

    /* ============================================================
       ۵. Save
       ============================================================ */
    var _origSave = window.p10SaveGame;
    if (typeof _origSave === 'function') {
        window.p10SaveGame = function (silent) {
            var result = _origSave.apply(this, arguments);
            if (!result || !window.game || !game.players) return result;
            try {
                var raw = localStorage.getItem('iran-war-save-v1');
                if (!raw) return result;
                var snap = JSON.parse(raw);
                if (!snap.state) snap.state = {};
                snap.state.p15 = {
                    turnsPlayed: game.players.map(function (p) {
                        return p._p15TurnsPlayed || 0;
                    }),
                    attacksRemaining: (typeof game._attacksRemaining === 'number')
                        ? game._attacksRemaining : 1
                };
                localStorage.setItem('iran-war-save-v1', JSON.stringify(snap));
            } catch (e) { console.warn('p15 save:', e); }
            return result;
        };
    }

    /* ============================================================
       ۶. Load
       ============================================================ */
    var _origLoad = window.p10LoadGame;
    if (typeof _origLoad === 'function') {
        window.p10LoadGame = function () {
            var saved = null;
            try {
                var raw = localStorage.getItem('iran-war-save-v1');
                if (raw) saved = JSON.parse(raw);
            } catch (e) {}

            var result = _origLoad.apply(this, arguments);

            if (result && saved && saved.state && saved.state.p15) {
                setTimeout(function () {
                    if (!window.game || !game.players) return;
                    game.players.forEach(function (p, i) {
                        if (saved.state.p15.turnsPlayed
                            && saved.state.p15.turnsPlayed[i] !== undefined) {
                            p._p15TurnsPlayed = saved.state.p15.turnsPlayed[i];
                        }
                    });
                    if (typeof saved.state.p15.attacksRemaining === 'number') {
                        game._attacksRemaining = saved.state.p15.attacksRemaining;
                    }
                    if (typeof renderAll === 'function') renderAll();
                    console.log('⚔️ patch-15 بارگذاری شد');
                }, 1200);
            }
            return result;
        };
    }

    console.log('✅ patch-15: حملات پلکانی (1→2→3)');
})();