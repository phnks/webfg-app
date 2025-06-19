import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { 
  LIST_ACTIONS_ENHANCED,
  ADD_ACTION_TO_CHARACTER,
  DELETE_ACTION
} from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import ErrorPopup from "../common/ErrorPopup";
import "./ActionList.css";

const ActionList = () => {
  const navigate = useNavigate();
  const { selectedCharacter } = useSelectedCharacter();
  const [filters, setFilters] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [cursors, setCursors] = useState([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [mutationError, setMutationError] = useState(null);
  const [addingActionId, setAddingActionId] = useState(null);

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

  const [addActionToCharacter] = useMutation(ADD_ACTION_TO_CHARACTER);
  const [deleteAction] = useMutation(DELETE_ACTION, {
    refetchQueries: [{ 
      query: LIST_ACTIONS_ENHANCED, 
      variables: queryVariables 
    }]
  });
  
  const handleActionClick = (actionId) => {
    navigate(`/actions/${actionId}`);
  };

  const handleAddToCharacter = async (e, actionId) => {
    e.stopPropagation();
    
    if (!selectedCharacter) {
      setMutationError({ message: "Please select a character first.", stack: null });
      return;
    }

    setAddingActionId(actionId);
    try {
      await addActionToCharacter({
        variables: {
          characterId: selectedCharacter.characterId,
          actionId
        }
      });
      
      // Show success for 3 seconds
      setTimeout(() => setAddingActionId(null), 3000);
    } catch (err) {
      console.error("Error adding action to character:", err);
      setAddingActionId(null);
      setMutationError({ 
        message: err.message || "Failed to add action to character", 
        stack: err.stack || null 
      });
    }
  };

  const handleEdit = (e, actionId) => {
    e.stopPropagation();
    navigate(`/actions/${actionId}`);
  };

  const handleDelete = async (e, actionId, actionName) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${actionName}"?`)) {
      return;
    }

    try {
      await deleteAction({
        variables: { actionId }
      });
    } catch (err) {
      console.error("Error deleting action:", err);
      setMutationError({ 
        message: err.message || "Failed to delete action", 
        stack: err.stack || null 
      });
    }
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
                <div className="action-buttons">
                  {selectedCharacter && (
                    <button 
                      className={`add-button ${addingActionId === action.actionId ? 'success' : ''}`}
                      onClick={(e) => handleAddToCharacter(e, action.actionId)}
                      disabled={addingActionId === action.actionId}
                    >
                      {addingActionId === action.actionId ? 'Added!' : 'Add'}
                    </button>
                  )}
                  <button 
                    className="edit-button"
                    onClick={(e) => handleEdit(e, action.actionId)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={(e) => handleDelete(e, action.actionId, action.name)}
                  >
                    Delete
                  </button>
                </div>
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
      
      {mutationError && (
        <ErrorPopup
          error={mutationError}
          onClose={() => setMutationError(null)}
        />
      )}
    </div>
  );
};

export default ActionList;