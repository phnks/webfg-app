// Export all shared components

// Components
export { default as Home } from './components/Home.js';

// Actions
export { default as ActionEdit } from './components/actions/ActionEdit.js';
export { default as ActionList } from './components/actions/ActionList.js';
export { default as ActionView } from './components/actions/ActionView.js';

// Characters
export { default as CharacterAttributesBackend } from './components/characters/CharacterAttributesBackend.js';
export { default as CharacterDetails } from './components/characters/CharacterDetails.js';
export { default as CharacterEdit } from './components/characters/CharacterEdit.js';
export { default as CharacterEquipment } from './components/characters/CharacterEquipment.js';
export { default as CharacterList } from './components/characters/CharacterList.js';
export { default as CharacterPhysical } from './components/characters/CharacterPhysical.js';
export { default as CharacterSkills } from './components/characters/CharacterSkills.js';
export { default as CharacterStats } from './components/characters/CharacterStats.js';
export { default as CharacterView } from './components/characters/CharacterView.js';
export { default as EquipmentManager } from './components/characters/EquipmentManager.js';

// Common
export { default as AttributeBreakdownPopup } from './components/common/AttributeBreakdownPopup.js';
export { default as AttributeGroups } from './components/common/AttributeGroups.js';
export { default as ErrorPopup } from './components/common/ErrorPopup.js';
export { default as InventoryMoveModal } from './components/common/InventoryMoveModal.js';
export { default as InventoryQuantityModal } from './components/common/InventoryQuantityModal.js';
export { default as MobileNumberInput } from './components/common/MobileNumberInput.js';
export { default as PaginationControls } from './components/common/PaginationControls.js';
export { default as QuickAdjustPopup } from './components/common/QuickAdjustPopup.js';
export { default as QuickAdjustWidget } from './components/common/QuickAdjustWidget.js';
export { default as SearchFilterSort } from './components/common/SearchFilterSort.js';
export { default as SelectedCharacterBanner } from './components/common/SelectedCharacterBanner.js';
export { default as TabNavigation } from './components/common/TabNavigation.js';
export { default as ThoughtAttributesModal } from './components/common/ThoughtAttributesModal.js';

// Conditions
export { default as ConditionEdit } from './components/conditions/ConditionEdit.js';
export { default as ConditionView } from './components/conditions/ConditionView.js';
export { default as ConditionsList } from './components/conditions/ConditionsList.js';

// Encounters
export { default as CharacterActionSelector } from './components/encounters/CharacterActionSelector.js';
export { default as CharacterSummary } from './components/encounters/CharacterSummary.js';
export { default as EncounterDetail } from './components/encounters/EncounterDetail.js';
export { default as EncountersList } from './components/encounters/EncountersList.js';
export { default as Timeline } from './components/encounters/Timeline.js';
export { default as VirtualTableTop } from './components/encounters/VirtualTableTop.js';

// Forms
export { default as ActionForm } from './components/forms/ActionForm.js';
export { default as CharacterForm } from './components/forms/CharacterForm.js';
export { default as ConditionForm } from './components/forms/ConditionForm.js';
export { default as ObjectForm } from './components/forms/ObjectForm.js';
export { default as ThoughtForm } from './components/forms/ThoughtForm.js';

// Navigation
export { default as NavBar } from './components/nav/NavBar.js';

// Objects
export { default as ObjectAttributesBackend } from './components/objects/ObjectAttributesBackend.js';
export { default as ObjectEdit } from './components/objects/ObjectEdit.js';
export { default as ObjectList } from './components/objects/ObjectList.js';
export { default as ObjectView } from './components/objects/ObjectView.js';

// Thoughts
export { default as ThoughtEdit } from './components/thoughts/ThoughtEdit.js';
export { default as ThoughtList } from './components/thoughts/ThoughtList.js';
export { default as ThoughtView } from './components/thoughts/ThoughtView.js';

// Context
export { SelectedCharacterProvider, useSelectedCharacter } from './context/SelectedCharacterContext.js';
export { RecentlyViewedProvider } from './context/RecentlyViewedContext.js';

// Utils
export * from './utils/diceMapping';

// GraphQL operations
export * from './graphql/operations';
export * from './graphql/computedOperations';