module.exports = {
    /**
     * Runs in the HTML before the PDF is generated.
     * This is a good place to add headers and footers.
     */
    before: function() {
        // Add SpotKin branding to header
        var headerHtml = `
            <div style="text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="margin: 0; color: #3498db; font-size: 18px;">SpotKin Resources</h1>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">AI-Powered Monitoring Solutions</p>
            </div>
        `;

        // Insert header at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', headerHtml);

        // Add footer
        var footerHtml = `
            <div style="position: fixed; bottom: 20px; left: 0; right: 0; text-align: center; font-size: 10px; color: #666;">
                <div style="border-top: 1px solid #eee; padding-top: 10px;">
                    <p style="margin: 0;">SpotKin - Monitor Anyone, Instantly | spotkin.io</p>
                    <p style="margin: 5px 0 0 0;">Generated: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', footerHtml);

        // Add page numbers if needed
        var style = document.createElement('style');
        style.innerHTML = `
            @page {
                margin: 2cm 1.5cm 3cm 1.5cm;
            }

            .page-number:after {
                content: counter(page);
            }

            .page-total:after {
                content: counter(pages);
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Runs after the PDF is generated.
     */
    after: function() {
        // Cleanup if needed
    }
};