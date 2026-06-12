<?php
session_start();
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';
require 'functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['contest_id']) || !isset($data['name']) || !isset($data['email'])) {
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit;
    }

    // Fetch contest details to check requirements and get name and movie title
    $stmtContest = $pdo->prepare("SELECT c.name, c.type, c.require_login, t.name as title_name FROM contests c LEFT JOIN titles t ON c.title_id = t.id WHERE c.id = ?");
    $stmtContest->execute([$data['contest_id']]);
    $contest = $stmtContest->fetch(PDO::FETCH_ASSOC);

    if (!$contest) {
        echo json_encode(['success' => false, 'error' => 'Passatempo não encontrado.']);
        exit;
    }

    if (isset($contest['require_login']) && $contest['require_login'] == 1) {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'error' => 'Este passatempo é exclusivo para utilizadores registados. Por favor, inicia sessão para participar.']);
            exit;
        }
    }

    if ($contest && $contest['type'] === 'exclusive') {
        if (empty($data['cc_bi'])) {
            echo json_encode(['success' => false, 'error' => 'O campo CC/BI é obrigatório para participar em passatempos exclusivos.']);
            exit;
        }
    }

    // Check if user already participated with this email in the same contest
    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM contest_participations WHERE contest_id = ? AND email = ?");
    $stmtCheck->execute([$data['contest_id'], $data['email']]);
    if ($stmtCheck->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'error' => 'Já registou uma participação neste passatempo com este endereço de e-mail.']);
        exit;
    }

    // Check if user already participated with this CC/BI in the same contest (if CC/BI is provided)
    if (!empty($data['cc_bi'])) {
        $stmtCheckCc = $pdo->prepare("SELECT COUNT(*) FROM contest_participations WHERE contest_id = ? AND cc_bi = ?");
        $stmtCheckCc->execute([$data['contest_id'], $data['cc_bi']]);
        if ($stmtCheckCc->fetchColumn() > 0) {
            echo json_encode(['success' => false, 'error' => 'Já registou uma participação neste passatempo com este número de CC/BI.']);
            exit;
        }
    }


    $stmt = $pdo->prepare("INSERT INTO contest_participations (
        contest_id, name, email, cc_bi, location, answer, instagram_link
    ) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    try {
        $stmt->execute([
            $data['contest_id'],
            $data['name'],
            $data['email'],
            $data['cc_bi'] ?? null,
            $data['location'] ?? null,
            $data['answer'] ?? null,
            $data['instagram_link'] ?? null
        ]);
        
        if ($contest && $contest['type'] === 'exclusive') {
            $stmtTpl = $pdo->prepare("SELECT subject, body FROM email_templates WHERE slug = 'contest_participation'");
            $stmtTpl->execute();
            $tpl = $stmtTpl->fetch(PDO::FETCH_ASSOC);

            $template = $tpl ? $tpl['body'] : "<p>Olá {{name}},</p><p>A tua participação no passatempo do filme <strong>{{movie}}</strong> ({{contest_name}}) foi registada com sucesso!</p><p><strong>Detalhes da Participação:</strong><br>CC/BI: {{cc_bi}}<br>Local: {{location}}<br>Resposta: {{answer}}</p><p>Boa sorte!<br>Equipa Antestreias</p>";
            $subjectTpl = ($tpl && !empty($tpl['subject'])) ? $tpl['subject'] : "Confirmação de Participação - {{movie}}";

            $movieName = $contest['title_name'] ? $contest['title_name'] : $contest['name'];
            $answerText = !empty($data['answer']) ? $data['answer'] : '(Sem resposta / Não aplicável)';
            $locationText = !empty($data['location']) ? $data['location'] : 'Nacional';

            $replacements = [
                '{{name}}' => $data['name'],
                '{name}' => $data['name'],
                '{{movie}}' => $movieName,
                '{movie}' => $movieName,
                '{{contest_name}}' => $contest['name'],
                '{contest_name}' => $contest['name'],
                '{{location}}' => $locationText,
                '{location}' => $locationText,
                '{{answer}}' => $answerText,
                '{answer}' => $answerText,
                '{{email}}' => $data['email'],
                '{email}' => $data['email'],
                '{{cc_bi}}' => $data['cc_bi'] ?? '',
                '{cc_bi}' => $data['cc_bi'] ?? '',
                '{{instagram}}' => $data['instagram_link'] ?? '',
                '{instagram}' => $data['instagram_link'] ?? '',
                '{{instagram_link}}' => $data['instagram_link'] ?? '',
                '{instagram_link}' => $data['instagram_link'] ?? ''
            ];
            
            $messageContent = str_replace(array_keys($replacements), array_values($replacements), $template);
            $emailSubject = str_replace(array_keys($replacements), array_values($replacements), $subjectTpl);

            // Only apply nl2br if the template does not contain HTML paragraph/div tags
            if (strpos($template, '<p') === false && strpos($template, '<div') === false && strpos($template, '<br') === false) {
                $messageContent = nl2br($messageContent);
            }
            
            send_email($pdo, $data['email'], $emailSubject, $messageContent);
        }

        echo json_encode(['success' => true]);
    } catch (Throwable $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
