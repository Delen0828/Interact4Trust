<?php
/**
 * Simple Study Completion Redirect
 */

function safe_log_value($value) {
    $text = is_scalar($value) ? (string)$value : json_encode($value);
    if ($text === false || $text === null) {
        return '';
    }
    $text = str_replace(["\r", "\n"], ' ', $text);
    if (strlen($text) > 180) {
        $text = substr($text, 0, 180) . '...';
    }
    return $text;
}

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
    $request_data = [];
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw_body = file_get_contents('php://input');
        if (is_string($raw_body) && $raw_body !== '') {
            $decoded = json_decode($raw_body, true);
            if (is_array($decoded)) {
                $request_data = $decoded;
            }
        }
    }

    $save_status = safe_log_value($request_data['save_status'] ?? 'unknown');
    $save_token = safe_log_value($request_data['save_token'] ?? 'none');
    $save_attempts = safe_log_value($request_data['save_attempts'] ?? 'n/a');
    $save_error_last = safe_log_value($request_data['save_error_last'] ?? '');

    // Log completion (optional)
    $completion_log = date('Y-m-d H:i:s') .
        " - Study completion request ({$_SERVER['REQUEST_METHOD']})" .
        " save_status=$save_status save_token=$save_token save_attempts=$save_attempts";
    if ($save_error_last !== '') {
        $completion_log .= " save_error_last=$save_error_last";
    }
    $completion_log .= "\n";
    @file_put_contents(__DIR__ . '/data/completion_log.txt', $completion_log, FILE_APPEND | LOCK_EX);

    // Return Prolific completion URL
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'redirect_url' => 'https://app.prolific.com/submissions/complete?cc=CB4A5J6F'
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
