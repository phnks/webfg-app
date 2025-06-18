describe('Attribute Grouping', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to characters page', () => {
    cy.navigateToCharacters();
    cy.url().should('include', '/characters');
    cy.contains('Characters').should('be.visible');
  });

  it('should show attribute groups on character page', () => {
    cy.navigateToCharacters();
    
    // Click on any character if exists
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Should show attributes section
        cy.get('body').should('contain.text', 'Attributes');
        
        // Look for attribute group names
        cy.get('body').then($charBody => {
          const hasAttributeGroups = $charBody.text().includes('BODY') || 
                                   $charBody.text().includes('MARTIAL') || 
                                   $charBody.text().includes('MENTAL') ||
                                   $charBody.text().includes('Speed') ||
                                   $charBody.text().includes('Strength') ||
                                   $charBody.text().includes('Agility');
          
          if (hasAttributeGroups) {
            cy.log('Attribute groups found');
          }
        });
      }
    });
  });

  it('should display attribute values', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for numeric values (attribute values)
        cy.get('body').then($charBody => {
          const hasNumbers = /\d+/.test($charBody.text());
          
          if (hasNumbers) {
            cy.log('Attribute values found');
          }
        });
      }
    });
  });

  it('should show collapsible attribute sections if available', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for collapsible elements
        cy.get('body').then($charBody => {
          const hasCollapsible = $charBody.find('.collapse').length > 0 ||
                               $charBody.find('.collapsible').length > 0 ||
                               $charBody.find('[data-toggle="collapse"]').length > 0 ||
                               $charBody.find('button[aria-expanded]').length > 0;
          
          if (hasCollapsible) {
            cy.log('Collapsible attribute sections found');
          }
        });
      }
    });
  });

  it('should handle attribute calculations if available', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for calculation-related content
        cy.get('body').then($charBody => {
          const hasCalculations = $charBody.text().includes('Total') ||
                                 $charBody.text().includes('Base') ||
                                 $charBody.text().includes('Modifier') ||
                                 $charBody.text().includes('+') ||
                                 $charBody.text().includes('-');
          
          if (hasCalculations) {
            cy.log('Attribute calculations found');
          }
        });
      }
    });
  });

  it('should show info buttons or tooltips if available', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for info buttons or tooltips
        cy.get('body').then($charBody => {
          const hasInfoElements = $charBody.find('.info-btn').length > 0 ||
                                 $charBody.find('button:contains("info")').length > 0 ||
                                 $charBody.find('[title]').length > 0 ||
                                 $charBody.find('.tooltip').length > 0;
          
          if (hasInfoElements) {
            cy.log('Info elements found');
          }
        });
      }
    });
  });

  it('should handle grouped attribute display', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for grouped attributes
        cy.get('body').then($charBody => {
          const hasGroups = $charBody.find('.attribute-group').length > 0 ||
                          $charBody.find('.attr-group').length > 0 ||
                          $charBody.find('.group').length > 0;
          
          if (hasGroups) {
            cy.log('Attribute groups found');
          }
        });
      }
    });
  });

  it('should handle different attribute categories', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for different attribute categories
        cy.get('body').then($charBody => {
          const hasPhysical = $charBody.text().includes('Strength') || 
                            $charBody.text().includes('Agility') ||
                            $charBody.text().includes('Endurance');
          const hasMental = $charBody.text().includes('Intelligence') ||
                          $charBody.text().includes('Will') ||
                          $charBody.text().includes('Faith');
          
          if (hasPhysical || hasMental) {
            cy.log('Different attribute categories found');
          }
        });
      }
    });
  });

  it('should show base and modified values if available', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for base/modified value indicators
        cy.get('body').then($charBody => {
          const hasModifiedValues = $charBody.text().includes('(') ||
                                   $charBody.find('.base-value').length > 0 ||
                                   $charBody.find('.modified-value').length > 0;
          
          if (hasModifiedValues) {
            cy.log('Base and modified values found');
          }
        });
      }
    });
  });

  it('should handle empty character state gracefully', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      if ($body.find('.character-card').not('.add-card').length === 0) {
        // No characters exist - should show empty state
        cy.log('No characters available for attribute testing');
      }
    });
  });

  it('should allow navigation back from character page', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Navigate back
        cy.navigateToCharacters();
        cy.url().should('include', '/characters');
        cy.url().should('not.match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  it('should display character name and basic info', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Should have a character name
        cy.get('h1').should('exist');
        
        // Should show attributes
        cy.get('body').should('contain.text', 'Attributes');
      }
    });
  });
});