export const coordinateState = {
    origin: { x: 0, y: 0 },
    scale: 1
};
export const operationState = {
    currentCard: null
};

export const multiSelectMode = { active: false, selectedCards: [] };
export const parentSelectionMode = { active: false, type: null, sourceCard: null };
export const deletedCards = [];
export const bulkUpdateList = [];
export const highlightedCards = new Set();