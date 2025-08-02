import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { LIST_THOUGHTS_ENHANCED, DELETE_THOUGHT } from "../../graphql/operations";
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
  const {
    data,
    loading,
    error
  } = useQuery(LIST_THOUGHTS_ENHANCED, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network'
  });
  const [deleteThought] = useMutation(DELETE_THOUGHT, {
    refetchQueries: [{
      query: LIST_THOUGHTS_ENHANCED,
      variables: queryVariables
    }]
  });
  const handleThoughtClick = thoughtId => {
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
        variables: {
          thoughtId
        }
      });
    } catch (err) {
      console.error("Error deleting thought:", err);
      setMutationError({
        message: err.message || "Failed to delete thought",
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
  if (loading && !data) return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading thoughts...");
  if (error && !data) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Error loading thoughts: ", error.message);
  const renderThoughts = () => {
    if (thoughts.length === 0) {
      return /*#__PURE__*/React.createElement("div", {
        className: "no-results"
      }, "No thoughts found.");
    }
    if (viewMode === 'table') {
      return /*#__PURE__*/React.createElement("div", {
        className: "table-container"
      }, /*#__PURE__*/React.createElement("table", {
        className: "thoughts-table"
      }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Description"), /*#__PURE__*/React.createElement("th", null, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, thoughts.map(thought => /*#__PURE__*/React.createElement("tr", {
        key: thought.thoughtId,
        onClick: () => handleThoughtClick(thought.thoughtId),
        className: "thought-row"
      }, /*#__PURE__*/React.createElement("td", {
        className: "thought-name"
      }, thought.name), /*#__PURE__*/React.createElement("td", {
        className: "thought-description"
      }, thought.description ? thought.description.length > 100 ? `${thought.description.substring(0, 100)}...` : thought.description : '-'), /*#__PURE__*/React.createElement("td", {
        className: "actions",
        onClick: e => e.stopPropagation()
      }, /*#__PURE__*/React.createElement("button", {
        className: "edit-btn",
        onClick: e => handleEdit(e, thought.thoughtId),
        title: "Edit thought"
      }, "Edit"), /*#__PURE__*/React.createElement("button", {
        className: "delete-btn",
        onClick: e => handleDelete(e, thought.thoughtId, thought.name),
        title: "Delete thought"
      }, "Delete")))))));
    }

    // Grid view
    return /*#__PURE__*/React.createElement("div", {
      className: "thoughts-grid"
    }, thoughts.map(thought => /*#__PURE__*/React.createElement("div", {
      key: thought.thoughtId,
      className: "thought-card",
      onClick: () => handleThoughtClick(thought.thoughtId)
    }, /*#__PURE__*/React.createElement("div", {
      className: "thought-card-header"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "thought-card-name"
    }, thought.name), /*#__PURE__*/React.createElement("div", {
      className: "thought-card-actions",
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("button", {
      className: "edit-btn",
      onClick: e => handleEdit(e, thought.thoughtId),
      title: "Edit thought"
    }, "Edit"), /*#__PURE__*/React.createElement("button", {
      className: "delete-btn",
      onClick: e => handleDelete(e, thought.thoughtId, thought.name),
      title: "Delete thought"
    }, "Delete"))), thought.description && /*#__PURE__*/React.createElement("div", {
      className: "thought-card-description"
    }, thought.description.length > 150 ? `${thought.description.substring(0, 150)}...` : thought.description))));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "thought-list"
  }, /*#__PURE__*/React.createElement("div", {
    className: "list-header"
  }, /*#__PURE__*/React.createElement("h1", null, "Thoughts"), /*#__PURE__*/React.createElement("button", {
    className: "create-btn",
    onClick: () => navigate('/thoughts/new')
  }, "Create New Thought")), /*#__PURE__*/React.createElement(SearchFilterSort, {
    entityType: "thoughts",
    onFilterChange: handleFilterChange,
    initialFilters: filters,
    onClearFilters: handleClearFilters
  }), renderThoughts(), /*#__PURE__*/React.createElement(PaginationControls, {
    currentPage: currentPage,
    hasNextPage: hasNextPage,
    hasPrevPage: currentPage > 0,
    onNextPage: handleNextPage,
    onPrevPage: handlePrevPage,
    pageSize: pageSize,
    onPageSizeChange: handlePageSizeChange,
    totalCount: totalCount,
    itemCount: thoughts.length,
    loading: loading
  }), mutationError && /*#__PURE__*/React.createElement(ErrorPopup, {
    error: mutationError,
    onClose: () => setMutationError(null)
  }));
};
export default ThoughtList;