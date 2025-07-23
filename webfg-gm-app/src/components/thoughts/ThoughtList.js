import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { 
  LIST_THOUGHTS_ENHANCED,
  DELETE_THOUGHT
} from "../../graphql/operations";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import ErrorPopup from "../common/ErrorPopup";
import "./ThoughtList.css";

const ThoughtList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [cursors, setCursors] = useState([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState('table');
  const [mutationError, setMutationError] = useState(null);

  const queryVariables = useMemo(() => ({
    filter: {
      ...filters,
      pagination: {
        limit: pageSize,
        cursor: cursors[currentPage]
      }
    }
  }), [filters, pageSize, cursors, currentPage]);

  const { data, loading, error } = useQuery(LIST_THOUGHTS_ENHANCED, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network'
  });

  const [deleteThought] = useMutation(DELETE_THOUGHT, {
    refetchQueries: [{ 
      query: LIST_THOUGHTS_ENHANCED, 
      variables: queryVariables 
    }]
  });

  const handleThoughtClick = (thoughtId) => {
    navigate(`/thoughts/${thoughtId}`);
  };

  const handleEdit = (e, thoughtId) => {
    e.stopPropagation();
    navigate(`/thoughts/${thoughtId}/edit`);
  };

  const handleDelete = async (e, thoughtId, thoughtName) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${thoughtName}"?`)) {
      return;
    }

    try {
      await deleteThought({
        variables: { thoughtId }
      });
    } catch (err) {
      console.error("Error deleting thought:", err);
      setMutationError({ 
        message: err.message || "Failed to delete thought", 
        stack: err.stack || null 
      });
    }
  };

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCursors([null]);
    setCurrentPage(0);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCursors([null]);
    setCurrentPage(0);
  }, []);

  const handleNextPage = useCallback(() => {
    if (data?.listThoughtsEnhanced?.hasNextPage && data.listThoughtsEnhanced.nextCursor) {
      const newCursors = [...cursors];
      if (newCursors.length <= currentPage + 1) {
        newCursors.push(data.listThoughtsEnhanced.nextCursor);
        setCursors(newCursors);
      }
      setCurrentPage(currentPage + 1);
    }
  }, [data, cursors, currentPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const thoughts = data?.listThoughtsEnhanced?.items || [];
  const hasNextPage = data?.listThoughtsEnhanced?.hasNextPage || false;
  const totalCount = data?.listThoughtsEnhanced?.totalCount;

  if (loading && !data) return <div className="loading">Loading thoughts...</div>;
  if (error && !data) return <div className="error">Error loading thoughts: {error.message}</div>;

  const renderThoughts = () => {
    if (thoughts.length === 0) {
      return <div className="no-results">No thoughts found.</div>;
    }

    if (viewMode === 'table') {
      return (
        <div className="table-container">
          <table className="thoughts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {thoughts.map((thought) => (
                <tr 
                  key={thought.thoughtId} 
                  onClick={() => handleThoughtClick(thought.thoughtId)}
                  className="thought-row"
                >
                  <td className="thought-name">{thought.name}</td>
                  <td className="thought-description">
                    {thought.description ? (
                      thought.description.length > 100 
                        ? `${thought.description.substring(0, 100)}...`
                        : thought.description
                    ) : '-'}
                  </td>
                  <td className="actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="edit-btn"
                      onClick={(e) => handleEdit(e, thought.thoughtId)}
                      title="Edit thought"
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={(e) => handleDelete(e, thought.thoughtId, thought.name)}
                      title="Delete thought"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Grid view
    return (
      <div className="thoughts-grid">
        {thoughts.map((thought) => (
          <div 
            key={thought.thoughtId} 
            className="thought-card"
            onClick={() => handleThoughtClick(thought.thoughtId)}
          >
            <div className="thought-card-header">
              <h3 className="thought-card-name">{thought.name}</h3>
              <div className="thought-card-actions" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="edit-btn"
                  onClick={(e) => handleEdit(e, thought.thoughtId)}
                  title="Edit thought"
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={(e) => handleDelete(e, thought.thoughtId, thought.name)}
                  title="Delete thought"
                >
                  Delete
                </button>
              </div>
            </div>
            {thought.description && (
              <div className="thought-card-description">
                {thought.description.length > 150 
                  ? `${thought.description.substring(0, 150)}...`
                  : thought.description}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const searchFields = [
    { 
      key: 'search', 
      label: 'Search', 
      type: 'text',
      placeholder: 'Search thoughts by name or description...'
    }
  ];

  return (
    <div className="thought-list">
      <div className="list-header">
        <h1>Thoughts</h1>
        <button 
          className="create-btn"
          onClick={() => navigate('/thoughts/new')}
        >
          Create New Thought
        </button>
      </div>

      <SearchFilterSort
        onFiltersChange={handleFiltersChange}
        searchFields={searchFields}
        onViewModeChange={setViewMode}
        viewMode={viewMode}
        showViewModeToggle={true}
      />

      {renderThoughts()}

      <PaginationControls
        currentPage={currentPage}
        hasNextPage={hasNextPage}
        hasPrevPage={currentPage > 0}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        totalCount={totalCount}
        itemCount={thoughts.length}
        loading={loading}
      />
      
      {mutationError && (
        <ErrorPopup 
          error={mutationError}
          onClose={() => setMutationError(null)} 
        />
      )}
    </div>
  );
};

export default ThoughtList;