/* ========== patch-7.js — انتخاب نیروی حمله ========== */
(function () {
    console.log('🔧 patch-7: بارگذاری...');

    var _origOnProvinceClick = window.onProvinceClick;

    /* ---------- ابزار ---------- */
    function attackerDice(troops) {
        return troops >= 3 ? 3 : troops;
    }

    /* ---------- مودال انتخاب نیرو ---------- */
    function showTroopModal(srcName, targetName) {
        var srcData = game.provinceData[srcName];
        var targetData = game.provinceData[targetName];
        var me = game.players[game.currentPlayerIndex];
        var target = game.players[targetData.ownerId];

        var maxAttack = srcData.troops - 1;
        var minAttack = 1;
        if (maxAttack < minAttack) {
            log('❌ نیروی کافی نداری');
            game.attackSource = null;
            refreshMap(); renderAll();
            return;
        }

        var selected = maxAttack;
        var oldOverlay = document.getElementById('troop-select-overlay');
        if (oldOverlay) oldOverlay.parentNode.removeChild(oldOverlay);

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = 10001;
        overlay.id = 'troop-select-overlay';

        var attackBonus = (me.attackBuff || 0) - (me.attackDebuff || 0);
        var defenseBonus = targetData.fortress || 0;

        var html = '<div class="modal-box" style="max-width:520px">';
        html += '<h2>⚔️ انتخاب نیروی حمله</h2>';

        // دو کارت کنار هم
        html += '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:14px 0;">';
        html += '<div style="text-align:center;padding:10px;background:rgba(39,174,96,0.15);border:2px solid #27ae60;border-radius:10px;">';
        html += '<div style="font-size:10px;color:#95a5a6;letter-spacing:1px;">مبدأ</div>';
        html += '<div style="font-size:13px;font-weight:bold;color:#f9d976;margin:3px 0;">' + srcName + '</div>';
        html += '<div style="font-size:22px;font-weight:900;">' + srcData.troops + ' 🗡️</div>';
        html += '</div>';
        html += '<div style="font-size:22px;color:#d4af37;font-weight:bold;">→</div>';
        html += '<div style="text-align:center;padding:10px;background:rgba(231,76,60,0.15);border:2px solid #e74c3c;border-radius:10px;">';
        html += '<div style="font-size:10px;color:#95a5a6;letter-spacing:1px;">هدف · ' + target.name + '</div>';
        html += '<div style="font-size:13px;font-weight:bold;color:#f9d976;margin:3px 0;">' + targetName + '</div>';
        html += '<div style="font-size:22px;font-weight:900;">' + targetData.troops + ' 🗡️';
        if (defenseBonus > 0) html += '<div style="font-size:11px;color:#f1c40f;">🏰 دژ +' + defenseBonus + '</div>';
        html += '</div></div>';
        html += '</div>';

        // انتخاب تعداد
        html += '<div style="margin:14px 0;text-align:center;">';
        html += '<div style="font-size:13px;color:#cbd5e0;margin-bottom:6px;">با چند نیرو حمله می‌کنی؟</div>';
        html += '<div style="font-size:42px;font-weight:900;color:#f9d976;text-shadow:0 0 24px rgba(212,175,55,0.6);line-height:1.1;" id="troop-count-display">' + selected + '</div>';
        html += '<div style="font-size:11px;color:#95a5a6;margin-top:6px;" id="troop-info-display"></div>';
        html += '</div>';

        // اسلایدر
        html += '<input type="range" id="troop-slider" min="' + minAttack + '" max="' + maxAttack + '" value="' + selected + '" style="width:100%;height:6px;cursor:pointer;accent-color:#d4af37;">';
        html += '<div style="display:flex;justify-content:space-between;font-size:10px;color:#7f8c8d;margin-top:4px;">';
        html += '<span>۱ (حداقل)</span><span>' + maxAttack + ' (همه)</span>';
        html += '</div>';

        // دکمه‌های سریع
        html += '<div style="display:flex;gap:6px;margin-top:12px;">';
        html += '<button class="btn" style="flex:1;padding:8px;font-size:12px;" id="preset-min">حداقل</button>';
        html += '<button class="btn" style="flex:1;padding:8px;font-size:12px;" id="preset-half">نصف</button>';
        html += '<button class="btn" style="flex:1;padding:8px;font-size:12px;" id="preset-all">همه</button>';
        html += '</div>';

        // دکمه‌های تایید/لغو
        html += '<div class="btn-row" style="margin-top:16px;">';
        html += '<button class="modal-btn-yes" id="troop-confirm">⚔️ حمله!</button>';
        html += '<button class="modal-btn-no" id="troop-cancel">❌ لغو</button>';
        html += '</div>';
        html += '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        var slider = document.getElementById('troop-slider');
        var countDisp = document.getElementById('troop-count-display');
        var infoDisp = document.getElementById('troop-info-display');

        function refresh() {
            var v = parseInt(slider.value);
            countDisp.textContent = v;
            var aDice = attackerDice(v);
            var stay = srcData.troops - v;
            var info = '🎲 حداکثر ' + aDice + ' تاس مهاجم';
            if (attackBonus > 0) info += ' + ' + attackBonus;
            if (attackBonus < 0) info += ' ' + attackBonus;
            info += ' | 🏠 ' + stay + ' در مبدأ می‌ماند';
            infoDisp.textContent = info;
        }

        slider.oninput = refresh;
        refresh();

        function setSlider(n) {
            n = Math.max(minAttack, Math.min(maxAttack, n));
            slider.value = n;
            refresh();
        }
        document.getElementById('preset-min').onclick = function () { setSlider(minAttack); };
        document.getElementById('preset-half').onclick = function () { setSlider(Math.floor(maxAttack / 2)); };
        document.getElementById('preset-all').onclick = function () { setSlider(maxAttack); };

        document.getElementById('troop-confirm').onclick = function () {
            var choice = parseInt(slider.value);
            overlay.parentNode.removeChild(overlay);
            resolveBattleWithChoice(srcName, targetName, choice);
        };

        document.getElementById('troop-cancel').onclick = function () {
            overlay.parentNode.removeChild(overlay);
            game.attackSource = null;
            log('لغو حمله. استان مبدأ را دوباره انتخاب کن.');
            refreshMap(); renderAll();
        };
    }

    /* ---------- نبرد با نیروی انتخابی ---------- */
    function resolveBattleWithChoice(sourceName, targetName, attackCount) {
        var s = game.provinceData[sourceName];
        var t = game.provinceData[targetName];
        var me = game.players[game.currentPlayerIndex];
        var defender = game.players[t.ownerId];

        // آتش‌بس
        if (defender.truceActive) {
            log('🕊️ ' + defender.name + ' تحت آتش‌بس است! حمله لغو شد.');
            game.attackSource = null; game.actionMode = null;
            refreshMap(); renderAll(); return;
        }
        // سپر
        if (defender.hasShield) {
            defender.hasShield = false;
            me.attackBuff = 0;
            log('🛡️ سپر ' + defender.name + ' حمله را خنثی کرد! (یورش هم سوخت)');
            game.attackSource = null; game.actionMode = null;
            refreshMap(); renderAll(); return;
        }

        var attackBonus = (me.attackBuff || 0) - (me.attackDebuff || 0);
        var defenseBonus = t.fortress || 0;
        me.attackBuff = 0;
        me.attackDebuff = 0;

        var attacking = attackCount;
        var defending = t.troops;
        var attackInit = attacking, defInit = defending;
        var stayInSource = s.troops - attackCount;
        s.troops = stayInSource;

        var summary = '⚔️ ' + sourceName + ' (' + attackCount + ' از ' + (attackCount + stayInSource) + ') → ' + targetName + ' (' + t.troops + ')';
        if (attackBonus !== 0) summary += ' | پاداش: ' + (attackBonus > 0 ? '+' : '') + attackBonus;
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
            t.fortress = 0;
            game.players.forEach(function (p) { p.provinces = []; });
            Object.keys(game.provinceData).forEach(function (n) {
                game.players[game.provinceData[n].ownerId].provinces.push(n);
            });
            log('✅ ' + me.name + ' استان ' + targetName + ' را فتح کرد! (' + attacking +
                ' منتقل شد، ' + stayInSource + ' در ' + sourceName + ' ماند)' +
                (oldFortress > 0 ? ' (دژ پاک شد)' : ''));

            // منطق کارت
            me.conquestCounter = (me.conquestCounter || 0) + 1;
            if (me.conquestCounter >= 2) {
                me.conquestCounter = 0;
                if (me.hand.length < 3) {
                    var cards = ['yuresh', 'sepor', 'kharabkari', 'farakhvan', 'dezh', 'savare', 'atashbas', 'toufan'];
                    var c = cards[Math.floor(Math.random() * cards.length)];
                    me.hand.push(c);
                    log('🎴 کارت جدید! (دست: ' + me.hand.length + '/3)');
                } else {
                    log('🎴 دست پر است! فرصت کارت سوخت.');
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
            s.troops = stayInSource + attacking;
            t.troops = Math.max(1, defending);
            log('❌ حمله ناکام. تلفات: مهاجم ' + (attackInit - attacking) + '، مدافع ' + (defInit - defending) +
                ' | ' + attacking + ' نیروی بازمانده به ' + sourceName + ' برگشت.');
        }

        game.attackSource = null;
        game.actionMode = null;
        game.attackUsed = true;
        refreshMap(); renderAll();
    }

    /* ---------- Override onProvinceClick ---------- */
    window.onProvinceClick = function (name) {
        if (!game || game.gameOver || !game.adjacency) return;

        // حالت‌های غیر حمله رو به نسخه قبلی بسپار
        if (game.actionMode !== 'attack') {
            return _origOnProvinceClick(name);
        }

        var data = game.provinceData[name];
        if (!data) return;
        var me = game.players[game.currentPlayerIndex];

        if (me.pendingTroops > 0) { log('❌ اول نیروهایت را توزیع کن!'); return; }
        if (game.attackUsed) { log('❌ در این نوبت حمله کرده‌ای.'); return; }

        // انتخاب مبدأ
        if (!game.attackSource) {
            if (data.ownerId !== me.id) { log('❌ این استان تو نیست!'); return; }
            if (data.troops < 2) { log('❌ حداقل ۲ نیرو برای حمله لازم است!'); return; }
            game.attackSource = name;
            log('🎯 مبدأ: ' + name + ' (' + data.troops + ' نیرو). استان دشمن مجاور را انتخاب کن.');
            refreshMap(); renderAll();
            return;
        }

        // کلیک دوباره روی مبدأ → لغو
        if (name === game.attackSource) {
            game.attackSource = null;
            log('لغو مبدأ.');
            refreshMap(); renderAll();
            return;
        }

        // تغییر مبدأ
        if (data.ownerId === me.id) {
            if (data.troops < 2) { log('❌ این استان حداقل ۲ نیرو ندارد!'); return; }
            game.attackSource = name;
            log('🎯 مبدأ جدید: ' + name + ' (' + data.troops + ' نیرو)');
            refreshMap(); renderAll();
            return;
        }

        // استان دشمن → بررسی مجاورت و اعلام جنگ
        var isAdj = (game.adjacency[game.attackSource] || []).indexOf(name) !== -1;
        if (!isAdj) { log('❌ ' + name + ' با ' + game.attackSource + ' مرز مشترک ندارد!'); return; }

        var key = relKey(me.id, data.ownerId);
        if (game.relations[key] === 'alliance') { log('⚠️ با این بازیکن اتحاد داری.'); return; }
        if (game.relations[key] !== 'war') {
            game.relations[key] = 'war';
            log('📢 ' + me.name + ' به ' + game.players[data.ownerId].name + ' اعلام جنگ کرد!');
        }

        // نمایش مودال
        showTroopModal(game.attackSource, name);
    };

    console.log('✅ patch-7: انتخاب نیروی حمله فعال');
})();