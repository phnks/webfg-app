import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_OBJECT_ATTRIBUTE_BREAKDOWN } from "../../graphql/computedOperations";
import AttributeBreakdownPopup from "../common/AttributeBreakdownPopup";
import "./ObjectAttributes.css";

const ObjectAttributesBackend = ({ object }) => {
  // State for breakdown popup (must be at top level)
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownData, setBreakdownData] = useState([]);
  const [breakdownAttributeName, setBreakdownAttributeName] = useState('');
  const [selectedAttributeKey, setSelectedAttributeKey] = useState(null);
  
  // Query for attribute breakdown (only when needed)
  const { data: breakdownQueryData, loading: breakdownLoading } = useQuery(
    GET_OBJECT_ATTRIBUTE_BREAKDOWN,
    {
      variables: { 
        objectId: object?.objectId,
        attributeName: selectedAttributeKey 
      },
      skip: !selectedAttributeKey || !object?.objectId,
      onCompleted: (data) => {
        if (data?.getObject?.attributeBreakdown) {
          setBreakdownData(data.getObject.attributeBreakdown);
          setShowBreakdown(true);
        }
      }
    }
  );
  
  if (!object) return null;
  
  const attributes = [
    { name: "Lethality", key: "lethality", data: object.lethality },
    { name: "Armour", key: "armour", data: object.armour },
    { name: "Endurance", key: "endurance", data: object.endurance },
    { name: "Strength", key: "strength", data: object.strength },
    { name: "Dexterity", key: "dexterity", data: object.dexterity },
    { name: "Agility", key: "agility", data: object.agility },
    { name: "Obscurity", key: "obscurity", data: object.obscurity },
    { name: "Charisma", key: "charisma", data: object.charisma },
    { name: "Intelligence", key: "intelligence", data: object.intelligence },
    { name: "Resolve", key: "resolve", data: object.resolve },
    { name: "Morale", key: "morale", data: object.morale }
  ].filter(attr => attr.data); // Only show attributes that have data

  // Get grouped attributes from backend
  const groupedAttributes = object.groupedAttributes || {};
  
  // Handler for showing breakdown
  const handleShowBreakdown = (attributeKey, attributeName) => {
    if (object && object.equipment && object.equipment.length > 0) {
      setBreakdownAttributeName(attributeName);
      setSelectedAttributeKey(attributeKey);
    }
  };

  if (attributes.length === 0) {
    return null; // Don't render anything if no attributes
  }

  // Helper function to get color style for grouped value
  const getGroupedValueStyle = (originalValue, groupedValue) => {
    if (groupedValue > originalValue) {
      return { color: '#28a745', fontWeight: 'bold' }; // Green for higher
    } else if (groupedValue < originalValue) {
      return { color: '#dc3545', fontWeight: 'bold' }; // Red for lower
    }
    return { fontWeight: 'bold' }; // Normal color for same
  };

  return (
    <>
      <div className="object-attributes">
        <h4>Attributes</h4>
        <div className="attributes-list">
          {attributes.map(attr => {
            const originalValue = attr.data.attributeValue;
            const groupedValue = groupedAttributes[attr.key];
            const hasGroupedValue = groupedValue !== undefined && groupedValue !== originalValue;
            const hasEquipment = object && object.equipment && object.equipment.length > 0;
            
            return (
              <div key={attr.name} className="detail-row">
                <span>{attr.name}:</span>
                <span>
                  {originalValue} 
                  <span 
                    className="grouping-indicator" 
                    title={attr.data.isGrouped ? 'This attribute participates in grouping' : 'This attribute does not participate in grouping'}
                    style={{ marginLeft: '6px', fontSize: '0.8em', opacity: 0.7 }}
                  >
                    {attr.data.isGrouped ? '☑️' : '❌'}
                  </span>
                  {hasGroupedValue && (
                    <span 
                      className="grouped-value" 
                      style={getGroupedValueStyle(originalValue, Math.round(groupedValue))}
                      title="Grouped value with equipment"
                    >
                      {' → '}{Math.round(groupedValue)}
                      {hasEquipment && (
                        <button
                          className="info-icon"
                          onClick={() => handleShowBreakdown(attr.key, attr.name)}
                          title="Show detailed breakdown"
                        >
                          ℹ️
                        </button>
                      )}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {showBreakdown && (
        <AttributeBreakdownPopup
          breakdown={breakdownData}
          attributeName={breakdownAttributeName}
          onClose={() => {
            setShowBreakdown(false);
            setSelectedAttributeKey(null);
          }}
        />
      )}
    </>
  );
};

export default ObjectAttributesBackend;