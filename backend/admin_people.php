<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        // Single person details
        $id = $_GET['id'];
        $stmt = $pdo->prepare("SELECT * FROM people WHERE id = ?");
        $stmt->execute([$id]);
        $person = $stmt->fetch();
        
        if (!$person) {
            echo json_encode(['error' => 'Not found']);
            exit;
        }
        
        // Credits history
        $creditStmt = $pdo->prepare("SELECT c.creditable_id as title_id, c.creditable_type, c.character, c.job, t.name as title_name, t.poster as title_poster, t.release_date, t.type
            FROM creditables c 
            JOIN titles t ON c.creditable_id = t.id 
            WHERE c.person_id = ? AND c.creditable_type = 'title'
            ORDER BY t.release_date DESC");
        $creditStmt->execute([$id]);
        $credits = $creditStmt->fetchAll();
        
        echo json_encode([
            'person' => $person,
            'credits' => $credits
        ]);
    } else {
        // List people
        $search = $_GET['search'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $limit = 20;
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT * FROM people";
        $params = [];
        if ($search) {
            $query .= " WHERE name LIKE ?";
            $params[] = "%$search%";
        }
        $query .= " ORDER BY popularity DESC LIMIT $limit OFFSET $offset";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $people = $stmt->fetchAll();
        
        // Total count
        $countQuery = "SELECT COUNT(*) FROM people";
        if ($search) $countQuery .= " WHERE name LIKE ?";
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();
        
        echo json_encode([
            'people' => $people,
            'total' => $total,
            'page' => $page,
            'pages' => ceil($total / $limit)
        ]);
    }
} elseif ($method === 'POST') {
    // Create person
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['name'])) { echo json_encode(['error' => 'Nome é obrigatório']); exit; }
    
    // Generate slug from name
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['name'])));
    
    $stmt = $pdo->prepare("INSERT INTO people (name, poster, biography, birthday, place_of_birth, popularity, imdb_id, slug, tmdb_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['name'],
        $data['poster'] ?? null,
        $data['biography'] ?? null,
        $data['birthday'] ?? null,
        $data['place_of_birth'] ?? null,
        $data['popularity'] ?? 0,
        $data['imdb_id'] ?? null,
        $slug,
        $data['tmdb_id'] ?? null
    ]);
    
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
} elseif ($method === 'PUT') {
    // Update person
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    if (!$id) { echo json_encode(['error' => 'No ID']); exit; }
    
    $stmt = $pdo->prepare("UPDATE people SET 
        name = ?, 
        poster = ?, 
        biography = ?, 
        birthday = ?, 
        place_of_birth = ?, 
        popularity = ?, 
        imdb_id = ?
        WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $data['poster'],
        $data['biography'],
        $data['birthday'],
        $data['place_of_birth'],
        $data['popularity'],
        $data['imdb_id'],
        $id
    ]);
    
    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    if (isset($_GET['all']) && $_GET['all'] === 'true') {
        // Delete all credits first to maintain integrity
        $pdo->exec("DELETE FROM creditables WHERE creditable_type = 'title'");
        // Delete all people
        $pdo->exec("DELETE FROM people");
        echo json_encode(['success' => true, 'message' => 'All celebrities deleted']);
        exit;
    }

    $id = $_GET['id'] ?? null;
    if (!$id) { echo json_encode(['error' => 'No ID']); exit; }
    
    // Delete credits first
    $stmt = $pdo->prepare("DELETE FROM creditables WHERE person_id = ?");
    $stmt->execute([$id]);
    
    // Delete person
    $stmt = $pdo->prepare("DELETE FROM people WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true]);
}
?>
