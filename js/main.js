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

    /* ── Textos editables desde el panel admin ── */
    const texts = settings.texts || {};
    const EDITABLES = {
        tituloL1: 'ed-titulo-1',
        tituloL2: 'ed-titulo-2',
        materia: 'ed-materia',
        destacado: 'ed-destacado',
        estudio: 'ed-estudio',
        pie1: 'ed-pie-1',
        pie2: 'ed-pie-2'
    };
    Object.entries(EDITABLES).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el && texts[key]) el.textContent = texts[key];
    });

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

    /* Segunda pregunta por situación, con normativa argentina vigente */
    const REFINE = {
        despido: {
            q: 'Contanos un poco más: ¿cómo fue el despido?',
            opciones: [
                {
                    label: 'Sin causa, me echaron',
                    texto: 'Le corresponde indemnización por antigüedad (un sueldo por año trabajado o fracción mayor a tres meses), más preaviso, integración del mes de despido y proporcionales de aguinaldo y vacaciones. Tiene dos años para reclamar, pero cuanto antes intime por telegrama, mejor.',
                    ref: 'Arts. 231, 233, 245 y 256, Ley de Contrato de Trabajo 20.744.'
                },
                {
                    label: 'Dicen que fue con causa',
                    texto: 'La causa invocada debe ser grave, real y comunicada por escrito con detalle; si no, el despido se paga como uno sin causa. Rechace la causal por telegrama apenas lo reciba: el silencio puede jugarle en contra. Muchas "causas" no resisten un juicio.',
                    ref: 'Arts. 242 y 243, Ley de Contrato de Trabajo 20.744.'
                },
                {
                    label: 'Trabajaba en negro',
                    texto: 'El trabajo no registrado genera los mismos derechos: la indemnización se calcula sobre lo que realmente cobraba, y la relación se prueba con testigos, mensajes, transferencias y horarios. El telegrama laboral es gratuito para el trabajador.',
                    ref: 'Ley 23.789 (telegrama gratuito) y art. 23, LCT 20.744 (presunción de contrato).'
                },
                {
                    label: 'Me hacen firmar la renuncia',
                    texto: 'No firme renuncia ni "retiro voluntario" bajo presión: la renuncia hace perder la indemnización y solo vale enviada por usted por telegrama o ante autoridad. Pida tiempo y consulte antes de firmar cualquier papel.',
                    ref: 'Art. 240, Ley de Contrato de Trabajo 20.744.'
                }
            ]
        },
        accidente: {
            q: '¿Dónde ocurrió el accidente?',
            opciones: [
                {
                    label: 'En el trabajo o in itinere',
                    texto: 'Lo cubre la ART: denúncielo de inmediato ante la ART y su empleador, y exija atención médica a cargo de ella. También cubre el trayecto casa-trabajo (in itinere). Si la ART rechaza el caso o le da el alta antes de tiempo, se cuestiona ante la Comisión Médica con abogado.',
                    ref: 'Leyes 24.557 y 27.348 (riesgos del trabajo).'
                },
                {
                    label: 'De tránsito (auto, moto, peatón)',
                    texto: 'Responde el seguro del responsable: guarde la denuncia, fotos, datos de testigos y toda constancia médica. No acepte ofertas rápidas de la aseguradora sin asesorarse: suelen estar muy por debajo de lo que corresponde. Tiene tres años para reclamar.',
                    ref: 'Arts. 1757, 1769 y 2561, Código Civil y Comercial; Ley 24.449 (seguro obligatorio).'
                },
                {
                    label: 'Caída en vía pública o comercio',
                    texto: 'Pueden responder el municipio, el consorcio o el comercio por el deber de seguridad. Saque fotos del lugar ese mismo día (vereda rota, piso mojado), pida atención médica con constancia y consiga datos de testigos: la prueba temprana define estos casos.',
                    ref: 'Art. 1757, Código Civil y Comercial; Ley 24.240 de Defensa del Consumidor.'
                }
            ]
        },
        sucesion: {
            q: '¿Qué necesita resolver?',
            opciones: [
                {
                    label: 'Iniciar la sucesión',
                    texto: 'Se tramita ante el juez del último domicilio del fallecido, en Provincia o en CABA según el caso. Puede iniciarla un solo heredero sin esperar el acuerdo de los demás, y las partidas que falten las pedimos nosotros.',
                    ref: 'Arts. 2336 y siguientes, Código Civil y Comercial.'
                },
                {
                    label: 'Hay una propiedad para vender',
                    texto: 'Con la declaratoria de herederos dictada, el inmueble puede venderse incluso por tracto abreviado, sin esperar la inscripción definitiva a nombre de los herederos. Es la vía habitual y ahorra tiempo y gastos.',
                    ref: 'Art. 16, Ley 17.801 (Registro de la Propiedad Inmueble).'
                },
                {
                    label: 'Conflicto entre herederos',
                    texto: 'El desacuerdo no frena la sucesión: cada heredero puede actuar con su propio abogado y el juez puede designar un administrador y resolver la partición de los bienes. No hace falta que estén todos de acuerdo para avanzar.',
                    ref: 'Arts. 2345 y 2371, Código Civil y Comercial.'
                }
            ]
        },
        salud: {
            q: '¿Qué le están negando?',
            opciones: [
                {
                    label: 'Medicamento o tratamiento',
                    texto: 'Si está prescripto por su médico, la obra social o prepaga debe cubrirlo conforme al Programa Médico Obligatorio y las leyes especiales. Con la negativa (o el silencio) se presenta un amparo con medida cautelar: la justicia suele ordenar la cobertura en cuestión de días.',
                    ref: 'Art. 43, Constitución Nacional; leyes 23.660, 23.661 y 26.682.'
                },
                {
                    label: 'Discapacidad (CUD)',
                    texto: 'Con el Certificado Único de Discapacidad la cobertura es integral, al cien por ciento: tratamientos, acompañante, transporte y educación. La negativa o la demora se atacan por amparo y es uno de los reclamos con mayor respaldo judicial.',
                    ref: 'Ley 24.901 (prestaciones por discapacidad).'
                },
                {
                    label: 'Baja, aumentos o afiliación',
                    texto: 'La prepaga no puede rechazar su afiliación por preexistencias ni darlo de baja de manera arbitraria, y los aumentos deben respetar la regulación vigente. Guarde cartas, mails y comprobantes: el reclamo procede.',
                    ref: 'Ley 26.682 (marco regulatorio de medicina prepaga).'
                }
            ]
        },
        familia: {
            q: '¿Qué tema lo trae?',
            opciones: [
                {
                    label: 'Divorcio',
                    texto: 'El divorcio es incausado: puede pedirlo uno solo de los cónyuges, sin expresar motivos ni esperar plazos, acompañando una propuesta sobre bienes e hijos. No se necesita el acuerdo del otro para divorciarse.',
                    ref: 'Arts. 437 y 438, Código Civil y Comercial.'
                },
                {
                    label: 'Alimentos',
                    texto: 'Los alimentos para los hijos corren hasta los 21 años, y hasta los 25 si estudian y no pueden mantenerse. Se deben desde el reclamo: intimar temprano define desde cuándo se cobran, y el incumplimiento permite retener del sueldo.',
                    ref: 'Arts. 658 y 663, Código Civil y Comercial.'
                },
                {
                    label: 'Régimen de comunicación',
                    texto: 'El contacto con los hijos se resuelve priorizando su interés superior; en la Provincia el reclamo pasa primero por una etapa previa ante el juzgado de familia. Documente todo con mensajes y registros y evite cortar el contacto por decisión propia.',
                    ref: 'Arts. 652 y 555, Código Civil y Comercial; Ley 13.634 (fuero de familia, PBA).'
                }
            ]
        }
    };
    const chips = document.querySelectorAll('.chip');
    const triageBox = document.getElementById('triage');
    const refineBox = document.getElementById('triage-refine');
    const refineInfo = document.getElementById('refine-info');
    const refineChipsEl = document.getElementById('refine-chips');

    function setTriageWa(texto) {
        document.getElementById('triage-wa').href =
            `https://wa.me/${settings.phone}?text=${encodeURIComponent(texto)}`;
    }

    chips.forEach(chip => chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.toggle('active', c === chip));
        const key = chip.dataset.situacion;
        const data = TRIAGE[key];
        if (!data) return;
        document.getElementById('triage-pasos').innerHTML = data.pasos.map(p => `<li>${p}</li>`).join('');
        document.getElementById('triage-docs').innerHTML = data.docs.map(d => `<li>${d}</li>`).join('');
        setTriageWa('Hola, ' + data.consulta + '.');

        const refine = REFINE[key];
        refineInfo.hidden = true;
        if (refine) {
            document.getElementById('refine-q').textContent = refine.q;
            refineChipsEl.innerHTML = '';
            refine.opciones.forEach(op => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'chip chip-sm';
                b.textContent = op.label;
                b.addEventListener('click', () => {
                    refineChipsEl.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === b));
                    document.getElementById('refine-texto').textContent = op.texto;
                    document.getElementById('refine-ref').textContent = op.ref;
                    refineInfo.hidden = false;
                    setTriageWa(`Hola, ${data.consulta} (${op.label.toLowerCase()}). Quiero asesorarme.`);
                    trackEvent('situacion', `${key}: ${op.label}`);
                });
                refineChipsEl.appendChild(b);
            });
            refineBox.hidden = false;
        } else {
            refineBox.hidden = true;
        }

        triageBox.hidden = false;
        trackEvent('situacion', key);
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

    /* ── Formulario "deje sus datos" ── */
    const contactForm = document.getElementById('contact-form');
    if (contactForm) contactForm.addEventListener('submit', e => {
        e.preventDefault();
        const data = new FormData(contactForm);
        const name = String(data.get('name') || '').trim();
        const phone = String(data.get('phone') || '').trim();
        const area = String(data.get('area') || '').trim();
        const notes = String(data.get('notes') || '').trim();
        const errorEl = document.getElementById('contact-error');
        if (name.length < 2 || phone.replace(/\D/g, '').length < 8 || !area) {
            errorEl.hidden = false;
            return;
        }
        errorEl.hidden = true;

        const leads = readJSON('ej_leads', []);
        leads.push({
            id: `L${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
            name, phone, area, notes,
            channel: 'formulario',
            status: 'nuevo',
            createdAt: Date.now()
        });
        writeJSON('ej_leads', leads);
        trackEvent('formulario', area);

        const msg = encodeURIComponent(
            `Hola, soy ${name} (WhatsApp ${phone}). Dejé mis datos en la página. Consulta sobre ${area}.${notes ? ' ' + notes : ''}`
        );
        document.getElementById('contact-ok-wa').href = `https://wa.me/${settings.phone}?text=${msg}`;
        contactForm.hidden = true;
        document.getElementById('contact-ok').hidden = false;
    });
    const contactOkWa = document.getElementById('contact-ok-wa');
    if (contactOkWa) contactOkWa.addEventListener('click', () => trackEvent('whatsapp', 'formulario'));

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
