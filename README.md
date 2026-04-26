# Knowledge_collection
A simple offline card-based note-taking tool. Designed for personal knowledge management.

## Dependencies
#### [MathJax](https://mathjax.org/) v3.2.2 - Apache 2.0 License
This project uses MathJax for rendering mathematical formulas.  
*Notice*: MathJax is not in this repository. To enable LaTex rendering, please download from https://github.com/MathJax/MathJax/tree/legacy-v3 and rename the folder to "MathJax-3.2.2" before placing it in the same directory.

## Features
- Knowledge in entries on canvas
  - Create a card by Right-click - Add and write an entry of knowledge. The title of the card will be presented in import tree (See *Local storage system - Import*).
  - Drag the handle to move the card and drag on the background to move the viewport. Scroll to scale the viewport. Arrange the cards as you like. (The position can be saved (in source files mentioned in *Local storage system*), and dragging or scaling the viewport will not change the position of cards)
  - Open the property sidebar and select the type of the entry (as provided), record the time and reference where the entry is proposed in history.
  - Render LaTex codes in \$...\$ and \$\$...\$\$ by right-click - Render.
- Knowledge hierarchy support
  - Right click on the card to open the property sidebar and choose the parents for the card.
  - There can be one available directory parent to sort the card into the corresponding field of knowledge (If you are not certain, just save it in the TEMP, and you can modify it later.) and see the tree structure in the import window (See *Local storage system - Import*).
  - There can be more than one logic parent to reveal the logic dependencies between entries.
- Local storage system
  - Save cards by right-click - Save to save one single card or right click to open the property sidebar to use the multiselector to save a bunch of cards. *A directory parent is required before saving the card.* You can overwrite to update a card or save the card as a new copy. For older browsers, there is a fallback download method.
  - The cards are saved in a certain folder chosen when first import, save, or chosen in property sidebar. There are two auxiliary file index.json and mapping.json. *Do not modify them or add/delete file directly in the file manager.* The two files and the card source files are aligned, which means the two files can be rebuilt from the card source files.
  - Import the saved cards by right-click - Import. This will open an import window showing the hierarchy of the saved cards. In Import File(s) mode the chosen cards will be imported, and in Import Folder mode the chosen cards and their descendants will be imported. *Don't import the same cards multiple times, which is an undefined but allowed operation.*
  - Delete a card by right-click - Delete. You can determine whether to delete the source file (if there is) or simply delete the card.
  - In the property sidebar there is an update function support, which can figure out unsaved new cards (which will be put into the multiselector) and deleted but still with the source file (which will be put into the recycling bin). You can update the (imported part of) local storage to align with the displayed content. *Currently the content update is not detectable.*

## Known Issues
- Cross-line Paste Corruption: When replacing existing text that spans multiple lines by pasting, the operation may corrupt the card's content structure by deleting the text's container. *A fix using the execCommand API is under consideration currently.*
- Potential Dangling References: Deleting cards that are referenced as directory or logic parents may leave their children cards (imported or not) with dangling references to non-existent parent cards.
- Large-scale Rendering Performance: Whether zooming and panning with hundreds of cards visible can cause lag is awaiting practical testing.

## Further Development
- Directory-level Dragging: Move an entire card hierarchy (parent card with all its descendants) while maintaining relative positions.
- Historical Knowledge View: Filter card visibility by proposal time to reconstruct the state of knowledge at specific historical moments.
- Image Support: Proper image embedding within card content and local management.