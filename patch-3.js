/* ========== patch-3.js — پاداش منطقه + کارت تاکتیکی ========== */
(function () {
    console.log('🔧 patch-3: بارگذاری...');

    /* ============================================================
       بخش ۱: تعریف مناطق و کارت‌ها
       ============================================================ */

    var EXACT_MAP = {
        "گیلان": "خزر", "مازندران": "خزر", "گلستان": "خزر",
        "آذربایجان شرقی": "آذربایجان", "آذربایجان غربی": "آذربایجان",
        "اردبیل": "آذربایجان", "زنجان": "آذربایجان",
        "کردستان": "غرب", "کرمانشاه": "غرب", "همدان": "غرب",
        "لرستان": "غرب", "ایلام": "غرب",
        "تهران": "مرکز", "البرز": "مرکز", "قزوین": "مرکز",
        "قم": "مرکز", "مرکزی": "مرکز", "اصفهان": "مرکز",
        "خراسان رضوی": "شمال‌شرق", "خراسان شمالی": "شمال‌شرق",
        "خراسان جنوبی": "شمال‌شرق", "سمنان": "شمال‌شرق",
        "خوزستان": "جنوب‌غرب", "چهارمحال و بختیاری": "جنوب‌غرب",
        "چهارمحال بختیاری": "جنوب‌غرب", "کهگیلویه و بویراحمد": "جنوب‌غرب",
        "کهگیلویه بویراحمد": "جنوب‌غرب",
        "بوشهر": "جنوب", "هرمزگان": "جنوب", "فارس": "جنوب",
        "سیستان و بلوچستان": "جنوب‌شرق", "سیستان بلوچستان": "جنوب‌شرق",
        "کرمان": "جنوب‌شرق", "یزد": "جنوب‌شرق"
    };

    var FUZZY = [
        { kw: "کرمانشاه", region: "غرب" },
        { kw: "چهارمحال", region: "جنوب‌غرب" },
        { kw: "کهگیلویه", region: "جنوب‌غرب" },
        { kw: "سیستان", region: "جنوب‌شرق" },
        { kw: "آذربایجان", region: "آذربایجان" },
        { kw: "خراسان", region: "شمال‌شرق" },
        { kw: "گیلان", region: "خزر" }, { kw: "مازندران", region: "خزر" }, { kw: "گلستان", region: "خزر" },
        { kw: "اردبیل", region: "آذربایجان" }, { kw: "زنجان", region: "آذربایجان" },
        { kw: "کردستان", region: "غرب" }, { kw: "همدان", region: "غرب" },
        { kw: "لرستان", region: "غرب" }, { kw: "ایلام", region: "غرب" },
        { kw: "تهران", region: "مرکز" }, { kw: "البرز", region: "مرکز" },
        { kw: "قزوین", region: "مرکز" }, { kw: "قم", region: "مرکز" },
        { kw: "مرکزی", region: "مرکز" }, { kw: "اصفهان", region: "مرکز" },
        { kw: "سمنان", region: "شمال‌شرق" },
        { kw: "خوزستان", region: "جنوب‌غرب" },
        { kw: "بوشهر", region: "جنوب" }, { kw: "هرمزگان", region: "جنوب" }, { kw: "فارس", region: "جنوب" },
        { kw: "کرمان", region: "جنوب‌شرق" }, { kw: "یزد", region: "جنوب‌شرق" }
    ];

    var REGION_BONUS = {
        "خزر": 2, "آذربایجان": 3, "غرب": 3, "مرکز": 4,
        "شمال‌شرق": 3, "جنوب‌غرب": 2, "جنوب": 2, "جنوب‌شرق": 2
    };

    var CARD_INFO = {
        yuresh:     { icon: '⚡', name: 'یورش', desc: 'حمله بعدی +2 تاس', target: null },
        sepor:      { icon: '🛡️', name: 'سپر', desc: 'حمله بعدی دشمن به تو خنثی می‌شود', target: null },
        kharabkari: { icon: '💣', name: 'خرابکاری', desc: 'استان دشمن مجاور: -2 نیرو (حداقل 1)', target: 'province' },
        farakhvan:  { icon: '📯', name: 'فراخوان', desc: 'همه استان‌های مرزی +1 نیرو', target: null },
        dezh:       { icon: '🏰', name: 'دژ', desc: 'استان خودت +1 دفاع دائمی (حداکثر 3)', target: 'province' },
        savare:     { icon: '🐎', name: 'سواره‌نظام', desc: 'استان خودت +3 نیرو', target: 'province' },
        atashbas:   { icon: '🕊️', name: 'آتش‌بس', desc: 'تا نوبت بعدت کسی نمی‌تواند به تو حمله کند', target: null },
        toufan:     { icon: '🌀', name: 'طوفان', desc: 'حمله بعدی یک دشمن -2 تاس', target: 'player' }
    };

    var ALL_CARDS = Object.keys(CARD_INFO);

    /* ============================================================
       بخش ۲: توابع کمکی
       ============================================================ */

    function resolveRegion(prov) {
        if (EXACT_MAP[prov]) return EXACT_MAP[prov];
        var noSpace = prov.replace(/\s+/g, '');
        for (var k in EXACT_MAP) {
            if (k.replace(/\s+/g, '') === noSpace) return EXACT_MAP[k];
        }
        for (var i = 0; i < FUZZY.length; i++) {
            if (prov.indexOf(FUZZY[i].kw) !== -1) return FUZZY[i].region;
        }
        return null;
    }

    function assignRegions() {
        var buckets = {};
        Object.keys(REGION_BONUS).forEach(function (r) { buckets[r] = []; });
        var unmatched = [];
        Object.keys(game.provinceData).forEach(function (prov) {
            var region = resolveRegion(prov);
            if (region && buckets[region]) buckets[region].push(prov);
            else unmatched.push(prov);
        });
        var list = Object.keys(buckets).map(function (r) {
            return { name: r, bonus: REGION_BONUS[r], provinces: buckets[r] };
        });
        var total = 0;
        list.forEach(function (r) { total += r.provinces.length; });
        if (unmatched.length > 0) console.warn('⚠️ استان‌های تخصیص‌نیافته:', unmatched);
        console.log('📍 مناطق: مجموع ' + total + ' استان در ' + list.length + ' منطقه');
        return list;
    }

    function calculateRegionBonus(player) {
        var bonus = 0, breakdown = [];
        (game.regions || []).forEach(function (region) {
            if (region.provinces.length === 0) return;
            var ownsAll = region.provinces.every(function (p) {
                return game.provinceData[p] && game.provinceData[p].ownerId === player.id;
            });
            if (ownsAll) { bonus += region.bonus; breakdown.push(region.name + ' +' + region.bonus); }
        });
        return { total: bonus, breakdown: breakdown };
    }

    function randomCard() { return ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)]; }

    function onConquest() {
        var me = game.players[game.currentPlayerIndex];
        me.conquestCounter = (me.conquestCounter || 0) + 1;
        if (me.conquestCounter >= 2) {
            me.conquestCounter = 0;
            if (me.hand.length < 3) {
                var c = randomCard();
                me.hand.push(c);
                log('🎴 ' + me.name + ' کارت گرفت: ' + CARD_INFO[c].icon + ' ' + CARD_INFO[c].name + ' (دست: ' + me.hand.length + '/3)');
            } else {
                log('🎴 دست پر است! فرصت کارت سوخت.');
            }
        }
    }

    function updateTroopMarkersV3() {
        if (!game || !game.troopMarkers) return;
        Object.keys(game.troopMarkers).forEach(function (name) {
            var m = game.troopMarkers[name];
            var d = game.provinceData[name];
            if (!m._icon || !d) return;
            var f = d.fortress || 0;
            m._icon.innerHTML = '<span style="font-size:11px">' + d.troops + (f > 0 ? '🏰' : '') + '</span>';
            m._icon.style.borderColor = game.players[d.ownerId].color;
            m._icon.style.boxShadow = f > 0 ? '0 0 8px gold' : '0 1px 4px rgba(0,0,0,0.4)';
        });
    }

    /* ============================================================
       بخش ۳: منطق کارت‌ها
       ============================================================ */

    function hasValidCardTarget(card) {
        var me = game.players[game.currentPlayerIndex];
        if (card === 'kharabkari') {
            return me.provinces.some(function (p) {
                return (game.adjacency[p] || []).some(function (nb) {
                    var d = game.provinceData[nb];
                    return d && d.ownerId !== me.id;
                });
            });
        }
        if (card === 'dezh') {
            return me.provinces.some(function (p) { return (game.provinceData[p].fortress || 0) < 3; });
        }
        if (card === 'savare') return me.provinces.length > 0;
        if (card === 'toufan') {
            return game.players.some(function (p) { return p.id !== me.id && p.provinces.length > 0; });
        }
        return true;
    }

    window.playCard = function (card) {
        if (!game || game.gameOver) return;
        var me = game.players[game.currentPlayerIndex];
        if (me.hand.indexOf(card) === -1) return;
        if (me.pendingTroops > 0) { log('❌ اول نیروها را توزیع کن!'); return; }
        if (game.actionMode !== null) { log('❌ ابتدا حالت فعلی را لغو کن.'); return; }
        if (!hasValidCardTarget(card)) { log('❌ برای این کارت هدف معتبری نیست.'); return; }

        var info = CARD_INFO[card];
        if (info.target === 'province') {
            game.actionMode = 'card-targeting';
            game.pendingCard = card;
            log('🎯 ' + info.name + ': روی استان هدف کلیک کن (لغو: دکمه لغو)');
            refreshMap(); renderAll();
            return;
        }
        if (info.target === 'player') {
            game.actionMode = 'card-target-player';
            game.pendingCard = card;
            log('🎯 ' + info.name + ': بازیکن هدف را انتخاب کن');
            renderAll();
            return;
        }
        applyCard(card, null);
    };

    window.applyCard = function (card, target) {
        var me = game.players[game.currentPlayerIndex];
        var idx = me.hand.indexOf(card);
        if (idx === -1) return;

        switch (card) {
            case 'yuresh':
                me.attackBuff = (me.attackBuff || 0) + 2;
                log('⚡ یورش: +2 به حمله بعدی ' + me.name);
                break;
            case 'sepor':
                me.hasShield = true;
                log('🛡️ سپر فعال: حمله بعدی به ' + me.name + ' خنثی می‌شود');
                break;
            case 'farakhvan':
                var count = 0;
                me.provinces.forEach(function (p) {
                    var isBorder = (game.adjacency[p] || []).some(function (nb) {
                        var d = game.provinceData[nb];
                        return d && d.ownerId !== me.id;
                    });
                    if (isBorder) { game.provinceData[p].troops++; count++; }
                });
                if (count === 0) log('📯 فراخوان: استان مرزی نداری، کارت بی‌اثر سوخت');
                else log('📯 فراخوان: ' + count + ' استان مرزی +1 نیرو');
                updateTroopMarkersV3();
                break;
            case 'dezh':
                if (!target || game.provinceData[target].ownerId !== me.id) { log('❌ استان نامعتبر'); return; }
                var f = (game.provinceData[target].fortress || 0);
                if (f >= 3) { log('❌ دژ این استان در حداکثر است.'); return; }
                game.provinceData[target].fortress = f + 1;
                log('🏰 دژ روی ' + target + ' (سطح ' + (f + 1) + ')');
                updateTroopMarkersV3();
                break;
            case 'savare':
                if (!target || game.provinceData[target].ownerId !== me.id) { log('❌ استان نامعتبر'); return; }
                game.provinceData[target].troops += 3;
                log('🐎 سواره‌نظام: ' + target + ' +3 نیرو');
                updateTroopMarkersV3();
                break;
            case 'kharabkari':
                if (!target) { log('❌ استان انتخاب نشد'); return; }
                var td = game.provinceData[target];
                if (!td || td.ownerId === me.id) { log('❌ استان دشمن نیست'); return; }
                var isAdj = me.provinces.some(function (p) {
                    return (game.adjacency[p] || []).indexOf(target) !== -1;
                });
                if (!isAdj) { log('❌ این استان با خاک تو مرز ندارد'); return; }
                var loss = Math.min(2, td.troops - 1);
                td.troops -= loss;
                log('💣 خرابکاری: ' + target + ' -' + loss + ' نیرو');
                updateTroopMarkersV3();
                break;
            case 'atashbas':
                me.truceActive = true;
                log('🕊️ آتش‌بس فعال: تا شروع نوبت بعدی ' + me.name + ' امن است');
                break;
            case 'toufan':
                if (target === null || target === undefined) { log('❌ بازیکن انتخاب نشد'); return; }
                var tp = game.players[target];
                if (!tp || tp.id === me.id) { log('❌ بازیکن نامعتبر'); return; }
                tp.attackDebuff = (tp.attackDebuff || 0) + 2;
                log('🌀 طوفان روی ' + tp.name + ' (-2 به حمله بعدی)');
                break;
            default:
                return;
        }

        me.hand.splice(idx, 1);
        game.actionMode = null;
        game.pendingCard = null;
        refreshMap(); renderAll();
    };

    window.cancelCard = function () {
        game.actionMode = null;
        game.pendingCard = null;
        log('لغو شد.');
        refreshMap(); renderAll();
    };

    function isValidCardTarget(name) {
        if (!game || !game.pendingCard) return false;
        var me = game.players[game.currentPlayerIndex];
        var card = game.pendingCard;
        var d = game.provinceData[name];
        if (!d) return false;
        if (card === 'kharabkari') {
            if (d.ownerId === me.id) return false;
            return me.provinces.some(function (p) {
                return (game.adjacency[p] || []).indexOf(name) !== -1;
            });
        }
        if (card === 'dezh') return d.ownerId === me.id && (d.fortress || 0) < 3;
        if (card === 'savare') return d.ownerId === me.id;
        return false;
    }

    /* ============================================================
       بخش ۴: نبرد با کارت‌ها
       ============================================================ */

    function resolveBattleV3(sourceName, targetName) {
        var s = game.provinceData[sourceName];
        var t = game.provinceData[targetName];
        var me = game.players[game.currentPlayerIndex];
        var defender = game.players[t.ownerId];

        // آتش‌بس مدافع
        if (defender.truceActive) {
            log('🕊️ ' + defender.name + ' تحت آتش‌بس است! حمله لغو شد.');
            return;
        }
        // سپر مدافع
        if (defender.hasShield) {
            defender.hasShield = false;
            me.attackBuff = 0;
            log('🛡️ سپر ' + defender.name + ' حمله را خنثی کرد! (یورش هم سوخت)');
            return;
        }

        var attackBonus = (me.attackBuff || 0) - (me.attackDebuff || 0);
        var defenseBonus = t.fortress || 0;
        me.attackBuff = 0;
        me.attackDebuff = 0;

        var attacking = s.troops - 1;
        var defending = t.troops;
        var attackInit = attacking, defInit = defending;

        var summary = '⚔️ ' + sourceName + ' (' + s.troops + ') → ' + targetName + ' (' + t.troops + ')';
        if (attackBonus !== 0) summary += ' | پاداش حمله: ' + (attackBonus > 0 ? '+' : '') + attackBonus;
        if (defenseBonus > 0) summary += ' | دژ: +' + defenseBonus;
        log(summary);

        var round = 0;
        while (attacking > 0 && defending > 0 && round < 30) {
            round++;
            var aDice = [], dDice = [];
            var aCount = Math.min(3, attacking);
            var dCount = Math.min(2, defending);
            for (var i = 0; i < aCount; i++) aDice.push(1 + Math.floor(Math.random() * 6) + attackBonus);
            for (var j = 0; j < dCount; j++) dDice.push(1 + Math.floor(Math.random() * 6) + defenseBonus);
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
            log('  دور ' + round + ': ⚔️[' + aDice.join(',') + '] 🛡️[' + dDice.join(',') + '] → تلفات ' + aLoss + '/' + dLoss);
        }

        if (defending <= 0 && attacking > 0) {
            var oldFortress = t.fortress || 0;
            t.ownerId = s.ownerId;
            t.troops = attacking;
            t.fortress = 0; // دژ پاک می‌شود
            s.troops = 1;
            // syncPlayerProvinces
            game.players.forEach(function (p) { p.provinces = []; });
            Object.keys(game.provinceData).forEach(function (n) {
                game.players[game.provinceData[n].ownerId].provinces.push(n);
            });
            updateTroopMarkersV3();
            log('✅ ' + me.name + ' استان ' + targetName + ' را فتح کرد!' 
                + (oldFortress > 0 ? ' (دژ سطح ' + oldFortress + ' پاک شد)' : ''));
            onConquest();
            if (me.provinces.length === TOTAL_PROVINCES) { endGame(me); return; }
            if (defender.provinces.length === 0) {
                log('💀 ' + defender.name + ' حذف شد!');
                defender.hand = [];
                defender.hasShield = false;
                defender.truceActive = false;
                defender.attackDebuff = 0;
                defender.attackBuff = 0;
            }
        } else {
            s.troops = 1 + attacking;
            t.troops = Math.max(1, defending);
            log('❌ حمله ناکام. تلفات: مهاجم ' + (attackInit - attacking) + '، مدافع ' + (defInit - defending));
            updateTroopMarkersV3();
        }
    }

    /* ============================================================
       بخش ۵: استایل و کلیک
       ============================================================ */

    var _origStyle_p3 = window.getProvinceStyle;
    window.getProvinceStyle = function (f) {
        var name = typeof f === 'string' ? f : getProvinceName(f);
        if (game && game.actionMode === 'card-targeting' && game.pendingCard) {
            if (isValidCardTarget(name))
                return { fillColor: '#00bcd4', weight: 3.5, color: '#006064', dashArray: '6,4', opacity: 1, fillOpacity: 0.88 };
        }
        if (game && game.attackSource === name)
            return { fillColor: '#ffeb3b', weight: 4, color: '#000', opacity: 1, fillOpacity: 0.92 };
        return _origStyle_p3(f);
    };

    window.onProvinceClick = function (name) {
        if (!game || game.gameOver || !game.adjacency) return;

        // حالت هدف‌گیری کارت
        if (game.actionMode === 'card-targeting') {
            if (!isValidCardTarget(name)) { log('❌ این استان هدف معتبر نیست.'); return; }
            applyCard(game.pendingCard, name);
            return;
        }

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
            updateTroopMarkersV3();
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
                if (data.troops < 2) { log('❌ حداقل ۲ نیرو لازم است!'); return; }
                game.attackSource = name;
                log('🎯 مبدأ: ' + name + ' (' + data.troops + ' نیرو)');
                refreshMap(); renderAll();
                return;
            }

            if (name === game.attackSource) {
                game.attackSource = null; log('لغو مبدأ.'); refreshMap(); renderAll(); return;
            }
            if (data.ownerId === me.id) {
                if (data.troops < 2) { log('❌ حداقل ۲ نیرو لازم است!'); return; }
                game.attackSource = name;
                log('🎯 مبدأ جدید: ' + name + ' (' + data.troops + ' نیرو)');
                refreshMap(); renderAll(); return;
            }
            var isAdj = (game.adjacency[game.attackSource] || []).indexOf(name) !== -1;
            if (!isAdj) { log('❌ مرز مشترک ندارد!'); return; }
            var key = relKey(me.id, data.ownerId);
            if (game.relations[key] === 'alliance') { log('⚠️ با این بازیکن اتحاد داری.'); return; }
            if (game.relations[key] !== 'war') {
                game.relations[key] = 'war';
                log('📢 ' + me.name + ' به ' + game.players[data.ownerId].name + ' اعلام جنگ کرد!');
            }
            var src = game.attackSource;
            game.attackSource = null;
            game.actionMode = null;
            game.attackUsed = true;
            resolveBattleV3(src, name);
            refreshMap(); renderAll();
            return;
        }

        log('📍 ' + name + ' — مالک: ' + game.players[data.ownerId].name 
            + ' — نیرو: ' + data.troops 
            + (data.fortress > 0 ? ' — دژ: +' + data.fortress : ''));
    };

    /* ============================================================
       بخش ۶: شروع و پایان نوبت
       ============================================================ */

    var _origStartGame_p3 = window.startGame;
    window.startGame = function () {
        _origStartGame_p3();
        game.regions = assignRegions();
        game.players.forEach(function (p) {
            p.hand = [];
            p.conquestCounter = 0;
            p.attackBuff = 0;
            p.attackDebuff = 0;
            p.hasShield = false;
            p.truceActive = false;
        });
        Object.keys(game.provinceData).forEach(function (n) { game.provinceData[n].fortress = 0; });
        // پاداش منطقه به بازیکن اول
        var me = game.players[game.currentPlayerIndex];
        var rb = calculateRegionBonus(me);
        if (rb.total > 0) {
            me.pendingTroops += rb.total;
            log('🏆 پاداش منطقه ' + me.name + ': +' + rb.total + ' (' + rb.breakdown.join('، ') + ')');
        }
        updateTroopMarkersV3();
        refreshMap(); renderAll();
    };

    var _origEndTurn_p3 = window.endTurn;
    window.endTurn = function () {
        if (!game || game.gameOver) return;
        var current = game.players[game.currentPlayerIndex];
        if ((current.pendingTroops || 0) > 0 && !confirm('هنوز ' + current.pendingTroops + ' نیرو توزیع نکرده‌ای. پایان نوبت؟')) return;

        _origEndTurn_p3();

        var me = game.players[game.currentPlayerIndex];
        if (me.truceActive) {
            me.truceActive = false;
            log('🕊️ آتش‌بس ' + me.name + ' منقضی شد.');
        }
        if (me.provinces.length === 0) me.pendingTroops = 0;
        var rb = calculateRegionBonus(me);
        if (rb.total > 0) {
            me.pendingTroops += rb.total;
            log('🏆 پاداش منطقه ' + me.name + ': +' + rb.total);
        }
        updateTroopMarkersV3();
        refreshMap(); renderAll();
    };

    /* ============================================================
       بخش ۷: رابط کاربری
       ============================================================ */

    window.renderAll = function () {
        if (!game || game.gameOver) return;
        if (game.layer) refreshMap();
        var me = game.players[game.currentPlayerIndex];
        var others = game.players.filter(function (p) { return p.id !== me.id && p.provinces.length > 0; });
        var pending = me.pendingTroops || 0;
        var totalTroops = 0;
        me.provinces.forEach(function (p) { totalTroops += game.provinceData[p].troops; });

        // مناطق کنترل‌شده
        var myRegions = [];
        (game.regions || []).forEach(function (region) {
            if (region.provinces.length === 0) return;
            var ownsAll = region.provinces.every(function (p) {
                return game.provinceData[p] && game.provinceData[p].ownerId === me.id;
            });
            if (ownsAll) myRegions.push(region.name + ' +' + region.bonus);
        });

        // باف‌های فعال
        var buffs = [];
        if (me.attackBuff > 0) buffs.push('⚡ یورش +' + me.attackBuff);
        if (me.attackDebuff > 0) buffs.push('🌀 طوفان -' + me.attackDebuff);
        if (me.hasShield) buffs.push('🛡️ سپر فعال');
        if (me.truceActive) buffs.push('🕊️ آتش‌بس');

        document.getElementById('currentPlayerBox').innerHTML =
            '<b style="color:' + me.color + ';font-size:15px">' + me.name + '</b> — نوبت شما<br>' +
            '<div class="info-line">🗺️ استان‌ها: ' + me.provinces.length + ' / ' + TOTAL_PROVINCES + '</div>' +
            '<div class="info-line">🗡️ نیروی کل: ' + totalTroops + '</div>' +
            '<div class="info-line">🔄 دور: ' + game.turn + '</div>' +
            (myRegions.length > 0 ? '<div class="info-line" style="color:#f1c40f">🏆 مناطق: ' + myRegions.join('، ') + '</div>' : '') +
            (buffs.length > 0 ? '<div class="info-line" style="color:#e67e22">' + buffs.join(' | ') + '</div>' : '') +
            (pending > 0 ? '<div class="info-line" style="color:#f1c40f;font-weight:bold">📥 ' + pending + ' نیرو در انتظار</div>' : '');

        var act = '';

        // کارت‌های در دست
        if (me.hand.length > 0) {
            var cardDisabled = (game.actionMode !== null) || pending > 0;
            act += '<div style="background:#8e44ad;padding:8px;border-radius:5px;margin-bottom:8px;">';
            act += '<b style="font-size:12px;color:#fff">🎴 کارت‌های تو (' + me.hand.length + '/3):</b><br>';
            me.hand.forEach(function (card) {
                var info = CARD_INFO[card];
                act += '<button class="btn" style="background:#9b59b6;display:inline-block;width:auto;padding:6px 10px;margin:3px;font-size:12px;text-align:center" ' +
                    'onclick="playCard(\'' + card + '\')" ' +
                    (cardDisabled ? 'disabled' : '') +
                    ' title="' + info.desc + '">' +
                    info.icon + ' ' + info.name + '</button>';
            });
            act += '</div>';
        }

        // حالت‌های خاص
        if (pending > 0) {
            act += '<b style="color:#f1c40f">💰 ' + pending + ' نیرو برای توزیع</b><br>' +
                '<button class="btn success" onclick="autoDistribute(); updateTroopMarkersV3(); renderAll()">📥 توزیع خودکار</button>' +
                '<button class="btn" onclick="game.actionMode=\'place\'; renderAll()">✏️ چیدمان دستی</button>';
            if (game.actionMode === 'place')
                act += '<div class="info-line" style="color:#f39c12">روی استان‌های خودت کلیک کن</div>' +
                    '<button class="btn" onclick="game.actionMode=null; renderAll()">لغو</button>';
        } else if (game.actionMode === 'card-targeting') {
            act += '<b style="color:#00bcd4">🎯 ' + CARD_INFO[game.pendingCard].name + ': روی استان آبی کلیک کن</b><br>' +
                '<div class="info-line">' + CARD_INFO[game.pendingCard].desc + '</div>' +
                '<button class="btn" onclick="cancelCard()">لغو</button>';
        } else if (game.actionMode === 'card-target-player') {
            act += '<b style="color:#00bcd4">🎯 ' + CARD_INFO[game.pendingCard].name + ': بازیکن هدف را انتخاب کن</b><br>';
            others.forEach(function (p) {
                act += '<button class="btn" style="background:#9b59b6" onclick="applyCard(\'' + game.pendingCard + '\', ' + p.id + ')">' + p.name + '</button>';
            });
            act += '<button class="btn" onclick="cancelCard()">لغو</button>';
        } else if (game.actionMode === 'attack') {
            if (game.attackSource) {
                act += '<b style="color:#f39c12">🎯 مبدأ: ' + game.attackSource + ' (' + game.provinceData[game.attackSource].troops + ' نیرو)</b><br>' +
                    '<div class="info-line">روی استان دشمن مجاور کلیک کن</div>' +
                    '<button class="btn" onclick="game.attackSource=null; refreshMap(); renderAll()">لغو مبدأ</button>' +
                    '<button class="btn" onclick="game.actionMode=null; game.attackSource=null; refreshMap(); renderAll()">لغو کامل</button>';
            } else {
                act += '<b style="color:#f39c12">⚔️ روی استان خودت (≥2 نیرو) کلیک کن</b><br>' +
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
            var extra = '';
            if (p.hasShield) extra += ' 🛡️';
            if (p.truceActive) extra += ' 🕊️';
            if (p.attackDebuff > 0) extra += ' 🌀-' + p.attackDebuff;
            act += '<div class="info-line"><span class="player-tag" style="background:' + p.color + '"></span>' + p.name +
                ' (' + p.provinces.length + ' استان، ' + pt + ' نیرو، ' + p.hand.length + ' کارت) — ' + label + extra + '</div>';
        });
        document.getElementById('actionBox').innerHTML = act;

        // هایلایت اهداف حمله
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

        updateTroopMarkersV3();
    };

    /* ============================================================
       پایان patch-3
       ============================================================ */
    console.log('✅ patch-3: پاداش منطقه + کارت تاکتیکی فعال');
})();