<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Title search for add-video modal
    if (isset($_GET['mode']) && $_GET['mode'] === 'search_titles') {
        $search = $_GET['search'] ?? '';
        $stmt = $pdo->prepare("SELECT id, name, type FROM titles WHERE name LIKE ? ORDER BY name ASC LIMIT 10");
        $stmt->execute(["%$search%"]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }

    $search = $_GET['search'] ?? '';
    
    $query = "SELECT v.*, t.name as title_name, t.type as title_type, t.poster as title_poster, t.backdrop as title_backdrop 
              FROM videos v 
              LEFT JOIN titles t ON v.title_id = t.id";
    
    if ($search) {
        $query .= " WHERE v.name LIKE :search OR t.name LIKE :search";
        $stmt = $pdo->prepare($query);
        $stmt->execute(['search' => "%$search%"]);
    } else {
        $query .= " ORDER BY v.created_at DESC";
        $stmt = $pdo->query($query);
    }
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['toggle_status'])) {
        $id = $data['toggle_status'];
        $stmt = $pdo->prepare("UPDATE videos SET approved = 1 - approved WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    if (isset($data['bulk_delete'])) {
        $ids = $data['bulk_delete'];
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("DELETE FROM videos WHERE id IN ($placeholders)");
        $stmt->execute($ids);
        echo json_encode(['success' => true]);
        exit;
    }

    if (isset($data['action']) && $data['action'] === 'create') {
        $title_id = $data['title_id'] ?? null;
        $name     = trim($data['name'] ?? '');
        $src      = trim($data['src'] ?? '');
        $category = $data['category'] ?? 'trailer';
        $type     = $data['type'] ?? 'embed';

        if (!$title_id || !$name || !$src) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Campos obrigatórios em falta']);
            exit;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO videos (title_id, name, src, category, type, approved, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())"
        );
        $stmt->execute([$title_id, $name, $src, $category, $type]);
        $newId = $pdo->lastInsertId();

        $stmt2 = $pdo->prepare(
            "SELECT v.*, t.name as title_name, t.type as title_type, t.poster as title_poster, t.backdrop as title_backdrop
             FROM videos v LEFT JOIN titles t ON v.title_id = t.id WHERE v.id = ?"
        );
        $stmt2->execute([$newId]);
        echo json_encode(['success' => true, 'video' => $stmt2->fetch(PDO::FETCH_ASSOC)]);
        exit;
    }
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM videos WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'ID missing']);
    }
    exit;
}
?>

