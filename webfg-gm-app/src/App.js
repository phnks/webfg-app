import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { LIST_CHARACTERS, LIST_OBJECTS, LIST_ACTIONS } from './graphql/operations';
import NavBar from './components/nav/NavBar';
import CharacterList from './components/characters/CharacterList';
import CharacterView from './components/characters/CharacterView';
import CharacterForm from './components/forms/CharacterForm';
import ObjectList from './components/objects/ObjectList';
import ObjectView from './components/objects/ObjectView';
import ObjectForm from './components/forms/ObjectForm';
import ActionList from './components/actions/ActionList';
import ActionView from './components/actions/ActionView';
import ActionForm from './components/forms/ActionForm';
import Home from './components/Home';
import { SelectedCharacterProvider, useSelectedCharacter } from './context/SelectedCharacterContext';
import SelectedCharacterBanner from './components/common/SelectedCharacterBanner';
import './App.css';

function AppContent() {
  // Fetch the data for the navbar lists
  const { data: characterData } = useQuery(LIST_CHARACTERS);
  const { data: objectData } = useQuery(LIST_OBJECTS);
  const { data: actionData } = useQuery(LIST_ACTIONS);
  const { selectedCharacter } = useSelectedCharacter();

  return (
    <Router>
      <div className="app">
        <NavBar 
          characterList={characterData?.listCharacters || []}
          objectList={objectData?.listObjects || []}
          actionList={actionData?.listActions || []}
        />
        <SelectedCharacterBanner />
        <div className={`content ${selectedCharacter ? 'with-banner' : ''}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Character routes */}
            <Route path="/characters" element={<CharacterList />} />
            <Route path="/characters/new" element={<CharacterForm onSuccess={(id) => window.location.href = `/characters/${id}`} />} />
            <Route path="/characters/:characterId" element={<CharacterView />} />
            
            {/* Object routes */}
            <Route path="/objects" element={<ObjectList />} />
            <Route path="/objects/new" element={<ObjectForm onSuccess={(id) => window.location.href = `/objects/${id}`} />} />
            <Route path="/objects/:objectId" element={<ObjectView />} />
            
            {/* Action routes */}
            <Route path="/actions" element={<ActionList />} />
            <Route path="/actions/new" element={<ActionForm onSuccess={(id) => window.location.href = `/actions/${id}`} />} />
            <Route path="/actions/:actionId" element={<ActionView />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <SelectedCharacterProvider>
      <AppContent />
    </SelectedCharacterProvider>
  );
}

export default App;
