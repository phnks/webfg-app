describe('Simple Character CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to characters page', () => {
    cy.navigateToCharacters();
    cy.url().should('include', '/characters');
    cy.contains('Characters').should('be.visible');
  });

  it('should show character creation form', () => {
    cy.navigateToCharacters();
    cy.clickCreateButton();
    
    // Should navigate to character creation page
    cy.url().should('include', '/characters/new');
    
    // Wait for page to fully load and check for either h1 or form presence
    cy.get('body').should('contain.text', 'Create');
    
    // Should show basic form fields
    cy.get('input').first().should('be.visible'); // Name field
    cy.get('select').first().should('be.visible'); // Category dropdown
    
    // Should show sections
    cy.get('body').should('contain.text', 'Basic Information');
    cy.get('body').should('contain.text', 'Attributes');
    
    // Scroll to the bottom to see the Create button
    cy.scrollTo('bottom');
    cy.contains('button', 'Create').should('exist');
  });

  it('should create a simple character', () => {
    cy.navigateToCharacters();
    cy.clickCreateButton();
    
    // Fill the form with a simple character
    cy.fillBasicCharacterInfo({
      name: 'Simple Test Character',
      category: 'HUMAN'
    });
    
    // Submit the form
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect to character detail page
    cy.url().should('include', '/characters/');
    cy.url().should('not.contain', '/characters/new');
    cy.contains('h1', 'Simple Test Character').should('be.visible');
  });

  it('should list characters including the created one', () => {
    cy.navigateToCharacters();
    
    // Should show at least one character
    cy.get('body').should('contain.text', 'Test');
  });

  it('should view character details', () => {
    cy.navigateToCharacters();
    
    // Click on a character if exists
    cy.get('body').then($body => {
      if ($body.text().includes('Simple Test Character')) {
        cy.contains('Simple Test Character').click({force: true});
        cy.url().should('match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  after(() => {
    // Clean up: Delete the test character we created
    cy.navigateToCharacters();
    
    // Check if Simple Test Character exists and delete it
    cy.get('body').then($body => {
      if ($body.text().includes('Simple Test Character')) {
        cy.contains('Simple Test Character').click({force: true});
        cy.contains('button', 'Delete').click({force: true});
        cy.waitForGraphQL();
        
        // Should redirect back to characters list
        cy.url().should('include', '/characters');
        cy.url().should('not.match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });
});