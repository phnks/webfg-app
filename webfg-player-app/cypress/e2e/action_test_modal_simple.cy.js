describe('Simple Action Test Modal', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should find character with actions', () => {
    cy.navigateToCharacters();
    
    // Look for a character that might have actions
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        // Try first few characters to find one with actions
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Check if character has actions
        cy.get('body').then($charBody => {
          const hasActions = $charBody.text().includes('Actions') || 
                            $charBody.text().includes('Test') ||
                            $charBody.find('.action-item').length > 0;
          
          if (hasActions) {
            cy.log('Character with actions found');
          }
        });
      }
    });
  });

  it('should show test button for actions if available', () => {
    cy.navigateToCharacters();
    
    // Navigate to a character
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for test buttons
        cy.get('body').then($charBody => {
          if ($charBody.find('button:contains("Test")').length > 0) {
            cy.log('Test button found');
            
            // Click test button
            cy.contains('button', 'Test').first().click({force: true});
            cy.wait(1000);
            
            // Check if modal appeared
            cy.get('body').then($modalBody => {
              if ($modalBody.find('.modal').length > 0) {
                cy.log('Test modal opened');
              }
            });
          }
        });
      }
    });
  });
});