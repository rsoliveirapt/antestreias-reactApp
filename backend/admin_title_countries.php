<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $title_id = $data['title_id'] ?? null;
    $country_id = $data['country_id'] ?? null;

    if (!$title_id || !$country_id) {
        echo json_encode(['error' => 'Missing title_id or country_id']);
        exit;
    }

    // Check if already exists
    $check = $pdo->prepare("SELECT 1 FROM country_title WHERE title_id = ? AND production_country_id = ?");
    $check->execute([$title_id, $country_id]);
    if ($check->fetch()) {
        echo json_encode(['success' => true, 'message' => 'Already exists']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO country_title (title_id, production_country_id) VALUES (?, ?)");
    $stmt->execute([$title_id, $country_id]);

    syncTitleCountry($pdo, $title_id);
    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    $title_id = $_GET['title_id'] ?? null;
    $country_id = $_GET['country_id'] ?? null;

    if (!$title_id || !$country_id) {
        echo json_encode(['error' => 'Missing title_id or country_id']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM country_title WHERE title_id = ? AND production_country_id = ?");
    $stmt->execute([$title_id, $country_id]);

    syncTitleCountry($pdo, $title_id);
    echo json_encode(['success' => true]);
}

function syncTitleCountry($pdo, $title_id) {
    // Get all current display_names for this title
    $stmt = $pdo->prepare("SELECT pc.display_name FROM country_title ct JOIN production_countries pc ON ct.production_country_id = pc.id WHERE ct.title_id = ?");
    $stmt->execute([$title_id]);
    $countries = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $countryString = implode(', ', $countries);
    
    // Update titles table
    $upd = $pdo->prepare("UPDATE titles SET country = ? WHERE id = ?");
    $upd->execute([$countryString, $title_id]);
}
?>
