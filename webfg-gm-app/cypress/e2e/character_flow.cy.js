describe('Character User Flow', () => {
  it('should allow creating and viewing a character', () => {
// Visit the home page
    cy.visit('/');

    // Open the side navigation bar
    cy.get('.menu-toggle').click();

    // Confirm the sidebar is open
    cy.get('.sidebar').should('have.class', 'open');

    // Confirm the Characters navigation option appears and click it
    cy.get('.sidebar').contains('Characters').should('be.visible').click();

    // Close the side navigation bar by clicking the toggle again
    cy.get('.menu-toggle').click();

    // Confirm the character listing page loads and wait for it to be visible
    cy.contains('h1', 'Characters').should('be.visible');

    // Confirm the "Create New Character" button appears and click it
    cy.contains('button', 'Create New Character').should('be.visible').click();

    // Confirm the character form appears
    cy.contains('h2', 'Create Character').should('be.visible');

    // Validate input fields and enter values

    // Name
    cy.get('label[for="name"]').should('be.visible');
    cy.get('input#name').should('be.visible').type('Anum').should('have.value', 'Anum');

    // Attributes (Check section header and some inputs)
    cy.contains('h3', 'Attributes').should('be.visible');
    // Assuming there's at least one attribute input
    cy.get('input[name="attributeData"]').each(($input) => {
      cy.wrap($input).should('be.visible').clear().type('10').should('have.value', '10');
    });

    // Skills (Check section header and some inputs)
    cy.contains('h3', 'Skills').should('be.visible');
    // Assuming there's at least one skill input
    cy.get('input[name="skillData"]').each(($input) => {
      cy.wrap($input).should('be.visible').clear().type('10').should('have.value', '10');
    });

    // Stats (Check section header and all inputs)
    cy.contains('h3', 'Stats').should('be.visible');
    cy.get('input[name="stats.hitPoints.current"]').should('be.visible').clear().type('4').should('have.value', '4');
    cy.get('#stats\\.hitPoints\\.max').should('be.visible').clear().type('4').should('have.value', '4');
    cy.get('#stats\\.fatigue\\.current').should('be.visible').clear().type('4').should('have.value', '4');
    cy.get('#stats\\.fatigue\\.max').should('be.visible').clear().type('4').should('have.value', '4');
    cy.get('#stats\\.exhaustion\\.current').should('be.visible').clear().type('4').should('have.value', '4');
    cy.get('#stats\\.exhaustion\\.max').should('be.visible').clear().type('4').should('have.value', '4');
    cy.get('#stats\\.surges\\.current').should('be.visible').clear().type('4').should('have.value', '4');
    cy.get('#stats\\.surges\\.max').should('be.visible').clear().type('4').should('have.value', '4');

    // Physical (Check section header and all inputs)
    cy.contains('h3', 'Physical').should('be.visible');
    cy.get('#physical\\.height').should('be.visible').clear().type('5').should('have.value', '5');
    cy.get('#physical\\.bodyFatPercentage').should('be.visible').clear().type('5').should('have.value', '5');
    cy.get('#physical\\.width').should('be.visible').clear().type('5').should('have.value', '5');
    cy.get('#physical\\.length').should('be.visible').clear().type('5').should('have.value', '5');
    cy.get('#physical\\.adjacency').should('be.visible').clear().type('5').should('have.value', '5');

    // Click the Create button
    cy.contains('button[type="submit"]', 'Create').should('be.visible').click();

    // Confirm redirection to the character view page
    cy.url().should('include', '/characters/'); // Check if the URL changes to /characters/<id>
    cy.url().should('not.contain', '/characters/new'); // Ensure it's not still the new form page

    // Confirm the character view page loads and validate values
    cy.contains('h1', 'Anum').should('be.visible'); // Check for the character's name as H1 title

    // Check for section headers on the view page
    cy.contains('.character-sections h3', 'Details').should('be.visible'); // Assuming CharacterDetails renders a 'Details' header
    cy.contains('.character-sections h3', 'Stats').should('be.visible');
    cy.contains('.character-sections h3', 'Attributes').should('be.visible');
    cy.contains('.character-sections h3', 'Skills').should('be.visible');
    cy.contains('.character-sections h3', 'Physical').should('be.visible');
    cy.contains('.character-sections h3', 'Equipment').should('be.visible'); // Equipment section
    cy.contains('.character-sections h3', 'Inventory').should('be.visible'); // Inventory section
    cy.contains('.character-sections h3', 'Conditions').should('be.visible'); // Conditions section
    cy.contains('.character-sections h3', 'Actions').should('be.visible'); // Actions section

    // For a basic validation, check if some of the entered values appear on the page.
    // This is a simplified check as exact element selectors for displayed values in child components aren't known.
    // Check for the presence of the entered attribute/skill/stat/physical values as text on the page.
    // This assumes the values are displayed as text somewhere in the respective sections.
    cy.contains('.character-sections', '10').should('be.visible'); // Check if '10' appears (from attributes/skills)
    cy.contains('.character-sections', '4').should('be.visible'); // Check if '4' appears (from stats)
    cy.contains('.character-sections', '5').should('be.visible'); // Check if '5' appears (from physical)

    // Test ends here.
  });
});
