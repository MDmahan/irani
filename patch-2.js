/* ========== patch-2.js — سیستم نیرو، درآمد، و نبرد تدریجی ========== */
(function () {
    console.log('🔧 patch-2: بارگذاری...');

    /* ---------- CSS نیروها ---------- */
    var style = document.createElement('style');
    style.textContent = `
        .troop-count {
            background: rgba(255,255,255,0.95);
            border: 3px solid #333;
            border-radius: 50%;
            width: 26px; height: 26px;
            display: flex; align-items: center; justify-content: center;
            font-family: Tahoma; font-weight: bold; font-size: 12px;
            color: #111; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    /* ---------- ابزار ---------- */
    function syncPlayerProvinces() {
        game.players.forEach(function (p) { p.provinces = []; });
        Object.keys(game.provinceData).forEach(function (name) {
            var oid = game.provinceData[name].ownerId;
            game.players[oid].provinces.push(name);
        });
    }

    function createTroopMarkers() {
        game.troopMarkers = {};
        Object.keys(game.provinceData).forEach(function (name) {
            var lyr = game.provinceLayers[name];
            if (!lyr) return;
            var c = lyr.getBounds().getCenter();
            var d = game.provinceData[name];
            var ownerColor = game.players[d.ownerId].color;
            var marker = L.marker(c, {
                icon: L.divIcon({
                    className: 'troop-count',
                    html: '<span>' + d.troops + '</span>',
                    iconSize: [26, 26]
                }),
                interactive: false,
                zIndexOffset: 1000
            }).addTo(game.map);
            marker._icon.style.borderColor = ownerColor;
            game.troopMarkers[name] = marker;
        });
    }

    function updateTroopMarkers() {
        if (!game || !game.troopMarkers) return;
        Object.keys(game.troopMarkers).forEach(function (name) {
            var m = game.troopMarkers[name];
            var d = game.provinceData[name];
            if (!m._icon || !d) return;
            m._icon.innerHTML = '<span>' + d.troops + '</span>';
            m._icon.style.borderColor = game.players[d.ownerId].color;
        });
    }

    function startTurnIncome() {
        var me = game.players[game.currentPlayerIndex];
        var income = 3 + Math.floor(me.provinces.length / 3);
        me.pendingTroops = (me.pendingTroops || 0) + income;
        log('💰 ' + me.name + ' ' + income + ' نیرو دریافت کرد');
    }

    /* ---------- توزیع خودکار ---------- */
    window.autoDistribute = function () {
        var me = game.players[game.currentPlayerIndex];
        var amount = me.pendingTroops || 0;
        if (amount === 0) return;
        var border = [], interior = [];
        me.provinces.forEach(function (p) {
            var isBorder = (game.adjacency[p] || []).some(function (nb) {
                return game.provinceData[nb] && game.provinceData[nb].ownerId !== me.id;
            });
            if (isBorder) border.push(p); else interior.push(p);
        });
        var targets = border.length > 0 ? border : me.provinces;
        if (targets.length === 0) return;
        for (var i = 0; i < amount; i++)
            game.provinceData[targets[i % targets.length]].troops++;
        me.pendingTroops = 0;
        game.actionMode = null;
        log('📥 ' + amount + ' نیرو خودکار توزیع شد.');
        updateTroopMarkers();
        refreshMap(); renderAll();
    };

    /* ---------- نبرد تدریجی (Risk-style) ---------- */
    function resolveBattle(sourceName, targetName) {
        var s = game.provinceData[sourceName];
        var t = game.provinceData[targetName];
        var me = game.players[game.currentPlayerIndex];
        var defender = game.players[t.ownerId];
        var attacking = s.troops - 1;
        var defending = t.troops;
        var attackInit = attacking, defInit = defending;

        log('⚔️ ' + sourceName + ' (' + s.troops + ') → ' + targetName + ' (' + t.troops + ')');

        var round = 0;
        while (attacking > 0 && defending > 0 && round < 30) {
            round++;
            var aDice = [], dDice = [];
            var aCount = Math.min(3, attacking);
            var dCount = Math.min(2, defending);
            for (var i = 0; i < aCount; i++) aDice.push(1 + Math.floor(Math.random() * 6));
            for (var j = 0; j < dCount; j++) dDice.push(1 + Math.floor(Math.random() * 6));
            aDice.sort(function (x, y) { return y - x; });
            dDice.sort(function (x, y) { return y - x; });
            var aLoss = 0, dLoss = 0;
            var pairs = Math.min(aDice.length, dDice.length);
            for (var k = 0; k < pairs; k++) {
                if (aDice[k] > dDice[k]) dLoss++;
                else aLoss++;
            }
            attacking -= aLoss;
            defending -= dLoss;
            log('  دور ' + round + ': ⚔️[' + aDice.join(',') + '] 🛡️[' + dDice.join(',') + '] → تلفات ' + aLoss + ' / ' + dLoss);
        }

        if (defending <= 0 && attacking > 0) {
            t.ownerId = s.ownerId;
            t.troops = attacking;
            s.troops = 1;
            syncPlayerProvinces();
            updateTroopMarkers();
            log('✅ ' + me.name + ' استان ' + targetName + ' را فتح کرد! (' + attacking + ' نیرو منتقل شد)');
            if (me.provinces.length === TOTAL_PROVINCES) { endGame(me); return; }
            if (defender.provinces.length === 0) log('💀 ' + defender.name + ' حذف شد!');
        } else {
            s.troops = 1 + attacking;
            t.troops = Math.max(1, defending);
            log('❌ حمله ناکام. ' + sourceName + ' عقب‌نشینی کرد. تلفات: مهاجم ' + (attackInit - attacking) + '، مدافع ' + (defInit - defending));
            updateTroopMarkers();
        }
    }

    /* ---------- استایل: استان مبدأ زرد ---------- */
    var _origStyle = window.getProvinceStyle;
    window.getProvinceStyle = function (f) {
        var name = typeof f === 'string' ? f : getProvinceName(f);
        if (game && game.attackSource === name)
            return { fillColor: '#ffeb3b', weight: 4, color: '#000', opacity: 1, fillOpacity: 0.92 };
        return _origStyle(f);
    };

    /* ---------- کلیک استان: چیدمان دستی + حمله دومرحله‌ای ---------- */
    window.onProvinceClick = function (name) {
        if (!game || game.gameOver || !game.adjacency) return;
        var data = game.provinceData[name];
        if (!data) return;
        var me = game.players[game.currentPlayerIndex];

        // چیدمان دستی
        if (game.actionMode === 'place') {
            if (data.ownerId !== me.id) { log('❌ این استان تو نیست!'); return; }
            if (!me.pendingTroops || me.pendingTroops <= 0) {
                game.actionMode = null; refreshMap(); renderAll(); return;
            }
            data.troops++;
            me.pendingTroops--;
            updateTroopMarkers();
            refreshMap(); renderAll();
            if (me.pendingTroops === 0) {
                game.actionMode = null;
                log('✅ همه نیروها چیده شد.');
                renderAll();
            }
            return;
        }

        // حمله
        if (game.actionMode === 'attack') {
            if (me.pendingTroops > 0) { log('❌ اول نیروهایت را توزیع کن!'); return; }
            if (game.attackUsed) { log('❌ در این نوبت حمله کرده‌ای.'); return; }

            if (!game.attackSource) {
                if (data.ownerId !== me.id) { log('❌ این استان تو نیست!'); return; }
                if (data.troops < 2) { log('❌ حداقل ۲ نیرو برای حمله لازم است!'); return; }
                game.attackSource = name;
                log('🎯 مبدأ: ' + name + ' (' + data.troops + ' نیرو). استان مجاور دشمن را انتخاب کن.');
                refreshMap(); renderAll();
                return;
            }

            if (name === game.attackSource) {
                game.attackSource = null;
                log('لغو مبدأ.');
                refreshMap(); renderAll();
                return;
            }
            if (data.ownerId === me.id) {
                if (data.troops < 2) { log('❌ این استان حداقل ۲ نیرو ندارد!'); return; }
                game.attackSource = name;
                log('🎯 مبدأ جدید: ' + name + ' (' + data.troops + ' نیرو)');
                refreshMap(); renderAll();
                return;
            }
            var isAdj = (game.adjacency[game.attackSource] || []).indexOf(name) !== -1;
            if (!isAdj) { log('❌ ' + name + ' با ' + game.attackSource + ' مرز مشترک ندارد!'); return; }
            var key = relKey(me.id, data.ownerId);
            if (game.relations[key] === 'alliance') {
                log('⚠️ با این بازیکن اتحاد داری.');
                return;
            }
            if (game.relations[key] !== 'war') {
                game.relations[key] = 'war';
                log('📢 ' + me.name + ' به ' + game.players[data.ownerId].name + ' اعلام جنگ کرد!');
            }
            var srcName = game.attackSource;
            game.attackSource = null;
            game.actionMode = null;
            game.attackUsed = true;
            resolveBattle(srcName, name);
            refreshMap(); renderAll();
            return;
        }

        log('📍 ' + name + ' — مالک: ' + game.players[data.ownerId].name + ' — نیرو: ' + data.troops);
    };

    /* ---------- بازنویسی renderAll ---------- */
    window.renderAll = function () {
        if (!game || game.gameOver) return;
        if (game.layer) refreshMap();
        var me = game.players[game.currentPlayerIndex];
        var others = game.players.filter(function (p) { return p.id !== me.id && p.provinces.length > 0; });
        var pending = me.pendingTroops || 0;
        var totalTroops = 0;
        me.provinces.forEach(function (p) { totalTroops += game.provinceData[p].troops; });

        document.getElementById('currentPlayerBox').innerHTML =
            '<b style="color:' + me.color + ';font-size:15px">' + me.name + '</b> — نوبت شما<br>' +
            '<div class="info-line">🗺️ استان‌ها: ' + me.provinces.length + ' / ' + TOTAL_PROVINCES + '</div>' +
            '<div class="info-line">🗡️ نیروی کل: ' + totalTroops + '</div>' +
            '<div class="info-line">🔄 دور: ' + game.turn + '</div>' +
            (pending > 0 ? '<div class="info-line" style="color:#f1c40f;font-weight:bold">📥 ' + pending + ' نیرو در انتظار توزیع</div>' : '');

        var act = '';
        if (pending > 0) {
            act += '<b style="color:#f1c40f;font-size:14px">💰 ' + pending + ' نیرو برای توزیع</b><br>' +
                '<button class="btn success" onclick="autoDistribute()">📥 توزیع خودکار</button>' +
                '<button class="btn" onclick="game.actionMode=\'place\'; renderAll()">✏️ چیدمان دستی</button>';
            if (game.actionMode === 'place')
                act += '<div class="info-line" style="color:#f39c12">روی استان‌های خودت کلیک کن</div>' +
                    '<button class="btn" onclick="game.actionMode=null; renderAll()">لغو</button>';
        } else if (game.actionMode === 'attack') {
            if (game.attackSource) {
                act += '<b style="color:#f39c12">🎯 مبدأ: ' + game.attackSource + ' (' + game.provinceData[game.attackSource].troops + ' نیرو)</b><br>' +
                    '<div class="info-line">روی استان دشمن مجاور کلیک کن</div>' +
                    '<button class="btn" onclick="game.attackSource=null; refreshMap(); renderAll()">لغو مبدأ</button>' +
                    '<button class="btn" onclick="game.actionMode=null; game.attackSource=null; refreshMap(); renderAll()">لغو کامل</button>';
            } else {
                act += '<b style="color:#f39c12">⚔️ روی استان خودت (حداقل ۲ نیرو) کلیک کن</b><br>' +
                    '<button class="btn" onclick="game.actionMode=null; renderAll()">لغو</button>';
            }
        } else if (game.actionMode === 'war') {
            act = '<b style="color:#f39c12">📢 هدف جنگ:</b><br>';
            others.forEach(function (p) {
                if (game.relations[relKey(me.id, p.id)] === 'peace')
                    act += '<button class="btn danger" onclick="doAction(' + p.id + ',\'war\')">' + p.name + '</button>';
            });
            act += '<button class="btn" onclick="game.actionMode=null; renderAll()">لغو</button>';
        } else if (game.actionMode === 'peace') {
            act = '<b style="color:#f39c12">🕊️ پیشنهاد صلح:</b><br>';
            others.forEach(function (p) {
                if (game.relations[relKey(me.id, p.id)] === 'war')
                    act += '<button class="btn success" onclick="doAction(' + p.id + ',\'peace\')">' + p.name + '</button>';
            });
            act += '<button class="btn" onclick="game.actionMode=null; renderAll()">لغو</button>';
        } else if (game.actionMode === 'alliance') {
            act = '<b style="color:#f39c12">🤝 پیشنهاد اتحاد:</b><br>';
            others.forEach(function (p) {
                if (game.relations[relKey(me.id, p.id)] === 'peace')
                    act += '<button class="btn success" onclick="doAction(' + p.id + ',\'alliance\')">' + p.name + '</button>';
            });
            act += '<button class="btn" onclick="game.actionMode=null; renderAll()">لغو</button>';
        } else if (game.actionMode === 'break') {
            act = '<b style="color:#f39c12">💔 شکستن اتحاد:</b><br>';
            others.forEach(function (p) {
                if (game.relations[relKey(me.id, p.id)] === 'alliance')
                    act += '<button class="btn warning" onclick="doAction(' + p.id + ',\'break\')">' + p.name + '</button>';
            });
            act += '<button class="btn" onclick="game.actionMode=null; renderAll()">لغو</button>';
        } else {
            var attackDisabled = game.attackUsed || pending > 0;
            act += '<button class="btn danger" onclick="game.actionMode=\'attack\'; game.attackSource=null; renderAll()"' + (attackDisabled ? ' disabled' : '') + '>⚔️ حمله' + (game.attackUsed ? ' (استفاده شده)' : '') + '</button>';
            act += '<button class="btn danger" onclick="game.actionMode=\'war\'; renderAll()">📢 اعلام جنگ</button>';
            act += '<button class="btn success" onclick="game.actionMode=\'peace\'; renderAll()">🕊️ پیشنهاد صلح</button>';
            act += '<button class="btn success" onclick="game.actionMode=\'alliance\'; renderAll()">🤝 پیشنهاد اتحاد</button>';
            act += '<button class="btn warning" onclick="game.actionMode=\'break\'; renderAll()">💔 شکستن اتحاد</button>';
        }

        act += '<h3>روابط شما:</h3>';
        others.forEach(function (p) {
            var rel = game.relations[relKey(me.id, p.id)];
            var label = { peace: '🕊️ صلح', war: '⚔️ جنگ', alliance: '🤝 اتحاد' }[rel];
            var pt = 0;
            p.provinces.forEach(function (pr) { pt += game.provinceData[pr].troops; });
            act += '<div class="info-line"><span class="player-tag" style="background:' + p.color + '"></span>' + p.name +
                ' (' + p.provinces.length + ' استان، ' + pt + ' نیرو) — ' + label + '</div>';
        });
        document.getElementById('actionBox').innerHTML = act;

        // هایلایت اهداف معتبر
        if (game.actionMode === 'attack' && game.attackSource && game.layer) {
            var hasTarget = false;
            (game.adjacency[game.attackSource] || []).forEach(function (nb) {
                var d = game.provinceData[nb];
                if (!d || d.ownerId === me.id) return;
                if (game.relations[relKey(me.id, d.ownerId)] === 'alliance') return;
                hasTarget = true;
                var lyr = game.provinceLayers[nb];
                if (lyr) lyr.setStyle({ weight: 3.5, color: '#ff0000', dashArray: '6,4', fillOpacity: 0.9 });
            });
            if (!hasTarget) {
                log('⚠️ هیچ هدفی از این مبدأ وجود ندارد.');
                game.attackSource = null;
                refreshMap();
            }
        }
    };

    /* ---------- بازنویسی startGame ---------- */
    var _origStartGame = window.startGame;
    window.startGame = function () {
        _origStartGame();
        Object.keys(game.provinceData).forEach(function (name) {
            game.provinceData[name].troops = 2;
        });
        game.players.forEach(function (p) { p.pendingTroops = 0; });
        game.attackSource = null;
        createTroopMarkers();
        startTurnIncome();
        refreshMap(); renderAll();
    };

    /* ---------- بازنویسی endTurn ---------- */
    window.endTurn = function () {
        if (!game || game.gameOver) return;
        var me = game.players[game.currentPlayerIndex];
        if ((me.pendingTroops || 0) > 0 && !confirm('هنوز ' + me.pendingTroops + ' نیرو توزیع نکرده‌ای. پایان نوبت؟')) return;
        game.attackSource = null;
        game.actionMode = null;
        game.attackUsed = false;
        var attempts = 0;
        do {
            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerCount;
            if (game.currentPlayerIndex === 0) game.turn++;
            attempts++;
        } while (game.players[game.currentPlayerIndex].provinces.length === 0 && attempts < game.playerCount * 2);
        startTurnIncome();
        refreshMap(); renderAll();
        log('⏭️ نوبت ' + game.players[game.currentPlayerIndex].name + ' (دور ' + game.turn + ')');
    };

    console.log('✅ patch-2: سیستم نیرو فعال (درآمد + نبرد تدریجی)');
})();