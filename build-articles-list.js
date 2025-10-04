#!/usr/bin/env node
/**
 * Build Script: Generate articles-list.json for static hosting
 * 
 * This script scans the docs/ folder and generates a static JSON file
 * that can be used on GitHub Pages or any static hosting platform.
 * 
 * Run this script before deploying:
 *   node build-articles-list.js
 * 
 * Or add to package.json:
 *   "scripts": {
 *     "build": "node build-articles-list.js"
 *   }
 */

const fs = require('fs');
const path = require('path');

const baseFolder = path.join(__dirname, 'docs');
const outputFile = path.join(__dirname, 'articles-list.json');

function buildArticlesList() {
    const articles = [];
    
    if (!fs.existsSync(baseFolder)) {
        console.error('❌ Error: docs/ folder not found');
        process.exit(1);
    }
    
    console.log('🔍 Scanning docs/ folder for articles...\n');
    
    try {
        const folders = fs.readdirSync(baseFolder);
        
        folders.forEach(folder => {
            const folderPath = path.join(baseFolder, folder);
            
            if (!fs.statSync(folderPath).isDirectory()) {
                return;
            }
            
            const metadataPath = path.join(folderPath, 'metadata.json');
            
            if (fs.existsSync(metadataPath)) {
                try {
                    const metadataContent = fs.readFileSync(metadataPath, 'utf8');
                    const metadata = JSON.parse(metadataContent);
                    
                    if (metadata && metadata.title) {
                        metadata.folder = folder;
                        metadata.url = `./docs/${folder}/`;
                        articles.push(metadata);
                        console.log(`  ✓ Found: ${metadata.title}`);
                    }
                } catch (error) {
                    console.error(`  ✗ Error loading ${folder}/metadata.json:`, error.message);
                }
            } else {
                console.log(`  ⚠ Skipped: ${folder}/ (no metadata.json)`);
            }
        });
        
        // Sort by date (newest first)
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const output = {
            success: true,
            baseFolder: 'docs',
            articles: articles,
            count: articles.length,
            generated: new Date().toISOString()
        };
        
        // Write to file
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8');
        
        console.log(`\n✅ Successfully generated articles-list.json`);
        console.log(`📊 Total articles: ${articles.length}`);
        console.log(`📝 Output: ${outputFile}\n`);
        
        return output;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the build
buildArticlesList();
