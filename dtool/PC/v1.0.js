// ==UserScript==
// @name         dtool PC
// @namespace    https://github.com/adhad-ffg
// @version      1.0
// @license      MIT license
// @description  Discord token copier for desktop browsers.
// @match        https://discord.com/*
// @match        https://ptb.discord.com/*
// @match        https://canary.discord.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const TOKEN_RE = /(?:mfa\.[\w-]{80,}|[\w-]{24,}\.[\w-]{6}\.[\w-]{27,})/;
  let token = null;

  const capture = (value) => {
    if (!value) return;
    const match = String(value).match(TOKEN_RE);
    if (match) token = match[0];
  };

  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    try {
      const headers = init?.headers || (input instanceof Request ? input.headers : null);
      if (headers instanceof Headers) {
        capture(headers.get('Authorization') || headers.get('authorization'));
      } else if (headers && typeof headers === 'object') {
        capture(headers.Authorization || headers.authorization);
      } else if (typeof headers === 'string') {
        const m = headers.match(/authorization:\s*(.+)/i);
        if (m) capture(m[1]);
      }
    } catch {}
    return originalFetch.apply(this, arguments);
  };

  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
    if (/^authorization$/i.test(header)) capture(value);
    return originalSetRequestHeader.apply(this, arguments);
  };

  const findToken = () => {
    if (token) return token;
    try {
      const raw = localStorage.getItem('token');
      if (raw) {
        const val = raw.replace(/^"|"$/g, '');
        const match = val.match(TOKEN_RE);
        if (match) return match[0];
      }
    } catch {}
    try {
      for (const key of Object.keys(localStorage)) {
        const val = localStorage.getItem(key);
        if (val) {
          const match = val.match(TOKEN_RE);
          if (match) return match[0];
        }
      }
    } catch {}
    return null;
  };

  const inject = () => {
    if (document.getElementById('dtool-token-copy-pc')) return;
    const btn = document.createElement('button');
    btn.id = 'dtool-token-copy-pc';
    btn.textContent = 'Copy Token';
    Object.assign(btn.style, {
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      zIndex: '2147483647',
      background: '#5865F2',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      width: '96px',
      height: '96px',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'gg sans, "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transition: 'background 0.17s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      lineHeight: '1.2',
      padding: '0'
    });
    btn.addEventListener('mouseenter', () => { btn.style.background = '#4752C4'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#5865F2'; });
    btn.addEventListener('click', async () => {
      const t = findToken();
      if (!t) {
        btn.textContent = 'Not found';
        setTimeout(() => { btn.textContent = 'Copy Token'; }, 1500);
        return;
      }
      try {
        await navigator.clipboard.writeText(t);
        btn.textContent = 'Copied';
      } catch {
        btn.textContent = 'Copy failed';
      }
      setTimeout(() => { btn.textContent = 'Copy Token'; }, 1500);
    });
    document.body.appendChild(btn);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();