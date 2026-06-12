<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$slug = $_GET['slug'] ?? null;
if (!$slug) { echo json_encode(['error' => 'No slug']); exit; }

// Get category info
$stmt = $pdo->prepare("SELECT * FROM genres WHERE name = ?");
$stmt->execute([$slug]);
$category = $stmt->fetch();

if (!$category) { echo json_encode(['error' => 'Category not found']); exit; }

// Get titles
$stmt = $pdo->prepare("SELECT t.* FROM titles t 
    JOIN genre_title gt ON t.id = gt.title_id 
    WHERE gt.genre_id = ? 
    ORDER BY t.release_date DESC");
$stmt->execute([$category['id']]);
$titles = $stmt->fetchAll(PDO::FETCH_ASSOC);

$lang = $_GET['lang'] ?? 'pt';
if ($lang === 'en') {
    if (!empty($category['display_name_en'])) {
        $category['display_name'] = $category['display_name_en'];
    }
    
    if (!empty($titles)) {
        $titleIds = array_column($titles, 'id');
        $inClause = implode(',', array_fill(0, count($titleIds), '?'));
        $gStmt = $pdo->prepare("SELECT gt.title_id, g.display_name_en FROM genre_title gt JOIN genres g ON gt.genre_id = g.id WHERE gt.title_id IN ($inClause)");
        $gStmt->execute($titleIds);
        $en_genres = [];
        while ($row = $gStmt->fetch(PDO::FETCH_ASSOC)) {
            $en_genres[$row['title_id']][] = $row['display_name_en'];
        }
        
        foreach ($titles as &$t) {
            if (!empty($t['name_en'])) $t['name'] = $t['name_en'];
            if (!empty($t['description_en'])) $t['description'] = $t['description_en'];
            if (!empty($t['tagline_en'])) $t['tagline'] = $t['tagline_en'];
            if (isset($en_genres[$t['id']])) {
                $t['genre'] = implode(', ', $en_genres[$t['id']]);
            }
        }
        unset($t);
    }
} else {
    foreach ($titles as &$t) {
        // Normal PT mapping
    }
    unset($t);
}

echo json_encode([
    'category' => $category,
    'titles' => $titles
]);
?>
