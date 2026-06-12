<?php
require 'headers.php';
require 'db.php';

$baseUrl = get_setting($pdo, 'base_url', 'http://localhost:5174');

// Ensure directory exists
$dir = '../public/storage/sitemaps';
if (!is_dir($dir)) {
    mkdir($dir, 0777, true);
}

// Fetch titles
$stmt = $pdo->query("SELECT id FROM titles ORDER BY created_at DESC");
$titles = $stmt->fetchAll();

$xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// Home
$xml .= '  <url>' . "\n";
$xml .= '    <loc>' . $baseUrl . '/</loc>' . "\n";
$xml .= '    <changefreq>daily</changefreq>' . "\n";
$xml .= '    <priority>1.0</priority>' . "\n";
$xml .= '  </url>' . "\n";

// Titles
foreach ($titles as $title) {
    $xml .= '  <url>' . "\n";
    $xml .= '    <loc>' . $baseUrl . '/movie/' . $title['id'] . '</loc>' . "\n";
    $xml .= '    <changefreq>weekly</changefreq>' . "\n";
    $xml .= '    <priority>0.8</priority>' . "\n";
    $xml .= '  </url>' . "\n";
}

$xml .= '</urlset>';

file_put_contents($dir . '/sitemap-index.xml', $xml);

echo json_encode(['success' => true, 'url' => $baseUrl . '/storage/sitemaps/sitemap-index.xml']);
?>
