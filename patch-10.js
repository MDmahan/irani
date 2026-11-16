/* ========== patch-10.js — منو + قوانین + برد + Save ========== */
(function () {
    console.log('🎮 patch-10: بارگذاری...');

    /* ===== CSS ===== */
    var style = document.createElement('style');
    style.textContent = `
        .p10-overlay {
            position: fixed; inset: 0;
            background: linear-gradient(135deg, #0a0f1a 0%, #1a1a2e 50%, #0a0f1a 100%);
            z-index: 10000; display: none; flex-direction: column;
            align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.4s ease;
            padding: 20px; font-family: 'Vazirmatn', Tahoma, sans-serif;
            direction: rtl; overflow-y: auto;
        }
        .p10-overlay.active { display: flex; opacity: 1; }
        .p10-overlay.rules-overlay { justify-content: flex-start; padding: 30px 20px; }
        .p10-title {
            font-size: 52px; font-weight: 900;
            background: linear-gradient(135deg, #d4af37 0%, #f9d976 50%, #d4af37 100%);
            -webkit-background-clip: text; background-clip: text;
            -webkit-text-fill-color: transparent; color: transparent;
            text-align: center; margin: 0 0 10px 0;
            letter-spacing: 4px;
            text-shadow: 0 0 60px rgba(212, 175, 55, 0.3);
        }
        .p10-subtitle {
            color: #95a5a6; font-size: 14px; text-align: center;
            margin-bottom: 40px; letter-spacing: 2px;
        }
        .p10-menu-btn {
            background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
            color: #0a0f1a; border: none; padding: 16px 40px;
            border-radius: 12px; font-size: 18px; font-weight: bold;
            font-family: inherit; cursor: pointer; margin: 8px;
            min-width: 280px;
            box-shadow: 0 6px 20px rgba(212, 175, 55, 0.3);
            transition: all 0.2s; letter-spacing: 1px;
        }
        .p10-menu-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(212, 175, 55, 0.5); filter: brightness(1.1); }
        .p10-menu-btn:active { transform: translateY(0); }
        .p10-menu-btn.secondary {
            background: linear-gradient(135deg, #3498db 0%, #2471a3 100%);
            color: white; box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
        }
        .p10-menu-btn.secondary:hover { box-shadow: 0 10px 30px rgba(52, 152, 219, 0.5); }
        .p10-back-btn {
            position: fixed; top: 20px; right: 20px;
            background: rgba(52, 73, 94, 0.9); color: #f9d976;
            border: 2px solid #d4af37; padding: 10px 20px;
            border-radius: 10px; font-size: 14px; font-weight: bold;
            font-family: inherit; cursor: pointer;
            z-index: 10001; transition: all 0.2s;
        }
        .p10-back-btn:hover { background: rgba(212, 175, 55, 0.2); transform: scale(1.05); }
        .p10-rules-content {
            max-width: 800px; width: 100%;
            background: rgba(26, 26, 46, 0.95);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 16px; padding: 30px;
            color: #ecf0f1; line-height: 1.9;
        }
        .p10-rules-content h2 {
            color: #f9d976; font-size: 22px; margin: 0 0 20px 0;
            padding-bottom: 10px; border-bottom: 2px solid rgba(212, 175, 55, 0.3);
            text-align: center;
        }
        .p10-rules-content h3 {
            color: #d4af37; font-size: 17px; margin-top: 24px;
            margin-bottom: 12px; padding-bottom: 6px;
            border-bottom: 1px dashed rgba(212, 175, 55, 0.2);
        }
        .p10-rules-content h3::before { content: '◆ '; color: #d4af37; }
        .p10-rules-content ul { padding-right: 20px; margin: 10px 0; }
        .p10-rules-content li { margin: 6px 0; font-size: 14px; color: #cbd5e0; }
        .p10-rules-content b { color: #f9d976; }
        .p10-rules-content table {
            width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px;
        }
        .p10-rules-content th, .p10-rules-content td {
            padding: 8px 10px;
            border: 1px solid rgba(212, 175, 55, 0.15);
            text-align: right;
        }
        .p10-rules-content th {
            background: rgba(212, 175, 55, 0.15);
            color: #f9d976; font-weight: bold;
        }
        .p10-rules-content tr:nth-child(even) td { background: rgba(0, 0, 0, 0.2); }
        .p10-victory-trophy {
            font-size: 100px; margin-bottom: 20px;
            animation: p10-bounce 1.5s ease-in-out infinite;
            filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.8));
        }
        @keyframes p10-bounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-15px) scale(1.05); }
        }
        .p10-victory-name {
            font-size: 38px; font-weight: 900; margin: 20px 0;
            text-shadow: 0 0 40px currentColor;
        }
        .p10-victory-msg {
            font-size: 18px; color: #cbd5e0; margin-bottom: 30px;
        }
        .p10-save-indicator {
            position: fixed; top: 12px; left: 12px;
            background: rgba(39, 174, 96, 0.95); color: white;
            padding: 8px 16px; border-radius: 20px;
            font-size: 13px; font-weight: bold;
            z-index: 9998; opacity: 0; transition: opacity 0.3s;
            pointer-events: none; font-family: inherit;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .p10-save-indicator.show { opacity: 1; }
        @media (max-width: 768px) {
            .p10-title { font-size: 32px; letter-spacing: 2px; }
            .p10-subtitle { font-size: 12px; margin-bottom: 24px; }
            .p10-menu-btn { min-width: 240px; padding: 14px 24px; font-size: 15px; }
            .p10-rules-content { padding: 20px 15px; }
            .p10-rules-content h2 { font-size: 18px; }
            .p10-rules-content h3 { font-size: 15px; }
            .p10-rules-content li { font-size: 13px; }
            .p10-rules-content table { font-size: 11px; }
            .p10-back-btn { top: 10px; right: 10px; padding: 8px 14px; font-size: 12px; }
            .p10-victory-trophy { font-size: 70px; }
            .p10-victory-name { font-size: 26px; }
            .p10-save-indicator {
                top: auto; bottom: 60px; left: 50%;
                transform: translateX(-50%);
            }
        }
    `;
    document.head.appendChild(style);

    /* ===== ساخت Overlay ها ===== */
    function createOverlay(id, cls) {
        var el = document.createElement('div');
        el.id = 'p10-overlay-' + id;
        el.className = 'p10-overlay' + (cls ? ' ' + cls : '');
        document.body.appendChild(el);
        return el;
    }

    /* ---- منوی اصلی ---- */
    var menu = createOverlay('menu');
    menu.innerHTML =
        '<div class="p10-title">⚔️ جنگ استان‌ها</div>' +
        '<div class="p10-subtitle">فتح ایران زمین</div>' +
        '<button class="p10-menu-btn" id="p10-btn-new">🎮 شروع بازی جدید</button>' +
        '<button class="p10-menu-btn secondary" id="p10-btn-continue" style="display:none">📂 ادامه بازی</button>' +
        '<button class="p10-menu-btn secondary" id="p10-btn-rules">📖 قوانین بازی</button>';

    /* ---- صفحه قوانین ---- */
    var rules = createOverlay('rules', 'rules-overlay');
    rules.innerHTML =
        '<button class="p10-back-btn" id="p10-rules-back">← بازگشت</button>' +
        '<div class="p10-rules-content">' +
            '<h2>📖 قوانین جنگ استان‌ها</h2>' +

            '<h3>🎲 تاس و نبرد</h3>' +
            '<ul>' +
                '<li><b>مهاجم:</b> تا <b>۳ تاس</b> (به تعداد سربازهای فرستاده‌شده، حداکثر ۳)</li>' +
                '<li><b>مدافع:</b> تا <b>۲ تاس</b> (به تعداد سربازهای استان، حداکثر ۲)</li>' +
                '<li>هر تاس از <b>۱ تا ۶</b> + پاداش‌ها (یورش، زره، دژ)</li>' +
                '<li>تاس‌ها نزولی مرتب و جفت‌به‌جفت مقایسه می‌شوند</li>' +
                '<li><b>در تساوی، مدافع برنده است</b></li>' +
                '<li>هر باخت = <b>۱ سرباز تلفات</b>؛ تا صفر شدن یک طرف ادامه دارد</li>' +
                '<li>حداقل <b>۱ سرباز</b> در استان مبدأ می‌ماند</li>' +
            '</ul>' +

            '<h3>🗡️ نیرو و درآمد</h3>' +
            '<ul>' +
                '<li>هر استان با <b>۲ سرباز</b> شروع می‌کند</li>' +
                '<li>درآمد هر نوبت: <b>۳ + (استان‌ها ÷ ۳)</b> سرباز</li>' +
                '<li>نیروها <b>خودکار</b> یا <b>دستی</b> توزیع می‌شوند</li>' +
                '<li>حداقل <b>۲ سرباز</b> برای حمله از یک استان لازم است</li>' +
                '<li><b>هر نوبت فقط یک حمله</b> مجاز است</li>' +
            '</ul>' +

            '<h3>🎴 کارت‌های تاکتیکی</h3>' +
            '<ul>' +
                '<li>هر <b>۲ فتح</b> = ۱ کارت تصادفی</li>' +
                '<li>حداکثر <b>۳ کارت</b> در دست</li>' +
                '<li>فقط بعد از توزیع نیروها</li>' +
            '</ul>' +
            '<table>' +
                '<tr><th>کارت</th><th>اثر</th></tr>' +
                '<tr><td>⚡ یورش</td><td>+۲ تاس به حمله بعدی</td></tr>' +
                '<tr><td>🛡️ سپر</td><td>حمله بعدی دشمن خنثی</td></tr>' +
                '<tr><td>💣 خرابکاری</td><td>استان دشمن مجاور: −۲ سرباز</td></tr>' +
                '<tr><td>📯 فراخوان</td><td>استان‌های مرزی +۱ سرباز</td></tr>' +
                '<tr><td>🏰 دژ</td><td>+۱ دفاع دائمی (تا ۳)</td></tr>' +
                '<tr><td>🐎 سواره‌نظام</td><td>+۳ سرباز فوری</td></tr>' +
                '<tr><td>🕊️ آتش‌بس</td><td>تا نوبت بعدت امن</td></tr>' +
                '<tr><td>🌀 طوفان</td><td>−۲ تاس از حمله بعدی دشمن</td></tr>' +
            '</table>' +

            '<h3>💰 سکه و تجهیزات</h3>' +
            '<ul>' +
                '<li>شروع با <b>۵ سکه</b></li>' +
                '<li>درآمد هر نوبت: <b>۱ + (استان ÷ ۵)</b></li>' +
                '<li>ضعیف‌ترین بازیکن <b>+۱ سکه</b></li>' +
                '<li>هر فتح: <b>+۱ سکه</b></li>' +
                '<li>حداکثر <b>۲ تجهیز</b> در هر استان · با فتح نابود می‌شوند</li>' +
            '</ul>' +
            '<table>' +
                '<tr><th>تجهیز</th><th>هزینه</th><th>اثر</th></tr>' +
                '<tr><td>🛡️ زره</td><td>۵</td><td>+۱ دفاع دائمی (با دژ جمع، تا ۵)</td></tr>' +
                '<tr><td>🏭 پادگان</td><td>۷</td><td>+۱ سرباز در شروع هر نوبت</td></tr>' +
                '<tr><td>🎯 منجنیق</td><td>۴</td><td>حمله دژ دشمن را نادیده می‌گیرد</td></tr>' +
                '<tr><td>⚒️ آهنگری</td><td>۶</td><td>هر ۳ نوبت، ۱ کارت رایگان</td></tr>' +
            '</table>' +

            '<h3>🗺️ پاداش مناطق</h3>' +
            '<ul>' +
                '<li>اگر <b>همه استان‌های یک منطقه</b> را کنترل کنی، پاداش دائمی می‌گیری</li>' +
                '<li>در شروع هر نوبت به نیروهای در انتظار اضافه می‌شود</li>' +
                '<li>اگر استانی از دست بدهی، پاداش از نوبت بعد قطع می‌شود</li>' +
            '</ul>' +
            '<table>' +
                '<tr><th>منطقه</th><th>پاداش</th></tr>' +
                '<tr><td>🌊 خزر (گیلان، مازندران، گلستان)</td><td>+۲</td></tr>' +
                '<tr><td>🏔️ آذربایجان (شرقی، غربی، اردبیل، زنجان)</td><td>+۳</td></tr>' +
                '<tr><td>⛰️ غرب (کردستان، کرمانشاه، همدان، لرستان، ایلام)</td><td>+۳</td></tr>' +
                '<tr><td>🏜️ مرکز (تهران، البرز، قزوین، قم، مرکزی، اصفهان)</td><td>+۴</td></tr>' +
                '<tr><td>🏛️ شمال‌شرق (خراسان‌ها، سمنان)</td><td>+۳</td></tr>' +
                '<tr><td>🐊 جنوب‌غرب (خوزستان، چهارمحال، کهگیلویه)</td><td>+۲</td></tr>' +
                '<tr><td>🌴 جنوب (بوشهر، هرمزگان، فارس)</td><td>+۲</td></tr>' +
                '<tr><td>🏝️ جنوب‌شرق (سیستان، کرمان، یزد)</td><td>+۲</td></tr>' +
            '</table>' +

            '<h3>🤝 دیپلماسی</h3>' +
            '<ul>' +
                '<li><b>صلح:</b> با تأیید بازیکن مقابل</li>' +
                '<li><b>اتحاد:</b> با تأیید · نمی‌توانی به متحدت حمله کنی</li>' +
                '<li><b>جنگ:</b> یک‌طرفه</li>' +
                '<li><b>شکستن اتحاد:</b> یک‌طرفه → تبدیل به صلح</li>' +
            '</ul>' +

            '<h3>🏆 پیروزی</h3>' +
            '<ul>' +
                '<li>کنترل <b>تمام ۳۱ استان</b> = برنده</li>' +
                '<li>بازیکن بدون استان = حذف</li>' +
            '</ul>' +
        '</div>';

    /* ---- صفحه پیروزی ---- */
    var victory = createOverlay('victory');
    victory.innerHTML =
        '<div class="p10-victory-trophy">🏆</div>' +
        '<div class="p10-title">پیروزی!</div>' +
        '<div class="p10-victory-name" id="p10-victory-name"></div>' +
        '<div class="p10-victory-msg">تمام ایران را فتح کرد!</div>' +
        '<button class="p10-menu-btn" id="p10-btn-victory-new">🎮 بازی جدید</button>' +
        '<button class="p10-menu-btn secondary" id="p10-btn-victory-menu">🏠 منوی اصلی</button>';

    /* ---- نشانگر ذخیره ---- */
    var saveIndicator = document.createElement('div');
    saveIndicator.className = 'p10-save-indicator';
    saveIndicator.id = 'p10-save-indicator';
    saveIndicator.textContent = '💾 ذخیره شد';
    document.body.appendChild(saveIndicator);

    /* ===== مدیریت صفحه ===== */
    window.p10ShowScreen = function (name) {
        document.querySelectorAll('.p10-overlay').forEach(function (el) {
            el.classList.remove('active');
        });
        if (name && name !== 'none') {
            var el = document.getElementById('p10-overlay-' + name);
            if (el) el.classList.add('active');
        }
    };

    /* ===== Save/Load ===== */
    var SAVE_KEY = 'iran-war-save-v1';

    window.p10SaveGame = function (silent) {
        if (!window.game || !game.players || !game.provinceData) return false;
        try {
            var snapshot = {
                version: 1,
                timestamp: Date.now(),
                state: {
                    players: game.players.map(function (p) {
                        return {
                            id: p.id, name: p.name, color: p.color,
                            provinces: p.provinces.slice(),
                            hand: (p.hand || []).slice(),
                            pendingTroops: p.pendingTroops || 0,
                            attackBuff: p.attackBuff || 0,
                            attackDebuff: p.attackDebuff || 0,
                            hasShield: !!p.hasShield,
                            truceActive: !!p.truceActive,
                            conquestCounter: p.conquestCounter || 0,
                            coins: p.coins || 0
                        };
                    }),
                    currentPlayerIndex: game.currentPlayerIndex,
                    provinceData: JSON.parse(JSON.stringify(game.provinceData)),
                    relations: JSON.parse(JSON.stringify(game.relations)),
                    turn: game.turn,
                    playerCount: game.playerCount,
                    attackUsed: !!game.attackUsed,
                    gameOver: !!game.gameOver,
                    adjacency: game.adjacency || {}
                }
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
            console.log('💾 ذخیره شد (' + snapshot.timestamp + ')');
            if (!silent) {
                saveIndicator.classList.add('show');
                setTimeout(function () { saveIndicator.classList.remove('show'); }, 1500);
            }
            return true;
        } catch (e) {
            console.error('خطا در ذخیره:', e);
            return false;
        }
    };

    window.p10HasSave = function () {
        try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
    };

    window.p10LoadGame = function () {
        var raw;
        try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
        if (!raw) return false;
        var snapshot;
        try { snapshot = JSON.parse(raw); } catch (e) { return false; }
        var s = snapshot.state;

        window.game = {
            players: s.players,
            currentPlayerIndex: s.currentPlayerIndex,
            provinceData: s.provinceData,
            relations: s.relations,
            turn: s.turn,
            playerCount: s.playerCount,
            attackUsed: s.attackUsed,
            gameOver: s.gameOver,
            adjacency: s.adjacency,
            actionMode: null,
            attackSource: null,
            pendingCard: null,
            pendingEquipment: null,
            map: null, layer: null,
            provinceLayers: {}, troopMarkers: {},
            regions: null
        };

        p10ShowScreen('none');
        var setup = document.getElementById('setup');
        var gameBox = document.getElementById('game');
        if (setup) setup.style.display = 'none';
        if (gameBox) gameBox.style.display = 'block';

        setTimeout(function () {
            if (game.map) { try { game.map.remove(); } catch (e) {} }
            game.map = L.map('map', { center: [32.4279, 53.6880], zoom: 5, minZoom: 4, maxZoom: 9 });
            game.provinceLayers = {};
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
            rebuildMarkers();
            if (!game.regions && typeof window.assignRegions === 'function') {
                game.regions = window.assignRegions();
            }
            if (typeof refreshMap === 'function') refreshMap();
            if (typeof renderAll === 'function') renderAll();
            window.dispatchEvent(new Event('resize'));
            setTimeout(function () {
                try { game.map.invalidateSize(); } catch (e) {}
            }, 300);
            console.log('📂 بازی بارگذاری شد');
        }, 250);

        return true;
    };

    function rebuildMarkers() {
        if (game.troopMarkers) {
            Object.keys(game.troopMarkers).forEach(function (name) {
                try { game.map.removeLayer(game.troopMarkers[name]); } catch (e) {}
            });
        }
        game.troopMarkers = {};
        Object.keys(game.provinceData).forEach(function (name) {
            var lyr = game.provinceLayers[name];
            if (!lyr) return;
            var c = lyr.getBounds().getCenter();
            var d = game.provinceData[name];
            var marker = L.marker(c, {
                icon: L.divIcon({
                    className: 'troop-count',
                    html: '<div class="num-line">' + d.troops + '</div>',
                    iconSize: [42, 42]
                }),
                interactive: false,
                zIndexOffset: 1000
            }).addTo(game.map);
            if (marker._icon) marker._icon.style.borderColor = game.players[d.ownerId].color;
            game.troopMarkers[name] = marker;
        });
        if (typeof window.updateAllMarkers === 'function') window.updateAllMarkers();
    }

    window.p10DeleteSave = function () {
        try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    };

    /* ===== Override alert برای برد ===== */
    var _origAlert = window.alert;
    window.alert = function (msg) {
        if (msg && typeof msg === 'string' && msg.indexOf('🏆') !== -1 && msg.indexOf('برنده') !== -1) {
            showVictoryScreen(msg);
            return;
        }
        _origAlert.call(window, msg);
    };

    function showVictoryScreen(msg) {
        var nameEl = document.getElementById('p10-victory-name');
        if (nameEl && window.game && game.players) {
            var winner = null;
            game.players.forEach(function (p) {
                if (msg.indexOf(p.name) !== -1) winner = p;
            });
            if (winner) {
                nameEl.textContent = winner.name;
                nameEl.style.color = winner.color;
            } else {
                nameEl.textContent = '🏆';
            }
        }
        p10ShowScreen('victory');
        p10DeleteSave();
    }

    /* ===== دکمه‌های منو ===== */
    document.getElementById('p10-btn-new').onclick = function () {
        if (p10HasSave()) {
            if (!confirm('یک بازی ذخیره شده داری. بازی جدید شروع شود؟ (ذخیره حذف می‌شود)')) return;
            p10DeleteSave();
        }
        p10ShowScreen('none');
    };
    document.getElementById('p10-btn-continue').onclick = function () {
        p10LoadGame();
    };
    document.getElementById('p10-btn-rules').onclick = function () {
        p10ShowScreen('rules');
    };
    document.getElementById('p10-rules-back').onclick = function () {
        p10ShowScreen('menu');
    };
    document.getElementById('p10-btn-victory-new').onclick = function () {
        location.reload();
    };
    document.getElementById('p10-btn-victory-menu').onclick = function () {
        location.reload();
    };

    /* ===== Auto-save ===== */
    var _origEndTurn = window.endTurn;
    window.endTurn = function () {
        var r = _origEndTurn.apply(this, arguments);
        if (window.game && !game.gameOver && game.players) {
            setTimeout(function () { p10SaveGame(true); }, 300);
        }
        return r;
    };

    var _origStartGame = window.startGame;
    window.startGame = function () {
        var r = _origStartGame.apply(this, arguments);
        setTimeout(function () { p10SaveGame(true); }, 500);
        setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 300);
        return r;
    };

    /* ===== افزودن دکمه‌ها به پنل ===== */
    var _origRender = window.renderAll;
    window.renderAll = function () {
        var r = _origRender.apply(this, arguments);
        var actionBox = document.getElementById('actionBox');
        if (!actionBox || !window.game || game.gameOver) return r;

        // دکمه Save
        if (!document.getElementById('p10-save-btn')) {
            var saveBtn = document.createElement('button');
            saveBtn.id = 'p10-save-btn';
            saveBtn.className = 'btn';
            saveBtn.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)';
            saveBtn.style.marginTop = '6px';
            saveBtn.innerHTML = '💾 ذخیره بازی';
            saveBtn.onclick = function () { p10SaveGame(false); };
            actionBox.appendChild(saveBtn);
        }

        // دکمه منو
        if (!document.getElementById('p10-menu-btn')) {
            var menuBtn = document.createElement('button');
            menuBtn.id = 'p10-menu-btn';
            menuBtn.className = 'btn';
            menuBtn.style.background = 'linear-gradient(135deg, #7f8c8d, #5d6d7e)';
            menuBtn.style.marginTop = '6px';
            menuBtn.innerHTML = '🏠 منوی اصلی';
            menuBtn.onclick = function () {
                p10SaveGame(true);
                var contBtn = document.getElementById('p10-btn-continue');
                if (contBtn) contBtn.style.display = 'block';
                p10ShowScreen('menu');
            };
            actionBox.appendChild(menuBtn);
        }

        return r;
    };

    /* ===== شروع ===== */
    function initMenu() {
        if (p10HasSave()) {
            var contBtn = document.getElementById('p10-btn-continue');
            if (contBtn) contBtn.style.display = 'block';
        }
        p10ShowScreen('menu');
    }
    setTimeout(initMenu, 100);

    console.log('✅ patch-10: منو + قوانین + برد + Save آماده');
})();