import React, { useEffect } from 'react'; // Keep useEffect import
// Added useNavigate import
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'; 
import { useQuery } from '@apollo/client';
import { LIST_CHARACTERS, LIST_OBJECTS, LIST_ACTIONS, LIST_CONDITIONS } from './graphql/operations';
import NavBar from './components/nav/NavBar';
import CharacterList from './components/characters/CharacterList';
import CharacterView from './components/characters/CharacterView';
import CharacterEdit from './components/characters/CharacterEdit';
import CharacterForm from './components/forms/CharacterForm';
import ObjectList from './components/objects/ObjectList';
import ObjectView from './components/objects/ObjectView';
import ObjectEdit from './components/objects/ObjectEdit';
import ObjectForm from './components/forms/ObjectForm';
import ActionList from './components/actions/ActionList';
import ActionView from './components/actions/ActionView';
import ActionEdit from './components/actions/ActionEdit';
import ActionForm from './components/forms/ActionForm';
import ConditionsList from './components/conditions/ConditionsList';
import ConditionView from './components/conditions/ConditionView';
import ConditionEdit from './components/conditions/ConditionEdit';
import ConditionForm from './components/forms/ConditionForm';
import Home from './components/Home';
import { SelectedCharacterProvider, useSelectedCharacter } from './context/SelectedCharacterContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import SelectedCharacterBanner from './components/common/SelectedCharacterBanner';
import EncountersList from './components/encounters/EncountersList';
import EncounterDetail from './components/encounters/EncounterDetail';
import './App.css';

function AppContent() {
  const navigate = useNavigate(); // Use navigate hook
  // Fetch the data for the navbar lists
  const { data: characterData } = useQuery(LIST_CHARACTERS);
  // Corrected useQuery for objects: restore default fetchPolicy, keep error handling
  const { data: objectData, error: objectError } = useQuery(LIST_OBJECTS); 
  const { data: actionData } = useQuery(LIST_ACTIONS);
  const { data: conditionData } = useQuery(LIST_CONDITIONS);
  const { selectedCharacter } = useSelectedCharacter();

  // Correctly formatted logging for NavBar object data/error
  useEffect(() => {
    // Keep logs commented out unless active debugging is needed
    // if (objectData) {
    //   console.log("App.js NavBar objectData:", JSON.stringify(objectData, null, 2));
    // }
    if (objectError) {
      // Log errors encountered when fetching data for NavBar
      console.error("App.js NavBar objectError fetching LIST_OBJECTS:");
      console.dir(objectError);
    }
  }, [objectData, objectError]);

  return (
    // Removed Router from here, should wrap App in index.js if not already
    // <Router> 
      <div className="app">
        <NavBar 
          characterList={characterData?.listCharacters || []}
          objectList={objectData?.listObjects || []} // Pass potentially null/error data; NavBar handles empty list
          actionList={actionData?.listActions || []}
          conditionList={conditionData?.listConditions || []}
        />
        <SelectedCharacterBanner />
        <div className={`content ${selectedCharacter ? 'with-banner' : ''}`}>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Character routes */}
            <Route path="/characters" element={<CharacterList />} />
            {/* Use navigate in onSuccess */}
            <Route path="/characters/new" element={<CharacterForm onSuccess={(id) => navigate(`/characters/${id}`)} />} /> 
            <Route path="/characters/:characterId" element={<CharacterView />} />
            <Route path="/characters/:characterId/edit" element={<CharacterEdit />} />

            {/* Object routes */}
            <Route path="/objects" element={<ObjectList />} />
             {/* Use navigate in onSuccess */}
            <Route path="/objects/new" element={<ObjectForm onSuccess={(id) => navigate(`/objects/${id}`)} />} />
            <Route path="/objects/:objectId" element={<ObjectView />} />
            <Route path="/objects/:objectId/edit" element={<ObjectEdit />} />

            {/* Action routes */}
            <Route path="/actions" element={<ActionList />} />
             {/* Use navigate in onSuccess */}
            <Route path="/actions/new" element={<ActionForm onSuccess={(id) => navigate(`/actions/${id}`)} />} />
            <Route path="/actions/:actionId" element={<ActionView />} />
            <Route path="/actions/:actionId/edit" element={<ActionEdit />} />

            {/* Condition routes */}
            <Route path="/conditions" element={<ConditionsList />} />
             {/* Use navigate in onSuccess */}
            <Route path="/conditions/new" element={<ConditionForm onSuccess={(id) => navigate(`/conditions/${id}`)} />} />
            <Route path="/conditions/:conditionId" element={<ConditionView />} />
            <Route path="/conditions/:conditionId/edit" element={<ConditionEdit />} />

            {/* Encounter routes */}
            <Route path="/encounters" element={<EncountersList />} />
            <Route path="/encounters/:encounterId" element={<EncounterDetail />} />
          </Routes>
        </div>
      </div>
    // </Router>
  );
}


function App() {
  return (
    // Router should wrap the Provider and AppContent
    <Router> 
      <RecentlyViewedProvider>
        <SelectedCharacterProvider>
          <AppContent /> 
        </SelectedCharacterProvider>
      </RecentlyViewedProvider>
    </Router>
  );
}


export default App;
