// Project list ("/"): one full-height panel per project. Hovering or focusing a panel
// widens it and plays that project's opening loop as a preview; clicking opens /<id>.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const canPreview = matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)');

export function showHome(index) {
  const home = document.getElementById('home');
  let lang = 'ar';
  try { lang = localStorage.getItem('sarab.lang') || 'ar'; } catch {}

  function render() {
    const t = (v) => esc(v[lang]);
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = index.ui.brand[lang];
    home.innerHTML = `
      <header class="home-top">
        <p class="wordmark">${t(index.ui.brand)}</p>
        <div class="home-intro"><h1>${t(index.ui.title)}</h1><p>${t(index.ui.tagline)}</p></div>
        <button class="glass lang" type="button" data-lang>${t(index.ui.langSwitch)}</button>
      </header>
      <nav class="projects" aria-label="${t(index.ui.title)}">
        ${index.projects.map((p) => `
        <a class="project" href="/${p.id}">
          <img src="/projects/${p.id}/videos/main.jpg" alt="" />
          <video muted playsinline loop preload="none" src="/projects/${p.id}/videos/main.mp4" aria-hidden="true"></video>
          <span class="project-text">
            <span class="project-place">${t(p.place)}</span>
            <span class="project-name">${t(p.name)}</span>
            <span class="project-line">${t(p.line)}</span>
            <span class="glass project-enter">${t(index.ui.enter)}</span>
          </span>
        </a>`).join('')}
      </nav>`;
  }

  // preview: only the panel under the pointer (or keyboard focus) plays
  const preview = (target) => {
    for (const a of home.querySelectorAll('.project')) {
      const v = a.querySelector('video');
      if (a === target && canPreview.matches) {
        v.play().then(() => a.classList.add('is-playing')).catch(() => {});
      } else {
        v.pause();
        a.classList.remove('is-playing');
      }
    }
  };
  home.addEventListener('mouseover', (e) => preview(e.target.closest('.project')));
  home.addEventListener('mouseleave', () => preview(null));
  home.addEventListener('focusin', (e) => preview(e.target.closest('.project')));
  home.addEventListener('click', (e) => {
    if (!e.target.closest('[data-lang]')) return;
    lang = lang === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem('sarab.lang', lang); } catch {}
    render();
    home.querySelector('[data-lang]').focus();
  });

  render();
  home.hidden = false;
  delete document.body.dataset.moving;
}
