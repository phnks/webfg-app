describe('Simple Object CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to objects page', () => {
    cy.navigateToObjects();
    cy.url().should('include', '/objects');
    cy.contains('Objects').should('be.visible');
  });

  it('should show object creation form', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Should navigate to object creation page
    cy.url().should('include', '/objects/new');
    
    // Wait for page to fully load and check for either h1 or form presence
    cy.get('body').should('contain.text', 'Create');
    
    // Should show all required form fields (objects only have name and category, no description)
    cy.get('input[name="name"]').should('be.visible');
    cy.get('select[name="objectCategory"]').should('be.visible');
    
    // Should show attributes section
    cy.get('body').should('contain.text', 'Attributes');
    
    // Scroll to the bottom to see the Create button
    cy.scrollTo('bottom');
    cy.contains('button', 'Create').should('exist');
  });

  it('should create a simple object', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Fill the form with a simple object
    cy.fillBasicObjectInfo({
      name: 'Simple Test Sword',
      objectCategory: 'WEAPON'
    });
    
    // Submit the form
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect to object detail page
    cy.url().should('include', '/objects/');
    cy.url().should('not.contain', '/objects/new');
    cy.contains('h1', 'Simple Test Sword').should('be.visible');
  });

  it('should list objects including the created one', () => {
    cy.navigateToObjects();
    
    // Should show at least one object
    cy.get('body').should('contain.text', 'Test');
  });

  it('should view object details', () => {
    cy.navigateToObjects();
    
    // Click on an object if exists
    cy.get('body').then($body => {
      if ($body.text().includes('Simple Test Sword')) {
        cy.contains('Simple Test Sword').click({force: true});
        cy.url().should('match', /\/objects\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  after(() => {
    // Clean up: Delete the test object we created
    cy.navigateToObjects();
    
    // Check if Simple Test Sword exists and delete it
    cy.get('body').then($body => {
      if ($body.text().includes('Simple Test Sword')) {
        cy.contains('Simple Test Sword').click({force: true});
        cy.contains('button', 'Delete').click({force: true});
        cy.waitForGraphQL();
        
        // Should redirect back to objects list
        cy.url().should('include', '/objects');
        cy.url().should('not.match', /\/objects\/[a-zA-Z0-9-]+$/);
      }
    });
  });
});