import React, { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { 
  LIST_ENCOUNTERS, 
  CREATE_ENCOUNTER, 
  DELETE_ENCOUNTER,
  ON_CREATE_ENCOUNTER,
  ON_DELETE_ENCOUNTER,
  ON_UPDATE_ENCOUNTER 
} from '../../graphql/operations';
import { FaPlus, FaTrash, FaEdit, FaSearch } from 'react-icons/fa';
import './EncountersList.css';

const EncountersList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [newEncounterName, setNewEncounterName] = useState('');
  const [newEncounterDescription, setNewEncounterDescription] = useState('');
  const [showNewEncounterForm, setShowNewEncounterForm] = useState(false);
  
  // Query for encounters
  const { loading, error, data, refetch } = useQuery(LIST_ENCOUNTERS, {
    variables: {
      filter: searchTerm ? { name: { contains: searchTerm } } : null
    }
  });
  
  // Mutations
  const [createEncounter] = useMutation(CREATE_ENCOUNTER);
  const [deleteEncounter] = useMutation(DELETE_ENCOUNTER);
  
  // Subscriptions
  useSubscription(ON_CREATE_ENCOUNTER, {
    onData: () => refetch()
  });
  
  useSubscription(ON_DELETE_ENCOUNTER, {
    onData: () => refetch()
  });
  
  useSubscription(ON_UPDATE_ENCOUNTER, {
    onData: () => refetch()
  });
  
  const handleCreateEncounter = async (e) => {
    e.preventDefault();
    if (!newEncounterName) return;
    
    try {
      await createEncounter({
        variables: {
          input: {
            name: newEncounterName,
            description: newEncounterDescription
          }
        }
      });
      
      setNewEncounterName('');
      setNewEncounterDescription('');
      setShowNewEncounterForm(false);
    } catch (err) {
      console.error('Error creating encounter:', err);
    }
  };
  
  const handleDeleteEncounter = async (encounterId) => {
    if (window.confirm('Are you sure you want to delete this encounter?')) {
      try {
        await deleteEncounter({
          variables: { encounterId }
        });
      } catch (err) {
        console.error('Error deleting encounter:', err);
      }
    }
  };
  
  const handleEditEncounter = (encounterId) => {
    navigate(`/encounters/${encounterId}/edit`);
  };
  
  const handleViewEncounter = (encounterId) => {
    navigate(`/encounters/${encounterId}`);
  };
  
  if (loading) return <p>Loading encounters...</p>;
  if (error) return <p>Error loading encounters: {error.message}</p>;
  
  const encounters = data?.listEncounters || [];
  
  return (
    <div className="encounters-list-container">
      <div className="encounters-header">
        <h1>Encounters</h1>
        <button 
          className="new-encounter-btn"
          onClick={() => setShowNewEncounterForm(!showNewEncounterForm)}
        >
          <FaPlus /> {showNewEncounterForm ? 'Cancel' : 'New Encounter'}
        </button>
      </div>
      
      {showNewEncounterForm && (
        <form className="new-encounter-form" onSubmit={handleCreateEncounter}>
          <input
            type="text"
            placeholder="Encounter Name"
            value={newEncounterName}
            onChange={(e) => setNewEncounterName(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={newEncounterDescription}
            onChange={(e) => setNewEncounterDescription(e.target.value)}
          />
          <button type="submit">Create Encounter</button>
        </form>
      )}
      
      <div className="search-bar">
        <FaSearch />
        <input
          type="text"
          placeholder="Search encounters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {encounters.length === 0 ? (
        <p className="no-encounters">No encounters found. Create one to get started!</p>
      ) : (
        <div className="encounters-grid">
          {encounters.map(encounter => (
            <div key={encounter.encounterId} className="encounter-card">
              <div className="encounter-card-header">
                <h3>{encounter.name}</h3>
                <div className="encounter-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEditEncounter(encounter.encounterId)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteEncounter(encounter.encounterId)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <p className="encounter-description">
                {encounter.description || 'No description provided'}
              </p>
              <div className="encounter-meta">
                <span>Current Time: {encounter.currentTime}s</span>
                <span>Created: {new Date(encounter.createdAt).toLocaleDateString()}</span>
              </div>
              <button 
                className="view-encounter-btn"
                onClick={() => handleViewEncounter(encounter.encounterId)}
              >
                Run Encounter
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EncountersList;
