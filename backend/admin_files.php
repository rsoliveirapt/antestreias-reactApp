<?php
require_once 'headers.php';
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT 
            f.id, f.name, f.file_name, f.file_size, f.type, f.public, f.updated_at, f.created_at, f.disk_prefix,
            u.username, u.email, u.avatar
        FROM file_entries f
        LEFT JOIN users u ON f.owner_id = u.id
        ORDER BY f.created_at DESC
    ");
    $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format DB files
    $formattedFiles = array_map(function($file) {
        $dateUnix = !empty($file['updated_at']) ? strtotime($file['updated_at']) : strtotime($file['created_at']);
        $bytes = $file['file_size'];
        if ($bytes >= 1048576) {
            $size = round($bytes / 1048576, 1) . ' MB';
        } elseif ($bytes >= 1024) {
            $size = round($bytes / 1024, 1) . ' KB';
        } else {
            $size = $bytes . ' B';
        }

        $baseUrl = 'http://localhost/antestreias/v2/uploads';
        $prefix = $file['disk_prefix'] ? '/' . $file['disk_prefix'] : '';
        $url = $baseUrl . $prefix . '/' . $file['file_name'];

        return [
            'id' => 'db_' . $file['id'],
            'name' => $file['name'],
            'hash_name' => $file['file_name'],
            'uploader_name' => $file['username'] ?: 'info',
            'uploader_email' => $file['email'] ?: 'info@antestreias.com',
            'uploader_avatar' => $file['avatar'] ?: '',
            'type' => ucfirst(strtolower($file['type'] ?: 'Unknown')),
            'public' => (bool)$file['public'],
            'size' => $size,
            'updated_at' => date('d/m/Y', $dateUnix),
            'url' => $url,
            'timestamp' => $dateUnix
        ];
    }, $files);

    // Scan the physical uploads folder for untracked files
    $uploadDir = __DIR__ . '/../uploads';
    $untrackedFiles = [];
    
    if (is_dir($uploadDir)) {
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($uploadDir));
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $filePath = $file->getPathname();
                $fileName = $file->getFilename();
                $relPath = str_replace('\\', '/', str_replace($uploadDir, '', $filePath));
                
                // Skip files already tracked by disk_prefix + file_name logic (to avoid duplicates)
                $alreadyTracked = false;
                foreach ($formattedFiles as $dbf) {
                    if (strpos($dbf['url'], $relPath) !== false) {
                        $alreadyTracked = true;
                        break;
                    }
                }

                if (!$alreadyTracked) {
                    $dateUnix = filemtime($filePath);
                    $bytes = filesize($filePath);
                    if ($bytes >= 1048576) {
                        $size = round($bytes / 1048576, 1) . ' MB';
                    } elseif ($bytes >= 1024) {
                        $size = round($bytes / 1024, 1) . ' KB';
                    } else {
                        $size = $bytes . ' B';
                    }

                    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                    $type = in_array($ext, ['png','jpg','jpeg','gif','svg','webp']) ? 'Image' : 'File';

                    // Extract original name from time_name format if possible
                    $originalName = $fileName;
                    if (preg_match('/^\d+_(.+)$/', $fileName, $matches)) {
                        $originalName = $matches[1];
                    }

                    $untrackedFiles[] = [
                        'id' => 'disk_' . md5($filePath),
                        'name' => ltrim($relPath, '/'), // Show folder path as name
                        'hash_name' => $fileName,
                        'uploader_name' => 'Sistema',
                        'uploader_email' => 'admin@antestreias.com',
                        'uploader_avatar' => '',
                        'type' => $type,
                        'public' => true,
                        'size' => $size,
                        'updated_at' => date('d/m/Y', $dateUnix),
                        'url' => 'http://localhost/antestreias/v2/uploads' . $relPath,
                        'timestamp' => $dateUnix
                    ];
                }
            }
        }
    }

    $allFiles = array_merge($formattedFiles, $untrackedFiles);
    
    // Sort all files by timestamp descending
    usort($allFiles, function($a, $b) {
        return $b['timestamp'] <=> $a['timestamp'];
    });

    echo json_encode($allFiles);
}

elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $url = $_GET['url'] ?? '';
    
    // Attempt to parse physical path from the URL
    $success = false;
    if ($url) {
        $parsedUrl = parse_url($url, PHP_URL_PATH);
        // $parsedUrl usually looks like /antestreias/v2/uploads/...
        $uploadsPos = strpos($parsedUrl, '/uploads/');
        if ($uploadsPos !== false) {
            $relPath = substr($parsedUrl, $uploadsPos + 9);
            // Prevent directory traversal
            $relPath = str_replace(array('../', '..\\'), '', $relPath);
            $physicalPath = __DIR__ . '/../uploads/' . $relPath;
            
            $realUploadsDir = realpath(__DIR__ . '/../uploads');
            $realFilePath = realpath($physicalPath);
            
            if ($realFilePath !== false && strpos($realFilePath, $realUploadsDir) === 0 && file_exists($realFilePath)) {
                @unlink($realFilePath);
                $success = true;
            }
        }
    }

    // Delete from DB if it's a DB tracked file
    if (strpos($id, 'db_') === 0) {
        $dbId = substr($id, 3);
        $stmt = $pdo->prepare("DELETE FROM file_entries WHERE id = ?");
        $stmt->execute([$dbId]);
        $success = true;
    }

    echo json_encode(['success' => $success]);
}
