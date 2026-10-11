import { defineConfig } from 'vite';

// Compiles the SASS in `src/scss` and the JavaScript in `src/js` into two
// ready-to-serve files: `public/css/app.css` and `public/js/app.js`.
// Run it locally with `npm run build`, then commit the two files.
// The site itself is plain static files served from the repo root, so no
// server-side build is ever needed (keeps GitHub Pages happy).
export default defineConfig({
	// `public/` is a normal folder we serve from the repo root, not Vite's
	// special public dir, so we switch that feature off.
	publicDir: false,
	base: './',
	build: {
		outDir: 'public',
		// `public/` also holds the music, images and fonts - never wipe it.
		emptyOutDir: false,
		// One stylesheet for the whole site.
		cssCodeSplit: false,
		sourcemap: false,
		rollupOptions: {
			input: 'src/js/_entry.js',
			output: {
				// Fixed names so index.html can always link them.
				entryFileNames: 'js/app.js',
				assetFileNames: 'css/app.css',
			},
		},
	},
});
