// Entry point.
// Compiles SCSS via Vite when building; loads plain JS modules in browser.

import '../scss/_entry.scss';
import { initSidebar } from './sidebar.js';
import { initCassette } from './mixtape.js';

initSidebar();
initCassette('#mix-tape');
