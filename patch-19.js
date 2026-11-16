/* ========== patch-19.js — ۱۰ کارت، ۸ تجهیزات، توضیحات کامل ========== */
(function () {
    console.log('🎴 patch-19: بارگذاری...');

    /* ============================================================
       تعریف کارت‌ها (۱۰ عدد)
       ============================================================ */
    var CARDS = {
        yuresh:     { icon: '⚡', name: 'یورش', desc: 'حمله بعدی +۲ تاس به نفع مهاجم', target: null },
        sepor:      { icon: '🛡️', name: 'سپر', desc: 'حمله بعدی دشمن به تو کاملاً خنثی می‌شود', target: null },
        kharabkari: { icon: '💣', name: 'خرابکاری', desc: 'یک استان دشمن مجاور: -۲ سرباز', target: 'province' },
        farakhvan:  { icon: '📯', name: 'فراخوان', desc: 'همه استان‌های مرزی خودت +۱ سرباز', target: null },
        savare:     { icon: '🐎', name: 'سواره‌نظام', desc: 'یک استان خودت +۳ سرباز فوری', target: 'province' },
        atashbas:   { icon: '🕊️', name: 'آتش‌بس', desc: 'تا نوبت بعدت هیچ‌کس نمی‌تواند به تو حمله کند', target: null },
        bajgiri:    { icon: '💸', name: 'باج‌گیری', desc: 'از یک بازیکن دشمن ۳ سکه بگیر', target: 'player' },
        azadsazi:   { icon: '🔓', name: 'آزادسازی', desc: 'یک استان از دست رفته‌ات (مجاور خاک فعلی) را بدون نبرد پس بگیر', target: 'lostProvince' },
        yuresh2:    { icon: '⚔️', name: 'یورش دوگانه', desc: '+۱ حمله اضافه در همین نوبت', target: null },
        tajdid:     { icon: '💉', name: 'تجدید قوا', desc: 'همه استان‌های خودت +۱ سرباز', target: null }
    };
    var CARD_KEYS = Object.keys(CARDS);

    /* ============================================================
       تعریف تجهیزات (۸ عدد)
       ============================================================ */
    var EQUIPMENT = {
        zere:      { icon: '🛡️', name: 'زره', cost: 5, slots: 1, desc: '+۱ دفاع دائمی. با زره‌های دیگه و دژ جمع می‌شه (تا ۵).' },
        padegan:   { icon: '🏭', name: 'پادگان', cost: 7, slots: 1, desc: '+۱ سرباز در شروع هر نوبت روی این استان.' },
        manjanigh: { icon: '🎯', name: 'منجنیق', cost: 4, slots: 1, desc: 'حمله از این استان، دژ دشمن را نادیده می‌گیرد.' },
        ahangari:  { icon: '⚒️', name: 'آهنگری', cost: 6, slots: 1, desc: 'هر ۳ نوبت یک کارت تاکتیکی رایگان.' },
        khazane:   { icon: '🏦', name: 'خزانه', cost: 8, slots: 1, desc: '+۲ سکه در شروع هر نوبت. فقط ۱ در کل بازی.' },
        mabad:     { icon: '⛪', name: 'معبد', cost: 8, slots: 1, desc: 'هر حمله به این استان ۵۰٪ شانس خنثی شدن دارد.' },
        ghale:     { icon: '🏯', name: 'قلعه', cost: 10, slots: 2, desc: '+۲ دفاع دائمی. ۲ اسلات تجهیزات اشغال می‌کند.' },
        borj:      { icon: '🏹', name: 'برج کماندار', cost: 7, slots: 1, desc: 'مدافع این استان تا ۳ تاس می‌اندازد (به‌جای ۲).' }
    };

    /* ============================================================
       توابع کمکی
       ============================================================ */
    function getUsedSlots(data) {
        if (!data || !data.equipment) return 0;
        var s = 0;
        data.equipment.forEach(function (e) { s += EQUIPMENT[e] ? EQUIPMENT[e].slots : 1; });
        return s;
    }
    function randomCardKey() { return CARD_KEYS[Math.floor(Math.random() * CARD_KEYS.length)]; }
    function isAdjacentToPlayer(name, playerId) {
        var nbs = game.adjacency[name] || [];
        for (var i = 0; i < nbs.length; i++) {
            if (game.provinceData[nbs[i]] && game.provinceData[nbs[i]].ownerId === playerId) return true;
        }
        return false;
    }

    /* ============================================================
       فروشگاه
       ============================================================ */
    window.openShop = function () {
        if (!window.game || game.gameOver) return;
        if (game.actionMode !== null) { log('❌ ابتدا حالت فعلی را لغو کن.'); return; }
        var me = game.players[game.currentPlayerIndex];
        if ((me.pendingTroops || 0) > 0) { log('❌ اول نیروها را توزیع کن!'); return; }

        var old = document.getElementById('shop-overlay');
        if (old) old.parentNode.removeChild(old);
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'shop-overlay';
        overlay.style.zIndex = 10001;

        var html = '<div class="modal-box" style="max-width:580px;max-height:88vh;overflow-y:auto;">';
        html += '<h2>🛒 فروشگاه تجهیزات</h2>';
        html += '<p style="text-align:center;font-size:16px;margin:5px 0 15px;">💰 سکه‌های تو: <b style="color:#f1c40f;font-size:20px;">' + (me.coins || 0) + '</b></p>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';

        Object.keys(EQUIPMENT).forEach(function (key) {
            var item = EQUIPMENT[key];
            var alreadyHasKhazane = false;
            if (key === 'khazane') {
                me.provinces.forEach(function (prov) {
                    if ((game.provinceData[prov].equipment || []).indexOf('khazane') !== -1) alreadyHasKhazane = true;
                });
            }
            var canBuy = (me.coins || 0) >= item.cost && !alreadyHasKhazane;

            html += '<div class="shop-item ' + (canBuy ? 'available' : 'unavailable') + '">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
            html += '<div style="font-size:26px;">' + item.icon + '</div>';
            html += '<div style="color:#f1c40f;font-weight:bold;font-size:14px;">' + item.cost + ' 💰</div>';
            html += '</div>';
            html += '<div style="font-weight:bold;margin-bottom:4px;font-size:14px;">' + item.name;
            if (item.slots > 1) html += ' <span style="font-size:10px;color:#e67e22">(۲ اسلات)</span>';
            html += '</div>';
            html += '<div style="font-size:11px;color:#95a5a6;line-height:1.6;">' + item.desc + '</div>';
            if (alreadyHasKhazane) {
                html += '<button class="btn" disabled style="margin-top:8px;padding:7px;font-size:11px;width:100%;">قبلاً داری</button>';
            } else if (canBuy) {
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
        var item = EQUIPMENT[key];
        var me = game.players[game.currentPlayerIndex];
        if (!item || !me) return;
        if ((me.coins || 0) < item.cost) { log('❌ سکه کافی نداری!'); return; }
        if (key === 'khazane') {
            var has = false;
            me.provinces.forEach(function (prov) {
                if ((game.provinceData[prov].equipment || []).indexOf('khazane') !== -1) has = true;
            });
            if (has) { log('❌ فقط ۱ خزانه در کل بازی.'); return; }
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
        var item = EQUIPMENT[equipKey];
        if (!data || !item) { game.actionMode = null; game.pendingEquipment = null; refreshMap(); renderAll(); return; }
        if (data.ownerId !== me.id) { log('❌ فقط روی استان‌های خودت!'); return; }
        if ((data.equipment || []).indexOf(equipKey) !== -1) { log('❌ قبلاً نصب شده!'); return; }
        if (getUsedSlots(data) + item.slots > 2) { log('❌ اسلات کافی نیست (' + getUsedSlots(data) + '/2 اشغال).'); return; }
        if ((me.coins || 0) < item.cost) { log('❌ سکه کافی نداری!'); cancelShop(); return; }

        me.coins -= item.cost;
        if (!data.equipment) data.equipment = [];
        data.equipment.push(equipKey);
        log('✅ ' + item.icon + ' ' + item.name + ' روی ' + name + ' نصب شد (-' + item.cost + ')');
        game.actionMode = null; game.pendingEquipment = null;
        if (typeof window.updateAllMarkers === 'function') window.updateAllMarkers();
        refreshMap(); renderAll();
    }

    /* ============================================================
       کارت‌ها
       ============================================================ */
    function hasValidTarget(card) {
        var me = game.players[game.currentPlayerIndex];
        if (card === 'kharabkari') {
            return me.provinces.some(function (p) {
                return (game.adjacency[p] || []).some(function (nb) {
                    var d = game.provinceData[nb];
                    return d && d.ownerId !== me.id;
                });
            });
        }
        if (card === 'savare') return me.provinces.length > 0;
        if (card === 'bajgiri') {
            return game.players.some(function (p) {
                return p.id !== me.id && p.provinces.length > 0 && (p.coins || 0) > 0;
            });
        }
        if (card === 'azadsazi') {
            return Object.keys(me._everOwned || {}).some(function (prov) {
                var d = game.provinceData[prov];
                return d && d.ownerId !== me.id && isAdjacentToPlayer(prov, me.id);
            });
        }
        return true;
    }

    window.playCard = function (card) {
        if (!window.game || game.gameOver) return;
        var me = game.players[game.currentPlayerIndex];
        if (me.hand.indexOf(card) === -1) return;
        if (me.pendingTroops > 0) { log('❌ اول نیروها را توزیع کن!'); return; }
        if (game.actionMode !== null) { log('❌ ابتدا حالت فعلی را لغو کن.'); return; }
        if (!hasValidTarget(card)) { log('❌ هدف معتبری وجود ندارد.'); return; }
        var info = CARDS[card];
        if (info.target === 'province' || info.target === 'lostProvince') {
            game.actionMode = 'card-targeting';
            game.pendingCard = card;
            log('🎯 ' + info.name + ': روی استان هدف کلیک کن');
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

    window.cancelCard = function () {
        game.actionMode = null;
        game.pendingCard = null;
        log('لغو شد.');
        refreshMap(); renderAll();
    };

    window.applyCard = function (card, target) {
        if (!CARDS[card]) return; // کارت ناشناخته (قدیمی)
        var me = game.players[game.currentPlayerIndex];
        var idx = me.hand.indexOf(card);
        if (idx === -1) return;

        var consumed = true;

        switch (card) {
            case 'yuresh':
                me.attackBuff = (me.attackBuff || 0) + 2;
                log('⚡ یورش: +۲ تاس حمله بعدی');
                break;
            case 'sepor':
                me.hasShield = true;
                log('🛡️ سپر: حمله بعدی دشمن خنثی');
                break;
            case 'farakhvan':
                var c1 = 0;
                me.provinces.forEach(function (p) {
                    var border = (game.adjacency[p] || []).some(function (nb) {
                        var d = game.provinceData[nb];
                        return d && d.ownerId !== me.id;
                    });
                    if (border) { game.provinceData[p].troops++; c1++; }
                });
                if (c1 === 0) log('📯 فراخوان: مرزی نداری، بی‌اثر');
                else log('📯 فراخوان: ' + c1 + ' استان +1');
                break;
            case 'savare':
                if (!target || game.provinceData[target].ownerId !== me.id) { log('❌ نامعتبر'); return; }
                game.provinceData[target].troops += 3;
                log('🐎 سواره‌نظام: ' + target + ' +3');
                break;
            case 'kharabkari':
                if (!target) { log('❌ انتخاب نشد'); return; }
                var td = game.provinceData[target];
                if (!td || td.ownerId === me.id) { log('❌ دشمن نیست'); return; }
                var adj = me.provinces.some(function (p) { return (game.adjacency[p] || []).indexOf(target) !== -1; });
                if (!adj) { log('❌ مرز ندارد'); return; }
                var loss = Math.min(2, td.troops - 1);
                td.troops -= loss;
                log('💣 خرابکاری: ' + target + ' -' + loss);
                break;
            case 'atashbas':
                me.truceActive = true;
                log('🕊️ آتش‌بس فعال');
                break;
            case 'bajgiri':
                if (target === null || target === undefined) { log('❌ انتخاب نشد'); return; }
                var tp = game.players[target];
                if (!tp || tp.id === me.id) { log('❌ نامعتبر'); return; }
                var steal = Math.min(3, tp.coins || 0);
                if (steal === 0) { log('❌ هدف سکه ندارد'); return; }
                tp.coins -= steal;
                me.coins = (me.coins || 0) + steal;
                log('💸 باج‌گیری: ' + steal + ' سکه از ' + tp.name);
                break;
            case 'azadsazi':
                if (!target) { log('❌ انتخاب نشد'); return; }
                var azd = game.provinceData[target];
                if (!azd) return;
                if (!me._everOwned[target]) { log('❌ قبلاً مال تو نبوده'); return; }
                if (azd.ownerId === me.id) { log('❌ الان مال توست'); return; }
                if (!isAdjacentToPlayer(target, me.id)) { log('❌ مرز ندارد'); return; }
                var prev = game.players[azd.ownerId];
                var pIdx = prev.provinces.indexOf(target);
                if (pIdx !== -1) prev.provinces.splice(pIdx, 1);
                azd.ownerId = me.id;
                if (azd.troops < 1) azd.troops = 1;
                me.provinces.push(target);
                log('🔓 آزادسازی: ' + target + ' پس گرفته شد');
                break;
            case 'yuresh2':
                game._attacksRemaining = (game._attacksRemaining || 0) + 1;
                me._p19AttackBonus = (me._p19AttackBonus || 0) + 1;
                log('⚔️ یورش دوگانه: +۱ حمله');
                break;
            case 'tajdid':
                var c2 = 0;
                me.provinces.forEach(function (p) { game.provinceData[p].troops++; c2++; });
                log('💉 تجدید قوا: ' + c2 + ' استان +1');
                break;
            default:
                consumed = false;
        }

        if (consumed) {
            me.hand.splice(idx, 1);
            game.actionMode = null;
            game.pendingCard = null;
            if (typeof window.updateAllMarkers === 'function') window.updateAllMarkers();
            refreshMap(); renderAll();
        }
    };

    function isValidTarget(card, name) {
        var me = game.players[game.currentPlayerIndex];
        var d = game.provinceData[name];
        if (!d) return false;
        if (card === 'kharabkari') {
            if (d.ownerId === me.id) return false;
            return me.provinces.some(function (p) { return (game.adjacency[p] || []).indexOf(name) !== -1; });
        }
        if (card === 'savare') return d.ownerId === me.id;
        if (card === 'azadsazi') {
            return me._everOwned && me._everOwned[name] && d.ownerId !== me.id && isAdjacentToPlayer(name, me.id);
        }
        return false;
    }

    /* ============================================================
       استایل
       ============================================================ */
    var _origStyle = window.getProvinceStyle;
    window.getProvinceStyle = function (f) {
        var name = typeof f === 'string' ? f : getProvinceName(f);
        if (window.game && game.actionMode === 'card-targeting' && game.pendingCard) {
            if (isValidTarget(game.pendingCard, name)) {
                return { fillColor: '#00bcd4', weight: 3.5, color: '#006064', dashArray: '6,4', opacity: 1, fillOpacity: 0.88 };
            }
        }
        if (window.game && game.actionMode === 'shop-targeting' && game.pendingEquipment) {
            var d = game.provinceData[name];
            var me = game.players[game.currentPlayerIndex];
            if (d && d.ownerId === me.id) {
                var item = EQUIPMENT[game.pendingEquipment];
                if (getUsedSlots(d) + item.slots <= 2 && (d.equipment || []).indexOf(game.pendingEquipment) === -1) {
                    return { fillColor: '#c39bd3', weight: 3.5, color: '#6c3483', dashArray: '6,4', opacity: 1, fillOpacity: 0.85 };
                }
            }
        }
        return _origStyle.apply(this, arguments);
    };

    /* ============================================================
       نبرد
       ============================================================ */
    function showAttackModal(src, tgt) {
        var s = game.provinceData[src];
        var t = game.provinceData[tgt];
        var me = game.players[game.currentPlayerIndex];
        var target = game.players[t.ownerId];
        var maxAttack = s.troops - 1;
        if (maxAttack < 1) { log('❌ نیرو کافی نیست'); game.attackSource = null; refreshMap(); renderAll(); return; }

        var srcCatapult = (s.equipment || []).indexOf('manjanigh') !== -1;
        var armorCount = (t.equipment || []).filter(function (e) { return e === 'zere'; }).length;
        var fortressCount = t.fortress || 0;
        var effectiveDefense = armorCount + (srcCatapult ? 0 : fortressCount);
        var hasMabad = (t.equipment || []).indexOf('mabad') !== -1;
        var hasBorj = (t.equipment || []).indexOf('borj') !== -1;
        var attackBonus = (me.attackBuff || 0) - (me.attackDebuff || 0);

        var old = document.getElementById('troop-select-overlay');
        if (old) old.parentNode.removeChild(old);
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = 10001;
        overlay.id = 'troop-select-overlay';

        var html = '<div class="modal-box" style="max-width:540px">';
        html += '<h2>⚔️ حمله</h2>';
        html += '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:14px 0;">';
        html += '<div style="text-align:center;padding:10px;background:rgba(39,174,96,0.15);border:2px solid #27ae60;border-radius:10px;">';
        html += '<div style="font-size:10px;color:#95a5a6;">مبدأ</div>';
        html += '<div style="font-size:12px;font-weight:bold;color:#f9d976;margin:3px 0;">' + src + '</div>';
        html += '<div style="font-size:22px;font-weight:900;">' + s.troops + ' 🗡️</div>';
        if (srcCatapult) html += '<div style="font-size:10px;color:#e67e22;">🎯 منجنیق</div>';
        html += '</div>';
        html += '<div style="font-size:22px;color:#d4af37;">→</div>';
        html += '<div style="text-align:center;padding:10px;background:rgba(231,76,60,0.15);border:2px solid #e74c3c;border-radius:10px;">';
        html += '<div style="font-size:10px;color:#95a5a6;">' + target.name + '</div>';
        html += '<div style="font-size:12px;font-weight:bold;color:#f9d976;margin:3px 0;">' + tgt + '</div>';
        html += '<div style="font-size:22px;font-weight:900;">' + t.troops + ' 🗡️</div>';
        if (effectiveDefense > 0) html += '<div style="font-size:10px;color:#e74c3c;">دفاع +' + effectiveDefense + '</div>';
        if (hasMabad) html += '<div style="font-size:10px;color:#9b59b6;">⛪ ۵۰٪</div>';
        if (hasBorj) html += '<div style="font-size:10px;color:#3498db;">🏹 ۳ تاس</div>';
        html += '</div></div>';

        html += '<div style="margin:14px 0;text-align:center;">';
        html += '<div style="font-size:13px;color:#cbd5e0;margin-bottom:6px;">با چند نیرو حمله می‌کنی؟</div>';
        html += '<div style="font-size:42px;font-weight:900;color:#f9d976;line-height:1.1;" id="troop-count-display">' + maxAttack + '</div>';
        html += '<div style="font-size:11px;color:#95a5a6;margin-top:6px;" id="troop-info-display"></div>';
        html += '</div>';
        html += '<input type="range" id="troop-slider" min="1" max="' + maxAttack + '" value="' + maxAttack + '" style="width:100%;height:6px;accent-color:#d4af37;">';
        html += '<div style="display:flex;justify-content:space-between;font-size:10px;color:#7f8c8d;"><span>۱</span><span>' + maxAttack + '</span></div>';
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
        var disp = document.getElementById('troop-count-display');
        var info = document.getElementById('troop-info-display');
        function refresh() {
            var v = parseInt(slider.value);
            disp.textContent = v;
            var stay = s.troops - v;
            var i = '🎲 ' + Math.min(3, v) + ' تاس';
            if (attackBonus > 0) i += ' +' + attackBonus;
            else if (attackBonus < 0) i += ' ' + attackBonus;
            i += ' | 🏠 ' + stay + ' در مبدأ';
            info.textContent = i;
        }
        slider.oninput = refresh; refresh();

        document.getElementById('preset-min').onclick = function () { slider.value = 1; refresh(); };
        document.getElementById('preset-half').onclick = function () { slider.value = Math.floor(maxAttack / 2); refresh(); };
        document.getElementById('preset-all').onclick = function () { slider.value = maxAttack; refresh(); };

        document.getElementById('troop-confirm').onclick = function () {
            var choice = parseInt(slider.value);
            overlay.parentNode.removeChild(overlay);
            resolveBattle(src, tgt, choice);
        };
        document.getElementById('troop-cancel').onclick = function () {
            overlay.parentNode.removeChild(overlay);
            game.attackSource = null;
            log('لغو حمله.');
            refreshMap(); renderAll();
        };
    }

    function resolveBattle(src, tgt, attackCount) {
        var s = game.provinceData[src];
        var t = game.provinceData[tgt];
        var me = game.players[game.currentPlayerIndex];
        var defender = game.players[t.ownerId];

        if (defender.truceActive) {
            log('🕊️ آتش‌بس');
            game.attackSource = null; game.actionMode = null; game.attackUsed = true;
            refreshMap(); renderAll(); return;
        }
        if (defender.hasShield) {
            defender.hasShield = false;
            me.attackBuff = 0;
            log('🛡️ سپر خنثی کرد');
            game.attackSource = null; game.actionMode = null; game.attackUsed = true;
            refreshMap(); renderAll(); return;
        }

        if ((t.equipment || []).indexOf('mabad') !== -1) {
            if (Math.random() < 0.5) {
                me.attackBuff = 0; me.attackDebuff = 0;
                log('⛪ معبد ' + tgt + ' حمله را خنثی کرد!');
                game.attackSource = null; game.actionMode = null; game.attackUsed = true;
                refreshMap(); renderAll(); return;
            } else {
                log('⛪ معبد نتوانست متوقف کند');
            }
        }

        var srcCatapult = (s.equipment || []).indexOf('manjanigh') !== -1;
        var armorCount = (t.equipment || []).filter(function (e) { return e === 'zere'; }).length;
        var fortressCount = t.fortress || 0;
        var hasBorj = (t.equipment || []).indexOf('borj') !== -1;
        var attackBonus = (me.attackBuff || 0) - (me.attackDebuff || 0);
        var defenseBonus = armorCount + (srcCatapult ? 0 : fortressCount);
        var defenderCap = hasBorj ? 3 : 2;

        me.attackBuff = 0; me.attackDebuff = 0;

        var attacking = attackCount;
        var defending = t.troops;
        var attackInit = attacking, defInit = defending;
        var stay = s.troops - attackCount;
        s.troops = stay;

        var summary = '⚔️ ' + src + ' (' + attackCount + ') → ' + tgt + ' (' + t.troops + ')';
        if (attackBonus !== 0) summary += ' | ' + (attackBonus > 0 ? '+' : '') + attackBonus;
        if (defenseBonus > 0) summary += ' | دفاع +' + defenseBonus;
        if (hasBorj) summary += ' | 🏹';
        log(summary);

        var round = 0;
        while (attacking > 0 && defending > 0 && round < 30) {
            round++;
            var aDice = [], dDice = [];
            for (var i = 0; i < Math.min(3, attacking); i++) aDice.push(1 + Math.floor(Math.random() * 6) + attackBonus);
            for (var j = 0; j < Math.min(defenderCap, defending); j++) dDice.push(1 + Math.floor(Math.random() * 6) + defenseBonus);
            aDice.sort(function (x, y) { return y - x; });
            dDice.sort(function (x, y) { return y - x; });
            var aLoss = 0, dLoss = 0;
            for (var k = 0; k < Math.min(aDice.length, dDice.length); k++) {
                if (aDice[k] > dDice[k]) dLoss++; else aLoss++;
            }
            attacking -= aLoss;
            defending -= dLoss;
            log('  دور ' + round + ': ⚔️[' + aDice.join(',') + '] 🛡️[' + dDice.join(',') + '] → ' + aLoss + '/' + dLoss);
        }

        if (defending <= 0 && attacking > 0) {
            t.ownerId = s.ownerId;
            t.troops = attacking;
            t.fortress = 0;
            var destroyed = (t.equipment || []).length;
            t.equipment = [];
            t.forgeCounter = 0;
            s.troops = stay;

            me._everOwned = me._everOwned || {};
            me._everOwned[tgt] = true;

            game.players.forEach(function (p) { p.provinces = []; });
            Object.keys(game.provinceData).forEach(function (n) {
                game.players[game.provinceData[n].ownerId].provinces.push(n);
            });

            log('✅ ' + me.name + ' استان ' + tgt + ' را فتح کرد!' + (destroyed > 0 ? ' (' + destroyed + ' تجهیز نابود)' : ''));
            me.coins = (me.coins || 0) + 1;
            log('💰 +1 سکه');

            me.conquestCounter = (me.conquestCounter || 0) + 1;
            if (me.conquestCounter >= 2) {
                me.conquestCounter = 0;
                if (me.hand.length < 3) {
                    me.hand.push(randomCardKey());
                    log('🎴 کارت جدید! (' + me.hand.length + '/3)');
                }
            }

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
            s.troops = stay + attacking;
            t.troops = Math.max(1, defending);
            log('❌ ناکام. تلفات: مهاجم ' + (attackInit - attacking) + '، مدافع ' + (defInit - defending));
        }

        game.attackSource = null;
        game.actionMode = null;
        game.attackUsed = true;
        if (typeof window.updateAllMarkers === 'function') window.updateAllMarkers();
        refreshMap(); renderAll();
    }

    /* ============================================================
       کلیک استان
       ============================================================ */
    var _origClick = window.onProvinceClick;
    window.onProvinceClick = function (name) {
        if (!window.game || game.gameOver) return _origClick.apply(this, arguments);

        if (game.actionMode === 'shop-targeting' && game.pendingEquipment) {
            return handleShopTarget(name);
        }
        if (game.actionMode === 'card-targeting' && game.pendingCard) {
            if (!isValidTarget(game.pendingCard, name)) { log('❌ هدف معتبر نیست.'); return; }
            return window.applyCard(game.pendingCard, name);
        }
        if (game.actionMode === 'attack' && game.attackSource) {
            var me = game.players[game.currentPlayerIndex];
            var data = game.provinceData[name];
            if (!data || name === game.attackSource || data.ownerId === me.id) {
                return _origClick.apply(this, arguments);
            }
            if ((game.adjacency[game.attackSource] || []).indexOf(name) === -1) {
                log('❌ مرز مشترک ندارد!'); return;
            }
            var key = relKey(me.id, data.ownerId);
            if (game.relations[key] === 'alliance') {
                return _origClick.apply(this, arguments);
            }
            if (game.relations[key] !== 'war') {
                game.relations[key] = 'war';
                log('📢 ' + me.name + ' به ' + game.players[data.ownerId].name + ' اعلام جنگ کرد!');
            }
            return showAttackModal(game.attackSource, name);
        }
        return _origClick.apply(this, arguments);
    };

    /* ============================================================
       شروع بازی
       ============================================================ */
    var _origStart = window.startGame;
    window.startGame = function () {
        var r = _origStart.apply(this, arguments);
        if (window.game && game.players) {
            game.players.forEach(function (p) {
                p._everOwned = {};
                p.provinces.forEach(function (pr) { p._everOwned[pr] = true; });
                p._p19AttackBonus = 0;
                p.hand = (p.hand || []).map(function (c) { return CARDS[c] ? c : randomCardKey(); });
            });
            if (game.provinceData) {
                Object.keys(game.provinceData).forEach(function (n) {
                    if (!game.provinceData[n].equipment) game.provinceData[n].equipment = [];
                });
            }
        }
        setTimeout(function () {
            if (typeof window.log === 'function') log('🎴 ۱۰ کارت + ۸ تجهیزات فعال شد');
            if (typeof renderAll === 'function') renderAll();
        }, 500);
        return r;
    };

    /* ============================================================
       پایان نوبت (خزانه)
       ============================================================ */
    var _origEnd = window.endTurn;
    window.endTurn = function () {
        var r = _origEnd.apply(this, arguments);
        if (!window.game || game.gameOver) return r;
        var me = game.players[game.currentPlayerIndex];
        if (!me || me.provinces.length === 0) return r;

        var khazaneCount = 0;
        me.provinces.forEach(function (p) {
            if ((game.provinceData[p].equipment || []).indexOf('khazane') !== -1) khazaneCount++;
        });
        if (khazaneCount > 0) {
            me.coins = (me.coins || 0) + khazaneCount * 2;
            log('🏦 خزانه: +' + (khazaneCount * 2) + ' سکه');
        }
        me._p19AttackBonus = 0;
        if (typeof renderAll === 'function') renderAll();
        return r;
    };

    /* ============================================================
       رندر — کارت‌ها با توضیح
       ============================================================ */
    var _origRender = window.renderAll;
    window.renderAll = function () {
        if (window.game && game.players) {
            game.players.forEach(function (p) {
                if (p.hand) p.hand = p.hand.map(function (c) { return CARDS[c] ? c : randomCardKey(); });
            });
            if (game.pendingCard && !CARDS[game.pendingCard]) game.pendingCard = randomCardKey();
        }

        var me = window.game && window.game.players ? window.game.players[window.game.currentPlayerIndex] : null;
        var handCopy = me && me.hand ? me.hand.slice() : [];

        var r = _origRender.apply(this, arguments);

        if (handCopy.length > 0 && me) {
            var actionBox = document.getElementById('actionBox');
            if (actionBox) {
                var cardsDivs = actionBox.querySelectorAll('div[style*="8e44ad"]');
                if (cardsDivs.length > 0) {
                    var disabled = (game.actionMode !== null) || (me.pendingTroops > 0);
                    var html = '<b style="font-size:12px;color:#fff">🎴 کارت‌های تو (' + handCopy.length + '/3):</b>';
                    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;">';
                    handCopy.forEach(function (ck) {
                        var info = CARDS[ck];
                        if (!info) return;
                        html += '<div style="background:linear-gradient(135deg,#9b59b6,#71368a);border-radius:8px;padding:8px;' +
                            (disabled ? 'opacity:0.5;cursor:not-allowed;' : 'cursor:pointer;') + '" ' +
                            (disabled ? '' : 'onclick="playCard(\'' + ck + '\')"') + '>' +
                            '<div style="font-weight:bold;font-size:12px;color:#fff">' + info.icon + ' ' + info.name + '</div>' +
                            '<div style="font-size:10px;color:#e8daef;margin-top:3px;line-height:1.4;">' + info.desc + '</div>' +
                            '</div>';
                    });
                    html += '</div>';
                    cardsDivs[0].innerHTML = html;
                }
            }
        }
        return r;
    };

    /* ============================================================
       Save / Load
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
                snap.state.p19 = {
                    everOwned: game.players.map(function (p) { return p._everOwned || {}; }),
                    attackBonus: game.players.map(function (p) { return p._p19AttackBonus || 0; })
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
            if (result && saved && saved.state && saved.state.p19) {
                setTimeout(function () {
                    if (!window.game || !game.players) return;
                    game.players.forEach(function (p, i) {
                        if (saved.state.p19.everOwned && saved.state.p19.everOwned[i]) {
                            p._everOwned = saved.state.p19.everOwned[i];
                        }
                        if (saved.state.p19.attackBonus && saved.state.p19.attackBonus[i]) {
                            p._p19AttackBonus = saved.state.p19.attackBonus[i];
                        }
                        p.hand = (p.hand || []).map(function (c) { return CARDS[c] ? c : randomCardKey(); });
                    });
                    if (typeof renderAll === 'function') renderAll();
                }, 1450);
            }
            return result;
        };
    }

    console.log('✅ patch-19: ۱۰ کارت + ۸ تجهیزات + توضیحات کامل');
})();