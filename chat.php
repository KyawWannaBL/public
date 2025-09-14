<?php
// chat.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

require_once "config.php";

// Get incoming JSON
$input = json_decode(file_get_contents("php://input"), true);
$userMessage = $input["message"] ?? "";

if (!$userMessage) {
    echo json_encode(["error" => "No message provided."]);
    exit;
}

// OpenAI API call
$ch = curl_init("https://api.openai.com/v1/chat/completions");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . OPENAI_API_KEY
]);

$payload = [
    "model" => "gpt-4o-mini",
    "messages" => [
        ["role" => "system", "content" => "You are BRIA, the AI assistant for Britium Ventures. Provide professional, concise answers on trade, logistics, customs, compliance, sourcing, and Myanmar markets."],
        ["role" => "user", "content" => $userMessage]
    ],
    "max_tokens" => 300,
    "temperature" => 0.7
];

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo json_encode(["error" => curl_error($ch)]);
    exit;
}
curl_close($ch);

$data = json_decode($response, true);
$aiText = $data["choices"][0]["message"]["content"] ?? "⚠️ No response received.";

echo json_encode(["reply" => $aiText]);
