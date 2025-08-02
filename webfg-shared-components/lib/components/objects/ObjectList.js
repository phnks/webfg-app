import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { LIST_OBJECTS_ENHANCED, ADD_OBJECT_TO_STASH, DELETE_OBJECT } from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import ErrorPopup from "../common/ErrorPopup";
import "./ObjectList.css";
const ObjectList = () => {
  const navigate = useNavigate();
  const {
    selectedCharacter
  } = useSelectedCharacter();
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
  const {
    data,
    loading,
    error
  } = useQuery(LIST_OBJECTS_ENHANCED, {
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
  const handleObjectClick = objectId => {
    navigate(`/objects/${objectId}`);
  };
  const handleAddToStash = async (e, objectId) => {
    e.stopPropagation();
    if (!selectedCharacter) {
      setMutationError({
        message: "Please select a character first.",
        stack: null
      });
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
    navigate(`/objects/${objectId}/edit`);
  };
  const handleDelete = async (e, objectId, objectName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${objectName}"?`)) {
      return;
    }
    try {
      await deleteObject({
        variables: {
          objectId
        }
      });
    } catch (err) {
      console.error("Error deleting object:", err);
      setMutationError({
        message: err.message || "Failed to delete object",
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
  if (loading && currentPage === 0) return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading objects...");
  if (error) {
    console.error("Error loading objects:", error);
    return /*#__PURE__*/React.createElement("div", {
      className: "error"
    }, "Error loading objects: ", error.message);
  }
  const objects = data?.listObjectsEnhanced?.items || [];
  const hasNextPage = data?.listObjectsEnhanced?.hasNextPage || false;
  const hasPreviousPage = currentPage > 0;
  const renderTableView = () => /*#__PURE__*/React.createElement("div", {
    className: "object-table-container"
  }, /*#__PURE__*/React.createElement("table", {
    className: "object-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Category"), /*#__PURE__*/React.createElement("th", null, "Equipment Type"), /*#__PURE__*/React.createElement("th", null, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, objects.map(object => /*#__PURE__*/React.createElement("tr", {
    key: object.objectId,
    onClick: () => handleObjectClick(object.objectId)
  }, /*#__PURE__*/React.createElement("td", {
    className: "object-name"
  }, object.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "category-badge"
  }, object.objectCategory)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `equipment-type-badge ${object.isEquipment !== false ? 'passive' : 'active'}`
  }, object.isEquipment !== false ? 'Passive' : 'Active')), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "action-buttons"
  }, selectedCharacter && /*#__PURE__*/React.createElement("button", {
    className: `add-button ${addingObjectId === object.objectId ? 'success' : ''}`,
    onClick: e => handleAddToStash(e, object.objectId),
    disabled: addingObjectId === object.objectId
  }, addingObjectId === object.objectId ? 'Added!' : 'Add'), /*#__PURE__*/React.createElement("button", {
    className: "edit-button",
    onClick: e => handleEdit(e, object.objectId)
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "delete-button",
    onClick: e => handleDelete(e, object.objectId, object.name)
  }, "Delete"))))))), /*#__PURE__*/React.createElement("div", {
    className: "table-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "create-button",
    onClick: () => navigate("/objects/new")
  }, "Create New Object")));
  const renderGridView = () => /*#__PURE__*/React.createElement("div", {
    className: "object-grid"
  }, objects.map(object => /*#__PURE__*/React.createElement("div", {
    key: object.objectId,
    className: "object-card",
    onClick: () => handleObjectClick(object.objectId)
  }, /*#__PURE__*/React.createElement("h3", null, object.name), /*#__PURE__*/React.createElement("div", {
    className: "object-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "category"
  }, object.objectCategory)))), /*#__PURE__*/React.createElement("div", {
    className: "object-card add-card",
    onClick: () => navigate("/objects/new")
  }, /*#__PURE__*/React.createElement("div", {
    className: "add-icon"
  }, "+"), /*#__PURE__*/React.createElement("h3", null, "Create New Object")));
  const renderMobileListView = () => /*#__PURE__*/React.createElement("div", {
    className: "object-mobile-list"
  }, objects.map(object => /*#__PURE__*/React.createElement("div", {
    key: object.objectId,
    className: "object-mobile-item",
    onClick: () => handleObjectClick(object.objectId)
  }, /*#__PURE__*/React.createElement("div", {
    className: "object-mobile-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "object-mobile-name"
  }, object.name), /*#__PURE__*/React.createElement("div", {
    className: "object-mobile-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "category-badge"
  }, object.objectCategory))), /*#__PURE__*/React.createElement("div", {
    className: "object-mobile-actions"
  }, selectedCharacter && /*#__PURE__*/React.createElement("button", {
    className: `add-button ${addingObjectId === object.objectId ? 'success' : ''}`,
    onClick: e => handleAddToStash(e, object.objectId),
    disabled: addingObjectId === object.objectId
  }, addingObjectId === object.objectId ? '✓' : 'Add'), /*#__PURE__*/React.createElement("button", {
    className: "edit-button",
    onClick: e => handleEdit(e, object.objectId)
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "delete-button",
    onClick: e => handleDelete(e, object.objectId, object.name)
  }, "Delete")))), /*#__PURE__*/React.createElement("button", {
    className: "create-button floating-create",
    onClick: () => navigate("/objects/new")
  }, "+ Create New Object"));
  return /*#__PURE__*/React.createElement("div", {
    className: "object-page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-content"
  }, /*#__PURE__*/React.createElement("h1", null, "Objects"), /*#__PURE__*/React.createElement(SearchFilterSort, {
    entityType: "objects",
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
  }, "Loading..."), objects.length === 0 && !loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No objects found."), /*#__PURE__*/React.createElement("button", {
    className: "create-button",
    onClick: () => navigate("/objects/new")
  }, "Create New Object")) : /*#__PURE__*/React.createElement(React.Fragment, null, window.innerWidth <= 768 ? renderMobileListView() : viewMode === 'table' ? renderTableView() : renderGridView(), /*#__PURE__*/React.createElement(PaginationControls, {
    hasNextPage: hasNextPage,
    onNext: handleNextPage,
    onPrevious: handlePreviousPage,
    onPageSizeChange: handlePageSizeChange,
    pageSize: pageSize,
    currentItemCount: objects.length,
    isLoading: loading,
    hasPreviousPage: hasPreviousPage
  }))), mutationError && /*#__PURE__*/React.createElement(ErrorPopup, {
    error: mutationError,
    onClose: () => setMutationError(null)
  }));
};
export default ObjectList;