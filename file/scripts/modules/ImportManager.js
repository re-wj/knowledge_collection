import { initializeIndexFile, readMappingFile, readIndexFile } from './IndexManager.js';
import { getSavedDirHandle } from '../utils/HandleUtils.js';
import { cardRegistry } from '../shared/Handles.js';
import { createCard } from '../../../display/scripts/modules/Card.js';
import { coordinateState } from '../../../display/scripts/shared/State.js';



// importing API
export async function importCards(type) {
    await initializeIndexFile();
    await readMappingFile();
    const tree = await readIndexFile();
    
    // rendering tree selector
    const selectedIds = await showTreeSelector(tree, type);
    if (selectedIds.length === 0) return;
    
    // importing selected items
    await importItemProcessor(selectedIds);
}

// rendering tree selector
function showTreeSelector(tree, type) {
    return new Promise((resolve) => {
        // container
        const dialog = document.createElement('div');
        dialog.className = 'import-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        const panel = document.createElement('div');
        panel.style.cssText = `
            background: white;
            width: 700px;
            max-width: 90%;
            height: 500px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        
        // title area
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            padding: 15px;
            border-bottom: 1px solid #ccc;
            font-weight: bold;
        `;
        titleBar.textContent = type === 'files' ? '选择要导入的卡片' : '选择要导入的目录';
        
        // content area
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            flex: 1;
            overflow: hidden;
        `;
        
        // index
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            flex: 1;
            border-right: 1px solid #ccc;
            overflow: auto;
            padding: 10px;
        `;
        
        // selected item list
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            width: 200px;
            overflow: auto;
            padding: 10px;
            display: flex;
            flex-direction: column;
        `;
        
        const rightTitle = document.createElement('div');
        rightTitle.style.cssText = `
            font-weight: bold;
            margin-bottom: 10px;
        `;
        rightTitle.textContent = '已选择:';
        
        const selectedListDiv = document.createElement('div');
        selectedListDiv.id = 'selectedList';
        selectedListDiv.style.cssText = `
            flex: 1;
            overflow: auto;
        `;
        
        rightPanel.appendChild(rightTitle);
        rightPanel.appendChild(selectedListDiv);
        
        content.appendChild(leftPanel);
        content.appendChild(rightPanel);
        
        // button area
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 10px;
            border-top: 1px solid #ccc;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        `;
        
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '导入';
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        
        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);
        
        panel.appendChild(titleBar);
        panel.appendChild(content);
        panel.appendChild(footer);
        dialog.appendChild(panel);
        document.body.appendChild(dialog);
        


        // selected item state
        const selectedItems = []; // { type, id, title, node? }
        
        function updateSelectedList() {
            selectedListDiv.innerHTML = '';
            for (const item of selectedItems) {
                const div = document.createElement('div');
                div.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 5px;
                    padding: 3px;
                    background: #f0f0f0;
                    border-radius: 3px;
                `;
                div.innerHTML = `
                    <span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${item.title}</span>
                    <button class="remove-selected" data-id="${item.id}" style="background:none; border:none; cursor:pointer;">✕</button>
                `;
                selectedListDiv.appendChild(div);
            }
            
            document.querySelectorAll('.remove-selected').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const index = selectedItems.findIndex(item => item.id === id);
                    if (index !== -1) {
                        selectedItems.splice(index, 1);
                        updateSelectedList();
                        updateTreeCheckboxes();
                    }
                });
            });
        }
        
        function updateTreeCheckboxes() {
            const checkboxes = leftPanel.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                const id = cb.dataset.id;
                if (id) {
                    cb.checked = selectedItems.some(item => item.id === id);
                }
            });
        }
        
        // rendering nodes
        function renderNode(nodeData, container, level = 0) {
            const entries = Object.entries(nodeData).filter(([key]) => key !== '_cardId');
            
            for (const [title, value] of entries) {
                const nodeId = value._cardId;
                const hasChildren = Object.keys(value).some(k => k !== '_cardId');
                
                const nodeDiv = document.createElement('div');
                nodeDiv.style.marginLeft = `${level * 20}px`;
                nodeDiv.style.marginTop = '3px';
                nodeDiv.dataset.id = nodeId;
                nodeDiv.dataset.hasChildren = hasChildren;
                
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.gap = '5px';
                
                if (hasChildren) {
                    // expand and collapse button
                    const toggleBtn = document.createElement('span');
                    toggleBtn.textContent = '▶';
                    toggleBtn.style.cursor = 'pointer';
                    toggleBtn.style.fontSize = '12px';
                    toggleBtn.style.width = '16px';
                    toggleBtn.style.display = 'inline-block';
                    
                    // parent node container
                    const childrenContainer = document.createElement('div');
                    childrenContainer.style.display = 'none';
                    
                    toggleBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        const isExpanded = childrenContainer.style.display !== 'none';
                        if (!isExpanded && childrenContainer.children.length === 0) {
                            // lazy load
                            renderNode(value, childrenContainer, level + 1);
                        }
                        childrenContainer.style.display = isExpanded ? 'none' : 'block';
                        toggleBtn.textContent = isExpanded ? '▶' : '▼';
                    });
                    
                    row.appendChild(toggleBtn);
                    
                    if (nodeId) {
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.dataset.id = nodeId;
                        checkbox.checked = selectedItems.some(item => item.id === nodeId);
                        checkbox.addEventListener('change', (event) => {
                            event.stopPropagation();
                            if (checkbox.checked) {
                                if (type === 'files') {
                                    selectedItems.push({
                                        type: 'card',
                                        id: nodeId,
                                        title: title || '_untitled'
                                });
                                } else {
                                    selectedItems.push({
                                        type: 'directory',
                                        id: nodeId,
                                        title: title || '_untitled',
                                        node: value
                                    });
                                }

                            } else {
                                const index = selectedItems.findIndex(item => item.id === nodeId);
                                if (index !== -1) selectedItems.splice(index, 1);
                            }
                            updateSelectedList();
                        });
                        row.appendChild(checkbox);
                    } else {
                        const spacer = document.createElement('span');
                        spacer.style.width = '16px';
                        row.appendChild(spacer);
                    }
                    
                    const label = document.createElement('span');
                    label.textContent = title || '_untitled';
                    label.style.cssText = `
                        word-break: break-word;
                        white-space: normal;
                        max-width: 30ch;
                        min-width: 20ch;
                    `;
                    row.appendChild(label);
                    
                    nodeDiv.appendChild(row);
                    nodeDiv.appendChild(childrenContainer);
                } else {
                    // child node
                    if (nodeId) {
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.dataset.id = nodeId;
                        checkbox.checked = selectedItems.some(item => item.id === nodeId);
                        checkbox.addEventListener('change', (event) => {
                            event.stopPropagation();
                            if (checkbox.checked) {
                                selectedItems.push({
                                    type: 'card',
                                    id: nodeId,
                                    title: title || '_untitled'
                                });
                            } else {
                                const index = selectedItems.findIndex(item => item.id === nodeId);
                                if (index !== -1) selectedItems.splice(index, 1);
                            }
                            updateSelectedList();
                        });
                        row.appendChild(checkbox);
                    } else {
                        const spacer = document.createElement('span');
                        spacer.style.width = '16px';
                        row.appendChild(spacer);
                    }
                    
                    const label = document.createElement('span');
                    label.textContent = title || '_untitled';
                    label.style.cssText = `
                        word-break: break-word;
                        white-space: normal;
                        max-width: 30ch;
                        min-width: 20ch;
                    `;
                    row.appendChild(label);
                    nodeDiv.appendChild(row);
                }
                
                container.appendChild(nodeDiv);
            }
        }
        
        // initializing the root node rendering
        renderNode(tree, leftPanel, 0);
        
        // button events
        confirmBtn.addEventListener('click', () => {
            const allIds = [];
            for (const item of selectedItems) {
                if (item.type === 'card') {
                    allIds.push(item.id);
                } else if (item.type === 'directory') {
                    function collectIdsFromNode(node) {
                        allIds.push(node._cardId);
                        const entries = Object.entries(node).filter(([key]) => key !== '_cardId');
                        for (const [childTitle, childValue] of entries) {
                            const childId = childValue._cardId;
                            const hasChildren = Object.keys(childValue).some(k => k !== '_cardId');
                            if (hasChildren) {
                                collectIdsFromNode(childValue);
                            } else {
                                if (childId) allIds.push(childId);
                            }
                        }
                    }
                    collectIdsFromNode(item.node);
                }
            }
            const uniqueIds = [...new Set(allIds)];
            dialog.remove();
            resolve(uniqueIds);
        });
        
        cancelBtn.addEventListener('click', () => {
            dialog.remove();
            resolve([]);
        });
    });
}





async function importItemProcessor(ids) {
    const savedDirHandle = await getSavedDirHandle();
    for (const id of ids) {
        try {
            const fileHandle = await savedDirHandle.getFileHandle(id + '.json');
            await importCardFromFile(fileHandle);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("Import operation cancelled.");
            } else {
                console.error("File import failed:", error);
            }
        }
    }
}

// importing a card from a single file
async function importCardFromFile(fileHandle) {
    try {
        // accessing file content
        const file = await fileHandle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);
                    
        // registering
        if (data.id) {
            // preventing dulplicating
            if (!cardRegistry.some(item => item === data.id)) {
                cardRegistry.push(data.id);
            }
        }

        const importOptions = {
            width: data.size ? data.size.width : undefined,
            height: data.size ? data.size.height : undefined,
            title: data.title,
            content: data.content,
            type: data.type,
            dirParent: data.dirParent,
            logicParents: data.logicParents,
            reference: data.reference || { time: '', evidence: '' },
            id: data.id
        };

        const visualLeft = coordinateState.origin.x + parseFloat(data.position.left) * coordinateState.scale;
        const visualTop = coordinateState.origin.y + parseFloat(data.position.top) * coordinateState.scale;
        createCard(visualLeft, visualTop, importOptions);
    } catch (error) {
        console.error(`Failed to process file ${fileHandle.name}:`, error);
    }
}