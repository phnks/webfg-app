import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { LIST_OBJECTS_ENHANCED } from "../../graphql/operations";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import "./ObjectList.css";

const ObjectList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [cursors, setCursors] = useState([null]);
  const [currentPage, setCurrentPage] = useState(0);

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

  const handleObjectClick = (objectId) => {
    navigate(`/objects/${objectId}`);
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
    </div>
  );
};

export default ObjectList;
