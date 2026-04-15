import { getSavedDirHandle, getIndexHandle, getMappingHandle } from '../utils/HandleUtils.js';
import { getPathById } from '../utils/IdUtils.js';
import { indexMap } from '../shared/IndexMap.js';



export async function readIndexFile() {
    const indexHandle = await getIndexHandle();
    const file = await indexHandle.getFile();
    const tree = JSON.parse(await file.text());
    return tree;
}

export async function readMappingFile() {
    const mappingHandle = await getMappingHandle();
    const file = await mappingHandle.getFile();
    const data = JSON.parse(await file.text());
    
    indexMap.clear();
    for (const [id, value] of Object.entries(data)) {
        indexMap.set(id, value);
    }
    
    return indexMap;
}

export async function initializeIndexFile() {
    // checking if index.json exists
    try {
        const indexHandle = await getIndexHandle();
        await indexHandle.getFile();
    } catch (error) {
        if (error.name === 'NotFoundError') {
            // creating empty index.json
            const savedDirHandle = await getSavedDirHandle();
            const indexHandle = await savedDirHandle.getFileHandle('index.json', { create: true });
            const tree = { TEMP: {} };
            const writable = await indexHandle.createWritable();
            await writable.write(JSON.stringify(tree, null, 2));
            await writable.close();
        } else {
            throw error;
        }
    }
    
    // checking if mapping.json exists
    try {
        const mappingHandle = await getMappingHandle();
        await mappingHandle.getFile();
    } catch (error) {
        if (error.name === 'NotFoundError') {
            // creating empty mapping.json
            const savedDirHandle = await getSavedDirHandle();
            const mappingHandle = await savedDirHandle.getFileHandle('mapping.json', { create: true });
            const mapping = {"TEMP": { title: "TEMP", parentId: "ROOT" }};
            const writable = await mappingHandle.createWritable();
            await writable.write(JSON.stringify(mapping, null, 2));
            await writable.close();
        } else {
            throw error;
        }
    }
}

async function updateIndexFile(tree) {
    const indexHandle = await getIndexHandle();
    const writable = await indexHandle.createWritable();
    await writable.write(JSON.stringify(tree, null, 2));
    await writable.close();
}

async function updateMappingFile(mapping) {
    const mappingHandle = await getMappingHandle();
    const writable = await mappingHandle.createWritable();
    await writable.write(JSON.stringify(mapping, null, 2));
    await writable.close();
}



function getNodeByPath(tree, path) {
    let current = tree;
    for (const segmentId of path) {
        const segmentTitle = indexMap.get(segmentId).title;
        current = current[segmentTitle];
    }
    return current;
}



export function moveChildren(currentParentNode, newParentNode, newParentId) {
    const children = Object.keys(currentParentNode).filter(key => key !== '_cardId');
    for (const childTitle of children) {
        const childValue = currentParentNode[childTitle];
        const childId = childValue._cardId;

        delete currentParentNode[childTitle];
        newParentNode[childTitle] = childValue;

        const childInfo = indexMap.get(childId);
        if (childInfo) {
            childInfo.parentId = newParentId;
        }
    }
}


export async function insertIndex(id, title, parentId) {
    if (!parentId) return false;

    // 1. read index.json
    const tree = await readIndexFile();
    
    // 2. locating dirParent
    const parent = getNodeByPath(tree, getPathById(parentId));
    
    // 3. inserting card
    parent[title] = { _cardId: id };
    
    // 4. updating index
    await updateIndexFile(tree);
    
    // 5. updating mapping
    indexMap.set(id, { title, parentId });
    const mappingData = Object.fromEntries(indexMap);
    await updateMappingFile(mappingData);

    return true;
}

export async function updateIndex(id, newTitle = null, newParentId = null) {
    // 1. reading index
    const tree = await readIndexFile();
    const nodeInfo = indexMap.get(id);
    if (!nodeInfo) return false;

    const currentTitle = nodeInfo.title;
    const currentParentId = nodeInfo.parentId;
    newTitle = newTitle || currentTitle;
    newParentId = newParentId || currentParentId;
    if (newParentId === currentParentId && newTitle === currentTitle) return false;

    // 2. locating nodes
    const currentParent = getNodeByPath(tree, getPathById(nodeInfo.parentId));
    const currentNode = currentParent[nodeInfo.title];
    const newParent = getNodeByPath(tree, getPathById(newParentId));

    // 3. determining target location
    const targetParent = (newParentId !== currentParentId) ? newParent : currentParent;
    const targetTitle = (newTitle !== currentTitle) ? newTitle : currentTitle;
    targetParent[targetTitle] = currentNode;
    delete currentParent[currentTitle];

    // 4. updating index
    await updateIndexFile(tree);

    // 5. updating mapping
    indexMap.set(id, { title: newTitle, parentId: newParentId });
    const mappingData = Object.fromEntries(indexMap);
    await updateMappingFile(mappingData);

    return true;
}

export async function deleteIndex(id) {
    const nodeInfo = indexMap.get(id);
    if (!nodeInfo) return false; // node not found
    
    // 1. reading index
    const tree = await readIndexFile();
    
    // 2. locating node
    const parentId = nodeInfo.parentId;
    const parent = getNodeByPath(tree, getPathById(parentId));
    const current = parent[nodeInfo.title];

    // 3. modifying children
    moveChildren(current, tree.TEMP, "TEMP");

    delete parent[nodeInfo.title];
    indexMap.delete(id);

    await updateIndexFile(tree);
    const mappingData = Object.fromEntries(indexMap);
    await updateMappingFile(mappingData);

    return true;
}