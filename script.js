// ============================================
// Global DOM Element References
// ============================================
const themeToggle = document.getElementById('themeToggle');
const topThemeToggle = document.getElementById('topThemeToggle');
const themeIcon = document.querySelector('.theme-icon');
const themeIconTop = document.querySelector('.theme-icon-top');
const themeLabel = document.querySelector('.theme-label');
const html = document.documentElement;

// Load small static utilities (favicon injector) without editing every HTML file
(function loadStaticUtilities() {
    try {
        const script = document.createElement('script');
        script.src = '/assets/static/favicon-inject.js';
        script.async = true;
        script.defer = false; // run as soon as downloaded; injector handles DOMContentLoaded
        document.head.appendChild(script);
    } catch (e) {
        console.error('Failed to load static utilities:', e);
    }
})();

const searchToggle = document.getElementById('searchToggle');
const searchDropdown = document.getElementById('searchDropdown');
const searchInput = document.getElementById('searchInput');
const topSearchInput = document.getElementById('topSearchInput');
const searchResults = document.getElementById('searchResults');

const highlightToggle = document.getElementById('highlightToggle');
const magnifyToggle = document.getElementById('magnifyToggle');
const fullscreenToggle = document.getElementById('fullscreenToggle');

// ============================================
// Theme Management
// ============================================

// Initialize theme from localStorage or default to dark
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

// Update theme button appearance
function updateThemeButton(theme) {
    if (theme === 'dark') {
        if (themeIcon) {
            themeIcon.className = 'bi bi-sun-fill theme-icon';
        }
        if (themeIconTop) {
            themeIconTop.className = 'bi bi-sun-fill theme-icon-top';
        }
        if (themeLabel) themeLabel.textContent = 'Light Mode';
    } else {
        if (themeIcon) {
            themeIcon.className = 'bi bi-moon-fill theme-icon';
        }
        if (themeIconTop) {
            themeIconTop.className = 'bi bi-moon-fill theme-icon-top';
        }
        if (themeLabel) themeLabel.textContent = 'Dark Mode';
    }
}

// Toggle theme
function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
}

// Event listeners for theme toggle
if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
if (topThemeToggle) topThemeToggle.addEventListener('click', toggleTheme);

// Initialize theme on page load
initTheme();

// ============================================
// Article Auto-Discovery System
// ============================================

let articlesData = [];

// Auto-discover and load all articles from docs folder
async function loadArticles() {
    try {
        // Try PHP-based auto-discovery first (works on servers with PHP)
        const discoveryResponse = await fetch('./discover-articles.php');
        
        if (discoveryResponse.ok) {
            const data = await discoveryResponse.json();
            
            if (data.success && data.articles) {
                articlesData = data.articles.map(article => ({
                    ...article,
                    fullText: `${article.title} ${article.description} ${article.category} ${(article.tags || []).join(' ')}`.toLowerCase()
                }));
                
                renderArticles(articlesData);
                
                if (searchResults) {
                    searchResults.innerHTML = '<div style="padding: 1rem; color: var(--text-muted); text-align: center;">Start typing to search...</div>';
                }
                
                console.log(`✅ Auto-discovered ${articlesData.length} articles (PHP)`);
                return;
            }
        }
    } catch (phpError) {
        console.log('PHP auto-discovery not available, trying pre-generated list...');
    }
    
    // Try pre-generated articles-list.json (for GitHub Pages / static hosting)
    try {
        const listResponse = await fetch('./articles-list.json');
        
        if (listResponse.ok) {
            const data = await listResponse.json();
            
            if (data.success && data.articles) {
                articlesData = data.articles.map(article => ({
                    ...article,
                    fullText: `${article.title} ${article.description} ${article.category} ${(article.tags || []).join(' ')}`.toLowerCase()
                }));
                
                renderArticles(articlesData);
                
                if (searchResults) {
                    searchResults.innerHTML = '<div style="padding: 1rem; color: var(--text-muted); text-align: center;">Start typing to search...</div>';
                }
                
                console.log(`✅ Loaded ${articlesData.length} articles from pre-generated list`);
                return;
            }
        }
    } catch (listError) {
        console.log('Pre-generated list not found, falling back to config file...');
    }
    
    // Final fallback: Load from articles-config.json (manual configuration)
    try {
        const configResponse = await fetch('./articles-config.json');
        const config = await configResponse.json();
        
        const baseFolder = config.baseFolder || 'docs';
        const articleFolders = config.articles || [];
        
        const articlePromises = articleFolders.map(async (folder) => {
            try {
                const metadataResponse = await fetch(`./${baseFolder}/${folder}/metadata.json`);
                const metadata = await metadataResponse.json();
                return {
                    ...metadata,
                    folder: folder,
                    url: `./${baseFolder}/${folder}/`,
                    fullText: `${metadata.title} ${metadata.description} ${metadata.category} ${(metadata.tags || []).join(' ')}`.toLowerCase()
                };
            } catch (error) {
                console.error(`Failed to load metadata for ${folder}:`, error);
                return null;
            }
        });
        
        const articles = await Promise.all(articlePromises);
        articlesData = articles.filter(article => article !== null);
        
        articlesData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        renderArticles(articlesData);
        
        if (searchResults) {
            searchResults.innerHTML = '<div style="padding: 1rem; color: var(--text-muted); text-align: center;">Start typing to search...</div>';
        }
        
        console.log(`⚠️ Loaded ${articlesData.length} articles from manual config`);
        console.log('💡 Tip: Run "node build-articles-list.js" to enable auto-discovery');
        
    } catch (error) {
        console.error('❌ Failed to load articles:', error);
        const articlesList = document.getElementById('articlesList');
        if (articlesList) {
            articlesList.innerHTML = '<p class="error-message">Failed to load articles. Please check the console for details.</p>';
        }
    }
}

// Render articles to the page
function renderArticles(articles) {
    const articlesList = document.getElementById('articlesList');
    if (!articlesList) return;
    
    if (articles.length === 0) {
        articlesList.innerHTML = '<p class="no-articles-message">No articles available yet.</p>';
        return;
    }
    
    articlesList.innerHTML = articles.map(article => {
        const dateObj = new Date(article.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        
        return `
            <article class="article-item" data-date="${article.date}" data-category="${article.category}">
                <time datetime="${article.date}">${formattedDate}</time>
                <h3><a href="${article.url}">${article.title}</a></h3>
                <p class="article-meta">${article.description}</p>
            </article>
        `;
    }).join('');
}

// Search and filter articles in main list
function searchArticles(query) {
    const searchTerm = query.toLowerCase().trim();
    const articleItems = document.querySelectorAll('.article-item');
    const noResults = document.getElementById('noResults');
    
    if (searchTerm === '') {
        // Show all articles if search is empty
        articleItems.forEach(article => {
            article.style.display = 'flex';
        });
        if (noResults) noResults.classList.add('hidden');
        return;
    }
    
    let visibleCount = 0;
    
    articlesData.forEach((article, index) => {
        const matches = article.fullText.includes(searchTerm);
        const articleElement = articleItems[index];
        
        if (articleElement) {
            if (matches) {
                articleElement.style.display = 'flex';
                visibleCount++;
            } else {
                articleElement.style.display = 'none';
            }
        }
    });
    
    // Show/hide no results message
    if (noResults) {
        if (visibleCount === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }
    }
}

// Top search dropdown with results
function searchArticlesDropdown(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchResults) return;
    
    if (searchTerm === '') {
        searchResults.innerHTML = '<div style="padding: 1rem; color: var(--text-muted); text-align: center;">Start typing to search...</div>';
        return;
    }
    
    const matches = articlesData.filter(article => 
        article.fullText.includes(searchTerm)
    );
    
    if (matches.length === 0) {
        searchResults.innerHTML = '<div style="padding: 1rem; color: var(--text-muted); text-align: center;">No results found</div>';
        return;
    }
    
    searchResults.innerHTML = matches.map(article => {
        const dateObj = new Date(article.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        
        return `
            <div class="search-result-item" onclick="window.location.href='${article.url}'">
                <h4>${article.title}</h4>
                <time>${formattedDate}</time>
                <p>${article.description}</p>
            </div>
        `;
    }).join('');
}

// Event listeners for search inputs
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchArticles(e.target.value);
    });
}

if (topSearchInput) {
    topSearchInput.addEventListener('input', (e) => {
        searchArticlesDropdown(e.target.value);
    });
}

// ============================================
// Top Toolbar Features
// ============================================

// Search Toggle
if (searchToggle && searchDropdown) {
    searchToggle.addEventListener('click', () => {
        searchDropdown.classList.toggle('hidden');
        searchToggle.classList.toggle('active');
        if (!searchDropdown.classList.contains('hidden') && topSearchInput) {
            topSearchInput.focus();
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchToggle.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.add('hidden');
            searchToggle.classList.remove('active');
        }
    });
}

// Highlighting Toggle
let highlightingEnabled = false;

if (highlightToggle) {
    highlightToggle.addEventListener('click', () => {
        highlightingEnabled = !highlightingEnabled;
        highlightToggle.classList.toggle('active');
        document.body.style.userSelect = highlightingEnabled ? 'text' : 'auto';
        
        if (highlightingEnabled) {
            enableHighlighting();
        } else {
            disableHighlighting();
        }
    });
}

function enableHighlighting() {
    document.addEventListener('mouseup', handleTextSelection);
}

function disableHighlighting() {
    document.removeEventListener('mouseup', handleTextSelection);
}

function handleTextSelection() {
    const selection = window.getSelection();
    if (selection.toString().length > 0 && highlightingEnabled) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'user-highlight';
        try {
            range.surroundContents(span);
        } catch (e) {
            // Handle cases where selection spans multiple elements
            console.log('Cannot highlight across multiple elements');
        }
    }
}

// Magnification Toggle
let magnificationEnabled = false;

if (magnifyToggle) {
    magnifyToggle.addEventListener('click', () => {
        magnificationEnabled = !magnificationEnabled;
        magnifyToggle.classList.toggle('active');
        document.body.classList.toggle('magnified');
        localStorage.setItem('magnification', magnificationEnabled);
    });

    // Restore magnification state
    const savedMagnification = localStorage.getItem('magnification') === 'true';
    if (savedMagnification) {
        magnificationEnabled = true;
        magnifyToggle.classList.add('active');
        document.body.classList.add('magnified');
    }
}

// Fullscreen Toggle
if (fullscreenToggle) {
    fullscreenToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                fullscreenToggle.classList.add('active');
            }).catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                fullscreenToggle.classList.remove('active');
            });
        }
    });

    // Update button state when fullscreen changes
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            fullscreenToggle.classList.remove('active');
        }
    });
}

// ============================================
// Accessibility: Keyboard Navigation
// ============================================

// Allow Enter key to trigger theme toggle
if (themeToggle) {
    themeToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTheme();
        }
    });
}

// Clear search with Escape key
if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            searchArticles('');
            searchInput.blur();
        }
    });
}

if (topSearchInput) {
    topSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            topSearchInput.value = '';
            searchArticlesDropdown('');
            if (searchDropdown) searchDropdown.classList.add('hidden');
            if (searchToggle) searchToggle.classList.remove('active');
        }
    });
}

// ============================================
// Initialize on Page Load
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Academic portfolio initialized');
    console.log('Theme:', html.getAttribute('data-theme'));
    
    // Load articles automatically
    loadArticles();
});
