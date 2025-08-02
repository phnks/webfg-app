import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { LIST_CONDITIONS_ENHANCED, ADD_CONDITION_TO_CHARACTER, DELETE_CONDITION } from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import ErrorPopup from "../common/ErrorPopup";
import "./ConditionsList.css";
const ConditionsList = () => {
  const navigate = useNavigate();
  const {
    selectedCharacter
  } = useSelectedCharacter();
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
  const {
    data,
    loading,
    error
  } = useQuery(LIST_CONDITIONS_ENHANCED, {
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
  const handleConditionClick = conditionId => {
    navigate(`/conditions/${conditionId}`);
  };
  const handleAddToCharacter = async (e, conditionId) => {
    e.stopPropagation();
    if (!selectedCharacter) {
      setMutationError({
        message: "Please select a character first.",
        stack: null
      });
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
        variables: {
          conditionId
        }
      });
    } catch (err) {
      console.error("Error deleting condition:", err);
      setMutationError({
        message: err.message || "Failed to delete condition",
        stack: err.stack || null
      });
    }
  };
  const handleFilterChange = useCallback(newFilters => {
    setFilters(newFilters);
    setCursors([null]);
    setCurrentPage(0);
  }, []);
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setCursors([null]);
    setCurrentPage(0);
  }, []);
  const handlePageSizeChange = useCallback(newPageSize => {
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
  if (loading && currentPage === 0) return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading conditions...");
  if (error) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Error: ", error.message);
  const conditions = data?.listConditionsEnhanced?.items || [];
  const hasNextPage = data?.listConditionsEnhanced?.hasNextPage || false;
  const hasPreviousPage = currentPage > 0;
  const renderTableView = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "condition-table-container"
  }, /*#__PURE__*/React.createElement("table", {
    className: "condition-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Category"), /*#__PURE__*/React.createElement("th", null, "Type"), /*#__PURE__*/React.createElement("th", null, "Target Attribute"), /*#__PURE__*/React.createElement("th", null, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, conditions.map(condition => /*#__PURE__*/React.createElement("tr", {
    key: condition.conditionId,
    onClick: () => handleConditionClick(condition.conditionId)
  }, /*#__PURE__*/React.createElement("td", {
    className: "condition-name"
  }, condition.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "category-badge"
  }, condition.conditionCategory)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `condition-type ${condition.conditionType.toLowerCase()}`
  }, condition.conditionType)), /*#__PURE__*/React.createElement("td", null, condition.conditionTarget), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "action-buttons"
  }, selectedCharacter && /*#__PURE__*/React.createElement("button", {
    className: `add-button ${addingConditionId === condition.conditionId ? 'success' : ''}`,
    onClick: e => handleAddToCharacter(e, condition.conditionId),
    disabled: addingConditionId === condition.conditionId
  }, addingConditionId === condition.conditionId ? 'Added!' : 'Add'), /*#__PURE__*/React.createElement("button", {
    className: "edit-button",
    onClick: e => handleEdit(e, condition.conditionId)
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "delete-button",
    onClick: e => handleDelete(e, condition.conditionId, condition.name)
  }, "Delete")))))))), /*#__PURE__*/React.createElement("button", {
    className: "create-button floating-create",
    onClick: () => navigate("/conditions/new")
  }, "+ Create New Condition"));
  const renderGridView = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "condition-grid"
  }, conditions.map(condition => /*#__PURE__*/React.createElement("div", {
    key: condition.conditionId,
    className: `condition-card ${condition.conditionType.toLowerCase()}`,
    onClick: () => handleConditionClick(condition.conditionId)
  }, /*#__PURE__*/React.createElement("h3", null, condition.name), /*#__PURE__*/React.createElement("div", {
    className: "condition-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: `condition-type ${condition.conditionType.toLowerCase()}`
  }, condition.conditionType), /*#__PURE__*/React.createElement("span", {
    className: "condition-target"
  }, condition.conditionTarget)), /*#__PURE__*/React.createElement("p", {
    className: "condition-description"
  }, condition.description), /*#__PURE__*/React.createElement("div", {
    className: "condition-category"
  }, condition.conditionCategory))), /*#__PURE__*/React.createElement("div", {
    className: "condition-card add-card",
    onClick: () => navigate("/conditions/new")
  }, /*#__PURE__*/React.createElement("div", {
    className: "add-icon"
  }, "+"), /*#__PURE__*/React.createElement("h3", null, "Create New Condition"))));
  const renderMobileListView = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "condition-mobile-list"
  }, conditions.map(condition => /*#__PURE__*/React.createElement("div", {
    key: condition.conditionId,
    className: "condition-mobile-item",
    onClick: () => handleConditionClick(condition.conditionId)
  }, /*#__PURE__*/React.createElement("div", {
    className: "condition-mobile-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "condition-mobile-name"
  }, condition.name), /*#__PURE__*/React.createElement("div", {
    className: "condition-mobile-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: `condition-type ${condition.conditionType.toLowerCase()}`
  }, condition.conditionType), /*#__PURE__*/React.createElement("span", {
    className: "condition-target"
  }, condition.conditionTarget))), /*#__PURE__*/React.createElement("div", {
    className: "condition-mobile-actions"
  }, selectedCharacter && /*#__PURE__*/React.createElement("button", {
    className: `add-button ${addingConditionId === condition.conditionId ? 'success' : ''}`,
    onClick: e => handleAddToCharacter(e, condition.conditionId),
    disabled: addingConditionId === condition.conditionId
  }, addingConditionId === condition.conditionId ? '✓' : 'Add'), /*#__PURE__*/React.createElement("button", {
    className: "edit-button",
    onClick: e => handleEdit(e, condition.conditionId)
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "delete-button",
    onClick: e => handleDelete(e, condition.conditionId, condition.name)
  }, "Delete"))))), /*#__PURE__*/React.createElement("button", {
    className: "create-button floating-create",
    onClick: () => navigate("/conditions/new")
  }, "+ Create New Condition"));
  return /*#__PURE__*/React.createElement("div", {
    className: "condition-page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-content"
  }, /*#__PURE__*/React.createElement("h1", null, "Conditions"), /*#__PURE__*/React.createElement(SearchFilterSort, {
    entityType: "conditions",
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
  }, "Loading..."), conditions.length === 0 && !loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No conditions found."), /*#__PURE__*/React.createElement("button", {
    className: "create-button",
    onClick: () => navigate("/conditions/new")
  }, "Create New Condition")) : /*#__PURE__*/React.createElement(React.Fragment, null, window.innerWidth <= 768 ? renderMobileListView() : viewMode === 'table' ? renderTableView() : renderGridView(), /*#__PURE__*/React.createElement(PaginationControls, {
    hasNextPage: hasNextPage,
    onNext: handleNextPage,
    onPrevious: handlePreviousPage,
    onPageSizeChange: handlePageSizeChange,
    pageSize: pageSize,
    currentItemCount: conditions.length,
    isLoading: loading,
    hasPreviousPage: hasPreviousPage
  }))), mutationError && /*#__PURE__*/React.createElement(ErrorPopup, {
    error: mutationError,
    onClose: () => setMutationError(null)
  }));
};
export default ConditionsList;