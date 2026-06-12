<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'DELETE') {
    // Delete a specific credit (the relationship, not the person)
    // We need both title_id and person_id OR just the unique id of the credit record
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        echo json_encode(['error' => 'No ID provided']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM creditables WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $person_id = $data['person_id'] ?? null;
    $title_id = $data['title_id'] ?? null;
    $type = $data['type'] ?? 'title'; // default to title
    $department = $data['department'] ?? '';
    $job = $data['job'] ?? '';
    $character = $data['character'] ?? '';
    $order = $data['order'] ?? 0;

    if (!$person_id || !$title_id) {
        echo json_encode(['error' => 'Missing person_id or title_id']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO creditables (person_id, creditable_id, creditable_type, department, job, `character`, `order`) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$person_id, $title_id, $type, $department, $job, $character, $order]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
} else {
    echo json_encode(['error' => 'Method not allowed']);
}
?>
