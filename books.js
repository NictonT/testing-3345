// Configuration
const CONFIG = {
    // CSV file link for announcements
    csvUrl: 'YOUR_ANNOUNCEMENTS_CSV_URL_HERE',
    announcementsPerPage: 10
};

// State management
const state = {
    currentPage: 1,
    allAnnouncements: [],
    filteredAnnouncements: [],
};

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    announcementsContainer: document.getElementById('announcementsContainer'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    resultsCount: document.getElementById('resultsCount'),
    pagination: document.getElementById('pagination')
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadAnnouncements();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    elements.searchInput.addEventListener('input', debounce(applyFilters, 300));
}

// Announcements Loading
function loadAnnouncements() {
    showLoading(true);
    
    Papa.parse(CONFIG.csvUrl, {
        download: true,
        header: true,
        complete: (results) => {
            state.allAnnouncements = results.data
                .filter(announcement => announcement.title)
                .sort((a, b) => {
    // Sort by date first (closest dates come first)
    const now = new Date();
    const dateA = new Date(a.date || '');
    const dateB = new Date(b.date || '');
    const diffA = Math.abs(now - dateA);
    const diffB = Math.abs(now - dateB);
    if (diffA !== diffB) return diffA - diffB;
    
    // Then sort by title
    return (a['title'] || '').localeCompare(b['title'] || '');
});
state.filteredAnnouncements = [...state.allAnnouncements];
displayAnnouncements();
showLoading(false);
},
error: (error) => {
    console.error('Error loading announcements:', error);
    showError('Failed to load announcements. Please try again later.');
    showLoading(false);
}
    });
}

// Display Functions
function displayAnnouncements() {
    if (state.filteredAnnouncements.length === 0) {
        showNoResults();
        return;
    }

    const start = (state.currentPage - 1) * CONFIG.announcementsPerPage;
    const end = Math.min(start + CONFIG.announcementsPerPage, state.filteredAnnouncements.length);
    const announcementsToShow = state.filteredAnnouncements.slice(start, end);

    let html = '<div class="row">';
    
    announcementsToShow.forEach(announcement => {
        html += createAnnouncementCard(announcement);
    });

    html += '</div>';
    
    elements.announcementsContainer.innerHTML = html;
    updateResultsCount();
    updatePagination();
}

function createAnnouncementCard(announcement) {
    const title = announcement.title || 'Untitled';
    const date = new Date(announcement.date).toLocaleDateString();
    
    return `
        <div class="col-12 mb-4">
            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="card-title mb-0">${title}</h5>
                        <small class="text-muted">${date}</small>
                    </div>
                    <div class="d-flex justify-content-end mt-3">
                        <button class="btn btn-primary" onclick="viewMoreAnnouncement('${announcement.Id}')">
                            View More
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// View More Function Placeholder
function viewMoreAnnouncement(announcementId) {
    // View more place here
    // You can add view more function here
    console.log('View more clicked for announcement:', announcementId);
}

// Search and Filtering
function applyFilters() {
    const searchQuery = elements.searchInput.value.toLowerCase().trim();

    if (!searchQuery) {
        state.filteredAnnouncements = [...state.allAnnouncements];
    } else {
        state.filteredAnnouncements = state.allAnnouncements.filter(announcement => {
            return announcement.title?.toLowerCase().includes(searchQuery);
        });
    }

    state.currentPage = 1;
    displayAnnouncements();
}

function updateResultsCount() {
    const searchQuery = elements.searchInput.value.trim();
    
    if (searchQuery) {
        elements.resultsCount.innerHTML = `
            <div class="alert alert-info">
                Found ${state.filteredAnnouncements.length} announcement${state.filteredAnnouncements.length !== 1 ? 's' : ''}
            </div>
        `;
    } else {
        elements.resultsCount.innerHTML = '';
    }
}

function updatePagination() {
    const totalPages = Math.ceil(state.filteredAnnouncements.length / CONFIG.announcementsPerPage);
    
    elements.pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
        .map(page => `
            <li class="page-item ${page === state.currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${page}">${page}</a>
            </li>
        `).join('');

    elements.pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            changePage(parseInt(e.target.dataset.page));
        });
    });
}

// Utility Functions
function showNoResults() {
    elements.announcementsContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-warning">
                No announcements found matching your search.
            </div>
        </div>
    `;
    updateResultsCount();
    updatePagination();
}

function changePage(page) {
    state.currentPage = page;
    displayAnnouncements();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
    elements.announcementsContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">${message}</div>
        </div>
    `;
}

function showLoading(show) {
    elements.loadingIndicator.style.display = show ? 'block' : 'none';
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
