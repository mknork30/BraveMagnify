// rules.js - To add translated Hover Zoom rules here.

window.MagnifierRules = {
    // Each key is a string that matches part of the website's hostname
    "amazon": function(img) {
        let src = img.src;
        if (img.hasAttribute('data-old-hires')) {
            return img.getAttribute('data-old-hires');
        }
        let amazonCleaned = src.replace(/\._[a-zA-Z0-9_]+_\./, '.');
        return amazonCleaned !== src ? amazonCleaned : null;
    },
    
    // Template to add more rules...
    "example_site": function(img) {
        // Logic goes here
        return null; 
    }
};

// The central function that applies the rules or falls back to native high-res
window.getBestImageSrc = function(img) {
    let hostname = window.location.hostname;

    // 1. Check our custom rules dictionary first
    for (const [site, ruleFunction] of Object.entries(window.MagnifierRules)) {
        if (hostname.includes(site)) {
            const highResUrl = ruleFunction(img);
            if (highResUrl) return highResUrl;
        }
    }

    // 2. Standard Fallback (srcset and parent links)
    if (img.srcset) {
        const sources = img.srcset.split(',').map(s => {
            const parts = s.trim().split(/\s+/);
            return { url: parts[0], width: parseInt(parts[1]) || 0 };
        });
        sources.sort((a, b) => b.width - a.width); 
        if (sources[0] && sources[0].url) return sources[0].url;
    }
    
    const parentLink = img.closest('a');
    if (parentLink && parentLink.href.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i)) {
        return parentLink.href;
    }

    return img.src;
};