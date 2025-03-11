import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { LIST_ACTIONS } from "../../graphql/operations";
import "./ActionList.css";

const ActionList = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(LIST_ACTIONS);
  
  const handleActionClick = (actionId) => {
    navigate(`/actions/${actionId}`);
  };
  
  if (loading) return <div className="loading">Loading actions...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  
  const actions = data?.listActions || [];

  return (
    <div className="action-page">
      <div className="page-content">
        <h1>Actions</h1>
        
        {actions.length === 0 ? (
          <div className="empty-state">
            <p>No actions have been created yet.</p>
            <button 
              className="create-button"
              onClick={() => navigate("/actions/new")}
            >
              Create New Action
            </button>
          </div>
        ) : (
          <div className="action-grid">
            {actions.map(action => (
              <div 
                key={action.actionId} 
                className="action-card"
                onClick={() => handleActionClick(action.actionId)}
              >
                <h3>{action.name}</h3>
                {action.type && <div className="action-type">{action.type}</div>}
              </div>
            ))}
            
            <div 
              className="action-card add-card"
              onClick={() => navigate("/actions/new")}
            >
              <div className="add-icon">+</div>
              <h3>Create New Action</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionList; 