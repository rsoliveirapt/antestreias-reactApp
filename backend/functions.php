<?php
/**
 * Global utility functions for Antestreias API
 */

if (!function_exists('get_setting')) {
    function get_setting($pdo, $name, $default = '') {
        try {
            $stmt = $pdo->prepare("SELECT value FROM settings WHERE name = ?");
            $stmt->execute([$name]);
            $res = $stmt->fetch();
            return $res ? $res['value'] : $default;
        } catch (Exception $e) {
            return $default;
        }
    }
}

if (!function_exists('get_user_permissions')) {
    function get_user_permissions($pdo, $user_role, $user_permissions_json) {
        $user_perms = !empty($user_permissions_json) ? json_decode($user_permissions_json, true) : [];
        if (!is_array($user_perms)) $user_perms = [];

        $roles = !empty($user_role) ? explode(',', $user_role) : [];
        if (empty($roles)) $roles = ['Membro'];

        foreach ($roles as $r) {
            $r = trim($r);
            if (empty($r)) continue;

            $role_match = $r;
            if (stripos($r, 'Super Admin') !== false) {
                $role_match = 'super_admin';
            } elseif (stripos($r, 'Administrador') !== false) {
                $role_match = 'admin';
            } elseif (stripos($r, 'Moderador') !== false) {
                $role_match = 'moderator';
            } elseif (stripos($r, 'Editor') !== false) {
                $role_match = 'editor';
            } elseif (stripos($r, 'Utilizador') !== false || stripos($r, 'Membro') !== false) {
                $role_match = 'utilizadores';
            }

            try {
                $stmt = $pdo->prepare("SELECT permissions FROM roles WHERE name = ? OR display_name = ? OR name = ?");
                $stmt->execute([$role_match, $r, strtolower($r)]);
                $role_data = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($role_data && !empty($role_data['permissions'])) {
                    $role_perms = json_decode($role_data['permissions'], true);
                    if (is_array($role_perms)) {
                        $user_perms = array_merge($user_perms, $role_perms);
                    }
                }
            } catch (Exception $e) {
                if ($role_match === 'utilizadores') {
                    $user_perms = array_merge($user_perms, ["view_reviews","view_videos","play_videos","view_users","view_titles"]);
                }
            }
        }

        return array_values(array_unique($user_perms));
    }
}

/**
 * Log administrative activity
 */
if (!function_exists('log_activity')) {
    function log_activity($pdo, $user_id, $item_type, $action, $item_id = null) {
        try {
            $stmt = $pdo->prepare("INSERT INTO activity_log (user_id, item_type, action, item_id, created_at) VALUES (?, ?, ?, ?, NOW())");
            $stmt->execute([$user_id, $item_type, $action, $item_id]);
        } catch (Exception $e) {
            // Silently fail activity logging
        }
    }
}
/**
 * Track real-time visitor activity
 */
if (!function_exists('track_visitor')) {
    function track_visitor($pdo) {
        try {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
            $sid = session_id();

            // We use session_id as the primary key to identify the specific visit
            // and update the user_id if the visitor logs in during that session.
            $stmt = $pdo->prepare("INSERT INTO visitor_log (session_id, user_id, ip_address, last_activity) 
                                   VALUES (:sid, :uid, :ip, NOW()) 
                                   ON DUPLICATE KEY UPDATE 
                                   user_id = CASE WHEN :uid2 IS NOT NULL THEN :uid2 ELSE user_id END, 
                                   last_activity = NOW()");
            $stmt->execute(['sid' => $sid, 'uid' => $user_id, 'uid2' => $user_id, 'ip' => $ip]);

            // ALSO update the main users table if the visitor is logged in
            if ($user_id) {
                $stmt = $pdo->prepare("UPDATE users SET last_activity = NOW() WHERE id = ?");
                $stmt->execute([$user_id]);
            }
        } catch (Exception $e) {
            // Silently fail visitor tracking
        }
    }
}

/**
 * Generate a URL-friendly slug from text
 */
if (!function_exists('create_slug')) {
    function create_slug($text) {
        if (empty($text)) return '';
        // Replace non-letter or digits by -
        $slug = preg_replace('~[^\pL\d]+~u', '-', $text);
        // Transliterate
        $slug = iconv('utf-8', 'us-ascii//TRANSLIT', $slug);
        // Remove unwanted characters
        $slug = preg_replace('~[^-\w]+~', '', $slug);
        // Trim and lowercase
        $slug = trim(strtolower(preg_replace('~-+~', '-', $slug)), '-');
        return $slug;
    }
}
/**
 * Global Email Sending Function with SMTP Support
 */
if (!function_exists('send_email')) {
    function send_email($pdo, $to, $subject, $message, $config_override = null) {
        require_once __DIR__ . '/includes/PHPMailer/PHPMailer.php';
        require_once __DIR__ . '/includes/PHPMailer/SMTP.php';
        require_once __DIR__ . '/includes/PHPMailer/Exception.php';

        $mail = new PHPMailer\PHPMailer\PHPMailer(true);

        try {
            // Get settings
            $from_name = $config_override['from_name'] ?? get_setting($pdo, 'mail.from_name', 'Antestreias');
            $from_address = $config_override['from_address'] ?? get_setting($pdo, 'mail.from_address', 'noreply@antestreias.pt');
            $handler = $config_override['handler'] ?? get_setting($pdo, 'mail.handler', 'mail');

            if ($handler === 'smtp') {
                $mail->isSMTP();
                $mail->Timeout    = 10; // Reduzir o timeout para evitar esperas longas de DNS/IPv6
                $mail->SMTPKeepAlive = true;
                $mail->Host       = $config_override['smtp_host'] ?? get_setting($pdo, 'mail.smtp_host');
                $mail->SMTPAuth   = true;
                $mail->Username   = $config_override['smtp_user'] ?? get_setting($pdo, 'mail.smtp_user');
                $mail->Password   = $config_override['smtp_password'] ?? get_setting($pdo, 'mail.smtp_password');
                $mail->Port       = $config_override['smtp_port'] ?? get_setting($pdo, 'mail.smtp_port', 587);
                
                $encryption = $config_override['smtp_encryption'] ?? get_setting($pdo, 'mail.smtp_encryption', 'none');
                if ($encryption === 'tls') $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                if ($encryption === 'ssl') $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;

                // FIX: Many cPanel servers have certificate issues when accessed from localhost
                $mail->SMTPOptions = array(
                    'ssl' => array(
                        'verify_peer' => false,
                        'verify_peer_name' => false,
                        'allow_self_signed' => true
                    )
                );
            } else {
                $mail->isMail();
            }

            // Recipients
            $mail->setFrom($from_address, $from_name);
            $mail->addAddress($to);
            $mail->addReplyTo($from_address, $from_name);

            // Content
            $mail->isHTML(true);
            $mail->CharSet = 'UTF-8';
            $mail->Subject = $subject;
            
            // Get appearance settings
            $header_html = get_setting($pdo, 'mail.appearance.header', '');
            $footer_html = get_setting($pdo, 'mail.appearance.footer', '© ' . date('Y') . ' ' . $from_name . '. Todos os direitos reservados.');
            $accent_color = get_setting($pdo, 'mail.appearance.accent', '#e50914');
            $custom_css = get_setting($pdo, 'mail.appearance.css', '');

            if (empty($header_html)) {
                $header_html = "<h2 style='color: $accent_color; margin: 0;'>$from_name</h2>";
            }

            // Replace global placeholders
            $site_url = 'http://' . $_SERVER['HTTP_HOST'] . str_replace('/backend/functions.php', '', $_SERVER['SCRIPT_NAME']);
            if (strpos($site_url, '/backend') !== false) {
                $site_url = str_replace('/backend', '', $site_url);
            }
            
            // Get social and footer settings
            $footer_copyright = get_setting($pdo, 'footer.copyright', '© ' . date('Y') . ' ' . $from_name);
            $fb = get_setting($pdo, 'footer.facebook', '#');
            $ig = get_setting($pdo, 'footer.instagram', '#');
            $tw = get_setting($pdo, 'footer.twitter', '#');
            $yt = get_setting($pdo, 'footer.youtube', '#');
            $tk = get_setting($pdo, 'footer.tiktok', '#');

            $global_vars = [
                '{{site_url}}' => $site_url,
                '{{site_name}}' => $from_name,
                '{{year}}' => date('Y'),
                '{{footer_copyright}}' => $footer_copyright,
                '{{facebook_url}}' => $fb,
                '{{instagram_url}}' => $ig,
                '{{twitter_url}}' => $tw,
                '{{youtube_url}}' => $yt,
                '{{tiktok_url}}' => $tk,
                '{{name}}' => 'Utilizador' // Fallback for tests
            ];

            $message = str_replace(array_keys($global_vars), array_values($global_vars), $message);
            $header_html = str_replace(array_keys($global_vars), array_values($global_vars), $header_html);
            $footer_html = str_replace(array_keys($global_vars), array_values($global_vars), $footer_html);

            $html_message = "
            <html>
            <head>
                <style>
                    body, table, td, a { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
                    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                    img { -ms-interpolation-mode: bicubic; }
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #ffffff; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #000000; }
                    .wrapper { width: 100%; table-layout: fixed; background-color: #000000; padding-bottom: 40px; }
                    .container { max-width: 600px; margin: 0 auto; background: #000000; border-radius: 10px; overflow: hidden; border: 1px solid #1a1a1a; }
                    .header { padding: 0; background: #000000; text-align: left; }
                    .content { padding: 30px; line-height: 1.6; background: #0f0f0f; color: #ffffff; }
                    .footer { padding: 20px; background: #000000; border-top: 1px solid #1a1a1a; font-size: 12px; color: #888; text-align: center; }
                    .btn { display: inline-block; padding: 12px 24px; background: $accent_color !important; color: #ffffff !important; text-decoration: none !important; border-radius: 6px; font-weight: bold; margin-top: 20px; }
                    a { color: $accent_color; text-decoration: none; }
                    h1, h2, h3 { color: #ffffff; }
                    $custom_css
                </style>
            </head>
            <body>
                <div class='wrapper'>
                    <!--[if (gte mso 9)|(IE)]>
                    <table width='600' align='center' cellpadding='0' cellspacing='0' border='0'><tr><td>
                    <![endif]-->
                    <div class='container'>
                        <div class='header'>
                            $header_html
                        </div>
                        <div class='content'>
                            $message
                        </div>
                        <div class='footer'>
                            $footer_html
                            <p style='font-size: 10px; margin-top: 10px;'>
                                Este é um e-mail automático. Por favor, não responda a este endereço.
                            </p>
                        </div>
                    </div>
                    <!--[if (gte mso 9)|(IE)]>
                    </td></tr></table>
                    <![endif]-->
                </div>
            </body>
            </html>";

            $mail->Body = $html_message;
            $mail->AltBody = strip_tags($message);

            return $mail->send();
        } catch (Exception $e) {
            global $last_mail_error;
            $last_mail_error = $mail->ErrorInfo;
            error_log("Mail Error: " . $mail->ErrorInfo);
            return false;
        }
    }
}
