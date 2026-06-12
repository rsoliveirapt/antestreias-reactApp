<?php
require 'headers.php';
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'ID is required']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM news WHERE id = ?");
    $stmt->execute([$id]);
    $news = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$news || !$news['source_url']) {
        echo json_encode(['success' => false, 'error' => 'News or source URL not found']);
        exit;
    }

    // Since we don't have the original source container node here, we can't easily re-scrape the excerpt 
    // without knowing exactly which source it is and navigating the page.
    // However, we can try to fetch the URL and look for meta descriptions or common excerpt tags.
    
    $html = @file_get_contents($news['source_url']);
    if (!$html) {
        echo json_encode(['success' => false, 'error' => 'Could not fetch source URL']);
        exit;
    }

    $doc = new DOMDocument();
    @$doc->loadHTML('<?xml encoding="utf-8" ?>' . $html);
    $xpath = new DOMXPath($doc);

    $body = '';
    
    if (strpos($news['source_url'], 'c7nema.net') !== false) {
        $paras = $xpath->query("//div[contains(@class, 'td-post-content')]//p | //div[contains(@class, 'entry-content')]//p | //article//p");
        $count = 0;
        foreach ($paras as $p) {
            $text = trim($p->nodeValue);
            if (strlen($text) < 20) continue; // Skip short fragments
            $body .= $text . "\n\n";
            $count++;
            if ($count >= 3) break;
        }
    } elseif (strpos($news['source_url'], 'cinevisao.pt') !== false) {
        $paras = $xpath->query("//div[contains(@class, 'entry-content')]//p | //article//p");
        $count = 0;
        foreach ($paras as $p) {
            $text = trim($p->nodeValue);
            if (strlen($text) < 20) continue;
            $body .= $text . "\n\n";
            $count++;
            if ($count >= 3) break;
        }
    } elseif (strpos($news['source_url'], 'mag.sapo.pt') !== false || strpos($news['source_url'], 'sapo.pt') !== false) {
        $paras = $xpath->query("//div[contains(@class, 'detail-content')]//p");
        $count = 0;
        foreach ($paras as $p) {
            $text = trim($p->nodeValue);
            if (strlen($text) < 40) continue; 
            if (strpos($text, 'voz foi gerada') !== false) continue;
            if (strpos($text, 'resumo foi criado') !== false) continue;
            $body .= $text . "\n\n";
            $count++;
            if ($count >= 4) break;
        }
    }

    // Fallback to meta description if still empty
    if (empty(trim($body))) {
        $meta = $xpath->query("//meta[@name='description']")->item(0);
        if ($meta) $body = $meta->getAttribute('content');
    }

    if (!empty($body)) {
        $stmtUpd = $pdo->prepare("UPDATE news SET body = ? WHERE id = ?");
        $stmtUpd->execute([trim($body), $id]);
        echo json_encode(['success' => true, 'body' => trim($body)]);
    } else {
        echo json_encode(['success' => false, 'error' => 'No content found']);
    }
}
?>
