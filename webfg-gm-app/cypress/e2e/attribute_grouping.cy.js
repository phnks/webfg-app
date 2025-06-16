describe('Character Attribute Grouping and Calculations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  function setupCharacterWithModifiers() {
    cy.navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('.character-card', 'The Guy').click();
    
    // Ensure we have objects and conditions that affect attributes
    // Add Chainmail (armor: 20, agility: -3)
    cy.get('body').then($body => {
      if (!$body.text().includes('Chainmail')) {
        cy.contains('button', 'Add Object').click();
        cy.contains('Chainmail').click();
        cy.contains('button', 'Add').click();
      }
    });
    
    // Move Chainmail to equipped
    cy.get('.stash-section').then($stash => {
      if ($stash.text().includes('Chainmail')) {
        cy.get('.stash-section')
          .contains('.object-item', 'Chainmail')
          .parent()
          .find('button:contains("Equip")')
          .click();
      }
    });
    
    // Add Grapple condition (hinders agility by 5)
    cy.get('body').then($body => {
      if (!$body.text().includes('Grapple')) {
        cy.contains('button', 'Add Condition').click();
        cy.contains('Grapple').click();
        cy.contains('button', 'Add').click();
      }
    });
  }

  it('should display base attributes correctly', () => {
    cy.navigateToCharacters();
    
    // View The Guy (base 10 in all attributes)
    cy.contains('.character-card', 'The Guy').click();
    
    // Check base attributes display
    cy.get('.attributes-section').within(() => {
      // Physical attributes
      cy.contains('Strength: 10').should('exist');
      cy.contains('Dexterity: 10').should('exist');
      cy.contains('Agility: 10').should('exist');
      cy.contains('Endurance: 10').should('exist');
      cy.contains('Vigor: 10').should('exist');
      
      // Mental attributes
      cy.contains('Perception: 10').should('exist');
      cy.contains('Intelligence: 10').should('exist');
      cy.contains('Will: 10').should('exist');
      
      // Other attributes
      cy.contains('Social: 10').should('exist');
      cy.contains('Faith: 10').should('exist');
      cy.contains('Armor: 10').should('exist');
      cy.contains('Lethality: 10').should('exist');
    });
  });

  it('should show attribute modifiers from objects', () => {
    setupCharacterWithModifiers();
    
    // Check that Chainmail modifiers are shown
    cy.get('.attributes-section').within(() => {
      // Armor should show +20 from Chainmail
      cy.contains('Armor').parent().should('contain', '30'); // 10 base + 20
      
      // Agility should show -3 from Chainmail
      cy.contains('Agility').parent().should('contain', '7'); // 10 base - 3
    });
  });

  it('should show attribute modifiers from conditions', () => {
    setupCharacterWithModifiers();
    
    // Check that Grapple modifier is shown
    cy.get('.attributes-section').within(() => {
      // Agility should show -5 from Grapple (in addition to -3 from Chainmail)
      cy.contains('Agility').parent().should('contain', '2'); // 10 - 3 - 5
    });
  });

  it('should calculate total attributes correctly', () => {
    setupCharacterWithModifiers();
    
    // Check combined calculations
    cy.get('.attributes-section').within(() => {
      // Agility: 10 base - 3 (Chainmail) - 5 (Grapple) = 2
      cy.contains('Agility').parent().should('contain', '2');
      
      // Armor: 10 base + 20 (Chainmail) = 30
      cy.contains('Armor').parent().should('contain', '30');
      
      // Other attributes should remain at base
      cy.contains('Strength').parent().should('contain', '10');
      cy.contains('Dexterity').parent().should('contain', '10');
    });
  });

  it('should show attribute grouping formula', () => {
    setupCharacterWithModifiers();
    
    // Check if grouping info exists
    cy.get('.attribute-groups').should('exist');
    
    // Check formula explanation if available
    cy.get('body').then($body => {
      if ($body.find('.grouping-info').length > 0) {
        cy.get('.grouping-info').click();
        cy.contains('Attribute Grouping Formula').should('be.visible');
        cy.contains('Scaling Factor').should('exist');
        cy.get('.modal button.close').click();
      }
    });
  });

  it('should calculate attribute groups correctly', () => {
    setupCharacterWithModifiers();
    
    // Check attribute groups
    cy.get('.attribute-groups').within(() => {
      // Physical group (strength, dexterity, agility, endurance, vigor)
      cy.contains('Physical').should('exist');
      
      // Mental group (perception, intelligence, will)
      cy.contains('Mental').should('exist');
      
      // Combat group (based on equipped items and combat attributes)
      cy.contains('Combat').should('exist');
    });
  });

  it('should update groups when adding ready items', () => {
    setupCharacterWithModifiers();
    
    // Add Longsword and move to ready
    cy.get('body').then($body => {
      if (!$body.text().includes('Longsword')) {
        cy.contains('button', 'Add Object').click();
        cy.contains('Longsword').click();
        cy.contains('button', 'Add').click();
      }
    });
    
    // Move to equipped then ready
    cy.get('.stash-section').then($stash => {
      if ($stash.text().includes('Longsword')) {
        cy.get('.stash-section')
          .contains('.object-item', 'Longsword')
          .parent()
          .find('button:contains("Equip")')
          .click();
      }
    });
    
    cy.get('.equipped-section')
      .contains('.object-item', 'Longsword')
      .parent()
      .find('button:contains("Ready")')
      .click();
    
    // Check that lethality and other combat attributes updated
    cy.get('.attributes-section').within(() => {
      cy.contains('Lethality').parent().should('contain', '25'); // 10 base + 15
    });
  });

  it('should show detailed breakdown in info modal', () => {
    setupCharacterWithModifiers();
    
    // Check if attribute has clickable info
    cy.get('.attributes-section').within(() => {
      cy.get('body').then($body => {
        if ($body.find('.attribute-info').length > 0) {
          cy.get('.attribute-info').first().click();
          
          // Should show breakdown modal
          cy.get('.modal').should('be.visible');
          cy.contains('Base Value').should('exist');
          cy.contains('Total').should('exist');
          
          // Close modal
          cy.get('.modal button.close').click();
        }
      });
    });
  });

  it('should handle multiple stacking modifiers', () => {
    setupCharacterWithModifiers();
    
    // Add Aim condition (helps dexterity by 3)
    cy.contains('button', 'Add Condition').click();
    cy.contains('Aim').click();
    cy.contains('button', 'Add').click();
    
    // Add Tower Shield and equip it
    cy.contains('button', 'Add Object').click();
    cy.contains('Tower Shield').click();
    cy.contains('button', 'Add').click();
    
    cy.get('.stash-section')
      .contains('.object-item', 'Tower Shield')
      .parent()
      .find('button:contains("Equip")')
      .click();
    
    // Check stacking modifiers
    cy.get('.attributes-section').within(() => {
      // Armor: 10 base + 20 (Chainmail) + 30 (Tower Shield) = 60
      cy.contains('Armor').parent().should('contain', '60');
      
      // Agility: 10 base - 3 (Chainmail) - 5 (Grapple) - 5 (Tower Shield) = -3
      cy.contains('Agility').parent().should('contain', '-3');
      
      // Dexterity: 10 base + 3 (Aim) = 13
      cy.contains('Dexterity').parent().should('contain', '13');
    });
  });

  it('should handle edge cases with zero and negative attributes', () => {
    cy.navigateToCharacters();
    
    // View Commoner (base 1 in all attributes)
    cy.contains('.character-card', 'Commoner').click();
    
    // Add Tower Shield (agility -5, strength -2)
    cy.contains('button', 'Add Object').click();
    cy.contains('Tower Shield').click();
    cy.contains('button', 'Add').click();
    
    cy.get('.stash-section')
      .contains('.object-item', 'Tower Shield')
      .parent()
      .find('button:contains("Equip")')
      .click();
    
    // Check negative values
    cy.get('.attributes-section').within(() => {
      // Agility: 1 base - 5 = -4
      cy.contains('Agility').parent().should('contain', '-4');
      
      // Strength: 1 base - 2 = -1
      cy.contains('Strength').parent().should('contain', '-1');
    });
  });

  it('should recalculate when removing modifiers', () => {
    setupCharacterWithModifiers();
    
    // Remove Grapple condition
    cy.get('.conditions-section')
      .contains('.condition-item', 'Grapple')
      .parent()
      .find('button:contains("Remove")')
      .click();
    
    cy.on('window:confirm', () => true);
    
    // Check agility updated
    cy.get('.attributes-section').within(() => {
      // Agility: 10 base - 3 (Chainmail) = 7
      cy.contains('Agility').parent().should('contain', '7');
    });
    
    // Move Chainmail back to stash
    cy.get('.equipped-section')
      .contains('.object-item', 'Chainmail')
      .parent()
      .find('button:contains("Unequip")')
      .click();
    
    // Check attributes back to base
    cy.get('.attributes-section').within(() => {
      cy.contains('Agility').parent().should('contain', '10');
      cy.contains('Armor').parent().should('contain', '10');
    });
  });
});