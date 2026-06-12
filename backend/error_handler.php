<?php
/**
 * Unified Global Error and Exception Handler for Antestreias
 */

// Helper function to connect to DB if not already connected
function get_error_handler_db() {
    global $pdo;
    if (isset($pdo)) {
        return $pdo;
    }
    $db_file = __DIR__ . '/db.php';
    if (file_exists($db_file)) {
        try {
            require_once $db_file;
            return $pdo ?? null;
        } catch (Throwable $e) {
            return null;
        }
    }
    return null;
}

if (!function_exists('report_system_error')) {
    function report_system_error($type, $message, $file_path, $line_number, $stack_trace = null, $extra_ctx = []) {
        $db = get_error_handler_db();
        
        // Ensure error_reports table exists
        if ($db) {
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS error_reports (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    error_type VARCHAR(100) NOT NULL,
                    message TEXT NOT NULL,
                    file_path VARCHAR(255) NULL,
                    line_number INT NULL,
                    stack_trace TEXT NULL,
                    url VARCHAR(255) NULL,
                    user_agent VARCHAR(255) NULL,
                    user_id INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    KEY idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
            } catch (Throwable $e) {
                // Silently ignore table creation failure
            }
        }

        $url = $extra_ctx['url'] ?? ($_SERVER['REQUEST_URI'] ?? '');
        $user_agent = $extra_ctx['user_agent'] ?? ($_SERVER['HTTP_USER_AGENT'] ?? '');
        $user_id = $extra_ctx['user_id'] ?? null;

        if ($user_id === null && session_status() !== PHP_SESSION_DISABLED) {
            if (session_status() === PHP_SESSION_NONE) {
                try {
                    @session_start();
                } catch (Throwable $e) {}
            }
            $user_id = $_SESSION['user_id'] ?? null;
        }

        // Save to Database
        $saved_to_db = false;
        $report_id = null;
        if ($db) {
            try {
                $stmt = $db->prepare("INSERT INTO error_reports (error_type, message, file_path, line_number, stack_trace, url, user_agent, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$type, $message, $file_path, $line_number, $stack_trace, $url, $user_agent, $user_id]);
                $report_id = $db->lastInsertId();
                $saved_to_db = true;
            } catch (Throwable $e) {
                // DB failed, log to system error log
                error_log("Failed to insert error report to DB: " . $e->getMessage());
            }
        }

        // Rate Limit check (max 1 alert email per identical error every 15 minutes)
        $is_duplicate = false;
        if ($db && $saved_to_db && $report_id) {
            try {
                $stmt = $db->prepare("SELECT COUNT(*) FROM error_reports WHERE error_type = ? AND message = ? AND file_path = ? AND line_number = ? AND created_at >= NOW() - INTERVAL 15 MINUTE AND id != ?");
                $stmt->execute([$type, $message, $file_path, $line_number, $report_id]);
                if ($stmt->fetchColumn() > 0) {
                    $is_duplicate = true;
                }
            } catch (Throwable $e) {
                // Ignore DB issues here
            }
        }

        if ($is_duplicate) {
            error_log("Alert throttled for duplicate error: [$type] $message");
            return;
        }

        // Prepare email message
        $subject = "Alerta de Erro - Antestreias: [$type]";
        $email_body = "<h3>Detetado Erro no Sistema</h3>";
        $email_body .= "<p><strong>Tipo:</strong> " . htmlspecialchars($type) . "</p>";
        $email_body .= "<p><strong>Mensagem:</strong> " . htmlspecialchars($message) . "</p>";
        if ($file_path) {
            $email_body .= "<p><strong>Ficheiro:</strong> " . htmlspecialchars($file_path) . " (Linha " . intval($line_number) . ")</p>";
        }
        if ($url) {
            $email_body .= "<p><strong>URL:</strong> " . htmlspecialchars($url) . "</p>";
        }
        if ($user_agent) {
            $email_body .= "<p><strong>User Agent:</strong> " . htmlspecialchars($user_agent) . "</p>";
        }
        if ($user_id) {
            $email_body .= "<p><strong>ID Utilizador:</strong> " . intval($user_id) . "</p>";
        }
        if ($stack_trace) {
            $email_body .= "<p><strong>Stack Trace:</strong></p><pre style='background:#f4f4f4;padding:10px;border:1px solid #ddd;color:#333;overflow-x:auto;font-family:monospace;font-size:12px;'>" . htmlspecialchars($stack_trace) . "</pre>";
        }

        // Fetch administrator emails
        $admin_emails = [];
        if ($db) {
            try {
                $stmt = $db->query("SELECT email FROM users WHERE role LIKE '%Admin%' OR role LIKE '%admin%'");
                $admin_emails = $stmt->fetchAll(PDO::FETCH_COLUMN);
            } catch (Throwable $e) {
                // Ignore DB issues here
            }
        }

        // Fallbacks if no admin emails found
        if (empty($admin_emails)) {
            if ($db) {
                try {
                    $stmt = $db->prepare("SELECT value FROM settings WHERE name = ?");
                    $stmt->execute(['mail.contact_page_address']);
                    $contact = $stmt->fetchColumn();
                    if ($contact) {
                        $admin_emails[] = $contact;
                    }
                } catch (Throwable $e) {}
            }
        }
        if (empty($admin_emails)) {
            $admin_emails[] = 'info@antestreias.com'; // Absolute fallback
        }

        // Load functions.php for send_email
        $functions_loaded = false;
        $functions_file = __DIR__ . '/functions.php';
        if (file_exists($functions_file)) {
            try {
                require_once $functions_file;
                $functions_loaded = function_exists('send_email');
            } catch (Throwable $e) {}
        }

        foreach ($admin_emails as $admin_email) {
            $sent = false;
            if ($functions_loaded && $db) {
                try {
                    $sent = send_email($db, $admin_email, $subject, $email_body);
                } catch (Throwable $e) {
                    error_log("Failed to send error alert via send_email to $admin_email: " . $e->getMessage());
                }
            }

            // Native PHP mail fallback if send_email fails or functions not loaded
            if (!$sent) {
                try {
                    $headers = "MIME-Version: 1.0\r\n";
                    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
                    $headers .= "From: Antestreias Alertas <noreply@antestreias.com>\r\n";
                    @mail($admin_email, $subject, $email_body, $headers);
                } catch (Throwable $e) {
                    error_log("Native mail fallback also failed: " . $e->getMessage());
                }
            }
        }
    }
}

// Global Exception Handler
set_exception_handler(function(Throwable $exception) {
    error_log("Uncaught Exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine());
    
    report_system_error(
        get_class($exception),
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine(),
        $exception->getTraceAsString()
    );

    $is_api = (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);
    if ($is_api) {
        if (!headers_sent()) {
            header('Content-Type: application/json');
            http_response_code(500);
        }
        echo json_encode(['error' => 'Ocorreu um erro interno no servidor. O administrador foi notificado.']);
        exit;
    }
});

// Global Error Handler
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }

    $friendly_type = 'PHP Error';
    switch ($severity) {
        case E_ERROR:
        case E_USER_ERROR:
            $friendly_type = 'Fatal Error';
            break;
        case E_WARNING:
        case E_USER_WARNING:
            $friendly_type = 'Warning';
            break;
        case E_NOTICE:
        case E_USER_NOTICE:
            $friendly_type = 'Notice';
            break;
        case E_RECOVERABLE_ERROR:
            $friendly_type = 'Recoverable Error';
            break;
    }

    // Only alert on critical issues (Fatal errors, recoverables, and user errors)
    if (in_array($severity, [E_ERROR, E_USER_ERROR, E_RECOVERABLE_ERROR])) {
        $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS);
        $trace_str = '';
        foreach ($backtrace as $i => $frame) {
            $trace_str .= "#$i " . ($frame['file'] ?? 'unknown') . "(" . ($frame['line'] ?? 'unknown') . "): " . ($frame['class'] ?? '') . ($frame['type'] ?? '') . ($frame['function'] ?? '') . "()\n";
        }

        report_system_error($friendly_type, $message, $file, $line, $trace_str);
        
        if ($severity === E_USER_ERROR) {
            $is_api = (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);
            if ($is_api) {
                if (!headers_sent()) {
                    header('Content-Type: application/json');
                    http_response_code(500);
                }
                echo json_encode(['error' => 'Ocorreu um erro crítico. O administrador foi notificado.']);
                exit;
            }
        }
    } else {
        error_log("PHP $friendly_type: $message in $file on line $line");
    }

    return false;
}, E_ALL);

// Global Shutdown Handler for compile/fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        error_log("PHP Shutdown Fatal Error: " . $error['message'] . " in " . $error['file'] . " on line " . $error['line']);
        
        report_system_error(
            'Fatal PHP Crash',
            $error['message'],
            $error['file'],
            $error['line'],
            'Shutdown backtrace not available for fatal crash.'
        );

        $is_api = (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);
        if ($is_api && !headers_sent()) {
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode(['error' => 'Ocorreu um erro fatal no servidor. O administrador foi notificado.']);
        }
    }
});
