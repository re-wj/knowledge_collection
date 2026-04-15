import { deleteSourceFile } from '../../../file/scripts/modules/DeleteManager.js';
import { deletedCards } from '../shared/State.js';



export async function deleteCard(card){
    if (!card) return;

    // creating confirmation dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        min-width: 300px;
    `;

    const cardTitle = card.querySelector('.title')?.textContent || '该卡片';
    dialog.innerHTML = `
        <div style="margin-bottom: 15px;">确认删除 "${cardTitle}" 吗？</div>
        <label style="display: flex; align-items: center; margin-bottom: 15px;">
            <input type="checkbox" id="deleteSourceFile" style="margin-right: 8px;">
            同时删除源文件
        </label>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="cancelDelete" style="padding: 5px 15px; cursor: pointer;">取消</button>
            <button id="confirmDelete" style="padding: 5px 15px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer;">删除</button>
        </div>
    `;
    document.body.appendChild(dialog);

    // waiting for user interaction
    return new Promise((resolve) => {
        document.getElementById('confirmDelete').addEventListener('click', async () => {
            const shouldDeleteSourceFile = document.getElementById('deleteSourceFile').checked;
            if (!card.dataset.dirParent) {
                card.remove();
            } else {
                // deleting source file if the option is checked
                if (shouldDeleteSourceFile) {
                    if (await deleteSourceFile(card.id)) card.remove();
                } else {
                    deletedCards.push(card.id);
                    card.remove();
                }
            }
            dialog.remove();
            resolve();
        });

        document.getElementById('cancelDelete').addEventListener('click', (event) => {
            event.stopPropagation();
            dialog.remove();
            resolve();
        });
    });
}