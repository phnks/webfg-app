import React, { useState, useRef, useEffect } from 'react';
import './VirtualTableTop.css';

const CELL_SIZE = 30; // 30px per cell

const VirtualTableTop = ({ 
  characters = [], 
  gridElements = [], 
  onMoveCharacter,
  gridRows = 20,
  gridColumns = 20,
  onUpdateGridSize
}) => {
  const canvasRef = useRef(null);
  const [draggingCharacter, setDraggingCharacter] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  
  const GRID_COLOR = '#ddd';
  const HIGHLIGHT_COLOR = 'rgba(76, 175, 80, 0.3)';
  
  const getGridCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the scale factor between canvas logical size and displayed size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get position in canvas space (handle both mouse and touch events)
    const clientX = event.clientX || event.pageX;
    const clientY = event.clientY || event.pageY;
    
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    
    // Convert to grid coordinates
    return {
      x: Math.floor(canvasX / CELL_SIZE),
      y: Math.floor(canvasY / CELL_SIZE)
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size based on grid dimensions
    canvas.width = gridColumns * CELL_SIZE;
    canvas.height = gridRows * CELL_SIZE;
    
    // Calculate and set aspect ratio dynamically
    canvas.style.aspectRatio = `${gridColumns / gridRows}`;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
    
    // Draw characters
    characters.forEach(character => {
      const { x, y, characterId, name, race } = character;
      
      // Skip invalid positions
      if (x < 0 || y < 0 || x >= gridColumns || y >= gridRows) return;
      
      // Draw character token
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
      
      // Draw character initial
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        name.charAt(0),
        x * CELL_SIZE + CELL_SIZE / 2,
        y * CELL_SIZE + CELL_SIZE / 2
      );
    });
    
    // Highlight hovered cell
    if (hoveredCell) {
      const { x, y } = hoveredCell;
      ctx.fillStyle = HIGHLIGHT_COLOR;
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
    
  }, [gridRows, gridColumns, characters, gridElements, hoveredCell]);
  
  const handleCanvasMouseDown = (e) => {
    const { x, y } = getGridCoordinates(e);
    
    // Check if there's a character at this position
    const characterAtPosition = characters.find(
      char => char.x === x && char.y === y
    );
    
    if (characterAtPosition) {
      setDraggingCharacter(characterAtPosition);
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    const { x, y } = getGridCoordinates(e);
    
    if (x >= 0 && x < gridColumns && y >= 0 && y < gridRows) {
      setHoveredCell({ x, y });
    } else {
      setHoveredCell(null);
    }
  };
  
  const handleCanvasMouseUp = (e) => {
    if (draggingCharacter && hoveredCell) {
      const { characterId } = draggingCharacter;
      const { x, y } = hoveredCell;
      
      // Only move if destination is different from current position
      if (draggingCharacter.x !== x || draggingCharacter.y !== y) {
        onMoveCharacter(characterId, x, y);
      }
    }
    
    setDraggingCharacter(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add non-passive touch event listeners
    const touchStart = (e) => {
      const touch = e.touches[0];
      const { x, y } = getGridCoordinates(touch);
      
      // Check if we're touching a character
      const characterAtPosition = characters.find(
        char => char.x === x && char.y === y
      );
      
      if (characterAtPosition && e.touches.length === 1) {
        // Only prevent default if we're touching a character with one finger
        e.preventDefault();
        setDraggingCharacter(characterAtPosition);
      }
    };

    const touchMove = (e) => {
      if (draggingCharacter && e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        const { x, y } = getGridCoordinates(touch);
        
        if (x >= 0 && x < gridColumns && y >= 0 && y < gridRows) {
          setHoveredCell({ x, y });
        } else {
          setHoveredCell(null);
        }
      }
    };

    const touchEnd = (e) => {
      if (draggingCharacter) {
        e.preventDefault();
        if (hoveredCell) {
          const { characterId } = draggingCharacter;
          const { x, y } = hoveredCell;
          
          if (draggingCharacter.x !== x || draggingCharacter.y !== y) {
            onMoveCharacter(characterId, x, y);
          }
        }
        
        setDraggingCharacter(null);
        setHoveredCell(null);
      }
    };

    // Add event listeners with {passive: true} by default
    canvas.addEventListener('touchstart', touchStart);
    canvas.addEventListener('touchmove', touchMove);
    canvas.addEventListener('touchend', touchEnd);

    // Cleanup
    return () => {
      canvas.removeEventListener('touchstart', touchStart);
      canvas.removeEventListener('touchmove', touchMove);
      canvas.removeEventListener('touchend', touchEnd);
    };
  }, [characters, draggingCharacter, hoveredCell, onMoveCharacter]);

  return (
    <div className="virtual-tabletop">
      <div className="grid-controls">
        <div className="grid-size-control">
          <label>Rows:</label>
          <button onClick={() => onUpdateGridSize(gridRows - 1, gridColumns)} disabled={gridRows <= 10}>-</button>
          <span>{gridRows}</span>
          <button onClick={() => onUpdateGridSize(gridRows + 1, gridColumns)}>+</button>
        </div>
        <div className="grid-size-control">
          <label>Columns:</label>
          <button onClick={() => onUpdateGridSize(gridRows, gridColumns - 1)} disabled={gridColumns <= 10}>-</button>
          <span>{gridColumns}</span>
          <button onClick={() => onUpdateGridSize(gridRows, gridColumns + 1)}>+</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={() => setHoveredCell(null)}
      />
      <div className="vtt-legend">
        <div className="legend-item">
          <div className="legend-color human"></div>
          <span>Human</span>
        </div>
        <div className="legend-item">
          <div className="legend-color trepidite"></div>
          <span>Trepidite</span>
        </div>
        <div className="legend-item">
          <div className="legend-grid-cell"></div>
          <span>5x5 ft</span>
        </div>
      </div>
    </div>
  );
};

export default VirtualTableTop; 