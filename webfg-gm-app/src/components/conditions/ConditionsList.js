import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { LIST_CONDITIONS } from "../../graphql/operations";
import "./ConditionsList.css";

const ConditionsList = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(LIST_CONDITIONS);
  
  const handleConditionClick = (conditionId) => {
    navigate(`/conditions/${conditionId}`);
  };
  
  if (loading) return <div className="loading">Loading conditions...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  
  const conditions = data?.listConditions || [];

  return (
    <div className="condition-page">
      <div className="page-content">
        <h1>Conditions</h1>
                
{conditions.length === 0 ? (
          <div className="empty-state">
            <p>No conditions have been created yet.</p>
            <button 
              className="create-button"
              onClick={() => navigate("/conditions/new")}
            >
              Create New Condition
            </button>
          </div>
        ) : (
          <div className={`condition-grid ${conditions.length > 0 ? 'with-add-card' : ''}`}>
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
                  <span className="condition-amount">
                    {condition.conditionType === 'HELP' ? '+' : '-'}{condition.conditionAmount || 1}
                  </span>
                </div>
                <p className="condition-description">{condition.description}</p>
                <div className="condition-category">
                  {condition.conditionCategory}
                </div>
              </div>
            ))}
            
            {/* Add a 'Create New Condition' card at the end when conditions exist */}
            <div 
              className="condition-card add-card"
              onClick={() => navigate("/conditions/new")}
            >
              <div className="add-icon">+</div>
              <h3>Create New Condition</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionsList;