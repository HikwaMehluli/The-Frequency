// Service worker: keeps the album's music and sound effects in the browser
// after the first visit, so return listeners don't download them again.
// It works on any host, including GitHub Pages, which can't set cache headers.
// Audio URLs carry ?v=<MUSIC_VERSION> (see src/js/mixtape.js); bumping that
// number makes this worker fetch and store the new files automatically.

const CACHE_NAME = 'the-frequency-audio';

// Take over right away so the worker is ready before the listener presses play.
self.addEventListener('install', () => self.skipWaiting());

// When this file is updated, throw away old cache versions so generations
// never mix.
self.addEventListener('activate', (event) => {
	event.waitUntil(cleanUpOldCaches());
	self.clients.claim();
});

async function cleanUpOldCaches() {
	const names = await caches.keys();
	const old = names.filter((name) => name !== CACHE_NAME);
	await Promise.all(old.map((name) => caches.delete(name)));
}

// Only the big audio files are cached. Everything else loads from the network
// as normal, so page and app updates always come through.
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	const isAudio =
		url.pathname.includes('/public/music/') || url.pathname.includes('/public/sounds/');
	if (!isAudio) return;

	event.respondWith(serve(event.request));
});

async function serve(request) {
	const cache = await caches.open(CACHE_NAME);

	// Cache hit: use the saved file straight away.
	const saved = await cache.match(request);
	if (saved) return sliceIfAsked(saved, request);

	// Miss: fetch the whole file (browsers often ask in "range" chunks, so ask
	// for the full file so the cache always holds a complete copy).
	const cleanRequest = new Request(request.url);
	const fresh = await fetch(cleanRequest);
	if (!fresh.ok) return fresh;

	cache.put(cleanRequest, fresh.clone());
	forgetOlderVersions(cache, cleanRequest);

	return sliceIfAsked(fresh, request);
}

// Players ask for audio in small byte ranges ("range" header). The cache holds
// the whole file, so we cut out the exact piece that was asked for.
async function sliceIfAsked(response, request) {
	const sizes = response.headers.get('Content-Length');
	const range = request.headers.get('range');
	if (!range || !sizes) return response;

	const [fromText, toText] = range.replace('bytes=', '').split('-');
	let from = parseInt(fromText, 10);
	let to = toText ? parseInt(toText, 10) : Number(sizes) - 1;

	// A range like "bytes=-500" means "the last 500 bytes".
	if (Number.isNaN(from)) {
		from = Math.max(0, Number(sizes) - Number(toText));
		to = Number(sizes) - 1;
	}
	to = Math.min(to, Number(sizes) - 1);
	if (from > to) return new Response(null, { status: 416 });

	const buffer = await response.arrayBuffer();
	const piece = buffer.slice(from, to + 1);

	return new Response(piece, {
		status: 206,
		headers: {
			'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
			'Content-Range': `bytes ${from}-${to}/${buffer.byteLength}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': String(piece.byteLength),
		},
	});
}

// When MUSIC_VERSION changes the ?v= number, drop the old copy of that file so
// old versions never pile up in the browser.
async function forgetOlderVersions(cache, request) {
	const base = new URL(request.url).pathname;
	const keys = await cache.keys();
	await Promise.all(
		keys
			.filter((key) => key.url !== request.url && new URL(key.url).pathname === base)
			.map((key) => cache.delete(key))
	);
}