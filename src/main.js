// Router: "<base>" lists the projects, "<base><project-id>" opens that project's explorer.
// Each project lives in public/projects/<id>/ (scenes.json, content.json, videos/, panos/);
// public/projects/index.json lists them for the home page. Decided from the path alone, so
// "/" never paints the player's loader and "/<id>" doesn't wait on the index.

const BASE = import.meta.env.BASE_URL; // '/' or e.g. '/demos/' (SARAB_BASE), always ends with '/'
const id = location.pathname.slice(BASE.length).split('/').filter(Boolean)[0];
document.getElementById('brand').href = BASE;

if (id) {
  document.getElementById('home').remove();
  await import('./player.js'); // redirects to <base> if the project doesn't exist
} else {
  document.getElementById('player').remove();
  const [index, { showHome }] = await Promise.all([fetch(`${BASE}projects/index.json`).then((r) => r.json()), import('./home.js')]);
  showHome(index);
}
