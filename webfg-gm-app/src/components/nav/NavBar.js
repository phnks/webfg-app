import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useSubscription } from '@apollo/client';
import { FaBars, FaTimes, FaUser, FaCube, FaBolt, FaHome, FaChessBoard } from 'react-icons/fa';
import { 
  ON_CREATE_CHARACTER, ON_UPDATE_ACTION, ON_DELETE_CHARACTER,
  ON_CREATE_OBJECT, ON_UPDATE_OBJECT, ON_DELETE_OBJECT,
  ON_CREATE_ACTION, ON_UPDATE_ACTION, ON_DELETE_ACTION,
  ON_CREATE_ENCOUNTER, ON_UPDATE_ENCOUNTER, ON_DELETE_ENCOUNTER,
  LIST_ENCOUNTERS
} from '../../graphql/operations';
import './NavBar.css';

const NavBar = ({ characterList = [], objectList = [], actionList = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Maintain local state for lists that includes subscription updates
  const [characters, setCharacters] = useState(characterList);
  const [objects, setObjects] = useState(objectList);
  const [actions, setActions] = useState(actionList);
  const [encounters, setEncounters] = useState([]);
  
  // Track deleted items to prevent them showing up
  const deletedItemIds = useRef({
    characters: new Set(),
    objects: new Set(),
    actions: new Set(),
    encounters: new Set()
  });

  // Fetch encounters
  const { data: encounterData } = useQuery(LIST_ENCOUNTERS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data && data.listEncounters) {
        setEncounters(data.listEncounters.filter(
          encounter => !deletedItemIds.current.encounters.has(encounter.encounterId)
        ));
      }
    }
  });

  // Update local state when props change
  useEffect(() => {
    if (characterList && characterList.length > 0) {
      setCharacters(prev => {
        // Filter out deleted characters
        const filtered = characterList.filter(
          char => !deletedItemIds.current.characters.has(char.characterId)
        );
        return filtered;
      });
    }
  }, [characterList]);

  useEffect(() => {
    if (objectList && objectList.length > 0) {
      setObjects(prev => {
        // Filter out deleted objects
        const filtered = objectList.filter(
          obj => !deletedItemIds.current.objects.has(obj.objectId)
        );
        return filtered;
      });
    }
  }, [objectList]);

  useEffect(() => {
    if (actionList && actionList.length > 0) {
      setActions(prev => {
        // Filter out deleted actions
        const filtered = actionList.filter(
          action => !deletedItemIds.current.actions.has(action.actionId)
        );
        return filtered;
      });
    }
  }, [actionList]);

  // Determine active section based on URL
  useEffect(() => {
    if (location.pathname.includes('/characters')) {
      setActiveSection('characters');
    } else if (location.pathname.includes('/objects')) {
      setActiveSection('objects');
    } else if (location.pathname.includes('/actions')) {
      setActiveSection('actions');
    } else if (location.pathname.includes('/encounters')) {
      setActiveSection('encounters');
    } else {
      setActiveSection('');
    }
  }, [location]);

  // Character subscriptions
  useSubscription(ON_CREATE_CHARACTER, {
    onData: ({ data }) => {
      const newCharacter = data.data.onCreateCharacter;
      setCharacters(prev => {
        // Prevent adding characters that were marked as deleted
        if (deletedItemIds.current.characters.has(newCharacter.characterId)) {
          return prev;
        }
        
        // Check if character already exists to avoid duplicates
        if (!prev.some(char => char.characterId === newCharacter.characterId)) {
          return [...prev, newCharacter];
        }
        return prev;
      });
    }
  });
  
  useSubscription(ON_UPDATE_ACTION, {
    onData: ({ data }) => {
      const updatedCharacter = data.data.onUpdateCharacter;
      
      // Don't update if character was deleted
      if (deletedItemIds.current.characters.has(updatedCharacter.characterId)) {
        return;
      }
      
      setCharacters(prev => 
        prev.map(char => 
          char.characterId === updatedCharacter.characterId 
            ? updatedCharacter 
            : char
        )
      );
    }
  });
  
  useSubscription(ON_DELETE_CHARACTER, {
    onData: ({ data }) => {
      const deletedCharacter = data.data.onDeleteCharacter;
      
      // Mark character as deleted
      deletedItemIds.current.characters.add(deletedCharacter.characterId);
      
      setCharacters(prev => 
        prev.filter(char => char.characterId !== deletedCharacter.characterId)
      );
    }
  });

  // Object subscriptions
  useSubscription(ON_CREATE_OBJECT, {
    onData: ({ data }) => {
      const newObject = data.data.onCreateObject;
      
      // Don't add if it was deleted
      if (deletedItemIds.current.objects.has(newObject.objectId)) {
        return;
      }
      
      setObjects(prev => {
        // Check if object already exists to avoid duplicates
        if (!prev.some(obj => obj.objectId === newObject.objectId)) {
          return [...prev, newObject];
        }
        return prev;
      });
    }
  });
  
  useSubscription(ON_UPDATE_OBJECT, {
    onData: ({ data }) => {
      const updatedObject = data.data.onUpdateObject;
      
      // Don't update if object was deleted
      if (deletedItemIds.current.objects.has(updatedObject.objectId)) {
        return;
      }
      
      setObjects(prev => 
        prev.map(obj => 
          obj.objectId === updatedObject.objectId 
            ? updatedObject 
            : obj
        )
      );
    }
  });
  
  useSubscription(ON_DELETE_OBJECT, {
    onData: ({ data }) => {
      const deletedObject = data.data.onDeleteObject;
      
      // Mark object as deleted
      deletedItemIds.current.objects.add(deletedObject.objectId);
      
      setObjects(prev => 
        prev.filter(obj => obj.objectId !== deletedObject.objectId)
      );
    }
  });

  // Action subscriptions
  useSubscription(ON_CREATE_ACTION, {
    onData: ({ data }) => {
      const newAction = data.data.onCreateAction;
      
      // Don't add if it was deleted
      if (deletedItemIds.current.actions.has(newAction.actionId)) {
        return;
      }
      
      setActions(prev => {
        // Check if action already exists to avoid duplicates
        if (!prev.some(action => action.actionId === newAction.actionId)) {
          return [...prev, newAction];
        }
        return prev;
      });
    }
  });
  
  useSubscription(ON_UPDATE_ACTION, {
    onData: ({ data }) => {
      const updatedAction = data.data.onUpdateAction;
      
      // Don't update if action was deleted
      if (deletedItemIds.current.actions.has(updatedAction.actionId)) {
        return;
      }
      
      setActions(prev => 
        prev.map(action => 
          action.actionId === updatedAction.actionId 
            ? updatedAction 
            : action
        )
      );
    }
  });
  
  useSubscription(ON_DELETE_ACTION, {
    onData: ({ data }) => {
      const deletedAction = data.data.onDeleteAction;
      
      // Mark action as deleted
      deletedItemIds.current.actions.add(deletedAction.actionId);
      
      setActions(prev => 
        prev.filter(action => action.actionId !== deletedAction.actionId)
      );
    }
  });

  // Add subscriptions for encounters
  useSubscription(ON_CREATE_ENCOUNTER, {
    onData: ({ data }) => {
      const newEncounter = data.data.onCreateEncounter;
      setEncounters(prev => {
        // Prevent adding encounters that were marked as deleted
        if (deletedItemIds.current.encounters.has(newEncounter.encounterId)) {
          return prev;
        }
        
        // Check if encounter already exists to avoid duplicates
        if (!prev.some(enc => enc.encounterId === newEncounter.encounterId)) {
          return [...prev, newEncounter];
        }
        return prev;
      });
    }
  });
  
  useSubscription(ON_UPDATE_ENCOUNTER, {
    onData: ({ data }) => {
      const updatedEncounter = data.data.onUpdateEncounter;
      
      // Don't update if encounter was deleted
      if (deletedItemIds.current.encounters.has(updatedEncounter.encounterId)) {
        return;
      }
      
      setEncounters(prev => 
        prev.map(enc => 
          enc.encounterId === updatedEncounter.encounterId 
            ? updatedEncounter 
            : enc
        )
      );
    }
  });
  
  useSubscription(ON_DELETE_ENCOUNTER, {
    onData: ({ data }) => {
      const deletedId = data.data.onDeleteEncounter.encounterId;
      deletedItemIds.current.encounters.add(deletedId);
      setEncounters(prev => prev.filter(enc => enc.encounterId !== deletedId));
    }
  });

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };
  
  const handleNewItem = () => {
    closeMenu();
    switch(activeSection) {
      case 'characters':
        navigate('/characters/new');
        break;
      case 'objects':
        navigate('/objects/new');
        break;
      case 'actions':
        navigate('/actions/new');
        break;
      case 'encounters':
        navigate('/encounters'); // Redirects to encounters list with create form
        break;
      default:
        break;
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="menu-toggle" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>
        <NavLink to="/" className="logo" onClick={closeMenu}>WEBFG GM</NavLink>
      </nav>
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <ul className="section-tabs">
          <li className={activeSection === 'characters' ? 'active' : ''}>
            <NavLink to="/characters" onClick={() => setActiveSection('characters')}>
              <FaUser />
              <span>Characters</span>
            </NavLink>
          </li>
          <li className={activeSection === 'objects' ? 'active' : ''}>
            <NavLink to="/objects" onClick={() => setActiveSection('objects')}>
              <FaCube />
              <span>Objects</span>
            </NavLink>
          </li>
          <li className={activeSection === 'actions' ? 'active' : ''}>
            <NavLink to="/actions" onClick={() => setActiveSection('actions')}>
              <FaBolt />
              <span>Actions</span>
            </NavLink>
          </li>
          <li className={activeSection === 'encounters' ? 'active' : ''}>
            <NavLink to="/encounters" onClick={() => setActiveSection('encounters')}>
              <FaChessBoard />
              <span>Encounters</span>
            </NavLink>
          </li>
        </ul>
        
        {activeSection && (
          <div className="section-list">
            <div className="section-header">
              <h3>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h3>
              <button className="add-btn" onClick={handleNewItem}>+ New</button>
            </div>
            
            {activeSection === 'characters' && (
              <ul className="item-list">
                {characters.length > 0 ? characters.map(char => (
                  <li key={char.characterId}>
                    <NavLink 
                      to={`/characters/${char.characterId}`} 
                      onClick={closeMenu}
                      className={({ isActive }) => isActive ? 'active' : ''}
                    >
                      <div className="item-name">{char.name}</div>
                      {char.race && <div className="item-meta">{char.race}</div>}
                    </NavLink>
                  </li>
                )) : (
                  <li className="empty-message">No characters available</li>
                )}
              </ul>
            )}
            
            {activeSection === 'objects' && (
              <ul className="item-list">
                {objects.length > 0 ? objects.map(obj => (
                  <li key={obj.objectId}>
                    <NavLink 
                      to={`/objects/${obj.objectId}`} 
                      onClick={closeMenu}
                      className={({ isActive }) => isActive ? 'active' : ''}
                    >
                      <div className="item-name">{obj.name}</div>
                      {obj.type && <div className="item-meta">{obj.type}</div>}
                    </NavLink>
                  </li>
                )) : (
                  <li className="empty-message">No objects available</li>
                )}
              </ul>
            )}
            
            {activeSection === 'actions' && (
              <ul className="item-list">
                {actions.length > 0 ? actions.map(action => (
                  <li key={action.actionId}>
                    <NavLink 
                      to={`/actions/${action.actionId}`} 
                      onClick={closeMenu}
                      className={({ isActive }) => isActive ? 'active' : ''}
                    >
                      <div className="item-name">{action.name}</div>
                      {action.type && <div className="item-meta">{action.type}</div>}
                    </NavLink>
                  </li>
                )) : (
                  <li className="empty-message">No actions available</li>
                )}
              </ul>
            )}
            
            {activeSection === 'encounters' && (
              <ul className="item-list">
                {encounters.length > 0 ? encounters.map(encounter => (
                  <li key={encounter.encounterId}>
                    <NavLink 
                      to={`/encounters/${encounter.encounterId}`} 
                      onClick={closeMenu}
                      className={({ isActive }) => isActive ? 'active' : ''}
                    >
                      <div className="item-name">{encounter.name}</div>
                      <div className="item-meta">Time: {encounter.currentTime}s</div>
                    </NavLink>
                  </li>
                )) : (
                  <li className="empty-message">No encounters available</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
      
      {isOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
    </>
  );
};

export default NavBar; 