import React, { useEffect } from "react"; // Added useEffect
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { LIST_OBJECTS } from "../../graphql/operations";
import "./ObjectList.css";

const ObjectList = () => {
  const navigate = useNavigate();
  // Added fetchPolicy and error handling
  const { data, loading, error } = useQuery(LIST_OBJECTS);

  // Add logging for data/error changes
  useEffect(() => {
    if (data) {
      // Using console.dir for better object inspection in browser dev tools
      console.log("ObjectList data received:");
      console.dir(data);
    }
    if (error) {
      console.error("ObjectList error received:");
      console.dir(error);
      // Log specific parts if available
      if (error.graphQLErrors) {
         console.error("GraphQL Errors:");
         console.dir(error.graphQLErrors);
      }
      if (error.networkError) {
        console.error("Network Error:");
        console.dir(error.networkError);
      }
    }
  }, [data, error]); // Log whenever data or error changes

  const handleObjectClick = (objectId) => {
    navigate(`/objects/${objectId}`);
  };

  if (loading) return <div className="loading">Loading objects...</div>;

  // Display the specific error causing the issue, if it exists
  if (error) {
      // Log error just before rendering the error message
      console.error("Rendering ObjectList with error state:", error.message);
      console.dir(error);
      return <div className="error">Error: {error.message}</div>;
  }

  const objects = data?.listObjects || [];
  // Log objects just before rendering the list
  console.log(`Rendering ObjectList with ${objects.length} objects.`);
  // console.dir(objects); // Optional: log the full array if needed

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
                {/* Display objectCategory */}
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
