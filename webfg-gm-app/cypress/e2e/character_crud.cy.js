describe('Character CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to characters page', () => {
    cy.navigateToCharacters();
    cy.url().should('include', '/characters');
    cy.contains('h1', 'Characters').should('be.visible');
  });

  it('should show create character form', () => {
    cy.navigateToCharacters();
    cy.clickCreateButton();
    
    // Should navigate to character creation page
    cy.url().should('include', '/characters/new');
    cy.contains('h1', 'Create New Character').should('be.visible');
    
    // Should show form fields
    cy.get('input').should('have.length.greaterThan', 0);
    cy.get('select').should('exist');
    cy.contains('Basic Information').should('be.visible');
    cy.contains('Attributes').should('be.visible');
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
    cy.contains('button', 'Create Character').click();
    cy.waitForGraphQL();
    
    // Should navigate away from /new
    cy.url().should('not.contain', '/new');
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
        cy.get('.character-card').not('.add-card').first().click();
        cy.url().should('match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  it('should handle navigation back to character list', () => {
    cy.navigateToCharacters();
    cy.clickCreateButton();
    
    // Navigate back using browser or cancel
    cy.get('body').then($body => {
      if ($body.find('button:contains("Cancel")').length > 0) {
        cy.contains('button', 'Cancel').click();
      } else {
        cy.go('back');
      }
    });
    
    cy.url().should('include', '/characters');
    cy.url().should('not.contain', '/new');
  });
});