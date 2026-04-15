import { coordinateState, multiSelectMode, parentSelectionMode, deletedCards, bulkUpdateList } from '../shared/State.js';
import { highlightCard, unhighlightAllCards } from '../utils/HighlightingUtils.js';
import { handles,cardRegistry } from '../../../file/scripts/shared/Handles.js';
import { initializeIndexFile, readMappingFile } from '../../../file/scripts/modules/IndexManager.js';
import { getTitleById, getDirParentById, getCardById } from '../utils/IdUtils.js';
import { indexMap } from '../../../file/scripts/shared/IndexMap.js';
import { renewView } from './Operations.js';
import { saveCard } from './Save.js';
import { deleteSourceFile } from '../../../file/scripts/modules/DeleteManager.js';
import { isDuplicateTitle } from './Modify.js';



// sidebar for page
export function renderPageSidebar() {
    if (parentSelectionMode.active) return;
    unhighlightAllCards();
    const sidebarContent = document.getElementById('sidebarContent');
    sidebarContent.innerHTML = `
        <div class="property-item">
            <label for="page-scale">scale:</label>
            <span id="page-scale">${(coordinateState.scale * 100).toFixed(0)}%</span>
        </div>
        <div class="property-item">
            <label for="view-x">View X:</label>
            <input type="number" step="0.01" id="view-x" value="${-coordinateState.origin.x.toFixed(2)}">
        </div>
        <div class="property-item">
            <label for="view-y">View Y:</label>
            <input type="number" step="0.01" id="view-y" value="${-coordinateState.origin.y.toFixed(2)}">
        </div>
        <div class="property-item">
            <label>Save Folder:</label>
            <span id="save-folder-display">${handles.savedDirHandle ? handles.savedDirHandle.name : 'Not saved yet'}</span>
            <button id="change-save-folder">Change</button>
        </div>
        <div class="property-item-vertical">
            <div class="d-flex align-items-center">
                <strong>Source Control</strong>
            </div>
            <div class="property-controls">
                <button id="check-updates" class="btn-link">Check for Updates</button>
                <button id="update-source-files" class="btn-link">Update Source Files</button>
            </div>
        </div>
        <div class="property-item-vertical">
            <div class="d-flex align-items-center">
                <strong>Multiple Selector (${multiSelectMode.selectedCards.length})</strong>
                <div class="property-controls">
                    <button id="add-selected-card" class="btn-link">${!multiSelectMode.active ? 'Add' : 'Confirm'}</button>
                    <button id="clear-all" class="btn-link">Clear</button>
                    <button id="save-all" class="btn-link">Save</button>
                    <button id="delete-all" class="btn-link">Delete</button>
                </div>
            </div>
        </div>
        <details open>
            <summary>View List</summary>
                <ul id="selected-cards-list">
                    ${multiSelectMode.selectedCards.length > 0 ? multiSelectMode.selectedCards.map(id => {
                        const title = getTitleById(id);
                        return `<li><span data-selected-card="${id}">${title ? title : `_untitled`}</span><button class="btn-link btn-remove-selected-cards" data-selected-card="${id}">Remove</button></li>`;
                    }).join('') : '<li>None</li>'}
                </ul>
            </details>
        </div>
        <div class="property-item-vertical">
            <div class="d-flex align-items-center">
                <strong>Recycle Bin (${deletedCards.length})</strong>
            </div>
            <details>
                <summary>View Deleted Cards</summary>
                <ul id="deleted-cards-list">
                    ${deletedCards.length > 0 ? 
                        deletedCards.map(id => {
                            const title = getTitleById(id);
                            return `
                            <li>
                                <span>${title}</span>
                                <button class="btn-link restore-card-btn" data-deleted-card="${id}">Restore</button>
                                <button class="btn-link delete-permanently-btn" data-deleted-card="${id}">Delete Permanently</button>
                            </li>`;
                            }).join('') 
                        : '<li>No deleted cards</li>'
                    }
                </ul>
            </details>
        </div>
    `;

    // --- event listeners ---
    document.getElementById('view-x').addEventListener('change', (event) => {
        coordinateState.origin.x = -parseFloat(event.target.value);
        renewView();
    });
    document.getElementById('view-y').addEventListener('change', (event) => {
        coordinateState.origin.y = -parseFloat(event.target.value);
        renewView();
    });

    document.getElementById('change-save-folder').addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
            const newDirHandle = await window.showDirectoryPicker();
            if (newDirHandle) {
                handles.savedDirHandle = newDirHandle;
                await initializeIndexFile();
                await readMappingFile();
                renderPageSidebar();
            }
        } catch (error) {
            console.log("User cancelled directory selection");
        }
    });

    const addSelectedCardsBtn = document.getElementById('add-selected-card');
    addSelectedCardsBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (addSelectedCardsBtn.textContent === 'Add') {
            multiSelectMode.active = true;
            addSelectedCardsBtn.textContent = 'Confirm';
            
            const list = document.getElementById('selected-cards-list');
            if (list.querySelector('li')?.textContent === 'None') {
                list.innerHTML = '';
            }
        } else {
            multiSelectMode.active = false;
            addSelectedCardsBtn.textContent = 'Add';
            renderPageSidebar();
        }
    });

    document.querySelectorAll('.btn-remove-selected-cards').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (btn.textContent === 'Remove') {
                btn.textContent = 'Confirm?';
            } else {
                const cardToRemove = btn.dataset.selectedCard;
                multiSelectMode.selectedCards = multiSelectMode.selectedCards.filter(id => id !== cardToRemove);
                renderPageSidebar();
            }
        });
    });

    const clearAllBtn = document.getElementById('clear-all');
    clearAllBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (clearAllBtn.textContent === 'Clear') {
            clearAllBtn.textContent = 'Confirm?';
        } else {
            multiSelectMode.selectedCards = [];
            renderPageSidebar();
        }
    });

    const saveAllBtn = document.getElementById('save-all');
    saveAllBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        if (!handles.savedDirHandle){
            alert(`当前还未设置默认保存路径\n建议先设置默认保存路径，防止多次询问`);
            return;
        }
        if (confirm(`确认保存选中的${multiSelectMode.selectedCards.length}张卡片？`)){
            let isBulkUpdate = false;
            if (multiSelectMode.selectedCards.length > 7) {
                isBulkUpdate = confirm(`是否确认批量更新？（不进行中间提醒）`);
            } else isBulkUpdate = false;
            if (isBulkUpdate) bulkUpdateList.length = 0;
            for (const id of multiSelectMode.selectedCards) {
                const card = getCardById(id);
                if (card) await saveCard(card, isBulkUpdate);
            }
            if (isBulkUpdate) alert(`批量更新完成\n${bulkUpdateList.join(`\n`)}`);
        }
    });

    const deleteAllBtn = document.getElementById('delete-all');
    deleteAllBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (confirm(`确认删除选中的${multiSelectMode.selectedCards.length}张卡片？`)) {
            for (const id of multiSelectMode.selectedCards) {
                const card = getCardById(id);
                if (card) {
                    card.remove();
                }
            }
            multiSelectMode.selectedCards = [];
            renderPageSidebar();
        }
    });

    document.getElementById('check-updates')?.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!handles.savedDirHandle) {
            alert('请先设置保存目录');
            return;
        }
                    
        multiSelectMode.selectedCards = [];
        deletedCards.length = 0;

        // going through all cards
        const currentCards = new Set();
        document.querySelectorAll('.card').forEach(card => {
            const id = card.id;
            if (!id) return;
            
            currentCards.add(id);
            
            const isNew = !cardRegistry.some(item => item === id);
            const savedInfo = indexMap.get(id);
            const currentTitle = card.querySelector('.title')?.textContent.trim();
            const currentParent = card.dataset.dirParent;
            
            const titleChanged = savedInfo && currentTitle !== savedInfo.title;
            const parentChanged = savedInfo && currentParent !== savedInfo.parentId;
            
            if (isNew || titleChanged || parentChanged) {
                if (!multiSelectMode.selectedCards.includes(id)) {
                    multiSelectMode.selectedCards.push(id);
                }
            }
        });
                    
        // updating recycling bin
        cardRegistry.forEach(id => {
            if (!currentCards.has(id)) {
                deletedCards.push(id);
            }
        });
                    
        // rerendering sidebar to update multiselector and recycling bin
        renderPageSidebar();
    });

    // resuming single card
    document.querySelectorAll('.restore-card-btn').forEach(btn => {
        btn.addEventListener('click', async (event) => {
            event.stopPropagation();
            const id = btn.dataset.deletedCard;
            const cardIndex = deletedCards.findIndex(card => card === id);
            if (cardIndex !== -1) {
                // removing from recycling bin
                deletedCards.splice(cardIndex, 1);
                renderPageSidebar();
            }
        });
    });

    // deleting card permanently
    document.querySelectorAll('.delete-permanently-btn').forEach(btn => {
        btn.addEventListener('click', async (event) => {
            event.stopPropagation();
            const id = btn.dataset.deletedCard;
            const title = getTitleById(id);
            const cardIndex = deletedCards.findIndex(card => card === id);
            if (cardIndex !== -1) {
                if (confirm(`确认要永久删除 ${title} 吗？`)) {
                    try {
                        if (await deleteSourceFile(id)) {
                            // removing from recycling bin
                            deletedCards.splice(cardIndex, 1);
                            renderPageSidebar();
                        }
                    } catch (error) {
                        console.error(`Failed to delete source file ${title}:`, error);
                    }
                }
            }
        });
    });

    // updating source files
    document.getElementById('update-source-files')?.addEventListener('click', async (event) => {
        event.stopPropagation();
            if (!handles.savedDirHandle) {
                alert('请先设置保存目录');
            return;
        }
                    
        // 1. saving all cards in the multiselector
        let isBulkUpdate = false;
        if (multiSelectMode.selectedCards.length > 7) {
            isBulkUpdate = confirm(`是否确认批量更新？（不进行中间提醒）`);
        } else isBulkUpdate = false;
        if (isBulkUpdate) bulkUpdateList.length = 0;
        for (const id of multiSelectMode.selectedCards) {
            const card = getCardById(id);
            if (card) await saveCard(card, isBulkUpdate);
        }
        if (isBulkUpdate) alert(`批量更新完成\n${bulkUpdateList.join(`\n`)}`);
        multiSelectMode.selectedCards = [];
                    
        // 2. emptying recycling bin
        if (confirm(`是否清空回收站？`)) {
            for (const id of deletedCards) {
                try {
                    await deleteSourceFile(id);
                } catch (error) {
                    console.error(`Failed to delete source file ${getTitleById(id)}:`, error);
                }
            }
            deletedCards.length = 0;
        }
        
        // 3. rerendering sidebar
        renderPageSidebar();
        alert('更新完成！');
    });
}





// sidebar for card
export function renderCardSidebar(card) {
    if (multiSelectMode.active) return;
    if (!card) return;
    unhighlightAllCards()

    const currentType = card.dataset.cardType;
    const types = ['Undefined', 'Definition', 'Law', 'Axiom', 'Theorem', 'Proof'];
    const currentDirParent = card.dataset.dirParent || null;
    const logicParents = JSON.parse(card.dataset.logicParents || '[]');

    // highlighting parents
    if (currentDirParent && currentDirParent !== 'ROOT' && currentDirParent !== 'TEMP') {
        const dirParentCard = getCardById(currentDirParent);
        if (dirParentCard) {
            highlightCard(dirParentCard, 'dir');
        }
    }
    
    logicParents.forEach(logicParent => {
        const logicParentCard = getCardById(logicParent);
        if (logicParentCard) {
            highlightCard(logicParentCard, 'logic');
        }
    });
    
    const sidebarContent = document.getElementById('sidebarContent');
    sidebarContent.innerHTML = `
        <div class="property-item">
            <label for="card-pos-x">X:</label>
            <input type="number" step="0.01" id="card-pos-x" value="${parseFloat(card.style.left).toFixed(2)}">
        </div>
        <div class="property-item">
            <label for="card-pos-y">Y:</label>
            <input type="number" step="0.01" id="card-pos-y" value="${parseFloat(card.style.top).toFixed(2)}">
        </div>
        <div class="property-item">
            <label for="card-width">Width:</label>
            <input type="number" step="0.01" id="card-width" value="${card.style.width?parseFloat(card.style.width).toFixed(2):250.00}">
        </div>
        <div class="property-item">
            <label for="card-height">Height:</label>
            <input type="number" step="0.01" id="card-height" value="${card.style.height?parseFloat(card.style.height).toFixed(2):150.00}">
        </div>
        <div class="property-item">
            <label for="card-type">Type:</label>
            <select id="card-type">
            ${types.map(t => `<option value="${t}" ${t === currentType ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
        </div>
        <hr>
        <div class="property-item-vertical">
            <div class="d-flex align-items-center">
                <strong>Reference</strong>
            </div>
            <div class="property-item">
                <label for="reference-time">Time:</label>
                <input type="text" id="reference-time" value="${JSON.parse(card.dataset.reference).time}">
            </div>
            <div class="property-item" style="display: flex; margin: 5px 0;">
                <label for="reference-evidence">Evidence:</label>
                <textarea id="reference-evidence" style="resize: none;" oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'">${(JSON.parse(card.dataset.reference).evidence || '').trim()}</textarea>
            </div>
        </div>
        <hr>
        <div class="property-item-vertical">
            <div class="d-flex align-items-center">
                <strong>Dir Parent:</strong>
                <div class="property-controls">
                    <button id="change-dir-parent" class="btn-link">Change</button>
                    <button id="set-root-dir-parent" class="btn-link">Set Root</button>
                </div>
            </div>
            <span id="dir-parent-display">${getTitleById(currentDirParent)}</span>
        </div>
        <div class="property-item-vertical">
            <div class="d-flex align-items-center">
                <strong>Logic Parents (${logicParents.length})</strong>
                <div class="property-controls">
                    <button id="add-logic-parent" class="btn-link">Add</button>
                </div>
            <details open>
                <summary>View List</summary>
                <ul id="logic-parents-list">
                    ${logicParents.length > 0 ? logicParents.map(id => {
                        const title = getTitleById(id);
                        return `<li><span data-logic-parent="${id}">${title}</span><button class="btn-link btn-remove-logic-parent" data-logic-parent="${id}">Remove</button></li>`;
                    }).join('') : '<li>None</li>'}
                </ul>
            </details>
        </div>
    `;
    
    // --- event listeners ---
    document.getElementById('card-pos-x').addEventListener('change', (event) => { if(card) card.style.left = `${parseFloat(event.target.value)}px`; });
    document.getElementById('card-pos-y').addEventListener('change', (event) => { if(card) card.style.top = `${parseFloat(event.target.value)}px`; });
    document.getElementById('card-width').addEventListener('change', (event) => { if(card) card.style.width = `${parseFloat(event.target.value)}px`; });
    document.getElementById('card-height').addEventListener('change', (event) => { if(card) card.style.height = `${parseFloat(event.target.value)}px`; });
    document.getElementById('card-type').addEventListener('change', (event) => {
        if (card) {
            card.dataset.cardType = event.target.value;
            renderCardSidebar(card);
        }
    });

    // reference update listeners
    const referenceTimeInput = document.getElementById('reference-time');
    const referenceEvidenceInput = document.getElementById('reference-evidence');
                
    const updateReference = () => {
        if (!card) return;
        
        const updatedReference = {
            time: referenceTimeInput.value.trim(),
            evidence: referenceEvidenceInput.value.trim()
        };
        
        card.dataset.reference = JSON.stringify(updatedReference);
    };
    
    referenceTimeInput.addEventListener('change', updateReference);
    referenceEvidenceInput.style.height = "auto";
    referenceEvidenceInput.style.height = referenceEvidenceInput.scrollHeight + "px";
    referenceEvidenceInput.addEventListener('change', updateReference);

    const setRootDirParentBtn = document.getElementById('set-root-dir-parent')
    setRootDirParentBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if(card) {
            const display = document.getElementById('dir-parent-display');
            display.textContent = `?_ROOT`;
            display.dataset.tempParentInfo = 'ROOT';
            changeDirParentBtn.textContent = 'Confirm?';
        }
    });

    const changeDirParentBtn = document.getElementById('change-dir-parent');
    changeDirParentBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (changeDirParentBtn.textContent === 'Change') {
            parentSelectionMode.active = true;
            parentSelectionMode.type = 'dir';
            parentSelectionMode.sourceCard = card;
            changeDirParentBtn.textContent = 'Confirm?';
        } else { // confirm
            const display = document.getElementById('dir-parent-display');
            if (card && display.dataset.tempParentInfo) {
                const newParentId = display.dataset.tempParentInfo;
                const newTitle = card.querySelector('.title')?.textContent.trim() || '_untitled';
                
                if (isDuplicateTitle(card, newTitle, newParentId)) {
                    alert('同级目录下已存在相同标题的卡片');
                }
                
                card.dataset.dirParent = newParentId;
            }
            parentSelectionMode.active = false;
            renderCardSidebar(card);
        }
    });

    const addLogicParentBtn = document.getElementById('add-logic-parent');
    addLogicParentBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (addLogicParentBtn.textContent === 'Add') {
            parentSelectionMode.active = true;
            parentSelectionMode.type = 'logic';
            parentSelectionMode.sourceCard = card;
            addLogicParentBtn.textContent = 'Confirm';
            
            const list = document.getElementById('logic-parents-list');
            // cleaning up "None" prompt
            if (list.querySelector('li') && list.querySelector('li').textContent === 'None') {
                list.innerHTML = '';
            }
            // inserting temporary item
            const tempLi = document.createElement('li');
            tempLi.id = 'temp-logic-parent-display';
            tempLi.innerHTML = `<span></span>`;
            list.appendChild(tempLi);

        } else { // confirm
            const tempItem = document.getElementById('temp-logic-parent-display');
            if (tempItem && tempItem.dataset.tempParentInfo) {
                const currentParents = JSON.parse(card.dataset.logicParents || '[]');
                const newParent = tempItem.dataset.tempParentInfo;
                if (!currentParents.includes(newParent)) {
                    currentParents.push(newParent);
                    card.dataset.logicParents = JSON.stringify(currentParents);
                }
            }
            parentSelectionMode.active = false;
            renderCardSidebar(card);
        }
    });

    document.querySelectorAll('.btn-remove-logic-parent').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (btn.textContent === 'Remove') {
                btn.textContent = 'Confirm?';
            } else {
                const parentToRemove = btn.dataset.logicParent;
                let currentParents = JSON.parse(card.dataset.logicParents || '[]');
                currentParents = currentParents.filter(p => p !== parentToRemove);
                card.dataset.logicParents = JSON.stringify(currentParents);
                renderCardSidebar(card);
            }
        });
    });
}



export function initSidebarEvents(){
    document.addEventListener('click', multiSelection, true);
    document.addEventListener('click', parentSelection, true); // using capture phase to ensure it runs before other click handlers that stop propagation
    document.addEventListener('click', closeSidebar);
}

// multiselector selection
function multiSelection(event) {
    if (!multiSelectMode.active) return;

    const selectedCard = event.target.closest('.card');
    if (!selectedCard) return;

    event.stopPropagation();
    event.preventDefault();
                    
    const selectedId = selectedCard.id;
                    
    if (!multiSelectMode.selectedCards.includes(selectedId)) {
        multiSelectMode.selectedCards.push(selectedId);
        renderPageSidebar();
    } else {
        // adding inline styles to the item in the list to remind
        const listItem = document.querySelector(`span[data-selected-card='${selectedId}']`);
        if (listItem) {
            listItem.style.fontWeight = 'bold';
            listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => listItem.style.fontWeight = '', 2000);
        }
    }
}

// parent selection
function parentSelection(event) {
    if (!parentSelectionMode.active) return;

    const currentParent = event.target.closest('.card');
    // not the current card itself
    if (!currentParent || currentParent === parentSelectionMode.sourceCard) return;

    // the card should have a title and a directory parent
    const title = currentParent.querySelector('.title')?.textContent.trim();
    const grandParent = currentParent.dataset.dirParent;
    if (!title || !grandParent) return;
    
    event.stopPropagation();
    event.preventDefault();
                    
    const selectedId = currentParent.id;
    
    if (parentSelectionMode.type === 'dir') {
        const sourceId = parentSelectionMode.sourceCard.id;
        if (isDescendant(sourceId, selectedId)) {
            alert('不能选择当前卡片的子级作为目录父级，这会导致循环引用');
            return;
        }
        const display = document.getElementById('dir-parent-display');
        if (display) {
            display.textContent = `?_ ${getTitleById(selectedId)}`;
            display.dataset.tempParentInfo = selectedId;
        }
    } else if (parentSelectionMode.type === 'logic') {
        const tempItem = document.getElementById('temp-logic-parent-display');
        if (!tempItem) return;
        
        const currentParents = JSON.parse(parentSelectionMode.sourceCard.dataset.logicParents || '[]');
        if (!currentParents.includes(selectedId)) {
            tempItem.innerHTML = `<span>?_ ${getTitleById(selectedId)}</span>`;
            tempItem.dataset.tempParentInfo = selectedId;
        } else {
            tempItem.innerHTML = `<span>Already a parent.</span>`;
            delete tempItem.dataset.tempParentInfo;
        }
    }
}



// closing sidebar when clicking outside
function closeSidebar(event) {
    if (parentSelectionMode.active || multiSelectMode.active) return; // not closing when in selection mode

    const propertiesSidebar = document.getElementById('propertiesSidebar');
    const contextMenu = document.getElementById('contextMenu');
    const propertiesMenuItem = document.getElementById('propertiesMenuItem');

    if (propertiesSidebar.classList.contains('show') && 
        !propertiesSidebar.contains(event.target) && 
        !contextMenu.contains(event.target)) {
        // not menu
        const isPropertiesItem = propertiesMenuItem.contains(event.target);
        if (!isPropertiesItem) {
            unhighlightAllCards()
            propertiesSidebar.classList.remove('show');
        }
    }
}

// auxiliary function for preventing cycles when selecting a parent
function isDescendant(ancestorId, descendantId) {
    let currentId = descendantId;
    while (currentId && currentId !== 'ROOT' && currentId !== 'TEMP') {
        if (currentId === ancestorId) return true;
        currentId = getDirParentById(currentId);
    }
    return false;
}