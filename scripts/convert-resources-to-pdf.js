const markdownpdf = require('markdown-pdf');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const styleArg = args.find(arg => arg.startsWith('--style='));
const style = styleArg ? styleArg.split('=')[1] : 'default';

const resourcesDir = './resources';
const outputDir = './resources';

// Available style presets
const stylePresets = {
    default: {
        cssPath: path.join(__dirname, 'pdf-styles.css'),
        runningsPath: path.join(__dirname, 'pdf-header-footer.js'),
        suffix: ''
    },
    book: {
        cssPath: path.join(__dirname, 'pdf-styles-book.css'),
        runningsPath: path.join(__dirname, 'pdf-header-footer-book.js'),
        suffix: '-book'
    }
};

// Validate style
if (!stylePresets[style]) {
    console.error(`Error: Unknown style "${style}". Available styles: ${Object.keys(stylePresets).join(', ')}`);
    process.exit(1);
}

const selectedStyle = stylePresets[style];
console.log(`Using style preset: ${style}`);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Find all markdown files in resources directory
const markdownFiles = fs.readdirSync(resourcesDir)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(resourcesDir, file));

console.log(`Found ${markdownFiles.length} markdown files to convert:`);
markdownFiles.forEach(file => console.log(`  - ${file}`));

// PDF generation options
const options = {
    cssPath: selectedStyle.cssPath,
    paperFormat: 'A4',
    paperOrientation: 'portrait',
    paperBorder: '1cm',
    renderDelay: 1000,
    runningsPath: selectedStyle.runningsPath
};

// Convert each markdown file to PDF
let completed = 0;
const total = markdownFiles.length;

if (total === 0) {
    console.log('No markdown files found in resources directory.');
    process.exit(0);
}

markdownFiles.forEach(markdownFile => {
    const fileName = path.basename(markdownFile, '.md');
    const pdfPath = path.join(outputDir, `${fileName}${selectedStyle.suffix}.pdf`);

    console.log(`Converting ${markdownFile} to ${pdfPath}...`);

    markdownpdf(options)
        .from(markdownFile)
        .to(pdfPath, () => {
            completed++;
            console.log(`✓ Created ${pdfPath}`);

            if (completed === total) {
                console.log(`\n🎉 Successfully converted ${total} markdown files to PDF using "${style}" style!`);
                console.log(`PDFs saved in: ${path.resolve(outputDir)}`);
            }
        });
});