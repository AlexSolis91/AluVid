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

  function ayudaIOS() {
    const fondo = document.createElement('div');
    fondo.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:flex-end;justify-content:center;padding:16px';
    fondo.innerHTML = '<div style="background:#1f2333;color:#e8eaf0;border-radius:14px;padding:20px;max-width:380px;width:100%;font-family:sans-serif;font-size:15px;line-height:1.5">' +
      '<div style="font-weight:700;font-size:17px;margin-bottom:8px">Instalar SCAVi en tu iPhone o iPad</div>' +
      '1. Abre esta página en <b>Safari</b>.<br>2. Toca el botón <b>Compartir</b> (el cuadro con la flecha ↑).<br>' +
      '3. Elige <b>"Agregar a inicio"</b> y luego <b>Agregar</b>.' +
      '<button style="margin-top:14px;width:100%;padding:10px;border:0;border-radius:8px;background:#4f8ef7;color:#fff;font-size:15px">Entendido</button></div>';
    fondo.addEventListener('click', ev => { if (ev.target === fondo || ev.target.tagName === 'BUTTON') fondo.remove(); });
    document.body.appendChild(fondo);
  }

  window.instalarApp = async function () {
    if (aviso) {
      aviso.prompt();
      await aviso.userChoice.catch(() => {});
      aviso = null;
      mostrarBotones(false);
    } else if (esIOS) {
      ayudaIOS();
    } else {
      alert('Para instalar SCAVi abre el menú del navegador (⋮) y elige "Instalar app" o "Agregar a la pantalla de inicio".');
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    // En iPhone no existe el aviso automático: mostrar el botón con instrucciones
    mostrarBotones(!yaInstalada() && esIOS);
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
