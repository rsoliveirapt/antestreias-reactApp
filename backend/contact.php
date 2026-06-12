<?php
require_once 'headers.php';
require_once 'db.php';
require_once 'functions.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['error' => 'Dados inválidos.']);
    exit;
}

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');

if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    echo json_encode(['error' => 'Todos os campos são obrigatórios.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['error' => 'Email inválido.']);
    exit;
}

// Obter o endereço de email do administrador das configurações globais
$to_email = get_setting($pdo, 'mail.from_address', 'admin@antestreias.pt');

// Preparar o corpo do email
$email_subject = "Novo Contacto: " . $subject;
$email_message = "
<h2>Nova Mensagem de Contacto (Formulário)</h2>
<p><strong>De:</strong> " . htmlspecialchars($name) . " &lt;" . htmlspecialchars($email) . "&gt;</p>
<p><strong>Assunto:</strong> " . htmlspecialchars($subject) . "</p>
<hr style='border: 1px solid #333; margin: 20px 0;'>
<p><strong>Mensagem:</strong></p>
<table width='100%' cellpadding='15' cellspacing='0' border='0' style='background-color: #111111; border-radius: 8px; margin-top: 10px;'>
    <tr>
        <td style='color: #ffffff; font-family: Arial, sans-serif; font-size: 14px;'>
            " . nl2br(htmlspecialchars($message)) . "
        </td>
    </tr>
</table>
";

// Enviar o email usando o sistema global da plataforma
$sent = send_email($pdo, $to_email, $email_subject, $email_message);

if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Mensagem enviada com sucesso.'
    ]);
} else {
    global $last_mail_error;
    echo json_encode([
        'success' => false,
        'error' => 'Não foi possível enviar a mensagem neste momento. Tente mais tarde.',
        'debug' => $last_mail_error // Remover em produção se preferir
    ]);
}
