/* ========== patch-23.js — شخصی‌سازی بازیکن‌ها (نام، رنگ، آواتار) ========== */
(function () {
    console.log('🎭 patch-23: بارگذاری...');

    var AVATARS = ['👑', '🤴', '⚔️', '🛡️', '🏹', '🐎', '🏰', '🦅', '🐺', '🦁', '🐉', '🧙'];
    var COLORS_8 = ['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#16a085', '#e67e22', '#8e44ad'];

    var playerCustomizations = [];

    /* ---------- کمک ---------- */
    function esc(s) {
        return String(s || '').replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function getDefault(i) {
        return {
            name: 'بازیکن ' + (i + 1),
            color: COLORS_8[i % COLORS_8.length],
            avatar: AVATARS[i % AVATARS.length]
        };
    }
    function getCustomizations(n) {
        var r = [];
        for (var i = 0; i < n; i++) r.push(playerCustomizations[i] || getDefault(i));
        return r;
    }
    function hexOf(color) {
        if (!color) return null;
        if (color[0] === '#') return color.toLowerCase();
        var m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (m) return '#' + [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])]
            .map(function (x) { return x.toString(16).padStart(2, '0'); }).join('').toLowerCase();
        return null;
    }

    /* ---------- رندر UI ---------- */
    function renderSetupUI() {
        var setup = document.getElementById('setup');
        if (!setup) return;

        var countSel = document.getElementById('playerCount');
        if (!countSel) return;
        var n = parseInt(countSel.value);

        var old = document.getElementById('p23-players');
        if (old) old.parentNode.removeChild(old);

        var container = document.createElement('div');
        container.id = 'p23-players';
        container.style.cssText = 'margin-top:12px;padding:10px;background:rgba(0,0,0,0.25);border-radius:10px;border:1px solid rgba(212,175,55,0.3);';

        var html = '<div style="font-size:12px;color:#f1c40f;font-weight:bold;margin-bottom:10px;">🎭 شخصی‌سازی بازیکن‌ها:</div>';
        var customs = getCustomizations(n);

        customs.forEach(function (c, i) {
            html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:8px;background:rgba(15,23,42,0.6);border-radius:8px;border-right:4px solid ' + c.color + ';">';
            html += '<button class="p23-avatar" data-idx="' + i + '" style="font-size:24px;padding:4px 8px;background:rgba(52,73,94,0.7);border:1px solid rgba(255,255,255,0.15);border-radius:6px;cursor:pointer;">' + c.avatar + '</button>';
            html += '<input type="text" class="p23-name" data-idx="' + i + '" value="' + esc(c.name) + '" maxlength="15" placeholder="نام بازیکن ' + (i + 1) + '" style="flex:1;min-width:0;padding:7px 10px;border-radius:6px;background:#0f172a;color:#fff;border:1px solid #3498db;font-family:inherit;font-size:12px;">';
            html += '<button class="p23-color" data-idx="' + i + '" style="width:28px;height:28px;border-radius:50%;background:' + c.color + ';border:2px solid #fff;cursor:pointer;"></button>';
            html += '</div>';
        });

        container.innerHTML = html;

        var section = setup.querySelector('.section');
        var startBtn = section ? section.querySelector('.btn.success') : null;
        if (section && startBtn) {
            section.insertBefore(container, startBtn);
        } else if (section) {
            section.appendChild(container);
        } else {
            setup.appendChild(container);
        }

        attachUIListeners(container, n);
    }

    function attachUIListeners(container, n) {
        var customs = getCustomizations(n);

        container.querySelectorAll('.p23-name').forEach(function (inp) {
            inp.oninput = function () {
                var idx = parseInt(this.dataset.idx);
                var all = getCustomizations(n);
                all[idx].name = this.value;
                playerCustomizations = all;
            };
        });

        container.querySelectorAll('.p23-avatar').forEach(function (btn) {
            btn.onclick = function () {
                showAvatarPicker(parseInt(this.dataset.idx), n);
            };
        });

        container.querySelectorAll('.p23-color').forEach(function (btn) {
            btn.onclick = function () {
                showColorPicker(parseInt(this.dataset.idx), n);
            };
        });
    }

    /* ---------- پیکر آواتار ---------- */
    function showAvatarPicker(idx, n) {
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = 10005;

        var html = '<div class="modal-box" style="max-width:420px;">';
        html += '<h2>😀 انتخاب آواتار</h2>';
        html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:15px 0;">';
        AVATARS.forEach(function (a, i) {
            html += '<button class="p23-pick-av" data-idx="' + i + '" style="font-size:34px;padding:12px 4px;background:rgba(52,73,94,0.5);border:2px solid rgba(255,255,255,0.15);border-radius:10px;cursor:pointer;transition:all 0.15s;">' + a + '</button>';
        });
        html += '</div>';
        html += '<div class="btn-row"><button class="modal-btn-close" id="p23-av-close">بستن</button></div>';
        html += '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        overlay.querySelectorAll('.p23-pick-av').forEach(function (btn) {
            btn.onmouseenter = function () { this.style.borderColor = '#d4af37'; this.style.transform = 'scale(1.1)'; };
            btn.onmouseleave = function () { this.style.borderColor = 'rgba(255,255,255,0.15)'; this.style.transform = 'scale(1)'; };
            btn.onclick = function () {
                var all = getCustomizations(n);
                all[idx].avatar = AVATARS[parseInt(this.dataset.idx)];
                playerCustomizations = all;
                overlay.parentNode.removeChild(overlay);
                renderSetupUI();
            };
        });
        document.getElementById('p23-av-close').onclick = function () {
            overlay.parentNode.removeChild(overlay);
        };
    }

    /* ---------- پیکر رنگ ---------- */
    function showColorPicker(idx, n) {
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = 10005;

        var html = '<div class="modal-box" style="max-width:420px;">';
        html += '<h2>🎨 انتخاب رنگ</h2>';
        html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:15px 0;">';
        COLORS_8.forEach(function (c, i) {
            html += '<button class="p23-pick-color" data-idx="' + i + '" style="width:100%;height:55px;background:' + c + ';border:3px solid rgba(255,255,255,0.2);border-radius:10px;cursor:pointer;transition:all 0.15s;"></button>';
        });
        html += '</div>';
        html += '<div class="btn-row"><button class="modal-btn-close" id="p23-col-close">بستن</button></div>';
        html += '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        overlay.querySelectorAll('.p23-pick-color').forEach(function (btn) {
            btn.onmouseenter = function () { this.style.borderColor = '#fff'; this.style.transform = 'scale(1.05)'; };
            btn.onmouseleave = function () { this.style.borderColor = 'rgba(255,255,255,0.2)'; this.style.transform = 'scale(1)'; };
            btn.onclick = function () {
                var all = getCustomizations(n);
                var newColor = COLORS_8[parseInt(this.dataset.idx)];
                var used = all.some(function (c, i) { return i !== idx && c.color === newColor; });
                if (used) {
                    alert('این رنگ قبلاً برای بازیکن دیگری انتخاب شده!');
                    return;
                }
                all[idx].color = newColor;
                playerCustomizations = all;
                overlay.parentNode.removeChild(overlay);
                renderSetupUI();
            };
        });
        document.getElementById('p23-col-close').onclick = function () {
            overlay.parentNode.removeChild(overlay);
        };
    }

    /* ---------- تغییر تعداد بازیکنان ---------- */
    document.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'playerCount') {
            setTimeout(renderSetupUI, 50);
        }
    });

    /* ---------- شروع بازی: اعمال شخصی‌سازی ---------- */
    var _origStart = window.startGame;
    window.startGame = function () {
        var countSel = document.getElementById('playerCount');
        var n = countSel ? parseInt(countSel.value) : 2;
        var customs = getCustomizations(n);

        var r = _origStart.apply(this, arguments);

        if (window.game && game.players) {
            game.players.forEach(function (p, i) {
                if (!customs[i]) return;
                var nm = customs[i].name && customs[i].name.trim();
                p.name = nm || ('بازیکن ' + (i + 1));
                p.color = customs[i].color;
                p.avatar = customs[i].avatar;
            });
            if (typeof window.updateAllMarkers === 'function') setTimeout(window.updateAllMarkers, 150);
            setTimeout(function () {
                if (typeof renderAll === 'function') renderAll();
            }, 300);
        }
        return r;
    };

    /* ---------- نمایش آواتار در پنل ---------- */
    var _origRender = window.renderAll;
    window.renderAll = function () {
        var r = _origRender.apply(this, arguments);
        if (!window.game || game.gameOver || !game.players) return r;

        var me = game.players[game.currentPlayerIndex];
        if (!me) return r;

        // آواتار در currentPlayerBox
        var box = document.getElementById('currentPlayerBox');
        if (box && me.avatar) {
            var b = box.querySelector('b');
            if (b) {
                var expected = me.avatar + ' ' + me.name;
                if (b.textContent !== expected) b.textContent = expected;
            }
        }

        // آواتار در لیست روابط (player-tag)
        document.querySelectorAll('.player-tag').forEach(function (tag) {
            if (tag.textContent.trim()) return;
            var hex = hexOf(tag.style.background);
            if (!hex) return;
            for (var i = 0; i < game.players.length; i++) {
                var p = game.players[i];
                if (p.avatar && hexOf(p.color) === hex) {
                    tag.textContent = p.avatar;
                    tag.style.fontSize = '10px';
                    tag.style.lineHeight = '14px';
                    tag.style.textAlign = 'center';
                    return;
                }
            }
        });

        return r;
    };

    /* ---------- Save / Load ---------- */
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
                snap.state.p23 = {
                    customizations: playerCustomizations,
                    avatars: game.players.map(function (p) { return p.avatar || ''; })
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
            if (result && saved && saved.state && saved.state.p23) {
                setTimeout(function () {
                    if (!window.game || !game.players) return;
                    playerCustomizations = saved.state.p23.customizations || [];
                    if (saved.state.p23.avatars) {
                        game.players.forEach(function (p, i) {
                            if (saved.state.p23.avatars[i]) p.avatar = saved.state.p23.avatars[i];
                        });
                    }
                    if (typeof window.updateAllMarkers === 'function') window.updateAllMarkers();
                    if (typeof renderAll === 'function') renderAll();
                }, 1850);
            }
            return result;
        };
    }

    /* ---------- init ---------- */
    var initAttempts = 0;
    function initUI() {
        initAttempts++;
        var setup = document.getElementById('setup');
        if (!setup) {
            if (initAttempts < 50) setTimeout(initUI, 200);
            return;
        }
        renderSetupUI();
    }
    setTimeout(initUI, 300);

    console.log('✅ patch-23: شخصی‌سازی بازیکن‌ها فعال');
})();