// core.js - The UI and X-Ray Vision Engine
let popup = null;
let scale = 1, translateX = 0, translateY = 0, rotation = 0;
let isDragging = false, startX, startY;

// Track mouse coordinates constantly
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; 
    mouseY = e.clientY;
});

// Listen for Ctrl key + X-Ray Vision Bypasser
document.addEventListener('keydown', (e) => {
    if (e.key === 'Control' && !popup) {
        
        // Get every element under the cursor from top to bottom
        const elementsUnderCursor = document.elementsFromPoint(mouseX, mouseY);
        
        // Find the first image element in that stack
        const targetImg = elementsUnderCursor.find(el => el.tagName === 'IMG');

        if (targetImg) {
            // Pass the image to our rules engine from rules.js
            const bestSrc = window.getBestImageSrc(targetImg);
            openMagnifier(bestSrc, targetImg.src);
        }
    }
});

document.addEventListener('mousedown', (e) => {
    if (popup && !popup.contains(e.target)) closeMagnifier();
});

// Pass the original thumbnail URL as a fallback
function openMagnifier(src, fallbackSrc) {
    scale = 1; translateX = 0; translateY = 0; rotation = 0;

    popup = document.createElement('div');
    popup.id = 'brave-mag-popup';

    const img = document.createElement('img');
    img.id = 'brave-mag-img';
    img.src = src;
    
    // Graceful fallback in case of a broken link in the rules engine
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
    document.body.appendChild(popup);

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
    const img = document.getElementById('brave-mag-img');
    if (img) updateTransform(img);
}

function rotateImage(direction) {
    if (direction === 'left') rotation -= 90;
    else { rotation += 90; }
    const img = document.getElementById('brave-mag-img');
    if (img) updateTransform(img);
}

function resetTransform() {
    scale = 1; translateX = 0; translateY = 0; rotation = 0;
    const img = document.getElementById('brave-mag-img');
    if (img) updateTransform(img);
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
    if (popup) {
        popup.remove();
        popup = null;
        document.removeEventListener('keydown', handleEsc);
    }
}

function handleEsc(e) {
    if (e.key === 'Escape') closeMagnifier();
}