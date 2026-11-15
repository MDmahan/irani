/* ========== patch-5.js — تأیید اتحاد/صلح + راهنمای مناطق ========== */
(function () {
    console.log('🔧 patch-5: بارگذاری...');

    /* ---------- CSS ---------- */
    var style = document.createElement('style');
    style.textContent = `
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.75); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            font-family: Tahoma; direction: rtl;
        }
        .modal-box {
            background: #2c3e50; color: #ecf0f1; padding: 25px; border-radius: 12px;
            max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            border: 2px solid #3498db;
        }
        .modal-box h2 { margin: 0 0 15px; color: #f1c40f; font-size: 18px; }
        .modal-box p { line-height: 1.8; font-size: 14px; }
        .modal-box .btn-row { display: flex; gap: 10px; margin-top: 20px; }
        .modal-box .btn-row button {
            flex: 1; padding: 12px; border: none; border-radius: 6px;
            font-family: Tahoma; font-size: 14px; cursor: pointer; font-weight: bold;
        }
        .modal-btn-yes { background: #27ae60; color: white; }
        .modal-btn-yes:hover { background: #229954; }
        .modal-btn-no { background: #e74c3c; color: white; }
        .modal-btn-no:hover { background: #c0392b; }
        .modal-btn-close { background: #7f8c8d; color: white; }
        .modal-btn-close:hover { background: #95a5a6; }
        .regions-table {
            width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;
        }
        .regions-table th, .regions-table td {
            padding: 8px; text-align: right; border-bottom: 1px solid #34495e;
        }
        .regions-table th { background: #34495e; color: #f1c40f; font-size: 12px; }
        .regions-table .province-list { font-size: 11px; color: #bdc3c7; }
        .region-control-badge {
            display: inline-block; padding: 2px 8px; border-radius: 3px;
            font-size: 11px; color: white; font-weight: bold;
        }
    `;
    document.head.appendChild(style);

    /* ---------- مودال عمومی ---------- */
    function showModal(html) {
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = '<div class="modal-box">' + html + '</div>';
        document.body.appendChild(overlay);
        return overlay;
    }

    function closeModal(overlay) {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    /* ============================================================
       بخش ۱: بازنویسی doAction — اتحاد/صلح نیاز به تأیید
       ============================================================ */
    window.doAction = function (targetId, action) {
        if (!game) return;
        var me = game.players[game.currentPlayerIndex];
        var target = game.players[targetId];
        var key = relKey(me.id, targetId);

        // جنگ: یک‌طرفه، بدون تأیید
        if (action === 'war') {
            game.relations[key] = 'war';
            log('📢 ' + me.name + ' به ' + target.name + ' اعلام جنگ کرد!');
            game.actionMode = null;
            refreshMap(); renderAll();
            return;
        }

        // شکستن اتحاد: یک‌طرفه
        if (action === 'break') {
            game.relations[key] = 'peace';
            log('💔 ' + me.name + ' اتحاد با ' + target.name + ' را شکست.');
            game.actionMode = null;
            refreshMap(); renderAll();
            return;
        }

        // صلح و اتحاد: نیاز به تأیید بازیکن هدف
        if (action === 'peace' || action === 'alliance') {
            var actionLabel = action === 'peace' ? 'صلح' : 'اتحاد';
            var actionIcon = action === 'peace' ? '🕊️' : '🤝';

            log(actionIcon + ' ' + me.name + ' به ' + target.name + ' پیشنهاد ' + actionLabel + ' داد (در انتظار تأیید)');

            var overlay = showModal(
                '<h2>' + actionIcon + ' درخواست ' + actionLabel + '</h2>' +
                '<p><b style="color:' + me.color + '">' + me.name + '</b> به ' +
                '<b style="color:' + target.color + '">' + target.name + '</b> پیشنهاد ' +
                '<b>' + actionLabel + '</b> می‌دهد.</p>' +
                '<p style="color:#f1c40f;font-size:15px;text-align:center;margin-top:20px;">' +
                '<b style="color:' + target.color + '">' + target.name + '</b>، آیا این پیشنهاد را می‌پذیری؟</p>' +
                '<div class="btn-row">' +
                '<button class="modal-btn-yes" id="modal-yes">✅ قبول</button>' +
                '<button class="modal-btn-no" id="modal-no">❌ رد</button>' +
                '</div>'
            );

            document.getElementById('modal-yes').onclick = function () {
                game.relations[key] = action;
                log('✅ ' + me.name + ' و ' + target.name + ' ' + actionLabel + ' کردند.');
                closeModal(overlay);
                game.actionMode = null;
                refreshMap(); renderAll();
            };

            document.getElementById('modal-no').onclick = function () {
                log('❌ ' + target.name + ' پیشنهاد ' + actionLabel + ' ' + me.name + ' را رد کرد.');
                closeModal(overlay);
                game.actionMode = null;
                refreshMap(); renderAll();
            };

            return;
        }

        game.actionMode = null;
        refreshMap(); renderAll();
    };

    /* ============================================================
       بخش ۲: راهنمای مناطق
       ============================================================ */
    window.showRegionsGuide = function () {
        if (!game || !game.regions) {
            alert('ابتدا بازی را شروع کن.');
            return;
        }

        var html = '<h2>🗺️ راهنمای مناطق ایران</h2>';
        html += '<p style="font-size:12px;color:#bdc3c7;margin-bottom:5px">' +
            'اگر <b>همه استان‌های یک منطقه</b> را کنترل کنی، در شروع هر نوبت پاداش می‌گیری.<br>' +
            'پاداش به‌صورت نیروی اضافی به نیروهای در انتظار توزیع اضافه می‌شود.</p>';
        html += '<table class="regions-table"><thead><tr>' +
            '<th>منطقه</th><th>پاداش</th><th>استان‌ها</th><th>وضعیت</th>' +
            '</tr></thead><tbody>';

        game.regions.forEach(function (region) {
            var total = region.provinces.length;
            var ownerCount = {};
            region.provinces.forEach(function (p) {
                var d = game.provinceData[p];
                if (d) ownerCount[d.ownerId] = (ownerCount[d.ownerId] || 0) + 1;
            });

            var controller = null;
            Object.keys(ownerCount).forEach(function (pid) {
                if (ownerCount[pid] === total) controller = game.players[parseInt(pid)];
            });

            var statusHtml;
            if (controller) {
                statusHtml = '<span class="region-control-badge" style="background:' +
                    controller.color + '">👑 ' + controller.name + '</span>';
            } else {
                var parts = [];
                Object.keys(ownerCount).forEach(function (pid) {
                    var p = game.players[parseInt(pid)];
                    parts.push('<span style="color:' + p.color + ';font-weight:bold">' +
                        ownerCount[pid] + '</span>');
                });
                statusHtml = '<span style="font-size:11px;color:#bdc3c7">' +
                    parts.join(' / ') + '</span>';
            }

            html += '<tr>' +
                '<td><b>' + region.name + '</b><br>' +
                    '<span style="font-size:10px;color:#7f8c8d">' + total + ' استان</span></td>' +
                '<td style="color:#f1c40f;font-weight:bold">+' + region.bonus + '</td>' +
                '<td class="province-list">' + region.provinces.join('، ') + '</td>' +
                '<td>' + statusHtml + '</td>' +
                '</tr>';
        });

        html += '</tbody></table>';
        html += '<div class="btn-row"><button class="modal-btn-close" onclick="closeRegionsGuide()">بستن</button></div>';

        var overlay = showModal(html);
        overlay.id = 'regions-guide-overlay';
        var box = overlay.querySelector('.modal-box');
        box.style.maxWidth = '800px';
        box.style.maxHeight = '85vh';
        box.style.overflow = 'auto';
    };

    window.closeRegionsGuide = function () {
        var el = document.getElementById('regions-guide-overlay');
        if (el) el.parentNode.removeChild(el);
    };

    /* ============================================================
       بخش ۳: تزریق دکمه راهنما در پنل
       ============================================================ */
    var _origRender_p5 = window.renderAll;

    window.renderAll = function () {
        // ایمن‌سازی (همان کار patch-4، برای اطمینان بیشتر)
        if (typeof game !== 'undefined' && game && game.players) {
            game.players.forEach(function (p) {
                if (!p.hand) p.hand = [];
                if (p.pendingTroops === undefined) p.pendingTroops = 0;
                if (p.attackBuff === undefined) p.attackBuff = 0;
                if (p.attackDebuff === undefined) p.attackDebuff = 0;
                if (p.hasShield === undefined) p.hasShield = false;
                if (p.truceActive === undefined) p.truceActive = false;
            });
        }

        var result = _origRender_p5();

        // اضافه کردن دکمه راهنما اگر نیست
        var actionBox = document.getElementById('actionBox');
        if (actionBox && game && game.regions && !game.gameOver &&
            !document.getElementById('regions-guide-btn')) {
            var btn = document.createElement('button');
            btn.id = 'regions-guide-btn';
            btn.className = 'btn';
            btn.style.background = '#16a085';
            btn.style.marginTop = '12px';
            btn.textContent = '🗺️ راهنمای مناطق';
            btn.onclick = window.showRegionsGuide;

            var relationsHeader = actionBox.querySelector('h3');
            if (relationsHeader) {
                actionBox.insertBefore(btn, relationsHeader);
            } else {
                actionBox.appendChild(btn);
            }
        }
        return result;
    };

    console.log('✅ patch-5: تأیید اتحاد/صلح + راهنمای مناطق فعال');
})();