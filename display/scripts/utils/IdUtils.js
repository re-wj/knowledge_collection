import { indexMap } from "../../../file/scripts/shared/IndexMap.js";



// assigning a new ID to the new card
export function assigningId(length = 16){
    let attempts = 0;
    const maxAttempts = 5;
    let id;
    do {
        const bytes = new Uint8Array(length / 2);
        crypto.getRandomValues(bytes);
        id = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        attempts++;
        if (attempts >= maxAttempts) {
            length += 4;
            attempts = 0;
        }
    } while (indexMap.has(id));
    return id;
}



export function getTitleById(id) {
    if (id === 'ROOT' || id === 'TEMP') return id;

    // 1. not saved but existing in DOM
    const card = document.getElementById(id);
    if (card) {
        const title = card.querySelector('.title')?.textContent.trim();
        return title || '_untitled';
    }

    // 2. saved
    const mapped = indexMap.get(id);
    if (mapped) return mapped.title || '_untitled';

    // 3. not existing
    return '';
}

export function getDirParentById(id) {
    if (id === 'ROOT') return '';
    
    // 1. not saved but existing in DOM
    const card = document.getElementById(id);
    if (card) {
        const dirParent = card.dataset.dirParent;
        return dirParent || '';
    }

    // 2. saved
    const mapped = indexMap.get(id);
    if (mapped) return mapped.parentId || '';
    
    // 3. not existing
    return '';
}

export function getCardById(id) {
    return document.getElementById(id);
}