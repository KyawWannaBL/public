<?php
// chat.php
header("Content-Type: application/json");
// Security: Only allow your specific domain in production, or * for testing
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

require_once "config.php";

// Handle incoming JSON
$input = json_decode(file_get_contents("php://input"), true);
$userMessage = trim($input["message"] ?? "");

if (!$userMessage) {
    echo json_encode(["reply" => "Please type a message."]);
    exit;
}

// Prepare OpenAI Payload
$payload = [
    "model" => "gpt-4o-mini", // Ensure you have access to this model
    "messages" => [
        [
            "role" => "system",
            "content" => "You are BRIA, Britium Ventures’ professional AI assistant. Answer concisely about trade, logistics, sourcing, compliance, and Myanmar markets in a formal yet friendly tone."
        ],
        [
            "role" => "user",
            "content" => $userMessage
        ]
    ],
    "temperature" => 0.7,
    "max_tokens" => 400
];

$ch = curl_init("https://api.openai.com/v1/chat/completions");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "Authorization: Bearer " . OPENAI_API_KEY
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Error Handling
if ($curlError) {
    echo json_encode(["reply" => "Server Error: Connection failed ($curlError)"]);
    exit;
}

if ($httpCode >= 400) {
    $errorData = json_decode($response, true);
    $errorMessage = $errorData['error']['message'] ?? "Unknown API Error";
    echo json_encode(["reply" => "AI Error ($httpCode): $errorMessage"]);
    exit;
}

// Success
$data = json_decode($response, true);
$reply = $data["choices"][0]["message"]["content"] ?? "I'm having trouble thinking right now.";

echo json_encode(["reply" => $reply]);
?>
