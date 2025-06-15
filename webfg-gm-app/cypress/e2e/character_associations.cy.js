describe('Character Associations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  function navigateToCharacters() {
    cy.get('[data-cy="menu-toggle"]').click();
    cy.get('[data-cy="nav-characters"]').click();
    cy.get('[data-cy="menu-toggle"]').click();
  }

  it('should add objects to character', () => {
    navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Navigate to Objects section
    cy.get('[data-cy="character-objects-section"]').should('exist');
    
    // Click add object button
    cy.get('[data-cy="add-object-button"]').click();
    
    // Should show object selection modal
    cy.get('[data-cy="object-selection-modal"]').should('be.visible');
    
    // Select Longsword
    cy.contains('[data-cy="object-select-item"]', 'Longsword').click();
    cy.get('[data-cy="confirm-add-object"]').click();
    
    // Verify object was added to stash
    cy.get('[data-cy="character-stash"]').should('contain', 'Longsword');
    
    // Add more objects
    cy.get('[data-cy="add-object-button"]').click();
    cy.contains('[data-cy="object-select-item"]', 'Chainmail').click();
    cy.get('[data-cy="confirm-add-object"]').click();
    
    cy.get('[data-cy="add-object-button"]').click();
    cy.contains('[data-cy="object-select-item"]', 'Tower Shield').click();
    cy.get('[data-cy="confirm-add-object"]').click();
    
    cy.get('[data-cy="add-object-button"]').click();
    cy.contains('[data-cy="object-select-item"]', 'Healing Potion').click();
    cy.get('[data-cy="confirm-add-object"]').click();
    
    // Verify all objects in stash
    cy.get('[data-cy="character-stash"]').should('contain', 'Longsword');
    cy.get('[data-cy="character-stash"]').should('contain', 'Chainmail');
    cy.get('[data-cy="character-stash"]').should('contain', 'Tower Shield');
    cy.get('[data-cy="character-stash"]').should('contain', 'Healing Potion');
  });

  it('should add actions to character', () => {
    navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Navigate to Actions section
    cy.get('[data-cy="character-actions-section"]').should('exist');
    
    // Click add action button
    cy.get('[data-cy="add-action-button"]').click();
    
    // Should show action selection modal
    cy.get('[data-cy="action-selection-modal"]').should('be.visible');
    
    // Select Hit action
    cy.contains('[data-cy="action-select-item"]', 'Hit').click();
    cy.get('[data-cy="confirm-add-action"]').click();
    
    // Verify action was added
    cy.get('[data-cy="character-actions-list"]').should('contain', 'Hit');
    
    // Verify action chain is displayed
    cy.get('[data-cy="character-actions-list"]').should('contain', 'Hit → Break → Kill');
    
    // Add another action
    cy.get('[data-cy="add-action-button"]').click();
    cy.contains('[data-cy="action-select-item"]', 'Break').click();
    cy.get('[data-cy="confirm-add-action"]').click();
    
    // Verify both actions are listed
    cy.get('[data-cy="character-actions-list"]').should('contain', 'Hit');
    cy.get('[data-cy="character-actions-list"]').should('contain', 'Break');
  });

  it('should add conditions to character', () => {
    navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Navigate to Conditions section
    cy.get('[data-cy="character-conditions-section"]').should('exist');
    
    // Click add condition button
    cy.get('[data-cy="add-condition-button"]').click();
    
    // Should show condition selection modal
    cy.get('[data-cy="condition-selection-modal"]').should('be.visible');
    
    // Select Grapple condition
    cy.contains('[data-cy="condition-select-item"]', 'Grapple').click();
    cy.get('[data-cy="confirm-add-condition"]').click();
    
    // Verify condition was added
    cy.get('[data-cy="character-conditions-list"]').should('contain', 'Grapple');
    cy.get('[data-cy="character-conditions-list"]').should('contain', 'Hinders agility by 5');
    
    // Add helpful condition
    cy.get('[data-cy="add-condition-button"]').click();
    cy.contains('[data-cy="condition-select-item"]', 'Aim').click();
    cy.get('[data-cy="confirm-add-condition"]').click();
    
    // Verify both conditions are listed
    cy.get('[data-cy="character-conditions-list"]').should('contain', 'Grapple');
    cy.get('[data-cy="character-conditions-list"]').should('contain', 'Aim');
    cy.get('[data-cy="character-conditions-list"]').should('contain', 'Helps dexterity by 3');
  });

  it('should remove objects from character', () => {
    navigateToCharacters();
    
    // Click on The Guy character (should have objects from previous test)
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Find Longsword in stash and remove it
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .find('[data-cy="remove-object-button"]')
      .click();
    
    // Confirm removal
    cy.get('[data-cy="confirm-remove-button"]').click();
    
    // Verify object was removed
    cy.get('[data-cy="character-stash"]').should('not.contain', 'Longsword');
  });

  it('should remove actions from character', () => {
    navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Find Hit action and remove it
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="remove-action-button"]')
      .click();
    
    // Confirm removal
    cy.get('[data-cy="confirm-remove-button"]').click();
    
    // Verify action was removed
    cy.get('[data-cy="character-actions-list"]').should('not.contain', 'Hit');
  });

  it('should remove conditions from character', () => {
    navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Find Grapple condition and remove it
    cy.get('[data-cy="character-conditions-list"]')
      .contains('[data-cy="condition-item"]', 'Grapple')
      .find('[data-cy="remove-condition-button"]')
      .click();
    
    // Confirm removal
    cy.get('[data-cy="confirm-remove-button"]').click();
    
    // Verify condition was removed
    cy.get('[data-cy="character-conditions-list"]').should('not.contain', 'Grapple');
  });

  it('should show object details from character view', () => {
    navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Click on an object to view details
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Chainmail')
      .click();
    
    // Should navigate to object view
    cy.url().should('include', '/objects/');
    cy.contains('h1', 'Chainmail').should('be.visible');
    
    // Navigate back to character
    cy.go('back');
    cy.url().should('include', '/characters/');
  });

  it('should prevent adding duplicate objects', () => {
    navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Try to add Chainmail again (already added)
    cy.get('[data-cy="add-object-button"]').click();
    
    // Chainmail should be disabled or marked as already added
    cy.get('[data-cy="object-selection-modal"]')
      .contains('[data-cy="object-select-item"]', 'Chainmail')
      .should('have.class', 'disabled')
      .or('contain', 'Already added');
    
    // Close modal
    cy.get('[data-cy="cancel-button"]').click();
  });

  it('should handle associations for multiple characters', () => {
    navigateToCharacters();
    
    // Add object to Commoner
    cy.contains('[data-cy="character-list-item"]', 'Commoner').click();
    cy.get('[data-cy="add-object-button"]').click();
    cy.contains('[data-cy="object-select-item"]', 'Healing Potion').click();
    cy.get('[data-cy="confirm-add-object"]').click();
    cy.get('[data-cy="character-stash"]').should('contain', 'Healing Potion');
    
    navigateToCharacters();
    
    // Add different objects to Anum
    cy.contains('[data-cy="character-list-item"]', 'Anum').click();
    cy.get('[data-cy="add-object-button"]').click();
    cy.contains('[data-cy="object-select-item"]', 'Longsword').click();
    cy.get('[data-cy="confirm-add-object"]').click();
    
    // Add condition to Anum
    cy.get('[data-cy="add-condition-button"]').click();
    cy.contains('[data-cy="condition-select-item"]', 'Blessed').click();
    cy.get('[data-cy="confirm-add-condition"]').click();
    
    // Verify associations
    cy.get('[data-cy="character-stash"]').should('contain', 'Longsword');
    cy.get('[data-cy="character-conditions-list"]').should('contain', 'Blessed');
  });
});