import React, { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { LIST_ENCOUNTERS, CREATE_ENCOUNTER, DELETE_ENCOUNTER, ON_CREATE_ENCOUNTER, ON_DELETE_ENCOUNTER, ON_UPDATE_ENCOUNTER } from '../../graphql/operations';
import { FaPlus, FaTrash, FaEdit, FaSearch } from 'react-icons/fa';
import './EncountersList.css';
const EncountersList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [newEncounterName, setNewEncounterName] = useState('');
  const [newEncounterDescription, setNewEncounterDescription] = useState('');
  const [showNewEncounterForm, setShowNewEncounterForm] = useState(false);

  // Query for encounters
  const {
    loading,
    error,
    data,
    refetch
  } = useQuery(LIST_ENCOUNTERS, {
    variables: {
      filter: searchTerm ? {
        name: {
          contains: searchTerm
        }
      } : null
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
  const handleCreateEncounter = async e => {
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
  const handleDeleteEncounter = async encounterId => {
    if (window.confirm('Are you sure you want to delete this encounter?')) {
      try {
        await deleteEncounter({
          variables: {
            encounterId
          }
        });
      } catch (err) {
        console.error('Error deleting encounter:', err);
      }
    }
  };
  const handleEditEncounter = encounterId => {
    navigate(`/encounters/${encounterId}/edit`);
  };
  const handleViewEncounter = encounterId => {
    navigate(`/encounters/${encounterId}`);
  };
  if (loading) return /*#__PURE__*/React.createElement("p", null, "Loading encounters...");
  if (error) return /*#__PURE__*/React.createElement("p", null, "Error loading encounters: ", error.message);
  const encounters = data?.listEncounters || [];
  return /*#__PURE__*/React.createElement("div", {
    className: "encounters-list-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "encounters-header"
  }, /*#__PURE__*/React.createElement("h1", null, "Encounters"), /*#__PURE__*/React.createElement("button", {
    className: "new-encounter-btn",
    onClick: () => setShowNewEncounterForm(!showNewEncounterForm)
  }, /*#__PURE__*/React.createElement(FaPlus, null), " ", showNewEncounterForm ? 'Cancel' : 'New Encounter')), showNewEncounterForm && /*#__PURE__*/React.createElement("form", {
    className: "new-encounter-form",
    onSubmit: handleCreateEncounter
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Encounter Name",
    value: newEncounterName,
    onChange: e => setNewEncounterName(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement("textarea", {
    placeholder: "Description (optional)",
    value: newEncounterDescription,
    onChange: e => setNewEncounterDescription(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit"
  }, "Create Encounter")), /*#__PURE__*/React.createElement("div", {
    className: "search-bar"
  }, /*#__PURE__*/React.createElement(FaSearch, null), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search encounters...",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value)
  })), encounters.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "no-encounters"
  }, "No encounters found. Create one to get started!") : /*#__PURE__*/React.createElement("div", {
    className: "encounters-grid"
  }, encounters.map(encounter => /*#__PURE__*/React.createElement("div", {
    key: encounter.encounterId,
    className: "encounter-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "encounter-card-header"
  }, /*#__PURE__*/React.createElement("h3", null, encounter.name), /*#__PURE__*/React.createElement("div", {
    className: "encounter-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "edit-btn",
    onClick: () => handleEditEncounter(encounter.encounterId)
  }, /*#__PURE__*/React.createElement(FaEdit, null)), /*#__PURE__*/React.createElement("button", {
    className: "delete-btn",
    onClick: () => handleDeleteEncounter(encounter.encounterId)
  }, /*#__PURE__*/React.createElement(FaTrash, null)))), /*#__PURE__*/React.createElement("p", {
    className: "encounter-description"
  }, encounter.description || 'No description provided'), /*#__PURE__*/React.createElement("div", {
    className: "encounter-meta"
  }, /*#__PURE__*/React.createElement("span", null, "Round: ", encounter.round, ", Initiative: ", encounter.initiative), /*#__PURE__*/React.createElement("span", null, "Created: ", encounter.createdAt ? new Date(encounter.createdAt).toLocaleDateString() : 'Unknown')), /*#__PURE__*/React.createElement("button", {
    className: "view-encounter-btn",
    onClick: () => handleViewEncounter(encounter.encounterId)
  }, "Run Encounter")))));
};
export default EncountersList;