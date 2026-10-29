// Instalación de SCAVi como app (PWA) y aviso de versión nueva.
// Cualquier elemento con la clase "btn-instalar" se muestra cuando se puede instalar
// y al hacer clic llama a instalarApp().
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW:', e.message)));
  }

  const yaInstalada = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let aviso = null;

  function mostrarBotones(si) {
    document.querySelectorAll('.btn-instalar').forEach(b => { b.style.display = si ? '' : 'none'; });
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    aviso = e;
    mostrarBotones(true);
  });
  window.addEventListener('appinstalled', () => { aviso = null; mostrarBotones(false); });

  // En iPhone/iPad solo Safari (y en iOS 16.4+ también Chrome/Edge) permite "Agregar a inicio"
  const esSafari = esIOS && !/crios|fxios|edgios|opios|gsa\//i.test(navigator.userAgent);
  // Safari en Mac (macOS Sonoma 14+): se instala con Archivo → Agregar al Dock; tampoco hay aviso automático
  const esSafariMac = !esIOS && /Macintosh/.test(navigator.userAgent) && /Safari\//.test(navigator.userAgent) &&
    !/Chrome|Chromium|CriOS|Edg|OPR|Firefox/.test(navigator.userAgent);

  function ayudaMac() {
    mostrarAyuda('Instalar SCAVi en tu Mac',
      '1. En la barra de menú de Safari, abre <b>Archivo</b>.<br>2. Elige <b>"Agregar al Dock…"</b> y luego <b>Agregar</b>.<br>' +
      '<span style="font-size:13px;color:#9aa3b8">También puedes usar el botón <b>Compartir</b> ⬆︎ de Safari → <b>"Agregar al Dock"</b>. Requiere macOS Sonoma (14) o más nuevo; si no te aparece la opción, usa Chrome o Edge y su botón de instalar.</span>',
      'SCAVi quedará en tu Dock y se abrirá en su propia ventana.');
  }

  function mostrarAyuda(titulo, pasos, nota) {
    const fondo = document.createElement('div');
    fondo.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    fondo.innerHTML = '<div style="background:#1f2333;color:#e8eaf0;border-radius:14px;padding:20px;max-width:420px;width:100%;font-family:sans-serif;font-size:15px;line-height:1.6">' +
      '<div style="font-weight:700;font-size:17px;margin-bottom:8px">' + titulo + '</div>' + pasos +
      '<div style="font-size:13px;color:#9aa3b8;margin-top:8px">' + nota + '</div>' +
      '<button style="margin-top:14px;width:100%;padding:10px;border:0;border-radius:8px;background:#4f8ef7;color:#fff;font-size:15px;cursor:pointer">Entendido</button></div>';
    fondo.addEventListener('click', ev => { if (ev.target === fondo || ev.target.tagName === 'BUTTON') fondo.remove(); });
    document.body.appendChild(fondo);
  }

  function ayudaIOS() {
    const pasos = esSafari
      ? '1. Toca el botón <b>Compartir</b> <span style="font-size:18px">⬆︎</span> (abajo en iPhone, arriba en iPad).<br>' +
        '2. Desliza hacia abajo y elige <b>"Agregar a inicio"</b>.<br>3. Toca <b>Agregar</b>.'
      : '1. Toca el botón <b>Compartir</b> <span style="font-size:18px">⬆︎</span> de tu navegador y elige <b>"Agregar a inicio"</b>.<br>' +
        '2. Si no aparece esa opción, copia la dirección y ábrela en <b>Safari</b>; ahí sigue los mismos pasos.';
    mostrarAyuda('Instalar SCAVi en tu iPhone o iPad', pasos, 'El ícono de SCAVi quedará en tu pantalla de inicio y se abrirá como app.');
  }

  // Aviso una sola vez en iPhone/iPad/Mac con Safari (no hay aviso automático); se puede cerrar por 7 días
  function bannerIOS() {
    let cerrado = 0;
    try { cerrado = +localStorage.getItem('scavi_ios_banner') || 0; } catch (e) {}
    if (Date.now() - cerrado < 7 * 864e5) return;
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;max-width:460px;margin:0 auto;z-index:9997;background:#1f2333;color:#e8eaf0;border:1px solid rgba(79,142,247,.5);border-radius:12px;padding:12px 14px;font-family:sans-serif;font-size:14px;display:flex;gap:10px;align-items:center;box-shadow:0 8px 24px rgba(0,0,0,.45)';
    b.innerHTML = '<span style="font-size:22px">📲</span><span style="flex:1">' + (esIOS ? 'Instala SCAVi en tu pantalla de inicio.' : 'Instala SCAVi en tu Mac como app.') + '</span>' +
      '<button data-a="ver" style="background:#4f8ef7;color:#fff;border:0;border-radius:8px;padding:7px 12px;font-weight:700">Cómo</button>' +
      '<button data-a="x" aria-label="Cerrar" style="background:transparent;color:#9aa3b8;border:0;font-size:20px;padding:0 4px">×</button>';
    b.addEventListener('click', ev => {
      const a = ev.target.getAttribute && ev.target.getAttribute('data-a');
      if (!a) return;
      try { localStorage.setItem('scavi_ios_banner', String(Date.now())); } catch (e) {}
      b.remove();
      if (a === 'ver') (esIOS ? ayudaIOS : ayudaMac)();
    });
    document.body.appendChild(b);
  }

  window.instalarApp = async function () {
    if (aviso) {
      aviso.prompt();
      await aviso.userChoice.catch(() => {});
      aviso = null;
      mostrarBotones(false);
    } else if (esIOS) {
      ayudaIOS();
    } else if (esSafariMac) {
      ayudaMac();
    } else {
      alert('Para instalar SCAVi abre el menú del navegador (⋮) y elige "Instalar app" o "Agregar a la pantalla de inicio".');
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    // En iPhone/iPad y Safari de Mac no existe el aviso automático: mostrar el botón con instrucciones
    const ios = !yaInstalada() && (esIOS || esSafariMac);
    mostrarBotones(ios);
    if (ios) setTimeout(bannerIOS, 1500);
  });

  // Aviso de versión nueva: la app instalada (o una pestaña abierta días) puede quedarse vieja
  const versionActual = () => (typeof APP_VERSION !== 'undefined' ? APP_VERSION : null);
  let avisado = false;
  async function revisarVersion() {
    const v = versionActual();
    if (!v || avisado || document.visibilityState !== 'visible') return;
    try {
      const txt = await fetch('index.html?v=' + Date.now(), { cache: 'no-store' }).then(r => r.text());
      const m = txt.match(/APP_VERSION\s*=\s*'([\d.]+)'/);
      if (m && m[1] !== v) {
        avisado = true;
        const b = document.createElement('div');
        b.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9998;background:#4f8ef7;color:#fff;padding:10px 14px;border-radius:10px;font-family:sans-serif;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.4);display:flex;gap:10px;align-items:center;max-width:calc(100vw - 24px)';
        b.innerHTML = '<span>Hay una versión nueva de SCAVi (v' + m[1] + ').</span>' +
          '<button style="background:#fff;color:#2a4d9a;border:0;border-radius:6px;padding:6px 12px;font-weight:700;cursor:pointer">Actualizar</button>';
        b.querySelector('button').onclick = () => location.reload();
        document.body.appendChild(b);
      }
    } catch (e) { /* sin internet: se revisa después */ }
  }
  document.addEventListener('visibilitychange', revisarVersion);
  setInterval(revisarVersion, 30 * 60 * 1000);
})();
