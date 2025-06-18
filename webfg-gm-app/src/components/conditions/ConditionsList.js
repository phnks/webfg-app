import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { LIST_CONDITIONS_ENHANCED } from "../../graphql/operations";
import SearchFilterSort from "../common/SearchFilterSort";
import PaginationControls from "../common/PaginationControls";
import "./ConditionsList.css";

const ConditionsList = () => {
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

  const { data, loading, error } = useQuery(LIST_CONDITIONS_ENHANCED, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network'
  });
  
  const handleConditionClick = (conditionId) => {
    navigate(`/conditions/${conditionId}`);
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
  
  if (loading && currentPage === 0) return <div className="loading">Loading conditions...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  
  const conditions = data?.listConditionsEnhanced?.items || [];
  const hasNextPage = data?.listConditionsEnhanced?.hasNextPage || false;
  const hasPreviousPage = currentPage > 0;

  return (
    <div className="condition-page">
      <div className="page-content">
        <h1>Conditions</h1>
        
        <SearchFilterSort
          entityType="conditions"
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          onClearFilters={handleClearFilters}
        />

        {loading && (
          <div className="loading-overlay">Loading...</div>
        )}
                
        {conditions.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No conditions found.</p>
            <button 
              className="create-button"
              onClick={() => navigate("/conditions/new")}
            >
              Create New Condition
            </button>
          </div>
        ) : (
          <>
            <div className="condition-grid">
              {conditions.map(condition => (
                <div 
                  key={condition.conditionId} 
                  className={`condition-card ${condition.conditionType.toLowerCase()}`}
                  onClick={() => handleConditionClick(condition.conditionId)}
                >
                  <h3>{condition.name}</h3>
                  <div className="condition-meta">
                    <span className={`condition-type ${condition.conditionType.toLowerCase()}`}>
                      {condition.conditionType}
                    </span>
                    <span className="condition-target">{condition.conditionTarget}</span>
                  </div>
                  <p className="condition-description">{condition.description}</p>
                  <div className="condition-category">
                    {condition.conditionCategory}
                  </div>
                </div>
              ))}
              
              <div 
                className="condition-card add-card"
                onClick={() => navigate("/conditions/new")}
              >
                <div className="add-icon">+</div>
                <h3>Create New Condition</h3>
              </div>
            </div>

            <PaginationControls
              hasNextPage={hasNextPage}
              onNext={handleNextPage}
              onPrevious={handlePreviousPage}
              onPageSizeChange={handlePageSizeChange}
              pageSize={pageSize}
              currentItemCount={conditions.length}
              isLoading={loading}
              hasPreviousPage={hasPreviousPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ConditionsList;