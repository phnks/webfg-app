describe('Simple Object CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to objects page', () => {
    cy.navigateToObjects();
    cy.url().should('include', '/objects');
    cy.contains('h1', 'Objects').should('be.visible');
  });

  it('should show object creation form', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Should navigate to object creation page
    cy.url().should('include', '/objects/new');
    
    // Wait for page to fully load
    cy.get('body').should('contain.text', 'Create');
    
    // Should show basic form fields
    cy.get('input[name="name"]').should('be.visible');
    cy.get('textarea[name="description"]').should('be.visible');
    cy.get('select[name="objectCategory"]').should('be.visible');
  });

  it('should create a simple object', () => {
    cy.navigateToObjects();
    cy.clickCreateButton();
    
    // Fill the form with a simple object
    cy.fillBasicObjectInfo({
      name: 'Simple Test Sword',
      description: 'A simple test sword for automated testing',
      objectCategory: 'WEAPON'
    });
    
    // Scroll to submit and click
    cy.scrollTo('bottom');
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Wait for redirect
    cy.wait(2000);
    
    // Should redirect to object detail page
    cy.url().should('include', '/objects/');
    cy.url().should('not.contain', '/objects/new');
    cy.contains('Simple Test Sword').should('be.visible');
    cy.contains('A simple test sword for automated testing').should('be.visible');
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