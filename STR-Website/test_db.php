<?php
$conn = new mysqli('127.0.0.1', 'root', '', 'saampark_db');
if ($conn->connect_error) {
    echo "MySQL Connection Error: " . $conn->connect_error;
} else {
    $res = $conn->query("SELECT COUNT(*) as cnt FROM service_variants");
    $row = $res->fetch_assoc();
    echo "SUCCESS: Connected to MySQL saampark_db! Service variants in DB: " . $row['cnt'];
}
?>
