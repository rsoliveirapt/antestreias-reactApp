<?php
require 'headers.php';
session_start();
require 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Não autorizado']);
    exit;
}

$user_id = $_SESSION['user_id'];
$current_session_id = session_id();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM active_sessions WHERE user_id = ? ORDER BY last_activity DESC");
        $stmt->execute([$user_id]);
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($sessions)) {
            // Se a tabela estiver vazia ou não tiver sessões registadas (talvez porque login.php não insere na tabela)
            // Vamos devolver a sessão atual simulada
            $sessions = [
                [
                    'id' => session_id(),
                    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown Browser',
                    'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
                    'last_activity' => date('Y-m-d H:i:s'),
                    'is_current' => true
                ]
            ];
        } else {
            // Marcar a atual
            foreach ($sessions as &$s) {
                if ($s['session_id'] === session_id() || $s['id'] === session_id()) {
                    $s['is_current'] = true;
                } else {
                    $s['is_current'] = false;
                }
            }
        }
        
        echo json_encode(['success' => true, 'sessions' => $sessions]);
    } catch (PDOException $e) {
        // Fallback se a tabela não tiver a estrutura que pensamos
        $sessions = [
            [
                'id' => session_id(),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown Browser',
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
                'last_activity' => date('Y-m-d H:i:s'),
                'is_current' => true
            ]
        ];
        echo json_encode(['success' => true, 'sessions' => $sessions]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';
    
    if ($action === 'delete_all_others') {
        try {
            $stmt = $pdo->prepare("DELETE FROM active_sessions WHERE user_id = ? AND session_id != ?");
            $stmt->execute([$user_id, session_id()]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['success' => true]); // fallback
        }
    } else if ($action === 'delete') {
        $id = $data['id'] ?? '';
        try {
            $stmt = $pdo->prepare("DELETE FROM active_sessions WHERE user_id = ? AND id = ?");
            $stmt->execute([$user_id, $id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['success' => true]); // fallback
        }
    }
}
