describe('Character Attribute Grouping and Calculations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  function navigateToCharacters() {
    cy.get('[data-cy="menu-toggle"]').click();
    cy.get('[data-cy="nav-characters"]').click();
    cy.get('[data-cy="menu-toggle"]').click();
  }

  function setupCharacterWithModifiers() {
    navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Ensure we have objects and conditions that affect attributes
    // Add Chainmail (armor: 20, agility: -3)
    cy.get('body').then($body => {
      if (!$body.find('[data-cy="character-stash"], [data-cy="character-equipped"]').text().includes('Chainmail')) {
        cy.get('[data-cy="add-object-button"]').click();
        cy.contains('[data-cy="object-select-item"]', 'Chainmail').click();
        cy.get('[data-cy="confirm-add-object"]').click();
      }
    });
    
    // Move Chainmail to equipped
    cy.get('[data-cy="character-stash"]').then($stash => {
      if ($stash.text().includes('Chainmail')) {
        cy.get('[data-cy="character-stash"]')
          .contains('[data-cy="object-item"]', 'Chainmail')
          .find('[data-cy="move-to-equipped-button"]')
          .click();
      }
    });
    
    // Add Grapple condition (hinders agility by 5)
    cy.get('body').then($body => {
      if (!$body.find('[data-cy="character-conditions-list"]').text().includes('Grapple')) {
        cy.get('[data-cy="add-condition-button"]').click();
        cy.contains('[data-cy="condition-select-item"]', 'Grapple').click();
        cy.get('[data-cy="confirm-add-condition"]').click();
      }
    });
  }

  it('should display base attributes correctly', () => {
    navigateToCharacters();
    
    // View The Guy (base 10 in all attributes)
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Check base attributes display
    cy.get('[data-cy="attributes-section"]').within(() => {
      // Physical attributes
      cy.get('[data-cy="strength-base"]').should('contain', '10');
      cy.get('[data-cy="dexterity-base"]').should('contain', '10');
      cy.get('[data-cy="agility-base"]').should('contain', '10');
      cy.get('[data-cy="endurance-base"]').should('contain', '10');
      cy.get('[data-cy="vigor-base"]').should('contain', '10');
      
      // Mental attributes
      cy.get('[data-cy="perception-base"]').should('contain', '10');
      cy.get('[data-cy="intelligence-base"]').should('contain', '10');
      cy.get('[data-cy="will-base"]').should('contain', '10');
      
      // Other attributes
      cy.get('[data-cy="social-base"]').should('contain', '10');
      cy.get('[data-cy="faith-base"]').should('contain', '10');
      cy.get('[data-cy="armor-base"]').should('contain', '10');
      cy.get('[data-cy="lethality-base"]').should('contain', '10');
    });
  });

  it('should show attribute modifiers from objects', () => {
    setupCharacterWithModifiers();
    
    // Check that Chainmail modifiers are shown
    cy.get('[data-cy="attributes-section"]').within(() => {
      // Armor should show +20 from Chainmail
      cy.get('[data-cy="armor-modifiers"]').should('contain', '+20');
      cy.get('[data-cy="armor-total"]').should('contain', '30'); // 10 base + 20
      
      // Agility should show -3 from Chainmail
      cy.get('[data-cy="agility-modifiers"]').should('contain', '-3');
    });
  });

  it('should show attribute modifiers from conditions', () => {
    setupCharacterWithModifiers();
    
    // Check that Grapple modifier is shown
    cy.get('[data-cy="attributes-section"]').within(() => {
      // Agility should show -5 from Grapple
      cy.get('[data-cy="agility-modifiers"]').should('contain', '-5');
    });
  });

  it('should calculate total attributes correctly', () => {
    setupCharacterWithModifiers();
    
    // Check combined calculations
    cy.get('[data-cy="attributes-section"]').within(() => {
      // Agility: 10 base - 3 (Chainmail) - 5 (Grapple) = 2
      cy.get('[data-cy="agility-total"]').should('contain', '2');
      
      // Armor: 10 base + 20 (Chainmail) = 30
      cy.get('[data-cy="armor-total"]').should('contain', '30');
      
      // Other attributes should remain at base
      cy.get('[data-cy="strength-total"]').should('contain', '10');
      cy.get('[data-cy="dexterity-total"]').should('contain', '10');
    });
  });

  it('should show attribute grouping formula', () => {
    setupCharacterWithModifiers();
    
    // Click on info icon for attribute grouping
    cy.get('[data-cy="attribute-grouping-info"]').click();
    
    // Should show modal with formula
    cy.get('[data-cy="grouping-formula-modal"]').should('be.visible');
    cy.contains('Attribute Grouping Formula').should('be.visible');
    
    // Check formula explanation
    cy.contains('(Sum of Attributes × Count) ÷ Scaling Factor').should('exist');
    cy.contains('Scaling Factor').should('exist');
    
    // Close modal
    cy.get('[data-cy="close-modal-button"]').click();
  });

  it('should calculate attribute groups correctly', () => {
    setupCharacterWithModifiers();
    
    // Check attribute groups
    cy.get('[data-cy="attribute-groups-section"]').within(() => {
      // Physical group (strength, dexterity, agility, endurance, vigor)
      // With modifiers: 10 + 10 + 2 + 10 + 10 = 42
      cy.get('[data-cy="physical-group-value"]').should('exist');
      cy.get('[data-cy="physical-group-attributes"]').should('contain', 'Str, Dex, Agi, End, Vig');
      
      // Mental group (perception, intelligence, will)
      // All base 10: 10 + 10 + 10 = 30
      cy.get('[data-cy="mental-group-value"]').should('exist');
      cy.get('[data-cy="mental-group-attributes"]').should('contain', 'Per, Int, Wil');
      
      // Combat group (based on equipped items and combat attributes)
      cy.get('[data-cy="combat-group-value"]').should('exist');
    });
  });

  it('should update groups when adding ready items', () => {
    setupCharacterWithModifiers();
    
    // Add Longsword and move to ready
    cy.get('body').then($body => {
      if (!$body.find('[data-cy="character-stash"], [data-cy="character-equipped"], [data-cy="character-ready"]').text().includes('Longsword')) {
        cy.get('[data-cy="add-object-button"]').click();
        cy.contains('[data-cy="object-select-item"]', 'Longsword').click();
        cy.get('[data-cy="confirm-add-object"]').click();
      }
    });
    
    // Move to equipped then ready
    cy.get('[data-cy="character-stash"]').then($stash => {
      if ($stash.text().includes('Longsword')) {
        cy.get('[data-cy="character-stash"]')
          .contains('[data-cy="object-item"]', 'Longsword')
          .find('[data-cy="move-to-equipped-button"]')
          .click();
      }
    });
    
    cy.get('[data-cy="character-equipped"]')
      .contains('[data-cy="object-item"]', 'Longsword')
      .find('[data-cy="move-to-ready-button"]')
      .click();
    
    // Check that lethality and other combat attributes updated
    cy.get('[data-cy="lethality-modifiers"]').should('contain', '+15');
    cy.get('[data-cy="lethality-total"]').should('contain', '25'); // 10 base + 15
  });

  it('should show detailed breakdown in info modal', () => {
    setupCharacterWithModifiers();
    
    // Click on specific attribute info
    cy.get('[data-cy="agility-info-icon"]').click();
    
    // Should show breakdown modal
    cy.get('[data-cy="attribute-breakdown-modal"]').should('be.visible');
    cy.contains('Agility Breakdown').should('be.visible');
    
    // Check breakdown details
    cy.contains('Base Value: 10').should('exist');
    cy.contains('Chainmail: -3').should('exist');
    cy.contains('Grapple: -5').should('exist');
    cy.contains('Total: 2').should('exist');
    
    // Close modal
    cy.get('[data-cy="close-modal-button"]').click();
  });

  it('should handle multiple stacking modifiers', () => {
    setupCharacterWithModifiers();
    
    // Add Aim condition (helps dexterity by 3)
    cy.get('[data-cy="add-condition-button"]').click();
    cy.contains('[data-cy="condition-select-item"]', 'Aim').click();
    cy.get('[data-cy="confirm-add-condition"]').click();
    
    // Add Tower Shield and equip it
    cy.get('[data-cy="add-object-button"]').click();
    cy.contains('[data-cy="object-select-item"]', 'Tower Shield').click();
    cy.get('[data-cy="confirm-add-object"]').click();
    
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Tower Shield')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    // Check stacking modifiers
    cy.get('[data-cy="attributes-section"]').within(() => {
      // Armor: 10 base + 20 (Chainmail) + 30 (Tower Shield) = 60
      cy.get('[data-cy="armor-total"]').should('contain', '60');
      
      // Agility: 10 base - 3 (Chainmail) - 5 (Grapple) - 5 (Tower Shield) = -3
      cy.get('[data-cy="agility-total"]').should('contain', '-3');
      
      // Dexterity: 10 base + 3 (Aim) = 13
      cy.get('[data-cy="dexterity-total"]').should('contain', '13');
    });
  });

  it('should handle edge cases with zero and negative attributes', () => {
    navigateToCharacters();
    
    // View Commoner (base 1 in all attributes)
    cy.contains('[data-cy="character-list-item"]', 'Commoner').click();
    
    // Add Tower Shield (agility -5, strength -2)
    cy.get('[data-cy="add-object-button"]').click();
    cy.contains('[data-cy="object-select-item"]', 'Tower Shield').click();
    cy.get('[data-cy="confirm-add-object"]').click();
    
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Tower Shield')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    // Check negative values
    cy.get('[data-cy="attributes-section"]').within(() => {
      // Agility: 1 base - 5 = -4
      cy.get('[data-cy="agility-total"]').should('contain', '-4');
      
      // Strength: 1 base - 2 = -1
      cy.get('[data-cy="strength-total"]').should('contain', '-1');
    });
  });

  it('should recalculate when removing modifiers', () => {
    setupCharacterWithModifiers();
    
    // Remove Grapple condition
    cy.get('[data-cy="character-conditions-list"]')
      .contains('[data-cy="condition-item"]', 'Grapple')
      .find('[data-cy="remove-condition-button"]')
      .click();
    
    cy.get('[data-cy="confirm-remove-button"]').click();
    
    // Check agility updated
    cy.get('[data-cy="attributes-section"]').within(() => {
      // Agility: 10 base - 3 (Chainmail) = 7
      cy.get('[data-cy="agility-total"]').should('contain', '7');
    });
    
    // Move Chainmail back to stash
    cy.get('[data-cy="character-equipped"]')
      .contains('[data-cy="object-item"]', 'Chainmail')
      .find('[data-cy="move-to-stash-button"]')
      .click();
    
    // Check attributes back to base
    cy.get('[data-cy="attributes-section"]').within(() => {
      cy.get('[data-cy="agility-total"]').should('contain', '10');
      cy.get('[data-cy="armor-total"]').should('contain', '10');
    });
  });
});