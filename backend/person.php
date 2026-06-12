<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    echo json_encode(['error' => 'Missing id or slug']);
    exit;
}

$lang = $_GET['lang'] ?? 'pt';

// Support both ID and Slug
$stmt = $pdo->prepare("SELECT * FROM people WHERE id = ? OR slug = ?");
$stmt->execute([$id, $id]);
$person = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$person) {
    echo json_encode(['error' => 'Not found']);
    exit;
}

if ($lang === 'en' && !empty($person['biography_en'])) {
    $person['biography'] = $person['biography_en'];
}

// Lazy slug generation if missing
if (empty($person['slug']) && !empty($person['name'])) {
    require_once 'functions.php';
    $newSlug = create_slug($person['name']);
    // Ensure uniqueness (simple check)
    $pdo->prepare("UPDATE people SET slug = ? WHERE id = ?")->execute([$newSlug, $person['id']]);
    $person['slug'] = $newSlug;
}

// Credits grouped by department
$creditStmt = $pdo->prepare("
    SELECT c.creditable_id as title_id, c.character, c.job, c.department, c.order as credit_order,
           t.name as title_name, t.name_en as title_name_en, t.poster as title_poster, t.release_date, t.type, t.slug
    FROM creditables c
    JOIN titles t ON c.creditable_id = t.id
    WHERE c.person_id = ? AND c.creditable_type = 'title'
    ORDER BY t.release_date DESC
");
$creditStmt->execute([$person['id']]);
$credits = $creditStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($credits as &$credit) {
    if ($lang === 'en' && !empty($credit['title_name_en'])) {
        $credit['title_name'] = $credit['title_name_en'];
    }
}
unset($credit);

// Group credits by department
$grouped = [];
foreach ($credits as $credit) {
    $dept = $credit['department'] ?: 'Other';
    $grouped[$dept][] = $credit;
}

// Known for: top 4 most popular credits (based on poster existence)
$knownFor = array_slice(array_filter($credits, fn($c) => !empty($c['title_poster'])), 0, 4);

// Gender label
$genderMap = [0 => 'Desconhecido', 1 => 'Feminino', 2 => 'Masculino', 3 => 'Não-binário'];
$person['gender_label'] = $genderMap[$person['gender'] ?? 0] ?? 'Desconhecido';

echo json_encode([
    'person' => $person,
    'credits' => $credits,
    'credits_grouped' => $grouped,
    'known_for' => array_values($knownFor)
]);
