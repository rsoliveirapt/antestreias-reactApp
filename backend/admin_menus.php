<?php
require 'headers.php';
header('Content-Type: application/json');

require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $lang = isset($_GET['lang']) ? $_GET['lang'] : '';

    $translate_items = function($items, $lang, $pdo) {
        if (empty($lang) || $lang === 'pt') {
            return $items;
        }
        
        // Fetch PT and Target localization IDs
        $stmt = $pdo->prepare("SELECT id FROM localizations WHERE language = 'pt'");
        $stmt->execute();
        $pt_loc = $stmt->fetch();

        $stmt = $pdo->prepare("SELECT id FROM localizations WHERE language = ?");
        $stmt->execute([$lang]);
        $target_loc = $stmt->fetch();

        if ($pt_loc && $target_loc) {
            // Load PT lines to match input labels
            $stmt = $pdo->prepare("SELECT `key`, `value` FROM localization_lines WHERE localization_id = ?");
            $stmt->execute([$pt_loc['id']]);
            $pt_lines = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $normalize = function($str) {
                $str = mb_strtolower($str, 'UTF-8');
                $str = str_replace(
                    ['á','à','â','ã','ä','é','è','ê','ë','í','ì','î','ï','ó','ò','ô','õ','ö','ú','ù','û','ü','ç','ñ'],
                    ['a','a','a','a','a','e','e','e','e','i','i','i','i','o','o','o','o','o','u','u','u','u','c','n'],
                    $str
                );
                return trim($str);
            };

            $pt_to_key = [];
            foreach ($pt_lines as $line) {
                $pt_to_key[$normalize($line['value'])] = $line['key'];
            }

            // Load Target translation lines
            $stmt = $pdo->prepare("SELECT `key`, `value` FROM localization_lines WHERE localization_id = ?");
            $stmt->execute([$target_loc['id']]);
            $target_key_to_val = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

            // Fallbacks mapping lowercase accentless labels to key names
            $fallbacks = [
                'filmes' => 'menu_movies',
                'series' => 'menu_series',
                'passatempos' => 'menu_contests',
                'noticias' => 'menu_news',
                'criticas' => 'menu_reviews',
                'metricas' => 'menu_metrics',
                'definicoes' => 'menu_settings',
                'traducoes' => 'menu_translations',
                'utilizadores' => 'menu_users',
                'celebridades' => 'menu_celebrities',
                'artistas' => 'menu_artists',
                'geral' => 'menu_general',
                'videos' => 'menu_videos',
                'canais' => 'menu_channels',
                'contactos' => 'menu_contacts',
                'temas' => 'menu_themes',
                'rgpd' => 'menu_gdpr',
                'paginas' => 'menu_pages',
                'anuncios' => 'menu_ads',
                'ficheiros' => 'menu_files',
                'alertas' => 'menu_alerts',
                'politica de privacidade' => 'menu_privacy',
                'politica de cookies' => 'menu_cookies',
                'termos e condicoes' => 'menu_terms',
                'regulamento' => 'menu_rules',
                'categorias' => 'menu_categories'
            ];

            foreach ($items as &$item) {
                $normalized_label = $normalize($item['label']);
                $key = isset($pt_to_key[$normalized_label]) ? $pt_to_key[$normalized_label] : null;

                if (!$key && isset($fallbacks[$normalized_label])) {
                    $key = $fallbacks[$normalized_label];
                }

                if ($key && isset($target_key_to_val[$key])) {
                    $item['label'] = $target_key_to_val[$key];
                }
            }
            unset($item);
        }
        return $items;
    };

    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM menus WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        $menu = $stmt->fetch();
        
        $stmt = $pdo->prepare("SELECT * FROM menu_items WHERE menu_id = ? ORDER BY `order` ASC");
        $stmt->execute([$_GET['id']]);
        $items = $stmt->fetchAll();
        $items = $translate_items($items, $lang, $pdo);
        
        echo json_encode(['menu' => $menu, 'items' => $items]);
    } elseif (isset($_GET['position'])) {
        $stmt = $pdo->prepare("SELECT * FROM menus WHERE position = ?");
        $stmt->execute([$_GET['position']]);
        $menu = $stmt->fetch();
        
        if ($menu) {
            $stmt = $pdo->prepare("SELECT * FROM menu_items WHERE menu_id = ? ORDER BY `order` ASC");
            $stmt->execute([$menu['id']]);
            $items = $stmt->fetchAll();
            $items = $translate_items($items, $lang, $pdo);
            echo json_encode(['menu' => $menu, 'items' => $items]);
        } else {
            echo json_encode(['menu' => null, 'items' => []]);
        }
    } else {
        $stmt = $pdo->query("SELECT * FROM menus ORDER BY id ASC");
        echo json_encode($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['delete_menu'])) {
        $menu_id = $data['delete_menu'];
        // First delete items
        $stmt = $pdo->prepare("DELETE FROM menu_items WHERE menu_id = ?");
        $stmt->execute([$menu_id]);
        
        // Then delete menu
        $stmt = $pdo->prepare("DELETE FROM menus WHERE id = ?");
        $stmt->execute([$menu_id]);
        
        echo json_encode(['success' => true]);
        exit;
    }

    if (isset($data['delete_item'])) {
        $stmt = $pdo->prepare("DELETE FROM menu_items WHERE id = ?");
        $stmt->execute([$data['delete_item']]);
        echo json_encode(['success' => true]);
    } elseif (isset($data['items'])) {
        // Update menu items
        $menu_id = $data['menu_id'];
        
        // Simple approach: delete all and re-insert or update
        foreach ($data['items'] as $item) {
            $icon = isset($item['icon']) ? $item['icon'] : '';
            if (isset($item['id']) && strpos($item['id'], 'new') === false) {
                $stmt = $pdo->prepare("UPDATE menu_items SET label = ?, url = ?, icon = ?, `order` = ? WHERE id = ?");
                $stmt->execute([$item['label'], $item['url'], $icon, $item['order'], $item['id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO menu_items (menu_id, label, url, icon, `order`) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$menu_id, $item['label'], $item['url'], $icon, $item['order']]);
            }
        }
        echo json_encode(['success' => true]);
    } elseif (isset($data['name'])) {
        // Create new menu
        $stmt = $pdo->prepare("INSERT INTO menus (name) VALUES (?)");
        $stmt->execute([$data['name']]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
}
?>
