/* ========== patch-22.js — شرط برد ۲۳ + خلاصه نوبت ========== */
(function () {
    console.log('🎯 patch-22: بارگذاری...');

    var NEW_WIN_CONDITION = 23;
    var victoryTriggered = false;
    var turnEvents = null;
    var turnStartSnapshot = null;

    /* ============================================================
       ۱. ردیابی رویدادها از لاگ
       ============================================================ */
    var _origLog = window.log;
    window.log = function (msg) {
        var result = _origLog.apply(this, arguments);
        if (!turnEvents || !msg || typeof msg !== 'string') return result;
        var m = msg.trim();

        if (m.indexOf('✅') === 0 && m.indexOf('فتح') !== -1) {
            var match = m.match(/استان\s+(.+?)\s+را\s+فتح/);
            if (match) turnEvents.captures.push(match[1]);
        }
        else if (m.indexOf('❌') === 0 && m.indexOf('ناکام') !== -1) {
            turnEvents.failedAttacks++;
        }
        else if (m.indexOf('🎴') === 0 && m.indexOf('کارت جدید') !== -1) {
            turnEvents.cardsGained++;
        }
        else if (m.indexOf('✅') === 0 && m.indexOf('اتحاد کردند') !== -1) {
            turnEvents.alliances++;
        }
        else if (m.indexOf('✅') === 0 && m.indexOf('صلح کردند') !== -1) {
            turnEvents.peaces++;
        }
        else if (m.indexOf('✅') === 0 && m.indexOf('نصب شد') !== -1) {
            turnEvents.equipmentBought++;
        }
        else if (m.indexOf('💀') === 0 && m.indexOf('حذف') !== -1) {
            turnEvents.eliminations++;
        }
        else if (m.indexOf('🔄 واگذاری') === 0) {
            // اصلاح مناطق، نادیده بگیر
        }

        return result;
    };

    /* ============================================================
       ۲. شروع ردیابی نوبت
       ============================================================ */
    function startTurnTracking(player) {
        if (!player || !window.game) return;
        turnEvents = {
            captures: [],
            failedAttacks: 0,
            cardsGained: 0,
            alliances: 0,
            peaces: 0,
            equipmentBought: 0,
            eliminations: 0
        };
        turnStartSnapshot = {
            coins: player.coins || 0,
            provinces: player.provinces.length,
            cards: (player.hand || []).length
        };
    }

    /* ============================================================
       ۳. خلاصه نوبت
       ============================================================ */
    function showTurnSummary(player, events, snapshot) {
        if (!player || !events || !snapshot) return;

        var hasCombat = events.captures.length > 0 || events.failedAttacks > 0;
        var hasDiplomacy = events.alliances > 0 || events.peaces > 0;
        var hasEconomy = events.equipmentBought > 0 || events.cardsGained > 0;
        var hasAnything = hasCombat || hasDiplomacy || hasEconomy || events.eliminations > 0;

        if (!hasAnything) return;

        var oldOverlay = document.getElementById('p22-summary-overlay');
        if (oldOverlay) oldOverlay.parentNode.removeChild(oldOverlay);

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'p22-summary-overlay';
        overlay.style.zIndex = 10003;

        var coinsDiff = (player.coins || 0) - snapshot.coins;

        var html = '<div class="modal-box" style="max-width:480px">';
        html += '<h2>📊 خلاصه نوبت</h2>';
        html += '<p style="text-align:center;font-size:16px;margin:5px 0 15px;">';
        html += '<b style="color:' + player.color + ';font-size:20px">' + player.name + '</b>';
        html += '</p>';

        html += '<div style="background:rgba(52,73,94,0.4);border-radius:10px;padding:15px;margin-bottom:15px;">';

        if (events.captures.length > 0) {
            html += '<div style="margin:8px 0;display:flex;justify-content:space-between;">';
            html += '<span>⚔️ استان‌های فتح‌شده:</span>';
            html += '<b style="color:#27ae60;font-size:16px">' + events.captures.length + '</b></div>';
            if (events.captures.length <= 5) {
                html += '<div style="font-size:11px;color:#95a5a6;margin-bottom:8px;">' +
                        events.captures.join('، ') + '</div>';
            }
        }

        if (events.failedAttacks > 0) {
            html += '<div style="margin:8px 0;display:flex;justify-content:space-between;">';
            html += '<span>❌ حملات ناموفق:</span>';
            html += '<b style="color:#e74c3c;font-size:16px">' + events.failedAttacks + '</b></div>';
        }

        if (coinsDiff > 0) {
            html += '<div style="margin:8px 0;display:flex;justify-content:space-between;">';
            html += '<span>💰 سکه‌های دریافتی:</span>';
            html += '<b style="color:#f1c40f;font-size:16px">+' + coinsDiff + '</b></div>';
        }

        if (events.cardsGained > 0) {
            html += '<div style="margin:8px 0;display:flex;justify-content:space-between;">';
            html += '<span>🎴 کارت‌های جدید:</span>';
            html += '<b style="color:#9b59b6;font-size:16px">' + events.cardsGained + '</b></div>';
        }

        if (events.equipmentBought > 0) {
            html += '<div style="margin:8px 0;display:flex;justify-content:space-between;">';
            html += '<span>🏭 تجهیزات خریداری‌شده:</span>';
            html += '<b style="color:#3498db;font-size:16px">' + events.equipmentBought + '</b></div>';
        }

        if (events.alliances > 0) {
            html += '<div style="margin:8px 0;display:flex;justify-content:space-between;">';
            html += '<span>🤝 اتحادهای جدید:</span>';
            html += '<b style="color:#27ae60;font-size:16px">' + events.alliances + '</b></div>';
        }

        if (events.peaces > 0) {
            html += '<div style="margin:8px 0;display:flex;justify-content:space-between;">';
            html += '<span>🕊️ صلح‌های جدید:</span>';
            html += '<b style="color:#3498db;font-size:16px">' + events.peaces + '</b></div>';
        }

        if (events.eliminations > 0) {
            html += '<div style="margin:8px 0;display:flex;justify-content:space-between;">';
            html += '<span>💀 بازیکنان حذف‌شده:</span>';
            html += '<b style="color:#e74c3c;font-size:16px">' + events.eliminations + '</b></div>';
        }

        html += '</div>';

        html += '<div style="text-align:center;font-size:13px;color:#95a5a6;margin:10px 0;">';
        html += '🗺️ استان‌های فعلی: <b style="color:#f9d976">' +
                player.provinces.length + ' / ' + NEW_WIN_CONDITION + '</b>';
        html += '</div>';

        html += '<div class="btn-row">';
        html += '<button class="modal-btn-close" id="p22-summary-close">ادامه →</button></div>';
        html += '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        document.getElementById('p22-summary-close').onclick = function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        };
        overlay.onclick = function (e) {
            if (e.target === overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };
    }

    /* ============================================================
       ۴. شرط برد — ۲۳ استان
       ============================================================ */
    function checkWinCondition() {
        if (!window.game || game.gameOver || victoryTriggered) return;
        if (!game.players) return;

        for (var i = 0; i < game.players.length; i++) {
            var p = game.players[i];
            if (p.provinces.length >= NEW_WIN_CONDITION) {
                victoryTriggered = true;
                triggerVictory(p);
                return;
            }
        }
    }

    function triggerVictory(winner) {
        if (!window.game || !winner) return;
        game.gameOver = true;

        var summary = document.getElementById('p22-summary-overlay');
        if (summary && summary.parentNode) summary.parentNode.removeChild(summary);

        if (typeof log === 'function') {
            log('🏆 ' + winner.name + ' با ' + winner.provinces.length + ' استان برنده شد!');
        }

        var actionBox = document.getElementById('actionBox');
        if (actionBox) {
            actionBox.innerHTML = '<b style="color:#f1c40f;font-size:15px">🏆 ' +
                winner.name + ' با ' + winner.provinces.length + ' استان برنده شد!</b>';
        }
        var endBtn = document.getElementById('endTurnBtn');
        if (endBtn) endBtn.disabled = true;

        setTimeout(function () {
            alert('🏆 ' + winner.name + ' برنده شد!');
        }, 150);
    }

    /* ============================================================
       ۵. به‌روزرسانی نمایش «X / 31» → «X / 23»
       ============================================================ */
    function updateWinDisplay() {
        if (!window.game || typeof TOTAL_PROVINCES === 'undefined') return;
        if (TOTAL_PROVINCES === NEW_WIN_CONDITION) return;
        var box = document.getElementById('currentPlayerBox');
        if (!box) return;
        var html = box.innerHTML;
        var regex = new RegExp('/\\s*' + TOTAL_PROVINCES + '\\b', 'g');
        if (regex.test(html)) {
            box.innerHTML = html.replace(regex, '/ ' + NEW_WIN_CONDITION);
        }
    }

    /* ============================================================
       ۶. شروع بازی
       ============================================================ */
    var _origStart = window.startGame;
    window.startGame = function () {
        var r = _origStart.apply(this, arguments);
        victoryTriggered = false;
        turnEvents = null;
        turnStartSnapshot = null;
        setTimeout(function () {
            if (typeof log === 'function') {
                log('🏆 شرط برد: ' + NEW_WIN_CONDITION + ' استان');
            }
            if (window.game && game.players && game.p15Phase !== 'deployment') {
                startTurnTracking(game.players[game.currentPlayerIndex]);
            }
        }, 500);
        return r;
    };

    /* ============================================================
       ۷. پایان نوبت — خلاصه
       ============================================================ */
    var _origEndTurn = window.endTurn;
    window.endTurn = function () {
        if (!window.game || game.gameOver) return _origEndTurn.apply(this, arguments);
        if (game.p15Phase === 'deployment') return _origEndTurn.apply(this, arguments);

        var prevIdx = game.currentPlayerIndex;
        var prevPlayer = game.players[prevIdx];
        var eventsBefore = turnEvents;
        var snapshotBefore = turnStartSnapshot;

        var r = _origEndTurn.apply(this, arguments);

        if (!window.game) return r;
        if (game.gameOver) { turnEvents = null; return r; }
        if (game.p15Phase === 'deployment') return r;

        if (game.currentPlayerIndex !== prevIdx && prevPlayer && eventsBefore) {
            setTimeout(function () {
                if (window.game && !game.gameOver) {
                    showTurnSummary(prevPlayer, eventsBefore, snapshotBefore);
                }
            }, 200);
            startTurnTracking(game.players[game.currentPlayerIndex]);
        }

        return r;
    };

    /* ============================================================
       ۸. Hook در renderAll — چک برد + شروع ردیابی + نمایش
       ============================================================ */
    var _origRender = window.renderAll;
    window.renderAll = function () {
        var r = _origRender.apply(this, arguments);

        if (window.game && !game.gameOver) {
            if (game.p15Phase !== 'deployment') {
                if (!turnEvents && game.players) {
                    startTurnTracking(game.players[game.currentPlayerIndex]);
                }
                checkWinCondition();
            }
        }

        setTimeout(updateWinDisplay, 30);
        return r;
    };

    /* ============================================================
       ۹. Save / Load
       ============================================================ */
    var _origSave = window.p10SaveGame;
    if (typeof _origSave === 'function') {
        window.p10SaveGame = function (silent) {
            var result = _origSave.apply(this, arguments);
            if (!result || !window.game) return result;
            try {
                var raw = localStorage.getItem('iran-war-save-v1');
                if (!raw) return result;
                var snap = JSON.parse(raw);
                if (!snap.state) snap.state = {};
                snap.state.p22 = {
                    victoryTriggered: victoryTriggered,
                    turnEvents: turnEvents,
                    turnStartSnapshot: turnStartSnapshot
                };
                localStorage.setItem('iran-war-save-v1', JSON.stringify(snap));
            } catch (e) {}
            return result;
        };
    }

    var _origLoad = window.p10LoadGame;
    if (typeof _origLoad === 'function') {
        window.p10LoadGame = function () {
            var saved = null;
            try {
                var raw = localStorage.getItem('iran-war-save-v1');
                if (raw) saved = JSON.parse(raw);
            } catch (e) {}
            var result = _origLoad.apply(this, arguments);
            if (result && saved && saved.state && saved.state.p22) {
                setTimeout(function () {
                    if (!window.game) return;
                    victoryTriggered = saved.state.p22.victoryTriggered || false;
                    turnEvents = saved.state.p22.turnEvents || null;
                    turnStartSnapshot = saved.state.p22.turnStartSnapshot || null;
                    if (!turnEvents && game.players && game.p15Phase !== 'deployment') {
                        startTurnTracking(game.players[game.currentPlayerIndex]);
                    }
                }, 1750);
            }
            return result;
        };
    }

    console.log('✅ patch-22: شرط برد ۲۳ + خلاصه نوبت');
})();