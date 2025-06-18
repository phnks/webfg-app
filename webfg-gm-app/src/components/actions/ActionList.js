import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { LIST_ACTIONS_ENHANCED } from "../../graphql/operations";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import "./ActionList.css";

const ActionList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [cursors, setCursors] = useState([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const queryVariables = useMemo(() => ({
    filter: {
      ...filters,
      pagination: {
        limit: pageSize,
        cursor: cursors[currentPage]
      }
    }
  }), [filters, pageSize, cursors, currentPage]);

  const { data, loading, error } = useQuery(LIST_ACTIONS_ENHANCED, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network'
  });
  
  const handleActionClick = (actionId) => {
    navigate(`/actions/${actionId}`);
  };

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCursors([null]);
    setCurrentPage(0);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setCursors([null]);
    setCurrentPage(0);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCursors([null]);
    setCurrentPage(0);
  }, []);

  const handleNextPage = useCallback(() => {
    if (data?.listActionsEnhanced?.hasNextPage && data?.listActionsEnhanced?.nextCursor) {
      const newCursors = [...cursors];
      newCursors[currentPage + 1] = data.listActionsEnhanced.nextCursor;
      setCursors(newCursors);
      setCurrentPage(currentPage + 1);
    }
  }, [data, cursors, currentPage]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);
  
  if (loading && currentPage === 0) return <div className="loading">Loading actions...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  
  const actions = data?.listActionsEnhanced?.items || [];
  const hasNextPage = data?.listActionsEnhanced?.hasNextPage || false;
  const hasPreviousPage = currentPage > 0;

  const renderTableView = () => (
    <div className="action-table-container">
      <table className="action-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Source Attribute</th>
            <th>Target Attribute</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {actions.map(action => (
            <tr key={action.actionId} onClick={() => handleActionClick(action.actionId)}>
              <td className="action-name">{action.name}</td>
              <td><span className="category-badge">{action.actionCategory}</span></td>
              <td>{action.sourceAttribute}</td>
              <td>{action.targetAttribute}</td>
              <td>
                <button 
                  className="view-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(action.actionId);
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-actions">
        <button
          className="create-button"
          onClick={() => navigate("/actions/new")}
        >
          Create New Action
        </button>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="action-grid">
      {actions.map(action => (
        <div 
          key={action.actionId} 
          className="action-card"
          onClick={() => handleActionClick(action.actionId)}
        >
          <h3>{action.name}</h3>
          <div className="action-meta">
            <span className="action-category">{action.actionCategory}</span>
            <span className="action-attributes">{action.sourceAttribute} → {action.targetAttribute}</span>
            <div className="action-details-meta">
              <span className="action-target-type">{action.targetType}</span>
              <span className="action-effect-type">{action.effectType}</span>
            </div>
          </div>
          {action.description && (
            <p className="action-description">
              {action.description.length > 100
                ? `${action.description.substring(0, 100)}...`
                : action.description}
            </p>
          )}
        </div>
      ))}
      
      <div 
        className="action-card add-card"
        onClick={() => navigate("/actions/new")}
      >
        <div className="add-icon">+</div>
        <h3>Create New Action</h3>
      </div>
    </div>
  );

  return (
    <div className="action-page">
      <div className="page-content">
        <h1>Actions</h1>
        
        <SearchFilterSort
          entityType="actions"
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          onClearFilters={handleClearFilters}
        />

        <div className="view-controls">
          <button 
            className={`view-toggle ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            Table View
          </button>
          <button 
            className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid View
          </button>
        </div>

        {loading && (
          <div className="loading-overlay">Loading...</div>
        )}
        
        {actions.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No actions found.</p>
            <button 
              className="create-button"
              onClick={() => navigate("/actions/new")}
            >
              Create New Action
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'table' ? renderTableView() : renderGridView()}

            <PaginationControls
              hasNextPage={hasNextPage}
              onNext={handleNextPage}
              onPrevious={handlePreviousPage}
              onPageSizeChange={handlePageSizeChange}
              pageSize={pageSize}
              currentItemCount={actions.length}
              isLoading={loading}
              hasPreviousPage={hasPreviousPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ActionList;