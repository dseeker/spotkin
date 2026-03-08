# PDF Conversion System for SpotKin Resources

This system converts all markdown files in the `resources/` directory to professionally formatted PDFs with multiple style options.

## Quick Start

```bash
# Convert with default style
npm run convert-to-pdf:default

# Convert with book style
npm run convert-to-pdf:book

# Convert with both styles
npm run convert-to-pdf:all
```

## Available Styles

### Default Style (`--style=default`)
- **Output**: `filename.pdf`
- **Features**: Clean, modern document style
- Simple header with SpotKin branding
- Standard spacing and typography
- Good for quick reference documents

### Book Style (`--style=book`)
- **Output**: `filename-book.pdf`
- **Features**: Professional book layout
- Cover page with title and author
- Table of contents with chapter/section numbering
- Page numbers in footer
- Serif fonts for better readability
- Chapter breaks and professional spacing
- Perfect for comprehensive guides

## Manual Usage

You can also run the conversion script directly with custom arguments:

```bash
# Basic conversion (default style)
node scripts/convert-resources-to-pdf.js

# Specify style
node scripts/convert-resources-to-pdf.js --style=book
node scripts/convert-resources-to-pdf.js --style=default
```

## File Structure

```
scripts/
├── convert-resources-to-pdf.js       # Main conversion script
├── pdf-styles.css                    # Default style CSS
├── pdf-styles-book.css               # Book style CSS
├── pdf-header-footer.js              # Default header/footer
├── pdf-header-footer-book.js         # Book header/footer with TOC
└── README-PDF-Conversion.md          # This documentation
```

## Output Comparison

| Feature | Default Style | Book Style |
|---------|---------------|------------|
| Cover Page | ❌ | ✅ SpotKin branded cover |
| Table of Contents | ❌ | ✅ Auto-generated |
| Chapter Numbers | ❌ | ✅ Auto-numbered |
| Page Numbers | ✅ Simple | ✅ Book-style footer |
| Typography | Sans-serif | Serif (Crimson Text) |
| Spacing | Standard | Book-optimized |
| File Size | Smaller | Larger (more features) |

## Customization

### Adding New Styles

1. Create new CSS file: `scripts/pdf-styles-[name].css`
2. Create header/footer: `scripts/pdf-header-footer-[name].js`
3. Add to `stylePresets` in `convert-resources-to-pdf.js`:

```javascript
[name]: {
    cssPath: path.join(__dirname, 'pdf-styles-[name].css'),
    runningsPath: path.join(__dirname, 'pdf-header-footer-[name].js'),
    suffix: '-[name]'
}
```

4. Add npm script in `package.json`:

```json
"convert-to-pdf:[name]": "node scripts/convert-resources-to-pdf.js --style=[name]"
```

### Modifying Existing Styles

- **CSS**: Edit `pdf-styles.css` or `pdf-styles-book.css`
- **Headers/Footers**: Edit corresponding `pdf-header-footer-*.js` files
- **Page Layout**: Modify `@page` rules in CSS
- **Typography**: Change font families and sizes in CSS

## Book Style Features

### Cover Page
- Gradient background with SpotKin branding
- Document title (from first H1)
- Author: "SpotKin Team"
- Current date

### Table of Contents
- Auto-generated from H1, H2, H3 headings
- Chapter and section numbering
- Page break after TOC

### Chapter Formatting
- H1 elements become numbered chapters
- H2 elements get section numbers (1.1, 1.2, etc.)
- Page breaks before each new chapter

### Footer
- Page numbers centered
- "SpotKin Resources" bottom-left
- "spotkin.io" bottom-right

## Tips for Best Results

### Markdown Best Practices
- Use proper heading hierarchy (H1 → H2 → H3)
- Keep H1 titles concise for chapter names
- Use descriptive H2/H3 for table of contents
- Add horizontal rules (`---`) for visual breaks

### Content Optimization
- Long documents work better with book style
- Short documents work better with default style
- Use blockquotes for important callouts
- Lists and checkboxes are styled automatically

### File Management
- Both styles generate separate PDFs for comparison
- Default style replaces existing `.pdf` files
- Book style creates new `-book.pdf` files
- Use `convert-to-pdf:all` to generate both for comparison

## Troubleshooting

### Common Issues
- **Missing fonts**: Book style uses web fonts (requires internet)
- **Large files**: Book style generates larger PDFs due to rich formatting
- **Slow conversion**: Complex documents take longer with book style

### Performance Tips
- Convert individual files for testing: modify script to target specific files
- Use default style for quick previews
- Use book style for final distribution versions

## Examples

The system has been tested with all SpotKin resource files including:
- User guides (temporary-monitoring-guide.md, voice-alerts-guide.md)
- Setup instructions (spotkin-setup-guide-professional.md)
- Marketing materials (fact-sheet.md, press-release-*.md)
- Documentation (README.md)

All files convert successfully in both styles, demonstrating the system's versatility for different document types and use cases.