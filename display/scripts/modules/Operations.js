import { coordinateState, operationState } from '../shared/State.js';
import { recomputingPositionAttributes } from '../utils/CoordinateUtils.js';



// dragging API
export function draggingInit() {
    document.addEventListener('mousedown', startDragging);
}

let draggingType= null;
let startVisualX, startVisualY, startStandardX, startStandardY;

// starting dragging
function startDragging(clickEvent) {
    // 1. dragging confirmation
    if (clickEvent.button !== 0) return;
    // preventing dragging when clicking on sidebar
    if (clickEvent.target.closest('#propertiesSidebar')) return;
    
    // 2. determining dragging type
    const dragHandle = clickEvent.target.closest('.drag-handle');
    const card = clickEvent.target.closest('.card');
    
    if (dragHandle && card) {
        draggingType = 'card';
        operationState.currentCard = card;
                    
        startVisualX = clickEvent.pageX;
        startVisualY = clickEvent.pageY;
        startStandardX = parseFloat(card.style.left);
        startStandardY = parseFloat(card.style.top);
        
        card.style.resize = 'none';
        card.style.cursor = 'grabbing';
        card.style.zIndex = '1000';
    } else if (!card) {
        draggingType = 'view';
                    
        startVisualX = clickEvent.pageX;
        startVisualY = clickEvent.pageY;
        startStandardX = coordinateState.origin.x;
        startStandardY = coordinateState.origin.y;
    } else return;

    document.body.style.userSelect = 'none';
    clickEvent.preventDefault();
    document.addEventListener('mousemove', onDragging);
    document.addEventListener('mouseup', stopDragging);
}

// dragging in process
function onDragging(dragEvent){
    requestAnimationFrame(() => {
        // computing visual coordinate variations
        const deltaVisualX = dragEvent.pageX - startVisualX;
        const deltaVisualY = dragEvent.pageY - startVisualY;
        
        if (draggingType === 'card') {
            // card dragging
            // updating standard coordinates
            const newStandardX = startStandardX + deltaVisualX / coordinateState.scale;
            const newStandardY = startStandardY + deltaVisualY / coordinateState.scale;
            
            operationState.currentCard.style.left = `${newStandardX}px`;
            operationState.currentCard.style.top = `${newStandardY}px`;

            // updating card transform
            recomputingPositionAttributes(operationState.currentCard, coordinateState.origin, coordinateState.scale);
        } else if (draggingType === 'view') {
            // viewport dragging
            // updating origin coordinates
            coordinateState.origin.x = startStandardX + deltaVisualX;
            coordinateState.origin.y = startStandardY + deltaVisualY;
                    
            // updating transform of all cards
            document.querySelectorAll('.card').forEach(card => {
                recomputingPositionAttributes(card, coordinateState.origin, coordinateState.scale);
            });
        }
    });
}

// dragging end
function stopDragging() {
    if (draggingType === 'card') {
        operationState.currentCard.style.resize = 'both';
        operationState.currentCard.style.cursor = 'default';
        operationState.currentCard.style.zIndex = 'auto';
        operationState.currentCard = null;
    }
    draggingType= null;

    
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onDragging);
    document.removeEventListener('mouseup', stopDragging);
}



// zooming API
export function zoomingInit() {
    document.addEventListener('wheel', zooming, { passive: false });
    document.addEventListener('keydown', resetScale);
    updateZoomInfo();
}

// start zooming
function zooming(zoomEvent) {
    if (!zoomEvent.ctrlKey) {
        return;
    }
    zoomEvent.preventDefault();
    const delta = zoomEvent.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(coordinateState.scale + delta, 0.1), 3);
                    
    if (newScale !== coordinateState.scale) {
        applyScale(zoomEvent.clientX, zoomEvent.clientY, newScale, coordinateState.scale);
        updateZoomInfo();
    }
}

// scaling
function applyScale(zoomOriginX, zoomOriginY, newScale, previousScale) {
    // updating origin visual coordinates and global scale
    coordinateState.origin.x = zoomOriginX + (coordinateState.origin.x - zoomOriginX) * (newScale / previousScale);
    coordinateState.origin.y = zoomOriginY + (coordinateState.origin.y - zoomOriginY) * (newScale / previousScale);
    coordinateState.scale = newScale;

    // updating position of all cards
    renewView();
}

// scale reset
function resetScale(resetScaleEvent){
    if (resetScaleEvent.ctrlKey && resetScaleEvent.key === '0') {
        resetScaleEvent.preventDefault();
        coordinateState.scale = 1;
        coordinateState.origin = { x: 0, y: 0 };
        document.querySelectorAll('.card').forEach(card => {
            card.style.transition = 'transform 0.1s ease-out';
            card.style.transform = 'scale(1) translate(0px, 0px)';
            card.addEventListener('transitionend', function zoomTransition() {
                card.style.transition = '';
            }, { once: true });
        });
        updateZoomInfo();
    }
}

// updating position of all cards
export function renewView(){
    document.querySelectorAll('.card').forEach(card => {
        card.style.transition = 'transform 0.1s ease-out';
        
        recomputingPositionAttributes(card, coordinateState.origin, coordinateState.scale);

        card.addEventListener('transitionend', function zoomTransition() {
            card.style.transition = '';
        }, { once: true });
    });
}

// updating zoom info
function updateZoomInfo() {
    const zoomInfo = document.getElementById('zoomInfo');
    zoomInfo.textContent = `缩放: ${Math.round(coordinateState.scale * 100)}%`;
    zoomInfo.style.opacity = '1';
    clearTimeout(zoomInfo.timeout);
    zoomInfo.timeout = setTimeout(() => {
        zoomInfo.style.opacity = '0';
    }, 1000);
}