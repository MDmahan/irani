/* ========== patch-20.js — اولتیماتوم (نسخه نهایی) ========== */
(function () {
    console.log('🔧 patch-20: بارگذاری...');

    var ULTIMATUM_COINS = 3;

    /* ---------- مودال ---------- */
    function showModal(html) {
        var o = document.createElement('div');
        o.className = 'modal-overlay';
        o.style.zIndex = 10002;
        o.innerHTML = '<div class="modal-box">' + html + '</div>';
        document.body.appendChild(o);
        return o;
    }
    function closeModal(o) { if (o && o.parentNode) o.parentNode.removeChild(o); }

    /* ============================================================
       ۱. مودال انتخاب بازیکن هدف
       ============================================================ */
    window.showUltimatumPicker = function () {
        if (!window.game || game.gameOver) return;
        var me = game.players[game.currentPlayerIndex];
        if (!me) return;

        if (me._ultimatumUsed) {
            log('❌ در این نوبت قبلاً اولتیماتوم داده‌ای');
            return;
        }

        var others = game.players.filter(function (p) {
            return p.id !== me.id && p.provinces.length > 0;
        });
        if (others.length === 0) { log('❌ بازیکن دیگری نیست'); return; }

        var html = '<h2>📢 اولتیماتوم به چه کسی؟</h2>';
        html += '<p style="text-align:center;font-size:13px;color:#95a5a6;margin-bottom:15px;">' +
                '۳ سکه بده یا جنگ — ۱ بار در نوبت</p>';
        html += '<div>';
        others.forEach(function (p) {
            var isWar = game.relations[relKey(me.id, p.id)] === 'war';
            var coins = p.coins || 0;
            html += '<button class="btn" style="margin:5px 0;display:flex;justify-content:space-between;align-items:center;padding:12px 14px;' +
                    (isWar ? 'opacity:0.5;' : '') + '" ' +
                    'onclick="doAction(' + p.id + ', \'war\')"' + (isWar ? ' disabled' : '') + '>' +
                    '<span><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' +
                    p.color + ';margin-left:8px;vertical-align:middle;"></span>' + p.name + '</span>' +
                    '<span style="font-size:11px;color:' + (isWar ? '#e74c3c' : '#f1c40f') + ';">' +
                    (isWar ? '⚔️ در جنگ' : '💰 ' + coins + ' سکه') + '</span></button>';
        });
        html += '</div>';
        html += '<div class="btn-row" style="margin-top:15px;">' +
                '<button class="modal-btn-close" onclick="window.closeUltimatumPicker()">لغو</button></div>';

        var overlay = showModal(html);
        overlay.id = 'p20-picker-overlay';

        window.closeUltimatumPicker = function () {
            closeModal(overlay);
            game.actionMode = null;
            renderAll();
        };
    };

    /* ============================================================
       ۲. doAction — بازنویسی کامل
       ============================================================ */
    window.doAction = function (targetId, action) {
        if (!window.game) return;

        var picker = document.getElementById('p20-picker-overlay');
        if (picker) picker.parentNode.removeChild(picker);

        var me = game.players[game.currentPlayerIndex];
        var target = game.players[targetId];
        if (!me || !target) return;
        var key = relKey(me.id, targetId);

        /* ---- اولتیماتوم ---- */
        if (action === 'war') {
            if (me._ultimatumUsed) {
                log('❌ در این نوبت قبلاً اولتیماتوم داده‌ای');
                game.actionMode = null; renderAll(); return;
            }
            if (game.relations[key] === 'war') {
                log('⚔️ با ' + target.name + ' در جنگ هستی');
                game.actionMode = null; renderAll(); return;
            }
            showUltimatumDialog(me, target, key);
            return;
        }

        /* ---- شکستن اتحاد ---- */
        if (action === 'break') {
            if ((me.coins || 0) < 3) {
                log('❌ شکستن اتحاد نیاز به ۳ سکه دارد');
                game.actionMode = null; renderAll(); return;
            }
            me.coins -= 3;
            game.relations[key] = 'war';
            if (game.relationExpiry) delete game.relationExpiry[key];
            log('💔 ' + me.name + ' اتحاد با ' + target.name + ' را شکست (-3 سکه) → جنگ');
            game.actionMode = null;
            if (typeof refreshMap === 'function') refreshMap();
            renderAll(); return;
        }

        /* ---- صلح / اتحاد ---- */
        if (action === 'peace' || action === 'alliance') {
            var label = action === 'peace' ? 'صلح' : 'اتحاد';
            var icon = action === 'peace' ? '🕊️' : '🤝';
            var duration = action === 'peace' ? 3 : 5;

            log(icon + ' ' + me.name + ' به ' + target.name + ' پیشنهاد ' + label + ' داد');

            var o = showModal(
                '<h2>' + icon + ' درخواست ' + label + '</h2>' +
                '<p><b style="color:' + me.color + '">' + me.name + '</b> به ' +
                '<b style="color:' + target.color + '">' + target.name + '</b> پیشنهاد ' +
                '<b>' + label + '</b> برای <b>' + duration + ' نوبت</b> می‌دهد.</p>' +
                (action === 'alliance' ? '<p style="color:#27ae60;text-align:center">🤝 هر دو +۱ سکه در هر نوبت</p>' : '') +
                '<div class="btn-row">' +
                '<button class="modal-btn-yes" id="p20-yes">✅ قبول</button>' +
                '<button class="modal-btn-no" id="p20-no">❌ رد</button></div>'
            );

            document.getElementById('p20-yes').onclick = function () {
                game.relations[key] = action;
                if (!game.relationExpiry) game.relationExpiry = {};
                game.relationExpiry[key] = game.turn + duration;
                log('✅ ' + me.name + ' و ' + target.name + ' ' + label + ' کردند (' + duration + ' نوبت)');
                closeModal(o);
                game.actionMode = null;
                if (typeof refreshMap === 'function') refreshMap();
                renderAll();
            };
            document.getElementById('p20-no').onclick = function () {
                log('❌ ' + target.name + ' پیشنهاد ' + label + ' را رد کرد.');
                closeModal(o);
                game.actionMode = null;
                if (typeof refreshMap === 'function') refreshMap();
                renderAll();
            };
            return;
        }

        game.actionMode = null;
        if (typeof refreshMap === 'function') refreshMap();
        renderAll();
    };

    /* ============================================================
       ۳. مودال اولتیماتوم (تأیید طرف مقابل)
       ============================================================ */
    function showUltimatumDialog(me, target, key) {
        var coins = target.coins || 0;
        var canAfford = coins >= ULTIMATUM_COINS;

        log('📢 ' + me.name + ' به ' + target.name + ' اولتیماتوم داد');

        var html = '<h2>📢 اولتیماتوم</h2>';
        html += '<p style="text-align:center"><b style="color:' + me.color + '">' + me.name +
                '</b> به <b style="color:' + target.color + '">' + target.name + '</b> اولتیماتوم داد.</p>';
        html += '<p style="text-align:center;font-size:18px;margin:18px 0;line-height:1.8;">' +
                '<b style="color:#f1c40f">۳ سکه</b> بده،<br>یا <b style="color:#e74c3c">جنگ</b>!</p>';
        html += '<p style="text-align:center;font-size:13px;color:#95a5a6">💰 سکه‌های ' + target.name +
                ': <b>' + coins + '</b></p>';
        if (!canAfford) {
            html += '<p style="text-align:center;color:#e74c3c;font-size:12px;padding:8px;' +
                    'background:rgba(231,76,60,0.1);border-radius:6px;margin:10px 0;">' +
                    '⚠️ سکه کافی ندارد — تنها گزینه جنگ است</p>';
        }
        html += '<div class="btn-row">';
        if (canAfford) {
            html += '<button class="modal-btn-yes" id="p20-accept">💰 ۳ سکه می‌دهم</button>';
        } else {
            html += '<button class="modal-btn-yes" disabled style="opacity:0.35">💰 نمی‌توانم</button>';
        }
        html += '<button class="modal-btn-no" id="p20-reject">⚔️ جنگ!</button></div>';

        var overlay = showModal(html);

        var acceptBtn = document.getElementById('p20-accept');
        if (acceptBtn && canAfford) {
            acceptBtn.onclick = function () {
                target.coins -= ULTIMATUM_COINS;
                me.coins = (me.coins || 0) + ULTIMATUM_COINS;
                me._ultimatumUsed = true;

                if (!me._ultimatumPeace) me._ultimatumPeace = {};
                me._ultimatumPeace[target.id] = true;

                log('💰 ' + target.name + ' ۳ سکه داد — ' + me.name +
                    ' در این نوبت نمی‌تواند به ' + target.name + ' حمله کند');
                closeModal(overlay);
                game.actionMode = null;
                if (typeof refreshMap === 'function') refreshMap();
                renderAll();
            };
        }

        document.getElementById('p20-reject').onclick = function () {
            game.relations[key] = 'war';
            if (game.relationExpiry) delete game.relationExpiry[key];
            me._ultimatumUsed = true;
            log('📢 ' + me.name + ' به ' + target.name + ' اعلام جنگ کرد! (اولتیماتوم رد شد)');
            closeModal(overlay);
            game.actionMode = null;
            if (typeof refreshMap === 'function') refreshMap();
            renderAll();
        };
    }

    /* ============================================================
       ۴. محافظت: جلوگیری از حمله بعد از قبول
       ============================================================ */
    var _origClick = window.onProvinceClick;
    window.onProvinceClick = function (name) {
        if (!window.game || game.gameOver) return _origClick.apply(this, arguments);
        if (game.actionMode !== 'attack' || !game.attackSource) return _origClick.apply(this, arguments);

        var me = game.players[game.currentPlayerIndex];
        var data = game.provinceData[name];
        if (!data || data.ownerId === me.id) return _origClick.apply(this, arguments);

        if (me._ultimatumPeace && me._ultimatumPeace[data.ownerId]) {
            log('🕊️ ' + game.players[data.ownerId].name +
                ' اولتیماتوم را پذیرفته — تا پایان نوبت نمی‌توانی بهش حمله کنی');
            return;
        }

        return _origClick.apply(this, arguments);
    };

    /* ============================================================
       ۵. ریست در پایان نوبت
       ============================================================ */
    var _origEnd = window.endTurn;
    window.endTurn = function () {
        var prevPlayer = (window.game && game.players) ? game.players[game.currentPlayerIndex] : null;
        var r = _origEnd.apply(this, arguments);
        if (prevPlayer) {
            prevPlayer._ultimatumUsed = false;
            prevPlayer._ultimatumPeace = {};
        }
        return r;
    };

    /* ============================================================
       ۶. شروع بازی
       ============================================================ */
    var _origStart = window.startGame;
    window.startGame = function () {
        var r = _origStart.apply(this, arguments);
        if (window.game && game.players) {
            game.players.forEach(function (p) {
                p._ultimatumUsed = false;
                p._ultimatumPeace = {};
            });
        }
        return r;
    };

    /* ============================================================
       ۷. UI — دکمه اصلی → picker
       ============================================================ */
    var _origRender = window.renderAll;
    window.renderAll = function () {
        var r = _origRender.apply(this, arguments);
        if (!window.game || game.gameOver) return r;

        var me = game.players[game.currentPlayerIndex];
        if (!me) return r;

        var actionBox = document.getElementById('actionBox');
        if (!actionBox) return r;

        var btns = actionBox.querySelectorAll('.btn');
        for (var i = 0; i < btns.length; i++) {
            var b = btns[i];
            var oc = b.getAttribute('onclick') || '';
            if (oc.indexOf("game.actionMode='war'") !== -1 ||
                oc.indexOf('game.actionMode="war"') !== -1 ||
                oc.indexOf("actionMode=\\'war\\'") !== -1) {
                b.setAttribute('onclick', 'window.showUltimatumPicker()');
                if (me._ultimatumUsed) {
                    b.disabled = true;
                    b.innerHTML = '📢 اولتیماتوم (استفاده شده)';
                    b.title = 'در این نوبت قبلاً فرستاده‌ای';
                } else {
                    b.disabled = false;
                    b.innerHTML = '📢 اولتیماتوم';
                    b.title = '۳ سکه یا جنگ — ۱ بار در نوبت';
                }
            }
        }

        var headers = actionBox.querySelectorAll('b');
        for (var j = 0; j < headers.length; j++) {
            if (headers[j].textContent.indexOf('هدف جنگ') !== -1) {
                headers[j].innerHTML = '📢 اولتیماتوم به:';
            }
        }

        return r;
    };

    /* ============================================================
       ۸. Save / Load
       ============================================================ */
    var _origSave = window.p10SaveGame;
    if (typeof _origSave === 'function') {
        window.p10SaveGame = function (silent) {
            var result = _origSave.apply(this, arguments);
            if (!result || !window.game || !game.players) return result;
            try {
                var raw = localStorage.getItem('iran-war-save-v1');
                if (!raw) return result;
                var snap = JSON.parse(raw);
                if (!snap.state) snap.state = {};
                snap.state.p20 = {
                    used: game.players.map(function (p) { return !!p._ultimatumUsed; }),
                    peace: game.players.map(function (p) { return p._ultimatumPeace || {}; })
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

            if (result && saved && saved.state && saved.state.p20) {
                setTimeout(function () {
                    if (!window.game || !game.players) return;
                    game.players.forEach(function (p, i) {
                        if (saved.state.p20.used && saved.state.p20.used[i] !== undefined) {
                            p._ultimatumUsed = saved.state.p20.used[i];
                        }
                        if (saved.state.p20.peace && saved.state.p20.peace[i]) {
                            p._ultimatumPeace = saved.state.p20.peace[i];
                        }
                    });
                    if (typeof renderAll === 'function') renderAll();
                }, 1650);
            }
            return result;
        };
    }

    console.log('✅ patch-20: اولتیماتوم نهایی');
})();