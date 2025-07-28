import React, { useState } from 'react';
import './InventoryQuantityModal.css'; // Reuse the same styles

const InventoryMoveModal = ({ item, action, maxQuantity, onConfirm, onCancel }) => {
  const [quantity, setQuantity] = useState(maxQuantity);

  const handleConfirm = () => {
    onConfirm(parseInt(quantity));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{action} Item</h3>
        <div className="item-info">
          <strong>{item.name}</strong>
          {item.objectCategory && <span className="item-category"> ({item.objectCategory})</span>}
        </div>
        <div className="form-group">
          <label htmlFor="quantity">How many to {action.toLowerCase()}?</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="quantity-input"
            min="1"
            max={maxQuantity}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            Available: {maxQuantity}
          </small>
        </div>
        <div className="modal-actions">
          <button onClick={handleConfirm} className="save-btn">
            {action}
          </button>
          <button onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryMoveModal;