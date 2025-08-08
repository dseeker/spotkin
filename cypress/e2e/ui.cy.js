describe('UI and UX Verification', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  context('Header and Navigation', () => {
    it('should display the header with title and navigation links', () => {
      cy.get('header').should('be.visible');
      cy.get('header h1').should('contain', 'SpotKin');
      cy.get('header nav ul li').should('have.length', 3);
      cy.get('header nav').contains('Features').should('have.attr', 'href', '#features');
      cy.get('header nav').contains('Try It').should('have.attr', 'href', '#demo');
      cy.get('header nav').contains('About').should('have.attr', 'href', '#about');
    });

    it('should navigate to sections when clicking navigation links', () => {
      cy.get('header nav').contains('Features').click();
      cy.url().should('include', '#features');
      cy.get('header nav').contains('Try It').click();
      cy.url().should('include', '#demo');
      cy.get('header nav').contains('About').click();
      cy.url().should('include', '#about');
    });
  });

  context('Hero Section', () => {
    it('should display the hero section with main heading and call-to-action buttons', () => {
      cy.get('.bg-gradient-to-b').should('be.visible');
      cy.get('.bg-gradient-to-b h2').should('contain', 'Smart, Caring Eyes for Your Loved Ones');
      cy.get('.bg-gradient-to-b').contains('Try the Demo').should('be.visible');
      cy.get('.bg-gradient-to-b').contains('Learn More').should('be.visible');
    });
  });

  context('Features Section', () => {
    it('should display the features section with three feature cards', () => {
      cy.get('#features').should('be.visible');
      cy.get('#features h2').should('contain', 'Key Features');
      cy.get('#features .grid > div').should('have.length', 3);
      cy.get('#features').contains('Semantic Analysis').should('be.visible');
      cy.get('#features').contains('Smart Alerts').should('be.visible');
      cy.get('#features').contains('Privacy-First Design').should('be.visible');
    });
  });

  context('Demo Section', () => {
    it('should display the demo section with camera and analysis panels', () => {
      cy.get('#demo').should('be.visible');
      cy.get('#demo h2').should('contain', 'Live Demo');
      cy.get('#camera-container').should('be.visible');
      cy.get('#results-container').should('be.visible');
    });

    it('should have camera controls and monitoring options', () => {
      cy.get('#take-snapshot').should('be.visible');
      cy.get('#toggle-camera').should('be.visible');
      cy.get('#toggle-monitoring').should('be.visible');
      cy.get('#refresh-rate').should('be.visible');
    });

    it('should switch between Current and History tabs', () => {
      cy.get('#tab-current').should('have.class', 'bg-indigo-100');
      cy.get('#current-tab').should('not.have.class', 'hidden');
      cy.get('#history-tab').should('have.class', 'hidden');

      cy.get('#tab-history').click();
      cy.get('#tab-history').should('have.class', 'bg-indigo-100');
      cy.get('#history-tab').should('not.have.class', 'hidden');
      cy.get('#current-tab').should('have.class', 'hidden');

      cy.get('#tab-current').click();
      cy.get('#tab-current').should('have.class', 'bg-indigo-100');
      cy.get('#current-tab').should('not.have.class', 'hidden');
      cy.get('#history-tab').should('have.class', 'hidden');
    });

    it('should display the results placeholder initially', () => {
      cy.get('#results-placeholder').should('be.visible');
      cy.get('#analysis-results').should('have.class', 'hidden');
      cy.get('#results-placeholder').contains('Capture an image to see real-time analysis');
    });
  });

  context('About Section', () => {
    it('should display the about section with content', () => {
      cy.get('#about').should('be.visible');
      cy.get('#about h2').should('contain', 'About SpotKin');
      cy.get('#about p').should('have.length.at.least', 3); // Check for at least 3 paragraphs of content
    });
  });

  context('Footer', () => {
    it('should display the footer with copyright and social links', () => {
      cy.get('footer').should('be.visible');
      cy.get('footer').contains('© 2025 SpotKin. All rights reserved.').should('be.visible');
      cy.get('footer .fab').should('have.length', 4); // Check for 4 social media icons
    });
  });
});