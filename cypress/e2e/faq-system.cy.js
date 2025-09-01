describe('FAQ System Tests', () => {
    beforeEach(() => {
        // Clear FAQ state
        cy.window().then((win) => {
            win.localStorage.removeItem('spotkin_faq_interactions');
            win.localStorage.removeItem('spotkin_faq_state');
        });
        
        cy.visit('/');
        cy.wait(2000); // Wait for FAQ system to load
        cy.viewport(1280, 720);
    });

    describe('✅ FAQ System Initialization', () => {
        it('should load FAQ system module successfully', () => {
            cy.window().then((win) => {
                // Check that module loader exists
                expect(win.moduleLoader).to.exist;
                
                // Load FAQ module
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                // FAQ system should be loaded
                expect(faqSystem).to.not.be.null;
                expect(faqSystem.faqData).to.exist;
                expect(faqSystem.faqData.categories).to.exist;
            });
        });

        it('should build search index correctly', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                // Search index should be built
                expect(faqSystem.searchIndex).to.exist;
                expect(faqSystem.searchIndex.size).to.be.greaterThan(0);
            });
        });

        it('should have comprehensive FAQ categories', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                const categories = Object.keys(faqSystem.faqData.categories);
                
                // Should have essential categories
                expect(categories).to.include('getting-started');
                expect(categories).to.include('technical-issues');
                expect(categories).to.include('monitoring');
                expect(categories).to.include('privacy-security');
                expect(categories).to.include('mobile-app');
                
                // Each category should have questions
                categories.forEach(categoryId => {
                    const category = faqSystem.faqData.categories[categoryId];
                    expect(category.questions).to.exist;
                    expect(category.questions.length).to.be.greaterThan(0);
                });
            });
        });
    });

    describe('✅ FAQ Interface Creation', () => {
        it('should create FAQ interface when showFAQ is called', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // FAQ interface should be created and visible
                cy.get('#faq-interface').should('exist').and('not.have.class', 'hidden');
                cy.get('#faq-search').should('exist');
                cy.get('#faq-categories').should('exist');
                cy.get('#faq-content').should('exist');
            });
        });

        it('should show overview by default', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Should show overview content
                cy.get('#faq-content').should('contain', 'Welcome to SpotKin Help');
                cy.get('#faq-content').should('contain', 'Quick Fixes');
            });
        });

        it('should close FAQ interface when close button is clicked', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Click close button
                cy.get('#faq-close').click();
                
                // Interface should be hidden
                cy.get('#faq-interface').should('have.class', 'hidden');
            });
        });
    });

    describe('✅ FAQ Search Functionality', () => {
        it('should search FAQ questions successfully', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Search for "camera"
                cy.get('#faq-search').type('camera');
                cy.wait(500); // Wait for search debounce
                
                // Should show search results
                cy.get('#faq-content').should('contain', 'Search Results for "camera"');
                cy.get('.faq-question-item').should('exist');
            });
        });

        it('should handle empty search queries', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Type and clear search
                cy.get('#faq-search').type('camera').clear();
                cy.wait(500);
                
                // Should return to overview
                cy.get('#faq-content').should('contain', 'Welcome to SpotKin Help');
            });
        });

        it('should show no results message for invalid search', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Search for non-existent term
                cy.get('#faq-search').type('xyzabc123');
                cy.wait(500);
                
                // Should show no results
                cy.get('#faq-content').should('contain', 'No results found');
                cy.get('.faq-clear-search').should('exist');
            });
        });
    });

    describe('✅ FAQ Category Navigation', () => {
        it('should navigate between categories', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Click on getting-started category
                cy.get('[data-category="getting-started"]').click();
                
                // Should show category content
                cy.get('#faq-content').should('contain', '🚀 Getting Started');
                cy.get('.faq-question-item').should('exist');
                
                // Click on technical-issues category
                cy.get('[data-category="technical-issues"]').click();
                
                // Should show different category
                cy.get('#faq-content').should('contain', '🔧 Technical Issues');
            });
        });

        it('should highlight active category', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Click category
                cy.get('[data-category="monitoring"]').click();
                
                // Category should be highlighted
                cy.get('[data-category="monitoring"]').should('have.class', 'bg-indigo-50');
            });
        });

        it('should return to overview from category', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Go to category, then back to overview
                cy.get('[data-category="getting-started"]').click();
                cy.get('[data-category="overview"]').click();
                
                // Should show overview
                cy.get('#faq-content').should('contain', 'Welcome to SpotKin Help');
            });
        });
    });

    describe('✅ FAQ Question Display', () => {
        it('should display individual questions correctly', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Navigate to category and click question
                cy.get('[data-category="getting-started"]').click();
                cy.get('.faq-question-item').first().click();
                
                // Should show question details
                cy.get('.faq-question-detail').should('exist');
                cy.get('.faq-answer').should('exist');
                cy.get('.faq-helpful-btn').should('exist');
                cy.get('.faq-back-btn').should('exist');
            });
        });

        it('should handle helpful/not helpful feedback', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Navigate to question
                cy.get('[data-category="getting-started"]').click();
                cy.get('.faq-question-item').first().click();
                
                // Click helpful button
                cy.get('[data-helpful="true"]').click();
                
                // Button should be disabled and show feedback
                cy.get('[data-helpful="true"]').should('contain', 'Thank you').and('be.disabled');
            });
        });

        it('should navigate back from question to category', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Navigate to question and back
                cy.get('[data-category="technical-issues"]').click();
                cy.get('.faq-question-item').first().click();
                cy.get('.faq-back-btn').click();
                
                // Should return to category
                cy.get('#faq-content').should('contain', '🔧 Technical Issues');
            });
        });
    });

    describe('✅ FAQ Quick Fixes', () => {
        it('should display quick fixes in overview', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Should show quick fixes
                cy.get('#faq-content').should('contain', '🚀 Quick Fixes');
                cy.get('#faq-content').should('contain', 'Camera not working');
                cy.get('#faq-content').should('contain', 'CORS errors');
            });
        });

        it('should provide relevant quick fixes', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                const quickFixes = faqSystem.getQuickFixes();
                
                // Should have essential quick fixes
                expect(quickFixes).to.be.an('array');
                expect(quickFixes.length).to.be.greaterThan(0);
                
                const problems = quickFixes.map(fix => fix.problem.toLowerCase());
                expect(problems.some(p => p.includes('camera'))).to.be.true;
                expect(problems.some(p => p.includes('cors'))).to.be.true;
                expect(problems.some(p => p.includes('performance'))).to.be.true;
            });
        });
    });

    describe('✅ FAQ Data Persistence', () => {
        it('should save user interactions to localStorage', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Navigate to question and mark helpful
                cy.get('[data-category="getting-started"]').click();
                cy.get('.faq-question-item').first().click();
                
                // Click helpful
                cy.get('[data-helpful="true"]').click();
                
                // Check localStorage
                cy.window().then((win) => {
                    const interactions = win.localStorage.getItem('spotkin_faq_interactions');
                    expect(interactions).to.not.be.null;
                });
            });
        });

        it('should track question views correctly', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                const initialViews = faqSystem.getQuestionById('first-time-setup')?.views || 0;
                
                // View question
                faqSystem.trackQuestionView('first-time-setup');
                
                // Views should increment
                const newViews = faqSystem.getQuestionById('first-time-setup')?.views || 0;
                expect(newViews).to.equal(initialViews + 1);
            });
        });
    });

    describe('✅ FAQ Integration with Help System', () => {
        it('should open FAQ when help button is clicked', () => {
            // Click help button
            cy.get('#help-btn').click();
            
            // FAQ interface should open
            cy.get('#faq-interface', { timeout: 5000 }).should('exist').and('not.have.class', 'hidden');
        });

        it('should fallback to basic help if FAQ fails', () => {
            // Disable module loader temporarily
            cy.window().then((win) => {
                const originalModuleLoader = win.moduleLoader;
                win.moduleLoader = null;
                
                // Click help button
                cy.get('#help-btn').click();
                
                // Should show basic help modal instead
                cy.get('#help-modal').should('not.have.class', 'hidden');
                
                // Restore module loader
                win.moduleLoader = originalModuleLoader;
            });
        });
    });

    describe('✅ FAQ Responsive Design', () => {
        it('should work on mobile viewport', () => {
            cy.viewport(375, 667);
            
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Interface should be mobile-responsive
                cy.get('#faq-interface').should('exist');
                cy.get('#faq-search').should('be.visible');
                
                // Should be able to navigate on mobile
                cy.get('[data-category="getting-started"]').click();
                cy.get('.faq-question-item').should('exist');
            });
        });

        it('should work on tablet viewport', () => {
            cy.viewport(768, 1024);
            
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                faqSystem.showFAQ();
                
                // Should be functional on tablet
                cy.get('#faq-interface').should('exist');
                cy.get('#faq-categories').should('be.visible');
                cy.get('#faq-content').should('be.visible');
            });
        });
    });

    describe('✅ FAQ Error Handling', () => {
        it('should handle missing questions gracefully', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                // Try to get non-existent question
                const question = faqSystem.getQuestionById('non-existent');
                expect(question).to.be.null;
                
                // Should not crash when tracking non-existent question
                faqSystem.trackQuestionView('non-existent');
            });
        });

        it('should handle localStorage errors gracefully', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                // Mock localStorage to throw errors
                const originalSetItem = win.localStorage.setItem;
                cy.stub(win.localStorage, 'setItem').throws(new Error('Storage quota exceeded'));
                
                // Should not crash when saving interactions
                faqSystem.saveUserInteractions();
                
                // Restore localStorage
                win.localStorage.setItem = originalSetItem;
            });
        });
    });

    describe('✅ FAQ Statistics and Analytics', () => {
        it('should provide FAQ usage statistics', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                const stats = faqSystem.getStatistics();
                
                // Should provide comprehensive stats
                expect(stats.totalQuestions).to.be.greaterThan(0);
                expect(stats.categories).to.be.greaterThan(0);
                expect(stats.quickFixes).to.be.greaterThan(0);
                expect(stats.searchTerms).to.be.greaterThan(0);
            });
        });

        it('should track popular questions', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                // Track some views
                faqSystem.trackQuestionView('first-time-setup');
                faqSystem.trackQuestionView('camera-not-working');
                
                const popular = faqSystem.getPopularQuestions(5);
                expect(popular).to.be.an('array');
                expect(popular.length).to.be.greaterThan(0);
            });
        });

        it('should filter questions by difficulty', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                const beginnerQuestions = faqSystem.getQuestionsByDifficulty('beginner');
                const intermediateQuestions = faqSystem.getQuestionsByDifficulty('intermediate');
                
                expect(beginnerQuestions).to.be.an('array');
                expect(intermediateQuestions).to.be.an('array');
                
                // All questions should have correct difficulty
                beginnerQuestions.forEach(q => expect(q.difficulty).to.equal('beginner'));
                intermediateQuestions.forEach(q => expect(q.difficulty).to.equal('intermediate'));
            });
        });
    });

    describe('✅ FAQ Content Quality', () => {
        it('should have comprehensive CORS error guidance', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                const corsQuestion = faqSystem.getQuestionById('cors-errors');
                
                expect(corsQuestion).to.exist;
                expect(corsQuestion.answer).to.contain('CORS');
                expect(corsQuestion.answer).to.contain('HTTPS');
                expect(corsQuestion.answer).to.contain('browser');
                expect(corsQuestion.tags).to.include('cors');
            });
        });

        it('should provide camera troubleshooting steps', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                const cameraQuestion = faqSystem.getQuestionById('camera-not-working');
                
                expect(cameraQuestion).to.exist;
                expect(cameraQuestion.answer).to.contain('permission');
                expect(cameraQuestion.answer).to.contain('refresh');
                expect(cameraQuestion.answer).to.contain('browser');
                expect(cameraQuestion.tags).to.include('camera');
            });
        });

        it('should include privacy and security information', () => {
            cy.window().then((win) => {
                return win.moduleLoader.loadFAQModule();
            }).then((faqSystem) => {
                const privacyQuestion = faqSystem.getQuestionById('data-storage');
                
                expect(privacyQuestion).to.exist;
                expect(privacyQuestion.answer).to.contain('local');
                expect(privacyQuestion.answer).to.contain('encrypt');
                expect(privacyQuestion.answer).to.contain('privacy');
                expect(privacyQuestion.category).to.equal('privacy-security');
            });
        });
    });
});

describe('FAQ System Integration Tests', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.wait(2000);
    });

    it('should integrate seamlessly with main application', () => {
        // Main app should function normally
        cy.get('#take-snapshot').should('exist').and('not.be.disabled');
        
        // Help button should open FAQ
        cy.get('#help-btn').click();
        
        // FAQ should open without affecting main app
        cy.get('#faq-interface', { timeout: 5000 }).should('exist');
        
        // Close FAQ
        cy.get('#faq-close').click();
        
        // Main app should still work
        cy.get('#take-snapshot').should('exist').and('not.be.disabled');
    });

    it('should work alongside other onboarding systems', () => {
        // Both onboarding and FAQ should be available
        cy.window().then(async (win) => {
            const onboarding = win.moduleLoader ? await win.moduleLoader.loadOnboardingModule() : null;
            const faq = win.moduleLoader ? await win.moduleLoader.loadFAQModule() : null;
            
            // Both systems should coexist
            expect(onboarding).to.not.be.null;
            expect(faq).to.not.be.null;
        });
    });
});