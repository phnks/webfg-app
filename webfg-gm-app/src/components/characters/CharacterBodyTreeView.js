import React, { useState, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_OBJECT } from '../../graphql/operations'; // Assuming GET_OBJECT can fetch parts if needed, or we use a dedicated parts resolver
import './CharacterBodyTreeView.css'; // We'll create this CSS file later

// This is a simplified version of the resolveObjectParts query from ObjectView,
// adapted for use here. Ideally, this would be a shared hook or a more generic query.
// For now, we'll use GET_OBJECT and assume it can return 'parts' if they are resolved by the backend.
// If Object.parts resolver isn't automatically fetching nested parts,
// we'd need a dedicated query like RESOLVE_OBJECT_PARTS similar to ObjectView.
// For this initial implementation, we will use GET_OBJECT and rely on its 'parts' field.
// A more robust solution might involve a dedicated 'resolveCharacterBodyParts' query.

const PartItem = ({ partId, level }) => {
  const [loadPart, { data, loading, error }] = useLazyQuery(GET_OBJECT);
  const [isExpanded, setIsExpanded] = useState(false);
  const [objectData, setObjectData] = useState(null);

  useEffect(() => {
    if (partId) {
      loadPart({ variables: { objectId: partId } });
    }
  }, [partId, loadPart]);

  useEffect(() => {
    if (data && data.getObject) {
      setObjectData(data.getObject);
    }
  }, [data]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (loading && !objectData) return <li style={{ marginLeft: `${level * 20}px` }} className="part-item loading">Loading part...</li>;
  if (error) return <li style={{ marginLeft: `${level * 20}px` }} className="part-item error">Error loading part: {error.message}</li>;
  if (!objectData) return null; // Or some placeholder

  return (
    <li style={{ marginLeft: `${level * 20}px` }} className="part-item">
      <div className="part-header" onClick={toggleExpand}>
        <span className={`arrow ${isExpanded ? 'expanded' : ''} ${objectData.partsIds && objectData.partsIds.length > 0 ? 'expandable' : 'not-expandable'}`}>
          {objectData.partsIds && objectData.partsIds.length > 0 ? (isExpanded ? '▼' : '►') : ''}
        </span>
        {objectData.name} <span className="part-category">({objectData.objectCategory})</span>
      </div>
      {isExpanded && objectData.partsIds && objectData.partsIds.length > 0 && (
        <ul className="nested-parts-list">
          {objectData.partsIds.map(subPartId => (
            <PartItem key={subPartId} partId={subPartId} level={level + 1} />
          ))}
        </ul>
      )}
      {/* If GET_OBJECT directly returns resolved 'parts' array */}
      {isExpanded && objectData.parts && objectData.parts.length > 0 && !objectData.partsIds && (
         <ul className="nested-parts-list">
          {objectData.parts.map(subPart => (
            // If subPart itself has partsIds, it needs to be a PartItem to be expandable
            // For now, assuming 'parts' are fully resolved objects but might not be further expandable in this simple model
             <PartItem key={subPart.objectId} partId={subPart.objectId} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

const CharacterBodyTreeView = ({ bodyObject }) => {
  if (!bodyObject) {
    return <p>No body object assigned to this character.</p>;
  }

  // The root object itself doesn't use PartItem to avoid an initial redundant fetch,
  // as bodyObject is already provided.
  const [isRootExpanded, setIsRootExpanded] = useState(true); // Start with root expanded

  const toggleRootExpand = () => {
    setIsRootExpanded(!isRootExpanded);
  };

  return (
    <div className="character-body-tree-view">
      <h4>Body: {bodyObject.name} ({bodyObject.objectCategory})</h4>
      {bodyObject.partsIds && bodyObject.partsIds.length > 0 ? (
        <ul className="body-parts-list">
           <li className="part-item root-part">
            <div className="part-header" onClick={toggleRootExpand}>
              <span className={`arrow ${isRootExpanded ? 'expanded' : ''} expandable`}>
                {isRootExpanded ? '▼' : '►'}
              </span>
              {bodyObject.name} <span className="part-category">({bodyObject.objectCategory})</span>
            </div>
            {isRootExpanded && (
              <ul className="nested-parts-list">
                {bodyObject.partsIds.map(partId => (
                  <PartItem key={partId} partId={partId} level={1} />
                ))}
              </ul>
            )}
          </li>
        </ul>
      ) : (
        <p style={{ marginLeft: '20px' }}>This body has no defined parts.</p>
      )}
    </div>
  );
};

export default CharacterBodyTreeView;
