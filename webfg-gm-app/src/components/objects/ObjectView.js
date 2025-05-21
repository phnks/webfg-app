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
import ObjectAttributes from "./ObjectAttributes";
import "./ObjectView.css";

const ObjectView = () => {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const { selectedCharacter } = useSelectedCharacter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentObject, setCurrentObject] = useState(null);
  const [addObjectSuccess, setAddObjectSuccess] = useState(false);
  const [mutationError, setMutationError] = useState(null);
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
    refetch();
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  // Handle adding object to selected character's inventory
  const handleAddToInventory = async () => {
    if (!selectedCharacter) {
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

          <ObjectAttributes object={currentObject} />

          {currentObject.special && currentObject.special.length > 0 && (
            <>
              <h4>Special Properties</h4>
              <ul>
                {currentObject.special.map((prop, index) => (
                  <li key={index}>{prop}</li>
                ))}
              </ul>
            </>
          )}

          {currentObject.equipment && currentObject.equipment.length > 0 && (
            <>
              <h4>Equipment</h4>
              <ul>
                {currentObject.equipment.map(equip => {
                    const nextBreadcrumbs = [...breadcrumbs, { objectId: currentObject.objectId, name: currentObject.name }];
                    const nextBreadcrumbsParam = encodeURIComponent(JSON.stringify(nextBreadcrumbs));

                    return (
                      <li key={equip.objectId} className="part-item" style={{ marginBottom: '5px' }}>
                        <Link to={`/objects/${equip.objectId}?breadcrumbs=${nextBreadcrumbsParam}`} className="part-name-link">
                          {equip.name}
                        </Link>
                        <span className="part-info" style={{ marginLeft: '8px' }}>
                          ({equip.objectCategory || 'N/A'})
                          {equip.equipmentIds && equip.equipmentIds.length > 0 ? ` - ${equip.equipmentIds.length} sub-equipment(s)` : ''}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
          {(!currentObject.equipment || currentObject.equipment.length === 0) && currentObject.equipmentIds && currentObject.equipmentIds.length > 0 && (
             <>
              <h4>Equipment IDs</h4>
              <span>{currentObject.equipmentIds.join(", ")}</span>
             </>
          )}
        </div>
      </div>
      <ErrorPopup error={mutationError} onClose={() => setMutationError(null)} />
    </div>
  );
};

export default ObjectView;