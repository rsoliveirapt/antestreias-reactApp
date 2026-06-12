<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';
require 'tmdb_helper.php';

$id = $_GET['id'] ?? null;
if (!$id) { echo json_encode(['error' => 'No local ID provided']); exit; }

// Get TMDB ID from local database
$stmt = $pdo->prepare("SELECT tmdb_id FROM people WHERE id = ?");
$stmt->execute([$id]);
$person = $stmt->fetch();

if (!$person || !$person['tmdb_id']) {
    echo json_encode(['error' => 'No TMDB ID found for this person']);
    exit;
}

$tmdb_id = $person['tmdb_id'];

// Fetch from TMDB
$language_setting = get_setting($pdo, 'tmdb.language', 'pt-PT');
$primaryLanguage = ($language_setting === 'bilingual') ? 'pt-PT' : $language_setting;
$data = fetchTMDB("person/$tmdb_id", ['language' => $primaryLanguage, 'append_to_response' => 'combined_credits']);

if (!$data || isset($data['status_code'])) {
    // Try without language if primary fails
    $data = fetchTMDB("person/$tmdb_id", ['append_to_response' => 'combined_credits']);
}

if (!$data || isset($data['status_code'])) {
    echo json_encode(['error' => 'Failed to fetch from TMDB']);
    exit;
}

// Fetch English version
$biography_en = '';

if ($language_setting === 'bilingual') {
    $engData = fetchTMDB("person/$tmdb_id", ['language' => 'en-US']);
    if ($engData && !isset($engData['status_code'])) {
        $biography_en = $engData['biography'] ?? '';
    }
} elseif (stripos($language_setting, 'en') === 0) {
    $biography_en = $data['biography'] ?? '';
}

// Update person details
$stmt = $pdo->prepare("UPDATE people SET 
    name = ?, 
    poster = ?, 
    biography = ?, 
    biography_en = ?,
    birthday = ?, 
    place_of_birth = ?, 
    popularity = ?, 
    imdb_id = ?,
    known_for_department = ?,
    gender = ?,
    homepage = ?,
    deathday = ?,
    slug = ?,
    fully_synced = 1
    WHERE id = ?");

$poster = $data['profile_path'] ? "https://image.tmdb.org/t/p/w600_and_h900_bestv2" . $data['profile_path'] : null;
$slug = create_slug($data['name'] ?? '');

$stmt->execute([
    $data['name'],
    $poster,
    $data['biography'],
    $biography_en,
    $data['birthday'],
    $data['place_of_birth'],
    $data['popularity'],
    $data['imdb_id'],
    $data['known_for_department'],
    $data['gender'],
    $data['homepage'],
    $data['deathday'],
    $slug,
    $id
]);

// Optionally update credits (this might be slow, but useful)
if (!empty($data['combined_credits']['cast'])) {
    // Only update credits for titles that ALREADY exist in our database
    foreach ($data['combined_credits']['cast'] as $cast) {
        $tmdb_title_id = $cast['id'] ?? null;
        $media_type = $cast['media_type'] ?? 'movie'; // movie or tv
        
        if (!$tmdb_title_id) continue;

        // Map 'tv' to 'series' for our database
        $type = ($media_type === 'tv') ? 'series' : 'movie';
        
        // Find title in local DB
        $tStmt = $pdo->prepare("SELECT id FROM titles WHERE tmdb_id = ? AND type = ?");
        $tStmt->execute([$tmdb_title_id, $type]);
        $title = $tStmt->fetch();
        
        if ($title) {
            $local_title_id = $title['id'];
            $character = $cast['character'] ?? '';
            // Check if credit already exists
            $cStmt = $pdo->prepare("SELECT id FROM creditables WHERE creditable_id = ? AND creditable_type = 'title' AND person_id = ? AND `character` = ?");
            $cStmt->execute([$local_title_id, $id, $character]);
            if (!$cStmt->fetch()) {
                $ins = $pdo->prepare("INSERT INTO creditables (creditable_id, creditable_type, person_id, `character`, `order`, department) VALUES (?, 'title', ?, ?, ?, 'Acting')");
                $ins->execute([$local_title_id, $id, $character, $cast['order'] ?? 0]);
            }
        }
    }
}

echo json_encode(['success' => true]);
?>
