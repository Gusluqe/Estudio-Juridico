/* Estudio Jurídico · landing */
(() => {
    'use strict';

    /* ── Configuración de contacto (el admin puede sobreescribirla) ── */
    const DEFAULTS = {
        phone: '541125854569',
        email: 'estudio@juridico.com.ar',
        instagram: 'https://instagram.com'
    };
    const settings = { ...DEFAULTS, ...readJSON('ej_settings', {}) };

    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    }
    function writeJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* modo privado */ }
    }

    /* ── Paleta elegida desde el panel admin ── */
    if (settings.theme) document.documentElement.dataset.theme = settings.theme;

    /* ── Aplicar settings a los enlaces del sitio ── */
    document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a => {
        const url = new URL(a.href);
        a.href = `https://wa.me/${settings.phone}${url.search}`;
    });
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
        const url = new URL(a.href);
        a.href = `mailto:${settings.email}${url.search}`;
    });
    document.querySelectorAll('a[data-track-channel="instagram"]').forEach(a => {
        a.href = settings.instagram;
    });

    /* ── Registro de interacciones para el panel admin ── */
    function trackEvent(type, source) {
        const events = readJSON('ej_events', []);
        events.push({ type, source, at: Date.now() });
        writeJSON('ej_events', events.slice(-500));
    }
    document.querySelectorAll('.wa-track').forEach(el => {
        el.addEventListener('click', () => trackEvent('whatsapp', el.dataset.source || 'general'));
    });
    document.querySelectorAll('[data-track-channel]').forEach(el => {
        el.addEventListener('click', () => trackEvent(el.dataset.trackChannel, 'contacto'));
    });

    /* ── Menú móvil ── */
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('nav-toggle');
    navToggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        navToggle.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    }));

    /* ── Reveal on scroll ── */
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        reveals.forEach(el => {
            const siblings = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains('reveal')) : [el];
            el.style.setProperty('--d', `${(siblings.indexOf(el) % 6) * 80}ms`);
            io.observe(el);
        });
    } else {
        reveals.forEach(el => el.classList.add('in'));
    }

    /* ── Count-up de constancias ── */
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length && 'IntersectionObserver' in window) {
        const cio = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                animateCount(entry.target);
                cio.unobserve(entry.target);
            });
        }, { threshold: 0.6 });
        counters.forEach(el => cio.observe(el));
    }
    /* ── Orientador "Su situación" ── */
    const TRIAGE = {
        despido: {
            consulta: 'me despidieron y quiero saber qué me corresponde',
            pasos: [
                'No firme ningún documento ni acuerdo sin que lo revise un abogado.',
                'Guarde telegramas, cartas documento y toda comunicación con la empresa.',
                'No deje pasar tiempo: los plazos para reclamar corren desde el despido.'
            ],
            docs: ['Últimos recibos de sueldo', 'Telegrama o carta documento', 'DNI', 'Constancias de horarios o tareas (si tiene)']
        },
        accidente: {
            consulta: 'tuve un accidente y quiero asesorarme',
            pasos: [
                'Priorice la atención médica y pida siempre constancia escrita de cada atención.',
                'Reúna fotos del lugar, datos del otro vehículo y de testigos si los hay.',
                'Haga la denuncia (policial o ante la ART si fue en el trabajo) cuanto antes.'
            ],
            docs: ['Denuncia policial o de ART', 'Constancias y estudios médicos', 'Fotos del accidente y lesiones', 'Datos del seguro propio y del tercero']
        },
        sucesion: {
            consulta: 'falleció un familiar y necesito iniciar la sucesión',
            pasos: [
                'La sucesión se puede iniciar ya: no hace falta el acuerdo de todos los herederos.',
                'Identifique los bienes: propiedades, vehículos, cuentas bancarias.',
                'Reúna las partidas que acrediten el vínculo familiar.'
            ],
            docs: ['Partida de defunción', 'Partidas de nacimiento o matrimonio (vínculo)', 'DNI de los herederos', 'Títulos de propiedades o vehículos']
        },
        salud: {
            consulta: 'mi obra social o prepaga me niega una cobertura',
            pasos: [
                'Pida la negativa por escrito: es la prueba clave del amparo.',
                'Consiga la orden o pedido médico que indica el tratamiento o medicamento.',
                'El amparo de salud es un trámite rápido: no espere a que se agrave la situación.'
            ],
            docs: ['Pedido u orden médica', 'Negativa de la obra social (o constancia del reclamo)', 'Carnet de afiliado', 'Historia clínica o resumen médico']
        },
        familia: {
            consulta: 'tengo una consulta de divorcio o alimentos',
            pasos: [
                'Los alimentos se deben desde el reclamo: conviene reclamarlos formalmente cuanto antes.',
                'Anote acuerdos y gastos de los chicos: todo sirve como prueba.',
                'Muchos temas de familia pasan primero por mediación: lo acompañamos en esa etapa.'
            ],
            docs: ['Partidas de matrimonio o nacimiento', 'DNI', 'Acuerdos previos (si existen)', 'Comprobantes de gastos e ingresos']
        },
        otra: {
            consulta: 'tengo una consulta legal',
            pasos: [
                'Escríbanos su caso en sus palabras, sin tecnicismos.',
                'Un abogado lo lee y le responde en menos de 24 horas.',
                'La primera consulta no tiene cargo y no lo compromete a nada.'
            ],
            docs: ['DNI', 'Cualquier papel o mensaje relacionado con su consulta']
        }
    };
    const chips = document.querySelectorAll('.chip');
    const triageBox = document.getElementById('triage');
    chips.forEach(chip => chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.toggle('active', c === chip));
        const data = TRIAGE[chip.dataset.situacion];
        if (!data) return;
        document.getElementById('triage-pasos').innerHTML = data.pasos.map(p => `<li>${p}</li>`).join('');
        document.getElementById('triage-docs').innerHTML = data.docs.map(d => `<li>${d}</li>`).join('');
        document.getElementById('triage-wa').href =
            `https://wa.me/${settings.phone}?text=${encodeURIComponent('Hola, ' + data.consulta + '.')}`;
        triageBox.hidden = false;
        trackEvent('situacion', chip.dataset.situacion);
    }));
    document.getElementById('triage-wa').addEventListener('click', () => {
        const activa = document.querySelector('.chip.active');
        trackEvent('whatsapp', 'situacion-' + (activa ? activa.dataset.situacion : ''));
    });

    /* ── Disponibilidad según hora de Buenos Aires ── */
    const dispo = document.getElementById('disponibilidad');
    if (dispo) {
        const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
        const dia = ahora.getDay();
        const hora = ahora.getHours();
        const abierto = dia >= 1 && dia <= 5 && hora >= 9 && hora < 18;
        dispo.classList.toggle('cerrado', !abierto);
        document.getElementById('dispo-texto').textContent = abierto
            ? 'Atendemos ahora · le respondemos en el día'
            : 'Fuera de horario · le respondemos a primera hora';
        dispo.hidden = false;
    }

    /* ── Guardar contacto (.vcf) ── */
    const btnVcard = document.getElementById('btn-vcard');
    if (btnVcard) btnVcard.addEventListener('click', () => {
        const tel = '+' + settings.phone;
        const vcf = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            'FN:Estudio Jurídico',
            'ORG:Estudio Jurídico',
            `TEL;TYPE=CELL:${tel}`,
            `EMAIL:${settings.email}`,
            `URL:${location.origin}${location.pathname}`,
            'NOTE:Primera consulta sin cargo. Lun a Vie de 9 a 18 h.',
            'END:VCARD'
        ].join('\r\n');
        const url = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'estudio-juridico.vcf';
        a.click();
        URL.revokeObjectURL(url);
        trackEvent('vcard', 'contacto');
    });

    function animateCount(el) {
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const dur = 1400;
        const t0 = performance.now();
        const tick = now => {
            const p = Math.min((now - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
})();
