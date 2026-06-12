<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $title_id = $data['title_id'] ?? null;
    $category_id = $data['category_id'] ?? null;

    if (!$title_id || !$category_id) {
        echo json_encode(['error' => 'Missing title_id or category_id']);
        exit;
    }

    // Check if already exists
    $check = $pdo->prepare("SELECT 1 FROM genre_title WHERE title_id = ? AND genre_id = ?");
    $check->execute([$title_id, $category_id]);
    if ($check->fetch()) {
        echo json_encode(['success' => true, 'message' => 'Already exists']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO genre_title (title_id, genre_id) VALUES (?, ?)");
    $stmt->execute([$title_id, $category_id]);

    syncTitleCategory($pdo, $title_id);
    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    $title_id = $_GET['title_id'] ?? null;
    $category_id = $_GET['category_id'] ?? null;

    if (!$title_id || !$category_id) {
        echo json_encode(['error' => 'Missing title_id or category_id']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM genre_title WHERE title_id = ? AND genre_id = ?");
    $stmt->execute([$title_id, $category_id]);

    syncTitleCategory($pdo, $title_id);
    echo json_encode(['success' => true]);
}

function syncTitleCategory($pdo, $title_id) {
    // Get all current display_names for this title
    $stmt = $pdo->prepare("SELECT g.display_name FROM genre_title gt JOIN genres g ON gt.genre_id = g.id WHERE gt.title_id = ?");
    $stmt->execute([$title_id]);
    $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $categoryString = implode(', ', $categories);
    
    // Update titles table
    $upd = $pdo->prepare("UPDATE titles SET genre = ? WHERE id = ?");
    $upd->execute([$categoryString, $title_id]);
}
?>
