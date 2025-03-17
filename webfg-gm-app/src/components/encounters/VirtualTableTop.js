import React, { useState, useRef, useEffect } from 'react';
import './VirtualTableTop.css';

const GRID_SIZE = 20; // 20x20 grid
const CELL_SIZE = 30; // 30px per cell

const VirtualTableTop = ({ characters = [], gridElements = [], onMoveCharacter }) => {
  const canvasRef = useRef(null);
  const [draggingCharacter, setDraggingCharacter] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = GRID_SIZE * CELL_SIZE;
    canvas.height = GRID_SIZE * CELL_SIZE;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
      
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
      if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return;
      
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
      ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
    
  }, [characters, gridElements, hoveredCell]);
  
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const cellX = Math.floor(mouseX / CELL_SIZE);
    const cellY = Math.floor(mouseY / CELL_SIZE);
    
    // Check if there's a character at this position
    const characterAtPosition = characters.find(
      char => char.x === cellX && char.y === cellY
    );
    
    if (characterAtPosition) {
      setDraggingCharacter(characterAtPosition);
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const cellX = Math.floor(mouseX / CELL_SIZE);
    const cellY = Math.floor(mouseY / CELL_SIZE);
    
    // Update hovered cell
    if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
      setHoveredCell({ x: cellX, y: cellY });
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
  
  return (
    <div className="virtual-tabletop">
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