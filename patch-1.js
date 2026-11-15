/* ========== patch-1.js — همجواری استان‌ها و حمله فقط به همسایه ========== */
(function () {
    console.log('🔧 patch-1: بارگذاری...');

    var ADJACENCY = null;

    /* ---------- محاسبه همسایگی از GeoJSON ---------- */
    function computeAdjacencyAtPrecision(decimals, minShared) {
        var features = IRAN_GEOJSON.features;
        var provincePoints = {};
        var bboxes = {};

        features.forEach(function (f) {
            var name = getProvinceName(f);
            var points = new Set();
            var minX = 180, maxX = -180, minY = 90, maxY = -90;
            var geom = f.geometry;
            var polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
            polys.forEach(function (poly) {
                poly.forEach(function (ring) {
                    ring.forEach(function (c) {
                        points.add(c[0].toFixed(decimals) + ',' + c[1].toFixed(decimals));
                        if (c[0] < minX) minX = c[0];
                        if (c[0] > maxX) maxX = c[0];
                        if (c[1] < minY) minY = c[1];
                        if (c[1] > maxY) maxY = c[1];
                    });
                });
            });
            provincePoints[name] = points;
            bboxes[name] = { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
        });

        var adjacency = {};
        var names = Object.keys(provincePoints);
        names.forEach(function (n) { adjacency[n] = []; });

        for (var i = 0; i < names.length; i++) {
            for (var j = i + 1; j < names.length; j++) {
                var a = names[i], b = names[j];
                var ab = bboxes[a], bb = bboxes[b];
                var margin = 0.01;
                if (ab.maxX < bb.minX - margin || bb.maxX < ab.minX - margin ||
                    ab.maxY < bb.minY - margin || bb.maxY < ab.minY - margin) continue;

                var setA = provincePoints[a], setB = provincePoints[b];
                var smaller = setA.size < setB.size ? setA : setB;
                var larger = smaller === setA ? setB : setA;
                var shared = 0;
                smaller.forEach(function (key) { if (larger.has(key)) shared++; });

                if (shared >= minShared) {
                    adjacency[a].push(b);
                    adjacency[b].push(a);
                }
            }
        }
        return adjacency;
    }

    function countIsolated(adj) {
        return Object.keys(adj).filter(function (n) { return adj[n].length === 0; }).length;
    }

    function computeAdjacency() {
        // تلاش اول: دقت ۳ رقم اعشار (~۱۱۱ متر)
        var r = computeAdjacencyAtPrecision(3, 3);
        if (countIsolated(r) === 0) {
            console.log('✅ همسایگی با دقت ۳ رقم اعشار محاسبه شد');
            return r;
        }

        // تلاش دوم: دقت ۲ رقم اعشار (~۱ کیلومتر)
        console.log('⚠️ تلاش مجدد با دقت کمتر...');
        var r2 = computeAdjacencyAtPrecision(2, 5);
        if (countIsolated(r2) === 0) {
            console.log('✅ همسایگی با دقت ۲ رقم اعشار محاسبه شد');
            return r2;
        }

        // ترکیب هر دو (برای بیشترین پوشش)
        var combined = {};
        Object.keys(r).forEach(function (n) {
            var set = {};
            r[n].concat(r2[n] || []).forEach(function (x) { set[x] = true; });
            combined[n] = Object.keys(set);
        });
        console.log('✅ همسایگی ترکیبی محاسبه شد');
        return combined;
    }

    function getAdjacency() {
        if (!ADJACENCY) {
            log('⏳ در حال محاسبه همسایگی استان‌ها... (یک‌بار)');
            ADJACENCY = computeAdjacency();
            var totalEdges = 0;
            Object.keys(ADJACENCY).forEach(function (n) { totalEdges += ADJACENCY[n].length; });
            log('✅ همسایگی محاسبه شد (' + (totalEdges / 2) + ' مرز مشترک)');
        }
        return ADJACENCY;
    }

    /* ---------- بازنویسی شروع بازی با توزیع پیوسته ---------- */
    window.startGame = function () {
        var n = parseInt(document.getElementById('playerCount').value);
        var adj = getAdjacency();

        game = {
            players: [], currentPlayerIndex: 0, provinceData: {}, relations: {},
            turn: 1, map: null, layer: null, provinceLayers: {},
            actionMode: null, attackUsed: false, gameOver: false, playerCount: n,
            adjacency: adj
        };
        for (var i = 0; i < n; i++)
            game.players.push({ id: i, name: 'بازیکن ' + (i + 1), color: COLORS[i], provinces: [] });
        for (var a = 0; a < n; a++)
            for (var b = a + 1; b < n; b++)
                game.relations[relKey(a, b)] = 'peace';

        var allNames = IRAN_GEOJSON.features.map(getProvinceName);
        var pool = allNames.slice();
        shuffle(pool);

        // نقطه شروع تصادفی برای هر بازیکن
        var starts = pool.slice(0, n);
        var assignment = {};
        var playerProvs = [];
        for (var i = 0; i < n; i++) {
            assignment[starts[i]] = i;
            playerProvs.push([starts[i]]);
        }

        var unassigned = pool.slice(n);
        var currentP = 0;
        var safety = 0;

        // رشد نوبتی از هر قلمرو به استان‌های خالی مجاور
        while (unassigned.length > 0 && safety < 10000) {
            safety++;
            var candidates = [];
            playerProvs[currentP].forEach(function (p) {
                (adj[p] || []).forEach(function (nb) {
                    if (assignment[nb] === undefined && candidates.indexOf(nb) === -1)
                        candidates.push(nb);
                });
            });

            if (candidates.length === 0) {
                // ببین آیا بازیکن دیگری می‌تونه رشد کنه
                var anyCanGrow = false;
                for (var pp = 0; pp < n; pp++) {
                    playerProvs[pp].some(function (prov) {
                        return (adj[prov] || []).some(function (nb) {
                            if (assignment[nb] === undefined) { anyCanGrow = true; return true; }
                            return false;
                        });
                    });
                    if (anyCanGrow) break;
                }
                if (!anyCanGrow) break;
                currentP = (currentP + 1) % n;
                continue;
            }

            var pick = candidates[Math.floor(Math.random() * candidates.length)];
            assignment[pick] = currentP;
            playerProvs[currentP].push(pick);
            unassigned = unassigned.filter(function (p) { return p !== pick; });
            currentP = (currentP + 1) % n;
        }

        // باقی‌مانده‌ها: به بازیکن مجاور بده
        unassigned.forEach(function (p) {
            var found = false;
            (adj[p] || []).forEach(function (nb) {
                if (!found && assignment[nb] !== undefined) {
                    assignment[p] = assignment[nb];
                    playerProvs[assignment[p]].push(p);
                    found = true;
                }
            });
            if (!found) {
                var r = Math.floor(Math.random() * n);
                assignment[p] = r;
                playerProvs[r].push(p);
            }
        });

        allNames.forEach(function (name) {
            var ownerId = assignment[name];
            game.provinceData[name] = { ownerId: ownerId };
            game.players[ownerId].provinces.push(name);
        });

        document.getElementById('setup').style.display = 'none';
        document.getElementById('game').style.display = 'block';

        game.map = L.map('map', { center: [32.4279, 53.6880], zoom: 5, minZoom: 4, maxZoom: 9 });
        game.layer = L.geoJSON(IRAN_GEOJSON, {
            style: getProvinceStyle,
            onEachFeature: function (f, lyr) {
                var name = getProvinceName(f);
                game.provinceLayers[name] = lyr;
                lyr.bindTooltip(name, { direction: 'center', className: 'leaflet-tooltip' });
                lyr.on('click', function () { onProvinceClick(name); });
            }
        }).addTo(game.map);
        game.map.fitBounds(game.layer.getBounds());

        renderAll();
        log('🎮 بازی با ' + n + ' بازیکن شروع شد!');
        log('👤 ' + game.players[0].name + ' شروع می‌کند.');
        log('ℹ️ استان‌های هر بازیکن همجوار هستند. فقط به استان‌های مجاور دشمن می‌توان حمله کرد.');
    };

    /* ---------- بازنویسی کلیک استان: چک همسایگی ---------- */
    window.onProvinceClick = function (name) {
        if (!game || game.gameOver) return;
        var data = game.provinceData[name];
        var me = game.players[game.currentPlayerIndex];

        if (game.actionMode === 'attack') {
            if (data.ownerId === me.id) { log('❌ این استان خودت است!'); return; }

            var isAdjacent = false;
            me.provinces.forEach(function (p) {
                if ((game.adjacency[p] || []).indexOf(name) !== -1) isAdjacent = true;
            });
            if (!isAdjacent) {
                log('❌ ' + name + ' با استان‌های تو مرز مشترک ندارد!');
                return;
            }

            var key = relKey(me.id, data.ownerId);
            if (game.relations[key] === 'alliance') {
                log('⚠️ با این بازیکن اتحاد داری.');
                return;
            }
            if (game.relations[key] !== 'war') {
                game.relations[key] = 'war';
                log('📢 ' + me.name + ' به ' + game.players[data.ownerId].name + ' اعلام جنگ کرد!');
            }
            attemptAttack(name);
            game.actionMode = null;
            game.attackUsed = true;
            refreshMap(); renderAll();
            return;
        }
        log('📍 ' + name + ' — مالک: ' + game.players[data.ownerId].name);
    };

    /* ---------- بازنویسی renderAll: هایلایت اهداف معتبر ---------- */
    var _originalRenderAll = window.renderAll;
    window.renderAll = function () {
        if (!game) { _originalRenderAll(); return; }

        // اگر در حالت حمله‌ایم ولی هدفی نیست، خودکار خارج شو
        if (game.actionMode === 'attack') {
            var me = game.players[game.currentPlayerIndex];
            var hasTarget = false;
            me.provinces.forEach(function (p) {
                (game.adjacency[p] || []).forEach(function (nb) {
                    var nbData = game.provinceData[nb];
                    if (!nbData) return;
                    if (nbData.ownerId === me.id) return;
                    if (game.relations[relKey(me.id, nbData.ownerId)] === 'alliance') return;
                    hasTarget = true;
                });
            });
            if (!hasTarget) {
                log('⚠️ هیچ استان قابل حمله‌ای نداری (همه همسایه‌ها مال خودت یا متحدت هستند).');
                game.actionMode = null;
            }
        }

        if (game.layer) refreshMap();
        _originalRenderAll();

        // هایلایت اهداف معتبر
        if (game.actionMode === 'attack' && game.layer) {
            var me2 = game.players[game.currentPlayerIndex];
            game.layer.eachLayer(function (lyr) {
                var name = getProvinceName(lyr.feature);
                var d = game.provinceData[name];
                if (!d || d.ownerId === me2.id) return;
                var isAdj = false;
                me2.provinces.forEach(function (p) {
                    if ((game.adjacency[p] || []).indexOf(name) !== -1) isAdj = true;
                });
                if (isAdj && game.relations[relKey(me2.id, d.ownerId)] !== 'alliance') {
                    lyr.setStyle({ weight: 3, color: '#ff0000', dashArray: '6,4', fillOpacity: 0.85 });
                    if (lyr.bringToFront) lyr.bringToFront();
                }
            });
        }
    };

    console.log('✅ patch-1: آماده (همجواری + حمله فقط به همسایه)');
})();