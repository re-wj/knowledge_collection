// --- displayContent → originalContent ---
export function displayContentToOriginalContent(displayContentElement, originalContentElement) {
    const divs = Array.from(displayContentElement.children);
    let inLatexBlock = false;
    let latexBuffer = [];
    let tempHtml = '';
    for (let div of divs) {
        const text = div.innerHTML;
        if (!inLatexBlock && text.startsWith('$$')) {
            inLatexBlock = true;
            latexBuffer = [text];
            if (text.endsWith('$$') && text.trim() !== '$$') {
                // one-line LaTeX block
                tempHtml += `<div>${text}</div>`;
                inLatexBlock = false;
                latexBuffer = [];
            }
        } else if (inLatexBlock) {
            latexBuffer.push(text);
            if (text.endsWith('$$')) {
            // constructing LaTex block
                let latexContent = latexBuffer.join('\n');
                tempHtml += `<div>${latexContent}</div>`;
                inLatexBlock = false;
                latexBuffer = [];
            }
        } else {
            tempHtml += `<div>${text}</div>`;
        }
    }
    // unfinished LaTex block at the end
    if (inLatexBlock && latexBuffer.length > 0) {
        let latexContent = latexBuffer.join('\n');
        tempHtml += `<div>${latexContent}</div>`;
    }
    originalContentElement.innerHTML = tempHtml;
}



//  --- originalContent → displayContent (LaTeX Format) ---
export function LaTexFormat(originalContentElement, displayContentElement) {
    // clear display-content
    displayContentElement.innerHTML = '';
    // insert original-content div into display-content
    const divs = Array.from(originalContentElement.children);
    for (let div of divs) {
        const newDiv = document.createElement('div');
        newDiv.innerHTML = div.innerHTML.replace(/\n/g, '');
        displayContentElement.appendChild(newDiv);
    }
    // setting display-content to non-editable
    displayContentElement.setAttribute('contenteditable', 'false');

    // MathJax rendering
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([displayContentElement]);
    }
    displayContentElement.setAttribute('LaTex-rendered', 'true');
}

//  --- originalContent → displayContent (Original Format) ---
export function originalFormat(originalContentElement, displayContentElement) {
    displayContentElement.innerHTML = '';
    const divs = Array.from(originalContentElement.children);
    for (let div of divs) {
        const text = div.innerHTML;
        if (text.startsWith('$$') && text.endsWith('$$')) {
            // LaTeX
            let lines = text.split('\n');
            lines.forEach(line => {
                displayContentElement.appendChild(document.createElement('div')).innerHTML = line.trim();
            });
        } else {
            // plain text
            displayContentElement.appendChild(document.createElement('div')).innerHTML = text;
        }
    }
    // setting display-content to editable
    displayContentElement.setAttribute('contenteditable', 'true');
    if (displayContentElement.hasAttribute('LaTex-rendered')) {
        displayContentElement.removeAttribute('LaTex-rendered');
    }
}