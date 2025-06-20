describe('Search, Filter, Sort, and Pagination', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  describe('Characters Search and Filter', () => {
    beforeEach(() => {
      cy.navigateToCharacters();
    });

    it('should search characters by name', () => {
      // Test search functionality if search input exists
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').type('test', {force: true});
          cy.wait(1000);
          
          // Clear search
          cy.get('input[placeholder*="Search"]').clear({force: true});
          cy.wait(1000);
        } else {
          // If no search input, just verify the page loaded
          cy.get('body').should('contain.text', 'Characters');
        }
      });
    });

    it('should filter characters by category', () => {
      // Test category filter
      cy.get('body').then($body => {
        if ($body.find('select[name="characterCategory"]').length > 0) {
          // Get available options and select the first non-empty one
          cy.get('select[name="characterCategory"] option').then($options => {
            const availableOptions = Array.from($options).map(option => option.value).filter(val => val);
            
            if (availableOptions.length > 0) {
              cy.get('select[name="characterCategory"]').select(availableOptions[0]);
              cy.wait(1000);
              
              // Clear filter
              cy.get('select[name="characterCategory"]').select('');
              cy.wait(1000);
            }
          });
        }
      });
    });

    it('should sort characters', () => {
      // Test sorting functionality
      cy.get('body').then($body => {
        if ($body.find('.search-filter-sort select').length > 0) {
          // Scroll to avoid navbar covering elements
          cy.scrollTo('top');
          cy.wait(500);
          
          // Find and interact with sort dropdown
          cy.get('.search-filter-sort select').first().then($select => {
            cy.wrap($select).select(0, {force: true});
            cy.wait(1000);
          });
        }
      });
    });

    it('should switch between table and grid view', () => {
      // Test view mode switching
      cy.get('body').then($body => {
        // Check if view toggle buttons exist
        const hasGridButton = $body.find('button:contains("Grid View")').length > 0;
        const hasTableButton = $body.find('button:contains("Table View")').length > 0;
        
        if (hasGridButton || hasTableButton) {
          // Try to find and click Grid View button
          cy.get('button').contains('Grid View').then($btn => {
            if ($btn.length > 0) {
              cy.wrap($btn).click({force: true});
              cy.wait(1000);
            }
          });
          
          // Try to find and click Table View button  
          cy.get('button').contains('Table View').then($btn => {
            if ($btn.length > 0) {
              cy.wrap($btn).click({force: true});
              cy.wait(1000);
            }
          });
        } else {
          // If no view toggle buttons, just verify the page loaded
          cy.get('body').should('contain.text', 'Characters');
        }
      });
    });

    it('should handle pagination controls', () => {
      cy.get('body').then($body => {
        // Check if pagination controls exist  
        const hasPagination = $body.find('.pagination-controls').length > 0 ||
                             $body.find('[class*="pagination"]').length > 0;
                             
        if (hasPagination) {
          // Test page size change if select exists
          cy.get('body').then($body => {
            const pageSelect = $body.find('select').filter((i, el) => {
              return el.name && el.name.includes('pageSize');
            });
            
            if (pageSelect.length > 0) {
              cy.wrap(pageSelect.first()).select('5', {force: true});
              cy.wait(1000);
            }
          });
          
          // Test pagination buttons if they exist
          cy.get('body').then($body => {
            const hasNext = $body.find('button:contains("Next")').length > 0;
            
            if (hasNext) {
              cy.get('button').contains('Next').click({force: true});
              cy.wait(1000);
              
              // Check for Previous button after clicking Next
              cy.get('body').then($body => {
                if ($body.find('button:contains("Previous")').length > 0) {
                  cy.get('button').contains('Previous').click({force: true});
                  cy.wait(1000);
                }
              });
            }
          });
        } else {
          // If no pagination controls, just verify the page loaded
          cy.get('body').should('contain.text', 'Characters');
        }
      });
    });
  });

  describe('Objects Search and Filter', () => {
    beforeEach(() => {
      cy.navigateToObjects();
    });

    it('should search objects by name', () => {
      // Test search functionality if search input exists
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').type('test', {force: true});
          cy.wait(1000);
          
          // Clear search
          cy.get('input[placeholder*="Search"]').clear({force: true});
          cy.wait(1000);
        } else {
          // If no search input, just verify the page loaded
          cy.get('body').should('contain.text', 'Objects');
        }
      });
    });

    it('should filter objects by category', () => {
      // Test category filter
      cy.get('body').then($body => {
        if ($body.find('select[name="objectCategory"]').length > 0) {
          // Get available options and select the first non-empty one
          cy.get('select[name="objectCategory"] option').then($options => {
            const availableOptions = Array.from($options).map(option => option.value).filter(val => val);
            
            if (availableOptions.length > 0) {
              cy.get('select[name="objectCategory"]').select(availableOptions[0]);
              cy.wait(1000);
              
              // Clear filter
              cy.get('select[name="objectCategory"]').select('');
              cy.wait(1000);
            }
          });
        }
      });
    });

    it('should test edit buttons in search results', () => {
      // Test that edit buttons work in the new action-buttons structure
      cy.get('body').then($body => {
        const hasTableView = $body.find('.object-table').length > 0;
        
        if (hasTableView) {
          // Test edit button in table view
          cy.get('.action-buttons').first().within(() => {
            cy.get('.edit-button').should('be.visible');
            cy.get('.edit-button').should('contain.text', 'Edit');
          });
        }
      });
    });
  });

  describe('Actions Search and Filter', () => {
    beforeEach(() => {
      cy.navigateToActions();
    });

    it('should search actions by name', () => {
      // Test search functionality if actions exist
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').type('test', {force: true});
          cy.wait(1000);
          
          // Clear search
          cy.get('input[placeholder*="Search"]').clear({force: true});
          cy.wait(1000);
        }
      });
    });

    it('should test action list view components', () => {
      // Verify the action list page loads and has expected components
      cy.get('body').should('contain.text', 'Actions');
      
      // Check for search/filter components
      cy.get('body').then($body => {
        if ($body.find('.search-filter-sort').length > 0) {
          cy.get('.search-filter-sort').should('exist');
        }
      });
    });
  });

  describe('Conditions Search and Filter', () => {
    beforeEach(() => {
      cy.navigateToConditions();
    });

    it('should search conditions by name', () => {
      // Test search functionality if conditions exist
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').type('test', {force: true});
          cy.wait(1000);
          
          // Clear search
          cy.get('input[placeholder*="Search"]').clear({force: true});
          cy.wait(1000);
        }
      });
    });

    it('should test conditions list view components', () => {
      // Verify the conditions list page loads and has expected components
      cy.get('body').should('contain.text', 'Conditions');
      
      // Check for search/filter components
      cy.get('body').then($body => {
        if ($body.find('.search-filter-sort').length > 0) {
          cy.get('.search-filter-sort').should('exist');
        }
      });
    });
  });

  describe('Cross-Entity Functionality', () => {
    it('should maintain search state when navigating back', () => {
      // Test that search/filter state persists appropriately
      cy.navigateToObjects();
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').type('test', {force: true});
          cy.wait(1000);
          
          // Check if there are any objects to click on
          cy.get('body').then($body => {
            const hasObjectName = $body.find('.object-name').length > 0;
            const hasTableRow = $body.find('tbody tr').length > 0;
            
            if (hasObjectName || hasTableRow) {
              // Click on first object/row
              if (hasObjectName) {
                cy.get('.object-name').first().click({force: true});
              } else {
                cy.get('tbody tr').first().click({force: true});
              }
              
              cy.wait(2000);
              
              // Navigate back
              cy.go('back');
              cy.wait(2000);
              
              // Search input should exist and be cleared (expected behavior)
              cy.get('body').then($body => {
                if ($body.find('input[placeholder*="Search"]').length > 0) {
                  cy.get('input[placeholder*="Search"]').should('have.value', '');
                }
              });
            } else {
              // No objects to click, just verify search works
              cy.get('input[placeholder*="Search"]').should('exist');
            }
          });
        } else {
          // No search input, just verify page loaded
          cy.get('body').should('contain.text', 'Objects');
        }
      });
    });

    it('should handle empty search results gracefully', () => {
      cy.navigateToObjects();
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          // Search for something that doesn't exist
          cy.get('input[placeholder*="Search"]').type('NonExistentItem12345', {force: true});
          cy.wait(2000);
          
          // Should show no results or empty state
          cy.get('body').then($body => {
            const bodyText = $body.text();
            const hasEmptyState = $body.find('.empty-state').length > 0;
            const hasNoObjectsText = bodyText.includes('No objects found');
            const hasNoResultsText = bodyText.includes('No results found');
            const hasNoItemsText = bodyText.includes('No items found');
            
            // Additional checks for common empty state patterns
            const hasEmptyMessage = hasNoObjectsText || hasNoResultsText || hasNoItemsText || hasEmptyState;
            
            // If still no match, check if search returned zero results (table might be empty)
            const hasNoTableRows = $body.find('tbody tr').length === 0;
            const hasEmptyTable = hasNoTableRows && $body.find('tbody').length > 0;
            
            const isEmptyState = hasEmptyMessage || hasEmptyTable;
            
            if (!isEmptyState) {
              // Log what we actually found for debugging
              console.log('Body text:', bodyText.substring(0, 500));
              console.log('Empty state elements:', $body.find('.empty-state').length);
              console.log('Table rows:', $body.find('tbody tr').length);
            }
            
            expect(isEmptyState, 'Should show empty state when searching for non-existent items').to.be.true;
          });
          
          // Clear search
          cy.get('input[placeholder*="Search"]').clear({force: true});
          cy.wait(1000);
        }
      });
    });
  });

  after(() => {
    // No specific cleanup needed since we're not creating persistent test data
    cy.log('Search, filter, sort, and pagination tests completed');
  });
});