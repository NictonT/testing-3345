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

    let html = '';
    let currentPeriod = null;

    const now = new Date();
    
    announcementsToShow.forEach(announcement => {
        const announcementDate = new Date(announcement.date);
        const timeDiff = Math.floor((now - announcementDate) / (1000 * 60 * 60 * 24)); // difference in days
        
        let period;
        if (timeDiff < 0) {
            period = 'Upcoming';
        } else if (timeDiff === 0) {
            period = 'Today';
        } else if (timeDiff <= 7) {
            period = 'This Week';
        } else if (timeDiff <= 30) {
            period = 'This Month';
        } else {
            period = 'Older';
        }
        
        if (period !== currentPeriod) {
            if (html) html += '</div>'; // Close previous section
            html += `
                <div class="col-12">
                    <h4 class="mt-4 mb-3">${period}</h4>
                </div>
                <div class="row">
            `;
            currentPeriod = period;
        }
        
        html += createAnnouncementCard(announcement);
    });

    if (html) html += '</div>'; // Close last section
    
    elements.announcementsContainer.innerHTML = html;
    updateResultsCount();
    updatePagination();
}
//ghjklghfdgsfdfghjkliydssdfghjkl;'oiutssdfghjkl;'eertyuil
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
    try {
        const searchQuery = elements.searchInput.value.toLowerCase().trim();
        
        if (!searchQuery) {
            state.filteredAnnouncements = [...state.allAnnouncements];
        } else {
            state.filteredAnnouncements = state.allAnnouncements.filter(announcement => {
                return announcement.title?.toLowerCase().includes(searchQuery) ||
                       announcement.date?.toLowerCase().includes(searchQuery);
            });
        }
        
        // Sort by date after filtering
        const now = new Date();
        state.filteredAnnouncements.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            const diffA = Math.abs(now - dateA);
            const diffB = Math.abs(now - dateB);
            return diffA - diffB;
        });

        state.currentPage = 1;
        displayAnnouncements();
    } catch (error) {
        console.error('Error applying filters:', error);
        showError('An error occurred while filtering announcements.');
    }
}

function updateResultsCount() {
    try {
        const searchQuery = elements.searchInput.value.trim();
        const count = state.filteredAnnouncements.length;
        
        if (searchQuery) {
            elements.resultsCount.innerHTML = `
                <div class="alert ${count > 0 ? 'alert-info' : 'alert-warning'}">
                    ${count > 0 
                        ? `Found ${count} announcement${count !== 1 ? 's' : ''}`
                        : 'No announcements found matching your search'}
                </div>
            `;
        } else {
            elements.resultsCount.innerHTML = '';
        }
    } catch (error) {
        console.error('Error updating results count:', error);
    }
}

function updatePagination() {
    try {
        const totalPages = Math.ceil(state.filteredAnnouncements.length / CONFIG.announcementsPerPage);
        
        if (totalPages <= 1) {
            elements.pagination.innerHTML = '';
            return;
        }
        
        const currentPage = state.currentPage;
        const paginationHtml = [];
        
        // Previous button
        paginationHtml.push(`
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml.push(`
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        }
        
        // Next button
        paginationHtml.push(`
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `);
        
        elements.pagination.innerHTML = paginationHtml.join('');
        
        // Add event listeners
        elements.pagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const newPage = parseInt(e.target.closest('.page-link').dataset.page);
                if (!isNaN(newPage) && newPage !== currentPage) {
                    changePage(newPage);
                }
            });
        });
    } catch (error) {
        console.error('Error updating pagination:', error);
        elements.pagination.innerHTML = '';
    }
}

// Utility Functions
function showNoResults() {
    elements.announcementsContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-circle me-2"></i>
                No announcements found matching your search criteria.
                <br>
                <small>Try adjusting your search terms.</small>
            </div>
        </div>
    `;
    updateResultsCount();
    updatePagination();
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(state.filteredAnnouncements.length / CONFIG.announcementsPerPage)) {
        return;
    }
    state.currentPage = page;
    displayAnnouncements();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
    elements.announcementsContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
                <br>
                <small>Please try again or contact support if the problem persists.</small>
            </div>
        </div>
    `;
}

function showLoading(show) {
    if (elements.loadingIndicator) {
        elements.loadingIndicator.style.display = show ? 'block' : 'none';
        if (show) {
            elements.announcementsContainer.innerHTML = `
                <div class="text-center my-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
        }
    }
}

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    const totalPages = Math.ceil(state.filteredAnnouncements.length / CONFIG.announcementsPerPage);
    
    if (e.key === 'ArrowLeft' && state.currentPage > 1) {
        changePage(state.currentPage - 1);
    } else if (e.key === 'ArrowRight' && state.currentPage < totalPages) {
        changePage(state.currentPage + 1);
    }
});
