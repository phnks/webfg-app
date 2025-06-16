describe('Character Associations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should add objects to character', () => {
    cy.navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('.character-card', 'The Guy').click();
    
    // Navigate to Objects section
    cy.contains('.character-sections h3', 'Objects').should('exist');
    
    // Click add object button
    cy.contains('button', 'Add Object').click();
    
    // Should show object selection modal or list
    cy.get('.modal').should('be.visible');
    
    // Select Longsword
    cy.contains('Longsword').click();
    cy.contains('button', 'Add').click();
    
    // Verify object was added to stash
    cy.get('.stash-section').should('contain', 'Longsword');
    
    // Add more objects
    cy.contains('button', 'Add Object').click();
    cy.contains('Chainmail').click();
    cy.contains('button', 'Add').click();
    
    cy.contains('button', 'Add Object').click();
    cy.contains('Tower Shield').click();
    cy.contains('button', 'Add').click();
    
    cy.contains('button', 'Add Object').click();
    cy.contains('Healing Potion').click();
    cy.contains('button', 'Add').click();
    
    // Verify all objects in stash
    cy.get('.stash-section').should('contain', 'Longsword');
    cy.get('.stash-section').should('contain', 'Chainmail');
    cy.get('.stash-section').should('contain', 'Tower Shield');
    cy.get('.stash-section').should('contain', 'Healing Potion');
  });

  it('should add actions to character', () => {
    cy.navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('.character-card', 'The Guy').click();
    
    // Navigate to Actions section
    cy.contains('.character-sections h3', 'Actions').should('exist');
    
    // Click add action button
    cy.contains('button', 'Add Action').click();
    
    // Should show action selection modal
    cy.get('.modal').should('be.visible');
    
    // Select Hit action
    cy.contains('Hit').click();
    cy.contains('button', 'Add').click();
    
    // Verify action was added
    cy.get('.actions-section').should('contain', 'Hit');
    
    // Verify action chain is displayed
    cy.get('.actions-section').should('contain', 'Hit → Break → Kill');
    
    // Add another action
    cy.contains('button', 'Add Action').click();
    cy.contains('Break').click();
    cy.contains('button', 'Add').click();
    
    // Verify both actions are listed
    cy.get('.actions-section').should('contain', 'Hit');
    cy.get('.actions-section').should('contain', 'Break');
  });

  it('should add conditions to character', () => {
    cy.navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('.character-card', 'The Guy').click();
    
    // Navigate to Conditions section
    cy.contains('.character-sections h3', 'Conditions').should('exist');
    
    // Click add condition button
    cy.contains('button', 'Add Condition').click();
    
    // Should show condition selection modal
    cy.get('.modal').should('be.visible');
    
    // Select Aim condition
    cy.contains('Aim').click();
    cy.contains('button', 'Add').click();
    
    // Verify condition was added
    cy.get('.conditions-section').should('contain', 'Aim');
    cy.get('.conditions-section').should('contain', '+3 dexterity');
    
    // Add another condition
    cy.contains('button', 'Add Condition').click();
    cy.contains('Grapple').click();
    cy.contains('button', 'Add').click();
    
    // Verify both conditions are listed
    cy.get('.conditions-section').should('contain', 'Aim');
    cy.get('.conditions-section').should('contain', 'Grapple');
  });

  it('should remove objects from character', () => {
    cy.navigateToCharacters();
    
    // First add an object
    cy.contains('.character-card', 'The Guy').click();
    cy.contains('button', 'Add Object').click();
    cy.contains('Longsword').click();
    cy.contains('button', 'Add').click();
    
    // Now remove it
    cy.get('.stash-section')
      .contains('.object-item', 'Longsword')
      .parent()
      .find('button:contains("Remove")')
      .click();
    
    // Confirm removal
    cy.on('window:confirm', () => true);
    
    // Verify object was removed
    cy.get('.stash-section').should('not.contain', 'Longsword');
  });

  it('should remove actions from character', () => {
    cy.navigateToCharacters();
    
    // First add an action
    cy.contains('.character-card', 'The Guy').click();
    cy.contains('button', 'Add Action').click();
    cy.contains('Hit').click();
    cy.contains('button', 'Add').click();
    
    // Now remove it
    cy.get('.actions-section')
      .contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Remove")')
      .click();
    
    // Confirm removal
    cy.on('window:confirm', () => true);
    
    // Verify action was removed
    cy.get('.actions-section').should('not.contain', 'Hit');
  });

  it('should remove conditions from character', () => {
    cy.navigateToCharacters();
    
    // First add a condition
    cy.contains('.character-card', 'The Guy').click();
    cy.contains('button', 'Add Condition').click();
    cy.contains('Aim').click();
    cy.contains('button', 'Add').click();
    
    // Now remove it
    cy.get('.conditions-section')
      .contains('.condition-item', 'Aim')
      .parent()
      .find('button:contains("Remove")')
      .click();
    
    // Confirm removal
    cy.on('window:confirm', () => true);
    
    // Verify condition was removed
    cy.get('.conditions-section').should('not.contain', 'Aim');
  });

  it('should show object details in character view', () => {
    cy.navigateToCharacters();
    
    // Add object first
    cy.contains('.character-card', 'The Guy').click();
    cy.contains('button', 'Add Object').click();
    cy.contains('Longsword').click();
    cy.contains('button', 'Add').click();
    
    // Click on object to see details
    cy.get('.stash-section')
      .contains('.object-item', 'Longsword')
      .click();
    
    // Should show object details (modal or expanded view)
    cy.contains('Damage: 15').should('be.visible');
    cy.contains('Lethality: 15').should('be.visible');
  });

  it('should show action details in character view', () => {
    cy.navigateToCharacters();
    
    // Add action first
    cy.contains('.character-card', 'The Guy').click();
    cy.contains('button', 'Add Action').click();
    cy.contains('Hit').click();
    cy.contains('button', 'Add').click();
    
    // Action details should be visible
    cy.get('.actions-section').within(() => {
      cy.contains('Source: dexterity').should('exist');
      cy.contains('Target: agility').should('exist');
      cy.contains('Type: trigger').should('exist');
    });
  });

  it('should show condition effects on attributes', () => {
    cy.navigateToCharacters();
    
    // Add condition
    cy.contains('.character-card', 'The Guy').click();
    cy.contains('button', 'Add Condition').click();
    cy.contains('Aim').click();
    cy.contains('button', 'Add').click();
    
    // Check that dexterity is modified
    cy.get('.attributes-section').within(() => {
      cy.contains('Dexterity').parent().should('contain', '13'); // 10 base + 3 from Aim
    });
    
    // Add another condition
    cy.contains('button', 'Add Condition').click();
    cy.contains('Grapple').click();
    cy.contains('button', 'Add').click();
    
    // Check that agility is modified
    cy.get('.attributes-section').within(() => {
      cy.contains('Agility').parent().should('contain', '5'); // 10 base - 5 from Grapple
    });
  });

  it('should handle duplicate associations', () => {
    cy.navigateToCharacters();
    
    // Add object
    cy.contains('.character-card', 'The Guy').click();
    cy.contains('button', 'Add Object').click();
    cy.contains('Longsword').click();
    cy.contains('button', 'Add').click();
    
    // Try to add same object again
    cy.contains('button', 'Add Object').click();
    
    // Longsword should either be disabled or show as already added
    cy.get('.modal').within(() => {
      cy.get('body').then($body => {
        if ($body.find('.object-item.disabled:contains("Longsword")').length > 0) {
          cy.contains('.object-item.disabled', 'Longsword').should('exist');
        } else {
          cy.contains('Longsword (Already Added)').should('exist');
        }
      });
    });
    
    // Close modal
    cy.get('.modal button.close').click();
  });
});