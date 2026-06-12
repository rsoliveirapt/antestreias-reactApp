<?php
require 'headers.php';
require 'db.php';
require_once 'functions.php';
track_visitor($pdo);

$lang = $_GET['lang'] ?? 'pt';

$stmt = $pdo->query("SELECT id, name, name_en, original_title, slug, description, description_en, tagline_en, release_date, poster, backdrop, type, is_series, tmdb_vote_average, local_vote_average, tmdb_vote_average as rating, runtime, budget, revenue, genre, country, language, certification, created_at, popularity FROM titles ORDER BY popularity DESC LIMIT 350");
$movies = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Ensure values are numeric if they exist
foreach ($movies as &$m) {
    if ($m['tmdb_vote_average'] !== null) $m['tmdb_vote_average'] = (float)$m['tmdb_vote_average'];
    if ($m['local_vote_average'] !== null) $m['local_vote_average'] = (float)$m['local_vote_average'];
    if ($m['runtime'] !== null) $m['runtime'] = (int)$m['runtime'];
    if ($m['budget'] !== null) $m['budget'] = (int)$m['budget'];
    if ($m['revenue'] !== null) $m['revenue'] = (int)$m['revenue'];
    if ($m['popularity'] !== null) $m['popularity'] = (float)$m['popularity'];

    if ($lang === 'en') {
        if (!empty($m['name_en'])) $m['name'] = $m['name_en'];
        if (!empty($m['description_en'])) $m['description'] = $m['description_en'];
        if (!empty($m['tagline_en'])) $m['tagline'] = $m['tagline_en'];
    }
}
unset($m);

if ($lang === 'en' && !empty($movies)) {
    $movieIds = array_column($movies, 'id');
    $inClause = implode(',', array_fill(0, count($movieIds), '?'));
    $gStmt = $pdo->prepare("SELECT gt.title_id, g.display_name_en FROM genre_title gt JOIN genres g ON gt.genre_id = g.id WHERE gt.title_id IN ($inClause)");
    $gStmt->execute($movieIds);
    $en_genres = [];
    while ($row = $gStmt->fetch(PDO::FETCH_ASSOC)) {
        $en_genres[$row['title_id']][] = $row['display_name_en'];
    }
    foreach ($movies as &$m) {
        if (isset($en_genres[$m['id']])) {
            $m['genre'] = implode(', ', $en_genres[$m['id']]);
        }
    }
    unset($m);
}

echo json_encode($movies);
