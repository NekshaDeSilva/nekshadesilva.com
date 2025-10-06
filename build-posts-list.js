const fs = require('fs');
const path = require('path');

// ============================================
// Posts List Builder
// Scans /posts/ folder and generates posts-list.json
// ============================================

const POSTS_FOLDER = 'posts';
const OUTPUT_FILE = path.join(POSTS_FOLDER, 'posts-list.json');

console.log('🔍 Scanning posts/ folder for posts...\n');

// Get all directories in the posts folder
const postFolders = fs.readdirSync(POSTS_FOLDER, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const posts = [];

// Read metadata from each post folder
for (const folder of postFolders) {
    const metadataPath = path.join(POSTS_FOLDER, folder, 'metadata.json');
    const indexPath = path.join(POSTS_FOLDER, folder, 'index.html');
    
    // Check if both metadata.json and index.html exist
    if (fs.existsSync(metadataPath) && fs.existsSync(indexPath)) {
        try {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            
            const post = {
                ...metadata,
                folder: folder,
                url: `./${folder}/`,
            };
            
            posts.push(post);
            console.log(`✓ Found: ${metadata.title}`);
        } catch (error) {
            console.error(`✗ Error reading ${folder}/metadata.json:`, error.message);
        }
    } else {
        console.log(`⊘ Skipped: ${folder} (missing metadata.json or index.html)`);
    }
}

// Sort posts by date (newest first)
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Generate output JSON
const output = {
    success: true,
    posts: posts,
    generated: new Date().toISOString(),
    count: posts.length
};

// Write to file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

console.log('\n✅ Successfully generated posts-list.json');
console.log(`📊 Total posts: ${posts.length}`);
console.log(`📝 Output: ${path.resolve(OUTPUT_FILE)}`);
