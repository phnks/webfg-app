import React from 'react';
import './PaginationControls.css';

const PaginationControls = ({
  hasNextPage,
  onNext,
  onPrevious,
  onPageSizeChange,
  pageSize = 10,
  currentItemCount = 0,
  isLoading = false,
  hasPreviousPage = false
}) => {
  const pageSizeOptions = [10, 25, 50, 100];

  return (
    <div className="pagination-controls">
      <div className="pagination-info">
        <span className="item-count">
          {currentItemCount} items
        </span>
        <div className="page-size-selector">
          <label htmlFor="page-size">Items per page:</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            disabled={isLoading}
            className="page-size-select"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="pagination-buttons">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPreviousPage || isLoading}
          className="pagination-btn previous"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNextPage || isLoading}
          className="pagination-btn next"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;