import { handles } from '../shared/Handles.js';
import { initializeIndexFile, readMappingFile } from '../modules/IndexManager.js';



// return the saved root directory handle
export async function getSavedDirHandle() {
    let savedDirHandle = handles.savedDirHandle
    if (savedDirHandle) {
        try {
            await savedDirHandle.queryPermission({ mode: 'readwrite' });
            return savedDirHandle;
        } catch (error) {
            console.log("Previous directory access revoked:", error);
            savedDirHandle = null;
        }
    } else {
        alert('请先设置保存根目录');
    }

    savedDirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: savedDirHandle || 'documents'
    });

    handles.savedDirHandle = savedDirHandle

    await initializeIndexFile();
    await readMappingFile();

    return savedDirHandle;
}

// return the index file handle in the root directory
export async function getIndexHandle() {
    let indexHandle = handles.indexHandle;
    if (indexHandle) {
        try {
            await indexHandle.queryPermission({ mode: 'readwrite' });
            return indexHandle;
        } catch (error) {
            console.log("Previous index file access revoked:", error);
            indexHandle = null;
        }
    } else {
        try {
            const savedDirHandle = await getSavedDirHandle();
            indexHandle = await savedDirHandle.getFileHandle('index.json');
            handles.indexHandle = indexHandle;
        } catch (error) {
            throw error;
        }
        
    }
    return indexHandle;
}

// return the mapping file handle in the root directory
export async function getMappingHandle() {
    let mappingHandle = handles.mappingHandle;
    if (mappingHandle) {
        try {
            await mappingHandle.queryPermission({ mode: 'readwrite' });
            return mappingHandle;
        } catch (error) {
            console.log("Previous mapping file access revoked:", error);
            mappingHandle = null;
        }
    } else {
        try {
            const savedDirHandle = await getSavedDirHandle();
            mappingHandle = await savedDirHandle.getFileHandle('mapping.json');
            handles.mappingHandle = mappingHandle;
        } catch (error) {
            throw error;
        }

    }
    return mappingHandle;
}