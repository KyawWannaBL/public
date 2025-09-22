<?php
// contact.php - handles quotation form

// CONFIGURE THESE
$to = "info@britiumventures.com";   // where emails will be sent
$subject = "New Quotation Request - Britium Ventures";

// Check required fields
if(empty($_POST['name']) || empty($_POST['email']) || empty($_POST['message'])) {
    die("Error: Required fields missing.");
}

$name    = strip_tags($_POST['name']);
$email   = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
$phone   = strip_tags($_POST['phone']);
$message = nl2br(htmlspecialchars($_POST['message']));

// Build the message
$body  = "<h2>New Quotation Request</h2>";
$body .= "<p><strong>Name:</strong> {$name}</p>";
$body .= "<p><strong>Email:</strong> {$email}</p>";
$body .= "<p><strong>Phone:</strong> {$phone}</p>";
$body .= "<p><strong>Message:</strong><br>{$message}</p>";

$headers  = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: {$name} <{$email}>" . "\r\n";

// Handle file attachment
if(isset($_FILES['attachment']) && $_FILES['attachment']['error'] == UPLOAD_ERR_OK) {
    $file_tmp = $_FILES['attachment']['tmp_name'];
    $file_name = $_FILES['attachment']['name'];
    $file_size = $_FILES['attachment']['size'];
    $file_type = $_FILES['attachment']['type'];
    $file_data = chunk_split(base64_encode(file_get_contents($file_tmp)));

    $boundary = md5(time());

    $headers  = "From: {$name} <{$email}>\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n\r\n";

    $body  = "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $body .= "<h2>New Quotation Request</h2>";
    $body .= "<p><strong>Name:</strong> {$name}</p>";
    $body .= "<p><strong>Email:</strong> {$email}</p>";
    $body .= "<p><strong>Phone:</strong> {$phone}</p>";
    $body .= "<p><strong>Message:</strong><br>{$message}</p>\r\n\r\n";

    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: {$file_type}; name=\"{$file_name}\"\r\n";
    $body .= "Content-Disposition: attachment; filename=\"{$file_name}\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= $file_data . "\r\n\r\n";
    $body .= "--{$boundary}--";
}

// Send email
if(mail($to, $subject, $body, $headers)) {
    echo "<p style='color:lime'>✅ Your request has been sent successfully!</p>";
} else {
    echo "<p style='color:red'>❌ Error: Could not send your request. Try again later.</p>";
}
?>
