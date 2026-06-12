<?php
require 'headers.php';
header('Content-Type: application/json');
require 'db.php';

$position = isset($_GET['pos']) ? $_GET['pos'] : 'primary';
$lang = isset($_GET['lang']) ? $_GET['lang'] : '';

if (empty($lang)) {
    if (isset($_COOKIE['app_lang'])) {
        $lang = $_COOKIE['app_lang'];
    }
}

$stmt = $pdo->prepare("SELECT i.* FROM menu_items i JOIN menus m ON i.menu_id = m.id WHERE m.position = ? ORDER BY i.`order` ASC");
$stmt->execute([$position]);
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!empty($lang) && $lang !== 'pt') {
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
            'regulamento' => 'menu_rules'
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
}

echo json_encode($items);
?>
