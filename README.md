# Neksha DeSilva Academic Portfolio

A professional academic portfolio website with auto-discovery for articles and publications.

## Features

- **Auto-Discovery System**: Articles are automatically indexed from the `docs` folder (formerly `articles`)
- **Bootstrap Icons**: Professional icon set throughout
- **Dark Mode Default**: With light mode toggle
- **Search Functionality**: Real-time search in toolbar and sidebar
- **Text Highlighting**: Select and highlight important text
- **Magnification**: Increase text size for better readability
- **Fullscreen Mode**: Distraction-free reading
- **Responsive Design**: Works on all devices
- **Wide Reading Layout**: Article pages optimized for comfortable reading (1000px max-width)

## Pages

- **Home** (`index.html`): Main page with auto-loaded article list
- **About** (`about.html`): Personal information and research interests
- **Notes** (`notes.html`): Study notes, resources, and useful links

## How to Add a New Article

### Step 1: Create Article Folder

Create a new folder in the `docs/` directory (you can rename `articles` to `docs` manually):
```
docs/your-article-name/
```

### Step 2: Add Required Files

Each article folder needs two files:

1. **index.html** - Your article content
2. **metadata.json** - Article information for auto-discovery

### Step 3: Create metadata.json

```json
{
  "title": "Your Article Title",
  "description": "Brief description of your article",
  "date": "2025-10-04",
  "category": "machine-learning",
  "tags": ["tag1", "tag2", "tag3"],
  "author": "Neksha DeSilva"
}
```

### Step 4: Register in articles-config.json

Add your article folder name to the `articles` array in `articles-config.json`:

```json
{
  "articles": [
    "neural-network-architectures",
    "mathematical-foundations-deep-learning",
    "your-new-article-name"
  ],
  "baseFolder": "docs"
}
```

### That's It!

Your article will automatically appear on the homepage and in search results!

## To Rename `articles` to `docs`

**Manually rename the folder** from `articles` to `docs` in your file explorer. The config file (`articles-config.json`) is already updated with `"baseFolder": "docs"`.

## Article Template

Copy the structure from `docs/neural-network-architectures/index.html` for a complete template with:
- Bootstrap Icons (consistent toolbar)
- MathJax for equations
- Code blocks with syntax highlighting
- Proper styling with wide, comfortable reading layout
- Fixed header padding and alignment

## Project Structure

```
nekshadesilva.com/
├── index.html              # Homepage with auto-loaded articles
├── about.html              # About page
├── notes.html              # Notes and resources
├── style.css               # Global styles
├── script.js               # Auto-discovery & features
├── articles-config.json    # List of article folders
├── docs/                   # All articles (rename from 'articles')
│   ├── article-name/
│   │   ├── index.html
│   │   ├── metadata.json
│   │   ├── article-style.css (shared)
│   │   └── [images, assets...]
│   └── ...
└── assets/                 # Global assets
```

## Article Page Improvements

### Wider Layout
- Articles now use **1000px max-width** (up from 800px) for comfortable reading
- Content area has **4rem padding** for better spacing
- Responsive design maintains readability on all screen sizes

### Fixed Header Styling
- Article headers now have proper padding and alignment
- Background color separates header from content
- No border conflicts - clean, professional appearance

### Consistent Toolbar
All pages now have the **exact same toolbar**:
- Search (with dropdown)
- Text highlighting
- Magnification
- Fullscreen
- Theme toggle

Using **Bootstrap Icons** throughout for a professional look.

## Color Scheme

### Dark Mode (Default)
- Background: Pure black (#000000)
- Text: Old paper white (#f4f1e8)
- Highlights: Neon green (#00ff41)
- Links: Red (#ff4444)

### Light Mode
- Background: Old paper white (#f4f1e8)
- Text: Black (#1a1a1a)
- Highlights: Neon blue (#0088ff)
- Links: Blue (#0066cc)

---

**Last Updated**: October 4, 2025  
**Author**: Neksha DeSilva
