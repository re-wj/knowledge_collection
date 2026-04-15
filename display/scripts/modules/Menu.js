import { operationState } from '../shared/State.js';
import { createCard } from './Card.js';
import { deleteCard } from './Delete.js';
import { render } from './Render.js';
import { importCards } from '../../../file/scripts/modules/ImportManager.js';
import { saveCard } from './Save.js';
import { renderCardSidebar, renderPageSidebar } from './PropertySidebar.js';



// menu items
const contextMenu = document.getElementById('contextMenu');
let propertiesMenuItem;
let addMenuItem;
let importMenuItem;
let importFileMenuItem;
let importFolderMenuItem;
let deleteMenuItem;
let saveMenuItem;
let formatMenuItem;

// menu API
export function contextMenuInit() {
    contextMenu.innerHTML = `
        <div class="context-menu-item" id="propertiesMenuItem">Properties</div>
        <div class="context-menu-item" id="addMenuItem">Add</div>
        <div class="context-menu-item has-submenu" id="importMenuItem">
            Import <span class="submenu-arrow">&gt;</span>
            <div class="submenu">
                <div class="context-menu-item" id="importFileMenuItem">File(s)...</div>
                <div class="context-menu-item" id="importFolderMenuItem">Folder...</div>
            </div>
        </div>
        <div class="context-menu-item" id="deleteMenuItem">Delete</div>
        <div class="context-menu-item" id="saveMenuItem">Save</div>
        <div class="context-menu-item" id="formatMenuItem"></div>
    `;

    document.addEventListener('click', hideContextMenu);
    document.addEventListener('contextmenu', displayContextMenu);

    propertiesMenuItem = document.getElementById('propertiesMenuItem');
    addMenuItem = document.getElementById('addMenuItem');
    importMenuItem = document.getElementById('importMenuItem');
    importFileMenuItem = document.getElementById('importFileMenuItem');
    importFolderMenuItem = document.getElementById('importFolderMenuItem');
    deleteMenuItem = document.getElementById('deleteMenuItem');
    saveMenuItem = document.getElementById('saveMenuItem');
    formatMenuItem = document.getElementById('formatMenuItem');


    addMenuItem.addEventListener('click', () => {
        const menuRect = contextMenu.getBoundingClientRect();
        contextMenu.style.display = 'none';
        createCard(menuRect.left + window.pageXOffset, menuRect.top + window.pageYOffset);
    });

    importFileMenuItem.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        importCards('files');
    });
    importFolderMenuItem.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        importCards('directories');
    });


    deleteMenuItem.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        deleteCard(operationState.currentCard);
        operationState.currentCard = null;
    });

    saveMenuItem.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        saveCard(operationState.currentCard);
        operationState.currentCard = null;
    });

    formatMenuItem.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        render(operationState.currentCard);
        operationState.currentCard = null;
    });


    propertiesMenuItem.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        propertiesSidebar.classList.add('show');
        if (operationState.currentCard) {
            renderCardSidebar(operationState.currentCard);
            operationState.currentCard = null;
        } else {
            renderPageSidebar();
        }
    });
}

function hideContextMenu() {
    contextMenu.style.display = 'none';
}

function displayContextMenu(rightClickEvent) {
    rightClickEvent.preventDefault();
    const card = rightClickEvent.target.closest('.card');

    if (card) {
        // context menu for card
        operationState.currentCard = card;
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${rightClickEvent.pageX}px`;
        contextMenu.style.top = `${rightClickEvent.pageY}px`;
        propertiesMenuItem.style.display = 'block';
        addMenuItem.style.display = 'none';
        importMenuItem.style.display = 'none';
        deleteMenuItem.style.display = 'block';
        saveMenuItem.style.display = 'block';

        formatMenuItem.textContent = card.querySelector('.display-content').hasAttribute('LaTex-rendered') ? 'Original Format' : 'LaTeX Format';
        formatMenuItem.style.display = 'block';
    } else {
        // context menu for view
        operationState.currentCard = null;
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${rightClickEvent.pageX}px`;
        contextMenu.style.top = `${rightClickEvent.pageY}px`;
        propertiesMenuItem.style.display = 'block';
        addMenuItem.style.display = 'block';
        importMenuItem.style.display = 'block';
        deleteMenuItem.style.display = 'none';
        saveMenuItem.style.display = 'none';
        formatMenuItem.style.display = 'none';
    }
}