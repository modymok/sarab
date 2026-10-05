// Router: "/" lists the projects, "/<project-id>" opens that project's explorer.
// Each project lives in public/projects/<id>/ (scenes.json, content.json, videos/, panos/);
// public/projects/index.json lists them for the home page. Decided from the path alone, so
// "/" never paints the player's loader and "/<id>" doesn't wait on the index.

const id = location.pathname.split('/').filter(Boolean)[0];

if (id) {
  document.getElementById('home').remove();
  await import('./player.js'); // redirects to "/" if the project doesn't exist
} else {
  document.getElementById('player').remove();
  const [index, { showHome }] = await Promise.all([fetch('/projects/index.json').then((r) => r.json()), import('./home.js')]);
  showHome(index);
}
