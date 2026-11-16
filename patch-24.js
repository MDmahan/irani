/* ========== patch-24.js — انیمیشن تاس + نمودار قدرت ========== */
(function () {
    console.log('🎲 patch-24: بارگذاری...');

    /* ============================================================
       بخش ۱: انیمیشن تاس
       ============================================================ */

    var capturedRounds = [];
    var battleResult = null;
    var battleSource = '';
    var battleTarget = '';

    /* ---- CSS انیمیشن ---- */
    var diceStyle = document.createElement('style');
    diceStyle.textContent = `
        @keyframes p24-dice-roll {
            0%   { transform: rotate(0deg)   scale(0.7); opacity: 0.5; }
            50%  { transform: rotate(180deg) scale(1.2); opacity: 1; }
            100% { transform: rotate(360deg) scale(1);   opacity: 1; }
        }
        .p24-round-block {
            margin-bottom: 10px;
            padding: 10px;
            background: rgba(52, 73, 94, 0.5);
            border-radius: 10px;
            border: 1px solid rgba(212, 175, 55, 0.15);
        }
        .p24-die {
            width: 34px;
            height: 34px;
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 15px;
            color: #fff;
            border: 2px solid rgba(255,255,255,0.9);
            box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        }
        .p24-die.atk { background: linear-gradient(135deg, #27ae60, #1e8449); }
        .p24-die.def { background: linear-gradient(135deg, #e74c3c, #a93226); }
    `;
    document.head.appendChild(diceStyle);

    /* ---- هوک لاگ برای capture ---- */
    var _origLog = window.log;
    window.log = function (msg) {
        if (msg && typeof msg === 'string') {
            var m = msg.trim();

            // خلاصه نبرد
            var summary = m.match(/⚔️\s+(.+?)\s+\(\d+\)\s+→\s+(.+?)\s+\(\d+\)/);
            if (summary) {
                battleSource = summary[1];
                battleTarget = summary[2];
            }

            // دورها
            var roundMatch = m.match(/دور\s+(\d+):\s*⚔️\[([\d,]+)\]\s*🛡️\[([\d,]+)\]/);
            if (roundMatch) {
                capturedRounds.push({
                    round: parseInt(roundMatch[1]),
                    attack: roundMatch[2].split(',').map(Number),
                    defense: roundMatch[3].split(',').map(Number)
                });
            }

            // نتیجه
            if (m.indexOf('✅') === 0 && m.indexOf('فتح') !== -1) {
                battleResult = { type: 'win' };
            } else if (m.indexOf('❌') === 0 && m.indexOf('ناکام') !== -1) {
                battleResult = { type: 'lose' };
            }
        }
        return _origLog.apply(this, arguments);
    };

    /* ---- تشخیص کلیک تأیید حمله ---- */
    document.addEventListener('click', function (e) {
        if (!e.target || e.target.id !== 'troop-confirm') return;

        capturedRounds = [];
        battleResult = null;
        battleSource = '';
        battleTarget = '';

        setTimeout(function () {
            if (capturedRounds.length > 0 && battleSource && battleTarget) {
                showDiceAnimation(battleSource, battleTarget, capturedRounds, battleResult);
            }
        }, 200);
    }, true);

    /* ---- نمایش انیمیشن ---- */
    function showDiceAnimation(src, tgt, rounds, result) {
        var old = document.getElementById('p24-dice-overlay');
        if (old) old.parentNode.removeChild(old);

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'p24-dice-overlay';
        overlay.style.zIndex = 10004;

        var html = '<div class="modal-box" style="max-width:560px;">';
        html += '<h2>🎲 نبرد</h2>';
        html += '<div style="text-align:center;font-size:13px;margin-bottom:15px;">';
        html += '<b style="color:#27ae60">' + src + '</b>';
        html += ' <span style="color:#d4af37;font-size:16px;">⚔️</span> ';
        html += '<b style="color:#e74c3c">' + tgt + '</b>';
        html += '</div>';
        html += '<div id="p24-dice-area" style="min-height:120px;max-height:280px;overflow-y:auto;background:rgba(0,0,0,0.3);border-radius:10px;padding:12px;">';
        html += '</div>';
        html += '<div id="p24-dice-result" style="text-align:center;margin-top:15px;font-size:16px;font-weight:bold;min-height:28px;"></div>';
        html += '<div class="btn-row" style="margin-top:15px;">';
        html += '<button class="modal-btn-close" id="p24-dice-close">بستن</button>';
        html += '</div>';
        html += '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        var area = document.getElementById('p24-dice-area');
        var resultEl = document.getElementById('p24-dice-result');

        document.getElementById('p24-dice-close').onclick = function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        };
        overlay.onclick = function (e) {
            if (e.target === overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };

        // نمایش دورها با انیمیشن
        rounds.forEach(function (r, idx) {
            setTimeout(function () {
                renderRound(area, r);
            }, idx * 700);
        });

        // نتیجه
        setTimeout(function () {
            if (!result) return;
            if (result.type === 'win') {
                resultEl.innerHTML = '<span style="color:#27ae60">✅ فتح شد!</span>';
            } else {
                resultEl.innerHTML = '<span style="color:#e74c3c">❌ حمله ناکام</span>';
            }
        }, rounds.length * 700 + 300);
    }

    function renderRound(area, r) {
        var block = document.createElement('div');
        block.className = 'p24-round-block';

        var header = '<div style="font-size:10px;color:#95a5a6;margin-bottom:8px;text-align:center;">دور ' + r.round + '</div>';
        var row = '<div style="display:flex;justify-content:space-around;align-items:center;">';

        // تاس‌های مهاجم
        row += '<div style="display:flex;gap:4px;">';
        r.attack.forEach(function (v, i) {
            row += '<div class="p24-die atk" data-value="' + v + '" data-idx="' + i + '">?</div>';
        });
        row += '</div>';

        row += '<div style="color:#d4af37;font-size:18px;">⚔️</div>';

        // تاس‌های مدافع
        row += '<div style="display:flex;gap:4px;">';
        r.defense.forEach(function (v, i) {
            row += '<div class="p24-die def" data-value="' + v + '" data-idx="' + i + '">?</div>';
        });
        row += '</div>';

        row += '</div>';
        block.innerHTML = header + row;
        area.appendChild(block);
        area.scrollTop = area.scrollHeight;

        // انیمیشن با تأخیر
        var dice = block.querySelectorAll('.p24-die');
        dice.forEach(function (die, i) {
            setTimeout(function () {
                die.style.animation = 'p24-dice-roll 0.35s ease';
                die.textContent = die.dataset.value;
            }, 100 + i * 70);
        });
    }

    /* ============================================================
       بخش ۲: نمودار قدرت
       ============================================================ */

    function computePower(p) {
        if (!p || !p.provinces || p.provinces.length === 0) return 0;
        var troops = 0;
        p.provinces.forEach(function (pr) {
            if (window.game.provinceData[pr]) {
                troops += window.game.provinceData[pr].troops || 0;
            }
        });
        return p.provinces.length * 2 + troops + Math.floor((p.coins || 0) / 2);
    }

    function samplePower() {
        if (!window.game || !game.players) return;
        if (!game._powerHistory) game._powerHistory = { turns: [], data: [] };
        var hist = game._powerHistory;
        var turn = game.turn || 1;

        var currentData = game.players.map(function (p) {
            return { name: p.name, color: p.color, power: computePower(p) };
        });

        if (hist.turns.length > 0 && hist.turns[hist.turns.length - 1] === turn) {
            hist.data[hist.data.length - 1] = currentData;
        } else {
            hist.turns.push(turn);
            hist.data.push(currentData);
        }
    }

    window.showPowerChart = function () {
        if (!window.game || !game.players) return;

        if (!game._powerHistory || game._powerHistory.turns.length === 0) {
            samplePower();
        }
        var hist = game._powerHistory;
        if (!hist) return;

        var old = document.getElementById('p24-chart-overlay');
        if (old) old.parentNode.removeChild(old);

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'p24-chart-overlay';
        overlay.style.zIndex = 10004;

        var W = 640, H = 320;
        var padL = 55, padR = 20, padT = 20, padB = 45;
        var chartW = W - padL - padR;
        var chartH = H - padT - padB;

        var turns = hist.turns;
        var data = hist.data;

        var maxPower = 10;
        data.forEach(function (round) {
            round.forEach(function (d) {
                if (d.power > maxPower) maxPower = d.power;
            });
        });
        maxPower = Math.ceil(maxPower / 10) * 10;
        if (maxPower < 10) maxPower = 10;

        var svg = '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="background:rgba(0,0,0,0.3);border-radius:10px;display:block;">';

        // Grid
        for (var i = 0; i <= 5; i++) {
            var gy = padT + (chartH / 5) * i;
            var val = maxPower - (maxPower / 5) * i;
            svg += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="rgba(255,255,255,0.08)"/>';
            svg += '<text x="' + (padL - 8) + '" y="' + (gy + 4) + '" fill="#95a5a6" font-size="10" text-anchor="end" font-family="Tahoma">' + Math.round(val) + '</text>';
        }

        // X labels
        var step = Math.max(1, Math.ceil(turns.length / 8));
        turns.forEach(function (t, i) {
            if (i % step !== 0 && i !== turns.length - 1) return;
            var lx = padL + (turns.length > 1 ? (chartW / (turns.length - 1)) * i : chartW / 2);
            svg += '<text x="' + lx + '" y="' + (H - padB + 16) + '" fill="#95a5a6" font-size="10" text-anchor="middle" font-family="Tahoma">' + t + '</text>';
        });

        svg += '<text x="' + (W / 2) + '" y="' + (H - 5) + '" fill="#cbd5e0" font-size="11" text-anchor="middle" font-family="Tahoma">دور</text>';
        svg += '<text x="14" y="' + (padT + chartH / 2) + '" fill="#cbd5e0" font-size="11" text-anchor="middle" font-family="Tahoma" transform="rotate(-90 14 ' + (padT + chartH / 2) + ')">قدرت</text>';

        // خطوط هر بازیکن
        var playerCount = data[0] ? data[0].length : 0;
        for (var pi = 0; pi < playerCount; pi++) {
            var points = [];
            data.forEach(function (round, ti) {
                if (!round[pi]) return;
                var x = padL + (turns.length > 1 ? (chartW / (turns.length - 1)) * ti : chartW / 2);
                var y = padT + chartH - (round[pi].power / maxPower) * chartH;
                points.push(x + ',' + y);
            });
            if (points.length === 0) continue;
            var color = data[0][pi].color || '#3498db';
            if (points.length > 1) {
                svg += '<polyline points="' + points.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
            }
            points.forEach(function (pt) {
                var xy = pt.split(',');
                svg += '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="3.5" fill="' + color + '" stroke="#fff" stroke-width="1.5"/>';
            });
        }

        svg += '</svg>';

        // Legend
        var legend = '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:14px;justify-content:center;">';
        if (data[0]) {
            data[0].forEach(function (d, i) {
                var last = data[data.length - 1][i];
                legend += '<div style="display:flex;align-items:center;gap:6px;font-size:12px;background:rgba(0,0,0,0.3);padding:4px 10px;border-radius:6px;">';
                legend += '<span style="width:12px;height:12px;border-radius:3px;background:' + d.color + ';border:1px solid rgba(255,255,255,0.4);"></span>';
                legend += '<span style="color:#f9d976;font-weight:bold;">' + d.name + '</span>';
                legend += '<span style="color:#95a5a6;">' + (last ? last.power : 0) + '</span>';
                legend += '</div>';
            });
        }
        legend += '</div>';

        var html = '<div class="modal-box" style="max-width:700px;max-height:90vh;overflow-y:auto;">';
        html += '<h2>📈 نمودار قدرت</h2>';
        html += '<p style="text-align:center;font-size:11px;color:#95a5a6;margin-bottom:10px;">قدرت = (استان × ۲) + سرباز + (سکه ÷ ۲)</p>';
        html += svg;
        html += legend;
        html += '<div class="btn-row" style="margin-top:15px;">';
        html += '<button class="modal-btn-close" id="p24-chart-close">بستن</button>';
        html += '</div>';
        html += '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        document.getElementById('p24-chart-close').onclick = function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        };
        overlay.onclick = function (e) {
            if (e.target === overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };
    };

    /* ============================================================
       بخش ۳: هوک‌های چرخه بازی
       ============================================================ */

    var _origEndTurn = window.endTurn;
    window.endTurn = function () {
        var r = _origEndTurn.apply(this, arguments);
        if (window.game && !game.gameOver) {
            setTimeout(samplePower, 400);
        }
        return r;
    };

    var _origStart = window.startGame;
    window.startGame = function () {
        var r = _origStart.apply(this, arguments);
        if (window.game) {
            game._powerHistory = null;
            setTimeout(samplePower, 800);
        }
        return r;
    };

    /* ============================================================
       بخش ۴: دکمه نمودار در پنل
       ============================================================ */

    var _origRender = window.renderAll;
    window.renderAll = function () {
        var r = _origRender.apply(this, arguments);
        if (!window.game || game.gameOver) return r;

        var actionBox = document.getElementById('actionBox');
        if (actionBox && !document.getElementById('p24-chart-btn')) {
            var btn = document.createElement('button');
            btn.id = 'p24-chart-btn';
            btn.className = 'btn';
            btn.style.background = 'linear-gradient(135deg, #2980b9, #1f618d)';
            btn.style.marginTop = '10px';
            btn.innerHTML = '📈 نمودار قدرت';
            btn.onclick = window.showPowerChart;

            var regionsBtn = document.getElementById('regions-guide-btn');
            var shopBtn = document.getElementById('shop-btn');
            var h3 = actionBox.querySelector('h3');

            if (regionsBtn) {
                actionBox.insertBefore(btn, regionsBtn);
            } else if (shopBtn) {
                actionBox.insertBefore(btn, shopBtn);
            } else if (h3) {
                actionBox.insertBefore(btn, h3);
            } else {
                actionBox.appendChild(btn);
            }
        }
        return r;
    };

    /* ============================================================
       بخش ۵: Save / Load
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
                snap.state.p24 = { powerHistory: game._powerHistory || null };
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

            if (result && saved && saved.state && saved.state.p24) {
                setTimeout(function () {
                    if (!window.game) return;
                    game._powerHistory = saved.state.p24.powerHistory || null;
                    if (!game._powerHistory) samplePower();
                }, 1950);
            }
            return result;
        };
    }

    console.log('✅ patch-24: انیمیشن تاس + نمودار قدرت');
})();