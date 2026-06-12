<?php
require_once 'headers.php';
require_once 'db.php';
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display as HTML

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        if (isset($_GET['action']) && $_GET['action'] === 'sync') {
            syncFeeds($pdo);
        } else if (isset($_GET['action']) && $_GET['action'] === 'items') {
            listItems($pdo);
        } else {
            listFeeds($pdo);
        }
    } else if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (isset($data['add_feed'])) {
            addFeed($pdo, $data['add_feed']);
        } else if (isset($data['delete_feed'])) {
            deleteFeed($pdo, $data['delete_feed']);
        } else if (isset($data['mark_read'])) {
            markRead($pdo, $data['mark_read']);
        } else if (isset($data['mark_all_read'])) {
            markAllRead($pdo);
        } else if (isset($data['delete_alert'])) {
            deleteAlert($pdo, $data['delete_alert']);
        } else if (isset($data['delete_all_alerts'])) {
            deleteAllAlerts($pdo);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function listFeeds($pdo) {
    $stmt = $pdo->query("SELECT * FROM google_alerts_feeds ORDER BY id DESC");
    echo json_encode($stmt->fetchAll());
}

function addFeed($pdo, $feed) {
    if (empty($feed['name']) || empty($feed['url'])) {
        throw new Exception("Dados inválidos.");
    }
    $stmt = $pdo->prepare("INSERT INTO google_alerts_feeds (name, url) VALUES (?, ?)");
    $stmt->execute([$feed['name'], $feed['url']]);
    echo json_encode(['success' => true]);
}

function deleteFeed($pdo, $id) {
    $stmt = $pdo->prepare("DELETE FROM google_alerts_feeds WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}

function syncFeeds($pdo) {
    $stmt = $pdo->query("SELECT * FROM google_alerts_feeds");
    $feeds = $stmt->fetchAll();
    $newItemsCount = 0;

    foreach ($feeds as $feed) {
        try {
            // Use cURL for better compatibility
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $feed['url']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Antestreias Dashboard)');
            $xmlString = curl_exec($ch);
            curl_close($ch);

            if (!$xmlString) continue;
            
            $rss = simplexml_load_string($xmlString);
            if (!$rss) continue;

            // Handle Atom (Google Alerts default)
            if ($rss->entry) {
                foreach ($rss->entry as $entry) {
                    $guid = (string)$entry->id;
                    $title = (string)$entry->title;
                    $link = (string)$entry->link['href'];
                    $desc = (string)$entry->content;
                    $pubDate = date('Y-m-d H:i:s', strtotime((string)$entry->updated));

                    $stmt = $pdo->prepare("INSERT IGNORE INTO google_alerts_items (feed_id, title, link, description, pub_date, guid) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$feed['id'], $title, $link, $desc, $pubDate, $guid]);
                    if ($stmt->rowCount() > 0) $newItemsCount++;
                }
            } 
            // Handle RSS
            else if ($rss->channel && $rss->channel->item) {
                foreach ($rss->channel->item as $item) {
                    $guid = (string)($item->guid ?: $item->link);
                    $title = (string)$item->title;
                    $link = (string)$item->link;
                    $desc = (string)$item->description;
                    $pubDate = date('Y-m-d H:i:s', strtotime((string)$item->pubDate));

                    $stmt = $pdo->prepare("INSERT IGNORE INTO google_alerts_items (feed_id, title, link, description, pub_date, guid) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$feed['id'], $title, $link, $desc, $pubDate, $guid]);
                    if ($stmt->rowCount() > 0) $newItemsCount++;
                }
            }
        } catch (Exception $e) {
            continue;
        }
    }
    echo json_encode(['success' => true, 'new_items' => $newItemsCount]);
}

function listItems($pdo) {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $unreadOnly = isset($_GET['unread']) && $_GET['unread'] === '1';
    
    $where = $unreadOnly ? "WHERE is_read = 0" : "";
    $stmt = $pdo->query("SELECT * FROM google_alerts_items $where ORDER BY pub_date DESC LIMIT $limit");
    echo json_encode($stmt->fetchAll());
}

function markRead($pdo, $id) {
    $stmt = $pdo->prepare("UPDATE google_alerts_items SET is_read = 1 WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}

function markAllRead($pdo) {
    $pdo->query("UPDATE google_alerts_items SET is_read = 1");
    echo json_encode(['success' => true]);
}

function deleteAlert($pdo, $id) {
    $stmt = $pdo->prepare("DELETE FROM google_alerts_items WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}

function deleteAllAlerts($pdo) {
    $pdo->query("DELETE FROM google_alerts_items");
    echo json_encode(['success' => true]);
}
