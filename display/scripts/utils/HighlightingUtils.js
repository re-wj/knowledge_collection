import { highlightedCards } from '../shared/State.js';



export function highlightCard(card, type) {
    if (!card) return;
    // highlighting
    if (type === 'dir') {
        card.classList.add('highlight-dir-parent');
    } else if (type === 'logic') {
        card.classList.add('highlight-logic-parent');
    }

    // if the card has both types of highlighting
    if (card.classList.contains('highlight-dir-parent') && card.classList.contains('highlight-logic-parent')) {
        card.classList.remove('highlight-dir-parent', 'highlight-logic-parent');
        card.classList.add('highlight-both-parents');
    }
    
    highlightedCards.add(card);
}

export function unhighlightAllCards() {
    highlightedCards.forEach(card => {
        card.classList.remove('highlight-dir-parent', 'highlight-logic-parent','highlight-both-parents');
    });
    highlightedCards.clear();
}