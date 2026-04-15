import { saveCardToFile, fallbackSave } from '../../../file/scripts/modules/SaveManager.js';
import { bulkUpdateList } from '../shared/State.js';
import { assigningId } from '../utils/IdUtils.js';



export async function saveCard(card, isBulkUpdate=false){
    if (!card.dataset.dirParent && !isBulkUpdate){
        if (!confirm("该卡片未设置目录上级，是否保存到临时目录？\n\n点击“确定”保存，点击“取消”返回修改。")) return;
    }

    const cardData = {
        position: {
            left: card.style.left,
            top: card.style.top
        },
        size: {
            width: card.style.width,
            height: card.style.height
        },
        title: card.querySelector('.title').textContent.trim(),
        content: card.querySelector('.original-content').innerHTML.trim(),
        type: card.dataset.cardType,
        dirParent: card.dataset.dirParent || 'TEMP',
        logicParents: JSON.parse(card.dataset.logicParents || '[]'),
        reference: card.dataset.reference ? JSON.parse(card.dataset.reference) : null,
        id: card.id
    };

    try {
        if (!window.showDirectoryPicker) {
            throw new Error("File System Access API not supported");
        }
        let file
        file = await saveCardToFile(cardData, isBulkUpdate);
        let attempts = 0;
        const maxAttempts = 5;
        let length = 16;
        while (file === `id-reassignment`) {
            // reassigning a new id to make a new version of the card
            card.id = assigningId(length);
            cardData.id = card.id;
            file = await saveCardToFile(cardData, isBulkUpdate);
            attempts++;
            if (attempts >= maxAttempts) {
                length +=4;
                attempts = 0;
            }
        }
        if (file) {
            if (isBulkUpdate) {
                bulkUpdateList.push(`${file} (${cardData.title})`);
            } else {
                alert(`Card saved: `+cardData.title);
            }
        }
    } catch (error) {
        await fallbackSave(cardData);
    }
}