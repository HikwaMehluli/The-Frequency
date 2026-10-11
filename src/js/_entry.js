// Entry point.
// Compiles SCSS via Vite when building; loads plain JS modules in browser.

import '../scss/_entry.scss';
import { initSidebar } from './sidebar.js';
import { initCassette } from './mixtape.js';

initSidebar();
initCassette('#mix-tape');

// The service worker caches the music and sounds after the first visit, so
// return listeners don't download them again. Old browsers and plain HTTP
// (like a phone previewing over the LAN) simply skip it.
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('./public/sw.js').catch(() => {});
}
