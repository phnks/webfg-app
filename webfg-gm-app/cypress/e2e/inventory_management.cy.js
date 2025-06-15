describe('Inventory Management', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  function navigateToCharacters() {
    cy.get('[data-cy="menu-toggle"]').click();
    cy.get('[data-cy="nav-characters"]').click();
    cy.get('[data-cy="menu-toggle"]').click();
  }

  function setupCharacterWithObjects() {
    navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Add objects if not already present
    cy.get('body').then($body => {
      if ($body.find('[data-cy="character-stash"]').text().includes('No objects')) {
        // Add objects
        cy.get('[data-cy="add-object-button"]').click();
        cy.contains('[data-cy="object-select-item"]', 'Longsword').click();
        cy.get('[data-cy="confirm-add-object"]').click();
        
        cy.get('[data-cy="add-object-button"]').click();
        cy.contains('[data-cy="object-select-item"]', 'Chainmail').click();
        cy.get('[data-cy="confirm-add-object"]').click();
        
        cy.get('[data-cy="add-object-button"]').click();
        cy.contains('[data-cy="object-select-item"]', 'Tower Shield').click();
        cy.get('[data-cy="confirm-add-object"]').click();
        
        cy.get('[data-cy="add-object-button"]').click();
        cy.contains('[data-cy="object-select-item"]', 'Healing Potion').click();
        cy.get('[data-cy="confirm-add-object"]').click();
      }
    });
  }

  it('should move objects from stash to equipped', () => {
    setupCharacterWithObjects();
    
    // Move Longsword from stash to equipped
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    // Verify object moved to equipped
    cy.get('[data-cy="character-equipped"]').should('contain', 'Longsword');
    cy.get('[data-cy="character-stash"]').should('not.contain', 'Longsword');
    
    // Move Chainmail to equipped
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Chainmail')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    // Verify both items in equipped
    cy.get('[data-cy="character-equipped"]').should('contain', 'Longsword');
    cy.get('[data-cy="character-equipped"]').should('contain', 'Chainmail');
  });

  it('should move objects from equipped to ready', () => {
    setupCharacterWithObjects();
    
    // First ensure items are equipped
    cy.get('[data-cy="character-equipped"]').then($equipped => {
      if (!$equipped.text().includes('Longsword')) {
        cy.get('[data-cy="character-stash"]')
          .contains('[data-cy="object-item"]', 'Longsword')
          .find('[data-cy="move-to-equipped-button"]')
          .click();
      }
    });
    
    // Move Longsword from equipped to ready
    cy.get('[data-cy="character-equipped"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .find('[data-cy="move-to-ready-button"]')
      .click();
    
    // Verify object moved to ready
    cy.get('[data-cy="character-ready"]').should('contain', 'Longsword');
    cy.get('[data-cy="character-equipped"]').should('not.contain', 'Longsword');
  });

  it('should move objects back from ready to equipped', () => {
    setupCharacterWithObjects();
    
    // Ensure Longsword is in ready
    cy.get('[data-cy="character-ready"]').then($ready => {
      if (!$ready.text().includes('Longsword')) {
        // Move through the tiers
        cy.get('[data-cy="character-stash"]')
          .contains('[data-cy="object-item"]', 'Longsword')
          .find('[data-cy="move-to-equipped-button"]')
          .click();
        cy.get('[data-cy="character-equipped"]')
          .contains('[data-cy="object-item"]', 'Longsword')
          .find('[data-cy="move-to-ready-button"]')
          .click();
      }
    });
    
    // Move Longsword from ready back to equipped
    cy.get('[data-cy="character-ready"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    // Verify object moved back to equipped
    cy.get('[data-cy="character-equipped"]').should('contain', 'Longsword');
    cy.get('[data-cy="character-ready"]').should('not.contain', 'Longsword');
  });

  it('should move objects from equipped back to stash', () => {
    setupCharacterWithObjects();
    
    // Ensure Chainmail is equipped
    cy.get('[data-cy="character-equipped"]').then($equipped => {
      if (!$equipped.text().includes('Chainmail')) {
        cy.get('[data-cy="character-stash"]')
          .contains('[data-cy="object-item"]', 'Chainmail')
          .find('[data-cy="move-to-equipped-button"]')
          .click();
      }
    });
    
    // Move Chainmail from equipped back to stash
    cy.get('[data-cy="character-equipped"]')
      .contains('[data-cy="object-item"]', 'Chainmail')
      .find('[data-cy="move-to-stash-button"]')
      .click();
    
    // Verify object moved back to stash
    cy.get('[data-cy="character-stash"]').should('contain', 'Chainmail');
    cy.get('[data-cy="character-equipped"]').should('not.contain', 'Chainmail');
  });

  it('should handle multiple objects in each tier', () => {
    setupCharacterWithObjects();
    
    // Move multiple items to equipped
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Chainmail')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Tower Shield')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    // Verify all items in equipped
    cy.get('[data-cy="character-equipped"]').should('contain', 'Longsword');
    cy.get('[data-cy="character-equipped"]').should('contain', 'Chainmail');
    cy.get('[data-cy="character-equipped"]').should('contain', 'Tower Shield');
    
    // Move Longsword to ready
    cy.get('[data-cy="character-equipped"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .find('[data-cy="move-to-ready-button"]')
      .click();
    
    // Move Tower Shield to ready
    cy.get('[data-cy="character-equipped"]')
      .contains('[data-cy="object-item"]', 'Tower Shield')
      .find('[data-cy="move-to-ready-button"]')
      .click();
    
    // Verify ready items
    cy.get('[data-cy="character-ready"]').should('contain', 'Longsword');
    cy.get('[data-cy="character-ready"]').should('contain', 'Tower Shield');
    
    // Verify Chainmail still equipped
    cy.get('[data-cy="character-equipped"]').should('contain', 'Chainmail');
    
    // Verify Healing Potion still in stash
    cy.get('[data-cy="character-stash"]').should('contain', 'Healing Potion');
  });

  it('should show inventory tier labels and counts', () => {
    setupCharacterWithObjects();
    
    // Check tier labels
    cy.get('[data-cy="stash-label"]').should('contain', 'Stash');
    cy.get('[data-cy="equipped-label"]').should('contain', 'Equipped');
    cy.get('[data-cy="ready-label"]').should('contain', 'Ready');
    
    // Check counts
    cy.get('[data-cy="stash-count"]').should('exist');
    cy.get('[data-cy="equipped-count"]').should('exist');
    cy.get('[data-cy="ready-count"]').should('exist');
  });

  it('should handle drag and drop between tiers', () => {
    setupCharacterWithObjects();
    
    // Drag Longsword from stash to equipped
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .drag('[data-cy="character-equipped"]');
    
    // Verify object moved
    cy.get('[data-cy="character-equipped"]').should('contain', 'Longsword');
    cy.get('[data-cy="character-stash"]').should('not.contain', 'Longsword');
    
    // Drag from equipped to ready
    cy.get('[data-cy="character-equipped"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .drag('[data-cy="character-ready"]');
    
    // Verify object moved
    cy.get('[data-cy="character-ready"]').should('contain', 'Longsword');
    cy.get('[data-cy="character-equipped"]').should('not.contain', 'Longsword');
  });

  it('should persist inventory state', () => {
    setupCharacterWithObjects();
    
    // Move items to different tiers
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    cy.get('[data-cy="character-equipped"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .find('[data-cy="move-to-ready-button"]')
      .click();
    
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Chainmail')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    // Navigate away and back
    navigateToCharacters();
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Verify inventory state persisted
    cy.get('[data-cy="character-ready"]').should('contain', 'Longsword');
    cy.get('[data-cy="character-equipped"]').should('contain', 'Chainmail');
    cy.get('[data-cy="character-stash"]').should('contain', 'Tower Shield');
    cy.get('[data-cy="character-stash"]').should('contain', 'Healing Potion');
  });

  it('should handle empty inventory tiers', () => {
    navigateToCharacters();
    
    // Create a new character with no objects
    cy.get('[data-cy="create-character-button"]').click();
    cy.get('input[type="text"]').first().type('Empty Inventory Test');
    cy.get('select').first().select('HUMAN');
    cy.contains('button', 'Create Character').click({force: true});
    
    // Verify empty state messages
    cy.get('[data-cy="character-stash"]').should('contain', 'No objects in stash');
    cy.get('[data-cy="character-equipped"]').should('contain', 'No objects equipped');
    cy.get('[data-cy="character-ready"]').should('contain', 'No objects ready');
  });

  it('should show object details in inventory', () => {
    setupCharacterWithObjects();
    
    // Move Longsword to equipped
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    // Check that object shows key attributes
    cy.get('[data-cy="character-equipped"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .parent()
      .should('contain', 'Lethality: 15')
      .and('contain', 'Speed: 3');
  });
});