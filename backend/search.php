<?php
require 'headers.php';
require 'db.php';

$q = $_GET['q'] ?? '';

if (strlen($q) < 2) {
    echo json_encode([]);
    exit;
}

$lang = $_GET['lang'] ?? 'pt';
$searchTerm = '%' . $q . '%';

// Titles search
$stmt = $pdo->prepare("SELECT id, name, name_en, slug, type, release_date, poster, popularity FROM titles WHERE name LIKE ? OR name_en LIKE ? OR original_title LIKE ? ORDER BY popularity DESC LIMIT 5");
$stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
$titles = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($titles as &$t) {
    if ($lang === 'en' && !empty($t['name_en'])) {
        $t['name'] = $t['name_en'];
    }
}
unset($t);

// People search
$personStmt = $pdo->prepare("SELECT id, name, poster, slug, 'person' as type, popularity FROM people WHERE name LIKE ? ORDER BY popularity DESC LIMIT 3");
$personStmt->execute([$searchTerm]);
$people = $personStmt->fetchAll(PDO::FETCH_ASSOC);

// Users search
$userStmt = $pdo->prepare("SELECT id, username, first_name, last_name, avatar as poster, 'user' as type, 0 as popularity FROM users WHERE username LIKE ? OR first_name LIKE ? OR last_name LIKE ? LIMIT 3");
$userStmt->execute([$searchTerm, $searchTerm, $searchTerm]);
$users = $userStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as &$u) {
    $fullName = trim(($u['first_name'] ?? '') . ' ' . ($u['last_name'] ?? ''));
    $u['name'] = !empty($fullName) ? $fullName . ' (@' . $u['username'] . ')' : '@' . $u['username'];
    $u['slug'] = '@' . $u['username'];
}
unset($u);

// Combine and sort by popularity
$results = array_merge($titles, $people, $users);
usort($results, function($a, $b) {
    return ($b['popularity'] ?? 0) <=> ($a['popularity'] ?? 0);
});

echo json_encode($results);
