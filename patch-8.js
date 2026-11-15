/* ========== patch-8.js — سکه + فروشگاه + تجهیزات ========== */
(function () {
    console.log('🔧 patch-8: بارگذاری...');

    var STARTING_COINS = 5;

    var SHOP = {
        zere:      { name: 'زره',     icon: '🛡️', cost: 5, desc: '+۱ دفاع دائمی (با دژ جمع، حداکثر ۵)' },
        padegan:   { name: 'پادگان',   icon: '🏭', cost: 7, desc: '+۱ سرباز در شروع هر نوبت روی این استان' },
        manjanigh: { name: 'منجنیق',   icon: '🎯', cost: 4, desc: 'هنگام حمله از این استان، دژ دشمن نادیده' },
        ahangari:  { name: 'آهنگری',   icon: '⚒️', cost: 6, desc: 'هر ۳ نوبت یک کارت تاکتیکی رایگان' }
    };

    var ALL_CARDS = ['yuresh', 'sepor', 'kharabkari', 'farakhvan', 'dezh', 'savare', 'atashbas', 'toufan'];

    /* ---------- CSS ---------- */
    var style = document.createElement('style');
    style.textContent = `
        .troop-count {
            width: 42px !important;
            height: 42px !important;
            flex-direction: column !important;
            padding: 2px !important;
            gap: 1px !important;
        }
        .troop-count .equip-line {
            font-size: 10px;
            line-height: 1;
            letter-spacing: -1px;
            color: #2c3e50;
        }
        .troop-count .num-line {
            font-size: 14px;
            font-weight: 900;
            line-height: 1;
        }
        .shop-item {
            background: rgba(52, 73, 94, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 12px;
            transition: all 0.2s;
        }
        .shop-item.available {
            border-color: rgba(212, 175, 55, 0.4);
            cursor: pointer;
        }
        .shop-item.available:hover {
            background: rgba(52, 73, 94, 0.8);
            border-color: #d4af37;
            transform: translateY(-2px);
        }
        .shop-item.unavailable {
            opacity: 0.45;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);

    /* ---------- مارکرها ---------- */
    function updateAllMarkers() {
        if (!game || !game.troopMarkers) return;
        Object.keys(game.troopMarkers).forEach(function (name) {
            var m = game.troopMarkers[name];
            var d = game.provinceData[name];
            if (!m._icon || !d) return;

            var eq = d.equipment || [];
            var armorCount = eq.filter(function (e) { return e === 'zere'; }).length;
            var fortressCount = d.fortress || 0;
            var totalDef = armorCount + fortressCount;

            var equipIcons = '';
            if (fortressCount > 0) equipIcons += '🏰';
            if (armorCount > 0) equipIcons += '🛡️';
            if (eq.indexOf('padegan') !== -1) equipIcons += '🏭';
            if (eq.indexOf('manjanigh') !== -1) equipIcons += '🎯';
            if (eq.indexOf('ahangari') !== -1) equipIcons += '⚒️';

            var inner = '';
            if (equipIcons) inner += '<div class="equip-line">' + equipIcons + '</div>';
            inner += '<div class="num-line">' + d.troops + '</div>';
            m._icon.innerHTML = inner;
            m._icon.style.borderColor = game.players[d.ownerId].color;
            m._icon.style.boxShadow = totalDef > 0 ? '0 0 8px gold' : '0 1px 4px rgba(0,0,0,0.4)';
        });
    }

    /* ---------- درآمد سکه ---------- */
    function giveCoinIncome(player) {
        if (!player || player.provinces.length === 0) return 0;
        var alive = game.players.filter(function (p) { return p.provinces.length > 0; });
        if (alive.length === 0) return 0;
        var weakest = alive.reduce(function (min, p) {
            return p.provinces.length < min.provinces.length ? p : min;
        }, alive[0]);
        var income = 1 + Math.floor(player.provinces.length / 5);
        if (weakest.id === player.id && alive.length > 1) income += 1;
        player.coins = (player.coins || 0) + income;
        return income;
    }

    /* ---------- فروشگاه ---------- */
    window.openShop = function () {
        if (!game || game.gameOver) return;
        if (game.actionMode !== null) {
            log('❌ ابتدا حالت فعلی را لغو کن.');
            return;
        }
        var me = game.players[game.currentPlayerIndex];
        if ((me.pendingTroops || 0) > 0) {
            log('❌ اول نیروها را توزیع کن!');
            return;
        }

        var oldOverlay = document.getElementById('shop-overlay');
        if (oldOverlay) oldOverlay.parentNode.removeChild(oldOverlay);

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'shop-overlay';
        overlay.style.zIndex = 10001;

        var html = '<div class="modal-box" style="max-width:560px;max-height:85vh;overflow-y:auto;">';
        html += '<h2>🛒 فروشگاه</h2>';
        html += '<p style="text-align:center;font-size:16px;margin:5px 0 15px;">💰 سکه‌های تو: <b style="color:#f1c40f;font-size:20px;">' + (me.coins || 0) + '</b></p>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';

        Object.keys(SHOP).forEach(function (key) {
            var item = SHOP[key];
            var canAfford = (me.coins || 0) >= item.cost;
            html += '<div class="shop-item ' + (canAfford ? 'available' : 'unavailable') + '">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
            html += '<div style="font-size:26px;">' + item.icon + '</div>';
            html += '<div style="color:#f1c40f;font-weight:bold;font-size:14px;">' + item.cost + ' 💰</div>';
            html += '</div>';
            html += '<div style="font-weight:bold;margin-bottom:4px;font-size:14px;">' + item.name + '</div>';
            html += '<div style="font-size:11px;color:#95a5a6;line-height:1.6;">' + item.desc + '</div>';
            if (canAfford) {
                html += '<button class="btn" style="margin-top:8px;padding:7px;font-size:11px;width:100%;" onclick="buyEquipment(\'' + key + '\')">خرید</button>';
            } else {
                html += '<button class="btn" disabled style="margin-top:8px;padding:7px;font-size:11px;width:100%;">سکه کافی نیست</button>';
            }
            html += '</div>';
        });

        html += '</div>';
        html += '<div class="btn-row" style="margin-top:16px;"><button class="modal-btn-close" onclick="closeShop()">بستن</button></div>';
        html += '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);
    };

    window.closeShop = function () {
        var el = document.getElementById('shop-overlay');
        if (el) el.parentNode.removeChild(el);
    };

    window.buyEquipment = function (key) {
        var item = SHOP[key];
        var me = game.players[game.currentPlayerIndex];
        if (!item || !me) return;
        if ((me.coins || 0) < item.cost) {
            log('❌ سکه کافی نداری!');
            return;
        }
        window.closeShop();
        game.actionMode = 'shop-targeting';
        game.pendingEquipment = key;
        log('🎯 ' + item.name + ': روی یکی از استان‌های خودت کلیک کن');
        refreshMap(); renderAll();
    };

    window.cancelShop = function () {
        game.actionMode = null;
        game.pendingEquipment = null;
        log('لغو شد.');
        refreshMap(); renderAll();
    };

    function handleShopTarget(name) {
        var me = game.players[game.currentPlayerIndex];
        var data = game.provinceData[name];
        var equipKey = game.pendingEquipment;
        var item = SHOP[equipKey];

        if (!data || !item) {
            game.actionMode = null;
            game.pendingEquipment = null;
            return;
        }
        if (data.ownerId !== me.id) {
            log('❌ فقط روی استان‌های خودت می‌تونی نصب کنی!');
            return;
        }
        var currentEquip = data.equipment || [];
        if (currentEquip.length >= 2) {
            log('❌ این استان حداکثر ۲ تجهیز دارد!');
            return;
        }
        if (currentEquip.indexOf(equipKey) !== -1) {
            log('❌ این تجهیز قبلاً روی این استان نصب شده!');
            return;
        }
        if ((me.coins || 0) < item.cost) {
            log('❌ سکه کافی نداری!');
            game.actionMode = null;
            game.pendingEquipment = null;
            refreshMap(); renderAll();
            return;
        }

        me.coins -= item.cost;
        if (!data.equipment) data.equipment = [];
        data.equipment.push(equipKey);

        log('✅ ' + item.icon + ' ' + item.name + ' روی ' + name + ' نصب شد. (-' + item.cost + ' سکه، ' + me.coins + ' باقی‌مانده)');
        game.actionMode = null;
        game.pendingEquipment = null;
        updateAllMarkers();
        refreshMap(); renderAll();
    }

    /* ---------- نبرد با تجهیزات ---------- */
    function showAttackModal(srcName, targetName) {
        var s = game.provinceData[srcName];
        var t = game.provinceData[targetName];
        var me = game.players[game.currentPlayerIndex];
        var target = game.players[t.ownerId];

        var maxAttack = s.troops - 1;
        var minAttack = 1;
        if (maxAttack < minAttack) {
            log('❌ نیروی کافی نداری');
            game.attackSource = null;
            refreshMap(); renderAll();
            return;
        }

        var srcHasCatapult = (s.equipment || []).indexOf('manjanigh') !== -1;
        var armorCount = (t.equipment || []).filter(function (e) { return e === 'zere'; }).length;
        var fortressCount = t.fortress || 0;
        var effectiveDefense = armorCount + (srcHasCatapult ? 0 : fortressCount);
        var attackBonus = (me.attackBuff || 0) - (me.attackDebuff || 0);

        var oldOverlay = document.getElementById('troop-select-overlay');
        if (oldOverlay) oldOverlay.parentNode.removeChild(oldOverlay);

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = 10001;
        overlay.id = 'troop-select-overlay';

        var defenseDetails = [];
        if (armorCount > 0) defenseDetails.push('زره +' + armorCount);
        if (fortressCount > 0) {
            if (srcHasCatapult) defenseDetails.push('دژ +' + fortressCount + ' (نادیده)');
            else defenseDetails.push('دژ +' + fortressCount);
        }

        var html = '<div class="modal-box" style="max-width:520px">';
        html += '<h2>⚔️ انتخاب نیروی حمله</h2>';
        html += '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:14px 0;">';
        html += '<div style="text-align:center;padding:10px;background:rgba(39,174,96,0.15);border:2px solid #27ae60;border-radius:10px;">';
        html += '<div style="font-size:10px;color:#95a5a6;">مبدأ</div>';
        html += '<div style="font-size:12px;font-weight:bold;color:#f9d976;margin:3px 0;">' + srcName + '</div>';
        html += '<div style="font-size:22px;font-weight:900;">' + s.troops + ' 🗡️</div>';
        if (srcHasCatapult) html += '<div style="font-size:10px;color:#e67e22;">🎯 منجنیق</div>';
        html += '</div>';
        html += '<div style="font-size:22px;color:#d4af37;">→</div>';
        html += '<div style="text-align:center;padding:10px;background:rgba(231,76,60,0.15);border:2px solid #e74c3c;border-radius:10px;">';
        html += '<div style="font-size:10px;color:#95a5a6;">هدف · ' + target.name + '</div>';
        html += '<div style="font-size:12px;font-weight:bold;color:#f9d976;margin:3px 0;">' + targetName + '</div>';
        html += '<div style="font-size:22px;font-weight:900;">' + t.troops + ' 🗡️</div>';
        if (effectiveDefense > 0) html += '<div style="font-size:10px;color:#e74c3c;">دفاع +' + effectiveDefense + '</div>';
        html += '</div></div>';

        if (defenseDetails.length > 0) {
            html += '<div style="font-size:11px;color:#95a5a6;text-align:center;margin-bottom:8px;">' + defenseDetails.join(' | ') + '</div>';
        }

        html += '<div style="margin:14px 0;text-align:center;">';
        html += '<div style="font-size:13px;color:#cbd5e0;margin-bottom:6px;">با چند نیرو حمله می‌کنی؟</div>';
        html += '<div style="font-size:42px;font-weight:900;color:#f9d976;text-shadow:0 0 24px rgba(212,175,55,0.6);line-height:1.1;" id="troop-count-display">' + maxAttack + '</div>';
        html += '<div style="font-size:11px;color:#95a5a6;margin-top:6px;" id="troop-info-display"></div>';
        html += '</div>';
        html += '<input type="range" id="troop-slider" min="' + minAttack + '" max="' + maxAttack + '" value="' + maxAttack + '" style="width:100%;height:6px;cursor:pointer;accent-color:#d4af37;">';
        html += '<div style="display:flex;justify-content:space-between;font-size:10px;color:#7f8c8d;margin-top:4px;"><span>۱</span><span>' + maxAttack + '</span></div>';
        html += '<div style="display:flex;gap:6px;margin-top:12px;">';
        html += '<button class="btn" style="flex:1;padding:8px;font-size:12px;" id="preset-min">حداقل</button>';
        html += '<button class="btn" style="flex:1;padding:8px;font-size:12px;" id="preset-half">نصف</button>';
        html += '<button class="btn" style="flex:1;padding:8px;font-size:12px;" id="preset-all">همه</button>';
        html += '</div>';
        html += '<div class="btn-row" style="margin-top:16px;">';
        html += '<button class="modal-btn-yes" id="troop-confirm">⚔️ حمله!</button>';
        html += '<button class="modal-btn-no" id="troop-cancel">❌ لغو</button>';
        html += '</div></div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        var slider = document.getElementById('troop-slider');
        var countDisp = document.getElementById('troop-count-display');
        var infoDisp = document.getElementById('troop-info-display');

        function refresh() {
            var v = parseInt(slider.value);
            countDisp.textContent = v;
            var aDice = Math.min(3, v);
            var stay = s.troops - v;
            var info = '🎲 حداکثر ' + aDice + ' تاس';
            if (attackBonus > 0) info += ' +' + attackBonus;
            if (attackBonus < 0) info += ' ' + attackBonus;
            info += ' | 🏠 ' + stay + ' در مبدأ می‌ماند';
            infoDisp.textContent = info;
        }
        slider.oninput = refresh;
        refresh();

        document.getElementById('preset-min').onclick = function () { slider.value = minAttack; refresh(); };
        document.getElementById('preset-half').onclick = function () { slider.value = Math.floor(maxAttack / 2); refresh(); };
        document.getElementById('preset-all').onclick = function () { slider.value = maxAttack; refresh(); };

        document.getElementById('troop-confirm').onclick = function () {
            var choice = parseInt(slider.value);
            overlay.parentNode.removeChild(overlay);
            resolveBattleWithEquipment(srcName, targetName, choice);
        };
        document.getElementById('troop-cancel').onclick = function () {
            overlay.parentNode.removeChild(overlay);
            game.attackSource = null;
            log('لغو حمله.');
            refreshMap(); renderAll();
        };
    }

    function resolveBattleWithEquipment(srcName, targetName, attackCount) {
        var s = game.provinceData[srcName];
        var t = game.provinceData[targetName];
        var me = game.players[game.currentPlayerIndex];
        var defender = game.players[t.ownerId];

        if (defender.truceActive) {
            log('🕊️ ' + defender.name + ' آتش‌بس دارد، حمله لغو شد.');
            game.attackSource = null; game.actionMode = null;
            refreshMap(); renderAll(); return;
        }
        if (defender.hasShield) {
            defender.hasShield = false;
            me.attackBuff = 0;
            log('🛡️ سپر ' + defender.name + ' حمله را خنثی کرد!');
            game.attackSource = null; game.actionMode = null;
            refreshMap(); renderAll(); return;
        }

        var srcHasCatapult = (s.equipment || []).indexOf('manjanigh') !== -1;
        var armorCount = (t.equipment || []).filter(function (e) { return e === 'zere'; }).length;
        var fortressCount = t.fortress || 0;
        var attackBonus = (me.attackBuff || 0) - (me.attackDebuff || 0);
        var defenseBonus = armorCount + (srcHasCatapult ? 0 : fortressCount);
        me.attackBuff = 0;
        me.attackDebuff = 0;

        var attacking = attackCount;
        var defending = t.troops;
        var attackInit = attacking, defInit = defending;
        var stayInSource = s.troops - attackCount;
        s.troops = stayInSource;

        var summary = '⚔️ ' + srcName + ' (' + attackCount + ') → ' + targetName + ' (' + t.troops + ')';
        if (attackBonus !== 0) summary += ' | پاداش: ' + (attackBonus > 0 ? '+' : '') + attackBonus;
        if (defenseBonus > 0) summary += ' | دفاع: +' + defenseBonus;
        if (srcHasCatapult && fortressCount > 0) summary += ' | 🎯 دژ نادیده';
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
            t.ownerId = s.ownerId;
            t.troops = attacking;
            t.fortress = 0;
            var destroyedEquip = (t.equipment || []).length;
            t.equipment = [];
            t.forgeCounter = 0;
            s.troops = stayInSource;

            game.players.forEach(function (p) { p.provinces = []; });
            Object.keys(game.provinceData).forEach(function (n) {
                game.players[game.provinceData[n].ownerId].provinces.push(n);
            });

            log('✅ ' + me.name + ' استان ' + targetName + ' را فتح کرد! (' + attacking + ' منتقل، ' + stayInSource + ' ماند)' +
                (destroyedEquip > 0 ? ' | ' + destroyedEquip + ' تجهیز نابود شد' : ''));

            me.coins = (me.coins || 0) + 1;
            log('💰 +1 سکه');

            me.conquestCounter = (me.conquestCounter || 0) + 1;
            if (me.conquestCounter >= 2) {
                me.conquestCounter = 0;
                if (me.hand.length < 3) {
                    me.hand.push(ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)]);
                    log('🎴 کارت جدید! (' + me.hand.length + '/3)');
                }
            }

            if (me.provinces.length === TOTAL_PROVINCES) {
                game.gameOver = true;
                log('🏆 ' + me.name + ' برنده شد!');
                setTimeout(function () { alert('🏆 ' + me.name + ' برنده شد!'); }, 100);
                return;
            }
            if (defender.provinces.length === 0) {
                log('💀 ' + defender.name + ' حذف شد!');
                defender.hand = [];
                defender.hasShield = false;
                defender.truceActive = false;
                defender.attackDebuff = 0;
                defender.attackBuff = 0;
            }
        } else {
            s.troops = stayInSource + attacking;
            t.troops = Math.max(1, defending);
            log('❌ حمله ناکام. تلفات: مهاجم ' + (attackInit - attacking) + '، مدافع ' + (defInit - defending));
        }

        game.attackSource = null;
        game.actionMode = null;
        game.attackUsed = true;
        updateAllMarkers();
        refreshMap(); renderAll();
    }

    /* ---------- استایل استان‌های هدف فروشگاه ---------- */
    var _origStyle_p8 = window.getProvinceStyle;
    window.getProvinceStyle = function (f) {
        var name = typeof f === 'string' ? f : getProvinceName(f);
        if (game && game.actionMode === 'shop-targeting' && game.pendingEquipment) {
            var d = game.provinceData[name];
            var me = game.players[game.currentPlayerIndex];
            if (d && d.ownerId === me.id) {
                var eq = d.equipment || [];
                if (eq.length < 2 && eq.indexOf(game.pendingEquipment) === -1) {
                    return { fillColor: '#c39bd3', weight: 3.5, color: '#6c3483', dashArray: '6,4', opacity: 1, fillOpacity: 0.85 };
                }
            }
        }
        return _origStyle_p8(f);
    };

    /* ---------- کلیک استان ---------- */
    var _origOnProvinceClick_p8 = window.onProvinceClick;
    window.onProvinceClick = function (name) {
        if (!game || game.gameOver) {
            return _origOnProvinceClick_p8(name);
        }

        // حالت نصب تجهیز
        if (game.actionMode === 'shop-targeting') {
            handleShopTarget(name);
            return;
        }

        // رهگیری حمله: مبدأ انتخاب شده و روی دشمن کلیک شده
        if (game.actionMode === 'attack' && game.attackSource) {
            var me = game.players[game.currentPlayerIndex];
            var data = game.provinceData[name];
            if (me.pendingTroops > 0 || game.attackUsed) {
                return _origOnProvinceClick_p8(name);
            }
            if (data && data.ownerId !== me.id && name !== game.attackSource) {
                var isAdj = (game.adjacency[game.attackSource] || []).indexOf(name) !== -1;
                if (!isAdj) {
                    log('❌ ' + name + ' با ' + game.attackSource + ' مرز مشترک ندارد!');
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
                showAttackModal(game.attackSource, name);
                return;
            }
        }

        _origOnProvinceClick_p8(name);
    };

    /* ---------- startGame ---------- */
    var _origStartGame_p8 = window.startGame;
    window.startGame = function () {
        _origStartGame_p8();
        game.players.forEach(function (p) {
            p.coins = STARTING_COINS;
        });
        Object.keys(game.provinceData).forEach(function (n) {
            game.provinceData[n].equipment = [];
            game.provinceData[n].forgeCounter = 0;
        });
        var first = game.players[game.currentPlayerIndex];
        var inc = giveCoinIncome(first);
        log('💰 ' + first.name + ' درآمد اولیه: ' + inc + ' سکه (کل: ' + first.coins + ')');
        updateAllMarkers();
        refreshMap(); renderAll();
    };

    /* ---------- endTurn ---------- */
    var _origEndTurn_p8 = window.endTurn;
    window.endTurn = function () {
        if (!game || game.gameOver) return;
        var current = game.players[game.currentPlayerIndex];
        if ((current.pendingTroops || 0) > 0 &&
            !confirm('هنوز ' + current.pendingTroops + ' نیرو توزیع نکرده‌ای. پایان نوبت؟')) return;

        if (game.actionMode === 'shop-targeting') {
            game.actionMode = null;
            game.pendingEquipment = null;
        }

        _origEndTurn_p8();

        var me = game.players[game.currentPlayerIndex];
        if (!me || me.provinces.length === 0) return;

        // درآمد سکه
        var inc = giveCoinIncome(me);
        log('💰 ' + me.name + ' ' + inc + ' سکه');

        // پادگان
        var padeganCount = 0;
        me.provinces.forEach(function (p) {
            var eq = game.provinceData[p].equipment || [];
            if (eq.indexOf('padegan') !== -1) {
                game.provinceData[p].troops++;
                padeganCount++;
            }
        });
        if (padeganCount > 0) log('🏭 پادگان: ' + padeganCount + ' استان +1 سرباز');

        // آهنگری
        me.provinces.forEach(function (p) {
            var eq = game.provinceData[p].equipment || [];
            if (eq.indexOf('ahangari') !== -1) {
                var fd = game.provinceData[p];
                fd.forgeCounter = (fd.forgeCounter || 0) + 1;
                if (fd.forgeCounter >= 3) {
                    fd.forgeCounter = 0;
                    if (me.hand.length < 3) {
                        me.hand.push(ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)]);
                        log('⚒️ آهنگری ' + p + ': کارت رایگان (' + me.hand.length + '/3)');
                    } else {
                        log('⚒️ آهنگری ' + p + ': دست پر، فرصت سوخت');
                    }
                }
            }
        });

        updateAllMarkers();
        refreshMap(); renderAll();
    };

    /* ---------- renderAll ---------- */
    var _origRender_p8 = window.renderAll;
    window.renderAll = function () {
        if (typeof game !== 'undefined' && game && game.players) {
            game.players.forEach(function (p) {
                if (p.coins === undefined) p.coins = 0;
            });
        }

        _origRender_p8();

        if (!game || game.gameOver) {
            updateAllMarkers();
            return;
        }

        var me = game.players[game.currentPlayerIndex];

        // نمایش سکه در currentPlayerBox
        var currentBox = document.getElementById('currentPlayerBox');
        if (currentBox) {
            var oldCoin = currentBox.querySelector('.coin-line');
            if (oldCoin) oldCoin.remove();
            var coinDiv = document.createElement('div');
            coinDiv.className = 'info-line coin-line';
            coinDiv.style.color = '#f1c40f';
            coinDiv.style.fontWeight = 'bold';
            coinDiv.innerHTML = '💰 سکه: ' + (me.coins || 0);
            var firstB = currentBox.querySelector('b');
            if (firstB && firstB.nextSibling) {
                currentBox.insertBefore(coinDiv, firstB.nextSibling);
            } else {
                currentBox.appendChild(coinDiv);
            }
        }

        // حالت انتخاب استان برای تجهیز
        var actionBox = document.getElementById('actionBox');
        if (actionBox && game.actionMode === 'shop-targeting' && game.pendingEquipment) {
            var item = SHOP[game.pendingEquipment];
            actionBox.innerHTML =
                '<b style="color:#c39bd3;font-size:14px">🎯 نصب ' + item.icon + ' ' + item.name + '</b><br>' +
                '<div class="info-line">روی یکی از استان‌های خودت کلیک کن</div>' +
                '<div class="info-line" style="color:#95a5a6;font-size:11px;">حداکثر ۲ تجهیز در هر استان · هر تجهیز یک‌بار</div>' +
                '<button class="btn" onclick="cancelShop()">لغو</button>';
            updateAllMarkers();
            return;
        }

        // افزودن دکمه فروشگاه
        if (actionBox && !document.getElementById('shop-btn')) {
            var btn = document.createElement('button');
            btn.id = 'shop-btn';
            btn.className = 'btn';
            btn.style.background = 'linear-gradient(135deg, #c39bd3, #8e44ad)';
            btn.style.marginTop = '10px';
            btn.innerHTML = '🛒 فروشگاه (' + (me.coins || 0) + ' 💰)';
            btn.onclick = window.openShop;

            var regionsBtn = document.getElementById('regions-guide-btn');
            var h3 = actionBox.querySelector('h3');
            if (regionsBtn) {
                actionBox.insertBefore(btn, regionsBtn);
            } else if (h3) {
                actionBox.insertBefore(btn, h3);
            } else {
                actionBox.appendChild(btn);
            }
        }

        updateAllMarkers();
    };

    console.log('✅ patch-8: سکه + فروشگاه + تجهیزات فعال (زره، پادگان، منجنیق، آهنگری)');
})();