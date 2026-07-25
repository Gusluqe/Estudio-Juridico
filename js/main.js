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

        document.getElementById('calc-despido').hidden = key !== 'despido';
        resetPreconsulta(key);

        triageBox.hidden = false;
        trackEvent('situacion', key);
    }));

    /* ── Calculadora de indemnización (despido sin causa) ── */
    const fmtARS = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

    document.getElementById('calc-btn').addEventListener('click', () => {
        const sueldo = Number(document.getElementById('calc-sueldo').value);
        const ingreso = new Date(document.getElementById('calc-ingreso').value + 'T12:00:00');
        const despido = new Date(document.getElementById('calc-fecha').value + 'T12:00:00');
        const preavisado = document.getElementById('calc-preaviso').checked;
        const errorEl = document.getElementById('calc-error');

        if (!sueldo || sueldo <= 0 || isNaN(ingreso) || isNaN(despido) || despido <= ingreso) {
            errorEl.hidden = false;
            document.getElementById('calc-result').hidden = true;
            return;
        }
        errorEl.hidden = true;

        const MS_DIA = 86400000;
        const diasTotales = Math.floor((despido - ingreso) / MS_DIA);

        /* antigüedad art. 245: un sueldo por año o fracción mayor a 3 meses */
        let anios = despido.getFullYear() - ingreso.getFullYear();
        const aniv = new Date(ingreso); aniv.setFullYear(ingreso.getFullYear() + anios);
        if (aniv > despido) anios--;
        const diasFraccion = Math.floor((despido - new Date(new Date(ingreso).setFullYear(ingreso.getFullYear() + anios))) / MS_DIA);
        const aniosComputables = Math.max(anios + (diasFraccion > 90 ? 1 : 0), diasTotales > 90 ? 1 : 0);

        const rubros = [];
        const antiguedad = sueldo * aniosComputables;
        rubros.push(['Indemnización por antigüedad (art. 245 LCT)', antiguedad]);

        let preavisoMonto = 0, integracion = 0;
        if (!preavisado) {
            preavisoMonto = sueldo * (anios >= 5 ? 2 : 1) * (13 / 12);
            rubros.push(['Preaviso omitido + SAC (arts. 231/232)', preavisoMonto]);
            const ultimoDia = new Date(despido.getFullYear(), despido.getMonth() + 1, 0).getDate();
            if (despido.getDate() < ultimoDia) {
                integracion = sueldo * ((ultimoDia - despido.getDate()) / 30) * (13 / 12);
                rubros.push(['Integración del mes de despido + SAC (art. 233)', integracion]);
            }
        }

        /* SAC proporcional del semestre */
        const inicioSemestre = new Date(despido.getFullYear(), despido.getMonth() < 6 ? 0 : 6, 1);
        const diasSemestre = Math.max(Math.floor((despido - Math.max(inicioSemestre, ingreso)) / MS_DIA), 0);
        const sacProp = (sueldo / 2) * (diasSemestre / 182.5);
        rubros.push(['Aguinaldo proporcional', sacProp]);

        /* vacaciones proporcionales (art. 156) */
        const diasVac = aniosComputables > 20 ? 35 : aniosComputables > 10 ? 28 : aniosComputables >= 5 ? 21 : 14;
        const inicioAnio = new Date(despido.getFullYear(), 0, 1);
        const diasAnio = Math.max(Math.floor((despido - Math.max(inicioAnio, ingreso)) / MS_DIA), 0);
        const vacProp = diasVac * (diasAnio / 365) * (sueldo / 25);
        rubros.push(['Vacaciones proporcionales no gozadas (art. 156)', vacProp]);

        const total = rubros.reduce((s, r) => s + r[1], 0);

        document.getElementById('calc-rubros').innerHTML = rubros
            .map(([n, v]) => `<div class="calc-rubro"><dt>${n}</dt><dd>${fmtARS(v)}</dd></div>`).join('');
        document.getElementById('calc-total').textContent = fmtARS(total);

        const msg = encodeURIComponent(
            `Hola, me despidieron. Usé la calculadora de la página y mi indemnización estimada es ${fmtARS(total)} ` +
            `(sueldo ${fmtARS(sueldo)}, ${aniosComputables} año${aniosComputables === 1 ? '' : 's'} de antigüedad). Quiero que revisen mi caso.`
        );
        document.getElementById('calc-wa').href = `https://wa.me/${settings.phone}?text=${msg}`;
        document.getElementById('calc-result').hidden = false;
        trackEvent('calculadora', `estimado ${fmtARS(total)}`);
    });
    document.getElementById('calc-wa').addEventListener('click', () => trackEvent('whatsapp', 'calculadora'));

    /* ── Pre-consulta guiada (intake con prioridad) ── */
    const mesesDesde = fechaStr => {
        const f = new Date(fechaStr + 'T12:00:00');
        if (isNaN(f)) return null;
        return (Date.now() - f.getTime()) / (30.44 * 86400000);
    };
    const fmtFecha = fechaStr => new Date(fechaStr + 'T12:00:00').toLocaleDateString('es-AR');

    const PRE = {
        despido: {
            label: 'Despido',
            steps: [
                { id: 'fecha', q: '¿Cuándo fue el despido?', type: 'date', nombre: 'Fecha del despido' },
                { id: 'registro', q: '¿Estaba registrado ("en blanco")?', type: 'choice', nombre: 'Registrado', opts: ['Sí', 'Parcialmente (mal registrado)', 'No, en negro'] },
                { id: 'causa', q: '¿Cómo se lo comunicaron?', type: 'choice', nombre: 'Comunicación', opts: ['Sin causa', 'Con causa por escrito', 'Me hacen firmar renuncia o acuerdo', 'Aún no me lo confirmaron'] },
                { id: 'telegrama', q: '¿Ya intimó por telegrama laboral?', type: 'choice', nombre: 'Telegrama enviado', opts: ['Sí', 'No', 'No sé qué es'] }
            ],
            evaluar(a) {
                const m = mesesDesde(a.fecha);
                if (a.causa && a.causa.startsWith('Me hacen firmar')) return { p: 'urgente', nota: 'No firme nada hasta hablar con un abogado: una firma puede costarle la indemnización.' };
                if (m !== null && m > 24) return { p: 'revisar', nota: 'El plazo general de 2 años (art. 256 LCT) podría estar vencido. Consúltenos igual: hay supuestos que lo interrumpen o suspenden.' };
                if (m !== null && m >= 18) return { p: 'urgente', nota: 'Le queda poco del plazo de 2 años para reclamar: conviene actuar cuanto antes.' };
                return { p: 'viable', nota: 'Su reclamo está dentro del plazo legal.' };
            }
        },
        accidente: {
            label: 'Accidente',
            steps: [
                { id: 'tipo', q: '¿Qué tipo de accidente fue?', type: 'choice', nombre: 'Tipo', opts: ['En el trabajo o in itinere', 'De tránsito', 'En vía pública o comercio'] },
                { id: 'fecha', q: '¿Cuándo ocurrió?', type: 'date', nombre: 'Fecha del hecho' },
                { id: 'atencion', q: '¿Recibió atención médica con constancias?', type: 'choice', nombre: 'Atención médica', opts: ['Sí, tengo constancias', 'Me atendieron pero no tengo papeles', 'No me atendí aún'] },
                { id: 'denuncia', q: '¿Hizo la denuncia (ART, policial o al seguro)?', type: 'choice', nombre: 'Denuncia', opts: ['Sí', 'No'] }
            ],
            evaluar(a) {
                const plazo = a.tipo === 'En el trabajo o in itinere' ? 24 : 36;
                const m = mesesDesde(a.fecha);
                if (m !== null && m > plazo) return { p: 'revisar', nota: `El plazo de ${plazo / 12} años podría estar vencido. Consúltenos igual: la fecha desde la que se cuenta tiene matices.` };
                if (m !== null && m >= plazo - 6) return { p: 'urgente', nota: 'El plazo para reclamar está por vencer: conviene actuar ya.' };
                return { p: 'viable', nota: 'Su reclamo está dentro del plazo legal.' };
            }
        },
        sucesion: {
            label: 'Sucesión',
            steps: [
                { id: 'vinculo', q: '¿Qué vínculo tenía con el fallecido?', type: 'choice', nombre: 'Vínculo', opts: ['Hijo/a', 'Cónyuge', 'Padre / madre', 'Otro'] },
                { id: 'bienes', q: '¿Qué bienes hay que transmitir?', type: 'choice', nombre: 'Bienes', opts: ['Inmueble/s', 'Vehículo/s', 'Cuentas o inversiones', 'Varios de los anteriores'] },
                { id: 'acuerdo', q: '¿Los herederos están de acuerdo?', type: 'choice', nombre: 'Acuerdo entre herederos', opts: ['Sí', 'No', 'No hay contacto entre todos'] }
            ],
            evaluar() {
                return { p: 'viable', nota: 'La sucesión puede iniciarse ya, incluso con un solo heredero.' };
            }
        },
        salud: {
            label: 'Amparo de salud',
            steps: [
                { id: 'tipo', q: '¿Qué le están negando?', type: 'choice', nombre: 'Cobertura negada', opts: ['Medicamento o tratamiento', 'Prestaciones por discapacidad (CUD)', 'Afiliación, baja o aumentos'] },
                { id: 'negativa', q: '¿Tiene la negativa por escrito?', type: 'choice', nombre: 'Negativa por escrito', opts: ['Sí', 'La pedí y no responden', 'Todavía no la pedí'] },
                { id: 'riesgo', q: '¿La salud se agrava si esto demora?', type: 'choice', nombre: 'Urgencia médica', opts: ['Sí, es urgente', 'Puede esperar unas semanas'] }
            ],
            evaluar(a) {
                if (a.riesgo === 'Sí, es urgente') return { p: 'urgente', nota: 'Caso con urgencia médica: el amparo con medida cautelar puede ordenar la cobertura en días.' };
                return { p: 'viable', nota: 'Caso con vía de amparo disponible.' };
            }
        },
        familia: {
            label: 'Familia',
            steps: [
                { id: 'tema', q: '¿Cuál es el tema principal?', type: 'choice', nombre: 'Tema', opts: ['Divorcio', 'Alimentos', 'Régimen de comunicación', 'Violencia familiar'] },
                { id: 'hijos', q: '¿Hay hijos menores de edad?', type: 'choice', nombre: 'Hijos menores', opts: ['Sí', 'No'] },
                { id: 'dialogo', q: '¿Hay diálogo con la otra parte?', type: 'choice', nombre: 'Diálogo con la otra parte', opts: ['Sí', 'Poco', 'Nada'] }
            ],
            evaluar(a) {
                if (a.tema === 'Violencia familiar') return { p: 'urgente', nota: 'Si usted o sus hijos están en riesgo ahora, llame al 144 o al 911. Su caso se atiende con prioridad absoluta.' };
                return { p: 'viable', nota: 'Caso de familia con vías de resolución disponibles.' };
            }
        },
        otra: {
            label: 'Consulta general',
            steps: [
                { id: 'antiguedad', q: '¿Hace cuánto ocurrió el problema?', type: 'choice', nombre: 'Antigüedad del problema', opts: ['Menos de 1 año', 'Entre 1 y 2 años', 'Más de 2 años', 'Está por ocurrir'] }
            ],
            evaluar(a) {
                if (a.antiguedad === 'Más de 2 años') return { p: 'revisar', nota: 'Según la materia, algunos plazos podrían estar vencidos: lo revisamos en la consulta.' };
                return { p: 'viable', nota: 'Cuéntenos su caso y lo orientamos.' };
            }
        }
    };

    const PRIO = {
        urgente: { badge: '🔴 Prioridad urgente', valor: 'URGENTE' },
        viable:  { badge: '🟢 Caso viable, a evaluar', valor: 'Viable' },
        revisar: { badge: '⚪ A revisar (posibles plazos vencidos)', valor: 'A revisar' }
    };

    let preKey = null, preStep = 0, preAnswers = {};

    const preEls = {
        box: document.getElementById('preconsulta'),
        head: document.querySelector('.pre-head'),
        flow: document.getElementById('pre-flow'),
        contact: document.getElementById('pre-contact'),
        result: document.getElementById('pre-result'),
        progress: document.getElementById('pre-progress'),
        q: document.getElementById('pre-q'),
        opts: document.getElementById('pre-opts')
    };

    function resetPreconsulta(key) {
        preKey = PRE[key] ? key : null;
        preStep = 0;
        preAnswers = {};
        preEls.box.hidden = !preKey;
        preEls.head.hidden = false;
        preEls.flow.hidden = true;
        preEls.contact.hidden = true;
        preEls.result.hidden = true;
    }

    function renderPreStep() {
        const cfg = PRE[preKey];
        if (preStep >= cfg.steps.length) {
            preEls.flow.hidden = true;
            preEls.contact.hidden = false;
            document.getElementById('pre-nombre').focus();
            return;
        }
        const step = cfg.steps[preStep];
        preEls.progress.textContent = `Pregunta ${preStep + 1} de ${cfg.steps.length}`;
        preEls.q.textContent = step.q;
        preEls.opts.innerHTML = '';
        if (step.type === 'date') {
            const input = document.createElement('input');
            input.type = 'date';
            input.className = 'pre-date';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-primary';
            btn.textContent = 'Siguiente';
            btn.addEventListener('click', () => {
                if (!input.value) { input.focus(); return; }
                preAnswers[step.id] = input.value;
                preStep++;
                renderPreStep();
            });
            preEls.opts.append(input, btn);
        } else {
            step.opts.forEach(op => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'chip chip-sm';
                b.textContent = op;
                b.addEventListener('click', () => {
                    preAnswers[step.id] = op;
                    preStep++;
                    renderPreStep();
                });
                preEls.opts.appendChild(b);
            });
        }
        preEls.flow.hidden = false;
    }

    document.getElementById('pre-start').addEventListener('click', () => {
        preEls.head.hidden = true;
        preStep = 0;
        preAnswers = {};
        renderPreStep();
        trackEvent('pre-consulta', `inició: ${PRE[preKey].label}`);
    });

    document.getElementById('pre-reiniciar').addEventListener('click', () => resetPreconsulta(preKey));

    document.getElementById('pre-generar').addEventListener('click', () => {
        const nombre = document.getElementById('pre-nombre').value.trim();
        const tel = document.getElementById('pre-tel').value.trim();
        const errorEl = document.getElementById('pre-error');
        if (nombre.length < 2 || tel.replace(/\D/g, '').length < 8) {
            errorEl.hidden = false;
            return;
        }
        errorEl.hidden = true;

        const cfg = PRE[preKey];
        const ev = cfg.evaluar(preAnswers);
        const prio = PRIO[ev.p];

        const lineas = cfg.steps
            .filter(s => preAnswers[s.id])
            .map(s => `${s.nombre}: ${s.type === 'date' ? fmtFecha(preAnswers[s.id]) : preAnswers[s.id]}`);

        document.getElementById('pre-badge').textContent = prio.badge;
        document.getElementById('pre-nota').textContent = ev.nota;
        document.getElementById('pre-resumen').innerHTML = lineas.map(l => `<li>${l}</li>`).join('');

        const ficha =
            `FICHA DE PRE-CONSULTA · ${cfg.label}\n` +
            lineas.map(l => `• ${l}`).join('\n') +
            `\n• Prioridad: ${prio.valor}` +
            `\nNombre: ${nombre} · WhatsApp: ${tel}`;
        document.getElementById('pre-wa').href = `https://wa.me/${settings.phone}?text=${encodeURIComponent(ficha)}`;

        const leads = readJSON('ej_leads', []);
        leads.push({
            id: `L${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
            name: nombre,
            phone: tel,
            area: cfg.label,
            channel: 'pre-consulta',
            notes: lineas.join(' · '),
            priority: ev.p,
            status: 'nuevo',
            createdAt: Date.now()
        });
        writeJSON('ej_leads', leads);
        trackEvent('pre-consulta', `${cfg.label} · ${prio.valor}`);

        preEls.contact.hidden = true;
        preEls.result.hidden = false;
    });
    document.getElementById('pre-wa').addEventListener('click', () => trackEvent('whatsapp', 'pre-consulta'));
    document.getElementById('triage-wa').addEventListener('click', () => {
        const activa = document.querySelector('#situaciones .chip.active');
        const sub = document.querySelector('#refine-chips .chip.active');
        trackEvent('whatsapp', 'situación: ' + (activa ? activa.textContent : '') + (sub ? ' / ' + sub.textContent : ''));
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
