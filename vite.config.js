// base is absolute (default '/'): pages are served at <base><project-id> too, where './assets' would miss.
// SARAB_BASE=/demos/ builds for a URL prefix (e.g. ayntwin.com/demos/).
export default { base: process.env.SARAB_BASE || '/', build: { target: 'es2022' } };
