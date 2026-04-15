import { draggingInit, zoomingInit } from './modules/Operations.js';
import { contextMenuInit } from './modules/Menu.js';
import { pasteInit } from './modules/Paste.js';
import { initSidebarEvents } from './modules/PropertySidebar.js';



document.addEventListener('DOMContentLoaded', function() {
    try {
        document.execCommand('defaultParagraphSeparator', false, 'div');
    } catch (error) {
        console.error("defaultParagraphSeparator command failed", error);
    }

    draggingInit();
    zoomingInit();
    pasteInit();

    contextMenuInit();
    initSidebarEvents();
});