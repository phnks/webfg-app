import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { 
  LIST_CHARACTERS_ENHANCED,
  DELETE_CHARACTER
} from "../../graphql/operations";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import ErrorPopup from "../common/ErrorPopup";
import "./CharacterList.css";

const CharacterList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [cursors, setCursors] = useState([null]); // Stack of cursors for navigation
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [mutationError, setMutationError] = useState(null);

  // Construct query variables
  const queryVariables = useMemo(() => ({
    filter: {
      ...filters,
      pagination: {
        limit: pageSize,
        cursor: cursors[currentPage]
      }
    }
  }), [filters, pageSize, cursors, currentPage]);

  const { data, loading, error, refetch } = useQuery(LIST_CHARACTERS_ENHANCED, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network'
  });

  const [deleteCharacter] = useMutation(DELETE_CHARACTER, {
    refetchQueries: [{ 
      query: LIST_CHARACTERS_ENHANCED, 
      variables: queryVariables 
    }]
  });

  const handleCharacterClick = (characterId) => {
    navigate(`/characters/${characterId}`);
  };

  const handleEdit = (e, characterId) => {
    e.stopPropagation();
    navigate(`/characters/${characterId}`);
  };

  const handleDelete = async (e, characterId, characterName) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${characterName}"?`)) {
      return;
    }

    try {
      await deleteCharacter({
        variables: { characterId }
      });
    } catch (err) {
      console.error("Error deleting character:", err);
      setMutationError({ 
        message: err.message || "Failed to delete character", 
        stack: err.stack || null 
      });
    }
  };

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCursors([null]); // Reset pagination when filters change
    setCurrentPage(0);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setCursors([null]);
    setCurrentPage(0);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCursors([null]); // Reset pagination when page size changes
    setCurrentPage(0);
  }, []);

  const handleNextPage = useCallback(() => {
    if (data?.listCharactersEnhanced?.hasNextPage && data?.listCharactersEnhanced?.nextCursor) {
      const newCursors = [...cursors];
      newCursors[currentPage + 1] = data.listCharactersEnhanced.nextCursor;
      setCursors(newCursors);
      setCurrentPage(currentPage + 1);
    }
  }, [data, cursors, currentPage]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  if (loading && currentPage === 0) return <div className="loading">Loading characters...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  const characters = data?.listCharactersEnhanced?.items || [];
  const hasNextPage = data?.listCharactersEnhanced?.hasNextPage || false;
  const hasPreviousPage = currentPage > 0;

  const renderTableView = () => (
    <div className="character-table-container">
      <table className="character-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Will</th>
            <th>Fatigue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {characters.map(character => (
            <tr key={character.characterId} onClick={() => handleCharacterClick(character.characterId)}>
              <td className="character-name">{character.name}</td>
              <td><span className="category-badge">{character.characterCategory}</span></td>
              <td>{character.will}</td>
              <td>{character.fatigue}</td>
              <td>
                <div className="action-buttons">
                  <button 
                    className="edit-button"
                    onClick={(e) => handleEdit(e, character.characterId)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={(e) => handleDelete(e, character.characterId, character.name)}
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
          onClick={() => navigate("/characters/new")}
          data-cy="create-character-button"
        >
          Create New Character
        </button>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="character-grid">
      {characters.map(character => (
        <div
          key={character.characterId}
          className="character-card"
          onClick={() => handleCharacterClick(character.characterId)}
        >
          <h3>{character.name}</h3>
          <div className="character-meta">
            <span className="category">{character.characterCategory}</span>
            <span className="stats">Will: {character.will} | Fatigue: {character.fatigue}</span>
          </div>
        </div>
      ))}

      <div
        className="character-card add-card"
        onClick={() => navigate("/characters/new")}
        data-cy="create-character-button"
      >
        <div className="add-icon">+</div>
        <h3>Create New Character</h3>
      </div>
    </div>
  );

  return (
    <div className="character-page">
      <div className="page-content">
        <h1>Characters</h1>

        <SearchFilterSort
          entityType="characters"
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

        {characters.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No characters found.</p>
            <button
              className="create-button"
              onClick={() => navigate("/characters/new")}
              data-cy="create-character-button"
            >
              Create New Character
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
              currentItemCount={characters.length}
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

export default CharacterList;
