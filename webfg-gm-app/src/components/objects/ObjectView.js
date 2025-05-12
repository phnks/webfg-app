import React, { useState, useEffect } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import {
  GET_OBJECT,
  DELETE_OBJECT,
  ADD_OBJECT_TO_INVENTORY,
  ON_UPDATE_OBJECT,
  ON_DELETE_OBJECT
} from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import ObjectForm from "../forms/ObjectForm";
import "./ObjectView.css";

const ObjectView = () => {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const { selectedCharacter } = useSelectedCharacter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentObject, setCurrentObject] = useState(null);
  const [addObjectSuccess, setAddObjectSuccess] = useState(false);
  const [mutationError, setMutationError] = useState(null); // Added mutationError state
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // Initial query to get object data
  const { data, loading, error, refetch } = useQuery(GET_OBJECT, {
    variables: { objectId },
    onCompleted: (data) => {
      if (data && data.getObject) {
        setCurrentObject(data.getObject);
      }
    }
  });

  const [deleteObject] = useMutation(DELETE_OBJECT);
  const [addObjectToInventory] = useMutation(ADD_OBJECT_TO_INVENTORY);

  // Subscribe to object updates
  useSubscription(ON_UPDATE_OBJECT, {
    onData: ({ data }) => {
      const updatedObject = data.data.onUpdateObject;
      if (updatedObject && updatedObject.objectId === objectId) {
        console.log("Object update received via subscription:", updatedObject);
        // Refresh the object data
        setCurrentObject(prev => ({
          ...prev,
          ...updatedObject
        }));
      }
    }
  });

  // Subscribe to object deletions
  useSubscription(ON_DELETE_OBJECT, {
    onData: ({ data }) => {
      const deletedObject = data.data.onDeleteObject;
      if (deletedObject && deletedObject.objectId === objectId) {
        console.log("Object was deleted");
        // Redirect to the object list since this object no longer exists
        navigate("/objects");
      }
    }
  });

  // Ensure we're using the most recent data
  useEffect(() => {
    if (data && data.getObject) {
      setCurrentObject(data.getObject);
    }
  }, [data]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const crumbsParam = queryParams.get('breadcrumbs');
    if (crumbsParam) {
      try {
        const parsedCrumbs = JSON.parse(crumbsParam);
        setBreadcrumbs(Array.isArray(parsedCrumbs) ? parsedCrumbs : []);
      } catch (e) {
        console.error("Error parsing breadcrumbs from URL:", e);
        setBreadcrumbs([]);
      }
    } else {
      setBreadcrumbs([]); 
    }
  }, [location.search]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this object?")) {
      try {
        await deleteObject({
          variables: { objectId }
        });
        navigate("/objects");
      } catch (err) {
        console.error("Error deleting object:", err);
        let errorMessage = "An unexpected error occurred while deleting object.";
        let errorStack = err.stack || "No stack trace available.";
        if (err.graphQLErrors && err.graphQLErrors.length > 0) {
          errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
          errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
          console.error("GraphQL Errors:", err.graphQLErrors);
        } else if (err.networkError) {
          errorMessage = `Network Error: ${err.networkError.message}`;
          errorStack = err.networkError.stack || "No network error stack trace available.";
          console.error("Network Error:", err.networkError);
        } else {
            errorMessage = err.message;
        }
        setMutationError({ message: errorMessage, stack: errorStack });
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    refetch(); // Refetch to ensure we have the latest data
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  // Handle adding object to selected character's inventory
  const handleAddToInventory = async () => {
    if (!selectedCharacter) {
      // Optionally display an error or message if no character is selected
      setMutationError({ message: "Please select a character first.", stack: null });
      return;
    }

    try {
      const result = await addObjectToInventory({
        variables: {
          characterId: selectedCharacter.characterId,
          objectId
        }
      });
      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }

      setAddObjectSuccess(true);
      setTimeout(() => setAddObjectSuccess(false), 3000);
    } catch (err) {
      console.error("Error adding object to inventory:", err);
      let errorMessage = "An unexpected error occurred while adding object to inventory.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
    }
  };


  const addToInventory = (objectId) => {
    // Implementation
  };

  const equipItem = (objectId, slot) => {
    // Implementation
  };

  const removeItem = (objectId) => {
    // Implementation
  };

  const addAction = (actionId) => {
    // Implementation
  };

  if (loading) return <div className="loading">Loading object details...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  if (!currentObject) return <div className="error">Object not found</div>;

  if (isEditing) {
    return (
      <ObjectForm
        object={currentObject}
        isEditing={true}
        onClose={handleEditCancel}
        onSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <div className="object-view">
      {breadcrumbs.length > 0 && currentObject && (
      <nav aria-label="breadcrumb" className="breadcrumb-nav" style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
        <ol className="breadcrumb" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {breadcrumbs.map((crumb, index) => {
            const trailForLink = breadcrumbs.slice(0, index); 
            const trailParam = encodeURIComponent(JSON.stringify(trailForLink));
            return (
              <li key={crumb.objectId} className="breadcrumb-item" style={{ display: 'flex', alignItems: 'center' }}>
                <Link to={`/objects/${crumb.objectId}?breadcrumbs=${trailParam}`}>
                  {crumb.name}
                </Link>
                <span aria-hidden="true" style={{ marginLeft: '5px', marginRight: '5px' }}>&gt;</span>
              </li>
            );
          })}
          <li className="breadcrumb-item active" aria-current="page" style={{ fontWeight: 'bold' }}>
            {currentObject.name}
          </li>
        </ol>
      </nav>
    )}
    <div className="object-header">
        <h1>{currentObject.name}</h1>
        <div className="object-actions">
          {selectedCharacter && (
            <button
              onClick={handleAddToInventory}
              className={`add-to-inventory-btn ${addObjectSuccess ? 'success' : ''}`}
              disabled={addObjectSuccess}
            >
              {addObjectSuccess ? 'Added!' : selectedCharacter ? `Add to ${selectedCharacter.name}'s Inventory` : 'Add to Inventory'}
            </button>
          )}
          <button onClick={handleEdit}>Edit</button>
          <button onClick={handleDelete} className="delete-button">Delete</button>
        </div>
      </div>

      <div className="object-content">
        <div className="object-details">
          <h3>Details</h3>
          <div className="detail-row">
            <span>Category:</span>
            <span>{currentObject.objectCategory || "N/A"}</span>
          </div>
          <div className="detail-row">
            <span>Weight:</span>
            <span>{currentObject.weight?.toFixed(2) || "0.00"} kg</span>
          </div>
          <div className="detail-row">
            <span>Dimensions (W×L×H):</span>
            <span>
              {currentObject.width?.toFixed(2) || "N/A"} × {currentObject.length?.toFixed(2) || "N/A"} × {currentObject.height?.toFixed(2) || "N/A"} m
            </span>
          </div>
          {currentObject.hitPoints && (
            <div className="detail-row">
              <span>Hit Points:</span>
              <span>{currentObject.hitPoints.current} / {currentObject.hitPoints.max}</span>
            </div>
          )}
          <div className="detail-row">
            <span>Noise:</span>
            <span>{currentObject.noise?.toFixed(1) || "0.0"}</span>
          </div>
          <div className="detail-row">
            <span>Capacity:</span>
            <span>{currentObject.capacity?.toFixed(2) || "0.00"}</span>
          </div>

          <h4>Combat Stats</h4>
          <div className="detail-row">
            <span>Damage:</span>
            <span>{currentObject.damageMin}-{currentObject.damageMax} ({currentObject.damageType})</span>
          </div>
          <div className="detail-row">
            <span>Penetration:</span>
            <span>{currentObject.penetration?.toFixed(1) || "0.0"}</span>
          </div>
          <div className="detail-row">
            <span>Deflection:</span>
            <span>{currentObject.deflection?.toFixed(1) || "0.0"}</span>
          </div>
          <div className="detail-row">
            <span>Impact:</span>
            <span>{currentObject.impact?.toFixed(1) || "0.0"}</span>
          </div>
          <div className="detail-row">
            <span>Absorption:</span>
            <span>{currentObject.absorption?.toFixed(1) || "0.0"}</span>
          </div>

          <h4>Properties</h4>
          <div className="detail-row">
            <span>Is Limb:</span>
            <span>{currentObject.isLimb ? "Yes" : "No"}</span>
          </div>
          <div className="detail-row">
            <span>Handling:</span>
            <span>{currentObject.handling?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="detail-row">
            <span>Duration:</span>
            <span>{currentObject.duration?.toFixed(2) || "0.00"} s</span>
          </div>
          <div className="detail-row">
            <span>Falloff:</span>
            <span>{currentObject.falloff?.toFixed(2) || "0.00"}</span>
          </div>

          {currentObject.parts && currentObject.parts.length > 0 && (
            <>
              <h4>Parts</h4>
              <ul>
                {currentObject.parts.map(part => {
                    console.log("[ObjectView] Current breadcrumbs state:", JSON.stringify(breadcrumbs));
                    console.log("[ObjectView] Current object for breadcrumb:", JSON.stringify({ objectId: currentObject?.objectId, name: currentObject?.name }));

                    const nextBreadcrumbs = [...breadcrumbs, { objectId: currentObject.objectId, name: currentObject.name }];
                    const nextBreadcrumbsParam = encodeURIComponent(JSON.stringify(nextBreadcrumbs));

                    console.log(`[ObjectView] For part ${part.name} (ID: ${part.objectId}), nextBreadcrumbsParam: ${nextBreadcrumbsParam}`);

                    return (
                      <li key={part.objectId} className="part-item" style={{ marginBottom: '5px' }}>
                        <Link to={`/objects/${part.objectId}?breadcrumbs=${nextBreadcrumbsParam}`} className="part-name-link">
                          {part.name}
                        </Link>
                        <span className="part-info" style={{ marginLeft: '8px' }}>
                          ({part.objectCategory || 'N/A'})
                          {part.partIds && part.partIds.length > 0 ? ` - ${part.partIds.length} sub-part(s)` : ''}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
          {(!currentObject.parts || currentObject.parts.length === 0) && currentObject.partsIds && currentObject.partsIds.length > 0 && (
             <>
              <h4>Part IDs</h4>
              <span>{currentObject.partsIds.join(", ")}</span>
             </>
          )}

          {currentObject.usage && currentObject.usage.length > 0 && (
            <>
              <h4>Usage</h4>
              <ul>
                {currentObject.usage.map((use, index) => (
                  <li key={index}>
                    Action ID: {use.actionId}, Types: {use.usageType.join(", ")}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      <ErrorPopup error={mutationError} onClose={() => setMutationError(null)} /> {/* Added ErrorPopup */}
    </div>
  );
};

export default ObjectView;
