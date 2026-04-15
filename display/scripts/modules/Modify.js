import { indexMap } from '../../../file/scripts/shared/IndexMap.js';



export function changeListenerInit() {
    document.addEventListener('focusout', changeListener);
}

function changeListener(event) {
    const target = event.target;
    if (!target.classList.contains('title') || !target.isContentEditable) return;
    
    const card = target.closest('.card');
    if (!card) return;
    
    const newTitle = target.textContent.trim() || '_untitled';
    const currentParentId = card.dataset.dirParent;
    
    if (isDuplicateTitle(card, newTitle, currentParentId)) {
        alert(`同级目录下已存在相同标题的卡片："${newTitle}"`);
    }
}

export function isDuplicateTitle(card, newTitle, newParentId) {
    // 1. checking existing cards
    for (const siblingCard of document.querySelectorAll('.card')) {
        if (siblingCard.id === card.id) continue;
        if (siblingCard.dataset.dirParent !== newParentId) continue;
        const siblingTitle = siblingCard.querySelector('.title')?.textContent.trim();
        if (siblingTitle === newTitle) return true;
    }
    
    // 2. checking saved cards
    if (newParentId) {
        for (const [id, info] of indexMap.entries()) {
            if (id === card.id) continue;
            if (info.parentId !== newParentId) continue;
            if (info.title === newTitle) return true;
        }
    }
    
    return false;
}