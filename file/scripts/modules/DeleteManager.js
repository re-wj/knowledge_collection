import { cardRegistry } from '../shared/Handles.js';
import { getSavedDirHandle } from '../utils/HandleUtils.js';
import { deleteIndex } from './IndexManager.js';



// deletion API
export async function deleteSourceFile(filename) {
    try {
        const savedDirHandle = await getSavedDirHandle();
                    
        // attempting to get the file
        let fileHandle;
        try {
            fileHandle = await savedDirHandle.getFileHandle(`${filename}.json`);
        } catch (error) {
            // file does not exist
            console.log('Source file does not exist, skipping deletion');
            return false;
        }
        if (!fileHandle) return false;

        await savedDirHandle.removeEntry(fileHandle.name);
        console.log(`Source file deleted: ${filename}.json`);
                        
        // removing from registy
        const index = cardRegistry.findIndex(item => item === filename);
        if (index !== -1) {
            cardRegistry.splice(index, 1);
            console.log(`Removed from registry: ${filename}`);
        }
        
        // removing from index
        await deleteIndex(filename);

        return true;
    } catch (error) {
        console.error(`Failed to delete source file ${filename}.json:`, error);
        return false;
    }
}