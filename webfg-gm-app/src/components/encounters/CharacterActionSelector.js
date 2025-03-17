import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CHARACTER } from '../../graphql/operations';
import './CharacterActionSelector.css';

const CharacterActionSelector = ({ characterId, onSelectAction, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { loading, error, data } = useQuery(GET_CHARACTER, {
    variables: { characterId },
    fetchPolicy: 'network-only'
  });
  
  if (loading) return <p>Loading character actions...</p>;
  if (error) return <p>Error loading character: {error.message}</p>;
  
  const character = data?.getCharacter;
  if (!character) return <p>Character not found</p>;
  
  const filteredActions = character.actions.filter(action => 
    action.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="character-action-selector">
      <div className="action-selector-header">
        <h3>Choose an action for {character.name}</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <input
        type="text"
        placeholder="Search actions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="action-search"
      />
      
      <div className="actions-list">
        {filteredActions.length === 0 ? (
          <p className="no-actions">No actions found</p>
        ) : (
          filteredActions.map(action => (
            <div 
              key={action.actionId} 
              className="action-item"
              onClick={() => onSelectAction(action.actionId)}
            >
              <div className="action-item-header">
                <h4>{action.name}</h4>
                <span className={`action-type ${action.type.toLowerCase()}`}>
                  {action.type}
                </span>
              </div>
              <p className="action-description">{action.description || 'No description'}</p>
              <div className="action-timing">
                <span>Initiative: {action.timing?.initiative || 'N/A'}</span>
                <span>Duration: {action.timing?.duration || 'N/A'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CharacterActionSelector; 