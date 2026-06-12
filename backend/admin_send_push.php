<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM push_subscriptions");
        $row = $stmt->fetch();
        echo json_encode(['total_subscribers' => (int)$row['total']]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao obter estatísticas: ' . $e->getMessage()]);
    }
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$title = $input['title'] ?? 'Antestreias';
$body = $input['body'] ?? '';
$url = $input['url'] ?? '/';

if (empty($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'O corpo da notificação não pode estar vazio.']);
    exit;
}

// VAPID keys loaded from environment variables (.env)
define('VAPID_PUBLIC_KEY', getenv('VAPID_PUBLIC_KEY') ?: 'BPtpDmLkHk8xqr26ilJuLU9tPCJ9skL0izYIuhuhi1jX6N8DrrUd9J1VG2knykhIK61sVTpimGKx_AUDUgcnrY8');
define('VAPID_PRIVATE_KEY', getenv('VAPID_PRIVATE_KEY') ?: '');

try {
    // Fetch all subscriptions
    $stmt = $pdo->query("SELECT id, endpoint, keys_p256dh, keys_auth FROM push_subscriptions");
    $subscriptions = $stmt->fetchAll();

    if (empty($subscriptions)) {
        echo json_encode(['success' => true, 'sent' => 0, 'failed' => 0, 'message' => 'Sem subscritores registados.']);
        exit;
    }

    $notificationPayload = json_encode([
        'title' => $title,
        'body' => $body,
        'url' => $url
    ]);

    $sentCount = 0;
    $failedCount = 0;
    $expiredSubscriptions = [];
    $errors = [];

    foreach ($subscriptions as $sub) {
        $endpoint = $sub['endpoint'];
        $p256dh = $sub['keys_p256dh'];
        $auth = $sub['keys_auth'];

        // Get origin for VAPID JWT aud
        $parsedUrl = parse_url($endpoint);
        $origin = $parsedUrl['scheme'] . '://' . $parsedUrl['host'] . (isset($parsedUrl['port']) ? ':' . $parsedUrl['port'] : '');

        try {
            // 1. Encrypt payload
            $encryptedData = encrypt_payload($notificationPayload, $p256dh, $auth);

            // 2. Generate VAPID JWT
            $jwt = generate_vapid_jwt($origin, VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY);

            // 3. Send HTTP POST request via curl
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $endpoint);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $encryptedData);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HEADER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/octet-stream',
                'Content-Encoding: aes128gcm',
                'TTL: 2419200',
                'Urgency: high',
                'Authorization: vapid t=' . $jwt . ', k=' . VAPID_PUBLIC_KEY
            ]);

            $response = curl_exec($ch);
            $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($statusCode >= 200 && $statusCode < 300) {
                $sentCount++;
            } else {
                $failedCount++;
                $errors[] = "Subscritor ID {$sub['id']} falhou com status {$statusCode}.";
                // If sub is 410 (Gone) or 404 (Not Found), it is inactive/expired
                if ($statusCode === 410 || $statusCode === 404) {
                    $expiredSubscriptions[] = $sub['id'];
                }
            }
        } catch (Exception $e) {
            $failedCount++;
            $errors[] = "Subscritor ID {$sub['id']}: " . $e->getMessage();
        }
    }

    // Clean up expired subscriptions
    if (!empty($expiredSubscriptions)) {
        $inQuery = implode(',', array_fill(0, count($expiredSubscriptions), '?'));
        $deleteStmt = $pdo->prepare("DELETE FROM push_subscriptions WHERE id IN ($inQuery)");
        $deleteStmt->execute($expiredSubscriptions);
    }

    echo json_encode([
        'success' => true,
        'sent' => $sentCount,
        'failed' => $failedCount,
        'cleaned' => count($expiredSubscriptions),
        'errors' => $errors
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao enviar notificações: ' . $e->getMessage()]);
}

// Helper Cryptographic Functions

function base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function derToSignature($der) {
    $offset = 0;
    if (ord($der[$offset++]) !== 0x30) return false;
    $seqLen = ord($der[$offset++]);
    if ($seqLen & 0x80) {
        $n = $seqLen & 0x7f;
        $offset += $n;
    }
    
    // Parse R
    if (ord($der[$offset++]) !== 0x02) return false;
    $rLen = ord($der[$offset++]);
    $r = substr($der, $offset, $rLen);
    $offset += $rLen;
    
    // Parse S
    if (ord($der[$offset++]) !== 0x02) return false;
    $sLen = ord($der[$offset++]);
    $s = substr($der, $offset, $sLen);
    
    // Trim leading zero bytes from signed representation
    if (ord($r[0]) === 0x00 && $rLen > 32) {
        $r = substr($r, 1);
        $rLen--;
    }
    if (ord($s[0]) === 0x00 && $sLen > 32) {
        $s = substr($s, 1);
        $sLen--;
    }
    
    // Pad to 32 bytes on the left
    $r = str_pad($r, 32, "\x00", STR_PAD_LEFT);
    $s = str_pad($s, 32, "\x00", STR_PAD_LEFT);
    
    return $r . $s;
}

function encrypt_payload($payload, $userPublicKeyBase64, $userAuthBase64) {
    $userPublicKeyBin = base64url_decode($userPublicKeyBase64);
    $userAuthBin = base64url_decode($userAuthBase64);

    // Convert raw public key to PEM
    $headerHex = '3059301306072a8648ce3d020106082a8648ce3d030107034200';
    $derKeyBin = hex2bin($headerHex) . $userPublicKeyBin;
    $pemKey = "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($derKeyBin), 64, "\n") . "-----END PUBLIC KEY-----";

    // Generate local EC keypair
    $config = [
        "curve_name" => "prime256v1",
        "private_key_type" => OPENSSL_KEYTYPE_EC,
    ];
    $possibleCnfPaths = [
        'C:/xampp/apache/conf/openssl.cnf',
        'C:/xampp/php/extras/ssl/openssl.cnf',
        'C:/Program Files/Common Files/SSL/openssl.cnf',
        'C:/Program Files (x86)/Common Files/SSL/openssl.cnf',
    ];
    $cnfPath = null;
    foreach ($possibleCnfPaths as $path) {
        if (file_exists($path)) {
            $cnfPath = $path;
            break;
        }
    }
    if (!$cnfPath) {
        $cnfPath = getenv('OPENSSL_CONF') ?: null;
    }
    if ($cnfPath) {
        $config['config'] = $cnfPath;
    }
    $localKey = openssl_pkey_new($config);
    if (!$localKey) {
        throw new Exception('Falha ao criar par de chaves EC local');
    }
    $localKeyDetails = openssl_pkey_get_details($localKey);
    $localPublicKeyBin = "\x04" . $localKeyDetails['ec']['x'] . $localKeyDetails['ec']['y'];

    // Derive shared secret
    $sharedSecretBin = openssl_pkey_derive($pemKey, $localKey);
    if ($sharedSecretBin === false) {
        throw new Exception('Falha na derivação do segredo partilhado ECDH');
    }

    // HKDF Step 1: IKM derivation
    // PRK = HKDF-Extract(salt=userAuthBin, IKM=sharedSecretBin)
    $ikm = hash_hkdf('sha256', $sharedSecretBin, 32, "WebPush: info\0" . $userPublicKeyBin . $localPublicKeyBin, $userAuthBin);
    
    // Generate random salt (16 bytes)
    $salt = random_bytes(16);

    // HKDF Step 2: CEK and Nonce derivation
    $cek = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\0", $salt);
    $nonce = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\0", $salt);

    // Prepare plaintext with padding delimiter (\x02)
    $plaintext = $payload . "\x02";

    // Encrypt using AES-128-GCM
    $tag = '';
    $ciphertext = openssl_encrypt($plaintext, 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag);
    if ($ciphertext === false) {
        throw new Exception('Encriptação AES-128-GCM falhou');
    }

    // Format binary body according to RFC 8188
    return $salt . pack('N', 4096) . pack('C', 65) . $localPublicKeyBin . $ciphertext . $tag;
}

function generate_vapid_jwt($origin, $privateKeyBase64, $publicKeyBase64) {
    $header = json_encode(['alg' => 'ES256', 'typ' => 'JWT']);
    $payload = json_encode([
        'aud' => $origin,
        'exp' => time() + 43200, // 12 hours
        'sub' => 'mailto:info@antestreias.com'
    ]);

    $headerEncoded = base64url_encode($header);
    $payloadEncoded = base64url_encode($payload);
    $dataToSign = $headerEncoded . '.' . $payloadEncoded;

    // Convert raw private key to PEM
    $privateKeyBin = base64url_decode($privateKeyBase64);
    $headerHex = "3041020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420";
    $derKeyBin = hex2bin($headerHex) . $privateKeyBin;
    $privateKeyPem = "-----BEGIN PRIVATE KEY-----\n" . chunk_split(base64_encode($derKeyBin), 64, "\n") . "-----END PRIVATE KEY-----";

    $pkey = openssl_pkey_get_private($privateKeyPem);
    if (!$pkey) {
        throw new Exception('Par de chaves privadas inválido');
    }

    $signatureBin = '';
    if (!openssl_sign($dataToSign, $signatureBin, $pkey, OPENSSL_ALGO_SHA256)) {
        throw new Exception('Falha ao assinar com OpenSSL');
    }

    $rawSignature = derToSignature($signatureBin);
    if (!$rawSignature) {
        throw new Exception('Erro ao converter assinatura DER');
    }

    return $headerEncoded . '.' . $payloadEncoded . '.' . base64url_encode($rawSignature);
}
