// Service worker: caches music and sound files as they are played, so the
// album can keep playing (or at least resume) when the visitor goes offline.

const CACHE_NAME = 'the-frequency-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
		)
	);
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Only bother with our own music and sound files.
	const isAudio = url.pathname.startsWith('/music/') || url.pathname.startsWith('/sounds/');
	if (!isAudio) return;

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;

			return fetch(event.request).then((response) => {
				// Only full responses (status 200) can be stored. Audio range
				// requests come back as 206 (partial), which the Cache API
				// rejects, so we skip those.
				if (response.status === 200) {
					const copy = response.clone();
					caches.open(CACHE_NAME)
						.then((cache) => cache.put(event.request, copy))
						.catch(() => {});
				}
				return response;
			});
		})
	);
});