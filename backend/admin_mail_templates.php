<?php
require_once 'headers.php';
require_once 'db.php';
require_once 'functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmtInsert = $pdo->prepare("INSERT IGNORE INTO email_templates (slug, name, subject, body) VALUES (?, ?, ?, ?)");
    $stmtInsert->execute([
        'contest_participation',
        'Participação em Passatempo',
        'Confirmação de Participação - {{movie}}',
        '<p>Olá {{name}},</p><p>A tua participação no passatempo do filme <strong>{{movie}}</strong> ({{contest_name}}) foi registada com sucesso!</p><p><strong>Detalhes da Participação:</strong><br>Local: {{location}}<br>Resposta: {{answer}}</p><p>Boa sorte!<br>Equipa Antestreias</p>'
    ]);

    $stmtInsert->execute([
        'password_reset',
        'Recuperação de Palavra-Passe',
        'Recuperação de Palavra-Passe - Antestreias',
        '<h3>Olá {{name}},</h3><p>Recebemos um pedido para repor a palavra-passe da tua conta no Antestreias.</p><p>Clica no link abaixo para escolheres uma nova palavra-passe:</p><p style="margin: 25px 0;"><a href="{{reset_link}}" style="background-color: #e50914; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">REPOR PALAVRA-PASSE</a></p><p>Se não solicitaste este pedido, podes simplesmente ignorar este e-mail.</p><p style="font-size: 12px; color: #666;">Este link é válido por 1 hora. Por razões de segurança, não partilhes este e-mail.</p>'
    ]);

    $stmt = $pdo->query("SELECT * FROM email_templates ORDER BY name ASC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['action'])) {
        echo json_encode(['success' => false, 'error' => 'Dados inválidos']);
        exit;
    }

    if ($data['action'] === 'update') {
        $stmt = $pdo->prepare("UPDATE email_templates SET subject = ?, body = ? WHERE id = ?");
        $success = $stmt->execute([$data['subject'], $data['body'], $data['id']]);
        
        if ($success) {
            log_activity($pdo, $_SESSION['user_id'] ?? 0, 'settings', 'Atualizou template de e-mail ID ' . $data['id']);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Erro ao atualizar base de dados']);
        }
    }
}
