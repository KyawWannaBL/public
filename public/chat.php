<?php
// chat.php (Assistants API Version)
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

require_once "config.php";

$input = json_decode(file_get_contents("php://input"), true);
$userMessage = trim($input["message"] ?? "");

if (!$userMessage) {
    echo json_encode(["reply" => "Please type a message."]);
    exit;
}

// ---------------------------------------------------------
// STEP 1: Create a Thread and Run the Assistant
// ---------------------------------------------------------
$runUrl = "https://api.openai.com/v1/threads/runs";
$runData = [
    "assistant_id" => OPENAI_ASSISTANT_ID,
    "thread" => [
        "messages" => [
            [
                "role" => "user",
                "content" => $userMessage
            ]
        ]
    ]
];

$ch = curl_init($runUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($runData),
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "Authorization: Bearer " . OPENAI_API_KEY,
        "OpenAI-Beta: assistants=v2" // Required for Assistants API
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if ($httpCode >= 400) {
    echo json_encode(["reply" => "Error starting Assistant: " . $response]);
    exit;
}
$runObj = json_decode($response, true);
$threadId = $runObj['thread_id'];
$runId = $runObj['id'];
curl_close($ch);

// ---------------------------------------------------------
// STEP 2: Poll (Wait) for the Assistant to Finish
// ---------------------------------------------------------
// Assistants are not instant. We must check status loop.
$status = 'queued';
$attempts = 0;

while ($status !== 'completed' && $attempts < 20) {
    sleep(1); // Wait 1 second between checks
    $attempts++;

    $checkUrl = "https://api.openai.com/v1/threads/$threadId/runs/$runId";
    $ch = curl_init($checkUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . OPENAI_API_KEY,
            "OpenAI-Beta: assistants=v2"
        ]
    ]);
    $checkResp = curl_exec($ch);
    curl_close($ch);

    $checkObj = json_decode($checkResp, true);
    $status = $checkObj['status'] ?? 'failed';

    if ($status === 'failed' || $status === 'cancelled' || $status === 'expired') {
        echo json_encode(["reply" => "Assistant failed to process request."]);
        exit;
    }
}

// ---------------------------------------------------------
// STEP 3: Retrieve the Message
// ---------------------------------------------------------
$msgUrl = "https://api.openai.com/v1/threads/$threadId/messages";
$ch = curl_init($msgUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer " . OPENAI_API_KEY,
        "OpenAI-Beta: assistants=v2"
    ]
]);
$msgResp = curl_exec($ch);
curl_close($ch);

$msgObj = json_decode($msgResp, true);
// Get the latest message (first in list)
$replyText = $msgObj['data'][0]['content'][0]['text']['value'] ?? "No response content found.";

// Remove any citations like 【4:0†source】 if they appear
$replyText = preg_replace('/【.*?】/', '', $replyText);

echo json_encode(["reply" => $replyText]);
?>
