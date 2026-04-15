import { LaTexFormat, originalFormat } from "../utils/FormatUtils.js";



export function render(card) {
    if (!card) return;
    const originalContentElement = card.querySelector('.original-content');
    const displayContentElement = card.querySelector('.display-content');
    if (displayContentElement.hasAttribute('LaTex-rendered')) {
        // unrendering
        originalFormat(originalContentElement, displayContentElement);
    } else {
        // rendering
        LaTexFormat(originalContentElement, displayContentElement);
    }
}