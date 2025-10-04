#!/usr/bin/env node
/**
 * Auto-discovery script for articles (Node.js version)
 * Scans the docs/ folder and returns all articles with valid metadata.json
 * 
 * Usage:
 * 1. As a standalone script: node discover-articles.js
 * 2. As an Express.js endpoint (see example below)
 */

const fs = require('fs');
const path = require('path');

function discoverArticles() {
    const baseFolder = path.join(__dirname, 'docs');
    const articles = [];
    
    if (!fs.existsSync(baseFolder)) {
        return {
            error: 'Docs folder not found',
            articles: []
        };
    }
    
    try {
        // Read all items in docs folder
        const folders = fs.readdirSync(baseFolder);
        
        folders.forEach(folder => {
            const folderPath = path.join(baseFolder, folder);
            
            // Check if it's a directory
            if (!fs.statSync(folderPath).isDirectory()) {
                return;
            }
            
            // Check for metadata.json
            const metadataPath = path.join(folderPath, 'metadata.json');
            
            if (fs.existsSync(metadataPath)) {
                try {
                    const metadataContent = fs.readFileSync(metadataPath, 'utf8');
                    const metadata = JSON.parse(metadataContent);
                    
                    if (metadata && metadata.title) {
                        metadata.folder = folder;
                        metadata.url = `./docs/${folder}/`;
                        articles.push(metadata);
                    }
                } catch (error) {
                    console.error(`Error loading ${metadataPath}:`, error.message);
                }
            }
        });
        
        // Sort by date (newest first)
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return {
            success: true,
            baseFolder: 'docs',
            articles: articles,
            count: articles.length
        };
        
    } catch (error) {
        return {
            error: error.message,
            articles: []
        };
    }
}

// If run directly (not imported as module)
if (require.main === module) {
    const result = discoverArticles();
    console.log(JSON.stringify(result, null, 2));
}

// Export for use in Express.js or other Node apps
module.exports = { discoverArticles };

/* 
 * Example Express.js integration:
 * 
 * const express = require('express');
 * const { discoverArticles } = require('./discover-articles.js');
 * 
 * const app = express();
 * 
 * app.get('/api/articles', (req, res) => {
 *     res.json(discoverArticles());
 * });
 * 
 * app.listen(3000, () => {
 *     console.log('Server running on http://localhost:3000');
 * });
 */
