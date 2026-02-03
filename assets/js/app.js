/**
 * DARK FANTASY PORTFOLIO - MAIN APPLICATION
 * 
 * Funkcjonalności:
 * - Ładowanie galerii z data.json
 * - Lightbox z nawigacją
 * - System komentarzy (localStorage)
 * - System recenzji (localStorage)
 * - Filtrowanie po tagach
 * - Export/Import danych
 */

// ====================================
// CONFIGURATION
// ====================================
const CONFIG = {
    dataUrl: './assets/data.json',
    storageKeys: {
        comments: 'darkFantasyComments',
        reviews: 'darkFantasyReviews'
    }
};

// ====================================
// STATE MANAGEMENT
// ====================================
let artworks = [];
let currentArtworkIndex = 0;
let allTags = new Set();

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Format date to readable string
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

/**
 * Get data from localStorage
 */
function getLocalData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return [];
    }
}

/**
 * Save data to localStorage
 */
function saveLocalData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ====================================
// DATA LOADING
// ====================================

/**
 * Load artworks from data.json
 */
async function loadArtworks() {
    const galleryEl = document.getElementById('gallery');
    
    try {
        const response = await fetch(CONFIG.dataUrl);
        
        if (!response.ok) {
            throw new Error('Failed to load artworks');
        }
        
        const data = await response.json();
        artworks = data.artworks || [];
        
        if (artworks.length === 0) {
            showEmptyState();
            return;
        }
        
        // Extract all unique tags
        artworks.forEach(artwork => {
            if (artwork.tags && Array.isArray(artwork.tags)) {
                artwork.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        renderGallery();
        renderFilterTags();
        
    } catch (error) {
        console.error('Error loading artworks:', error);
        showErrorState();
    }
}

/**
 * Show empty state when no artworks
 */
function showEmptyState() {
    const galleryEl = document.getElementById('gallery');
    galleryEl.innerHTML = `
        <div class="gallery__loading">
            <h3>Brak dzieł w galerii</h3>
            <p>Dodaj swoje pierwsze dzieło używając panelu administratora.</p>
            <a href="./admin.html" class="btn btn--primary" style="margin-top: 2rem;">
                <span>Przejdź do Panelu</span>
            </a>
        </div>
    `;
}

/**
 * Show error state
 */
function showErrorState() {
    const galleryEl = document.getElementById('gallery');
    galleryEl.innerHTML = `
        <div class="gallery__loading">
            <h3>Błąd ładowania galerii</h3>
            <p>Upewnij się, że plik <code>assets/data.json</code> istnieje i jest poprawny.</p>
            <p style="margin-top: 1rem; color: var(--muted); font-size: 0.9rem;">
                Sprawdź README.md aby dowiedzieć się jak skonfigurować galerię.
            </p>
        </div>
    `;
}

// ====================================
// GALLERY RENDERING
// ====================================

/**
 * Render gallery grid
 */
function renderGallery(filterTag = 'all') {
    const galleryEl = document.getElementById('gallery');
    
    const filtered = filterTag === 'all' 
        ? artworks 
        : artworks.filter(artwork => artwork.tags && artwork.tags.includes(filterTag));
    
    if (filtered.length === 0) {
        galleryEl.innerHTML = `
            <div class="gallery__loading">
                <p>Brak dzieł z tagiem "${filterTag}"</p>
            </div>
        `;
        return;
    }
    
    galleryEl.innerHTML = filtered.map((artwork, index) => `
        <article class="gallery__item" 
                 data-index="${artworks.indexOf(artwork)}"
                 style="animation-delay: ${index * 0.1}s">
            <img src="${artwork.image}" 
                 alt="${artwork.alt || artwork.title}"
                 class="gallery__image"
                 loading="lazy">
            <div class="gallery__overlay">
                <h3 class="gallery__title">${artwork.title}</h3>
                <p class="gallery__meta">${artwork.year} • ${artwork.technique}</p>
                <div class="gallery__tags">
                    ${artwork.tags ? artwork.tags.map(tag => 
                        `<span class="tag">${tag}</span>`
                    ).join('') : ''}
                </div>
            </div>
        </article>
    `).join('');
    
    // Add click listeners
    document.querySelectorAll('.gallery__item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            openLightbox(index);
        });
    });
}

/**
 * Render filter tags
 */
function renderFilterTags() {
    const filterEl = document.getElementById('filter');
    
    const tagsHTML = Array.from(allTags).map(tag => `
        <button class="filter__btn" data-filter="${tag}">${tag}</button>
    `).join('');
    
    filterEl.innerHTML = `
        <button class="filter__btn filter__btn--active" data-filter="all">Wszystkie</button>
        ${tagsHTML}
    `;
    
    // Add filter listeners
    filterEl.querySelectorAll('.filter__btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterEl.querySelectorAll('.filter__btn').forEach(b => 
                b.classList.remove('filter__btn--active')
            );
            btn.classList.add('filter__btn--active');
            
            // Filter gallery
            const filter = btn.dataset.filter;
            renderGallery(filter);
        });
    });
}

// ====================================
// LIGHTBOX
// ====================================

/**
 * Open lightbox with artwork
 */
function openLightbox(index) {
    currentArtworkIndex = index;
    const artwork = artworks[index];
    
    const lightbox = document.getElementById('lightbox');
    const image = document.getElementById('lightboxImage');
    const title = document.getElementById('lightboxTitle');
    const year = document.getElementById('lightboxYear');
    const technique = document.getElementById('lightboxTechnique');
    const dimensions = document.getElementById('lightboxDimensions');
    const description = document.getElementById('lightboxDescription');
    const tagsEl = document.getElementById('lightboxTags');
    
    // Set content
    image.src = artwork.image;
    image.alt = artwork.alt || artwork.title;
    title.textContent = artwork.title;
    year.textContent = artwork.year;
    technique.textContent = artwork.technique;
    dimensions.textContent = artwork.dimensions || 'N/A';
    description.textContent = artwork.description;
    
    // Set tags
    if (artwork.tags && artwork.tags.length > 0) {
        tagsEl.innerHTML = artwork.tags.map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('');
    } else {
        tagsEl.innerHTML = '';
    }
    
    // Load comments
    renderComments(artwork.id);
    
    // Show lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close lightbox
 */
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Navigate to previous artwork
 */
function previousArtwork() {
    currentArtworkIndex = (currentArtworkIndex - 1 + artworks.length) % artworks.length;
    openLightbox(currentArtworkIndex);
}

/**
 * Navigate to next artwork
 */
function nextArtwork() {
    currentArtworkIndex = (currentArtworkIndex + 1) % artworks.length;
    openLightbox(currentArtworkIndex);
}

// ====================================
// COMMENTS SYSTEM
// ====================================

/**
 * Render comments for artwork
 */
function renderComments(artworkId) {
    const commentsListEl = document.getElementById('commentsList');
    const allComments = getLocalData(CONFIG.storageKeys.comments);
    const artworkComments = allComments.filter(c => c.artworkId === artworkId);
    
    if (artworkComments.length === 0) {
        commentsListEl.innerHTML = '<p style="color: var(--muted); font-style: italic;">Brak komentarzy. Bądź pierwszy!</p>';
        return;
    }
    
    // Sort by date (newest first)
    artworkComments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    commentsListEl.innerHTML = artworkComments.map(comment => `
        <div class="comment">
            <div class="comment__header">
                <span class="comment__author">${comment.name}</span>
                <span class="comment__date">${formatDate(comment.date)}</span>
            </div>
            <p class="comment__text">${comment.text}</p>
        </div>
    `).join('');
}

/**
 * Add new comment
 */
function addComment(artworkId, name, email, text) {
    const comments = getLocalData(CONFIG.storageKeys.comments);
    
    const newComment = {
        id: generateId(),
        artworkId: artworkId,
        name: name,
        email: email || null,
        text: text,
        date: new Date().toISOString()
    };
    
    comments.push(newComment);
    saveLocalData(CONFIG.storageKeys.comments, comments);
    
    // Re-render comments
    renderComments(artworkId);
}

// ====================================
// REVIEWS SYSTEM
// ====================================

/**
 * Render all reviews
 */
function renderReviews() {
    const reviewsListEl = document.getElementById('reviewsList');
    const reviews = getLocalData(CONFIG.storageKeys.reviews);
    
    if (reviews.length === 0) {
        reviewsListEl.innerHTML = '<p style="color: var(--muted); text-align: center; font-style: italic;">Brak recenzji. Dodaj pierwszą!</p>';
        updateOverallRating(0, 0);
        return;
    }
    
    // Sort by date (newest first)
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    reviewsListEl.innerHTML = reviews.map(review => `
        <div class="review">
            <div class="review__header">
                <div>
                    <div class="review__author">${review.name}</div>
                    <div class="review__date">${formatDate(review.date)}</div>
                </div>
                <div class="review__rating">
                    ${renderStars(review.rating)}
                </div>
            </div>
            <p class="review__text">${review.text}</p>
        </div>
    `).join('');
    
    // Update overall rating
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    updateOverallRating(avgRating, reviews.length);
}

/**
 * Render star icons
 */
function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= rating ? 'filled' : '';
        html += `
            <svg class="star ${filled}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }
    return html;
}

/**
 * Update overall rating display
 */
function updateOverallRating(avgRating, count) {
    const ratingEl = document.getElementById('overallRating');
    const starsEl = ratingEl.querySelector('.stars');
    const countEl = ratingEl.querySelector('.reviews__count');
    
    starsEl.innerHTML = renderStars(Math.round(avgRating));
    countEl.textContent = `${count} ${count === 1 ? 'recenzja' : 'recenzji'}`;
}

/**
 * Add new review
 */
function addReview(name, rating, text) {
    const reviews = getLocalData(CONFIG.storageKeys.reviews);
    
    const newReview = {
        id: generateId(),
        name: name,
        rating: parseInt(rating),
        text: text,
        date: new Date().toISOString()
    };
    
    reviews.push(newReview);
    saveLocalData(CONFIG.storageKeys.reviews, reviews);
    
    // Re-render reviews
    renderReviews();
}

// ====================================
// EXPORT/IMPORT FUNCTIONALITY
// ====================================

/**
 * Export all data to JSON
 */
function exportData() {
    const data = {
        comments: getLocalData(CONFIG.storageKeys.comments),
        reviews: getLocalData(CONFIG.storageKeys.reviews),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Import data from JSON
 */
function importData(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.comments) {
                saveLocalData(CONFIG.storageKeys.comments, data.comments);
            }
            
            if (data.reviews) {
                saveLocalData(CONFIG.storageKeys.reviews, data.reviews);
                renderReviews();
            }
            
            alert('Dane zaimportowane pomyślnie!');
            location.reload();
            
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Błąd importu. Sprawdź plik JSON.');
        }
    };
    
    reader.readAsText(file);
}

// ====================================
// EVENT LISTENERS
// ====================================

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Lightbox controls
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', previousArtwork);
    document.getElementById('lightboxNext').addEventListener('click', nextArtwork);
    
    // Close lightbox on overlay click
    document.getElementById('lightbox').addEventListener('click', (e) => {
        if (e.target.id === 'lightbox') {
            closeLightbox();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') previousArtwork();
        if (e.key === 'ArrowRight') nextArtwork();
    });
    
    // Comment form
    document.getElementById('commentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('commentName').value.trim();
        const email = document.getElementById('commentEmail').value.trim();
        const text = document.getElementById('commentText').value.trim();
        
        if (!name || !text) {
            alert('Wypełnij wymagane pola!');
            return;
        }
        
        const artwork = artworks[currentArtworkIndex];
        addComment(artwork.id, name, email, text);
        
        // Reset form
        e.target.reset();
    });
    
    // Review modal
    const reviewModal = document.getElementById('reviewModal');
    const addReviewBtn = document.getElementById('addReviewBtn');
    const reviewModalClose = document.getElementById('reviewModalClose');
    const reviewModalOverlay = document.getElementById('reviewModalOverlay');
    
    addReviewBtn.addEventListener('click', () => {
        reviewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    reviewModalClose.addEventListener('click', () => {
        reviewModal.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    reviewModalOverlay.addEventListener('click', () => {
        reviewModal.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // Rating input
    const ratingInput = document.getElementById('ratingInput');
    const ratingHidden = document.getElementById('reviewRating');
    
    ratingInput.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const rating = parseInt(btn.dataset.rating);
            ratingHidden.value = rating;
            
            // Update visual state
            ratingInput.querySelectorAll('.star-btn').forEach((star, index) => {
                if (index < rating) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            });
        });
    });
    
    // Review form
    document.getElementById('reviewForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('reviewName').value.trim();
        const rating = document.getElementById('reviewRating').value;
        const text = document.getElementById('reviewText').value.trim();
        
        if (!name || !rating || !text) {
            alert('Wypełnij wszystkie pola!');
            return;
        }
        
        addReview(name, rating, text);
        
        // Close modal and reset form
        reviewModal.classList.remove('active');
        document.body.style.overflow = '';
        e.target.reset();
        ratingHidden.value = '';
        ratingInput.querySelectorAll('.star-btn').forEach(star => {
            star.classList.remove('active');
        });
    });
}

// ====================================
// INITIALIZATION
// ====================================

/**
 * Initialize application
 */
async function init() {
    await loadArtworks();
    renderReviews();
    initEventListeners();
    
    console.log('🎨 Dark Fantasy Portfolio initialized');
    console.log('💾 LocalStorage data can be exported/imported');
    console.log('🔧 Use admin panel to add artworks');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Expose export/import functions globally for admin panel
window.portfolioExport = exportData;
window.portfolioImport = importData;