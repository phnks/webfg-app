import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { 
  LIST_CONDITIONS_ENHANCED,
  ADD_CONDITION_TO_CHARACTER,
  DELETE_CONDITION
} from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import ErrorPopup from "../common/ErrorPopup";
import "./ConditionsList.css";

const ConditionsList = () => {
  const navigate = useNavigate();
  const { selectedCharacter } = useSelectedCharacter();
  const [filters, setFilters] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [cursors, setCursors] = useState([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState(() => {
    // Default to grid view on mobile devices
    return window.innerWidth <= 768 ? 'grid' : 'table';
  });
  const [mutationError, setMutationError] = useState(null);
  const [addingConditionId, setAddingConditionId] = useState(null);

  // Handle window resize to switch view modes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && viewMode === 'table') {
        setViewMode('grid');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const queryVariables = useMemo(() => ({
    filter: {
      ...filters,
      pagination: {
        limit: pageSize,
        cursor: cursors[currentPage]
      }
    }
  }), [filters, pageSize, cursors, currentPage]);

  const { data, loading, error } = useQuery(LIST_CONDITIONS_ENHANCED, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network'
  });

  const [addConditionToCharacter] = useMutation(ADD_CONDITION_TO_CHARACTER);
  const [deleteCondition] = useMutation(DELETE_CONDITION, {
    refetchQueries: [{ 
      query: LIST_CONDITIONS_ENHANCED, 
      variables: queryVariables 
    }]
  });
  
  const handleConditionClick = (conditionId) => {
    navigate(`/conditions/${conditionId}`);
  };

  const handleAddToCharacter = async (e, conditionId) => {
    e.stopPropagation();
    
    if (!selectedCharacter) {
      setMutationError({ message: "Please select a character first.", stack: null });
      return;
    }

    setAddingConditionId(conditionId);
    try {
      await addConditionToCharacter({
        variables: {
          characterId: selectedCharacter.characterId,
          conditionId,
          amount: 1 // Default amount is 1
        }
      });
      
      // Show success for 3 seconds
      setTimeout(() => setAddingConditionId(null), 3000);
    } catch (err) {
      console.error("Error adding condition to character:", err);
      setAddingConditionId(null);
      setMutationError({ 
        message: err.message || "Failed to add condition to character", 
        stack: err.stack || null 
      });
    }
  };

  const handleEdit = (e, conditionId) => {
    e.stopPropagation();
    navigate(`/conditions/${conditionId}/edit`);
  };

  const handleDelete = async (e, conditionId, conditionName) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${conditionName}"?`)) {
      return;
    }

    try {
      await deleteCondition({
        variables: { conditionId }
      });
    } catch (err) {
      console.error("Error deleting condition:", err);
      setMutationError({ 
        message: err.message || "Failed to delete condition", 
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
    if (data?.listConditionsEnhanced?.hasNextPage && data?.listConditionsEnhanced?.nextCursor) {
      const newCursors = [...cursors];
      newCursors[currentPage + 1] = data.listConditionsEnhanced.nextCursor;
      setCursors(newCursors);
      setCurrentPage(currentPage + 1);
    }
  }, [data, cursors, currentPage]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);
  
  if (loading && currentPage === 0) return <div className="loading">Loading conditions...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  
  const conditions = data?.listConditionsEnhanced?.items || [];
  const hasNextPage = data?.listConditionsEnhanced?.hasNextPage || false;
  const hasPreviousPage = currentPage > 0;

  const renderTableView = () => (
    <>
      <table className="condition-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Type</th>
            <th>Target Attribute</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {conditions.map(condition => (
            <tr key={condition.conditionId} onClick={() => handleConditionClick(condition.conditionId)}>
              <td className="condition-name">{condition.name}</td>
              <td><span className="category-badge">{condition.conditionCategory}</span></td>
              <td>
                <span className={`condition-type ${condition.conditionType.toLowerCase()}`}>
                  {condition.conditionType}
                </span>
              </td>
              <td>{condition.conditionTarget}</td>
              <td>
                <div className="action-buttons">
                  {selectedCharacter && (
                    <button 
                      className={`add-button ${addingConditionId === condition.conditionId ? 'success' : ''}`}
                      onClick={(e) => handleAddToCharacter(e, condition.conditionId)}
                      disabled={addingConditionId === condition.conditionId}
                    >
                      {addingConditionId === condition.conditionId ? 'Added!' : 'Add'}
                    </button>
                  )}
                  <button 
                    className="edit-button"
                    onClick={(e) => handleEdit(e, condition.conditionId)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={(e) => handleDelete(e, condition.conditionId, condition.name)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button 
        className="create-button floating-create"
        onClick={() => navigate("/conditions/new")}
      >
        + Create New Condition
      </button>
    </>
  );

  const renderGridView = () => (
    <>
      <div className="condition-grid">
        {conditions.map(condition => (
          <div 
            key={condition.conditionId} 
            className={`condition-card ${condition.conditionType.toLowerCase()}`}
            onClick={() => handleConditionClick(condition.conditionId)}
          >
            <h3>{condition.name}</h3>
            <div className="condition-meta">
              <span className={`condition-type ${condition.conditionType.toLowerCase()}`}>
                {condition.conditionType}
              </span>
              <span className="condition-target">{condition.conditionTarget}</span>
            </div>
            <p className="condition-description">{condition.description}</p>
            <div className="condition-category">
              {condition.conditionCategory}
            </div>
          </div>
        ))}
        
        <div 
          className="condition-card add-card"
          onClick={() => navigate("/conditions/new")}
        >
          <div className="add-icon">+</div>
          <h3>Create New Condition</h3>
        </div>
      </div>
    </>
  );

  return (
    <div className="condition-page">
      <div className="page-content">
        <h1>Conditions</h1>
        
        <SearchFilterSort
          entityType="conditions"
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
                
        {conditions.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No conditions found.</p>
            <button 
              className="create-button"
              onClick={() => navigate("/conditions/new")}
            >
              Create New Condition
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
              currentItemCount={conditions.length}
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

export default ConditionsList;