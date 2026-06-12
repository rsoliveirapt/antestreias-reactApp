<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';
$method = $_SERVER['REQUEST_METHOD'];

function slugify($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return $text;
}

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM titles WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetch());
    } else {
        $type = $_GET['type'] ?? null;
        $search = $_GET['search'] ?? null;
        
        if ($search) {
            $stmt = $pdo->prepare("SELECT id, name, type, slug, poster, release_date, tmdb_vote_average as rating, local_vote_average, views as page_views, popularity, updated_at, tmdb_id FROM titles WHERE name LIKE ? ORDER BY name ASC LIMIT 50");
            $stmt->execute(["%$search%"]);
            $results = $stmt->fetchAll();
        } else {
            if ($type) {
                $is_series = ($type === 'series') ? 1 : 0;
                $stmt = $pdo->prepare("SELECT id, name, type, slug, poster, release_date, tmdb_vote_average as rating, local_vote_average, views as page_views, popularity, updated_at, tmdb_id FROM titles WHERE is_series = ? OR type = ? ORDER BY id DESC LIMIT 200");
                $stmt->execute([$is_series, $type]);
            } else {
                $stmt = $pdo->query("SELECT id, name, type, slug, poster, release_date, tmdb_vote_average as rating, local_vote_average, views as page_views, popularity, updated_at, tmdb_id FROM titles ORDER BY id DESC LIMIT 300");
            }
            $results = $stmt->fetchAll();
        }
        
        echo json_encode(['titles' => $results]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $type = $data['type'] ?? 'movie';
    $is_series = ($type === 'series') ? 1 : 0;
    $name = $data['name'] ?? 'Novo Título';
    $slug = slugify($name);

    $stmt = $pdo->prepare("INSERT INTO titles (name, slug, description, release_date, poster, backdrop, type, is_series) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $name,
        $slug,
        $data['description'] ?? '',
        $data['release_date'] ?? date('Y-m-d'),
        $data['poster'] ?? '',
        $data['backdrop'] ?? '',
        $type,
        $is_series
    ]);
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $slug = slugify($data['name']);
    $stmt = $pdo->prepare("UPDATE titles SET 
        name=?, slug=?, description=?, release_date=?, poster=?, backdrop=?,
        original_title=?, runtime=?, tagline=?, certification=?, language=?,
        budget=?, revenue=?, popularity=?, tmdb_vote_average=?, tmdb_id=?, imdb_id=?,
        is_series=?
        WHERE id=?");
    $stmt->execute([
        $data['name'], 
        $slug,
        $data['description'] ?? '', 
        $data['release_date'] ?? null, 
        $data['poster'] ?? '', 
        $data['backdrop'] ?? '',
        $data['original_title'] ?? '',
        $data['runtime'] ?? 0,
        $data['tagline'] ?? '',
        $data['certification'] ?? '',
        $data['language'] ?? 'en',
        $data['budget'] ?? 0,
        $data['revenue'] ?? 0,
        $data['popularity'] ?? 0,
        $data['tmdb_vote_average'] ?? 0,
        $data['tmdb_id'] ?? null,
        $data['imdb_id'] ?? '',
        isset($data['is_series']) ? (int)$data['is_series'] : 0,
        $data['id']
    ]);
    echo json_encode(["success" => true]);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM titles WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "No ID provided"]);
    }
}
?>
