// ============================================
// Auto Table of Contents for Article Pages
// ============================================

// Only run on article pages (inside docs/ folder)
if (window.location.pathname.includes('/docs/')) {
    document.addEventListener('DOMContentLoaded', () => {
        initTableOfContents();
    });
}

function initTableOfContents() {
    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    // Find all headings (h2 and h3) in article sections
    const headings = articleContent.querySelectorAll('.article-section h2, .article-section h3');
    if (headings.length === 0) return;

    // Create TOC container
    const tocContainer = document.createElement('div');
    tocContainer.className = 'toc-container';
    tocContainer.innerHTML = `
        <button class="toc-toggle" aria-label="Toggle Table of Contents">
            <i class="bi bi-list"></i>
        </button>
        <nav class="toc-sidebar">
            <div class="toc-header">
                <h3><i class="bi bi-list-ul"></i> Contents</h3>
                <button class="toc-close" aria-label="Close">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <div class="toc-content">
                <ul class="toc-list"></ul>
            </div>
        </nav>
        <div class="toc-overlay"></div>
    `;

    document.body.appendChild(tocContainer);

    const tocList = tocContainer.querySelector('.toc-list');
    const tocToggle = tocContainer.querySelector('.toc-toggle');
    const tocClose = tocContainer.querySelector('.toc-close');
    const tocSidebar = tocContainer.querySelector('.toc-sidebar');
    const tocOverlay = tocContainer.querySelector('.toc-overlay');

    // Generate TOC items and add IDs to headings
    headings.forEach((heading, index) => {
        // Create unique ID for heading
        const id = `toc-heading-${index}`;
        heading.id = id;

        // Create TOC item
        const li = document.createElement('li');
        li.className = heading.tagName.toLowerCase() === 'h3' ? 'toc-item-sub' : 'toc-item';
        
        const link = document.createElement('a');
        link.href = `#${id}`;
        link.textContent = heading.textContent;
        link.className = 'toc-link';
        
        // Smooth scroll to heading
        link.addEventListener('click', (e) => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Close sidebar on mobile after clicking
            if (window.innerWidth < 1024) {
                closeTOC();
            }
            
            // Update active state
            updateActiveTOC(link);
        });

        li.appendChild(link);
        tocList.appendChild(li);
    });

    // Toggle TOC
    function openTOC() {
        tocSidebar.classList.add('open');
        tocOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function closeTOC() {
        tocSidebar.classList.remove('open');
        tocOverlay.classList.remove('visible');
        document.body.style.overflow = '';
    }

    tocToggle.addEventListener('click', openTOC);
    tocClose.addEventListener('click', closeTOC);
    tocOverlay.addEventListener('click', closeTOC);

    // Update active TOC item on scroll
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateActiveOnScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    function updateActiveOnScroll() {
        const scrollPos = window.scrollY + 100;
        let currentActive = null;

        headings.forEach((heading) => {
            if (heading.offsetTop <= scrollPos) {
                currentActive = heading.id;
            }
        });

        if (currentActive) {
            const activeLink = tocList.querySelector(`a[href="#${currentActive}"]`);
            updateActiveTOC(activeLink);
        }
    }

    function updateActiveTOC(activeLink) {
        // Remove all active states
        tocList.querySelectorAll('.toc-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active state to current
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Handle responsive behavior
    function handleResize() {
        if (window.innerWidth >= 1024) {
            // Desktop: always show TOC
            tocSidebar.classList.add('open');
            tocOverlay.classList.remove('visible');
            document.body.style.overflow = '';
        } else {
            // Mobile: close TOC by default
            if (!tocSidebar.classList.contains('open')) {
                tocOverlay.classList.remove('visible');
            }
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
}
