// core.js
let magHost = null;
let popup = null;
let scale = 1, translateX = 0, translateY = 0, rotation = 0;
let isDragging = false, startX, startY;

// Track mouse coordinates
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Track the time of the last Ctrl press
let lastCtrlPressTime = 0;
const DOUBLE_PRESS_DELAY = 250; // 250ms max delay for double press

// Listener for Ctrl key (double tap)
document.addEventListener('keydown', (e) => {
    // Ignore the event if the user is just holding the key down
    if (e.repeat) return;

    if (e.key === 'Control' && !popup) {
        const currentTime = Date.now();

        // Check if the time since the last press is within 250ms window
        if (currentTime - lastCtrlPressTime <= DOUBLE_PRESS_DELAY) {

            // Reset the timer to if double tap detected, so that holding Ctrl doesn't trigger multiple times
            lastCtrlPressTime = 0;

            // Get every element under the cursor from top to bottom
            const elementsUnderCursor = document.elementsFromPoint(mouseX, mouseY);

            // Find the first image element in that stack
            const targetImg = elementsUnderCursor.find(el => el.tagName === 'IMG');

            let finalSrc = null;
            let fallbackSrc = null;

            if (targetImg) {
                finalSrc = window.getBestImageSrc(targetImg);
                fallbackSrc = targetImg.src;
            } else {
                // Check if any element under the cursor has a background image
                const bgElement = elementsUnderCursor.find(el => {
                    const bg = window.getComputedStyle(el).backgroundImage;
                    return bg && bg !== 'none' && bg.startsWith('url(');
                });

                if (bgElement) {
                    const bg = window.getComputedStyle(bgElement).backgroundImage;
                    finalSrc = bg.slice(5, -2); // Extracts the URL from 'url("...")'
                    fallbackSrc = finalSrc;
                }
            }

            if (finalSrc) {
                openMagnifier(finalSrc, fallbackSrc);
            }

        } else {
            // It only triggers if Ctrl was pressed, but it was too slow.
            lastCtrlPressTime = currentTime;
        }
    }
});

document.addEventListener('mousedown', (e) => {
    // Check against magHost instead of popup, since popup is hidden in the Shadow DOM
    if (magHost && !magHost.contains(e.target)) closeMagnifier();
});

// Pass the original thumbnail URL as a fallback
function openMagnifier(src, fallbackSrc) {
    scale = 1; translateX = 0; translateY = 0; rotation = 0;

    // 1. CREATE THE SHADOW HOST
    magHost = document.createElement('div');
    magHost.id = 'brave-mag-host';
    magHost.style.all = 'initial'; // Protects the host wrapper itself

    // 2. ATTACH THE SHADOW DOM
    const shadow = magHost.attachShadow({ mode: 'open' });

    // 3. LOAD YOUR CSS INSIDE THE SHADOW DOM
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('styles.css');
    shadow.appendChild(styleLink);

    // 4. BUILD YOUR POPUP
    popup = document.createElement('div');
    popup.id = 'brave-mag-popup';

    const img = document.createElement('img');
    img.id = 'brave-mag-img';

    // Instantly display the low-res thumbnail
    img.src = fallbackSrc;

    if (src && src !== fallbackSrc) {
        const highRes = new Image();
        highRes.onload = () => {
            img.src = src;
        };
        highRes.onerror = () => {
            console.log("High-res load failed, keeping original source.");
        };
        highRes.src = src;
    }

    // Main image onerror fallback (in case fallbackSrc fails)
    img.onerror = () => {
        if (img.src !== fallbackSrc) {
            console.log("High-res load failed, falling back to original source.");
            img.src = fallbackSrc;
        }
    };

    popup.appendChild(img);

    const closeBtn = createBtn('X', () => closeMagnifier());
    closeBtn.className = 'brave-mag-btn-close';
    popup.appendChild(closeBtn);

    const controls = document.createElement('div');
    controls.id = 'brave-mag-controls';

    controls.append(
        createBtn('−', () => adjustZoom(-0.25)),
        createBtn('↺', () => rotateImage('left')),
        createBtn('+', () => adjustZoom(0.25)),
        createBtn('⟳', () => rotateImage())
    );

    popup.append(controls);

    // 5. APPEND TO SHADOW DOM, NOT DOCUMENT.BODY
    shadow.appendChild(popup);
    document.body.appendChild(magHost);

    // Interactivity
    popup.addEventListener('wheel', (e) => {
        e.preventDefault();
        adjustZoom(e.deltaY > 0 ? -0.15 : 0.15);
    }, { passive: false });

    img.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });

    window.addEventListener('mouseup', () => isDragging = false);

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        translateX = (e.clientX - startX);
        translateY = (e.clientY - startY);
        updateTransform(img);
    });

    document.addEventListener('keydown', handleEsc);
}

function adjustZoom(amount) {
    scale = Math.max(0.2, Math.min(scale + amount, 6));
    // Query inside the popup, since document.getElementById can't see into Shadow DOM
    if (popup) {
        const img = popup.querySelector('#brave-mag-img');
        if (img) updateTransform(img);
    }
}

function rotateImage(direction) {
    if (direction === 'left') rotation -= 90;
    else { rotation += 90; }
    // Query inside the popup, since document.getElementById can't see into Shadow DOM
    if (popup) {
        const img = popup.querySelector('#brave-mag-img');
        if (img) updateTransform(img);
    }
}

function updateTransform(img) {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`;
}

function createBtn(text, onClick) {
    const btn = document.createElement('button');
    btn.className = 'brave-mag-btn';
    btn.innerText = text;
    btn.onmousedown = (e) => e.stopPropagation();
    btn.onclick = onClick;
    return btn;
}

function closeMagnifier() {
    // Remove magHost entirely
    if (magHost) {
        magHost.remove();
        magHost = null;
        popup = null;
        document.removeEventListener('keydown', handleEsc);
    }
}

function handleEsc(e) {
    if (e.key === 'Escape') closeMagnifier();
}