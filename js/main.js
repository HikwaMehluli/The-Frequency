// Entry point used by Vite.
// It bundles the SASS stylesheet, then switches the player and menu on.

import '../scss/_entry.scss';
import { initSidebar } from './sidebar.js';
import { initCassette } from './mixtape.js';

initSidebar();
initCassette('#mix-tape');

// Register the service worker so music and sounds work offline too.
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js');
	});
}