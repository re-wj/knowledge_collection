# Knowledge_collection
A simple offline card-based note-taking tool. Designed for personal knowledge management.

## Dependencies
### [MathJax](https://mathjax.org/) v3.2.2 - Apache 2.0 License
This project uses MathJax for rendering mathematical formulas.  
*Notice*: MathJax is not in this repository. To enable LaTex rendering, please download from https://github.com/MathJax/MathJax/tree/legacy-v3 and rename the folder as "MathJax-3.2.2" before placing it in the same directory.

## Features
(To be done.)

## Known Issues
- Cross-line Paste Corruption: When replacing existing text that spans multiple lines by pasting, the operation may corrupt the card's content structure by deleting the text's container. *A fix using the execCommand API is under consideration currently.*
- Potential Dangling References: Deleting cards that are referenced as directory or logic parents may leave their children cards (imported or not) with dangling references to non-existent parent cards.
- Large-scale Rendering Performance: Whether zooming and panning with hundreds of cards visible can cause lag is awaiting practical testing.

## Further Development
- Directory-level Dragging: Move an entire card hierarchy (parent card with all its descendants) while maintaining relative positions.

- Historical Knowledge View: Filter card visibility by proposal time to reconstruct the state of knowledge at specific historical moments.

- Image Support: Proper image embedding within card content and local management.