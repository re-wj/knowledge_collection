import { displayContentToOriginalContent } from "../utils/FormatUtils.js";



export function pasteInit(){
    document.addEventListener('paste', paste);
}


function paste(event) {
    // ckecking if the target is .display-content or its child
    const target = event.target.closest('.display-content');
    if (!target) return;
    

    const item = event.clipboardData.items[event.clipboardData.items.length - 1];

    if (item.type.startsWith('text/')) {
        event.preventDefault();
        let lines
        const text = event.clipboardData.getData('text/plain');
        lines = text.split('\n');
        
        const range = window.getSelection().getRangeAt(0);
        range.deleteContents();
        const currentDiv = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement.closest('div') : range.startContainer.closest('div');
        const prefix = currentDiv.textContent.substring(0, range.startOffset);
        const suffix = currentDiv.textContent.substring(range.endOffset);
        range.setStartAfter(currentDiv);
        range.collapse(true);
        currentDiv.remove();

        if (lines.length > 0) {
            if (lines.length == 1){
                const firstDiv = document.createElement('div');
                firstDiv.textContent = prefix + lines[0].trim() + suffix;
                range.insertNode(firstDiv);
            } else {
                const firstDiv = document.createElement('div');
                firstDiv.textContent = prefix + lines[0].trim();
                range.insertNode(firstDiv);
                range.setStartAfter(firstDiv);
                range.collapse(true);
                // creating divs for the rest of the lines
                for (let i = 1; i < lines.length - 1; i++) {
                    const div = document.createElement('div');
                    div.textContent = lines[i].trim();
                    range.insertNode(div);
                    range.setStartAfter(div);
                    range.collapse(true);
                }
                const lastDiv = document.createElement('div');
                lastDiv.textContent = lines[lines.length - 1].trim() + suffix;
                range.insertNode(lastDiv);
            }
            window.getSelection().removeAllRanges();
        }
    } else if (item.type.startsWith('image/')) {
        return;
    }



    const originalContent = target.parentElement?.querySelector('.original-content');
    if (originalContent) {
        displayContentToOriginalContent(target, originalContent);
    }
}