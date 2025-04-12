import React, { useState, useRef, useEffect, useCallback } from 'react';
import CharacterSummary from './CharacterSummary';
import './VirtualTableTop.css';
import { FaTrash } from 'react-icons/fa';

const CELL_SIZE = 40; // 40px per cell

const VirtualTableTop = ({ 
  characters = [], 
  objects = [],
  terrain = [],
  gridElements = [],
  history = [],
  currentTime = 0, 
  onMoveCharacter,
  onSelectCharacter,
  gridRows = 20,
  gridColumns = 20,
  onMoveObject,
  onDeleteObject,
  onMoveTerrain,
  onDeleteTerrain,
  onUpdateGridSize
}) => {
  const canvasRef = useRef(null);
  const [draggingItem, setDraggingItem] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  
  const GRID_COLOR = '#ccc';
  const HIGHLIGHT_COLOR = 'rgba(100, 100, 255, 0.3)';
  const OBJECT_COLOR = '#9C27B0'; // Purple for objects
  const TERRAIN_COLOR = '#8B4513'; // Brown for terrain
  const TERRAIN_LINE_WIDTH = 3;
  
  const getGridCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, canvasX: 0, canvasY: 0 }; // Handle case where canvas is not yet available
    const rect = canvas.getBoundingClientRect();
    const LABEL_SPACE = 20;
    
    // Calculate the scale factor between canvas logical size and displayed size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get position in canvas space (handle both mouse and touch events)
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      // Use the first touch point for touch events
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Use standard clientX/Y for mouse events
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const canvasX = (clientX - rect.left) * scaleX - LABEL_SPACE;
    const canvasY = (clientY - rect.top) * scaleY - LABEL_SPACE;
    
    // Convert to grid coordinates
    const gridX = Math.floor(canvasX / CELL_SIZE);
    const gridY = Math.floor(canvasY / CELL_SIZE);
    
    // Return raw canvas coordinates as well for precise item checking
    return { x: gridX, y: gridY, canvasX, canvasY };
  }, [canvasRef]); // Dependencies updated based on ESLint warning

  // --- Drawing Functions (wrapped in useCallback) ---
  const drawCharacter = useCallback((ctx, character) => {
    const { x, y, name, race } = character;
    if (x < 0 || y < 0 || x >= gridColumns || y >= gridRows) return;
    
    ctx.fillStyle = race === 'HUMAN' ? '#2196F3' : '#FF9800';
    ctx.beginPath();
    ctx.arc(
      x * CELL_SIZE + CELL_SIZE / 2,
      y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      name.charAt(0),
      x * CELL_SIZE + CELL_SIZE / 2,
      y * CELL_SIZE + CELL_SIZE / 2
    );
  }, [gridColumns, gridRows]); // Dependencies updated based on ESLint warning

  const drawObject = useCallback((ctx, obj) => {
    const { x, y, name } = obj;
    if (x < 0 || y < 0 || x >= gridColumns || y >= gridRows) return;

    ctx.fillStyle = OBJECT_COLOR;
    const objSize = CELL_SIZE - 8;
    const objX = x * CELL_SIZE + 4;
    const objY = y * CELL_SIZE + 4;
    ctx.fillRect(objX, objY, objSize, objSize);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      name.charAt(0).toUpperCase(),
      x * CELL_SIZE + CELL_SIZE / 2,
      y * CELL_SIZE + CELL_SIZE / 2
    );
  }, [gridColumns, gridRows, OBJECT_COLOR]); // Dependencies updated based on ESLint warning

  const drawTerrainElement = useCallback((ctx, terrainElement) => {
    const { type, startX, startY, length, color } = terrainElement;
    ctx.strokeStyle = color || TERRAIN_COLOR;
    ctx.lineWidth = TERRAIN_LINE_WIDTH;
    ctx.beginPath();

    switch (type) {
      case 'VERTICAL_LINE':
        ctx.moveTo(
          startX * CELL_SIZE,
          startY * CELL_SIZE
        );
        ctx.lineTo(
          startX * CELL_SIZE,
          (startY + length) * CELL_SIZE
        );
        break;
      case 'HORIZONTAL_LINE':
        ctx.moveTo(
          startX * CELL_SIZE,
          startY * CELL_SIZE
        );
        ctx.lineTo(
          (startX + length) * CELL_SIZE,
          startY * CELL_SIZE
        );
        break;
      case 'DIAGONAL_LINE':
        ctx.moveTo(
          startX * CELL_SIZE,
          startY * CELL_SIZE
        );
        ctx.lineTo(
          (startX + length) * CELL_SIZE,
          (startY + length) * CELL_SIZE
        );
        break;
      default:
        // Optional: Log unknown terrain type
        console.warn(`Unknown terrain type: ${type}`);
        break;
    }
    
    ctx.stroke();
  }, [TERRAIN_COLOR, TERRAIN_LINE_WIDTH]); // Dependencies updated based on ESLint warning
  // --- End Drawing Functions ---

  // Effect for drawing the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size based on grid dimensions plus space for labels
    const LABEL_SPACE = 20; // Space for coordinate labels
    canvas.width = (gridColumns * CELL_SIZE) + LABEL_SPACE;
    canvas.height = (gridRows * CELL_SIZE) + LABEL_SPACE;
    
    // Calculate and set aspect ratio dynamically
    canvas.style.aspectRatio = `${(gridColumns * CELL_SIZE + LABEL_SPACE) / (gridRows * CELL_SIZE + LABEL_SPACE)}`;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw coordinate labels
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    // Draw X coordinates
    for (let i = 0; i < gridColumns; i++) {
      ctx.fillText(`${i * 5}'`, (i * CELL_SIZE) + LABEL_SPACE + CELL_SIZE/2, LABEL_SPACE/2);
    }
    
    // Draw Y coordinates
    ctx.textAlign = 'right';
    for (let i = 0; i < gridRows; i++) {
      ctx.fillText(`${i * 5}'`, LABEL_SPACE - 2, (i * CELL_SIZE) + LABEL_SPACE + CELL_SIZE/2);
    }
    
    // Translate context to account for label space
    ctx.translate(LABEL_SPACE, LABEL_SPACE);
    
    // Draw grid
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= gridColumns; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
    }
    
    for (let i = 0; i <= gridRows; i++) {
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw grid elements
    gridElements.forEach(element => {
      ctx.strokeStyle = element.color || '#000';
      ctx.lineWidth = 2;
      
      switch (element.type) {
        case 'LINE':
          if (element.coordinates.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(
              element.coordinates[0].x * CELL_SIZE + CELL_SIZE / 2,
              element.coordinates[0].y * CELL_SIZE + CELL_SIZE / 2
            );
            
            for (let i = 1; i < element.coordinates.length; i++) {
              ctx.lineTo(
                element.coordinates[i].x * CELL_SIZE + CELL_SIZE / 2,
                element.coordinates[i].y * CELL_SIZE + CELL_SIZE / 2
              );
            }
            ctx.stroke();
          }
          break;
          
        case 'SQUARE':
          if (element.coordinates.length >= 1) {
            const { x, y } = element.coordinates[0];
            ctx.strokeRect(
              x * CELL_SIZE + 2,
              y * CELL_SIZE + 2,
              CELL_SIZE - 4,
              CELL_SIZE - 4
            );
          }
          break;
          
        case 'CIRCLE':
          if (element.coordinates.length >= 1) {
            const { x, y } = element.coordinates[0];
            ctx.beginPath();
            ctx.arc(
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2,
              CELL_SIZE / 2 - 2,
              0,
              Math.PI * 2
            );
            ctx.stroke();
          }
          break;
          
        case 'X_MARK':
          if (element.coordinates.length >= 1) {
            const { x, y } = element.coordinates[0];
            const padding = 5;
            ctx.beginPath();
            // Top-left to bottom-right
            ctx.moveTo(x * CELL_SIZE + padding, y * CELL_SIZE + padding);
            ctx.lineTo((x + 1) * CELL_SIZE - padding, (y + 1) * CELL_SIZE - padding);
            // Top-right to bottom-left
            ctx.moveTo((x + 1) * CELL_SIZE - padding, y * CELL_SIZE + padding);
            ctx.lineTo(x * CELL_SIZE + padding, (y + 1) * CELL_SIZE - padding);
            ctx.stroke();
          }
          break;
          
        case 'V_MARK':
          if (element.coordinates.length >= 1) {
            const { x, y } = element.coordinates[0];
            const padding = 5;
            ctx.beginPath();
            // Left arm of V
            ctx.moveTo(x * CELL_SIZE + padding, y * CELL_SIZE + padding);
            ctx.lineTo(x * CELL_SIZE + CELL_SIZE / 2, (y + 1) * CELL_SIZE - padding);
            // Right arm of V
            ctx.lineTo((x + 1) * CELL_SIZE - padding, y * CELL_SIZE + padding);
            ctx.stroke();
          }
          break;
          
        default:
          break;
      }
    });
    
    // Draw regular characters
    characters.forEach(character => {
      drawCharacter(ctx, character);
    });

    // Draw regular objects
    objects.forEach(obj => {
      drawObject(ctx, obj);
    });

    // Draw ghost character if dragging
    if (draggingItem?.type === 'character' && hoveredCell) {
      ctx.globalAlpha = 0.5;
      drawCharacter(ctx, {
        ...draggingItem.item,
        x: hoveredCell.x,
        y: hoveredCell.y
      });
      ctx.globalAlpha = 1.0;
    }

    // Draw ghost object if dragging
    if (draggingItem?.type === 'object' && hoveredCell) {
      ctx.globalAlpha = 0.5;
      drawObject(ctx, {
        ...draggingItem.item,
        x: hoveredCell.x,
        y: hoveredCell.y
      });
      ctx.globalAlpha = 1.0;
    }

    // Draw regular terrain elements
    terrain.forEach(terrainElement => {
      drawTerrainElement(ctx, terrainElement);
    });

    // Draw ghost terrain if dragging
    if (draggingItem?.type === 'terrain' && hoveredCell) {
      ctx.globalAlpha = 0.5;
      drawTerrainElement(ctx, {
        ...draggingItem.item,
        startX: hoveredCell.x,
        startY: hoveredCell.y
      });
      ctx.globalAlpha = 1.0;
    }

    // Highlight hovered cell ONLY if NOT dragging an item
    if (hoveredCell && !draggingItem) {
      const { x, y } = hoveredCell;
       // Check if hover position is valid grid cell
      if (x >= 0 && y >= 0 && x < gridColumns && y < gridRows) {
        ctx.fillStyle = HIGHLIGHT_COLOR;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
    
    // Reset transform before finishing
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Ensure draggingItem state changes also trigger redraw if needed for visual feedback
  }, [gridRows, gridColumns, characters, objects, terrain, gridElements, hoveredCell, draggingItem, drawCharacter, drawObject, drawTerrainElement]); // Add draw functions to dependencies

  // Effect to handle passive touchmove listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // The actual handler function remains the same
    const touchMoveHandler = (e) => {
      if (draggingItem) {
        // *** PREVENT SCROLLING DURING DRAG ***
        e.preventDefault();
        const { x, y } = getGridCoordinates(e); // Use updated function
        setHoveredCell({ x, y });
        // Optional: Visual feedback during drag
        // drawCanvas(); // drawCanvas is not defined, drawing happens in the main useEffect
      }
    };

    // Add listener with passive: false
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });

    // Cleanup function to remove listener
    return () => {
      canvas.removeEventListener('touchmove', touchMoveHandler);
    };
  }, [draggingItem, getGridCoordinates]); // Add dependencies

  const handleCanvasMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click for dragging
    setContextMenu(null); // Close context menu on new click
    // Use findItemAt with canvas coordinates AND get grid coords
    const { x: gridX, y: gridY, canvasX, canvasY } = getGridCoordinates(e);
    const item = findItemAt(canvasX, canvasY);

    if (item) {
      // Store the grid coordinates where the drag started
      setDraggingItem({ ...item, startGridX: gridX, startGridY: gridY });
      // DO NOT select character here
      // Prevent text selection during drag
      e.preventDefault();
    } else {
      setDraggingItem(null);
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    const { x, y } = getGridCoordinates(e);
    setHoveredCell({ x, y });

    if (draggingItem) {
      // Optional: Add visual feedback during drag if needed
      // This redraws on every move, might be intensive.
      // Consider drawing a ghost item instead of full redraw.
      // drawCanvas(); // Re-draw to show item moving (if desired)
    }
  };
  
  const handleCanvasMouseUp = (e) => {
    if (e.button !== 0 || !draggingItem) {
      // If it wasn't a left click or nothing was being dragged, clear state
      if (draggingItem) setDraggingItem(null);
      return;
    }

    const { x: endGridX, y: endGridY } = getGridCoordinates(e);

    // Check if the drop position is different from the start grid position
    if (endGridX !== draggingItem.startGridX || endGridY !== draggingItem.startGridY) {
      // It was a drag - Call the appropriate move handler
      if (draggingItem.type === 'character' && onMoveCharacter) {
        onMoveCharacter(draggingItem.id, endGridX, endGridY);
      } else if (draggingItem.type === 'object' && onMoveObject) {
        onMoveObject(draggingItem.id, endGridX, endGridY);
      } else if (draggingItem.type === 'terrain' && onMoveTerrain) {
        // Pass the new start coordinates for terrain
        onMoveTerrain(draggingItem.id, endGridX, endGridY);
      }
    } else {
      // It was a click/tap (no movement) - Select character if applicable
      if (draggingItem.type === 'character' && onSelectCharacter) {
        onSelectCharacter(draggingItem.id);
      }
      // Potentially handle clicks on objects/terrain here if needed later
    }

    setDraggingItem(null);
    setHoveredCell(null);
  };

  const handleCanvasMouseLeave = () => {
    if (draggingItem) {
      // Optional: Cancel drag if mouse leaves canvas
      // setDraggingItem(null);
    }
    setHoveredCell(null);
  };

  const handleContextMenu = (e) => {
    e.preventDefault(); // Prevent browser default context menu
    const { canvasX, canvasY } = getGridCoordinates(e);
    const clickedItem = findItemAt(canvasX, canvasY);

    if (clickedItem && (clickedItem.type === 'object' || clickedItem.type === 'terrain')) {
      setContextMenu({
        x: e.clientX, // Position menu based on screen coords
        y: e.clientY,
        itemType: clickedItem.type,
        itemId: clickedItem.id
      });
    } else {
      setContextMenu(null); // Close if clicking empty space or character
    }
  };

  const handleDeleteContextItem = () => {
    if (!contextMenu) return;
    const { itemType, itemId } = contextMenu;
    if (itemType === 'object') {
      onDeleteObject(itemId);
    } else if (itemType === 'terrain') {
      onDeleteTerrain(itemId);
    }
    setContextMenu(null); // Close menu after action
  };

  // Function to find item at canvas coordinates
  const findItemAt = (canvasX, canvasY) => {
    const gridX = Math.floor(canvasX / CELL_SIZE);
    const gridY = Math.floor(canvasY / CELL_SIZE);

    // Check terrain elements first (they should be under other elements)
    for (const terr of terrain) {
      switch (terr.type) {
        case 'VERTICAL_LINE':
          if (gridX === terr.startX && 
              gridY >= terr.startY && 
              gridY <= terr.startY + terr.length) {
            return { type: 'terrain', id: terr.terrainId, item: terr };
          }
          break;
        case 'HORIZONTAL_LINE':
          if (gridY === terr.startY && 
              gridX >= terr.startX && 
              gridX <= terr.startX + terr.length) {
            return { type: 'terrain', id: terr.terrainId, item: terr };
          }
          break;
        case 'DIAGONAL_LINE':
          // For diagonal lines, check if the click is near the line
          const dx = gridX - terr.startX;
          const dy = gridY - terr.startY;
          if (dx >= 0 && dx <= terr.length && 
              dy >= 0 && dy <= terr.length && 
              Math.abs(dx - dy) <= 1) {
            return { type: 'terrain', id: terr.terrainId, item: terr };
          }
          break;
        default:
          // Optional: Log unknown terrain type during check
          // console.warn(`Unknown terrain type in findItemAt: ${terr.type}`);
          break;
      }
    }

    // Check characters (center check)
    for (const char of characters) {
      const charCenterX = char.x * CELL_SIZE + CELL_SIZE / 2;
      const charCenterY = char.y * CELL_SIZE + CELL_SIZE / 2;
      const radius = CELL_SIZE / 2 - 4;
      if (Math.sqrt((canvasX - charCenterX)**2 + (canvasY - charCenterY)**2) <= radius) {
        return { type: 'character', id: char.characterId, item: char };
      }
    }

    // Check objects (simple square check)
    for (const obj of objects) {
      if (gridX === obj.x && gridY === obj.y) {
        // More precise check if needed (e.g., within a smaller square)
        const objLeft = obj.x * CELL_SIZE + 4;
        const objTop = obj.y * CELL_SIZE + 4;
        const objSize = CELL_SIZE - 8;
        if (canvasX >= objLeft && canvasX <= objLeft + objSize && canvasY >= objTop && canvasY <= objTop + objSize) {
          return { type: 'object', id: obj.objectId, item: obj };
        }
      }
    }

    return null; // Nothing found
  };

  // --- ADD TOUCH HANDLERS ---
  const handleCanvasTouchStart = (e) => {
    // Use findItemAt with canvas coordinates AND get grid coords
    const { x: gridX, y: gridY, canvasX, canvasY } = getGridCoordinates(e);
    const item = findItemAt(canvasX, canvasY);

    if (item) {
      // Store the grid coordinates where the drag started
      setDraggingItem({ ...item, startGridX: gridX, startGridY: gridY });
      // DO NOT select character here
      // Prevent default only if an item is being dragged to allow scrolling otherwise
      // e.preventDefault(); // Maybe remove this? Test touch scrolling on empty areas.
    } else {
      setDraggingItem(null);
    }
    setContextMenu(null);
  };

  const handleCanvasTouchEnd = (e) => {
    if (draggingItem) {
      // For touchend, coordinates are on e.changedTouches
      const touch = e.changedTouches[0];
      // Ensure touch exists before proceeding (it might not on cancel)
      if (!touch) {
         setDraggingItem(null);
         setHoveredCell(null);
         return;
      }
      const endCoords = getGridCoordinates(touch); // Pass the touch object
      const { x: endGridX, y: endGridY } = endCoords;

      // Check if the drop position is different from the start grid position
      if (endGridX !== draggingItem.startGridX || endGridY !== draggingItem.startGridY) {
         // It was a drag - Call the appropriate move handler
        if (draggingItem.type === 'character' && onMoveCharacter) {
          onMoveCharacter(draggingItem.id, endGridX, endGridY);
        } else if (draggingItem.type === 'object' && onMoveObject) {
          onMoveObject(draggingItem.id, endGridX, endGridY);
        } else if (draggingItem.type === 'terrain' && onMoveTerrain) {
          onMoveTerrain(draggingItem.id, endGridX, endGridY);
        }
      } else {
        // It was a click/tap (no movement) - Select character if applicable
        if (draggingItem.type === 'character' && onSelectCharacter) {
          onSelectCharacter(draggingItem.id);
        }
        // Potentially handle taps on objects/terrain here if needed later
      }
    }
    // Always clear dragging state on touch end/cancel
    setDraggingItem(null);
    setHoveredCell(null);
  };
  // --- END OF TOUCH HANDLERS ---

  // Moved drawCharacter, drawObject, drawTerrainElement outside and wrapped in useCallback above

  /* // Original drawCharacter (now moved and wrapped)
  function drawCharacter(ctx, character) {
    const { x, y, name, race } = character;
    if (x < 0 || y < 0 || x >= gridColumns || y >= gridRows) return;
    
    ctx.fillStyle = race === 'HUMAN' ? '#2196F3' : '#FF9800';
    ctx.beginPath();
    ctx.arc(
      x * CELL_SIZE + CELL_SIZE / 2,
      y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      name.charAt(0),
      x * CELL_SIZE + CELL_SIZE / 2,
      y * CELL_SIZE + CELL_SIZE / 2
    );
  }
  */

  /* // Original drawObject (now moved and wrapped)
  function drawObject(ctx, obj) {
    const { x, y, name } = obj;
    if (x < 0 || y < 0 || x >= gridColumns || y >= gridRows) return;

    ctx.fillStyle = OBJECT_COLOR;
    const objSize = CELL_SIZE - 8;
    const objX = x * CELL_SIZE + 4;
    const objY = y * CELL_SIZE + 4;
    ctx.fillRect(objX, objY, objSize, objSize);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      name.charAt(0).toUpperCase(),
      x * CELL_SIZE + CELL_SIZE / 2,
      y * CELL_SIZE + CELL_SIZE / 2
    );
  }
  */

  return (
    <div className="virtual-tabletop">
      <div className="grid-controls">
        <div className="grid-size-control">
          <label>Height:</label>
          <button onClick={() => onUpdateGridSize(gridRows - 1, gridColumns)} disabled={gridRows <= 10}>-</button>
          <span>{gridRows * 5}'</span>
          <button onClick={() => onUpdateGridSize(gridRows + 1, gridColumns)}>+</button>
        </div>
        <div className="grid-size-control">
          <label>Width:</label>
          <button onClick={() => onUpdateGridSize(gridRows, gridColumns - 1)} disabled={gridColumns <= 10}>-</button>
          <span>{gridColumns * 5}'</span>
          <button onClick={() => onUpdateGridSize(gridRows, gridColumns + 1)}>+</button>
        </div>
      </div>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
          onContextMenu={handleContextMenu}
          onTouchStart={handleCanvasTouchStart}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchCancel={handleCanvasTouchEnd}
        />
      </div>
      <CharacterSummary 
        characters={characters}
        history={history}
        currentTime={currentTime}
        onSelectCharacter={onSelectCharacter}
      />
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="vtt-context-menu"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          <button onClick={handleDeleteContextItem}>
            <FaTrash /> Delete {contextMenu.itemType}
          </button>
        </div>
      )}
    </div>
  );
};

export default VirtualTableTop;
