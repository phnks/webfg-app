import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { 
  LIST_OBJECTS_ENHANCED,
  ADD_OBJECT_TO_STASH,
  DELETE_OBJECT
} from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import ErrorPopup from "../common/ErrorPopup";
import "./ObjectList.css";

const ObjectList = () => {
  const navigate = useNavigate();
  const { selectedCharacter } = useSelectedCharacter();
  const [filters, setFilters] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [cursors, setCursors] = useState([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState('table');
  const [mutationError, setMutationError] = useState(null);
  const [addingObjectId, setAddingObjectId] = useState(null);

  const queryVariables = useMemo(() => ({
    filter: {
      ...filters,
      pagination: {
        limit: pageSize,
        cursor: cursors[currentPage]
      }
    }
  }), [filters, pageSize, cursors, currentPage]);

  const { data, loading, error } = useQuery(LIST_OBJECTS_ENHANCED, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network'
  });

  const [addObjectToStash] = useMutation(ADD_OBJECT_TO_STASH);
  const [deleteObject] = useMutation(DELETE_OBJECT, {
    refetchQueries: [{ 
      query: LIST_OBJECTS_ENHANCED, 
      variables: queryVariables 
    }]
  });

  const handleObjectClick = (objectId) => {
    navigate(`/objects/${objectId}`);
  };

  const handleAddToStash = async (e, objectId) => {
    e.stopPropagation();
    
    if (!selectedCharacter) {
      setMutationError({ message: "Please select a character first.", stack: null });
      return;
    }

    setAddingObjectId(objectId);
    try {
      await addObjectToStash({
        variables: {
          characterId: selectedCharacter.characterId,
          objectId
        }
      });
      
      // Show success for 3 seconds
      setTimeout(() => setAddingObjectId(null), 3000);
    } catch (err) {
      console.error("Error adding object to stash:", err);
      setAddingObjectId(null);
      setMutationError({ 
        message: err.message || "Failed to add object to stash", 
        stack: err.stack || null 
      });
    }
  };

  const handleEdit = (e, objectId) => {
    e.stopPropagation();
    navigate(`/objects/${objectId}`);
  };

  const handleDelete = async (e, objectId, objectName) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${objectName}"?`)) {
      return;
    }

    try {
      await deleteObject({
        variables: { objectId }
      });
    } catch (err) {
      console.error("Error deleting object:", err);
      setMutationError({ 
        message: err.message || "Failed to delete object", 
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
    if (data?.listObjectsEnhanced?.hasNextPage && data?.listObjectsEnhanced?.nextCursor) {
      const newCursors = [...cursors];
      newCursors[currentPage + 1] = data.listObjectsEnhanced.nextCursor;
      setCursors(newCursors);
      setCurrentPage(currentPage + 1);
    }
  }, [data, cursors, currentPage]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  if (loading && currentPage === 0) return <div className="loading">Loading objects...</div>;
  if (error) {
    console.error("Error loading objects:", error);
    return <div className="error">Error loading objects: {error.message}</div>; 
  }

  const objects = data?.listObjectsEnhanced?.items || [];
  const hasNextPage = data?.listObjectsEnhanced?.hasNextPage || false;
  const hasPreviousPage = currentPage > 0;

  const renderTableView = () => (
    <div className="object-table-container">
      <table className="object-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {objects.map(object => (
            <tr key={object.objectId} onClick={() => handleObjectClick(object.objectId)}>
              <td className="object-name">{object.name}</td>
              <td><span className="category-badge">{object.objectCategory}</span></td>
              <td>
                <div className="action-buttons">
                  {selectedCharacter && (
                    <button 
                      className={`add-button ${addingObjectId === object.objectId ? 'success' : ''}`}
                      onClick={(e) => handleAddToStash(e, object.objectId)}
                      disabled={addingObjectId === object.objectId}
                    >
                      {addingObjectId === object.objectId ? 'Added!' : 'Add'}
                    </button>
                  )}
                  <button 
                    className="edit-button"
                    onClick={(e) => handleEdit(e, object.objectId)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={(e) => handleDelete(e, object.objectId, object.name)}
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
          onClick={() => navigate("/objects/new")}
        >
          Create New Object
        </button>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="object-grid">
      {objects.map(object => (
        <div
          key={object.objectId}
          className="object-card"
          onClick={() => handleObjectClick(object.objectId)}
        >
          <h3>{object.name}</h3>
          <div className="object-meta">
            <span className="category">{object.objectCategory}</span>
          </div>
        </div>
      ))}

      <div
        className="object-card add-card"
        onClick={() => navigate("/objects/new")}
      >
        <div className="add-icon">+</div>
        <h3>Create New Object</h3>
      </div>
    </div>
  );

  return (
    <div className="object-page">
      <div className="page-content">
        <h1>Objects</h1>

        <SearchFilterSort
          entityType="objects"
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

        {objects.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No objects found.</p>
            <button
              className="create-button"
              onClick={() => navigate("/objects/new")}
            >
              Create New Object
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
              currentItemCount={objects.length}
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

export default ObjectList;
