import React, { useState, useEffect } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { DELETE_OBJECT, ADD_OBJECT_TO_STASH, ON_UPDATE_OBJECT, ON_DELETE_OBJECT } from "../../graphql/operations";
import { GET_OBJECT_WITH_GROUPED, GET_OBJECT_ATTRIBUTE_BREAKDOWN } from "../../graphql/computedOperations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import { useRecentlyViewed } from "../../context/RecentlyViewedContext";
import ObjectForm from "../forms/ObjectForm";
import AttributeGroups from "../common/AttributeGroups";
import AttributeBreakdownPopup from "../common/AttributeBreakdownPopup";
import "./ObjectView.css";
const ObjectView = ({
  startInEditMode = false,
  object = null
}) => {
  const {
    objectId
  } = useParams();
  const navigate = useNavigate();
  const {
    selectedCharacter
  } = useSelectedCharacter();
  const {
    addRecentlyViewed
  } = useRecentlyViewed();
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [currentObject, setCurrentObject] = useState(null);
  const [addObjectSuccess, setAddObjectSuccess] = useState(false);
  const [mutationError, setMutationError] = useState(null);
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // State for attribute breakdown popup
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownData, setBreakdownData] = useState([]);
  const [breakdownAttributeName, setBreakdownAttributeName] = useState('');
  const [selectedAttributeKey, setSelectedAttributeKey] = useState(null);

  // Initial query to get object data (skip if object prop is provided)
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery(GET_OBJECT_WITH_GROUPED, {
    variables: {
      objectId
    },
    skip: !!object,
    // Skip GraphQL query if object prop is provided
    onCompleted: data => {
      if (data && data.getObject) {
        setCurrentObject(data.getObject);
        // Add to recently viewed
        addRecentlyViewed({
          id: data.getObject.objectId,
          name: data.getObject.name,
          type: 'object'
        });
      }
    }
  });
  const [deleteObject] = useMutation(DELETE_OBJECT);
  const [addObjectToStash] = useMutation(ADD_OBJECT_TO_STASH);

  // Query for attribute breakdown (only when needed)
  useQuery(GET_OBJECT_ATTRIBUTE_BREAKDOWN, {
    variables: {
      objectId: currentObject?.objectId,
      attributeName: selectedAttributeKey
    },
    skip: !selectedAttributeKey || !currentObject?.objectId,
    onCompleted: data => {
      if (data?.getObject?.attributeBreakdown) {
        setBreakdownData(data.getObject.attributeBreakdown);
        setShowBreakdown(true);
      }
    }
  });

  // Subscribe to object updates (skip if object prop is provided)
  useSubscription(ON_UPDATE_OBJECT, {
    skip: !!object,
    onData: ({
      data
    }) => {
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

  // Subscribe to object deletions (skip if object prop is provided)
  useSubscription(ON_DELETE_OBJECT, {
    skip: !!object,
    onData: ({
      data
    }) => {
      const deletedObject = data.data.onDeleteObject;
      if (deletedObject && deletedObject.objectId === objectId) {
        console.log("Object was deleted");
        navigate("/objects");
      }
    }
  });

  // Ensure we're using the most recent data
  useEffect(() => {
    if (object) {
      // Use the object prop if provided
      setCurrentObject(object);
    } else if (data && data.getObject) {
      // Otherwise use GraphQL query data
      setCurrentObject(data.getObject);
    }
  }, [data, object]);

  // Set edit mode when prop changes
  useEffect(() => {
    setIsEditing(startInEditMode);
  }, [startInEditMode]);
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
          variables: {
            objectId
          }
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
        setMutationError({
          message: errorMessage,
          stack: errorStack
        });
      }
    }
  };
  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleEditSuccess = updatedObjectId => {
    setIsEditing(false);
    // If we get an updated object ID, navigate to it (in case it changed)
    if (updatedObjectId && updatedObjectId !== objectId) {
      navigate(`/objects/${updatedObjectId}`);
    } else {
      refetch();
    }
  };
  const handleEditCancel = () => {
    setIsEditing(false);
  };

  // Handle adding object to selected character's inventory
  const handleAddToStash = async () => {
    if (!selectedCharacter) {
      setMutationError({
        message: "Please select a character first.",
        stack: null
      });
      return;
    }
    try {
      const result = await addObjectToStash({
        variables: {
          characterId: selectedCharacter.characterId,
          objectId
        }
      });
      if (!result.data || result.errors && result.errors.length > 0 || result.data && Object.values(result.data).every(value => value === null)) {
        throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
      setAddObjectSuccess(true);
      setTimeout(() => setAddObjectSuccess(false), 3000);
    } catch (err) {
      console.error("Error adding object to stash:", err);
      let errorMessage = "An unexpected error occurred while adding object to stash.";
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
      setMutationError({
        message: errorMessage,
        stack: errorStack
      });
    }
  };
  if (loading && !object) return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading object details...");
  if (error) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Error: ", error.message);
  if (!currentObject) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Object not found");
  if (isEditing) {
    return /*#__PURE__*/React.createElement(ObjectForm, {
      object: currentObject,
      isEditing: true,
      onClose: handleEditCancel,
      onSuccess: handleEditSuccess
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "object-view"
  }, breadcrumbs.length > 0 && currentObject && /*#__PURE__*/React.createElement("nav", {
    "aria-label": "breadcrumb",
    className: "breadcrumb-nav",
    style: {
      marginBottom: '15px',
      paddingBottom: '10px',
      borderBottom: '1px solid #eee'
    }
  }, /*#__PURE__*/React.createElement("ol", {
    className: "breadcrumb",
    style: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexWrap: 'wrap',
      gap: '5px'
    }
  }, breadcrumbs.map((crumb, index) => {
    const trailForLink = breadcrumbs.slice(0, index);
    const trailParam = encodeURIComponent(JSON.stringify(trailForLink));
    return /*#__PURE__*/React.createElement("li", {
      key: crumb.objectId,
      className: "breadcrumb-item",
      style: {
        display: 'flex',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(Link, {
      to: `/objects/${crumb.objectId}?breadcrumbs=${trailParam}`
    }, crumb.name), /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        marginLeft: '5px',
        marginRight: '5px'
      }
    }, ">"));
  }), /*#__PURE__*/React.createElement("li", {
    className: "breadcrumb-item active",
    "aria-current": "page",
    style: {
      fontWeight: 'bold'
    }
  }, currentObject.name))), /*#__PURE__*/React.createElement("div", {
    className: "object-header"
  }, /*#__PURE__*/React.createElement("h1", null, currentObject.name), /*#__PURE__*/React.createElement("div", {
    className: "object-actions"
  }, selectedCharacter && /*#__PURE__*/React.createElement("button", {
    onClick: handleAddToStash,
    className: `add-to-inventory-btn ${addObjectSuccess ? 'success' : ''}`,
    disabled: addObjectSuccess
  }, addObjectSuccess ? 'Added!' : selectedCharacter ? `Add to ${selectedCharacter.name}'s Stash` : 'Add to Stash'), /*#__PURE__*/React.createElement("button", {
    onClick: handleEdit
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    onClick: handleDelete,
    className: "delete-button"
  }, "Delete"))), /*#__PURE__*/React.createElement("div", {
    className: "object-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "object-details"
  }, /*#__PURE__*/React.createElement("h3", null, "Details"), /*#__PURE__*/React.createElement("div", {
    className: "detail-row"
  }, /*#__PURE__*/React.createElement("span", null, "Category:"), /*#__PURE__*/React.createElement("span", null, currentObject.objectCategory || "N/A")), currentObject.description && /*#__PURE__*/React.createElement("div", {
    className: "detail-row"
  }, /*#__PURE__*/React.createElement("span", null, "Description:"), /*#__PURE__*/React.createElement("span", null, currentObject.description)), /*#__PURE__*/React.createElement("div", {
    className: "detail-row"
  }, /*#__PURE__*/React.createElement("span", null, "Is Equipment:"), /*#__PURE__*/React.createElement("span", null, currentObject.isEquipment !== false ? /*#__PURE__*/React.createElement("span", {
    className: "equipment-type passive"
  }, "\u2713 Provides passive benefits when equipped") : /*#__PURE__*/React.createElement("span", {
    className: "equipment-type active"
  }, "\u2717 Only provides benefits when actively used"))), /*#__PURE__*/React.createElement(AttributeGroups, {
    attributes: currentObject,
    title: "Attributes",
    defaultExpandedGroups: ['BODY', 'MARTIAL', 'MENTAL'],
    renderAttribute: (attributeName, attribute, displayName) => {
      // Get the original value and grouped value
      const originalValue = attribute?.attributeValue || 0;
      const groupedValue = currentObject.groupedAttributes?.[attributeName];
      const hasGroupedValue = groupedValue !== undefined && groupedValue !== originalValue;
      const hasEquipment = currentObject?.equipment?.length > 0;

      // Function to get color style for grouped value
      const getGroupedValueStyle = (originalValue, groupedValue) => {
        if (groupedValue > originalValue) {
          return {
            color: '#28a745',
            fontWeight: 'bold'
          }; // Green for higher
        } else if (groupedValue < originalValue) {
          return {
            color: '#dc3545',
            fontWeight: 'bold'
          }; // Red for lower
        }
        return {
          fontWeight: 'bold'
        }; // Normal color for same
      };

      // Handler for showing breakdown
      const handleShowBreakdown = () => {
        if (hasEquipment) {
          setBreakdownAttributeName(displayName);
          setSelectedAttributeKey(attributeName);
        }
      };
      return /*#__PURE__*/React.createElement("div", {
        key: attributeName,
        className: "detail-row"
      }, /*#__PURE__*/React.createElement("span", null, displayName, ":"), /*#__PURE__*/React.createElement("span", null, originalValue, /*#__PURE__*/React.createElement("span", {
        className: "grouping-indicator",
        title: attribute?.isGrouped ? 'This attribute participates in grouping' : 'This attribute does not participate in grouping',
        style: {
          marginLeft: '6px',
          fontSize: '0.8em',
          opacity: 0.7
        }
      }, attribute?.isGrouped ? '☑️' : '❌'), hasGroupedValue && /*#__PURE__*/React.createElement("span", {
        className: "grouped-value",
        style: getGroupedValueStyle(originalValue, Math.round(groupedValue)),
        title: "Grouped value with equipment"
      }, ' → ', Math.round(groupedValue), hasEquipment && /*#__PURE__*/React.createElement("button", {
        className: "info-icon",
        onClick: handleShowBreakdown,
        title: "Show detailed breakdown"
      }, "\u2139\uFE0F"))));
    }
  }), currentObject.special && currentObject.special.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h4", null, "Special Properties"), /*#__PURE__*/React.createElement("ul", null, currentObject.special.map((prop, index) => /*#__PURE__*/React.createElement("li", {
    key: index
  }, prop)))), currentObject.equipment && currentObject.equipment.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h4", null, "Equipment"), /*#__PURE__*/React.createElement("ul", null, currentObject.equipment.map(equip => {
    const nextBreadcrumbs = [...breadcrumbs, {
      objectId: currentObject.objectId,
      name: currentObject.name
    }];
    const nextBreadcrumbsParam = encodeURIComponent(JSON.stringify(nextBreadcrumbs));
    return /*#__PURE__*/React.createElement("li", {
      key: equip.objectId,
      className: "part-item",
      style: {
        marginBottom: '5px'
      }
    }, /*#__PURE__*/React.createElement(Link, {
      to: `/objects/${equip.objectId}?breadcrumbs=${nextBreadcrumbsParam}`,
      className: "part-name-link"
    }, equip.name), /*#__PURE__*/React.createElement("span", {
      className: "part-info",
      style: {
        marginLeft: '8px'
      }
    }, "(", equip.objectCategory || 'N/A', ")", equip.equipmentIds && equip.equipmentIds.length > 0 ? ` - ${equip.equipmentIds.length} sub-equipment(s)` : ''));
  }))), (!currentObject.equipment || currentObject.equipment.length === 0) && currentObject.equipmentIds && currentObject.equipmentIds.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h4", null, "Equipment IDs"), /*#__PURE__*/React.createElement("span", null, currentObject.equipmentIds.join(", "))))), /*#__PURE__*/React.createElement(ErrorPopup, {
    error: mutationError,
    onClose: () => setMutationError(null)
  }), showBreakdown && /*#__PURE__*/React.createElement(AttributeBreakdownPopup, {
    breakdown: breakdownData,
    attributeName: breakdownAttributeName,
    onClose: () => {
      setShowBreakdown(false);
      setSelectedAttributeKey(null);
    }
  }));
};
export default ObjectView;