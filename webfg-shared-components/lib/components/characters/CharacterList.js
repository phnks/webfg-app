import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { LIST_CHARACTERS_ENHANCED, DELETE_CHARACTER } from "../../graphql/operations";
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
  const {
    data,
    loading,
    error
  } = useQuery(LIST_CHARACTERS_ENHANCED, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network'
  });
  const [deleteCharacter] = useMutation(DELETE_CHARACTER, {
    refetchQueries: [{
      query: LIST_CHARACTERS_ENHANCED,
      variables: queryVariables
    }]
  });
  const handleCharacterClick = characterId => {
    navigate(`/characters/${characterId}`);
  };
  const handleEdit = (e, characterId) => {
    e.stopPropagation();
    navigate(`/characters/${characterId}/edit`);
  };
  const handleDelete = async (e, characterId, characterName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${characterName}"?`)) {
      return;
    }
    try {
      await deleteCharacter({
        variables: {
          characterId
        }
      });
    } catch (err) {
      console.error("Error deleting character:", err);
      setMutationError({
        message: err.message || "Failed to delete character",
        stack: err.stack || null
      });
    }
  };
  const handleFilterChange = useCallback(newFilters => {
    setFilters(newFilters);
    setCursors([null]); // Reset pagination when filters change
    setCurrentPage(0);
  }, []);
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setCursors([null]);
    setCurrentPage(0);
  }, []);
  const handlePageSizeChange = useCallback(newPageSize => {
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
  if (loading && currentPage === 0) return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading characters...");
  if (error) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Error: ", error.message);
  const characters = data?.listCharactersEnhanced?.items || [];
  const hasNextPage = data?.listCharactersEnhanced?.hasNextPage || false;
  const hasPreviousPage = currentPage > 0;
  const renderTableView = () => /*#__PURE__*/React.createElement("div", {
    className: "character-table-container"
  }, /*#__PURE__*/React.createElement("table", {
    className: "character-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Category"), /*#__PURE__*/React.createElement("th", null, "Will"), /*#__PURE__*/React.createElement("th", null, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, characters.map(character => /*#__PURE__*/React.createElement("tr", {
    key: character.characterId,
    onClick: () => handleCharacterClick(character.characterId)
  }, /*#__PURE__*/React.createElement("td", {
    className: "character-name"
  }, character.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "category-badge"
  }, character.characterCategory)), /*#__PURE__*/React.createElement("td", null, character.will), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "action-buttons"
  }, /*#__PURE__*/React.createElement("button", {
    className: "edit-button",
    onClick: e => handleEdit(e, character.characterId)
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "delete-button",
    onClick: e => handleDelete(e, character.characterId, character.name)
  }, "Delete"))))))), /*#__PURE__*/React.createElement("div", {
    className: "table-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "create-button",
    onClick: () => navigate("/characters/new"),
    "data-cy": "create-character-button"
  }, "Create New Character")));
  const renderGridView = () => /*#__PURE__*/React.createElement("div", {
    className: "character-grid"
  }, characters.map(character => /*#__PURE__*/React.createElement("div", {
    key: character.characterId,
    className: "character-card",
    onClick: () => handleCharacterClick(character.characterId)
  }, /*#__PURE__*/React.createElement("h3", null, character.name), /*#__PURE__*/React.createElement("div", {
    className: "character-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "category"
  }, character.characterCategory), /*#__PURE__*/React.createElement("span", {
    className: "stats"
  }, "Will: ", character.will)))), /*#__PURE__*/React.createElement("div", {
    className: "character-card add-card",
    onClick: () => navigate("/characters/new"),
    "data-cy": "create-character-button"
  }, /*#__PURE__*/React.createElement("div", {
    className: "add-icon"
  }, "+"), /*#__PURE__*/React.createElement("h3", null, "Create New Character")));
  const renderMobileListView = () => /*#__PURE__*/React.createElement("div", {
    className: "character-mobile-list"
  }, characters.map(character => /*#__PURE__*/React.createElement("div", {
    key: character.characterId,
    className: "character-mobile-item",
    onClick: () => handleCharacterClick(character.characterId)
  }, /*#__PURE__*/React.createElement("div", {
    className: "character-mobile-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "character-mobile-name"
  }, character.name), /*#__PURE__*/React.createElement("div", {
    className: "character-mobile-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "category-badge"
  }, character.characterCategory), /*#__PURE__*/React.createElement("span", {
    className: "character-stats"
  }, "Will: ", character.will))), /*#__PURE__*/React.createElement("div", {
    className: "character-mobile-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "edit-button",
    onClick: e => handleEdit(e, character.characterId)
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "delete-button",
    onClick: e => handleDelete(e, character.characterId, character.name)
  }, "Delete")))), /*#__PURE__*/React.createElement("button", {
    className: "create-button floating-create",
    onClick: () => navigate("/characters/new"),
    "data-cy": "create-character-button"
  }, "+ Create New Character"));
  return /*#__PURE__*/React.createElement("div", {
    className: "character-page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-content"
  }, /*#__PURE__*/React.createElement("h1", null, "Characters"), /*#__PURE__*/React.createElement(SearchFilterSort, {
    entityType: "characters",
    onFilterChange: handleFilterChange,
    initialFilters: filters,
    onClearFilters: handleClearFilters
  }), /*#__PURE__*/React.createElement("div", {
    className: "view-controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: `view-toggle ${viewMode === 'table' ? 'active' : ''}`,
    onClick: () => setViewMode('table')
  }, "Table View"), /*#__PURE__*/React.createElement("button", {
    className: `view-toggle ${viewMode === 'grid' ? 'active' : ''}`,
    onClick: () => setViewMode('grid')
  }, "Grid View")), loading && /*#__PURE__*/React.createElement("div", {
    className: "loading-overlay"
  }, "Loading..."), characters.length === 0 && !loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No characters found."), /*#__PURE__*/React.createElement("button", {
    className: "create-button",
    onClick: () => navigate("/characters/new"),
    "data-cy": "create-character-button"
  }, "Create New Character")) : /*#__PURE__*/React.createElement(React.Fragment, null, window.innerWidth <= 768 ? renderMobileListView() : viewMode === 'table' ? renderTableView() : renderGridView(), /*#__PURE__*/React.createElement(PaginationControls, {
    hasNextPage: hasNextPage,
    onNext: handleNextPage,
    onPrevious: handlePreviousPage,
    onPageSizeChange: handlePageSizeChange,
    pageSize: pageSize,
    currentItemCount: characters.length,
    isLoading: loading,
    hasPreviousPage: hasPreviousPage
  }))), mutationError && /*#__PURE__*/React.createElement(ErrorPopup, {
    error: mutationError,
    onClose: () => setMutationError(null)
  }));
};
export default CharacterList;