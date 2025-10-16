// ============================================
// Posts Loading & Display System
// ============================================

let postsData = [];
let currentTagFilter = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Posts page initialized');
    
    // Theme toggle for posts page
    const postsThemeToggle = document.getElementById('postsThemeToggle');
    const html = document.documentElement;

    function updatePostsThemeButton(theme) {
        if (!postsThemeToggle) return;
        
        const icon = postsThemeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'bi bi-sun-fill';
        } else {
            icon.className = 'bi bi-moon-fill';
        }
    }

    function togglePostsTheme() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updatePostsThemeButton(newTheme);
    }

    // Initialize theme for posts page
    function initPostsTheme() {
        const savedTheme = localStorage.getItem('theme');
        const defaultTheme = savedTheme || 'light';
        
        html.setAttribute('data-theme', defaultTheme);
        updatePostsThemeButton(defaultTheme);
    }

    // Event listener for theme toggle
    if (postsThemeToggle) {
        postsThemeToggle.addEventListener('click', togglePostsTheme);
        console.log('Theme toggle button attached');
    } else {
        console.error('Theme toggle button not found!');
    }
    
    // Initialize theme
    initPostsTheme();
    
    // Set up sticky post title on scroll
    setupStickyPostTitles();
    
    // Load posts
    loadPosts();
});

// Setup sticky post title that appears in header when scrolling through posts
function setupStickyPostTitles() {
    const stickyTitleElement = document.getElementById('stickyPostTitle');
    if (!stickyTitleElement) return;
    
    let currentVisiblePost = null;
    let isFirstLoad = true;
    
    // Function to update title with flip animation
    function updateTitle(newTitle) {
        if (currentVisiblePost === newTitle) return;
        
        if (isFirstLoad) {
            // First time - just show it without animation
            stickyTitleElement.textContent = newTitle;
            stickyTitleElement.classList.add('visible');
            currentVisiblePost = newTitle;
            isFirstLoad = false;
        } else {
            // Flip animation for subsequent changes
            stickyTitleElement.classList.add('flip-out');
            
            setTimeout(() => {
                stickyTitleElement.textContent = newTitle;
                stickyTitleElement.classList.remove('flip-out');
                stickyTitleElement.classList.add('flip-in');
                currentVisiblePost = newTitle;
                
                setTimeout(() => {
                    stickyTitleElement.classList.remove('flip-in');
                }, 200);
            }, 200);
        }
    }
    
    // Intersection Observer to detect which post is currently in view
    const observerOptions = {
        root: null,
        rootMargin: '-120px 0px -50% 0px', // Trigger when post title is near top
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        // Find the most visible post
        let mostVisiblePost = null;
        let maxVisibility = 0;
        
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > maxVisibility) {
                maxVisibility = entry.intersectionRatio;
                mostVisiblePost = entry.target;
            }
        });
        
        // Update title based on most visible post
        if (mostVisiblePost) {
            const postTitle = mostVisiblePost.querySelector('.post-title');
            if (postTitle) {
                const titleText = postTitle.textContent;
                updateTitle(titleText);
            }
        }
        // Keep showing last post title even if scrolling past all posts
        // Don't hide it - it stays persistent
    }, observerOptions);
    
    // Observe all post cards
    const observePosts = () => {
        document.querySelectorAll('.post-card').forEach(card => {
            observer.observe(card);
        });
    };
    
    // Initial observation
    setTimeout(observePosts, 500);
    
    // Re-observe when posts are loaded/filtered
    const originalRenderPosts = window.renderPosts;
    if (typeof renderPosts === 'function') {
        window.renderPosts = function(...args) {
            const result = originalRenderPosts.apply(this, args);
            isFirstLoad = true; // Reset for new posts
            setTimeout(observePosts, 100);
            return result;
        };
    }
}

// Load posts from posts-list.json (similar to articles system)
async function loadPosts() {
    console.log('Starting to load posts...');
    try {
        const response = await fetch('./posts-list.json');
        console.log('Fetch response:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Loaded data:', data);
            
            if (data.success && data.posts) {
                postsData = data.posts;
                buildPopularTags();
                renderPosts(postsData);
                console.log(`✅ Loaded ${postsData.length} posts`);
                return;
            }
        }
    } catch (error) {
        console.error('Failed to load posts:', error);
    }
    
    // Show empty state if no posts
    console.log('Showing empty state');
    showEmptyState();
}

// Build popular tags from all posts - ONLY REAL TAGS
function buildPopularTags() {
    const tagCounts = {};
    
    // Count tag occurrences from actual posts
    postsData.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
            post.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
    
    // Sort by count and get top tags
    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Show top 10 tags
        .map(([tag]) => tag);
    
    // Render popular tags
    const popularTagsContainer = document.getElementById('popularTags');
    if (popularTagsContainer && sortedTags.length > 0) {
        popularTagsContainer.innerHTML = sortedTags.map(tag => 
            `<button class="tag-filter" data-tag="${tag}">#${tag}</button>`
        ).join('');
        
        // Add click handlers to tag filters
        document.querySelectorAll('.tag-filter').forEach(tagBtn => {
            tagBtn.addEventListener('click', (e) => {
                const tag = e.target.getAttribute('data-tag');
                
                // Toggle tag filter
                if (currentTagFilter === tag) {
                    currentTagFilter = null;
                    e.target.classList.remove('active');
                } else {
                    document.querySelectorAll('.tag-filter').forEach(t => t.classList.remove('active'));
                    currentTagFilter = tag;
                    e.target.classList.add('active');
                }
                
                applyFilters();
            });
        });
    }
}

// Render posts to the grid
function renderPosts(posts) {
    console.log('Rendering posts:', posts);
    const postsGrid = document.getElementById('postsGrid');
    const postsEmpty = document.getElementById('postsEmpty');
    
    if (!postsGrid) {
        console.error('postsGrid element not found!');
        return;
    }
    
    // Preserve timeline posts (static HTML content)
    const timelinePosts = postsGrid.querySelectorAll('.timeline-post');
    const timelineHTML = Array.from(timelinePosts).map(el => el.outerHTML).join('');
    
    if (posts.length === 0) {
        showEmptyState();
        return;
    }
    
    const postsHTML = posts.map(post => {
        const dateObj = new Date(post.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        
        // Generate image or gradient placeholder
        const imageHTML = post.image 
            ? `<img src="${post.image}" alt="${post.title}" class="post-card-image">`
            : `<div class="post-card-image"></div>`;
        
        // Generate tags HTML
        const tagsHTML = post.tags && post.tags.length > 0
            ? `<div class="post-card-tags">
                ${post.tags.slice(0, 3).map(tag => `<span class="post-tag">${tag}</span>`).join('')}
               </div>`
            : '';
        
        return `
            <a href="${post.url}" class="post-card">
                ${imageHTML}
                <div class="post-card-content">
                    <div class="post-card-meta">
                        <span class="post-card-date">
                            <i class="bi bi-calendar3"></i>
                            ${formattedDate}
                        </span>
                        ${post.category ? `<span class="post-card-category">${post.category}</span>` : ''}
                    </div>
                    <h2 class="post-card-title">${post.title}</h2>
                    <p class="post-card-excerpt">${post.excerpt || post.description}</p>
                    ${tagsHTML}
                    <span class="post-card-read-more">
                        Read more <i class="bi bi-arrow-right"></i>
                    </span>
                </div>
            </a>
        `;
    }).join('');
    
    // Combine timeline posts with dynamic posts
    postsGrid.innerHTML = timelineHTML + postsHTML;
    
    if (postsEmpty) {
        postsEmpty.classList.add('hidden');
    }
    
    console.log('Posts rendered successfully!');
}

// Show empty state
function showEmptyState() {
    console.log('Showing empty state');
    const postsGrid = document.getElementById('postsGrid');
    const postsEmpty = document.getElementById('postsEmpty');
    
    if (postsGrid) {
        // Preserve timeline posts even in empty state
        const timelinePosts = postsGrid.querySelectorAll('.timeline-post');
        const timelineHTML = Array.from(timelinePosts).map(el => el.outerHTML).join('');
        postsGrid.innerHTML = timelineHTML;
    }
    
    if (postsEmpty) {
        postsEmpty.classList.remove('hidden');
    }
}

// Filter posts based on search query
function filterPosts(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (searchTerm === '') {
        // Apply tag filter without search
        applyFilters();
        return;
    }
    
    // Filter posts by title, description, excerpt, category, or tags
    const filtered = postsData.filter(post => {
        const searchableText = `
            ${post.title} 
            ${post.description} 
            ${post.excerpt || ''} 
            ${post.category || ''} 
            ${(post.tags || []).join(' ')}
        `.toLowerCase();
        
        return searchableText.includes(searchTerm);
    });
    
    // Apply tag filter on top of search results
    const finalFiltered = applyFiltersToSet(filtered);
    renderPosts(finalFiltered);
    console.log(`Search filtered to ${finalFiltered.length} posts`);
}

// Apply tag filter (no more category filtering)
function applyFilters() {
    const filtered = applyFiltersToSet(postsData);
    renderPosts(filtered);
    console.log(`Filtered to ${filtered.length} posts (tag: ${currentTagFilter || 'none'})`);
}

// Apply filters to a given set of posts
function applyFiltersToSet(posts) {
    let filtered = posts;
    
    // Apply tag filter only
    if (currentTagFilter) {
        filtered = filtered.filter(post => 
            post.tags && post.tags.includes(currentTagFilter)
        );
    }
    
    return filtered;
}
