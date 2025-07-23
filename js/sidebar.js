// Get DOM elements
const sidebarMenu = document.getElementById('sidebarMenu');
const sidebarOpen = document.getElementById('sidebarOpen');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Function to show sidebar
function showSidebar() {
    sidebarMenu.classList.add('active');
    sidebarOverlay.classList.add('active');
}

// Function to hide sidebar
function hideSidebar() {
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
}

// Event listeners
sidebarOpen.addEventListener('click', showSidebar);
sidebarClose.addEventListener('click', hideSidebar);
sidebarOverlay.addEventListener('click', hideSidebar);

// Close sidebar when pressing Escape key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        hideSidebar();
    }
});