describe('Inventory Management', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  function setupCharacterWithObjects() {
    cy.navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('.character-card', 'The Guy').click();
    
    // Add objects if not already present
    cy.get('body').then($body => {
      if (!$body.text().includes('Longsword')) {
        // Add objects
        cy.contains('button', 'Add Object').click();
        cy.contains('Longsword').click();
        cy.contains('button', 'Add').click();
      }
      if (!$body.text().includes('Chainmail')) {
        cy.contains('button', 'Add Object').click();
        cy.contains('Chainmail').click();
        cy.contains('button', 'Add').click();
      }
      if (!$body.text().includes('Tower Shield')) {
        cy.contains('button', 'Add Object').click();
        cy.contains('Tower Shield').click();
        cy.contains('button', 'Add').click();
      }
      if (!$body.text().includes('Healing Potion')) {
        cy.contains('button', 'Add Object').click();
        cy.contains('Healing Potion').click();
        cy.contains('button', 'Add').click();
      }
    });
  }

  it('should move objects from stash to equipped', () => {
    setupCharacterWithObjects();
    
    // Move Longsword from stash to equipped
    cy.get('.stash-section')
      .contains('.object-item', 'Longsword')
      .parent()
      .find('button:contains("Equip")')
      .click();
    
    // Verify object moved to equipped
    cy.get('.equipped-section').should('contain', 'Longsword');
    cy.get('.stash-section').should('not.contain', 'Longsword');
    
    // Move Chainmail to equipped
    cy.get('.stash-section')
      .contains('.object-item', 'Chainmail')
      .parent()
      .find('button:contains("Equip")')
      .click();
    
    // Verify both items in equipped
    cy.get('.equipped-section').should('contain', 'Longsword');
    cy.get('.equipped-section').should('contain', 'Chainmail');
  });

  it('should move objects from equipped to ready', () => {
    setupCharacterWithObjects();
    
    // First ensure items are equipped
    cy.get('.equipped-section').then($equipped => {
      if (!$equipped.text().includes('Longsword')) {
        cy.get('.stash-section')
          .contains('.object-item', 'Longsword')
          .parent()
          .find('button:contains("Equip")')
          .click();
      }
    });
    
    // Move Longsword from equipped to ready
    cy.get('.equipped-section')
      .contains('.object-item', 'Longsword')
      .parent()
      .find('button:contains("Ready")')
      .click();
    
    // Verify object moved to ready
    cy.get('.ready-section').should('contain', 'Longsword');
    cy.get('.equipped-section').should('not.contain', 'Longsword');
  });

  it('should move objects back from ready to equipped', () => {
    setupCharacterWithObjects();
    
    // Ensure Longsword is in ready
    cy.get('.ready-section').then($ready => {
      if (!$ready.text().includes('Longsword')) {
        // Move through the tiers
        cy.get('.stash-section')
          .contains('.object-item', 'Longsword')
          .parent()
          .find('button:contains("Equip")')
          .click();
        cy.get('.equipped-section')
          .contains('.object-item', 'Longsword')
          .parent()
          .find('button:contains("Ready")')
          .click();
      }
    });
    
    // Move Longsword from ready back to equipped
    cy.get('.ready-section')
      .contains('.object-item', 'Longsword')
      .parent()
      .find('button:contains("Unready")')
      .click();
    
    // Verify object moved back to equipped
    cy.get('.equipped-section').should('contain', 'Longsword');
    cy.get('.ready-section').should('not.contain', 'Longsword');
  });

  it('should move objects from equipped to stash', () => {
    setupCharacterWithObjects();
    
    // Ensure Chainmail is equipped
    cy.get('.equipped-section').then($equipped => {
      if (!$equipped.text().includes('Chainmail')) {
        cy.get('.stash-section')
          .contains('.object-item', 'Chainmail')
          .parent()
          .find('button:contains("Equip")')
          .click();
      }
    });
    
    // Move Chainmail from equipped to stash
    cy.get('.equipped-section')
      .contains('.object-item', 'Chainmail')
      .parent()
      .find('button:contains("Unequip")')
      .click();
    
    // Verify object moved back to stash
    cy.get('.stash-section').should('contain', 'Chainmail');
    cy.get('.equipped-section').should('not.contain', 'Chainmail');
  });

  it('should show all three inventory tiers', () => {
    setupCharacterWithObjects();
    
    // Verify all three sections exist
    cy.get('.stash-section').should('exist');
    cy.get('.equipped-section').should('exist');
    cy.get('.ready-section').should('exist');
    
    // Verify section headers
    cy.contains('h4', 'Stash').should('be.visible');
    cy.contains('h4', 'Equipped').should('be.visible');
    cy.contains('h4', 'Ready').should('be.visible');
  });

  it('should show attribute modifiers when equipping items', () => {
    setupCharacterWithObjects();
    
    // Check base armor value
    cy.get('.attributes-section').within(() => {
      cy.contains('Armor').parent().then($armor => {
        const baseArmor = parseInt($armor.text().match(/\d+/)[0]);
        
        // Equip Chainmail
        cy.get('@baseArmor').then(() => {
          cy.get('.stash-section')
            .contains('.object-item', 'Chainmail')
            .parent()
            .find('button:contains("Equip")')
            .click();
        });
        
        // Verify armor increased
        cy.wrap(baseArmor).as('baseArmor');
      });
    });
    
    // Check that armor value increased
    cy.get('.attributes-section').within(() => {
      cy.contains('Armor').parent().should('contain', '30'); // 10 base + 20 from Chainmail
    });
    
    // Check agility decreased
    cy.get('.attributes-section').within(() => {
      cy.contains('Agility').parent().should('contain', '7'); // 10 base - 3 from Chainmail
    });
  });

  it('should update attribute modifiers when readying weapons', () => {
    setupCharacterWithObjects();
    
    // Move Longsword to ready
    cy.get('.stash-section')
      .contains('.object-item', 'Longsword')
      .parent()
      .find('button:contains("Equip")')
      .click();
    
    cy.get('.equipped-section')
      .contains('.object-item', 'Longsword')
      .parent()
      .find('button:contains("Ready")')
      .click();
    
    // Check lethality increased
    cy.get('.attributes-section').within(() => {
      cy.contains('Lethality').parent().should('contain', '25'); // 10 base + 15 from Longsword
    });
  });

  it('should handle consumable items differently', () => {
    setupCharacterWithObjects();
    
    // Healing Potion should not have same movement options
    cy.get('.stash-section')
      .contains('.object-item', 'Healing Potion')
      .parent()
      .within(() => {
        // Consumables might have different buttons
        cy.get('button').then($buttons => {
          const buttonText = $buttons.text();
          expect(buttonText).to.match(/Use|Equip|Ready/);
        });
      });
  });

  it('should remove object from character', () => {
    setupCharacterWithObjects();
    
    // Remove Tower Shield from stash
    cy.get('.stash-section')
      .contains('.object-item', 'Tower Shield')
      .parent()
      .find('button:contains("Remove")')
      .click();
    
    // Confirm removal
    cy.on('window:confirm', () => true);
    
    // Verify object removed
    cy.get('.stash-section').should('not.contain', 'Tower Shield');
  });

  it('should handle multiple instances of same object', () => {
    setupCharacterWithObjects();
    
    // Add another Healing Potion
    cy.contains('button', 'Add Object').click();
    cy.contains('Healing Potion').click();
    cy.contains('button', 'Add').click();
    
    // Verify count or multiple instances shown
    cy.get('.stash-section').within(() => {
      cy.get('.object-item:contains("Healing Potion")').should('have.length.at.least', 2);
    });
  });

  it('should show empty state messages', () => {
    cy.navigateToCharacters();
    
    // Create new character without objects
    cy.clickCreateButton();
    cy.fillCharacterForm({
      name: 'Empty Inventory Test',
      description: 'Character with no items',
      category: 'HUMAN',
      attributes: {
        strength: 5,
        dexterity: 5,
        agility: 5,
        endurance: 5,
        vigor: 5,
        perception: 5,
        intelligence: 5,
        will: 5,
        social: 5,
        faith: 5,
        armor: 5,
        lethality: 5
      }
    });
    cy.contains('button', 'Create Character').click({force: true});
    cy.waitForGraphQL();
    
    // Check empty states
    cy.get('.stash-section').should('contain', 'No objects in stash');
    cy.get('.equipped-section').should('contain', 'No objects equipped');
    cy.get('.ready-section').should('contain', 'No objects ready');
  });

  it('should not allow invalid movements', () => {
    setupCharacterWithObjects();
    
    // Objects in stash should not have "Unequip" or "Unready" buttons
    cy.get('.stash-section')
      .contains('.object-item', 'Tower Shield')
      .parent()
      .within(() => {
        cy.get('button:contains("Unequip")').should('not.exist');
        cy.get('button:contains("Unready")').should('not.exist');
      });
    
    // Objects in ready should not have "Equip" button
    // First move something to ready
    cy.get('.stash-section')
      .contains('.object-item', 'Longsword')
      .parent()
      .find('button:contains("Equip")')
      .click();
    cy.get('.equipped-section')
      .contains('.object-item', 'Longsword')
      .parent()
      .find('button:contains("Ready")')
      .click();
    
    cy.get('.ready-section')
      .contains('.object-item', 'Longsword')
      .parent()
      .within(() => {
        cy.get('button:contains("Equip")').should('not.exist');
      });
  });
});