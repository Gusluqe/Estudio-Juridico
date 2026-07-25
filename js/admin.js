/* Estudio Jurídico · panel de administración */
(() => {
    'use strict';

    const DEFAULT_PIN = '2026';

    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    }
    function writeJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* modo privado */ }
    }

    const getSettings = () => readJSON('ej_settings', {});
    const getLeads = () => readJSON('ej_leads', []);
    const setLeads = leads => writeJSON('ej_leads', leads);
    const getEvents = () => readJSON('ej_events', []);

    /* ═══ Puerta de acceso ═══ */
    const gate = document.getElementById('gate');
    const panel = document.getElementById('panel');
    const gateForm = document.getElementById('gate-form');
    const gatePin = document.getElementById('gate-pin');
    const gateError = document.getElementById('gate-error');

    function currentPin() {
        return String(getSettings().adminPin || DEFAULT_PIN);
    }
    function unlock() {
        gate.hidden = true;
        panel.hidden = false;
        renderAll();
    }
    gateForm.addEventListener('submit', e => {
        e.preventDefault();
        if (gatePin.value === currentPin()) {
            sessionStorage.setItem('ej_admin', '1');
            gateError.hidden = true;
            unlock();
        } else {
            gateError.hidden = false;
            gatePin.value = '';
            gatePin.focus();
        }
    });
    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem('ej_admin');
        location.reload();
    });

    /* ═══ Render ═══ */
    const fmtDate = ts => new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const fmtTime = ts => new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    function renderAll() {
        renderKpis();
        renderChannels();
        renderOrientador();
        renderLeads();
        fillConfig();
        fillTexts();
    }

    function renderOrientador() {
        const TIPOS = { situacion: 'Eligió', calculadora: 'Calculadora', whatsapp: 'WhatsApp', formulario: 'Formulario' };
        const items = getEvents()
            .filter(e => e.type === 'situacion' || e.type === 'calculadora' || e.type === 'formulario' ||
                (e.type === 'whatsapp' && /situaci|calculadora|formulario/.test(String(e.source))))
            .sort((a, b) => b.at - a.at)
            .slice(0, 20);
        document.getElementById('orientador-empty').hidden = items.length > 0;
        document.getElementById('orientador-log').innerHTML = items.map(e => {
            const f = new Date(e.at);
            const fecha = f.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' +
                f.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            return `<li><span class="ol-fecha">${fecha}</span><span class="ol-tipo">${TIPOS[e.type] || e.type}</span><span>${esc(e.source)}</span></li>`;
        }).join('');
    }

    function renderKpis() {
        const leads = getLeads();
        const events = getEvents();
        document.getElementById('kpi-leads').textContent = leads.length;
        document.getElementById('kpi-nuevos').textContent = leads.filter(l => l.status === 'nuevo').length;
        document.getElementById('kpi-wa').textContent = events.filter(e => e.type === 'whatsapp').length;
    }

    function renderChannels() {
        const events = getEvents();
        const count = type => events.filter(e => e.type === type).length;
        const situaciones = events.filter(e => e.type === 'situacion');
        const masElegida = situaciones.length
            ? Object.entries(situaciones.reduce((m, e) => (m[e.source] = (m[e.source] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1])[0][0]
            : null;
        const stats = [
            { name: 'WhatsApp', value: count('whatsapp'), hint: 'clicks en botones de chat' },
            { name: 'Formulario', value: count('formulario'), hint: 'datos dejados en la página' },
            { name: 'Email', value: count('email'), hint: 'clicks en el mail de contacto' },
            { name: 'Instagram', value: count('instagram'), hint: 'clicks al perfil' },
            { name: 'Orientador', value: situaciones.length, hint: masElegida ? `situación más elegida: ${masElegida}` : 'usos de "Su situación"' }
        ];
        document.getElementById('channel-stats').innerHTML = stats.map(s => `
            <div class="channel-stat">
                <span class="cs-name">${s.name}</span>
                <span class="cs-value">${s.value}</span>
                <span class="cs-hint">${s.hint}</span>
            </div>`).join('');
    }

    /* ═══ Tabla de leads ═══ */
    const rowsEl = document.getElementById('lead-rows');
    const emptyEl = document.getElementById('lead-empty');
    const searchEl = document.getElementById('lead-search');
    const filterEl = document.getElementById('lead-filter');

    const ICONS = {
        wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.05 2a9.9 9.9 0 00-8.4 15.1L2.1 22l5-1.5A9.9 9.9 0 1012.05 2zm5.7 14.1c-.24.68-1.4 1.3-1.96 1.38-.5.08-1.14.11-1.84-.11a16.8 16.8 0 01-1.66-.61c-2.92-1.26-4.83-4.2-4.97-4.4-.15-.19-1.19-1.58-1.19-3.01 0-1.44.75-2.14 1.02-2.43.27-.3.58-.37.78-.37h.56c.18.01.42-.07.66.5.24.58.82 2.01.9 2.16.07.14.12.31.02.5-.1.2-.15.32-.29.49-.15.17-.31.38-.44.51-.15.15-.3.3-.13.6.17.29.76 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.45.29.14.46.12.63-.08.17-.19.73-.85.92-1.14.2-.3.39-.24.66-.15.27.1 1.7.8 2 .95.29.14.48.22.55.34.07.12.07.7-.18 1.38z"/></svg>',
        mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
        del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 7l-.87 12.14A2 2 0 0116.14 21H7.86a2 2 0 01-1.99-1.86L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h12"/></svg>'
    };

    function esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function visibleLeads() {
        const q = searchEl.value.trim().toLowerCase();
        const st = filterEl.value;
        return getLeads()
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .filter(l => !st || l.status === st)
            .filter(l => !q || [l.name, l.phone, l.email, l.area].some(v => String(v ?? '').toLowerCase().includes(q)));
    }

    function renderLeads() {
        const leads = visibleLeads();
        emptyEl.hidden = leads.length > 0;
        rowsEl.innerHTML = leads.map(l => {
            const phoneDigits = String(l.phone ?? '').replace(/\D/g, '');
            const waNumber = phoneDigits.length >= 8 ? (phoneDigits.startsWith('54') ? phoneDigits : '54' + phoneDigits) : '';
            const waMsg = encodeURIComponent(`Hola ${l.name.split(/\s+/)[0]}, le escribimos del Estudio Jurídico por su consulta${l.area ? ` sobre ${l.area}` : ''}.`);
            return `<tr data-id="${esc(l.id)}">
                <td class="td-date">${fmtDate(l.createdAt)}<br>${fmtTime(l.createdAt)}</td>
                <td class="td-name"><strong>${esc(l.name)}</strong>${l.notes ? `<small>${esc(l.notes)}</small>` : ''}<small>vía ${esc(l.channel)}</small></td>
                <td class="td-contact">${esc(l.phone || '')}${l.email ? `<small>${esc(l.email)}</small>` : ''}</td>
                <td>${esc(l.area || '')}</td>
                <td>
                    <select class="status-select st-${esc(l.status)}" data-action="status" aria-label="Estado del lead">
                        <option value="nuevo" ${l.status === 'nuevo' ? 'selected' : ''}>Nuevo</option>
                        <option value="contactado" ${l.status === 'contactado' ? 'selected' : ''}>Contactado</option>
                        <option value="cerrado" ${l.status === 'cerrado' ? 'selected' : ''}>Cerrado</option>
                    </select>
                </td>
                <td>
                    <div class="row-actions">
                        ${waNumber ? `<a class="act-wa" href="https://wa.me/${waNumber}?text=${waMsg}" target="_blank" rel="noopener" title="Escribir por WhatsApp">${ICONS.wa}</a>` : ''}
                        ${l.email ? `<a class="act-mail" href="mailto:${esc(l.email)}" title="Escribir por email">${ICONS.mail}</a>` : ''}
                        <button class="act-del" data-action="delete" title="Eliminar lead">${ICONS.del}</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    searchEl.addEventListener('input', renderLeads);
    filterEl.addEventListener('change', renderLeads);

    rowsEl.addEventListener('change', e => {
        const sel = e.target.closest('[data-action="status"]');
        if (!sel) return;
        const id = sel.closest('tr').dataset.id;
        const leads = getLeads();
        const lead = leads.find(l => l.id === id);
        if (!lead) return;
        lead.status = sel.value;
        setLeads(leads);
        renderKpis();
        renderLeads();
    });

    rowsEl.addEventListener('click', e => {
        const btn = e.target.closest('[data-action="delete"]');
        if (!btn) return;
        const id = btn.closest('tr').dataset.id;
        const leads = getLeads();
        const lead = leads.find(l => l.id === id);
        if (!lead) return;
        if (!confirm(`¿Eliminar el lead de ${lead.name}?`)) return;
        setLeads(leads.filter(l => l.id !== id));
        renderKpis();
        renderChannels();
        renderLeads();
    });

    /* ═══ Alta manual ═══ */
    const leadForm = document.getElementById('lead-form');
    document.getElementById('btn-add').addEventListener('click', () => {
        leadForm.hidden = !leadForm.hidden;
        if (!leadForm.hidden) leadForm.querySelector('input[name="name"]').focus();
    });
    document.getElementById('btn-add-cancel').addEventListener('click', () => {
        leadForm.reset();
        leadForm.hidden = true;
    });
    leadForm.addEventListener('submit', e => {
        e.preventDefault();
        const data = new FormData(leadForm);
        const name = String(data.get('name') || '').trim();
        if (!name) return;
        const now = Date.now();
        const leads = getLeads();
        leads.push({
            id: `L${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
            name,
            phone: String(data.get('phone') || '').trim(),
            email: String(data.get('email') || '').trim(),
            area: String(data.get('area') || '').trim(),
            channel: String(data.get('channel') || 'otro'),
            notes: String(data.get('notes') || '').trim(),
            status: 'nuevo',
            createdAt: now
        });
        setLeads(leads);
        leadForm.reset();
        leadForm.hidden = true;
        renderAll();
    });

    /* ═══ Export CSV ═══ */
    document.getElementById('btn-export').addEventListener('click', () => {
        const leads = getLeads().slice().sort((a, b) => b.createdAt - a.createdAt);
        if (!leads.length) { alert('No hay leads para exportar.'); return; }
        const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows = [
            ['Fecha', 'Nombre', 'Telefono', 'Email', 'Area', 'Canal', 'Estado', 'Notas'],
            ...leads.map(l => [
                new Date(l.createdAt).toLocaleString('es-AR'),
                l.name, l.phone, l.email, l.area, l.channel,
                l.status, l.notes
            ])
        ];
        const csv = '﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-estudio-juridico-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });

    /* ═══ Configuración ═══ */
    const configForm = document.getElementById('config-form');
    const configSaved = document.getElementById('config-saved');

    function fillConfig() {
        const s = getSettings();
        configForm.phone.value = s.phone || '';
        configForm.email.value = s.email || '';
        configForm.instagram.value = s.instagram || '';
        configForm.adminPin.value = s.adminPin || '';
        configForm.theme.value = s.theme || '';
        applyTheme(s.theme);
    }

    function applyTheme(theme) {
        if (theme) document.documentElement.dataset.theme = theme;
        else delete document.documentElement.dataset.theme;
    }

    configForm.addEventListener('submit', e => {
        e.preventDefault();
        const s = getSettings();
        const phone = configForm.phone.value.replace(/\D/g, '');
        const email = configForm.email.value.trim();
        const instagram = configForm.instagram.value.trim();
        const adminPin = configForm.adminPin.value.trim();
        const theme = configForm.theme.value;
        if (phone) s.phone = phone; else delete s.phone;
        if (email) s.email = email; else delete s.email;
        if (instagram) s.instagram = instagram; else delete s.instagram;
        if (adminPin) s.adminPin = adminPin; else delete s.adminPin;
        if (theme) s.theme = theme; else delete s.theme;
        writeJSON('ej_settings', s);
        applyTheme(theme);
        configSaved.hidden = false;
        setTimeout(() => { configSaved.hidden = true; }, 2200);
    });

    /* ═══ Textos del sitio ═══ */
    const textsForm = document.getElementById('texts-form');
    const textsSaved = document.getElementById('texts-saved');
    const TEXT_KEYS = ['tituloL1', 'tituloL2', 'materia', 'destacado', 'estudio', 'pie1', 'pie2'];

    function fillTexts() {
        const t = getSettings().texts || {};
        TEXT_KEYS.forEach(k => { if (textsForm[k]) textsForm[k].value = t[k] || ''; });
    }

    textsForm.addEventListener('submit', e => {
        e.preventDefault();
        const s = getSettings();
        const t = {};
        TEXT_KEYS.forEach(k => {
            const v = String(textsForm[k].value || '').trim();
            if (v) t[k] = v;
        });
        if (Object.keys(t).length) s.texts = t; else delete s.texts;
        writeJSON('ej_settings', s);
        textsSaved.hidden = false;
        setTimeout(() => { textsSaved.hidden = true; }, 2200);
    });

    document.getElementById('btn-texts-reset').addEventListener('click', () => {
        const s = getSettings();
        delete s.texts;
        writeJSON('ej_settings', s);
        fillTexts();
        textsSaved.hidden = false;
        setTimeout(() => { textsSaved.hidden = true; }, 2200);
    });

    /* ═══ Arranque ═══ */
    if (sessionStorage.getItem('ej_admin') === '1') {
        unlock();
    } else {
        gatePin.focus();
    }
})();
