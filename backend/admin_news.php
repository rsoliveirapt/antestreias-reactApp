<?php
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM news WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
    } else {
        $stmt = $pdo->query("SELECT * FROM news ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("INSERT INTO news (title, slug, body, image, source, source_url, byline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['title'],
        $data['slug'],
        $data['body'],
        $data['image'] ?? null,
        $data['source'] ?? null,
        $data['source_url'] ?? null,
        $data['byline'] ?? null,
        $data['status'] ?? 'published'
    ]);
    echo json_encode(['id' => $pdo->lastInsertId()]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("UPDATE news SET title=?, slug=?, body=?, image=?, source=?, source_url=?, byline=?, status=? WHERE id=?");
    $stmt->execute([
        $data['title'],
        $data['slug'],
        $data['body'],
        $data['image'] ?? null,
        $data['source'] ?? null,
        $data['source_url'] ?? null,
        $data['byline'] ?? null,
        $data['status'] ?? 'published',
        $data['id']
    ]);
    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM news WHERE id=?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}
?>
