// Prefixes a root-relative path (e.g. "hero.mp4", "/contatti") with the
// site's base path, so links/assets keep working when deployed under a
// subpath (GitHub Pages: /Startruck/) as well as at domain root.
export const base = (path: string) => {
  const prefix = `${import.meta.env.BASE_URL.replace(/\/+$/, '')}/`;
  return `${prefix}${path.replace(/^\/+/, '')}`;
};
