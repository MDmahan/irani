/* ========== patch-12.js — ۳ حمله + توزیع عادلانه + تعادل شروع ========== */
(function () {
    console.log('🔧 patch-12: بارگذاری...');

    var ATTACKS_PER_TURN = 3;
    /* ↑ اگر ۳ زیاد بود، فقط این عدد رو عوض کن (مثلاً ۲) */

    /* ============================================================
       بخش ۱: توزیع عادلانه استان‌ها با حفظ هم‌جواری
       ============================================================ */
    function tryDistribute(adj, playerCount) {
        var allNames = Object.keys(adj);
        var total = allNames.length;
        var base = Math.floor(total / playerCount);
        var extra = total % playerCount;
        var targets = [];
        for (var i = 0; i < playerCount; i++) {
            targets.push(base + (i < extra ? 1 : 0));
        }

        var shuffled = allNames.slice();
        for (var s = shuffled.length - 1; s > 0; s--) {
            var j = Math.floor(Math.random() * (s + 1));
            var tmp = shuffled[s]; shuffled[s] = shuffled[j]; shuffled[j] = tmp;
        }
        var starts = shuffled.slice(0, playerCount);

        var assignment = {};
        var counts = [];
        for (var k = 0; k < playerCount; k++) counts.push(0);
        starts.forEach(function (st, i) { assignment[st] = i; counts[i]++; });

        var safety = 0;
        while (safety < 500) {
            safety++;
            var progress = false;
            for (var p = 0; p < playerCount; p++) {
                if (counts[p] >= targets[p]) continue;
                var candidates = [];
                for (var prov in assignment) {
                    if (assignment[prov] !== p) continue;
                    var nbs = adj[prov] || [];
                    for (var n = 0; n < nbs.length; n++) {
                        var nb = nbs[n];
                        if (assignment[nb] === undefined && candidates.indexOf(nb) === -1) {
                            candidates.push(nb);
                        }
                    }
                }
                if (candidates.length === 0) continue;
                var pick = candidates[Math.floor(Math.random() * candidates.length)];
                assignment[pick] = p;
                counts[p]++;
                progress = true;
            }
            if (!progress) break;
        }

        // پر کردن باقی‌مانده‌ها با مجاور ضعیف‌ترین
        var remaining = allNames.filter(function (n) { return assignment[n] === undefined; });
        remaining.forEach(function (prov) {
            var adjOwners = [];
            (adj[prov] || []).forEach(function (nb) {
                if (assignment[nb] !== undefined) adjOwners.push(assignment[nb]);
            });
            var target;
            if (adjOwners.length > 0) {
                target = adjOwners[0];
                for (var i = 0; i < adjOwners.length; i++) {
                    if (counts[adjOwners[i]] < counts[target]) target = adjOwners[i];
                }
            } else {
                target = 0;
                for (var i = 1; i < playerCount; i++) {
                    if (counts[i] < counts[target]) target = i;
                }
            }
            assignment[prov] = target;
            counts[target]++;
        });

        return { assignment: assignment, counts: counts };
    }

    function distributeProvinces(adj, playerCount) {
        var best = null, bestScore = Infinity;
        for (var attempt = 0; attempt < 15; attempt++) {
            var result = tryDistribute(adj, playerCount);
            var minC = Math.min.apply(null, result.counts);
            var maxC = Math.max.apply(null, result.counts);
            var score = maxC - minC;
            if (score <= 1) return result;
            if (score < bestScore) { bestScore = score; best = result; }
        }
        return best;
    }

    /* ============================================================
       بخش ۲: شمارنده حملات (۳ در هر نوبت)
       ============================================================ */
    function setupGameAttacks() {
        if (!window.game) return;
        if (game._attacksRemaining !== undefined) return;
        game._attacksRemaining = ATTACKS_PER_TURN;
        try {
            Object.defineProperty(game, 'attackUsed', {
                configurable: true,
                get: function () { return this._attacksRemaining === 0; },
                set: function (v) {
                    if (typeof this._attacksRemaining !== 'number') {
                        this._attacksRemaining = ATTACKS_PER_TURN;
                    }
                    if (v === true) {
                        this._attacksRemaining = Math.max(0, this._attacksRemaining - 1);
                    } else {
                        this._attacksRemaining = ATTACKS_PER_TURN;
                    }
                }
            });
        } catch (e) { console.warn('attackUsed override:', e); }
    }

    function getAttacksRemaining() {
        if (!window.game) return 0;
        return game._attacksRemaining !== undefined ? game._attacksRemaining : (game.attackUsed ? 0 : ATTACKS_PER_TURN);
    }

    /* ============================================================
       بخش ۳: پاداش شروع (فقط در شروع نوبت خود بازیکن)
       ============================================================ */
    function applyFirstTurnBonusIfNeeded(player) {
        if (!player || !window.game) return;
        if (player._firstTurnDone) return;
        if (player.provinces.length === 0) return;
        player._firstTurnDone = true;
        var bonus = player.id;
        if (bonus > 0) {
            player.pendingTroops = (player.pendingTroops || 0) + bonus;
            player.coins = (player.coins || 0) + bonus;
            setTimeout(function () {
                if (typeof window.log === 'function') {
                    log('⚖️ تعادل شروع ' + player.name + ': +' + bonus + ' سرباز، +' + bonus + ' سکه');
                }
            }, 400);
        }
    }

    /* ============================================================
       بخش ۴: شروع بازی
       ============================================================ */
    var _origStartGame = window.startGame;
    window.startGame = function () {
        var r = _origStartGame.apply(this, arguments);

        if (window.game && game.adjacency && game.players && game.provinceData) {
            // توزیع مجدد
            var result = distributeProvinces(game.adjacency, game.playerCount);
            game.players.forEach(function (p) { p.provinces = []; });
            Object.keys(result.assignment).forEach(function (prov) {
                var ownerId = result.assignment[prov];
                game.provinceData[prov].ownerId = ownerId;
                game.players[ownerId].provinces.push(prov);
            });

            // بازسازی درآمد بازیکن ۰
            var p0 = game.players[0];
            if (p0) {
                p0.pendingTroops = 3 + Math.floor(p0.provinces.length / 3);
                if (game.regions) {
                    var rb = 0;
                    game.regions.forEach(function (region) {
                        if (!region.provinces.length) return;
                        var ownsAll = region.provinces.every(function (prov) {
                            return game.provinceData[prov] && game.provinceData[prov].ownerId === p0.id;
                        });
                        if (ownsAll) rb += region.bonus;
                    });
                    p0.pendingTroops += rb;
                }
            }

            setupGameAttacks();
            game.players.forEach(function (p) { p._firstTurnDone = false; });
            applyFirstTurnBonusIfNeeded(game.players[0]);

            if (typeof refreshMap === 'function') refreshMap();
        }

        if (typeof renderAll === 'function') renderAll();

        setTimeout(function () {
            if (typeof window.log === 'function') {
                var logStr = '🗺️ توزیع استان‌ها: ';
                game.players.forEach(function (p, i) {
                    logStr += p.name + '=' + p.provinces.length;
                    if (i < game.playerCount - 1) logStr += '، ';
                });
                log(logStr);
                log('⚔️ هر بازیکن ' + ATTACKS_PER_TURN + ' حمله در هر نوبت دارد');
            }
        }, 300);

        return r;
    };

    /* ============================================================
       بخش ۵: پایان نوبت
       ============================================================ */
    var _origEndTurn = window.endTurn;
    window.endTurn = function () {
        var prevIdx = window.game ? game.currentPlayerIndex : -1;
        var r = _origEndTurn.apply(this, arguments);

        if (window.game && !game.gameOver && game.currentPlayerIndex !== prevIdx) {
            if (game._attacksRemaining !== undefined) {
                game._attacksRemaining = ATTACKS_PER_TURN;
            }
            var me = game.players[game.currentPlayerIndex];
            if (me && me.provinces.length > 0) {
                applyFirstTurnBonusIfNeeded(me);
            }
            if (typeof renderAll === 'function') renderAll();
        }
        return r;
    };

    /* ============================================================
       بخش ۶: نمایش شمارنده
       ============================================================ */
    var _origRender = window.renderAll;
    window.renderAll = function () {
        var r = _origRender.apply(this, arguments);
        if (!window.game || game.gameOver) return r;
        var currentBox = document.getElementById('currentPlayerBox');
        if (!currentBox) return r;

        var line = document.getElementById('p12-attacks-line');
        if (!line) {
            line = document.createElement('div');
            line.id = 'p12-attacks-line';
            line.className = 'info-line';
            line.style.fontWeight = 'bold';
            var coinLine = currentBox.querySelector('.coin-line');
            if (coinLine) currentBox.insertBefore(line, coinLine);
            else currentBox.appendChild(line);
        }
        var remaining = getAttacksRemaining();
        line.innerHTML = '⚔️ حملات: ' + remaining + ' / ' + ATTACKS_PER_TURN;
        line.style.color = remaining === 0 ? '#7f8c8d' : (remaining === 1 ? '#e67e22' : '#e74c3c');

        var allBtns = document.querySelectorAll('#actionBox .btn');
        for (var i = 0; i < allBtns.length; i++) {
            var oc = allBtns[i].getAttribute('onclick') || '';
            if (oc.indexOf("actionMode='attack'") !== -1 || oc.indexOf('actionMode="attack"') !== -1) {
                var pending = (game.players[game.currentPlayerIndex].pendingTroops || 0) > 0;
                if (pending) {
                    allBtns[i].disabled = true;
                    allBtns[i].textContent = '⚔️ حمله';
                } else if (remaining === 0) {
                    allBtns[i].disabled = true;
                    allBtns[i].textContent = '⚔️ حمله (تمام شد)';
                } else {
                    allBtns[i].disabled = false;
                    allBtns[i].textContent = '⚔️ حمله (' + remaining + ')';
                }
                break;
            }
        }
        return r;
    };

    /* ============================================================
       بخش ۷: پشتیبانی از Load
       ============================================================ */
    var _origLoad = window.p10LoadGame;
    if (typeof _origLoad === 'function') {
        window.p10LoadGame = function () {
            var r = _origLoad.apply(this, arguments);
            setTimeout(function () {
                if (window.game) {
                    if (game._attacksRemaining === undefined) setupGameAttacks();
                    else game._attacksRemaining = ATTACKS_PER_TURN;
                    game.players.forEach(function (p) { p._firstTurnDone = true; });
                    if (typeof renderAll === 'function') renderAll();
                }
            }, 700);
            return r;
        };
    }

    console.log('✅ patch-12: ۳ حمله + توزیع عادلانه + تعادل شروع');
})();