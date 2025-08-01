// Export all shared components

// Components
export { default as Home } from './components/Home';

// Actions
export { default as ActionEdit } from './components/actions/ActionEdit';
export { default as ActionList } from './components/actions/ActionList';
export { default as ActionView } from './components/actions/ActionView';

// Characters
export { default as CharacterAttributesBackend } from './components/characters/CharacterAttributesBackend';
export { default as CharacterDetails } from './components/characters/CharacterDetails';
export { default as CharacterEdit } from './components/characters/CharacterEdit';
export { default as CharacterEquipment } from './components/characters/CharacterEquipment';
export { default as CharacterList } from './components/characters/CharacterList';
export { default as CharacterPhysical } from './components/characters/CharacterPhysical';
export { default as CharacterSkills } from './components/characters/CharacterSkills';
export { default as CharacterStats } from './components/characters/CharacterStats';
export { default as CharacterView } from './components/characters/CharacterView';
export { default as EquipmentManager } from './components/characters/EquipmentManager';

// Common
export { default as AttributeBreakdownPopup } from './components/common/AttributeBreakdownPopup';
export { default as AttributeGroups } from './components/common/AttributeGroups';
export { default as ErrorPopup } from './components/common/ErrorPopup';
export { default as InventoryMoveModal } from './components/common/InventoryMoveModal';
export { default as InventoryQuantityModal } from './components/common/InventoryQuantityModal';
export { default as MobileNumberInput } from './components/common/MobileNumberInput';
export { default as PaginationControls } from './components/common/PaginationControls';
export { default as QuickAdjustPopup } from './components/common/QuickAdjustPopup';
export { default as QuickAdjustWidget } from './components/common/QuickAdjustWidget';
export { default as SearchFilterSort } from './components/common/SearchFilterSort';
export { default as SelectedCharacterBanner } from './components/common/SelectedCharacterBanner';
export { default as TabNavigation } from './components/common/TabNavigation';
export { default as ThoughtAttributesModal } from './components/common/ThoughtAttributesModal';

// Conditions
export { default as ConditionEdit } from './components/conditions/ConditionEdit';
export { default as ConditionView } from './components/conditions/ConditionView';
export { default as ConditionsList } from './components/conditions/ConditionsList';

// Encounters
export { default as CharacterActionSelector } from './components/encounters/CharacterActionSelector';
export { default as CharacterSummary } from './components/encounters/CharacterSummary';
export { default as EncounterDetail } from './components/encounters/EncounterDetail';
export { default as EncountersList } from './components/encounters/EncountersList';
export { default as Timeline } from './components/encounters/Timeline';
export { default as VirtualTableTop } from './components/encounters/VirtualTableTop';

// Forms
export { default as ActionForm } from './components/forms/ActionForm';
export { default as CharacterForm } from './components/forms/CharacterForm';
export { default as ConditionForm } from './components/forms/ConditionForm';
export { default as ObjectForm } from './components/forms/ObjectForm';
export { default as ThoughtForm } from './components/forms/ThoughtForm';

// Navigation
export { default as NavBar } from './components/nav/NavBar';

// Objects
export { default as ObjectAttributesBackend } from './components/objects/ObjectAttributesBackend';
export { default as ObjectEdit } from './components/objects/ObjectEdit';
export { default as ObjectList } from './components/objects/ObjectList';
export { default as ObjectView } from './components/objects/ObjectView';

// Thoughts
export { default as ThoughtEdit } from './components/thoughts/ThoughtEdit';
export { default as ThoughtList } from './components/thoughts/ThoughtList';
export { default as ThoughtView } from './components/thoughts/ThoughtView';

// Context
export { SelectedCharacterProvider, useSelectedCharacter } from './context/SelectedCharacterContext.jsx';
export { RecentlyViewedProvider } from './context/RecentlyViewedContext.jsx';

// Utils
export * from './utils/diceMapping';