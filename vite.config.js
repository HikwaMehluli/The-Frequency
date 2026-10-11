import { defineConfig } from 'vite';

// Vite is the one build tool for this site.
// - `npm run dev`     starts the live-reload dev server
// - `npm run build`   compiles SASS + JS into the `dist/` folder
// - `npm run preview` serves the built `dist/` folder
export default defineConfig({
	base: './',
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
});
