import React, { useState } from 'react';
import './InventoryQuantityModal.css';

const InventoryQuantityModal = ({ item, onSave, onCancel, title = "Edit Quantity" }) => {
  const [quantity, setQuantity] = useState(item.quantity || 1);

  const handleSave = () => {
    onSave(item.objectId, parseInt(quantity));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <div className="item-info">
          <strong>{item.name}</strong>
          {item.objectCategory && <span className="item-category"> ({item.objectCategory})</span>}
        </div>
        <div className="form-group">
          <label htmlFor="quantity">Quantity:</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="quantity-input"
            min="1"
          />
        </div>
        <div className="modal-actions">
          <button onClick={handleSave} className="save-btn">
            Save
          </button>
          <button onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryQuantityModal;