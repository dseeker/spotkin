module.exports = {
    /**
     * Runs in the HTML before the PDF is generated.
     * This creates a book-style layout with cover page, table of contents, and proper formatting.
     */
    before: function() {
        // Get the document title from the first h1 or use filename
        const firstH1 = document.querySelector('h1');
        const documentTitle = firstH1 ? firstH1.textContent.trim() : 'SpotKin Resource Guide';
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Create cover page
        const coverPage = `
            <div class="cover-page">
                <div class="cover-title">SpotKin</div>
                <div class="cover-subtitle">${documentTitle}</div>
                <div class="cover-author">SpotKin Team</div>
                <div class="cover-date">${currentDate}</div>
            </div>
        `;

        // Generate table of contents
        const headers = document.querySelectorAll('h1, h2, h3');
        let tocEntries = '';
        let chapterCount = 0;
        let sectionCount = 0;

        headers.forEach((header, index) => {
            const level = parseInt(header.tagName.charAt(1));
            const text = header.textContent.trim();

            if (level === 1) {
                chapterCount++;
                sectionCount = 0;
                tocEntries += `<div class="toc-entry"><span>Chapter ${chapterCount}: ${text}</span><span>...</span></div>`;
            } else if (level === 2) {
                sectionCount++;
                tocEntries += `<div class="toc-entry" style="margin-left: 20px;"><span>${chapterCount}.${sectionCount} ${text}</span><span>...</span></div>`;
            } else if (level === 3) {
                tocEntries += `<div class="toc-entry" style="margin-left: 40px; font-size: 10pt;"><span>${text}</span><span>...</span></div>`;
            }
        });

        const tableOfContents = `
            <div class="table-of-contents">
                <h1 class="toc-title">Table of Contents</h1>
                ${tocEntries}
            </div>
        `;

        // Insert cover page and TOC at the beginning
        document.body.insertAdjacentHTML('afterbegin', coverPage + tableOfContents);

        // Add chapter numbers to h1 elements and improve spacing
        const h1Elements = document.querySelectorAll('h1:not(.toc-title)');
        h1Elements.forEach((h1, index) => {
            // Skip the first h1 if it's the same as document title
            const actualIndex = h1.textContent.trim() === documentTitle ? 0 : index + 1;
            if (actualIndex > 0) {
                h1.innerHTML = `<span style="font-size: 14pt; font-weight: 300; color: #7f8c8d; display: block; margin-bottom: 10px;">Chapter ${actualIndex}</span>${h1.textContent}`;
            }
        });

        // Add section numbers to h2 elements
        const h2Elements = document.querySelectorAll('h2');
        let currentChapter = 1;
        let currentSection = 0;

        h2Elements.forEach((h2) => {
            // Check if we're in a new chapter
            const previousH1 = h2.previousElementSibling;
            if (previousH1 && previousH1.tagName === 'H1') {
                currentSection = 0;
                // Find which chapter we're in
                const allH1s = Array.from(document.querySelectorAll('h1:not(.toc-title)'));
                currentChapter = allH1s.findIndex(h1 => h1 === previousH1) + 1;
            }

            currentSection++;
            h2.innerHTML = `${currentChapter}.${currentSection} ${h2.textContent}`;
        });

        // Enhance blockquotes with better styling
        const blockquotes = document.querySelectorAll('blockquote');
        blockquotes.forEach(blockquote => {
            blockquote.classList.add('avoid-break');
        });

        // Enhance code blocks
        const codeBlocks = document.querySelectorAll('pre');
        codeBlocks.forEach(pre => {
            pre.classList.add('avoid-break');
        });

        // Add page break before each h1 (except first)
        h1Elements.forEach((h1, index) => {
            if (index > 0) {
                h1.style.pageBreakBefore = 'always';
            }
        });

        // Add special styling for common SpotKin patterns
        const paragraphs = document.querySelectorAll('p');
        paragraphs.forEach(p => {
            const text = p.textContent;

            // Style scenario descriptions
            if (text.includes('Scenario:')) {
                p.classList.add('spotkin-highlight');
            }

            // Style pro tips
            if (text.includes('Pro Tip') || text.includes('💡')) {
                p.classList.add('pro-tip');
            }
        });

        // Style checklists better
        const lists = document.querySelectorAll('ul, ol');
        lists.forEach(list => {
            const hasCheckboxes = list.querySelector('input[type="checkbox"]');
            if (hasCheckboxes) {
                list.style.listStyle = 'none';
                list.style.paddingLeft = '0';
            }
        });

        // Add footer information
        const footer = `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; height: 60px; background: white; border-top: 1px solid #eee; display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 20px; height: 100%; font-size: 10px; color: #666;">
                    <span>SpotKin Resources</span>
                    <span>spotkin.io</span>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', footer);

        // Add custom styles for better book formatting
        const bookStyles = `
            <style>
                @page {
                    @bottom-center {
                        content: counter(page);
                        font-family: 'Source Sans Pro', Arial, sans-serif;
                        font-size: 10px;
                        color: #666;
                    }
                    @bottom-left {
                        content: "SpotKin Resources";
                        font-family: 'Source Sans Pro', Arial, sans-serif;
                        font-size: 9px;
                        color: #999;
                    }
                    @bottom-right {
                        content: "spotkin.io";
                        font-family: 'Source Sans Pro', Arial, sans-serif;
                        font-size: 9px;
                        color: #999;
                    }
                }

                @page :first {
                    @bottom-center { content: none; }
                    @bottom-left { content: none; }
                    @bottom-right { content: none; }
                }

                /* Reset counter for actual content */
                .table-of-contents {
                    counter-reset: page;
                }

                /* Improve readability */
                p {
                    text-align: justify;
                    hyphens: auto;
                }

                /* Better spacing for lists */
                li {
                    margin-bottom: 6px;
                }

                /* Ensure proper page breaks */
                h1, h2, h3 {
                    page-break-after: avoid;
                }

                /* Style the table of contents better */
                .toc-entry {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px dotted #ccc;
                    padding: 4px 0;
                    margin-bottom: 4px;
                }

                .toc-entry:last-child {
                    border-bottom: none;
                }

                /* Add some breathing room */
                body {
                    line-height: 1.7;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', bookStyles);
    },

    /**
     * Runs after the PDF is generated.
     */
    after: function() {
        // Cleanup if needed
        console.log('Book-style PDF generation completed');
    }
};