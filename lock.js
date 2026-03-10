/* Site lock — password verified via Supabase backend. Password is never stored in this file. */
(function () {
    'use strict';

    var SUPA_URL = 'https://vgnxpefbzvralyoowrvs.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbnhwZWZienZyYWx5b293cnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDI4NjAsImV4cCI6MjA4NjcxODg2MH0.IqBB7hVudKyuJhsCwZ3XEUeJDTtWCX-4VPPxyDUtdWI';
    var TOKEN_KEY  = '_sl_tok';
    var WIPE_MS    = 5000;

    /* ── Hide entire page immediately to prevent content flash ── */
    var hideStyle = document.createElement('style');
    hideStyle.id  = '_sl_hide';
    hideStyle.textContent = 'html{visibility:hidden!important}';
    document.head.appendChild(hideStyle);

    /* ── Suppress scrollbar while locked ── */
    var scrollStyle = document.createElement('style');
    scrollStyle.id  = '_sl_noscroll';
    scrollStyle.textContent = 'html,body{overflow:hidden!important}';
    document.head.appendChild(scrollStyle);

    var wipeTimer = null;
    var overlay   = null;
    var authed    = false;

    /* ── Helpers ── */

    function reveal() {
        var s = document.getElementById('_sl_hide');
        if (s && s.parentNode) s.parentNode.removeChild(s);
    }

    function nuke() {
        if (authed) return;
        document.documentElement.innerHTML =
            '<html><body style="margin:0;background:#fff;display:flex;align-items:center;' +
            'justify-content:center;height:100vh;font-family:system-ui,sans-serif;overflow:auto">' +
            '<div style="color:#333;text-align:center">' +
            '<div style="font-size:17px;margin-bottom:8px;color:#111">Access denied.</div>' +
            '<a href="" style="font-size:13px;color:#555">Reload to try again</a>' +
            '</div></body></html>';
    }

    function restoreScroll() {
        var ns = document.getElementById('_sl_noscroll');
        if (ns && ns.parentNode) ns.parentNode.removeChild(ns);
    }

    function dismiss() {
        authed = true;
        if (wipeTimer) { clearTimeout(wipeTimer); wipeTimer = null; }
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        restoreScroll();
        reveal();
    }

    function setError(msg) {
        var e = overlay && overlay.querySelector('._sl_err');
        if (e) e.textContent = msg;
    }

    function setLoading(on) {
        var btn = overlay && overlay.querySelector('._sl_btn');
        var inp = overlay && overlay.querySelector('._sl_inp');
        if (btn) { btn.disabled = on; btn.textContent = on ? '...' : 'Unlock'; }
        if (inp) inp.disabled = on;
    }

    /* ── Supabase RPC call ── */

    function rpc(name, params) {
        return fetch(SUPA_URL + '/rest/v1/rpc/' + name, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPA_KEY,
                'Authorization': 'Bearer ' + SUPA_KEY
            },
            body: JSON.stringify(params)
        }).then(function (r) { return r.json(); });
    }

    /* ── Auth attempt — password sent to backend only ── */

    function tryUnlock(pw) {
        setLoading(true);
        rpc('site_auth', { p_password: pw })
            .then(function (tok) {
                console.log('[lock] site_auth response:', JSON.stringify(tok), typeof tok);
                if (tok && typeof tok === 'string' && tok.length > 10) {
                    sessionStorage.setItem(TOKEN_KEY, tok);
                    dismiss();
                } else {
                    setLoading(false);
                    setError('Incorrect password.');
                }
            })
            .catch(function () {
                setLoading(false);
                setError('Connection error — try again.');
            });
    }

    /* ── Build overlay UI ── */

    function buildOverlay() {
        var s = document.createElement('style');
        s.textContent =
            '#_sl_ov{position:fixed;inset:0;background:#fff;z-index:2147483647;' +
            'display:flex;align-items:center;justify-content:center;' +
            'font-family:system-ui,-apple-system,sans-serif}' +
            '#_sl_box{background:#fff;border:1px solid #d0d0d0;padding:44px 40px;' +
            'width:300px;text-align:center}' +
            '#_sl_h{color:#111;font-size:14px;font-weight:500;letter-spacing:.3px;' +
            'margin-bottom:24px;text-transform:uppercase}' +
            '._sl_inp{display:block;width:100%;box-sizing:border-box;background:#fff;' +
            'border:1px solid #c0c0c0;color:#000;padding:10px 12px;font-size:14px;' +
            'margin-bottom:10px;outline:none;font-family:inherit}' +
            '._sl_inp:focus{border-color:#555}' +
            '._sl_btn{display:block;width:100%;background:#000;color:#fff;border:none;' +
            'padding:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}' +
            '._sl_btn:hover:not(:disabled){background:#222}' +
            '._sl_btn:disabled{opacity:.35;cursor:not-allowed}' +
            '._sl_err{color:#b03030;font-size:12px;margin-top:10px;min-height:16px}' +
            '#_sl_cd{color:#aaa;font-size:11px;margin-top:14px}';
        document.head.appendChild(s);

        var el = document.createElement('div');
        el.id = '_sl_ov';
        el.innerHTML =
            '<div id="_sl_box">' +
            '<div id="_sl_h">Password Required</div>' +
            '<input class="_sl_inp" type="password" placeholder="Enter password" autocomplete="off" />' +
            '<button class="_sl_btn">Unlock</button>' +
            '<div class="_sl_err"></div>' +
            '<div id="_sl_cd"></div>' +
            '</div>';
        return el;
    }

    /* ── 5-second countdown, then wipe DOM ── */

    function startCountdown() {
        var cd  = document.getElementById('_sl_cd');
        var end = Date.now() + WIPE_MS;

        (function tick() {
            if (authed) return;
            var left = Math.ceil((end - Date.now()) / 1000);
            if (cd) cd.textContent = left > 0
                ? 'Content will be removed in ' + left + 's'
                : '';
            if (left > 0) setTimeout(tick, 500);
        })();

        wipeTimer = setTimeout(nuke, WIPE_MS);
    }

    /* ── Show the overlay on top of the (hidden) page ── */

    function showOverlay() {
        overlay = buildOverlay();
        document.body.appendChild(overlay);
        reveal(); /* page is now visible behind the overlay */
        startCountdown();

        var inp = overlay.querySelector('._sl_inp');
        var btn = overlay.querySelector('._sl_btn');

        btn.addEventListener('click', function () {
            if (inp.value) tryUnlock(inp.value);
        });
        inp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && inp.value) tryUnlock(inp.value);
        });
        inp.focus();
    }

    /* ── Entry point ── */

    function main() {
        /* Already have a session token from a previous unlock this browser session */
        if (sessionStorage.getItem(TOKEN_KEY)) {
            authed = true;
            reveal();
            return;
        }

        /* No session — mount overlay as soon as body exists */
        if (document.body) {
            showOverlay();
        } else {
            document.addEventListener('DOMContentLoaded', showOverlay);
        }
    }

    main();
})();
