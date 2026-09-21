<?php
/**
 * Export script for GitHub Pages (github.io)
 * Generates data/fpl_data.json and index.html
 */

require_once __DIR__ . '/api/fpl_service.php';

echo "Fetching fresh enriched FPL data...\n";
$data = FPLService::getEnrichedData(true);

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0777, true);
}

// 1. Save data/fpl_data.json
$jsonPath = $dataDir . '/fpl_data.json';
file_put_contents($jsonPath, json_encode($data, JSON_PRETTY_PRINT));
echo "Saved: " . $jsonPath . " (" . round(filesize($jsonPath) / 1024, 1) . " KB)\n";

// 2. Generate index.html from index.php
$indexPhp = file_get_contents(__DIR__ . '/index.php');
// Replace any php references if needed
file_put_contents(__DIR__ . '/index.html', $indexPhp);
echo "Generated static: index.html (" . round(filesize(__DIR__ . '/index.html') / 1024, 1) . " KB)\n";

echo "Export completed successfully for GitHub Pages!\n";
