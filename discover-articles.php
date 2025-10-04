<?php
/**
 * Auto-discovery script for articles
 * Scans the docs/ folder and returns all articles with valid metadata.json
 * This eliminates the need to manually update articles-config.json
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$baseFolder = __DIR__ . '/docs';
$articles = [];

if (!is_dir($baseFolder)) {
    echo json_encode(['error' => 'Docs folder not found', 'articles' => []]);
    exit;
}

// Scan docs folder for subdirectories
$folders = array_diff(scandir($baseFolder), array('.', '..'));

foreach ($folders as $folder) {
    $folderPath = $baseFolder . '/' . $folder;
    
    // Check if it's a directory
    if (!is_dir($folderPath)) {
        continue;
    }
    
    // Check if metadata.json exists
    $metadataPath = $folderPath . '/metadata.json';
    if (file_exists($metadataPath)) {
        $metadataContent = file_get_contents($metadataPath);
        $metadata = json_decode($metadataContent, true);
        
        if ($metadata && isset($metadata['title'])) {
            $metadata['folder'] = $folder;
            $metadata['url'] = './docs/' . $folder . '/';
            $articles[] = $metadata;
        }
    }
}

// Sort by date (newest first)
usort($articles, function($a, $b) {
    return strtotime($b['date']) - strtotime($a['date']);
});

echo json_encode([
    'success' => true,
    'baseFolder' => 'docs',
    'articles' => $articles,
    'count' => count($articles)
]);
?>
