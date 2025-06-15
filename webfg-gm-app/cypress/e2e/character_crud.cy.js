describe('Character CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  const testCharacters = [
    {
      name: 'The Guy',
      category: 'HUMAN',
      description: 'A perfectly average person with 10 in every attribute',
      attributes: {
        strength: 10,
        dexterity: 10,
        agility: 10,
        endurance: 10,
        vigor: 10,
        perception: 10,
        intelligence: 10,
        will: 10,
        social: 10,
        faith: 10,
        armor: 10,
        lethality: 10
      }
    },
    {
      name: 'Commoner',
      category: 'HUMAN', 
      description: 'A weak individual with 1 in every attribute',
      attributes: {
        strength: 1,
        dexterity: 1,
        agility: 1,
        endurance: 1,
        vigor: 1,
        perception: 1,
        intelligence: 1,
        will: 1,
        social: 1,
        faith: 1,
        armor: 1,
        lethality: 1
      }
    },
    {
      name: 'Anum',
      category: 'DIVINE',
      description: 'A godlike being with 100 in every attribute',
      attributes: {
        strength: 100,
        dexterity: 100,
        agility: 100,
        endurance: 100,
        vigor: 100,
        perception: 100,
        intelligence: 100,
        will: 100,
        social: 100,
        faith: 100,
        armor: 100,
        lethality: 100
      }
    }
  ];

  function navigateToCharacters() {
    cy.get('[data-cy="menu-toggle"]').click();
    cy.get('[data-cy="nav-characters"]').click();
    cy.get('[data-cy="menu-toggle"]').click();
  }

  function createCharacter(character) {
    cy.get('[data-cy="create-character-button"]').click();
    
    // Fill basic info
    cy.get('input[type="text"]').first().clear().type(character.name);
    cy.get('select').first().select(character.category);
    
    // Fill description if provided
    if (character.description) {
      cy.get('textarea').first().type(character.description);
    }
    
    // Fill attributes
    Object.entries(character.attributes).forEach(([attr, value]) => {
      cy.get(`input[name="${attr}"]`).clear().type(value.toString());
    });
    
    // Submit form
    cy.contains('button', 'Create Character').click({force: true});
    
    // Verify redirect
    cy.url().should('include', '/characters/');
    cy.url().should('not.contain', '/characters/new');
  }

  it('should create test characters with specific attributes', () => {
    navigateToCharacters();
    
    testCharacters.forEach((character) => {
      createCharacter(character);
      
      // Verify character details
      cy.contains('h1', character.name).should('be.visible');
      cy.contains(character.description).should('be.visible');
      
      // Verify attributes
      Object.entries(character.attributes).forEach(([attr, value]) => {
        cy.get(`[data-cy="${attr}-value"]`).should('contain', value);
      });
      
      // Go back to character list
      navigateToCharacters();
    });
  });

  it('should list all created characters', () => {
    navigateToCharacters();
    
    // Verify all test characters appear in list
    testCharacters.forEach((character) => {
      cy.contains('[data-cy="character-list-item"]', character.name).should('exist');
    });
  });

  it('should view character details', () => {
    navigateToCharacters();
    
    // Click on The Guy
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Verify we're on the character view page
    cy.url().should('include', '/characters/');
    cy.contains('h1', 'The Guy').should('be.visible');
    
    // Verify all sections are present
    cy.contains('.character-sections h3', 'Details').should('exist');
    cy.contains('.character-sections h3', 'Attributes').should('exist');
    cy.contains('.character-sections h3', 'Skills').should('exist');
    cy.contains('.character-sections h3', 'Stats').should('exist');
    cy.contains('.character-sections h3', 'Objects').should('exist');
    cy.contains('.character-sections h3', 'Actions').should('exist');
    cy.contains('.character-sections h3', 'Conditions').should('exist');
  });

  it('should update character details', () => {
    navigateToCharacters();
    
    // Click on Commoner
    cy.contains('[data-cy="character-list-item"]', 'Commoner').click();
    
    // Click edit button
    cy.get('[data-cy="edit-character-button"]').click();
    
    // Update name and description
    cy.get('input[type="text"]').first().clear().type('Commoner Updated');
    cy.get('textarea').first().clear().type('An updated weak individual');
    
    // Update some attributes
    cy.get('input[name="strength"]').clear().type('2');
    cy.get('input[name="dexterity"]').clear().type('2');
    
    // Save changes
    cy.contains('button', 'Update Character').click({force: true});
    
    // Verify updates
    cy.contains('h1', 'Commoner Updated').should('be.visible');
    cy.contains('An updated weak individual').should('be.visible');
    cy.get('[data-cy="strength-value"]').should('contain', '2');
    cy.get('[data-cy="dexterity-value"]').should('contain', '2');
  });

  it('should delete a character', () => {
    navigateToCharacters();
    
    // Create a character to delete
    cy.get('[data-cy="create-character-button"]').click();
    cy.get('input[type="text"]').first().type('Character To Delete');
    cy.get('select').first().select('HUMAN');
    cy.contains('button', 'Create Character').click({force: true});
    
    // Wait for redirect
    cy.url().should('include', '/characters/');
    
    // Click delete button
    cy.get('[data-cy="delete-character-button"]').click();
    
    // Confirm deletion
    cy.get('[data-cy="confirm-delete-button"]').click();
    
    // Verify redirect to character list
    cy.url().should('equal', `${Cypress.config().baseUrl}/characters`);
    
    // Verify character is not in list
    cy.contains('[data-cy="character-list-item"]', 'Character To Delete').should('not.exist');
  });

  it('should handle form validation', () => {
    navigateToCharacters();
    cy.get('[data-cy="create-character-button"]').click();
    
    // Try to submit without required fields
    cy.contains('button', 'Create Character').click({force: true});
    
    // Should show validation errors
    cy.contains('Name is required').should('be.visible');
    
    // Fill name but invalid attribute values
    cy.get('input[type="text"]').first().type('Invalid Character');
    cy.get('input[name="strength"]').type('-5');
    cy.contains('button', 'Create Character').click({force: true});
    
    // Should show attribute validation error
    cy.contains('must be at least 0').should('be.visible');
  });
});