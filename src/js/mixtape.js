// The Frequency cassette player.
// One shared engine for the whole album: plays the songs, spins the wheels,
// and handles play / stop / rewind / forward / switch-side.

const SONGS_PATH = './public/music/';
const SOUNDS_PATH = './public/sounds/';

// Default settings. Change the order of `songs` here to change the album,
// and the tape sides + sidebar menu update automatically.
const DEFAULTS = {
	genreTitle: 'The Frequency',
	sideATitle: 'The Frequency - Side A',
	sideBTitle: 'The Frequency - Side B',
	songs: [
		'Ama Feelings',
		'Ama Feelings Instrumental',
		'Bass Culture (Amapiano Mix)',
		'Bass Culture Instrumental',
		'The Frequency Instrumental',
	],
	fallbackMessage: 'HTML5 audio not supported',
	initialVolume: 0.7,

	// The contact row at the bottom of the sidebar menu.
	contact: {
		whatsapp: '263785360392', // digits only, with country code
		whatsappLabel: 'WhatsApp',
		website: 'https://thatafro.netlify.app/',
		websiteLabel: 'Website',
		instagram: 'https://instagram.com/thatafro',
		instagramLabel: 'Instagram',
	},
};

// Pick the audio format the current browser can play.
const AUDIO_TYPE = getSupportedType();

function getSupportedType() {
	const audio = document.createElement('audio');
	if (audio.canPlayType('audio/mpeg')) return 'mp3';
	if (audio.canPlayType('audio/ogg')) return 'ogg';
	return 'mp3';
}

// Show a small themed pop-up in the middle of the screen. It fades in,
// disappears on its own after a few seconds, and can also be tapped to close.
let noticeModal;
let noticeTimer;

function showNotice(message) {
	if (!noticeModal) {
		noticeModal = document.createElement('div');
		noticeModal.className = 'modal-overlay';
		noticeModal.innerHTML = '<div class="modal-card"></div>';
		noticeModal.addEventListener('click', hideNotice);
		document.body.appendChild(noticeModal);
	}

	noticeModal.querySelector('.modal-card').textContent = message;
	noticeModal.classList.add('active');

	clearTimeout(noticeTimer);
	noticeTimer = setTimeout(hideNotice, 3000);
}

function hideNotice() {
	if (!noticeModal) return;
	clearTimeout(noticeTimer);
	noticeModal.classList.remove('active');
}

// Play a short effect from the /sounds folder. Returns the audio element so
// callers can keep looping sounds and stop them later.
function playSound(name, loop = false) {
	const audio = new Audio(`${SOUNDS_PATH}${name}.${AUDIO_TYPE}`);
	audio.loop = loop;
	audio.play().catch(() => {});
	return audio;
}

// One song on the tape.
class Song {
	constructor(name, id) {
		this.name = name;
		this.id = id;
		this.src = `${SONGS_PATH}${name}.${AUDIO_TYPE}`;
		this.duration = 0;
	}

	// Read just the song's length so the sides can be timed.
	load() {
		return new Promise((resolve) => {
			const probe = new Audio();
			probe.preload = 'metadata';
			probe.addEventListener('loadedmetadata', () => {
				this.duration = probe.duration;
				resolve();
			});
			// Never break the whole player for one missing song.
			probe.addEventListener('error', () => resolve());
			probe.src = this.src;
		});
	}
}

// One side of the cassette (a list of songs with a total running time).
class Side {
	constructor(name, songs, status) {
		this.name = name;
		this.songs = songs;
		this.status = status; // 'start', 'middle' or 'end'
		this.duration = songs.reduce((sum, song) => sum + song.duration, 0);
	}
}

// ---- Contact icons (drawn inline, no icon library needed) ----------- //

const WHATSAPP_ICON = `
	<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
		<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
	</svg>`;

const WEBSITE_ICON = `
	<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<circle cx="12" cy="12" r="10"/>
		<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
		<path d="M2 12h20"/>
	</svg>`;

const INSTAGRAM_ICON = `
	<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
		<path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>
	</svg>`;

export class Cassette {
	constructor(element, options = {}) {
		this.el = element;
		this.options = { ...DEFAULTS, ...options };

		this.sideNumber = 1; // 1 = Side A, 2 = Side B
		this.sideTime = 0; // current position within the active side (seconds)
		this.songStart = 0; // where the current song begins on the side
		this.elapsed = 0; // seconds travelled while rewinding / forwarding
		this.lastAction = ''; // 'play', 'rewind' or 'forward'
		this.isMoving = false;
		this.isSeeking = false;
		this.timerId = undefined;
		this.moveSound = undefined;
	}

	async init() {
		this.loader = this.el.querySelector('.pre-loader-container');

		// Read every song's duration (shows a loading percentage on the way).
		await this.createSides();

		// Loading is done: fade the loader out, build the player, then
		// let the tape and controls slide in.
		this.loader.classList.add('hidden');
		this.createPlayer();
		this.loadEvents();
		this.populatePlaylist();
		this.populateContact();
		this.updateTitles();
		this.el.classList.remove('loading');
		this.el.classList.add('ready');
	}

	// Split the album into two sides. Side A gets the extra track when the
	// album has an odd number of songs.
	async createSides() {
		const songs = this.options.songs.map((name, id) => new Song(name, id));
		const total = songs.length;
		const percentage = this.loader.querySelector('.percentage');
		let loaded = 0;

		const ready = songs.map((song) =>
			song.load().then(() => {
				loaded += 1;
				percentage.textContent = `${Math.round((loaded / total) * 100)}%`;
			})
		);

		await Promise.all(ready);

		const half = Math.ceil(total / 2);
		this.sideA = new Side('sideA', songs.slice(0, half), 'start');
		this.sideB = new Side('sideB', songs.slice(half), 'end');
	}

	activeSide() {
		return this.sideNumber === 1 ? this.sideA : this.sideB;
	}

	oppositeSide() {
		return this.sideNumber === 1 ? this.sideB : this.sideA;
	}

	createPlayer() {
		// The HTML5 audio element that actually plays the songs.
		this.audio = document.createElement('audio');
		this.audio.preload = 'auto';
		this.audio.innerHTML = `<span>${this.options.fallbackMessage}</span>`;
		this.audio.volume = this.options.initialVolume;
		this.el.prepend(this.audio);

		this.createControls();

		this.tape = this.el.querySelector('.tape-container');
		this.wheelLeft = this.tape.querySelector('.left-wheel');
		this.wheelRight = this.tape.querySelector('.right-wheel');
		this.coverA = this.tape.querySelector('.side-a-of-tape');
		this.coverB = this.tape.querySelector('.side-b-of-tape');
		this.coverA.style.display = 'block';
		this.coverB.style.display = 'none';
	}

	createControls() {
		this.el.insertAdjacentHTML('beforeend', `
			<ul class="controls-container">
				<li class="rewind-btn"><span></span></li>
				<li class="play-btn"><span></span></li>
				<li class="stop-btn"><span></span></li>
				<li class="forward-btn"><span></span></li>
				<li class="switch-btn"><span></span></li>
			</ul>
		`);

		this.rewindBtn = this.el.querySelector('.rewind-btn');
		this.playBtn = this.el.querySelector('.play-btn');
		this.stopBtn = this.el.querySelector('.stop-btn');
		this.forwardBtn = this.el.querySelector('.forward-btn');
		this.switchBtn = this.el.querySelector('.switch-btn');
	}

	loadEvents() {
		this.playBtn.addEventListener('click', () => this.play());
		this.stopBtn.addEventListener('click', () => this.stop());
		this.rewindBtn.addEventListener('click', () => this.rewind());
		this.forwardBtn.addEventListener('click', () => this.forward());
		this.switchBtn.addEventListener('click', () => this.switchSides());

		this.audio.addEventListener('timeupdate', () => {
			this.sideTime = this.songStart + this.audio.currentTime;
			this.updateWheelValue(this.getWheelValues(this.sideTime));
		});

		// When a song ends, carry on with the next one.
		this.audio.addEventListener('ended', () => {
			this.sideTime = this.songStart + this.audio.duration;
			this.play();
		});
	}

	play() {
		this.setButton('play');
		playSound('click');

		const info = this.updateStatus();
		if (!info) return;

		this.prepareSong(info);

		// Start once the song is ready to play.
		const startPlayback = () => {
			this.audio.currentTime = info.timeInSong;
			this.audio.play();
			this.isMoving = true;
			this.setWheelAnimation('2s', 'play');
			this.setPlaying(true);
		};

		// If the song is already loaded, start now; otherwise wait for `canplay`.
		if (this.audio.readyState >= 3) {
			startPlayback();
		} else {
			this.audio.addEventListener('canplay', startPlayback, { once: true });
		}
	}

	prepareSong(info) {
		const songs = this.activeSide().songs;
		this.audio.src = songs[info.songIndex].src;
	}

	stop(silent = false) {
		if (!silent) {
			this.setButton('stop');
			playSound('click');
		}
		this.isMoving = false;
		if (this.moveSound) {
			this.moveSound.pause();
			this.moveSound = undefined;
		}
		this.stopWheels();
		this.audio.pause();
		this.stopTimer();
		this.setPlaying(false);
	}

	// Work out exactly which song should be playing, from any point in time.
	updateStatus() {
		let pos = this.sideTime;

		// Pause quietly - we just need the current position.
		this.stop(true);
		this.setSidesStatus('middle');

		if (this.lastAction === 'forward') pos += this.elapsed;
		if (this.lastAction === 'rewind') pos -= this.elapsed;

		this.elapsed = 0;

		// We have run out of songs on this side.
		if (pos >= this.activeSide().duration) {
			this.stop();
			this.setSidesStatus('end');
			return null;
		}

		this.sideTime = Math.max(0, pos);
		this.songStart = this.getSongInfoByTime(this.sideTime).songStart;
		return this.getSongInfoByTime(this.sideTime);
	}

	getSongInfoByTime(time) {
		const songs = this.activeSide().songs;
		const safeTime = Math.max(0, time);
		let start = 0;

		for (let i = 0; i < songs.length; i += 1) {
			const end = start + songs[i].duration;
			if (end > safeTime) {
				return { songIndex: i, timeInSong: safeTime - start, songStart: start };
			}
			start = end;
		}

		// Past the last song: point at its very end.
		return { songIndex: songs.length - 1, timeInSong: start, songStart: start };
	}

	rewind() {
		if (this.activeSide().status === 'start') return;
		this.setButton('rewind');
		playSound('click');

		this.lastAction = 'rewind';
		this.updateStatus(true);

		this.isMoving = true;
		this.moveSound = playSound('rewind', true);
		this.setWheelAnimation('0.5s', 'rewind');
		this.startTimer();
	}

	forward() {
		if (this.activeSide().status === 'end') return;
		this.setButton('forward');
		playSound('click');

		this.lastAction = 'forward';
		this.updateStatus(true);

		this.isMoving = true;
		this.moveSound = playSound('fforward', true);
		this.setWheelAnimation('0.5s', 'forward');
		this.startTimer();
	}

	// Flip the tape over, keeping the same point in the album.
	switchSides() {
		if (this.isMoving) {
			showNotice('Please stop the music before you switch sides.');
			return;
		}

		playSound('switch');
		this.lastAction = '';

		this.sideNumber = this.sideNumber === 1 ? 2 : 1;
		const flipToSideB = this.sideNumber === 2;
		this.tape.style.transform = `rotate3d(0, 1, 0, ${flipToSideB ? -180 : 0}deg)`;

		setTimeout(() => {
			this.coverA.style.display = flipToSideB ? 'none' : 'block';
			this.coverB.style.display = flipToSideB ? 'block' : 'none';
			this.sideTime = this.wheelTime();
		}, 200);
	}

	// Let one control button look pressed at a time.
	setButton(name) {
		[this.playBtn, this.rewindBtn, this.forwardBtn, this.stopBtn].forEach((button) =>
			button.classList.remove('active-btn')
		);
		const pressed = { play: this.playBtn, rewind: this.rewindBtn, forward: this.forwardBtn };
		if (pressed[name]) pressed[name].classList.add('active-btn');
	}

	// Tell the page a song is playing, so themes can animate only while playing.
	setPlaying(playing) {
		document.body.classList.toggle('is-playing', playing);
	}

	setSidesStatus(status) {
		this.activeSide().status = status;
		const other = this.oppositeSide();
		if (status === 'middle') other.status = 'middle';
		if (status === 'start') other.status = 'end';
		if (status === 'end') other.status = 'start';
	}

	// ---- Wheel display -------------------------------- //

	getWheelValues(pos) {
		const duration = this.activeSide().duration;
		const fraction = duration ? pos / duration : 0;

		if (this.sideNumber === 1) {
			return { left: 70 - 70 * fraction, right: 70 * fraction };
		}
		return { left: 70 * fraction, right: 70 - 70 * fraction };
	}

	wheelTime() {
		const left = parseFloat(this.wheelLeft.dataset.wheel) || 70;
		const right = parseFloat(this.wheelRight.dataset.wheel) || 0;
		const duration = this.activeSide().duration;
		return this.sideNumber === 2 ? (duration * left) / 70 : (duration * right) / 70;
	}

	updateWheelValue({ left, right }) {
		this.wheelLeft.dataset.wheel = left;
		this.wheelRight.dataset.wheel = right;
		this.wheelLeft.style.boxShadow = `0 0 0 min(${left}px, 12vw) black`;
		this.wheelRight.style.boxShadow = `0 0 0 min(${right}px, 12vw) black`;
	}

	setWheelAnimation(speed, mode) {
		const anim = this.rotateDirection(mode);
		const value = `${anim} ${speed} linear infinite forwards`;
		this.wheelLeft.style.animation = value;
		this.wheelRight.style.animation = value;
	}

	rotateDirection(mode) {
		const forward = mode === 'play' || mode === 'forward';
		if (this.sideNumber === 1) return forward ? 'rotateLeft' : 'rotateRight';
		return forward ? 'rotateRight' : 'rotateLeft';
	}

	stopWheels() {
		this.wheelLeft.style.animation = 'none';
		this.wheelRight.style.animation = 'none';
	}

	// ---- Rewind / forward timer ------------------------ //

	startTimer() {
		this.elapsed = 0;
		this.isSeeking = true;
		this.setSidesStatus('middle');
		this.tickStart = Date.now();
		this.tickTime = 0;
		this.timerId = setTimeout(() => this.onTick(), 100);
	}

	onTick() {
		this.tickTime += 100;
		this.elapsed = Math.floor(this.tickTime / 20) / 10;

		const pos = this.lastAction === 'rewind'
			? this.sideTime - this.elapsed
			: this.sideTime + this.elapsed;

		this.updateWheelValue(this.getWheelValues(Math.max(0, pos)));

		// Reached the start or end of the side - stop moving.
		const duration = this.activeSide().duration;
		if (pos >= duration || pos <= 0) {
			this.stop();
			this.sideTime = pos <= 0 ? 0 : pos;
			this.elapsed = 0;
			this.setSidesStatus(pos <= 0 ? 'start' : 'end');
			return;
		}

		// Pad each tick to ~100ms so the speed stays accurate.
		const drift = Date.now() - this.tickStart - this.tickTime;
		if (this.isSeeking) {
			this.timerId = setTimeout(() => this.onTick(), 100 - drift);
		}
	}

	stopTimer() {
		clearTimeout(this.timerId);
		this.isSeeking = false;
	}

	// ---- Sidebar playlist & titles -------------------- //

	populatePlaylist() {
		const listA = document.getElementById('side-a-list');
		const listB = document.getElementById('side-b-list');
		listA.innerHTML = '';
		listB.innerHTML = '';

		const half = Math.ceil(this.options.songs.length / 2);
		this.options.songs.forEach((name, index) => {
			const item = document.createElement('li');
			item.textContent = name;
			(index < half ? listA : listB).appendChild(item);
		});
	}

	// The contact links shown at the bottom of the sidebar menu.
	populateContact() {
		const container = document.getElementById('sidebarContact');
		if (!container) return;

		const contact = this.options.contact;
		const links = [
			{ href: `https://wa.me/${contact.whatsapp}`, label: contact.whatsappLabel, icon: WHATSAPP_ICON },
			{ href: contact.website, label: contact.websiteLabel, icon: WEBSITE_ICON },
			{ href: contact.instagram, label: contact.instagramLabel, icon: INSTAGRAM_ICON },
		];

		container.innerHTML = '';
		links.forEach(({ href, label, icon }) => {
			const link = document.createElement('a');
			link.href = href;
			link.target = '_blank';
			link.rel = 'noopener';
			link.setAttribute('aria-label', label);
			link.innerHTML = icon;
			container.appendChild(link);
		});
	}

	updateTitles() {
		const { genreTitle, sideATitle, sideBTitle } = this.options;
		document.getElementById('music-genre-title').textContent = genreTitle;
		document.getElementById('side-a-title').textContent = sideATitle;
		document.getElementById('side-b-title').textContent = sideBTitle;
		this.coverA.querySelector('.tape-name').textContent = sideATitle;
		this.coverB.querySelector('.tape-name').textContent = sideBTitle;
	}
}

// Kick the player off from the page.
export function initCassette(selector, options = {}) {
	const element = document.querySelector(selector);
	if (element) return new Cassette(element, options).init();
	return undefined;
}