<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';
require 'functions.php';
require 'tmdb_helper.php';

$id = $_GET['id'] ?? null;
if (!$id) { echo json_encode(["error" => "No ID provided"]); exit; }

// Try to fetch by ID first if numeric, otherwise try to match name via slug logic
if (is_numeric($id)) {
    $stmt = $pdo->prepare("SELECT * FROM titles WHERE id = ?");
    $stmt->execute([$id]);
} else {
    // Search by the professional slug column
    $stmt = $pdo->prepare("SELECT * FROM titles WHERE slug = ? LIMIT 1");
    $stmt->execute([$id]);
}
$movie = $stmt->fetch();

if ($movie) {
    $id = $movie['id']; // Ensure we use the real ID for the rest of the script

    // Increment views
    $pdo->prepare("UPDATE titles SET views = views + 1 WHERE id = ?")->execute([$id]);
    
    $automation = get_setting($pdo, 'content.title_automation', 'false');
    
    // Check if we have videos
    $vStmt = $pdo->prepare("SELECT COUNT(*) FROM videos WHERE title_id = ?");
    $vStmt->execute([$id]);
    $videoCount = $vStmt->fetchColumn();

    // If automation is ON and movie is not synced OR was updated more than 7 days ago OR has NO videos
    $needsUpdate = !$movie['fully_synced'] || (strtotime($movie['updated_at']) < strtotime('-7 days')) || ($videoCount == 0);
    
    if ($automation === 'true' && $movie['tmdb_id'] && $needsUpdate) {
        if (sync_title_from_tmdb($pdo, $movie['tmdb_id'], $movie['type'])) {
            // Re-fetch updated movie
            $stmt->execute([$id]);
            $movie = $stmt->fetch();
        }
    }
}

$lang = $_GET['lang'] ?? 'pt';
if ($movie) {
    if ($lang === 'en') {
        if (!empty($movie['name_en'])) $movie['name'] = $movie['name_en'];
        if (!empty($movie['description_en'])) $movie['description'] = $movie['description_en'];
        if (!empty($movie['tagline_en'])) $movie['tagline'] = $movie['tagline_en'];
        
        $gStmt = $pdo->prepare("SELECT g.display_name_en FROM genre_title gt JOIN genres g ON gt.genre_id = g.id WHERE gt.title_id = ?");
        $gStmt->execute([$movie['id']]);
        $en_genres = $gStmt->fetchAll(PDO::FETCH_COLUMN);
        if (!empty($en_genres)) {
            $movie['genre'] = implode(', ', $en_genres);
        }
    }
}

echo json_encode($movie);
