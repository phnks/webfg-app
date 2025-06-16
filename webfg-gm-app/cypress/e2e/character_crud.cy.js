describe('Character CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to characters page', () => {
    cy.navigateToCharacters();
    cy.url().should('include', '/characters');
    cy.contains('Characters').should('be.visible');
  });

  it('should show create character form', () => {
    cy.navigateToCharacters();
    cy.clickCreateButton();
    
    // Should navigate to character creation page
    cy.url().should('include', '/characters/new');
    
    // Wait for page to fully load and check for either h1 or form presence
    cy.get('body').should('contain.text', 'Create');
    
    // Should show form fields
    cy.get('input').should('have.length.greaterThan', 0);
    cy.get('select').should('exist');
    cy.contains('Basic Information').should('be.visible');
    cy.contains('Attributes').should('be.visible');
    
    // Scroll to the bottom to see the Create button
    cy.scrollTo('bottom');
    cy.contains('button', 'Create').should('exist');
  });

  it('should create a simple character with basic info only', () => {
    cy.navigateToCharacters();
    cy.clickCreateButton();
    
    // Fill basic character info
    cy.fillBasicCharacterInfo({
      name: 'Test Character',
      category: 'HUMAN'
    });
    
    // Submit form
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect to character detail page
    cy.url().should('include', '/characters/');
    cy.url().should('not.contain', '/characters/new');
    cy.contains('h1', 'Test Character').should('be.visible');
  });

  it('should list characters if any exist', () => {
    cy.navigateToCharacters();
    
    // Check if there are characters or empty state
    cy.get('body').then($body => {
      if ($body.find('.character-card').length > 0) {
        cy.get('.character-card').should('have.length.greaterThan', 0);
      } else {
        cy.contains('No characters have been created yet').should('be.visible');
      }
    });
  });

  it('should show character details when clicking on a character', () => {
    cy.navigateToCharacters();
    
    // Only run this test if characters exist
    cy.get('body').then($body => {
      if ($body.find('.character-card').not('.add-card').length > 0) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.url().should('match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  it('should handle navigation back to character list', () => {
    cy.navigateToCharacters();
    cy.clickCreateButton();
    
    // Wait for form to load
    cy.wait(2000);
    
    // Navigate back using browser
    cy.go('back');
    cy.wait(2000);
    
    cy.url().should('include', '/characters');
    cy.url().should('not.contain', '/new');
  });
});