describe('Character User Flow', () => {
  it('should allow basic character creation and viewing', () => {
    // Visit the home page
    cy.visit('/');

    cy.wait(2000); // Wait for initial page load

    // Navigate to Characters
    cy.navigateToCharacters();

    // Click create character button
    cy.clickCreateButton();

    // Fill out the name field
    cy.get('input[type="text"]').first().type('Test Character');

    // Set category
    cy.get('select').first().select('HUMAN');

    // Find and click the Create Character button
    cy.contains('button', 'Create Character').click({force: true});

    // Verify we've been redirected to the character view page
    cy.url().should('include', '/characters/');
    cy.url().should('not.contain', '/characters/new');

    // Verify the character name appears on the page
    cy.contains('h1', 'Test Character').should('be.visible');

    // Verify some sections are present
    cy.contains('.character-sections h3', 'Details').should('exist');
    cy.contains('.character-sections h3', 'Attributes').should('exist');
  });
});