/* ========== patch-9.js — چیدمان ریسپانسیو موبایل ========== */
(function () {
    console.log('📱 patch-9: چیدمان موبایل...');

    var style = document.createElement('style');
    style.textContent = `

        /* ============ موبایل (≤ 768px) — چیدمان عمودی ============ */
        @media (max-width: 768px) {
            html, body {
                display: flex !important;
                flex-direction: column !important;
                height: 100vh !important;
                height: 100dvh !important;
                width: 100vw !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            #map {
                flex: 0 0 55vh !important;
                flex: 0 0 55dvh !important;
                width: 100% !important;
                min-height: 0 !important;
                order: 1;
                position: relative !important;
                border-bottom: 3px solid #d4af37;
            }

            #panel {
                flex: 1 1 auto !important;
                width: 100% !important;
                min-width: 0 !important;
                max-width: 100% !important;
                height: auto !important;
                order: 2;
                border-left: none !important;
                border-top: none !important;
                box-shadow: 0 -8px 32px rgba(0,0,0,0.6) !important;
                padding: 10px 12px !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                -webkit-overflow-scrolling: touch;
                border-radius: 16px 16px 0 0;
                margin-top: -12px;
                z-index: 500;
            }

            /* تیتر فشرده‌تر */
            #panel > h3:first-child {
                font-size: 16px !important;
                padding-bottom: 6px !important;
                margin: 0 0 8px 0 !important;
                letter-spacing: 1px !important;
            }
            #panel h3:not(:first-child) {
                font-size: 11px !important;
                margin: 8px 0 5px !important;
                padding-bottom: 3px !important;
            }

            /* دکمه‌های بزرگ‌تر برای انگشت */
            .btn {
                padding: 12px 12px !important;
                font-size: 13px !important;
                margin: 4px 0 !important;
                min-height: 42px !important;
                line-height: 1.3 !important;
                border-radius: 8px !important;
            }

            .section {
                padding: 8px 10px !important;
                margin-bottom: 8px !important;
                border-radius: 8px !important;
            }

            .info-line {
                font-size: 11.5px !important;
                padding: 2px 0 !important;
                line-height: 1.6 !important;
            }

            #currentPlayerBox > b:first-child {
                font-size: 15px !important;
                padding-bottom: 4px !important;
                margin-bottom: 3px !important;
            }

            #log {
                height: 100px !important;
                font-size: 10.5px !important;
                padding: 8px !important;
                margin-top: 6px !important;
                line-height: 1.55 !important;
            }

            /* مارکرها کوچک‌تر که روی هم نیفتند */
            .troop-count {
                width: 32px !important;
                height: 32px !important;
                border-width: 2.5px !important;
            }
            .troop-count .num-line { font-size: 11px !important; }
            .troop-count .equip-line { font-size: 8px !important; letter-spacing: -1.5px !important; }

            /* مودال تمام‌عرض */
            .modal-box {
                max-width: 94vw !important;
                max-height: 88vh !important;
                padding: 16px !important;
                margin: 8px;
            }
            .modal-box h2 {
                font-size: 16px !important;
                padding-bottom: 6px !important;
                margin-bottom: 10px !important;
            }
            .modal-box p { font-size: 12.5px !important; }

            /* فروشگاه تک‌ستونه */
            .shop-item { padding: 10px !important; }
            .modal-box [style*="grid-template-columns:1fr 1fr"] {
                grid-template-columns: 1fr !important;
                gap: 8px !important;
            }

            /* جدول مناطق */
            .regions-table { font-size: 10.5px !important; }
            .regions-table th, .regions-table td { padding: 5px 3px !important; }

            /* کنترل زوم Leaflet بزرگ‌تر */
            .leaflet-control-zoom a {
                width: 36px !important;
                height: 36px !important;
                line-height: 36px !important;
                font-size: 20px !important;
            }
        }

        /* ============ خیلی کوچک (≤ 400px) ============ */
        @media (max-width: 400px) {
            #map {
                flex: 0 0 50vh !important;
                flex: 0 0 50dvh !important;
            }
            #panel > h3:first-child { font-size: 14px !important; }
            .btn { font-size: 12px !important; }
        }

        /* ============ موبایل افقی (Landscape) ============ */
        @media (max-width: 900px) and (orientation: landscape) {
            html, body {
                flex-direction: row !important;
            }
            #map {
                flex: 1 1 auto !important;
                height: 100vh !important;
                height: 100dvh !important;
                border-bottom: none !important;
                border-left: 3px solid #d4af37;
            }
            #panel {
                flex: 0 0 300px !important;
                width: 300px !important;
                min-width: 300px !important;
                max-width: 300px !important;
                height: 100vh !important;
                height: 100dvh !important;
                border-radius: 0 !important;
                margin-top: 0 !important;
                overflow-y: auto !important;
            }
        }

        /* ============ دسکتاپ — نقشه نباید زیر پنل بره ============ */
        @media (min-width: 769px) {
            #panel {
                position: relative;
                z-index: 10;
            }
            #map {
                position: relative;
                z-index: 1;
            }
        }
    `;
    document.head.appendChild(style);

    /* ============ اصلاح اندازه Leaflet بعد از تغییر چیدمان ============ */
    function fixLeafletSize() {
        if (typeof game !== 'undefined' && game && game.map) {
            setTimeout(function () {
                try { game.map.invalidateSize(); } catch (e) {}
            }, 150);
        }
    }

    window.addEventListener('resize', fixLeafletSize);
    window.addEventListener('orientationchange', function () {
        setTimeout(fixLeafletSize, 400);
    });

    var _origStart = window.startGame;
    window.startGame = function () {
        _origStart.apply(this, arguments);
        fixLeafletSize();
    };

    /* ============ بعد از رندر هم چک کن ============ */
    var _origRender = window.renderAll;
    window.renderAll = function () {
        var r = _origRender.apply(this, arguments);
        // اگر پنل بلندتر از فضای موجود بود، نقشه رو دوباره تنظیم کن
        if (window.innerWidth <= 768) {
            fixLeafletSize();
        }
        return r;
    };

    console.log('✅ patch-9: چیدمان موبایل فعال');
})();