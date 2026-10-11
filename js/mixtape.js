// The Frequency cassette player.
// One shared engine for the whole album: plays the songs, spins the wheels,
// and handles play / stop / rewind / forward / switch-side.

const SONGS_PATH = '/music/';
const SOUNDS_PATH = '/sounds/';

// Default settings. Change the order of `songs` here to change the album,
// and the tape sides + sidebar menu update automatically.
const DEFAULTS = {
	genreTitle: 'The Frequency',
	sideATitle: 'The Frequency - Side A',
	sideBTitle: 'The Frequency - Side B',
	songs: [
		'Ama Feelings',
		'Bass Culture Instrumental',
		'Bass Culture (Amapiano Mix)',
		'Ama Feelings Instrumental',
		'The Frequency Instrumental',
	],
	fallbackMessage: 'HTML5 audio not supported',
	initialVolume: 0.7,
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