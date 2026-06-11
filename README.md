# BraveMagnify

A Chromium extension that provides a persistent, interactive modal for magnifying images on hover. It runs entirely on vanilla JavaScript.

## Features
  - **Interactive Modal:** Triggered by hovering over an image and double-tapping the `Ctrl` key (within 250ms). Supports scroll-wheel zooming, click-and-drag panning, and rotation.
  - **CSS Encapsulation:** The UI is injected into a Shadow Root, ensuring that aggressive host-website CSS rules never warp, hide, or break the magnifier's layout or buttons.
  - **Dynamic Sizing:** Automatically adjusts the modal container to the image dimensions (up to 90% of the viewport) and enforces a minimum width for small images.
  - **Overlay Detection:** Uses `document.elementsFromPoint` to detect `<img>` tags positioned underneath transparent HTML elements.
  - **Standard Context Menu:** Images render natively in the DOM, allowing standard right-click actions (copy/save) without CORS restrictions.
  - **Source Extraction:** Parses `srcset` attributes and parent `<a>` tags to retrieve higher-resolution sources before applying custom rules.
  - **Modular Architecture:** UI rendering logic (`core.js`) is isolated from site-specific URL rewriting rules (`rules.js`).

## Installation

1. Clone or download this repository.
2. Navigate to `chrome://extensions/` (or the equivalent in any Chromium-based browser).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the repository directory.

## Custom Domain Rules

Site-specific URL rewriting rules are defined in `rules.js`. To modify image sources for a specific domain, add a new function to the `window.MagnifierRules` object. The function receives the image element and must return the modified high-resolution URL string, or `null` if no match is found.

```javascript
window.MagnifierRules = {
    "amazon": function(img) {
        let src = img.src;
        if (img.hasAttribute('data-old-hires')) return img.getAttribute('data-old-hires');
        let amazonCleaned = src.replace(/\._[a-zA-Z0-9_]+_\./, '.');
        return amazonCleaned !== src ? amazonCleaned : null;
    }
};
```

## File Structure

```text
manifest.json       # Manifest V3 configuration
styles.css          # Modal, animation, and control styling (Loaded via Web Accessible Resources)
core.js             # Event listeners, Shadow DOM injection, and UI rendering
rules.js            # URL-rewriting dictionary for specific domains
```
