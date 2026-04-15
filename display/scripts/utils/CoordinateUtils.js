// coordinate system conversion
// visualX = originX + standardX * scale
// visualY = originY + standardY * scale

// coordinate system visual realization
// standardX = style.left
// standardY = style.top
// visualX = style.left + style.transform.translate.x
// visualY = style.top + style.transform.translate.y



// visual coordinates → attributes
export function computingPositionAttributes(card, visualX, visualY, origin, scale){
    const standardX = (visualX - origin.x) / scale;
    const standardY = (visualY - origin.y) / scale;
    card.style.left = `${standardX}px`;
    card.style.top = `${standardY}px`;

    const tx = (visualX - standardX) / scale;
    const ty = (visualY - standardY) / scale;
    card.style.transform = `scale(${scale}) translate(${tx}px, ${ty}px)`;
}

// standard coordinates → attributes
export function recomputingPositionAttributes(card, origin, scale){
    const standardX = parseFloat(card.style.left);
    const standardY = parseFloat(card.style.top);

    const visualX = origin.x + standardX * scale;
    const visualY = origin.y + standardY * scale;

    const tx = (visualX - standardX) / scale;
    const ty = (visualY - standardY) / scale;

    card.style.transform = `scale(${scale}) translate(${tx}px, ${ty}px)`;
}