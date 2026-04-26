import { cardRegistry } from '../shared/Handles.js';
import { getSavedDirHandle } from '../utils/HandleUtils.js';
import { insertIndex, updateIndex } from './IndexManager.js';
import { indexMap } from '../shared/IndexMap.js';



// save with File System Access API
export async function saveCardToFile(data, isBulkUpdate=false) {
    const filename = data.id;
    if (!indexMap.get(data.dirParent) && data.dirParent !== 'ROOT') {
        console.error(`failed to save card ${filename} due to unsaved parent`);
        return null;
    }
    try {
        const storageDirHandle = await getSavedDirHandle();

        // checking whether the file exists
        let fileExists = false;
        try {
            await storageDirHandle.getFileHandle(filename + '.json');
            fileExists = true;
        } catch (error) {
            if (error.name !== 'NotFoundError') {throw error;} // unexpected error
        }

        if (fileExists && !isBulkUpdate) {
            // asking whether to overwrite if the file exists
            if (!confirm(`相同ID文件${filename}.json (${indexMap.get(filename)?.title || '_unknown'}) 已存在。\n\n点击“确定”覆盖。`)) {
                if (confirm(`是否分配新ID存储在相同位置？`)) return `id-reassignment`;
                return null;
            }
        }

        // creating or overwriting the file
        const fileHandle = await storageDirHandle.getFileHandle(filename + '.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        
        // registering the file handle
        // preventing duplicates
        if (!cardRegistry.some(item => item === filename)) {
            cardRegistry.push(filename);
        }

        // updating index and map
        if (!indexMap.get(filename)) {
            await insertIndex(filename, data.title, data.dirParent);
        } else {
            await updateIndex(filename, data.title, data.dirParent);
        }
        
        return filename;

    } catch (error) {
        console.error(`Failed to save ${filename} to directory:`, error);
        throw error; // throwing error to trigger the upper-level fallback
    }
}



// fallback downloading
export async function fallbackSave(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json;charset=utf-8' 
    });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.style.display = 'none';
    downloadLink.href = downloadUrl;
    downloadLink.download = `${data.id}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadUrl);
    }, 100);
    
    alert(`内容已通过下载方式保存为: ${data.id}.json\n` + 
          `注意: 如需直接访问文件夹，请使用 Chrome/Edge 浏览器。`);
}