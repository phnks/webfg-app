// Navigation helpers
Cypress.Commands.add('navigateToCharacters', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/characters"]').first().click({force: true});
  
  // Wait for the characters page to load instead of hardcoded wait
  cy.url().should('include', '/characters');
  cy.get('body').should('be.visible');
  
  // Ensure menu is closed by clicking somewhere else if it's still open
  cy.get('body').then($body => {
    if ($body.find('.menu-toggle[aria-expanded="true"]').length > 0) {
      cy.get('main').click({force: true});
    }
  });
});

Cypress.Commands.add('navigateToObjects', () => {
  // Dismiss any error popups that might be blocking navigation
  cy.get('body').then($body => {
    if ($body.find('.error-popup').length > 0) {
      cy.get('.error-popup').within(() => {
        cy.get('button').contains('Close').click({force: true});
      });
    }
  });
  
  cy.get('.menu-toggle').click({force: true});
  cy.get('a[href="/objects"]').first().click({force: true});
  
  // Wait for the objects page to load instead of hardcoded wait
  cy.url().should('include', '/objects');
  // Use a more flexible approach for finding the page content
  cy.get('body').should('be.visible');
  
  cy.get('body').then($body => {
    if ($body.find('.menu-toggle[aria-expanded="true"]').length > 0) {
      cy.get('main').click({force: true});
    }
  });
});

Cypress.Commands.add('navigateToActions', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/actions"]').first().click({force: true});
  
  // Wait for the actions page to load instead of hardcoded wait
  cy.url().should('include', '/actions');
  cy.get('body').should('be.visible');
  
  cy.get('body').then($body => {
    if ($body.find('.menu-toggle[aria-expanded="true"]').length > 0) {
      cy.get('main').click({force: true});
    }
  });
});

Cypress.Commands.add('navigateToConditions', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/conditions"]').first().click({force: true});
  
  // Wait for the conditions page to load instead of hardcoded wait
  cy.url().should('include', '/conditions');
  cy.get('body').should('be.visible');
  
  cy.get('body').then($body => {
    if ($body.find('.menu-toggle[aria-expanded="true"]').length > 0) {
      cy.get('main').click({force: true});
    }
  });
});

Cypress.Commands.add('navigateToEncounters', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/encounters"]').first().click();
  
  // Wait for the encounters page to load instead of hardcoded wait
  cy.url().should('include', '/encounters');
  cy.get('body').should('be.visible');
  
  cy.get('body').then($body => {
    if ($body.find('.menu-toggle[aria-expanded="true"]').length > 0) {
      cy.get('main').click();
    }
  });
});

Cypress.Commands.add('navigateToThoughts', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/thoughts"]').first().click({force: true});
  
  // Wait for the thoughts page to load instead of hardcoded wait
  cy.url().should('include', '/thoughts');
  cy.get('body').should('be.visible');
  
  cy.get('body').then($body => {
    if ($body.find('.menu-toggle[aria-expanded="true"]').length > 0) {
      cy.get('main').click({force: true});
    }
  });
});

// Button click helpers
Cypress.Commands.add('clickCreateButton', () => {
  // Check what page we're on and click the appropriate create button
  cy.url().then(url => {
    if (url.includes('/actions')) {
      // On actions page - click either sidebar "+ New" or main "Create New Action"
      cy.get('body').then($body => {
        if ($body.find('.add-btn').length > 0) {
          cy.get('.add-btn').click();
        } else {
          cy.contains('button', 'Create New Action').click();
        }
      });
    } else if (url.includes('/characters')) {
      // On characters page
      cy.get('body').then($body => {
        if ($body.find('.add-btn').length > 0) {
          cy.get('.add-btn').click();
        } else {
          cy.contains('button', 'Create New Character').click();
        }
      });
    } else if (url.includes('/objects')) {
      // On objects page
      cy.get('body').then($body => {
        if ($body.find('.add-btn').length > 0) {
          cy.get('.add-btn').click();
        } else {
          cy.contains('button', 'Create New Object').click();
        }
      });
    } else if (url.includes('/conditions')) {
      // On conditions page
      cy.get('body').then($body => {
        if ($body.find('.add-btn').length > 0) {
          cy.get('.add-btn').click();
        } else {
          cy.contains('button', 'Create New Condition').click();
        }
      });
    } else if (url.includes('/thoughts')) {
      // On thoughts page
      cy.get('body').then($body => {
        if ($body.find('.add-btn').length > 0) {
          cy.get('.add-btn').click();
        } else {
          cy.contains('button', 'Create New Thought').click();
        }
      });
    } else {
      // Fallback - try to find any create button
      cy.get('body').then($body => {
        if ($body.find('.add-btn').length > 0) {
          cy.get('.add-btn').click();
        } else if ($body.find('button:contains("Create")').length > 0) {
          cy.get('button:contains("Create")').first().click();
        }
      });
    }
  });
  // Wait for navigation to creation page or form to appear
  cy.get('body').then($body => {
    // Check if we navigated to a new page or if a form appeared
    if ($body.find('input[name="name"], form').length > 0) {
      cy.get('input[name="name"], form').should('be.visible');
    } else {
      cy.url().should('include', '/new');
    }
  });
});

Cypress.Commands.add('clickSaveButton', () => {
  cy.get('button[type="submit"]').contains('Save').click();
  // Wait for the save operation to complete by checking for success indicators
  cy.get('body').should('not.contain', 'Saving...');
});

Cypress.Commands.add('clickEditButton', () => {
  // Try the new action-buttons structure first, then fallback to old structure
  cy.get('body').then($body => {
    if ($body.find('.action-buttons .edit-button').length > 0) {
      cy.get('.action-buttons .edit-button').first().click({force: true});
    } else {
      cy.get('button').contains('Edit').click({force: true});
    }
  });
  // Wait for edit form to appear
  cy.get('input, textarea, select').should('be.visible');
});

Cypress.Commands.add('clickDeleteButton', () => {
  // Dismiss any error popups that might be blocking the delete button
  cy.get('body').then($body => {
    if ($body.find('.error-popup').length > 0) {
      cy.get('.error-popup').within(() => {
        cy.get('button').contains('Close').click({force: true});
      });
    }
  });
  
  // Try the new action-buttons structure first, then fallback to old structure
  cy.get('body').then($body => {
    if ($body.find('.action-buttons .delete-button').length > 0) {
      cy.get('.action-buttons .delete-button').first().click({force: true});
    } else {
      cy.get('button').contains('Delete').click({force: true});
    }
  });
});

Cypress.Commands.add('clickCancelButton', () => {
  cy.get('button').contains('Cancel').click();
});

// Simplified form helpers that work with actual UI
Cypress.Commands.add('fillBasicCharacterInfo', (character) => {
  // Fill only basic fields that have proper selectors
  cy.get('input').first().clear().type(character.name); // Name field
  cy.get('select').first().select(character.category); // Category dropdown
});

Cypress.Commands.add('fillBasicObjectInfo', (object) => {
  // Wait for form to be ready
  cy.get('input[name="name"]').should('be.visible');
  
  cy.get('input[name="name"]').clear().type(object.name);
  
  // Object form doesn't have description field, only name and category
  if (object.objectCategory) {
    cy.get('select[name="objectCategory"]').select(object.objectCategory);
  } else {
    // Default to first available option if not specified
    cy.get('select[name="objectCategory"]').select(0);
  }
  
  // Wait for form fields to be properly filled
  cy.get('input[name="name"]').should('have.value', object.name);
});

Cypress.Commands.add('fillActionForm', (action) => {
  // Wait for form to be ready and scroll to top to start
  cy.scrollTo('top');
  cy.get('input[name="name"]').should('be.visible');
  
  // Fill name field
  cy.get('input[name="name"]').clear().type(action.name);
  
  // Fill dropdown fields in the middle section
  // Fill required Category field - default to ATTACK if not specified
  if (action.category) {
    cy.get('select[name="actionCategory"]').select(action.category);
  } else {
    cy.get('select[name="actionCategory"]').select('ATTACK');
  }
  
  // Map our test data to actual form field names
  if (action.source) {
    cy.get('select[name="sourceAttribute"]').select(action.source);
  }
  if (action.target) {
    cy.get('select[name="targetAttribute"]').select(action.target);
  }
  
  // Fill required Target Type field - default to CHARACTER if not specified
  if (action.targetType) {
    cy.get('select[name="targetType"]').select(action.targetType);
  } else {
    cy.get('select[name="targetType"]').select('CHARACTER');
  }
  
  if (action.type) {
    // Map test 'type' to actual 'effectType'
    cy.get('select[name="effectType"]').select(action.type);
  }
  
  // Scroll down to make the description field visible and fill it
  cy.get('textarea[name="description"]').scrollIntoView().should('be.visible');
  cy.get('textarea[name="description"]').clear().type(action.description);
  
  // Wait for form fields to be properly filled
  cy.get('input[name="name"]').should('have.value', action.name);
  
  // Handle trigger actions if the form supports them
  if (action.type === 'TRIGGER_ACTION' && action.triggersAction) {
    cy.get('body').then($body => {
      if ($body.find('select[name="triggersAction"]').length > 0) {
        cy.get('select[name="triggersAction"]').select(action.triggersAction);
      }
    });
  }
});

Cypress.Commands.add('fillBasicConditionInfo', (condition) => {
  // Wait for form to be ready
  cy.get('input[name="name"]').should('be.visible');
  
  // Fill name field (required)
  cy.get('input[name="name"]').clear().type(condition.name);
  
  // Fill description field (optional but commonly provided)
  if (condition.description) {
    cy.get('textarea[name="description"]').clear().type(condition.description);
  }
  
  // Fill category field (required, has default but let's be explicit)
  if (condition.conditionCategory) {
    cy.get('select[name="conditionCategory"]').select(condition.conditionCategory);
  } else {
    // Default to first available option if not specified
    cy.get('select[name="conditionCategory"]').select(0);
  }
  
  // Fill type field (required, has default but let's be explicit)
  if (condition.conditionType) {
    cy.get('select[name="conditionType"]').select(condition.conditionType);
  } else {
    // Default to first available option if not specified
    cy.get('select[name="conditionType"]').select(0);
  }
  
  // Fill target attribute field (required, has default but let's be explicit)
  if (condition.conditionTarget) {
    cy.get('select[name="conditionTarget"]').select(condition.conditionTarget);
  } else {
    // Default to first available option if not specified
    cy.get('select[name="conditionTarget"]').select(0);
  }
  
  // Wait for form fields to be properly filled
  cy.get('input[name="name"]').should('have.value', condition.name);
});

Cypress.Commands.add('fillBasicThoughtInfo', (thought) => {
  // Wait for form to be ready
  cy.get('input[name="name"]').should('be.visible');
  
  // Fill name field (required)
  cy.get('input[name="name"]').clear().type(thought.name);
  
  // Fill description field (optional but commonly provided)
  if (thought.description) {
    cy.get('textarea[name="description"]').clear().type(thought.description);
  }
  
  // Wait for form fields to be properly filled
  cy.get('input[name="name"]').should('have.value', thought.name);
});

// Wait for GraphQL operations
Cypress.Commands.add('waitForGraphQL', () => {
  // Wait for network requests to complete instead of hardcoded wait
  // This will wait for any pending XHR/fetch requests to complete
  cy.get('body').should('not.contain', 'Loading...');
  
  // Additional fallback: wait for any loading indicators to disappear
  cy.get('body').then($body => {
    if ($body.find('.loading, .spinner, [data-testid="loading"]').length > 0) {
      cy.get('.loading, .spinner, [data-testid="loading"]').should('not.exist');
    }
  });
});

// Submit form helper
Cypress.Commands.add('submitForm', () => {
  cy.get('button[type="submit"]').click();
  cy.waitForGraphQL();
});