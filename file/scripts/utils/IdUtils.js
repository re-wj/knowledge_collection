import { indexMap } from '../shared/IndexMap.js';



export function collisionCheck(id) {
    return indexMap.has(id);
}

// returning id path array from id
export function getPathById(id) {
    const path = [];
    let currentId = id;
    
    while (currentId && currentId !== "ROOT") {
        path.unshift(currentId);
        const node = indexMap.get(currentId);
        if (!node) throw new Error(`Data inconsistency: ${currentId} has no mapping entry`);
        currentId = node.parentId;
    }
    
    return path;
}