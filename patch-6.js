/* ========== patch-6.js — بازطراحی بصری کامل ========== */
(function () {
    console.log('🎨 patch-6: بازطراحی بصری...');

    /* فونت وزیرمتن — اگر در دسترس نبود، خودکار Tahoma */
    var fontLink = document.createElement('link');
    fontLink.href = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    var style = document.createElement('style');
    style.id = 'patch-6-styles';
    style.textContent = `

/* ============ پایه ============ */
html, body {
    font-family: 'Vazirmatn', 'IRANSans', Tahoma, 'Segoe UI', sans-serif !important;
    background: #0a0f1a !important;
}

/* ============ پنل ============ */
#panel {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #0f172a 100%) !important;
    border-left: 3px solid #d4af37 !important;
    box-shadow: -8px 0 32px rgba(0,0,0,0.6) !important;
    padding: 20px 18px !important;
    width: 400px !important;
    min-width: 400px !important;
}

/* عنوان اصلی */
#panel > h3:first-child {
    background: linear-gradient(135deg, #d4af37 0%, #f9d976 50%, #d4af37 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    font-size: 26px !important;
    text-align: center;
    padding-bottom: 16px !important;
    margin: 0 0 20px 0 !important;
    border-bottom: 1px solid rgba(212, 175, 55, 0.35) !important;
    letter-spacing: 2px;
    font-weight: 900 !important;
}

#panel h3:not(:first-child) {
    color: #f9d976 !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    letter-spacing: 1.5px;
    margin: 16px 0 10px !important;
    padding-bottom: 6px !important;
    border-bottom: 1px dashed rgba(212, 175, 55, 0.3) !important;
    text-transform: uppercase;
}

/* ============ بخش‌ها ============ */
.section {
    background: rgba(255, 255, 255, 0.035) !important;
    border: 1px solid rgba(212, 175, 55, 0.18) !important;
    border-radius: 12px !important;
    padding: 14px 16px !important;
    margin-bottom: 14px !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.05);
    backdrop-filter: blur(4px);
}

/* ============ دکمه‌ها ============ */
.btn {
    background: linear-gradient(135deg, #3498db 0%, #2471a3 100%) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: 9px !important;
    padding: 11px 14px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    letter-spacing: 0.4px;
    font-family: inherit !important;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    color: #fff !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
    filter: brightness(1.15);
}

.btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.btn.danger { background: linear-gradient(135deg, #e74c3c 0%, #a93226 100%) !important; }
.btn.success { background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%) !important; }
.btn.warning { background: linear-gradient(135deg, #e67e22 0%, #a85410 100%) !important; }

.btn:disabled {
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%) !important;
    opacity: 0.55 !important;
    box-shadow: none !important;
    filter: grayscale(0.6);
    cursor: not-allowed !important;
    transform: none !important;
}

/* ============ setup ============ */
#setup label {
    display: block !important;
    color: #d4af37 !important;
    font-weight: 700 !important;
    font-size: 14px !important;
    margin-bottom: 10px !important;
    letter-spacing: 0.5px;
}

select {
    width: 100% !important;
    padding: 11px 14px !important;
    background: rgba(15, 23, 42, 0.9) !important;
    border: 1px solid rgba(212, 175, 55, 0.35) !important;
    border-radius: 8px !important;
    color: #e2e8f0 !important;
    font-family: inherit !important;
    font-size: 13px !important;
    margin: 0 0 10px 0 !important;
    cursor: pointer;
    transition: border-color 0.2s;
}

select:focus {
    outline: none;
    border-color: #d4af37 !important;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
}

/* ============ current player ============ */
#currentPlayerBox {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(212, 175, 55, 0.02)) !important;
    border-color: rgba(212, 175, 55, 0.4) !important;
}

#currentPlayerBox > b:first-child {
    display: block !important;
    font-size: 20px !important;
    padding-bottom: 10px !important;
    margin-bottom: 8px !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
    text-shadow: 0 0 16px currentColor, 0 1px 3px rgba(0,0,0,0.6) !important;
    letter-spacing: 0.5px;
}

/* ============ info lines ============ */
.info-line {
    padding: 5px 0 !important;
    font-size: 12.5px !important;
    color: #cbd5e0 !important;
    line-height: 1.7 !important;
    border-bottom: 1px dotted rgba(255, 255, 255, 0.05);
}

.info-line:last-child { border-bottom: none; }
.info-line b { color: #f9d976 !important; }

/* ============ player tags ============ */
.player-tag {
    width: 16px !important;
    height: 16px !important;
    border: 2px solid rgba(255, 255, 255, 0.35) !important;
    box-shadow: 0 0 10px currentColor;
    border-radius: 4px !important;
    margin-left: 8px !important;
}

/* ============ لاگ ============ */
#log {
    background: #060b14 !important;
    border: 1px solid rgba(212, 175, 55, 0.25) !important;
    border-radius: 10px !important;
    height: 240px !important;
    padding: 14px !important;
    font-family: 'Vazirmatn', Tahoma, monospace !important;
    font-size: 12px !important;
    line-height: 2 !important;
    color: #a0aec0 !important;
    box-shadow: inset 0 3px 12px rgba(0, 0, 0, 0.7) !important;
    margin-top: 14px !important;
}

#log::-webkit-scrollbar { width: 8px; }
#log::-webkit-scrollbar-track { background: #060b14; border-radius: 4px; }
#log::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #d4af37, #8b6f1f);
    border-radius: 4px;
    border: 1px solid #060b14;
}
#log::-webkit-scrollbar-thumb:hover { background: #f9d976; }

/* ============ نقشه ============ */
#map { background: #0a0f1a !important; }
#map::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.4);
    z-index: 400;
}
.leaflet-tile-pane { filter: saturate(0.9) contrast(1.02); }

/* ============ tooltip ============ */
.leaflet-tooltip {
    background: linear-gradient(135deg, #1a1a2e, #16213e) !important;
    color: #f9d976 !important;
    border: 1.5px solid #d4af37 !important;
    border-radius: 8px !important;
    padding: 7px 14px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6) !important;
    font-family: inherit !important;
    letter-spacing: 0.3px;
}
.leaflet-tooltip-top:before { border-top-color: #d4af37 !important; }
.leaflet-tooltip-bottom:before { border-bottom-color: #d4af37 !important; }
.leaflet-tooltip-left:before { border-left-color: #d4af37 !important; }
.leaflet-tooltip-right:before { border-right-color: #d4af37 !important; }

/* ============ شمارنده نیرو ============ */
.troop-count {
    width: 34px !important;
    height: 34px !important;
    border-width: 3px !important;
    font-size: 14px !important;
    font-weight: 900 !important;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0,0,0,0.5) !important;
    background: linear-gradient(135deg, #ffffff, #e2e8f0) !important;
    color: #0a0f1a !important;
    font-family: inherit !important;
}

/* ============ modal ============ */
.modal-box {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
    border: 2px solid #d4af37 !important;
    box-shadow: 0 24px 72px rgba(0, 0, 0, 0.85), 0 0 60px rgba(212, 175, 55, 0.15) !important;
    border-radius: 14px !important;
}

.modal-box h2 {
    background: linear-gradient(135deg, #d4af37, #f9d976) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    color: transparent !important;
    font-size: 22px !important;
    letter-spacing: 1px !important;
    padding-bottom: 12px !important;
    border-bottom: 1px solid rgba(212, 175, 55, 0.3) !important;
    margin-bottom: 16px !important;
}

.modal-box p {
    color: #cbd5e0 !important;
    font-size: 14px !important;
    line-height: 1.9 !important;
}

.modal-btn-yes, .modal-btn-no, .modal-btn-close {
    border-radius: 9px !important;
    font-weight: 700 !important;
    letter-spacing: 0.5px !important;
    transition: all 0.18s !important;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35) !important;
}

.modal-btn-yes { background: linear-gradient(135deg, #27ae60, #1e8449) !important; }
.modal-btn-no { background: linear-gradient(135deg, #e74c3c, #a93226) !important; }
.modal-btn-close { background: linear-gradient(135deg, #7f8c8d, #5d6d7e) !important; }

.modal-btn-yes:hover, .modal-btn-no:hover, .modal-btn-close:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5) !important;
    filter: brightness(1.15) !important;
}

/* ============ جدول مناطق ============ */
.regions-table { border-radius: 8px; overflow: hidden; }

.regions-table th {
    background: linear-gradient(135deg, #2c3e50, #1a252f) !important;
    color: #d4af37 !important;
    padding: 10px 8px !important;
    font-weight: 700 !important;
    letter-spacing: 0.5px !important;
    border-bottom: 2px solid rgba(212, 175, 55, 0.4) !important;
}

.regions-table td {
    padding: 10px 8px !important;
    color: #cbd5e0;
    border-bottom: 1px solid rgba(52, 73, 94, 0.5) !important;
}

.regions-table tr:hover td {
    background: rgba(212, 175, 55, 0.06) !important;
}

.regions-table tbody tr:last-child td { border-bottom: none; }

/* ============ دکمه راهنمای مناطق ============ */
#regions-guide-btn {
    background: linear-gradient(135deg, #16a085, #0e6655) !important;
    border: 1px solid rgba(26, 188, 156, 0.4) !important;
}

/* ============ کارت‌های تاکتیکی ============ */
#actionBox > div[style*="8e44ad"] {
    background: linear-gradient(135deg, rgba(155, 89, 182, 0.35), rgba(142, 68, 173, 0.2)) !important;
    border: 1px solid rgba(155, 89, 182, 0.5) !important;
    border-radius: 10px !important;
    padding: 12px !important;
    box-shadow: 0 3px 12px rgba(142, 68, 173, 0.25) !important;
    backdrop-filter: blur(4px);
}

.btn[style*="9b59b6"] {
    background: linear-gradient(135deg, #9b59b6 0%, #71368a 100%) !important;
    border: 1px solid rgba(214, 188, 250, 0.3) !important;
}
.btn[style*="9b59b6"]:hover:not(:disabled) {
    background: linear-gradient(135deg, #af7ac5 0%, #8e44ad 100%) !important;
}

/* ============ کنترل‌های نقشه ============ */
.leaflet-control-zoom a {
    background: linear-gradient(135deg, #1a1a2e, #16213e) !important;
    color: #d4af37 !important;
    border: 1px solid rgba(212, 175, 55, 0.4) !important;
    font-weight: bold !important;
    transition: all 0.2s;
}
.leaflet-control-zoom a:hover {
    background: linear-gradient(135deg, #16213e, #0f172a) !important;
    color: #f9d976 !important;
    transform: scale(1.05);
}
.leaflet-control-attribution {
    background: rgba(10, 15, 26, 0.9) !important;
    color: #8892a0 !important;
    font-size: 10px !important;
    border-radius: 4px;
    padding: 2px 6px !important;
}
.leaflet-control-attribution a { color: #d4af37 !important; }

    `;
    document.head.appendChild(style);

    console.log('✅ patch-6: طراحی جدید اعمال شد');
})();