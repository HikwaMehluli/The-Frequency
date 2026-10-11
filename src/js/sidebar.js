// Opens and closes the sidebar menu.

export function initSidebar() {
	const menu = document.getElementById('sidebarMenu');
	const openBtn = document.getElementById('sidebarOpen');
	const closeBtn = document.getElementById('sidebarClose');
	const overlay = document.getElementById('sidebarOverlay');

	const show = () => {
		menu.classList.add('active');
		overlay.classList.add('active');
	};

	const hide = () => {
		menu.classList.remove('active');
		overlay.classList.remove('active');
	};

	openBtn.addEventListener('click', show);
	closeBtn.addEventListener('click', hide);
	overlay.addEventListener('click', hide);

	// Close the sidebar when pressing Escape.
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			hide();
		}
	});
}