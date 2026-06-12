<?php
require 'headers.php';
require 'db.php';
require 'functions.php';

header('Content-Type: application/json');

$lang = $_GET['lang'] ?? '';

if (empty($lang)) {
    if (isset($_COOKIE['app_lang'])) {
        $lang = $_COOKIE['app_lang'];
    } else {
        $lang = get_setting($pdo, 'app.locale', 'pt');
    }
}

if ($lang === 'auto') {
    $accept_lang = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'pt';
    $lang = (strpos(strtolower($accept_lang), 'en') !== false) ? 'en' : 'pt';
}

// Fetch localization by language code
$stmt = $pdo->prepare("SELECT id FROM localizations WHERE language = ?");
$stmt->execute([$lang]);
$loc = $stmt->fetch();

if (!$loc) {
    // Try fallback to pt
    $stmt = $pdo->prepare("SELECT id FROM localizations WHERE language = ?");
    $stmt->execute(['pt']);
    $loc = $stmt->fetch();
}

$translations = [];
if ($loc) {
    $stmt = $pdo->prepare("SELECT `key`, `value` FROM localization_lines WHERE localization_id = ?");
    $stmt->execute([$loc['id']]);
    $lines = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($lines as $line) {
        $translations[$line['key']] = $line['value'];
    }
}

$translations_enabled = get_setting($pdo, 'app.translations', 'true') === 'true';

echo json_encode([
    'lang' => $lang,
    'translations' => $translations,
    'enabled' => $translations_enabled
]);
?>
