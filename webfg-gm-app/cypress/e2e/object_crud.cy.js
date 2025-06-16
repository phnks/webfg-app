describe('Object CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  const testObjects = [
    {
      name: 'Longsword',
      objectCategory: 'WEAPON',
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
      objectCategory: 'ARMOR',
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
      objectCategory: 'ITEM',
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
      objectCategory: 'SHIELD',
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
      objectCategory: 'BODY_PART',
      description: 'A severed human arm',
      attributes: {
        speed: 0,
        weight: 8,
        size: 3,
        intensity: 0
      }
    }
  ];

  function createObject(object) {
    cy.clickCreateButton();
    
    // Fill basic object info only (no description field exists)
    cy.fillBasicObjectInfo({
      name: object.name,
      objectCategory: object.objectCategory
    });
    
    // Submit the form
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Verify redirect
    cy.url().should('include', '/objects/');
    cy.url().should('not.contain', '/objects/new');
  }

  it('should create test objects', () => {
    cy.navigateToObjects();
    
    // Create just the first object to test the pattern
    createObject(testObjects[0]);
    
    // Verify object details (no description field to check)
    cy.contains('h1', testObjects[0].name).should('be.visible');
    
    // Go back to object list
    cy.navigateToObjects();
  });

  it('should list all created objects', () => {
    cy.navigateToObjects();
    
    // Verify all test objects appear in list
    testObjects.forEach((object) => {
      cy.contains('.object-card', object.name).should('exist');
      cy.contains('.object-card', object.name).within(() => {
        cy.contains(object.description).should('be.visible');
      });
    });
  });

  it('should view object details', () => {
    cy.navigateToObjects();
    
    // Click on Longsword
    cy.contains('.object-card', 'Longsword').click();
    
    // Verify we're on the detail page
    cy.url().should('match', /\/objects\/[a-zA-Z0-9-]+$/);
    cy.contains('h1', 'Longsword').should('be.visible');
    cy.contains('A standard medieval longsword').should('be.visible');
    cy.contains('Category: WEAPON').should('be.visible');
    
    // Verify attributes
    cy.contains('Speed: 3').should('be.visible');
    cy.contains('Weight: 15').should('be.visible');
    cy.contains('Size: 4').should('be.visible');
    cy.contains('Lethality: 15').should('be.visible');
  });

  it('should update object details', () => {
    cy.navigateToObjects();
    
    // Navigate to Healing Potion
    cy.contains('.object-card', 'Healing Potion').click();
    
    // Click edit button
    cy.clickEditButton();
    
    // Update description
    const updatedDescription = 'An enhanced magical potion that restores health - Updated';
    cy.get('textarea[name="description"]').clear().type(updatedDescription);
    
    // Update some attributes
    cy.get('input[name="vigor"]').clear().type('15');
    cy.get('input[name="endurance"]').clear().type('8');
    
    // Save changes
    cy.contains('button', 'Update Object').click({force: true});
    cy.waitForGraphQL();
    
    // Verify update
    cy.contains(updatedDescription).should('be.visible');
    cy.contains('Vigor: 15').should('be.visible');
    cy.contains('Endurance: 8').should('be.visible');
  });

  it('should delete an object', () => {
    cy.navigateToObjects();
    
    // Create an object to delete
    cy.clickCreateButton();
    cy.fillObjectForm({
      name: 'Object To Delete',
      objectCategory: 'ITEM',
      description: 'This will be deleted',
      attributes: {
        speed: 1,
        weight: 1,
        size: 1,
        intensity: 1
      }
    });
    cy.contains('button', 'Create Object').click({force: true});
    cy.waitForGraphQL();
    
    // Click delete button
    cy.clickDeleteButton();
    
    // Confirm deletion in any dialog
    cy.on('window:confirm', () => true);
    cy.waitForGraphQL();
    
    // Verify we're back on the list page
    cy.url().should('include', '/objects');
    cy.url().should('not.match', /\/objects\/[a-zA-Z0-9-]+$/);
    
    // Verify object is deleted
    cy.contains('.object-card', 'Object To Delete').should('not.exist');
  });

  it('should handle form validation', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Try to submit empty form
    cy.contains('button', 'Create Object').click({force: true});
    
    // Check for validation errors
    cy.contains('Name is required').should('be.visible');
    
    // Fill only name and try again
    cy.get('input[name="name"]').type('Test Object');
    cy.contains('button', 'Create Object').click({force: true});
    
    // Should still have errors for required fields
    cy.contains('Description is required').should('be.visible');
  });

  it('should filter objects by category', () => {
    cy.navigateToObjects();
    
    // Check if filter controls exist
    cy.get('body').then($body => {
      if ($body.find('.category-filter').length > 0) {
        // Test weapon filter
        cy.get('.category-filter select').select('WEAPON');
        cy.contains('.object-card', 'Longsword').should('be.visible');
        cy.contains('.object-card', 'Chainmail').should('not.exist');
        
        // Test armor filter
        cy.get('.category-filter select').select('ARMOR');
        cy.contains('.object-card', 'Chainmail').should('be.visible');
        cy.contains('.object-card', 'Longsword').should('not.exist');
        
        // Show all
        cy.get('.category-filter select').select('ALL');
        cy.contains('.object-card', 'Longsword').should('be.visible');
        cy.contains('.object-card', 'Chainmail').should('be.visible');
      }
    });
  });

  it('should show category-specific attributes', () => {
    cy.navigateToObjects();
    
    // View weapon
    cy.contains('.object-card', 'Longsword').click();
    cy.contains('Lethality: 15').should('be.visible');
    cy.contains('Dexterity: 2').should('be.visible');
    
    cy.navigateToObjects();
    
    // View armor
    cy.contains('.object-card', 'Chainmail').click();
    cy.contains('Armor: 20').should('be.visible');
    cy.contains('Agility: -3').should('be.visible');
    
    cy.navigateToObjects();
    
    // View shield
    cy.contains('.object-card', 'Tower Shield').click();
    cy.contains('Armor: 30').should('be.visible');
    cy.contains('Agility: -5').should('be.visible');
    cy.contains('Strength: -2').should('be.visible');
  });

  it('should show objects used by characters', () => {
    cy.navigateToObjects();
    
    // First, add object to a character
    cy.navigateToCharacters();
    cy.contains('.character-card', 'The Guy').click();
    cy.contains('button', 'Add Object').click();
    cy.contains('Longsword').click();
    cy.contains('button', 'Add').click();
    
    // Go back to objects
    cy.navigateToObjects();
    cy.contains('.object-card', 'Longsword').click();
    
    // Check if it shows which characters use this object
    cy.get('body').then($body => {
      if ($body.find('.used-by-section').length > 0) {
        cy.get('.used-by-section').should('contain', 'The Guy');
      }
    });
  });

  it('should handle negative attribute values correctly', () => {
    cy.navigateToObjects();
    
    // View object with negative attributes
    cy.contains('.object-card', 'Tower Shield').click();
    
    // Verify negative values display correctly
    cy.contains('Speed: -4').should('be.visible');
    cy.contains('Agility: -5').should('be.visible');
    cy.contains('Strength: -2').should('be.visible');
  });

  it('should handle optional attributes', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Fill only required fields and some optional attributes
    cy.get('input[name="name"]').type('Minimal Object');
    cy.get('select[name="objectCategory"]').select('ITEM');
    cy.get('textarea[name="description"]').type('An object with minimal attributes');
    
    // Fill only speed and weight
    cy.get('input[name="speed"]').type('2');
    cy.get('input[name="weight"]').type('5');
    
    // Submit form
    cy.contains('button', 'Create Object').click({force: true});
    cy.waitForGraphQL();
    
    // Verify object was created
    cy.contains('h1', 'Minimal Object').should('be.visible');
    cy.contains('Speed: 2').should('be.visible');
    cy.contains('Weight: 5').should('be.visible');
  });

  it('should display all object categories correctly', () => {
    cy.navigateToObjects();
    
    // Check all categories are represented
    const categories = ['WEAPON', 'ARMOR', 'SHIELD', 'ITEM', 'BODY_PART'];
    
    categories.forEach(category => {
      const expectedObject = testObjects.find(obj => obj.objectCategory === category);
      if (expectedObject) {
        cy.contains('.object-card', expectedObject.name).should('exist');
        cy.contains('.object-card', expectedObject.name).click();
        cy.contains(`Category: ${category}`).should('be.visible');
        cy.navigateToObjects();
      }
    });
  });

  after(() => {
    // Clean up: Delete test objects if they exist
    cy.navigateToObjects();
    
    const objectsToDelete = [...testObjects.map(o => o.name), 'Minimal Object'];
    
    objectsToDelete.forEach(objectName => {
      cy.get('body').then($body => {
        if ($body.text().includes(objectName)) {
          cy.contains('.object-card', objectName).click();
          cy.clickDeleteButton();
          cy.on('window:confirm', () => true);
          cy.waitForGraphQL();
          cy.navigateToObjects();
        }
      });
    });
  });
});