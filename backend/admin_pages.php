<?php
require_once 'headers.php';
require_once 'db.php';

// Auto-setup table if not exists
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS custom_pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content LONGTEXT,
        owner VARCHAR(100) DEFAULT 'default',
        type VARCHAR(100) DEFAULT 'default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Ensure columns exist if table was created older
    $pdo->exec("ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS content LONGTEXT");
    $pdo->exec("ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS owner VARCHAR(100) DEFAULT 'default'");
    $pdo->exec("ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS type VARCHAR(100) DEFAULT 'default'");
    $pdo->exec("ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS title_en VARCHAR(255) DEFAULT NULL");
    $pdo->exec("ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS content_en LONGTEXT DEFAULT NULL");

    // Seed privacy-policy and cookies if not present
    $checkPriv = $pdo->query("SELECT id FROM custom_pages WHERE slug = 'privacy-policy'")->fetch();
    if (!$checkPriv) {
        $pdo->exec("INSERT INTO custom_pages (title, title_en, slug, content, content_en, owner, type) VALUES ('Política de Privacidade', 'Privacy Policy', 'privacy-policy', '<h2>1. Informações Gerais e Compromisso de Privacidade</h2><p>O Antestreias compromete-se a proteger a privacidade e os dados pessoais de todos os utilizadores da nossa plataforma, em strita conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).</p>', '<h2>1. General Information and Privacy Commitment</h2><p>Antestreias is committed to protecting the privacy and personal data of all users of our platform, in strict compliance with the General Data Protection Regulation (GDPR).</p>', 'Antestreias', 'Institucional')");
    }
    $checkCook = $pdo->query("SELECT id FROM custom_pages WHERE slug = 'cookies'")->fetch();
    if (!$checkCook) {
        $pdo->exec("INSERT INTO custom_pages (title, title_en, slug, content, content_en, owner, type) VALUES ('Política de Cookies', 'Cookies Policy', 'cookies', '<h2>1. O que são Cookies?</h2><p>Cookies são pequenos ficheiros de texto que um website, ao ser visitado, coloca no computador ou no dispositivo móvel do utilizador através do navegador de internet.</p>', '<h2>1. What are Cookies?</h2><p>Cookies are small text files that a website, when visited, places on the user\'s computer or mobile device through the web browser.</p>', 'Antestreias', 'Institucional')");
    }
} catch (Exception $e) {
    // Silence setup errors
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM custom_pages WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetch());
    } else {
        $stmt = $pdo->query("SELECT * FROM custom_pages ORDER BY created_at DESC");
        $pages = $stmt->fetchAll();
        foreach ($pages as &$p) {
            $p['updated_at'] = $p['updated_at'] ?: $p['created_at'];
        }
        echo json_encode($pages);
    }
} 

elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) exit;

    $stmt = $pdo->prepare("INSERT INTO custom_pages (title, title_en, slug, content, content_en, owner, type) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['title'],
        $data['title_en'] ?? null,
        $data['slug'] ?? strtolower(str_replace(' ', '-', $data['title'])),
        $data['content'] ?? '',
        $data['content_en'] ?? null,
        $data['owner'] ?? 'default',
        $data['type'] ?? 'default'
    ]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
}

elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['id'])) exit;

    $slug = !empty($data['slug']) ? $data['slug'] : strtolower(str_replace(' ', '-', $data['title']));
    $stmt = $pdo->prepare("UPDATE custom_pages SET title = ?, title_en = ?, slug = ?, content = ?, content_en = ?, owner = ?, type = ? WHERE id = ?");
    $stmt->execute([
        $data['title'],
        $data['title_en'] ?? null,
        $slug,
        $data['content'],
        $data['content_en'] ?? null,
        $data['owner'] ?? 'default',
        $data['type'] ?? 'Institucional',
        $data['id']
    ]);
    echo json_encode(['success' => true]);
}

elseif ($method === 'DELETE') {
    if (!isset($_GET['id'])) exit;
    $stmt = $pdo->prepare("DELETE FROM custom_pages WHERE id = ?");
    $stmt->execute([$_GET['id']]);
    echo json_encode(['success' => true]);
}
