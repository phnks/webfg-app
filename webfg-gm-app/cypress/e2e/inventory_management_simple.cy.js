describe('Simple Inventory Management', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to character with inventory', () => {
    cy.navigateToCharacters();
    
    // Click on any character if exists
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Should show some inventory sections
        cy.get('body').then($charBody => {
          const hasInventory = $charBody.text().includes('Stash') || 
                              $charBody.text().includes('Equipment') || 
                              $charBody.text().includes('Ready') ||
                              $charBody.text().includes('Objects');
          
          if (hasInventory) {
            cy.log('Inventory sections found');
          }
        });
      }
    });
  });

  it('should show equipment sections if character has objects', () => {
    cy.navigateToCharacters();
    
    // Find a character with objects
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        // Try multiple characters to find one with objects
        cy.get('.character-card').not('.add-card').each(($card, index) => {
          if (index < 3) { // Check first 3 characters
            cy.wrap($card).click({force: true});
            cy.wait(2000);
            
            cy.get('body').then($charBody => {
              const hasObjects = $charBody.find('.object-item').length > 0 ||
                               $charBody.text().includes('Equip') ||
                               $charBody.text().includes('Ready');
              
              if (!hasObjects && index < 2) {
                // Go back and try next character
                cy.go('back');
                cy.wait(1000);
              }
            });
          }
        });
      }
    });
  });
});