<?php
require 'headers.php';
require 'db.php';

// Helper to slugify
function slugify($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return empty($text) ? 'n-a' : $text;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $source_id = $_GET['source_id'] ?? null;
    
    if (!$source_id) {
        // Import from all active sources
        $stmt = $pdo->query("SELECT * FROM news_sources WHERE is_active = 1");
        $sources = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM news_sources WHERE id = ?");
        $stmt->execute([$source_id]);
        $sources = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    $imported_count = 0;
    
    foreach ($sources as $source) {
        // For now, let's implement specific logic for C7nema as a proof of concept
        // In a real scenario, we would use the selectors from the DB
        
        $html = @file_get_contents($source['url']);
        if (!$html) continue;

        $doc = new DOMDocument();
        @$doc->loadHTML('<?xml encoding="utf-8" ?>' . $html);
        $xpath = new DOMXPath($doc);

        $articles = [];
        
        if (strpos($source['url'], 'c7nema.net') !== false) {
            // C7nema logic (Newspaper theme)
            $nodes = $xpath->query("//div[contains(@class, 'td-module-container')] | //div[contains(@class, 'post-item')]");
            foreach ($nodes as $node) {
                $titleNode = $xpath->query(".//h3[contains(@class, 'entry-title')]/a | .//h2/a", $node)->item(0);
                if (!$titleNode) continue;
                
                $title = trim($titleNode->nodeValue);
                $url = $titleNode->getAttribute('href');
                if (strpos($url, 'http') !== 0) $url = 'https://c7nema.net' . $url;
                
                $imgNode = $xpath->query(".//img", $node)->item(0);
                $image = $imgNode ? ($imgNode->getAttribute('data-src') ?: $imgNode->getAttribute('src')) : null;
                
                if (!$image) {
                    $thumbNode = $xpath->query(".//span[contains(@class, 'td-thumb-css')]", $node)->item(0);
                    if ($thumbNode) {
                        $style = $thumbNode->getAttribute('style');
                        if (preg_match('/url\((.*?)\)/', $style, $matches)) {
                            $image = trim($matches[1], "'\"");
                        }
                    }
                }
                
                $excerptNode = $xpath->query(".//div[contains(@class, 'td-excerpt')] | .//div[contains(@class, 'entry-content')] | .//p", $node)->item(0);
                $body = $excerptNode ? trim($excerptNode->nodeValue) : '';
                
                $articles[] = [
                    'title' => $title,
                    'url' => $url,
                    'image' => $image,
                    'source' => 'C7nema',
                    'body' => $body
                ];
            }
        } elseif (strpos($source['url'], 'cinevisao.pt') !== false) {
            // Cinevisão logic
            $nodes = $xpath->query("//article | //div[contains(@class, 'post-item')]");
            foreach ($nodes as $node) {
                $titleNode = $xpath->query(".//h2[contains(@class, 'entry-title')]/a | .//h2/a", $node)->item(0);
                if (!$titleNode) continue;
                
                $title = trim($titleNode->nodeValue);
                $url = $titleNode->getAttribute('href');
                
                $imgNode = $xpath->query(".//img", $node)->item(0);
                $image = $imgNode ? ($imgNode->getAttribute('data-src') ?: ($imgNode->getAttribute('data-lazy-src') ?: $imgNode->getAttribute('src'))) : null;
                
                $excerptNode = $xpath->query(".//div[contains(@class, 'post-excerpt')] | .//div[contains(@class, 'entry-content')] | .//p", $node)->item(0);
                $body = $excerptNode ? trim($excerptNode->nodeValue) : '';

                $articles[] = [
                    'title' => $title,
                    'url' => $url,
                    'image' => $image,
                    'source' => 'Cinevisão',
                    'body' => $body
                ];
            }
        }
 elseif (strpos($source['url'], 'mag.sapo.pt') !== false) {
            // SAPO Mag logic
            // SAPO Mag often uses a list of articles with class 'thumb' or 'article'
            $nodes = $xpath->query("//li[contains(@class, 'thumb')] | //article");
            foreach ($nodes as $node) {
                $titleNode = $xpath->query(".//h3 | .//h2", $node)->item(0);
                if (!$titleNode) continue;
                
                $title = trim($titleNode->nodeValue);
                $linkNode = $xpath->query(".//a", $node)->item(0);
                if (!$linkNode) continue;
                
                $url = $linkNode->getAttribute('href');
                if (strpos($url, 'http') !== 0) $url = 'https://mag.sapo.pt' . $url;
                
                $imgNode = $xpath->query(".//img", $node)->item(0);
                $image = $imgNode ? ($imgNode->getAttribute('data-src') ?: $imgNode->getAttribute('src')) : null;
                
                $excerptNode = $xpath->query(".//div[contains(@class, 'lead')] | .//p", $node)->item(0);
                $body = $excerptNode ? trim($excerptNode->nodeValue) : '';

                $articles[] = [
                    'title' => $title,
                    'url' => $url,
                    'image' => $image,
                    'source' => 'SAPO Mag',
                    'body' => $body
                ];
            }
        }

        // Limit to 5 latest articles per source
        $articles = array_slice($articles, 0, 5);

        // Save to DB
        foreach ($articles as $art) {
            $slug = slugify($art['title']);
            
            // Check if exists
            $check = $pdo->prepare("SELECT id FROM news WHERE slug = ? OR source_url = ?");
            $check->execute([$slug, $art['url']]);
            if ($check->fetch()) continue;

            // Deep scrape detail page for the body
            $body = '';
            $detailHtml = @file_get_contents($art['url']);
            if ($detailHtml) {
                $detailDoc = new DOMDocument();
                @$detailDoc->loadHTML('<?xml encoding="utf-8" ?>' . $detailHtml);
                $detailXpath = new DOMXPath($detailDoc);

                if (strpos($art['url'], 'c7nema.net') !== false) {
                    $paras = $detailXpath->query("//div[contains(@class, 'td-post-content')]//p | //div[contains(@class, 'entry-content')]//p");
                } elseif (strpos($art['url'], 'cinevisao.pt') !== false) {
                    $paras = $detailXpath->query("//div[contains(@class, 'entry-content')]//p");
                } elseif (strpos($art['url'], 'sapo.pt') !== false) {
                    $paras = $detailXpath->query("//div[contains(@class, 'detail-content')]//p");
                } else {
                    $paras = $detailXpath->query("//article//p | //div[contains(@class, 'content')]//p");
                }

                $count = 0;
                foreach ($paras as $p) {
                    $text = trim($p->nodeValue);
                    if (strlen($text) < 40) continue;
                    if (strpos($text, 'voz foi gerada') !== false || strpos($text, 'resumo foi criado') !== false) continue;
                    $body .= $text . "\n\n";
                    $count++;
                    if ($count >= 3) break;
                }
            }

            $stmtIns = $pdo->prepare("INSERT INTO news (title, slug, body, image, source, source_url, status) VALUES (?, ?, ?, ?, ?, ?, 'published')");
            $stmtIns->execute([
                $art['title'],
                $slug,
                trim($body),
                $art['image'],
                $art['source'],
                $art['url']
            ]);
            $imported_count++;
        }
    }

    echo json_encode(['success' => true, 'imported' => $imported_count]);
}
?>
