# The Frequency by thatAfro

A musical album turned into an **interactive cassette tape** you click and listen to.
Press play, rewind, fast-forward — just like the old days.

**Live demo:** [thatafro.netlify.app](https://thatafro.netlify.app/)

This project is meant to **inspire non-coders**. If you have never built a website
before, you are in the right place: everything here is plain HTML, simple styling and
one small vanilla JavaScript file — no framework, no jQuery, no complicated setup.

## What is it?

It is a normal website. The page shows a picture of an old-school cassette player.
Behind the scenes, a small script plays the album songs from the `public/music/`
folder, and the menu (the ☰ button) lists the tracks on each side.

## Try it on your computer

You need [Node.js](https://nodejs.org) installed first. Then, in a terminal in this folder:

```bash
# 1. Install the helper tools (only needed once)
npm install

# 2. Start the dev server, then open the link it prints
npm run dev
```

`npm run dev` opens the site **on your network too**, so phones or tablets on the
same Wi-Fi can play it by visiting the extra "Network" address it prints (for example
`http://192.168.1.102:5173/`). The dev server watches your files: save a change and
the page updates by itself.

To build a finished, production-ready version of the site into a `dist/` folder:

```bash
npm run build        # one-time build
npm run preview      # serve the built version to check it
```

## What's in each folder

- `index.html` — the page. Open this to see the player.
- `js/` — the scripts. `mixtape.js` is the cassette engine, `main.js` is the entry point.
- `scss/` — the **styling source**. Edit these files (Vite turns them into CSS for you).
- `public/` — files served exactly as they are:
  - `public/img/` — the tape graphics and backgrounds
  - `public/fonts/` — the icons used on the buttons
  - `public/sounds/` — the little click / rewind sounds
  - `public/music/` — **the album audio, where your songs live**
- `dist/` — the finished build, made by `npm run build`. Do not edit by hand.

## Change the album

Everything about the track list lives at the top of `js/mixtape.js`, in the
`DEFAULTS` object:

- `songs` — the album, in order. **This one list drives both the tape sides and
  the ☰ sidebar menu**, so you only edit it in one place.
- `sideATitle` and `sideBTitle` — rename the two sides.

The songs are split evenly across Side A and Side B, and **Side A gets the extra
track** when the album has an odd number of songs. Just reorder, add or remove
names and both the tape and the menu update by themselves.

Each name must match an audio file in `public/music/` (without the extension):
`'Ama Feelings'` plays `public/music/Ama Feelings.mp3`.

## Build on it

Feel free to play, take it apart and make it your own. Keep it simple and tidy, and
have fun — that is the whole point.

## License

This project is free to use, share and build on. It uses two licenses:

- **The code** (HTML, SCSS and JavaScript) is under the **MIT License** — see
  [`LICENSE`](LICENSE). Use it, change it, even sell it, as long as you keep the
  copyright notice.
- **The music** (the songs in `public/music/`) is under the **Creative Commons
  Attribution 4.0 (CC BY 4.0)** license — see
  [`LICENSE-MUSIC.md`](LICENSE-MUSIC.md). Share, remix or reuse the songs (even
  commercially) as long as you **credit thatAfro**.

Please credit the music like this:

> Music by thatAfro — https://thatafro.netlify.app

---

Made with love by [thatAfro](https://thatafro.netlify.app).