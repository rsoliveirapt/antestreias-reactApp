<?php
require 'headers.php';
session_start();
require 'db.php';
require_once 'functions.php';

if (isset($_SESSION['user_id'])) {
    try {
        $stmt = $pdo->prepare("SELECT id, username, email, first_name, last_name, role, permissions, avatar FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $user['permissions'] = get_user_permissions($pdo, $user['role'], $user['permissions']);
            echo json_encode([
                'authenticated' => true,
                'user' => $user
            ]);
        } else {
            $stmt = $pdo->prepare("SELECT permissions FROM roles WHERE name = 'visitantes' OR name = 'visitors'");
            $stmt->execute();
            $visitor_data = $stmt->fetch(PDO::FETCH_ASSOC);
            $visitor_perms = $visitor_data && !empty($visitor_data['permissions']) ? json_decode($visitor_data['permissions'], true) : ["view_titles","view_reviews","play_videos","view_videos"];
            echo json_encode(['authenticated' => false, 'visitor_permissions' => $visitor_perms]);
        }
    } catch (PDOException $e) {
        $stmt = $pdo->prepare("SELECT permissions FROM roles WHERE name = 'visitantes' OR name = 'visitors'");
        $stmt->execute();
        $visitor_data = $stmt->fetch(PDO::FETCH_ASSOC);
        $visitor_perms = $visitor_data && !empty($visitor_data['permissions']) ? json_decode($visitor_data['permissions'], true) : ["view_titles","view_reviews","play_videos","view_videos"];
        echo json_encode(['authenticated' => false, 'visitor_permissions' => $visitor_perms]);
    }
} else {
    $stmt = $pdo->prepare("SELECT permissions FROM roles WHERE name = 'visitantes' OR name = 'visitors'");
    $stmt->execute();
    $visitor_data = $stmt->fetch(PDO::FETCH_ASSOC);
    $visitor_perms = $visitor_data && !empty($visitor_data['permissions']) ? json_decode($visitor_data['permissions'], true) : ["view_titles","view_reviews","play_videos","view_videos"];
    echo json_encode(['authenticated' => false, 'visitor_permissions' => $visitor_perms]);
}
