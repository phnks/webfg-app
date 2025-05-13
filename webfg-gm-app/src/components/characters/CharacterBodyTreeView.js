import React, { useState, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_OBJECT } from '../../graphql/operations';
import './CharacterBodyTreeView.css';

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
  if (!objectData) return null;

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
      {isExpanded && objectData.parts && objectData.parts.length > 0 && !objectData.partsIds && (
         <ul className="nested-parts-list">
          {objectData.parts.map(subPart => (
             <PartItem key={subPart.objectId} partId={subPart.objectId} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

const CharacterBodyTreeView = ({ bodyObject }) => {
  // Moved useState hook BEFORE the conditional return
  const [isRootExpanded, setIsRootExpanded] = useState(true); 

  if (!bodyObject) {
    return <p>No body object assigned to this character.</p>;
  }

  const toggleRootExpand = () => {
    setIsRootExpanded(!isRootExpanded);
  };

  return (
    <div className="character-body-tree-view">
      {/* Removed redundant H4 title, handled by CharacterView */}
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
         // Display root object even if it has no parts initially
         <ul className="body-parts-list">
           <li className="part-item root-part">
            <div className="part-header"> 
              <span className="arrow not-expandable"></span> {/* Indicate not expandable */}
              {bodyObject.name} <span className="part-category">({bodyObject.objectCategory})</span>
            </div>
            <p style={{ marginLeft: '20px', fontStyle: 'italic', color: '#888' }}>This body has no defined parts.</p>
          </li>
        </ul>
      )}
    </div>
  );
};

export default CharacterBodyTreeView;
