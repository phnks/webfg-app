import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { LIST_CHARACTERS_ENHANCED } from "../../graphql/operations";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import "./CharacterList.css";

const CharacterList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [cursors, setCursors] = useState([null]); // Stack of cursors for navigation
  const [currentPage, setCurrentPage] = useState(0);

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

  const handleCharacterClick = (characterId) => {
    navigate(`/characters/${characterId}`);
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
    </div>
  );
};

export default CharacterList;
