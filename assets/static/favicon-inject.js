(function () {
    // Simple favicon injector used site-wide. Points to /assets/static/favicon.png
    const faviconPath = '/assets/static/favicon.png';

    function setFavicon(href, rel = 'icon', type = 'image/png') {
        try {
            let link = document.querySelector(`link[rel="${rel}"]`);
            if (link) {
                link.href = href;
                return;
            }
            link = document.createElement('link');
            link.rel = rel;
            link.type = type;
            link.href = href;
            document.head.appendChild(link);
        } catch (e) {
            // swallow - non-critical
            console.error('setFavicon error', e);
        }
    }

    function setAppleTouch(href) {
        try {
            let link = document.querySelector('link[rel="apple-touch-icon"]');
            if (link) {
                link.href = href;
                return;
            }
            link = document.createElement('link');
            link.rel = 'apple-touch-icon';
            link.href = href;
            document.head.appendChild(link);
        } catch (e) {
            console.error('setAppleTouch error', e);
        }
    }

    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                setFavicon(faviconPath);
                setAppleTouch(faviconPath);
            });
        } else {
            setFavicon(faviconPath);
            setAppleTouch(faviconPath);
        }
    } catch (e) {
        console.error('favicon-inject init failed', e);
    }
})();
