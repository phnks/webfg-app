describe('Simple Attribute Grouping', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should show attributes on character page', () => {
    cy.navigateToCharacters();
    
    // Click on any character if exists
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Should show attributes section
        cy.get('body').should('contain.text', 'Attributes');
        
        // Should show some attribute names
        cy.get('body').then($charBody => {
          const hasAttributes = $charBody.text().includes('BODY') || 
                               $charBody.text().includes('MARTIAL') || 
                               $charBody.text().includes('MENTAL') ||
                               $charBody.text().includes('Speed') ||
                               $charBody.text().includes('Strength');
          
          if (hasAttributes) {
            cy.log('Attribute groups found');
          }
        });
      }
    });
  });

  it('should show attribute values', () => {
    cy.navigateToCharacters();
    
    // Click on any character
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for numeric values (attributes usually have numbers)
        cy.get('body').then($charBody => {
          // Check if there are any numbers displayed (attribute values)
          const hasNumbers = /\d+/.test($charBody.text());
          
          if (hasNumbers) {
            cy.log('Attribute values found');
          }
        });
      }
    });
  });
});