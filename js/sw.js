const CACHE_NAME = 'mixtape-cache-v1';
const FILES_TO_CACHE = [
	// 🎵 ADD Songs
	'../songs/Bitches Ain t Shit - Dr.Dre.mp3',
	'../songs/Chin Check - N.W.A.mp3',
	'../songs/2 of Amerikaz most wanted.mp3',
	'../songs/Vato - Snoop Dogg ft B-Real.mp3',

	'../songs/Bad Boyz - Shyne.mp3',
	'../songs/Warning - Notorious B.I.G.mp3',
	'../songs/We Right Here - DMX.mp3',
	'../songs/Ante Up (Remix) - M.O.P ft Busta Rhymes, Tephlon, Remy Martin.mp3',


	'../songs/U Know Whats Up - Donell Jones.mp3',
	'../songs/All I Have - Jennifer Lopez ft LL Cool J.mp3',
	'../songs/Delema - Nelly ft Kelly Rowland.mp3',
	'../songs/Whats love - FatJoe ft Ja-Rule & Ashanti.mp3',

	'../songs/All My Life - K-Ci & Jojo.mp3',
	'../songs/Candy Rain - Soul For Real.mp3',
	'../songs/Put That Woman First - Jaheim.mp3',
	'../songs/Rendezvous - Craig David.mp3',

	'../songs/Uthando ft Nokwazi, Lowsheen, Caltonic SA.mp3',
	'../songs/Trust The Process - Tebza De DJ ft Tanaka.mp3',
	'../songs/Bula - Ntate Stunna ft Nthabi Sings.mp3',
	'../songs/Ngiyamthanda - Intaba Yase Dubai.mp3',

	'../songs/iMpumelelo - Sam Deep, Eemoh, Da Muziqal Chef.mp3',
	'../songs/Paris.mp3',
	'../songs/Ghetto Scandalous - Zola & Kabelo.mp3',
	'../songs/Champion Sound.mp3',

	// 🔊 ADD Sound effects
	'../sounds/click.mp3',
	'../sounds/click.ogg',
	'../sounds/fforward.mp3',
	'../sounds/fforward.ogg',
	'../sounds/rewind.mp3',
	'../sounds/rewind.ogg',
	'../sounds/switch.ogg',
	'../sounds/switch.mp3',

	// ADD SCRIPTS
	'../css/app.css',
	'../js/jquery.min.js',
	'../js/mixtape-amapiano.js',
	'../js/mixtape-gangster.js',
	'../js/mixtape-love.js',
	'../js/sidebar.js',
];

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(keys =>
			Promise.all(
				keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
			)
		)
	);
});

self.addEventListener('fetch', event => {
	const req = event.request;
	
	// Only intercept your songs/sfx
	if (req.url.includes('../songs/') || req.url.includes('../sounds/')) {
		event.respondWith(
			caches.match(req).then(cachedRes => cachedRes || fetch(req))
		);
	}
});