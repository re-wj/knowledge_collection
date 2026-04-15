import { coordinateState } from '../shared/State.js';
import { displayContentToOriginalContent, LaTexFormat } from '../utils/FormatUtils.js';
import { computingPositionAttributes } from '../utils/CoordinateUtils.js';
import { assigningId } from '../utils/IdUtils.js';



export function createCard(visualLeft, visualTop, options = {}) {
    // 1. default config
    const config = {
        title: '',
        content: '<div><br></div>',
        type: 'Undefined',
        dirParent: '',
        logicParents: [],
        width: '250px',
        height: '150px',
        reference: { time: '', evidence: '' },
        id: assigningId(),
        ...options 
    };

    const card = document.createElement('div');
    card.className = 'card';

    // 2. setting attributes
    computingPositionAttributes(card, visualLeft, visualTop, coordinateState.origin, coordinateState.scale);

    // computing size
    card.style.width = config.width;
    card.style.height = config.height;

    card.dataset.cardType = config.type;
    card.dataset.dirParent = config.dirParent;
    card.dataset.logicParents = JSON.stringify(config.logicParents);
    card.dataset.reference = JSON.stringify(config.reference);
    card.id = config.id;

    // 3. creating elements
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';

    const titleArea = document.createElement('div');
    titleArea.className = 'title-area';
    const title = document.createElement('div');
    title.className = 'title';
    title.setAttribute('contenteditable', 'true');
    title.innerHTML = config.title;
    titleArea.appendChild(title);

    // creating display-content
    const displayContent = document.createElement('div');
    displayContent.className = 'display-content';
    displayContent.setAttribute('contenteditable', 'true');
    displayContent.innerHTML = config.content;
    // creating original-content
    const originalContent = document.createElement('div');
    originalContent.className = 'original-content';
    originalContent.style.display = 'none';
    // initial sync
    displayContentToOriginalContent(displayContent, originalContent);

    // sync with debounce
    let syncTimeout = null;
    displayContent.addEventListener('input', function() {
        if (!displayContent.textContent.trim()) displayContent.innerHTML = '<div><br></div>'
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            displayContentToOriginalContent(displayContent, originalContent);
        }, 100); // 100ms debounce
    });

    card.appendChild(dragHandle);
    card.appendChild(titleArea);
    card.appendChild(displayContent);
    card.appendChild(originalContent);
    document.body.appendChild(card);

    // 4. setting size adjustment listener
    const resizeObserver = new ResizeObserver(() => {
        displayContent.style.height = `calc(100% - ${titleArea.offsetHeight}px)`;
    });
    resizeObserver.observe(card);

    if (Object.keys(options).length === 0) {
        // 5. focusing title if new card
        title.focus();
    } else if (displayContent.innerHTML != '<div><br></div>'){
        // 6. rendering content if not a new card nor empty
        LaTexFormat(originalContent, displayContent);
    }
}