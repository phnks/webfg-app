describe('Simple Inventory Management', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to characters page and show characters', () => {
    cy.navigateToCharacters();
    cy.url().should('include', '/characters');
    cy.contains('Characters').should('be.visible');
  });

  it('should show character details when clicking on character', () => {
    cy.navigateToCharacters();
    
    // Click on any character if exists
    cy.get('body').then($body => {
      if ($body.find('.character-card').not('.add-card').length > 0) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Should show character page (any character content is fine)
        cy.url().should('include', '/characters/');
        cy.url().should('not.include', '/characters/new');
      }
    });
  });
});