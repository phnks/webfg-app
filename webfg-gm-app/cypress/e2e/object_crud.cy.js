describe('Object CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to objects page', () => {
    cy.navigateToObjects();
    cy.url().should('include', '/objects');
    cy.contains('Objects').should('be.visible');
  });

  it('should show create object form', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Should navigate to object creation page
    cy.url().should('include', '/objects/new');
    
    // Should show form fields
    cy.get('input[name="name"]').should('be.visible');
    cy.get('select[name="objectCategory"]').should('be.visible');
    
    // Should show attributes section
    cy.get('body').should('contain.text', 'Attributes');
    
    // Scroll to see the Create button
    cy.scrollTo('bottom');
    cy.contains('button', 'Create').should('exist');
  });

  it('should create a simple object', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Fill basic object info
    cy.fillBasicObjectInfo({
      name: 'Test Sword',
      objectCategory: 'WEAPON'
    });
    
    // Submit form
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect to object detail page
    cy.url().should('include', '/objects/');
    cy.url().should('not.contain', '/objects/new');
    cy.contains('h1', 'Test Sword').should('be.visible');
  });

  it('should list objects', () => {
    cy.navigateToObjects();
    
    // Should show at least one object
    cy.get('body').should('contain.text', 'Test Sword');
  });

  it('should view object details', () => {
    cy.navigateToObjects();
    
    // Click on Test Sword
    cy.contains('Test Sword').click({force: true});
    
    // Verify we're on the detail page
    cy.url().should('match', /\/objects\/[a-zA-Z0-9-]+$/);
    cy.contains('h1', 'Test Sword').should('be.visible');
    cy.contains('WEAPON').should('be.visible');
  });

  it('should update object details', () => {
    cy.navigateToObjects();
    
    // Navigate to Test Sword
    cy.contains('Test Sword').click({force: true});
    
    // Click edit button
    cy.clickEditButton();
    
    // Update name
    cy.get('input[name="name"]').clear().type('Test Sword Updated');
    
    // Save changes
    cy.contains('button', 'Update').click({force: true});
    cy.waitForGraphQL();
    
    // Verify update
    cy.contains('h1', 'Test Sword Updated').should('be.visible');
  });

  it('should delete an object', () => {
    cy.navigateToObjects();
    
    // Navigate to Test Sword Updated
    cy.contains('Test Sword Updated').click({force: true});
    cy.clickDeleteButton();
    
    // Confirm deletion
    cy.on('window:confirm', () => true);
    cy.waitForGraphQL();
    
    // Verify we're back on the list page
    cy.url().should('include', '/objects');
    cy.url().should('not.match', /\/objects\/[a-zA-Z0-9-]+$/);
    
    // Verify object is deleted
    cy.wait(2000);
    cy.get('body').then($body => {
      const hasTestSword = $body.text().includes('Test Sword Updated');
      expect(hasTestSword).to.be.false;
    });
  });

  it('should create object with different category', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Create armor object
    cy.fillBasicObjectInfo({
      name: 'Test Armor',
      objectCategory: 'ARMOUR'
    });
    
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    cy.url().should('include', '/objects/');
    cy.contains('h1', 'Test Armor').should('be.visible');
    cy.contains('ARMOUR').should('be.visible');
  });

  it('should handle form validation', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Try to submit with empty name
    cy.contains('button', 'Create').click({force: true});
    
    // Should not redirect if form is invalid
    cy.url().should('include', '/objects/new');
    
    // Fill name
    cy.get('input[name="name"]').type('Validation Test Object');
    
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect after successful submission
    cy.url().should('include', '/objects/');
    cy.url().should('not.contain', '/objects/new');
  });

  it('should navigate back to list', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Navigate back
    cy.go('back');
    cy.wait(2000);
    
    cy.url().should('include', '/objects');
    cy.url().should('not.contain', '/new');
  });

  it('should display all object categories', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Check that category dropdown has options
    cy.get('select[name="objectCategory"]').should('exist');
    cy.get('select[name="objectCategory"] option').should('have.length.greaterThan', 1);
  });

  after(() => {
    // Clean up: Delete test objects
    cy.navigateToObjects();
    
    const objectsToDelete = ['Test Armor', 'Validation Test Object'];
    
    objectsToDelete.forEach(objectName => {
      cy.get('body').then($body => {
        if ($body.text().includes(objectName)) {
          cy.contains(objectName).click({force: true});
          cy.clickDeleteButton();
          cy.on('window:confirm', () => true);
          cy.waitForGraphQL();
          cy.navigateToObjects();
        }
      });
    });
  });
});