import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { LIST_OBJECTS } from "../../graphql/operations";
import "./ObjectList.css";

const ObjectList = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(LIST_OBJECTS);
  
  const handleObjectClick = (objectId) => {
    navigate(`/objects/${objectId}`);
  };
  
  if (loading) return <div className="loading">Loading objects...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  
  const objects = data?.listObjects || [];

  return (
    <div className="object-page">
      <div className="page-content">
        <h1>Objects</h1>
        
        {objects.length === 0 ? (
          <div className="empty-state">
            <p>No objects have been created yet.</p>
            <button 
              className="create-button"
              onClick={() => navigate("/objects/new")}
            >
              Create New Object
            </button>
          </div>
        ) : (
          <div className="object-grid">
            {objects.map(object => (
              <div 
                key={object.objectId} 
                className="object-card"
                onClick={() => handleObjectClick(object.objectId)}
              >
                <h3>{object.name}</h3>
                {object.objectCategory && <div className="object-type">{object.objectCategory}</div>}
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
        )}
      </div>
    </div>
  );
};

export default ObjectList; 