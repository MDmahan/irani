/* ========== patch-16.js — توزیع عادلانه مناطق با اولویت دیرترها ========== */
(function () {
    console.log('🗺️ patch-16: بارگذاری...');

    /* ============================================================
       ۱. چک هم‌جواری (BFS)
       ============================================================ */
    function isContiguous(game, playerId) {
        var provs = game.players[playerId].provinces;
        if (provs.length <= 1) return true;
        var visited = {};
        var queue = [provs[0]];
        visited[provs[0]] = true;
        var count = 1;
        while (queue.length > 0) {
            var cur = queue.shift();
            var nbs = game.adjacency[cur] || [];
            for (var n = 0; n < nbs.length; n++) {
                var nb = nbs[n];
                if (visited[nb]) continue;
                if (game.provinceData[nb].ownerId !== playerId) continue;
                visited[nb] = true;
                count++;
                queue.push(nb);
            }
        }
        return count === provs.length;
    }

    /* ============================================================
       ۲. پیدا کردن همه کامل‌شده‌ها
       ============================================================ */
    function findCompletions(game) {
        var out = [];
        if (!game.regions || !game.players) return out;
        game.regions.forEach(function (region) {
            if (region.provinces.length === 0) return;
            game.players.forEach(function (p) {
                if (p.provinces.length === 0) return;
                var owns = true;
                for (var i = 0; i < region.provinces.length; i++) {
                    if (game.provinceData[region.provinces[i]].ownerId !== p.id) {
                        owns = false; break;
                    }
                }
                if (owns) out.push({ region: region, ownerId: p.id });
            });
        });
        return out;
    }

    /* ============================================================
       ۳. تعویض تک‌استان (شکستن منطقه)
       ============================================================ */
    function trySwap(game, region, ownerId) {
        var size = region.provinces.length;
        var provs = region.provinces.slice();
        for (var i = provs.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = provs[i]; provs[i] = provs[j]; provs[j] = t;
        }
        for (var pi = 0; pi < provs.length; pi++) {
            var prov = provs[pi];
            var nbs = game.adjacency[prov] || [];
            for (var ni = 0; ni < nbs.length; ni++) {
                var nb = nbs[ni];
                var nbOwnerId = game.provinceData[nb].ownerId;
                if (nbOwnerId === ownerId) continue;
                var nbCount = 0;
                for (var k = 0; k < size; k++) {
                    if (region.provinces[k] !== prov &&
                        game.provinceData[region.provinces[k]].ownerId === nbOwnerId) nbCount++;
                }
                if (nbCount + 1 >= size) continue;
                var nbProvs = game.players[nbOwnerId].provinces.slice();
                for (var s = nbProvs.length - 1; s > 0; s--) {
                    var t2 = Math.floor(Math.random() * (s + 1));
                    var tmp = nbProvs[s]; nbProvs[s] = nbProvs[t2]; nbProvs[t2] = tmp;
                }
                for (var ei = 0; ei < nbProvs.length; ei++) {
                    var exProv = nbProvs[ei];
                    if (region.provinces.indexOf(exProv) !== -1) continue;
                    var exNbs = game.adjacency[exProv] || [];
                    var adj = false;
                    for (var xi = 0; xi < exNbs.length; xi++) {
                        if (game.provinceData[exNbs[xi]].ownerId === ownerId) { adj = true; break; }
                    }
                    if (!adj) continue;

                    var oldProvOwner = game.provinceData[prov].ownerId;
                    var oldExOwner = game.provinceData[exProv].ownerId;
                    var oldOwnerProvs = game.players[ownerId].provinces.slice();
                    var oldNbProvs = game.players[nbOwnerId].provinces.slice();

                    game.provinceData[prov].ownerId = nbOwnerId;
                    game.provinceData[exProv].ownerId = ownerId;

                    var oIdx = game.players[ownerId].provinces.indexOf(prov);
                    if (oIdx !== -1) game.players[ownerId].provinces.splice(oIdx, 1);
                    game.players[ownerId].provinces.push(exProv);
                    var nIdx = game.players[nbOwnerId].provinces.indexOf(exProv);
                    if (nIdx !== -1) game.players[nbOwnerId].provinces.splice(nIdx, 1);
                    game.players[nbOwnerId].provinces.push(prov);

                    if (isContiguous(game, ownerId) && isContiguous(game, nbOwnerId)) {
                        return { prov: prov, exProv: exProv, fromPlayer: ownerId, toPlayer: nbOwnerId };
                    }

                    game.provinceData[prov].ownerId = oldProvOwner;
                    game.provinceData[exProv].ownerId = oldExOwner;
                    game.players[ownerId].provinces = oldOwnerProvs;
                    game.players[nbOwnerId].provinces = oldNbProvs;
                }
            }
        }
        return null;
    }

    /* ============================================================
       ۴. تعویض جراحی (فقط استان‌های منطقه)
       ============================================================ */
    function surgicalSwap(game, region, ownerId, targetId) {
        var regionProvs = region.provinces.slice();
        var targetProvs = game.players[targetId].provinces.slice();
        if (targetProvs.length < regionProvs.length) return false;

        for (var attempt = 0; attempt < 60; attempt++) {
            for (var i = targetProvs.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var t = targetProvs[i]; targetProvs[i] = targetProvs[j]; targetProvs[j] = t;
            }
            var swapProvs = targetProvs.slice(0, regionProvs.length);

            var savedRegionOwners = regionProvs.map(function (p) { return game.provinceData[p].ownerId; });
            var savedSwapOwners = swapProvs.map(function (p) { return game.provinceData[p].ownerId; });
            var savedOwnerProvs = game.players[ownerId].provinces.slice();
            var savedTargetProvs = game.players[targetId].provinces.slice();

            regionProvs.forEach(function (p) { game.provinceData[p].ownerId = targetId; });
            swapProvs.forEach(function (p) { game.provinceData[p].ownerId = ownerId; });

            game.players[ownerId].provinces = savedOwnerProvs.filter(function (p) {
                return regionProvs.indexOf(p) === -1;
            }).concat(swapProvs);

            game.players[targetId].provinces = savedTargetProvs.filter(function (p) {
                return swapProvs.indexOf(p) === -1;
            }).concat(regionProvs);

            if (isContiguous(game, ownerId) && isContiguous(game, targetId)) {
                return true;
            }

            regionProvs.forEach(function (p, i) { game.provinceData[p].ownerId = savedRegionOwners[i]; });
            swapProvs.forEach(function (p, i) { game.provinceData[p].ownerId = savedSwapOwners[i]; });
            game.players[ownerId].provinces = savedOwnerProvs;
            game.players[targetId].provinces = savedTargetProvs;
        }
        return false;
    }

    /* ============================================================
       ۵. تعویض کل قلمرو
       ============================================================ */
    function swapAllTerritories(game, p1, p2) {
        if (p1 === p2) return;
        var provs1 = game.players[p1].provinces.slice();
        var provs2 = game.players[p2].provinces.slice();
        provs1.forEach(function (p) { game.provinceData[p].ownerId = p2; });
        provs2.forEach(function (p) { game.provinceData[p].ownerId = p1; });
        game.players[p1].provinces = provs2;
        game.players[p2].provinces = provs1;
    }

    /* ============================================================
       ۶. حلقه اصلی
       ============================================================ */
    function fixAllCompletions(game) {
        var lastPlayerId = game.playerCount - 1;
        var fixed = 0;
        var failedSet = {};
        var swaps = [];
        var reassigned = [];
        var accepted = [];

        // فاز ۱: تلاش برای شکستن هر منطقه
        for (var round = 0; round < 3; round++) {
            var completions = findCompletions(game);
            if (completions.length === 0) break;
            var progress = false;
            for (var i = 0; i < completions.length; i++) {
                var c = completions[i];
                if (failedSet[c.region.name]) continue;
                var broke = null;
                for (var att = 0; att < 15; att++) {
                    var sw = trySwap(game, c.region, c.ownerId);
                    if (sw) { broke = sw; break; }
                }
                if (broke) {
                    fixed++;
                    progress = true;
                    swaps.push({
                        region: c.region.name,
                        from: game.players[broke.fromPlayer].name,
                        to: game.players[broke.toPlayer].name
                    });
                } else {
                    failedSet[c.region.name] = true;
                }
            }
            if (!progress) break;
        }

        // فاز ۲: مناطق ناموفق → واگذاری به دیرترها
        var final = findCompletions(game);
        var usedTargets = {};
        var targetsOrder = [];
        for (var ti = game.playerCount - 1; ti >= 0; ti--) targetsOrder.push(ti);

        final.sort(function (a, b) { return a.ownerId - b.ownerId; });

        final.forEach(function (c) {
            var currentOwner = game.provinceData[c.region.provinces[0]].ownerId;

            // اگر مال آخرین بازیکن است → قبول
            if (currentOwner === lastPlayerId) {
                accepted.push({
                    region: c.region.name,
                    owner: game.players[currentOwner].name
                });
                return;
            }

            // پیدا کردن هدف
            var target = -1;
            for (var tIdx = 0; tIdx < targetsOrder.length; tIdx++) {
                var tid = targetsOrder[tIdx];
                if (tid === currentOwner) continue;
                if (usedTargets[tid]) continue;
                target = tid;
                break;
            }
            if (target === -1) return;

            // اول جراحی
            if (surgicalSwap(game, c.region, currentOwner, target)) {
                usedTargets[target] = true;
                reassigned.push({
                    region: c.region.name,
                    from: game.players[currentOwner].name,
                    to: game.players[target].name,
                    type: 'surgical'
                });
                return;
            }

            // فال‌بک: تعویض کامل
            swapAllTerritories(game, currentOwner, target);
            usedTargets[target] = true;
            reassigned.push({
                region: c.region.name,
                from: game.players[currentOwner].name,
                to: game.players[target].name,
                type: 'full'
            });
        });

        // بررسی نهایی
        var remaining = findCompletions(game).filter(function (c) {
            return c.ownerId !== lastPlayerId;
        });

        return {
            fixed: fixed,
            swaps: swaps,
            reassigned: reassigned,
            accepted: accepted,
            failed: remaining.map(function (c) {
                return { region: c.region.name, owner: game.players[c.ownerId].name };
            })
        };
    }

    /* ============================================================
       ۷. هوک startGame
       ============================================================ */
    var _origStart = window.startGame;
    window.startGame = function () {
        var r = _origStart.apply(this, arguments);
        setTimeout(function () {
            if (!window.game || !game.players || !game.regions) return;

            var before = findCompletions(game);
            if (before.length === 0) {
                if (typeof window.log === 'function') {
                    log('✅ از ابتدا هیچ بازیکنی منطقه کامل نداشت');
                }
                return;
            }

            if (typeof window.log === 'function') {
                log('⚠️ قبل از اصلاح: ' + before.map(function (c) {
                    return game.players[c.ownerId].name + ' = ' + c.region.name;
                }).join('، '));
            }

            var result = fixAllCompletions(game);

            if (typeof refreshMap === 'function') refreshMap();
            if (typeof renderAll === 'function') renderAll();

            if (typeof window.log !== 'function') return;

            result.swaps.forEach(function (s) {
                log('🔧 شکستن ' + s.region + ': ' + s.from + ' → ' + s.to);
            });
            result.reassigned.forEach(function (s) {
                log('🔄 واگذاری ' + s.region + ': ' + s.from + ' ← ' + s.to +
                    (s.type === 'full' ? ' (تعویض کامل)' : ' (تعویض جراحی)'));
            });
            result.accepted.forEach(function (s) {
                log('✅ ' + s.region + ' نزد ' + s.owner + ' (آخرین) پذیرفته شد');
            });
            result.failed.forEach(function (s) {
                log('⚠️ نتوانستم ' + s.region + ' (مال ' + s.owner + ') را بشکنم');
            });

            log('📊 خلاصه: ' + result.fixed + ' شکستن، ' +
                result.reassigned.length + ' واگذاری، ' +
                result.accepted.length + ' پذیرش، ' +
                result.failed.length + ' ناموفق');
        }, 700);
        return r;
    };

    console.log('✅ patch-16: توزیع عادلانه با اولویت دیرترها');
})();