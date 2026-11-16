/* ========== patch-18.js — صلح و اتحاد زمان‌دار + سود اقتصادی ========== */
(function () {
    console.log('🤝 patch-18: بارگذاری...');

    var PEACE_DURATION = 3;
    var ALLIANCE_DURATION = 5;
    var ALLIANCE_COIN_BONUS = 1;
    var BREAK_COST = 3;
    var BETRAYAL_COST = 5;

    /* ============================================================
       ۱. مودال داخلی
       ============================================================ */
    function showModal18(html) {
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = '<div class="modal-box">' + html + '</div>';
        document.body.appendChild(overlay);
        return overlay;
    }
    function closeModal18(overlay) {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    /* ============================================================
       ۲. شروع بازی
       ============================================================ */
    var _origStart = window.startGame;
    window.startGame = function () {
        var r = _origStart.apply(this, arguments);
        if (window.game) {
            game.relationExpiry = {};
            setTimeout(function () {
                if (typeof log === 'function') {
                    log('🕊️ صلح ' + PEACE_DURATION + ' نوبت، اتحاد ' + ALLIANCE_DURATION + ' نوبت');
                    log('🤝 هر اتحاد +' + ALLIANCE_COIN_BONUS + ' سکه در هر نوبت');
                    log('💔 شکستن اتحاد: -' + BREAK_COST + ' سکه · خیانت: -' + BETRAYAL_COST + ' سکه');
                }
            }, 600);
        }
        return r;
    };

    /* ============================================================
       ۳. doAction (جایگزین patch-5)
       ============================================================ */
    window.doAction = function (targetId, action) {
        if (!window.game) return;
        var me = game.players[game.currentPlayerIndex];
        var target = game.players[targetId];
        var key = relKey(me.id, targetId);

        // جنگ (یک‌طرفه)
        if (action === 'war') {
            game.relations[key] = 'war';
            if (game.relationExpiry) delete game.relationExpiry[key];
            log('📢 ' + me.name + ' به ' + target.name + ' اعلام جنگ کرد!');
            game.actionMode = null;
            refreshMap(); renderAll();
            return;
        }

        // شکستن اتحاد (یک‌طرفه)
        if (action === 'break') {
            if ((me.coins || 0) < BREAK_COST) {
                log('❌ شکستن اتحاد نیاز به ' + BREAK_COST + ' سکه دارد. سکه کافی نداری!');
                game.actionMode = null;
                refreshMap(); renderAll();
                return;
            }
            me.coins -= BREAK_COST;
            game.relations[key] = 'war';
            if (game.relationExpiry) delete game.relationExpiry[key];
            log('💔 ' + me.name + ' اتحاد با ' + target.name + ' را شکست (-' + BREAK_COST + ' سکه) → جنگ');
            game.actionMode = null;
            refreshMap(); renderAll();
            return;
        }

        // صلح یا اتحاد (نیاز به تأیید)
        if (action === 'peace' || action === 'alliance') {
            var actionLabel = action === 'peace' ? 'صلح' : 'اتحاد';
            var actionIcon = action === 'peace' ? '🕊️' : '🤝';
            var duration = action === 'peace' ? PEACE_DURATION : ALLIANCE_DURATION;

            log(actionIcon + ' ' + me.name + ' به ' + target.name + ' پیشنهاد ' + actionLabel + ' داد (در انتظار تأیید)');

            var overlay = showModal18(
                '<h2>' + actionIcon + ' درخواست ' + actionLabel + '</h2>' +
                '<p><b style="color:' + me.color + '">' + me.name + '</b> به ' +
                '<b style="color:' + target.color + '">' + target.name + '</b> پیشنهاد ' +
                '<b>' + actionLabel + '</b> برای <b>' + duration + ' نوبت</b> می‌دهد.</p>' +
                (action === 'alliance'
                    ? '<p style="color:#27ae60;font-size:13px;text-align:center">🤝 هر دو +' +
                      ALLIANCE_COIN_BONUS + ' سکه در هر نوبت</p>'
                    : '') +
                '<div class="btn-row">' +
                '<button class="modal-btn-yes" id="p18-yes">✅ قبول</button>' +
                '<button class="modal-btn-no" id="p18-no">❌ رد</button>' +
                '</div>'
            );

            document.getElementById('p18-yes').onclick = function () {
                game.relations[key] = action;
                if (!game.relationExpiry) game.relationExpiry = {};
                game.relationExpiry[key] = game.turn + duration;
                log('✅ ' + me.name + ' و ' + target.name + ' ' + actionLabel + ' کردند (' + duration + ' نوبت)');
                closeModal18(overlay);
                game.actionMode = null;
                refreshMap(); renderAll();
            };

            document.getElementById('p18-no').onclick = function () {
                log('❌ ' + target.name + ' پیشنهاد ' + actionLabel + ' را رد کرد.');
                closeModal18(overlay);
                game.actionMode = null;
                refreshMap(); renderAll();
            };

            return;
        }

        game.actionMode = null;
        refreshMap(); renderAll();
    };

    /* ============================================================
       ۴. خیانت در حمله
       ============================================================ */
    var _origClick = window.onProvinceClick;
    window.onProvinceClick = function (name) {
        if (!window.game || game.gameOver) return _origClick.apply(this, arguments);

        if (game.actionMode === 'attack' && game.attackSource) {
            var me = game.players[game.currentPlayerIndex];
            var data = game.provinceData[name];
            if (data && data.ownerId !== me.id) {
                var key = relKey(me.id, data.ownerId);
                if (game.relations[key] === 'alliance') {
                    if ((me.coins || 0) < BETRAYAL_COST) {
                        log('❌ خیانت نیاز به ' + BETRAYAL_COST + ' سکه دارد. سکه کافی نداری!');
                        return;
                    }

                    var target = game.players[data.ownerId];
                    var overlay = showModal18(
                        '<h2>💔 خیانت!</h2>' +
                        '<p>با <b style="color:' + target.color + '">' + target.name + '</b> اتحاد داری.</p>' +
                        '<p>اگر حمله کنی، اتحاد می‌شکند و <b style="color:#e74c3c">' +
                        BETRAYAL_COST + ' سکه</b> از دست می‌دهی.</p>' +
                        '<div class="btn-row">' +
                        '<button class="modal-btn-yes" id="p18-betray-yes">💔 خیانت می‌کنم</button>' +
                        '<button class="modal-btn-no" id="p18-betray-no">❌ لغو</button>' +
                        '</div>'
                    );

                    document.getElementById('p18-betray-yes').onclick = function () {
                        me.coins -= BETRAYAL_COST;
                        game.relations[key] = 'war';
                        if (game.relationExpiry) delete game.relationExpiry[key];
                        log('💔 ' + me.name + ' به متحد خود ' + target.name + ' حمله کرد! (-' + BETRAYAL_COST + ' سکه)');
                        closeModal18(overlay);
                        _origClick.call(window, name);
                    };

                    document.getElementById('p18-betray-no').onclick = function () {
                        log('لغو حمله به متحد.');
                        closeModal18(overlay);
                    };

                    return;
                }
            }
        }

        return _origClick.apply(this, arguments);
    };

    /* ============================================================
       ۵. پایان نوبت: انقضا + سود اتحاد
       ============================================================ */
    var _origEndTurn = window.endTurn;
    window.endTurn = function () {
        var r = _origEndTurn.apply(this, arguments);
        if (!window.game || game.gameOver) return r;

        // انقضا
        if (game.relationExpiry) {
            Object.keys(game.relationExpiry).forEach(function (key) {
                if (game.turn >= game.relationExpiry[key]) {
                    var oldRel = game.relations[key];
                    game.relations[key] = 'war';
                    delete game.relationExpiry[key];
                    var parts = key.split('-');
                    var p1 = game.players[parseInt(parts[0])];
                    var p2 = game.players[parseInt(parts[1])];
                    if (p1 && p2) {
                        var type = oldRel === 'alliance' ? 'اتحاد' : 'صلح';
                        log('⏰ ' + type + ' بین ' + p1.name + ' و ' + p2.name + ' منقضی شد → جنگ');
                    }
                }
            });
        }

        // سود اتحاد برای بازیکن جدید
        var me = game.players[game.currentPlayerIndex];
        if (me && me.provinces.length > 0) {
            var allianceCount = 0;
            game.players.forEach(function (p) {
                if (p.id === me.id || p.provinces.length === 0) return;
                var k = relKey(me.id, p.id);
                if (game.relations[k] === 'alliance') allianceCount++;
            });
            if (allianceCount > 0) {
                var bonus = allianceCount * ALLIANCE_COIN_BONUS;
                me.coins = (me.coins || 0) + bonus;
                log('🤝 ' + me.name + ' از ' + allianceCount + ' اتحاد +' + bonus + ' سکه');
            }
        }

        if (typeof renderAll === 'function') renderAll();
        return r;
    };

    /* ============================================================
       ۶. نمایش شمارنده
       ============================================================ */
    var _origRender = window.renderAll;
    window.renderAll = function () {
        var r = _origRender.apply(this, arguments);
        if (!window.game || game.gameOver) return r;
        if (!game.relationExpiry) return r;

        var me = game.players[game.currentPlayerIndex];
        if (!me) return r;

        var actionBox = document.getElementById('actionBox');
        if (!actionBox) return r;

        var lines = actionBox.querySelectorAll('.info-line');
        Array.prototype.forEach.call(lines, function (line) {
            if (line.querySelector('.expiry-badge')) return;
            game.players.forEach(function (p) {
                if (p.id === me.id || p.provinces.length === 0) return;
                if (line.textContent.indexOf(p.name) === -1) return;
                var k = relKey(me.id, p.id);
                var rel = game.relations[k];
                if (rel === 'war') return;
                var exp = game.relationExpiry[k];
                if (exp === undefined) return;
                var remaining = Math.max(0, exp - game.turn);
                var badge = document.createElement('span');
                badge.className = 'expiry-badge';
                badge.style.cssText = 'color:#f39c12;font-weight:bold;margin-right:8px;';
                badge.textContent = '⏳ ' + remaining;
                line.appendChild(badge);
            });
        });

        return r;
    };

    /* ============================================================
       ۷. Save / Load
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
                snap.state.p18 = { relationExpiry: game.relationExpiry || {} };
                localStorage.setItem('iran-war-save-v1', JSON.stringify(snap));
            } catch (e) { console.warn('p18 save:', e); }
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

            if (result && saved && saved.state && saved.state.p18) {
                setTimeout(function () {
                    if (!window.game) return;
                    game.relationExpiry = saved.state.p18.relationExpiry || {};
                    if (typeof renderAll === 'function') renderAll();
                }, 1350);
            }
            return result;
        };
    }

    console.log('✅ patch-18: صلح/اتحاد زمان‌دار + سود اقتصادی');
})();