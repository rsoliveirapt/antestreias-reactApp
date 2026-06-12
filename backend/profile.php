<?php
require 'headers.php';
require 'db.php';
require 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];

// Get profile data
if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    $username = $_GET['username'] ?? null;
    
    // If no ID/Username, get current logged in user
    if (!$id && !$username) {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $id = $_SESSION['user_id'] ?? null;
    }
    
    if (!$id && !$username) {
        echo json_encode(['error' => 'User not specified']);
        exit;
    }
    
    if ($id) {
        $stmt = $pdo->prepare("SELECT id, username, email, first_name, last_name, avatar, bio, cover_image, social_links, role, created_at, language, country, timezone FROM users WHERE id = ?");
        $stmt->execute([$id]);
    } else {
        $stmt = $pdo->prepare("SELECT id, username, email, first_name, last_name, avatar, bio, cover_image, social_links, role, created_at, language, country, timezone FROM users WHERE username = ?");
        $stmt->execute([$username]);
    }
    
    $user = $stmt->fetch();
    if (!$user) {
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    // Permission check for viewing other users' profiles
    if (session_status() === PHP_SESSION_NONE) session_start();
    $current_user_id = $_SESSION['user_id'] ?? null;

    if ($user['id'] != $current_user_id) {
        if (!$current_user_id) {
            echo json_encode(['error' => 'Acesso Negado: Não tens permissão para ver perfis de outros utilizadores.']);
            exit;
        }
        $currStmt = $pdo->prepare("SELECT role, permissions FROM users WHERE id = ?");
        $currStmt->execute([$current_user_id]);
        $currUser = $currStmt->fetch(PDO::FETCH_ASSOC);
        if (!$currUser) {
            echo json_encode(['error' => 'Acesso Negado: Utilizador inválido.']);
            exit;
        }
        $perms = get_user_permissions($pdo, $currUser['role'], $currUser['permissions']);
        if (!in_array('view_users', $perms) && !in_array('super_admin_all', $perms)) {
            echo json_encode(['error' => 'Acesso Negado: Não tens permissão para ver perfis de outros utilizadores.']);
            exit;
        }
    }
    
    // Decode social links if they exist
    if ($user['social_links']) {
        $user['social_links'] = json_decode($user['social_links'], true);
    } else {
        $user['social_links'] = [];
    }

    // Comments feature is disabled
    $user['comments'] = [];
    
    // Fetch user reviews
    $reviewStmt = $pdo->prepare("SELECT r.*, t.name as title_name, t.poster as title_poster, t.backdrop as title_backdrop, t.slug as title_slug
        FROM reviews r
        JOIN titles t ON r.reviewable_id = t.id AND r.reviewable_type = 'title'
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC");
    $reviewStmt->execute([$user['id']]);
    $user['reviews'] = $reviewStmt->fetchAll();
    
    // Followers logic
    if (session_status() === PHP_SESSION_NONE) session_start();
    $current_user_id = $_SESSION['user_id'] ?? null;
    
    // Followers count
    $followersCountStmt = $pdo->prepare("SELECT COUNT(*) FROM user_followers WHERE following_id = ?");
    $followersCountStmt->execute([$user['id']]);
    $user['followers_count'] = $followersCountStmt->fetchColumn();
    
    // Following count
    $followingCountStmt = $pdo->prepare("SELECT COUNT(*) FROM user_followers WHERE follower_id = ?");
    $followingCountStmt->execute([$user['id']]);
    $user['following_count'] = $followingCountStmt->fetchColumn();
    
    // Is following?
    $user['is_following'] = false;
    if ($current_user_id) {
        $isFollowingStmt = $pdo->prepare("SELECT 1 FROM user_followers WHERE follower_id = ? AND following_id = ?");
        $isFollowingStmt->execute([$current_user_id, $user['id']]);
        $user['is_following'] = (bool)$isFollowingStmt->fetch();
    }
    
    // Followers list
    $followersListStmt = $pdo->prepare("SELECT u.id, u.username, u.first_name, u.last_name, u.avatar 
        FROM user_followers f 
        JOIN users u ON f.follower_id = u.id 
        WHERE f.following_id = ? ORDER BY f.created_at DESC");
    $followersListStmt->execute([$user['id']]);
    $user['followers_list'] = $followersListStmt->fetchAll();
    
    // Following list
    $followingListStmt = $pdo->prepare("SELECT u.id, u.username, u.first_name, u.last_name, u.avatar 
        FROM user_followers f 
        JOIN users u ON f.following_id = u.id 
        WHERE f.follower_id = ? ORDER BY f.created_at DESC");
    $followingListStmt->execute([$user['id']]);
    $user['following_list'] = $followingListStmt->fetchAll();
    
    // Fetch user contest participations
    $partStmt = $pdo->prepare("SELECT cp.*, c.name as contest_name, c.end_date as contest_end_date, c.type as contest_type, t.name as title_name, t.poster as title_poster, t.backdrop as title_backdrop, t.slug as title_slug
        FROM contest_participations cp
        JOIN contests c ON cp.contest_id = c.id
        LEFT JOIN titles t ON c.title_id = t.id
        WHERE cp.email = ?
        ORDER BY cp.created_at DESC");
    $partStmt->execute([$user['email']]);
    $user['participations'] = $partStmt->fetchAll();
    
    echo json_encode($user);
}

// Update profile data
if ($method === 'POST') {
    if (session_status() === PHP_SESSION_NONE) session_start();
    $current_user_id = $_SESSION['user_id'] ?? null;
    
    if (!$current_user_id) {
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $first_name = $data['first_name'] ?? '';
    $last_name = $data['last_name'] ?? '';
    $bio = $data['bio'] ?? '';
    $avatar = $data['avatar'] ?? null;
    $cover_image = $data['cover_image'] ?? null;
    $social_links = isset($data['social_links']) ? json_encode($data['social_links']) : null;
    $language = $data['language'] ?? 'pt';
    $country = $data['country'] ?? 'Portugal';
    $timezone = $data['timezone'] ?? 'UTC';

    if (empty($username) || empty($email)) {
        echo json_encode(['success' => false, 'error' => 'O nome de utilizador e o e-mail são obrigatórios.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'error' => 'E-mail inválido.']);
        exit;
    }

    // Check username collision
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $stmt->execute([$username, $current_user_id]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Este nome de utilizador já está em uso por outra conta.']);
        exit;
    }

    // Check email collision
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $current_user_id]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Este e-mail já está em uso por outra conta.']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE users SET username = ?, email = ?, first_name = ?, last_name = ?, bio = ?, avatar = ?, cover_image = ?, social_links = ?, language = ?, country = ?, timezone = ? WHERE id = ?");
    $success = $stmt->execute([$username, $email, $first_name, $last_name, $bio, $avatar, $cover_image, $social_links, $language, $country, $timezone, $current_user_id]);
    
    echo json_encode(['success' => $success]);
}
