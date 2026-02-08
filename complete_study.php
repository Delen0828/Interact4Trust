<?php
/**
 * Simple Study Completion Redirect
 */

// Set content type
header('Content-Type: application/json');

// Enable CORS  
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Accept both GET and POST
if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Log completion (optional)
    $completion_log = date('Y-m-d H:i:s') . " - Study completion request ({$_SERVER['REQUEST_METHOD']})\n";
    @file_put_contents(__DIR__ . '/data/completion_log.txt', $completion_log, FILE_APPEND | LOCK_EX);

    // Return Prolific completion URL
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'redirect_url' => 'https://app.prolific.com/submissions/complete?cc=CFQXJUIT'
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
