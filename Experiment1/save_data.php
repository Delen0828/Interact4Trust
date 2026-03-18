<?php
/**
 * jsPsych Data Saving Script
 * Saves experiment data to CSV files on the server
 * Filename format: user_[USER_ID]_[TIMESTAMP].csv
 */

// Set content type for JSON response
header('Content-Type: application/json');

// Enable CORS if needed (for development)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$save_token = null;
$participant_id = null;

try {
    // Get the posted data
    $post_data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($post_data)) {
        throw new Exception('Invalid JSON payload');
    }
    
    // Validate required data
    if (!isset($post_data['filedata']) || !isset($post_data['filename'])) {
        throw new Exception('Missing required data: filedata and filename');
    }
    
    $data = $post_data['filedata'];
    $filename = $post_data['filename'];
    $save_token = isset($post_data['save_token']) ? trim((string)$post_data['save_token']) : null;
    $participant_id = isset($post_data['participant_id']) ? trim((string)$post_data['participant_id']) : null;

    if ($save_token === '') {
        $save_token = null;
    }
    if ($participant_id === '') {
        $participant_id = null;
    }

    if ($save_token !== null) {
        if (strlen($save_token) > 160 || !preg_match('/^[A-Za-z0-9._:-]+$/', $save_token)) {
            throw new Exception('Invalid save_token format');
        }
    }
    
    // Validate filename format (basic security check)
    if (!preg_match('/^user_\d+_[\d\-T]+\.csv$/', $filename)) {
        throw new Exception('Invalid filename format');
    }
    
    // Ensure data directory exists
    $data_dir = __DIR__ . '/data';
    if (!file_exists($data_dir)) {
        if (!mkdir($data_dir, 0755, true)) {
            throw new Exception('Failed to create data directory');
        }
    }
    
    // Full file path
    $file_path = $data_dir . '/' . $filename;

    $token_file_path = null;
    if ($save_token !== null) {
        $token_dir = $data_dir . '/save_tokens';
        if (!file_exists($token_dir)) {
            if (!mkdir($token_dir, 0755, true)) {
                throw new Exception('Failed to create save token directory');
            }
        }

        $token_hash = hash('sha256', $save_token);
        $token_file_path = $token_dir . '/' . $token_hash . '.json';

        if (file_exists($token_file_path)) {
            $existing_meta = json_decode((string)@file_get_contents($token_file_path), true);
            $existing_filename = is_array($existing_meta) && isset($existing_meta['filename'])
                ? (string)$existing_meta['filename']
                : $filename;
            $existing_size = is_array($existing_meta) && isset($existing_meta['size'])
                ? (int)$existing_meta['size']
                : null;

            $duplicate_log_entry = date('Y-m-d H:i:s') .
                " - Duplicate save token hit: token=$save_token participant=" . ($participant_id ?? 'unknown') .
                " file=$existing_filename\n";
            file_put_contents($data_dir . '/save_log.txt', $duplicate_log_entry, FILE_APPEND | LOCK_EX);

            echo json_encode([
                'success' => true,
                'duplicate' => true,
                'save_token' => $save_token,
                'filename' => $existing_filename,
                'size' => $existing_size,
                'message' => 'Save token already recorded'
            ]);
            exit();
        }
    }
    
    // Check if file already exists (prevent overwriting)
    if (file_exists($file_path)) {
        // Add a unique suffix if file exists
        $path_info = pathinfo($filename);
        $base_name = $path_info['filename'];
        $extension = $path_info['extension'];
        $counter = 1;
        
        do {
            $new_filename = $base_name . '_' . $counter . '.' . $extension;
            $file_path = $data_dir . '/' . $new_filename;
            $counter++;
        } while (file_exists($file_path));
        
        $filename = $new_filename;
    }
    
    // Write the data to file
    $bytes_written = file_put_contents($file_path, $data);
    
    if ($bytes_written === false) {
        throw new Exception('Failed to write data to file');
    }

    if ($token_file_path !== null) {
        $token_payload = json_encode([
            'save_token' => $save_token,
            'participant_id' => $participant_id,
            'filename' => $filename,
            'size' => $bytes_written,
            'saved_at' => date('c')
        ], JSON_UNESCAPED_SLASHES);

        $tmp_token_file = $token_file_path . '.tmp';
        if (file_put_contents($tmp_token_file, $token_payload . "\n", LOCK_EX) === false || !rename($tmp_token_file, $token_file_path)) {
            @unlink($tmp_token_file);
            throw new Exception('Failed to persist save token');
        }
    }
    
    // Log the save operation (optional)
    $status = $save_token !== null ? 'saved_with_token' : 'saved_without_token';
    $log_entry = date('Y-m-d H:i:s') .
        " - $status: file=$filename bytes=" . strlen($data) .
        " participant=" . ($participant_id ?? 'unknown') .
        " token=" . ($save_token ?? 'none') . "\n";
    file_put_contents($data_dir . '/save_log.txt', $log_entry, FILE_APPEND | LOCK_EX);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'duplicate' => false,
        'save_token' => $save_token,
        'filename' => $filename,
        'size' => $bytes_written,
        'message' => 'Data saved successfully'
    ]);
    
} catch (Exception $e) {
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    
    // Log the error
    $error_log = date('Y-m-d H:i:s') .
        " - Error: " . $e->getMessage() .
        " participant=" . ($participant_id ?? 'unknown') .
        " token=" . ($save_token ?? 'none') . "\n";
    @file_put_contents(__DIR__ . '/data/error_log.txt', $error_log, FILE_APPEND | LOCK_EX);
}
?>
