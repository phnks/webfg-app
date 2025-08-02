import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { LIST_ACTIONS_ENHANCED, ADD_ACTION_TO_CHARACTER, DELETE_ACTION } from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import ErrorPopup from "../common/ErrorPopup";
import "./ActionList.css";
const ActionList = () => {
  const navigate = useNavigate();
  const {
    selectedCharacter
  } = useSelectedCharacter();
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
  const {
    data,
    loading,
    error
  } = useQuery(LIST_ACTIONS_ENHANCED, {
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
  const handleActionClick = actionId => {
    navigate(`/actions/${actionId}`);
  };
  const handleAddToCharacter = async (e, actionId) => {
    e.stopPropagation();
    if (!selectedCharacter) {
      setMutationError({
        message: "Please select a character first.",
        stack: null
      });
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
    navigate(`/actions/${actionId}/edit`);
  };
  const handleDelete = async (e, actionId, actionName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${actionName}"?`)) {
      return;
    }
    try {
      await deleteAction({
        variables: {
          actionId
        }
      });
    } catch (err) {
      console.error("Error deleting action:", err);
      setMutationError({
        message: err.message || "Failed to delete action",
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
  if (loading && currentPage === 0) return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading actions...");
  if (error) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Error: ", error.message);
  const actions = data?.listActionsEnhanced?.items || [];
  const hasNextPage = data?.listActionsEnhanced?.hasNextPage || false;
  const hasPreviousPage = currentPage > 0;
  const renderTableView = () => /*#__PURE__*/React.createElement("div", {
    className: "action-table-container"
  }, /*#__PURE__*/React.createElement("table", {
    className: "action-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Category"), /*#__PURE__*/React.createElement("th", null, "Source Attribute"), /*#__PURE__*/React.createElement("th", null, "Target Attribute"), /*#__PURE__*/React.createElement("th", null, "Object Usage"), /*#__PURE__*/React.createElement("th", null, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, actions.map(action => /*#__PURE__*/React.createElement("tr", {
    key: action.actionId,
    onClick: () => handleActionClick(action.actionId)
  }, /*#__PURE__*/React.createElement("td", {
    className: "action-name"
  }, action.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "category-badge"
  }, action.actionCategory)), /*#__PURE__*/React.createElement("td", null, action.sourceAttribute), /*#__PURE__*/React.createElement("td", null, action.targetAttribute), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "object-usage-badge"
  }, action.objectUsage || 'N/A')), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "action-buttons"
  }, selectedCharacter && /*#__PURE__*/React.createElement("button", {
    className: `add-button ${addingActionId === action.actionId ? 'success' : ''}`,
    onClick: e => handleAddToCharacter(e, action.actionId),
    disabled: addingActionId === action.actionId
  }, addingActionId === action.actionId ? 'Added!' : 'Add'), /*#__PURE__*/React.createElement("button", {
    className: "edit-button",
    onClick: e => handleEdit(e, action.actionId)
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "delete-button",
    onClick: e => handleDelete(e, action.actionId, action.name)
  }, "Delete"))))))), /*#__PURE__*/React.createElement("div", {
    className: "table-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "create-button",
    onClick: () => navigate("/actions/new")
  }, "Create New Action")));
  const renderGridView = () => /*#__PURE__*/React.createElement("div", {
    className: "action-grid"
  }, actions.map(action => /*#__PURE__*/React.createElement("div", {
    key: action.actionId,
    className: "action-card",
    onClick: () => handleActionClick(action.actionId)
  }, /*#__PURE__*/React.createElement("h3", null, action.name), /*#__PURE__*/React.createElement("div", {
    className: "action-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "action-category"
  }, action.actionCategory), /*#__PURE__*/React.createElement("span", {
    className: "action-attributes"
  }, action.sourceAttribute, " \u2192 ", action.targetAttribute), /*#__PURE__*/React.createElement("div", {
    className: "action-details-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "action-target-type"
  }, action.targetType), /*#__PURE__*/React.createElement("span", {
    className: "action-effect-type"
  }, action.effectType), /*#__PURE__*/React.createElement("span", {
    className: "action-object-usage"
  }, action.objectUsage || 'N/A'))), action.description && /*#__PURE__*/React.createElement("p", {
    className: "action-description"
  }, action.description.length > 100 ? `${action.description.substring(0, 100)}...` : action.description))), /*#__PURE__*/React.createElement("div", {
    className: "action-card add-card",
    onClick: () => navigate("/actions/new")
  }, /*#__PURE__*/React.createElement("div", {
    className: "add-icon"
  }, "+"), /*#__PURE__*/React.createElement("h3", null, "Create New Action")));
  const renderMobileListView = () => /*#__PURE__*/React.createElement("div", {
    className: "action-mobile-list"
  }, actions.map(action => /*#__PURE__*/React.createElement("div", {
    key: action.actionId,
    className: "action-mobile-item",
    onClick: () => handleActionClick(action.actionId)
  }, /*#__PURE__*/React.createElement("div", {
    className: "action-mobile-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "action-mobile-name"
  }, action.name), /*#__PURE__*/React.createElement("div", {
    className: "action-mobile-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "category-badge"
  }, action.actionCategory), /*#__PURE__*/React.createElement("span", {
    className: "action-attributes"
  }, action.sourceAttribute, " \u2192 ", action.targetAttribute), /*#__PURE__*/React.createElement("span", {
    className: "object-usage-badge"
  }, action.objectUsage || 'N/A'))), /*#__PURE__*/React.createElement("div", {
    className: "action-mobile-actions"
  }, selectedCharacter && /*#__PURE__*/React.createElement("button", {
    className: `add-button ${addingActionId === action.actionId ? 'success' : ''}`,
    onClick: e => handleAddToCharacter(e, action.actionId),
    disabled: addingActionId === action.actionId
  }, addingActionId === action.actionId ? '✓' : 'Add'), /*#__PURE__*/React.createElement("button", {
    className: "edit-button",
    onClick: e => handleEdit(e, action.actionId)
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "delete-button",
    onClick: e => handleDelete(e, action.actionId, action.name)
  }, "Delete")))), /*#__PURE__*/React.createElement("button", {
    className: "create-button floating-create",
    onClick: () => navigate("/actions/new")
  }, "+ Create New Action"));
  return /*#__PURE__*/React.createElement("div", {
    className: "action-page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-content"
  }, /*#__PURE__*/React.createElement("h1", null, "Actions"), /*#__PURE__*/React.createElement(SearchFilterSort, {
    entityType: "actions",
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
  }, "Loading..."), actions.length === 0 && !loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No actions found."), /*#__PURE__*/React.createElement("button", {
    className: "create-button",
    onClick: () => navigate("/actions/new")
  }, "Create New Action")) : /*#__PURE__*/React.createElement(React.Fragment, null, window.innerWidth <= 768 ? renderMobileListView() : viewMode === 'table' ? renderTableView() : renderGridView(), /*#__PURE__*/React.createElement(PaginationControls, {
    hasNextPage: hasNextPage,
    onNext: handleNextPage,
    onPrevious: handlePreviousPage,
    onPageSizeChange: handlePageSizeChange,
    pageSize: pageSize,
    currentItemCount: actions.length,
    isLoading: loading,
    hasPreviousPage: hasPreviousPage
  }))), mutationError && /*#__PURE__*/React.createElement(ErrorPopup, {
    error: mutationError,
    onClose: () => setMutationError(null)
  }));
};
export default ActionList;