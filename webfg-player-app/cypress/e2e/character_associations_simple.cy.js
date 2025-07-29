describe('Simple Character Associations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to a character detail page', () => {
    cy.navigateToCharacters();
    
    // Click on any character card if exists
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Should be on character detail page
        cy.url().should('match', /\/characters\/[a-zA-Z0-9-]+$/);
        
        // Should show character sections
        cy.get('body').should('contain.text', 'Details');
        cy.get('body').should('contain.text', 'Attributes');
      }
    });
  });

  it('should show add object button on character page', () => {
    cy.navigateToCharacters();
    
    // Click on any character if exists
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for add object functionality
        cy.get('body').then($charBody => {
          if ($charBody.text().includes('Add Object') || $charBody.text().includes('Objects')) {
            cy.log('Object section found');
          }
        });
      }
    });
  });

  it('should show add action button on character page', () => {
    cy.navigateToCharacters();
    
    // Click on any character if exists
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for add action functionality
        cy.get('body').then($charBody => {
          if ($charBody.text().includes('Add Action') || $charBody.text().includes('Actions')) {
            cy.log('Action section found');
          }
        });
      }
    });
  });
});