describe('Object CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  const testObjects = [
    {
      name: 'Longsword',
      category: 'WEAPON',
      description: 'A standard medieval longsword',
      attributes: {
        speed: 3,
        weight: 15,
        size: 4,
        intensity: 8,
        armor: 0,
        lethality: 15,
        dexterity: 2
      }
    },
    {
      name: 'Chainmail',
      category: 'ARMOR',
      description: 'Flexible armor made of interlocking metal rings',
      attributes: {
        speed: -2,
        weight: 40,
        size: 3,
        intensity: 0,
        armor: 20,
        agility: -3
      }
    },
    {
      name: 'Healing Potion',
      category: 'ITEM',
      description: 'A magical potion that restores health',
      attributes: {
        speed: 1,
        weight: 1,
        size: 1,
        intensity: 5,
        vigor: 10,
        endurance: 5
      }
    },
    {
      name: 'Tower Shield',
      category: 'SHIELD',
      description: 'A large shield providing excellent protection',
      attributes: {
        speed: -4,
        weight: 50,
        size: 5,
        intensity: 0,
        armor: 30,
        agility: -5,
        strength: -2
      }
    },
    {
      name: 'Human Arm',
      category: 'BODY_PART',
      description: 'A severed human arm',
      attributes: {
        speed: 0,
        weight: 8,
        size: 3,
        intensity: 0
      }
    }
  ];

  function navigateToObjects() {
    cy.get('[data-cy="menu-toggle"]').click();
    cy.get('[data-cy="nav-objects"]').click();
    cy.get('[data-cy="menu-toggle"]').click();
  }

  function createObject(object) {
    cy.get('[data-cy="create-object-button"]').click();
    
    // Fill basic info
    cy.get('input[name="name"]').clear().type(object.name);
    cy.get('select[name="category"]').select(object.category);
    cy.get('textarea[name="description"]').clear().type(object.description);
    
    // Fill attributes
    Object.entries(object.attributes).forEach(([attr, value]) => {
      const input = cy.get(`input[name="${attr}"]`);
      if (input) {
        input.clear().type(value.toString());
      }
    });
    
    // Submit form
    cy.contains('button', 'Create Object').click({force: true});
    
    // Verify redirect
    cy.url().should('include', '/objects/');
    cy.url().should('not.contain', '/objects/new');
  }

  it('should create test objects with various categories', () => {
    navigateToObjects();
    
    testObjects.forEach((object) => {
      createObject(object);
      
      // Verify object details
      cy.contains('h1', object.name).should('be.visible');
      cy.contains(object.description).should('be.visible');
      cy.contains(`Category: ${object.category}`).should('be.visible');
      
      // Verify attributes
      Object.entries(object.attributes).forEach(([attr, value]) => {
        if (value !== 0) { // Only check non-zero values as they should be displayed
          cy.get(`[data-cy="${attr}-value"]`).should('contain', value);
        }
      });
      
      // Go back to object list
      navigateToObjects();
    });
  });

  it('should list all created objects grouped by category', () => {
    navigateToObjects();
    
    // Verify all test objects appear in list
    testObjects.forEach((object) => {
      cy.contains('[data-cy="object-list-item"]', object.name).should('exist');
    });
    
    // Verify category grouping
    cy.contains('[data-cy="object-category-group"]', 'WEAPON').should('exist');
    cy.contains('[data-cy="object-category-group"]', 'ARMOR').should('exist');
    cy.contains('[data-cy="object-category-group"]', 'ITEM').should('exist');
    cy.contains('[data-cy="object-category-group"]', 'SHIELD').should('exist');
    cy.contains('[data-cy="object-category-group"]', 'BODY_PART').should('exist');
  });

  it('should view object details', () => {
    navigateToObjects();
    
    // Click on Longsword
    cy.contains('[data-cy="object-list-item"]', 'Longsword').click();
    
    // Verify we're on the object view page
    cy.url().should('include', '/objects/');
    cy.contains('h1', 'Longsword').should('be.visible');
    
    // Verify all sections are present
    cy.contains('Details').should('exist');
    cy.contains('Attributes').should('exist');
    cy.contains('Characters Using This Object').should('exist');
  });

  it('should update object details', () => {
    navigateToObjects();
    
    // Click on Healing Potion
    cy.contains('[data-cy="object-list-item"]', 'Healing Potion').click();
    
    // Click edit button
    cy.get('[data-cy="edit-object-button"]').click();
    
    // Update name and description
    cy.get('input[name="name"]').clear().type('Greater Healing Potion');
    cy.get('textarea[name="description"]').clear().type('An improved magical potion that restores more health');
    
    // Update some attributes
    cy.get('input[name="vigor"]').clear().type('20');
    cy.get('input[name="endurance"]').clear().type('10');
    cy.get('input[name="intensity"]').clear().type('8');
    
    // Save changes
    cy.contains('button', 'Update Object').click({force: true});
    
    // Verify updates
    cy.contains('h1', 'Greater Healing Potion').should('be.visible');
    cy.contains('An improved magical potion that restores more health').should('be.visible');
    cy.get('[data-cy="vigor-value"]').should('contain', '20');
    cy.get('[data-cy="endurance-value"]').should('contain', '10');
    cy.get('[data-cy="intensity-value"]').should('contain', '8');
  });

  it('should delete an object', () => {
    navigateToObjects();
    
    // Create an object to delete
    cy.get('[data-cy="create-object-button"]').click();
    cy.get('input[name="name"]').type('Object To Delete');
    cy.get('select[name="category"]').select('ITEM');
    cy.get('textarea[name="description"]').type('This will be deleted');
    cy.get('input[name="weight"]').type('1');
    cy.get('input[name="size"]').type('1');
    cy.contains('button', 'Create Object').click({force: true});
    
    // Wait for redirect
    cy.url().should('include', '/objects/');
    
    // Click delete button
    cy.get('[data-cy="delete-object-button"]').click();
    
    // Confirm deletion
    cy.get('[data-cy="confirm-delete-button"]').click();
    
    // Verify redirect to object list
    cy.url().should('equal', `${Cypress.config().baseUrl}/objects`);
    
    // Verify object is not in list
    cy.contains('[data-cy="object-list-item"]', 'Object To Delete').should('not.exist');
  });

  it('should handle form validation', () => {
    navigateToObjects();
    cy.get('[data-cy="create-object-button"]').click();
    
    // Try to submit without required fields
    cy.contains('button', 'Create Object').click({force: true});
    
    // Should show validation errors
    cy.contains('Name is required').should('be.visible');
    cy.contains('Category is required').should('be.visible');
    
    // Fill name but invalid attribute values
    cy.get('input[name="name"]').type('Invalid Object');
    cy.get('select[name="category"]').select('WEAPON');
    cy.get('input[name="weight"]').type('-5');
    cy.contains('button', 'Create Object').click({force: true});
    
    // Should show attribute validation error
    cy.contains('Weight must be positive').should('be.visible');
  });

  it('should filter objects by category', () => {
    navigateToObjects();
    
    // Check if filter controls exist
    cy.get('[data-cy="category-filter"]').should('exist');
    
    // Filter by WEAPON category
    cy.get('[data-cy="category-filter"]').select('WEAPON');
    
    // Verify only weapons are shown
    cy.contains('[data-cy="object-list-item"]', 'Longsword').should('be.visible');
    cy.contains('[data-cy="object-list-item"]', 'Chainmail').should('not.exist');
    cy.contains('[data-cy="object-list-item"]', 'Healing Potion').should('not.exist');
    
    // Filter by ARMOR category
    cy.get('[data-cy="category-filter"]').select('ARMOR');
    
    // Verify only armor is shown
    cy.contains('[data-cy="object-list-item"]', 'Chainmail').should('be.visible');
    cy.contains('[data-cy="object-list-item"]', 'Longsword').should('not.exist');
    
    // Clear filter
    cy.get('[data-cy="category-filter"]').select('ALL');
    
    // Verify all objects are shown again
    cy.contains('[data-cy="object-list-item"]', 'Longsword').should('be.visible');
    cy.contains('[data-cy="object-list-item"]', 'Chainmail').should('be.visible');
    cy.contains('[data-cy="object-list-item"]', 'Healing Potion').should('be.visible');
  });
});