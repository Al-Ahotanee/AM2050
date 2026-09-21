<?php
declare(strict_types=1);

use AM2050\Core\Env;
use AM2050\Support\Ulids;

require dirname(__DIR__) . '/vendor/autoload.php';
Env::load(dirname(__DIR__));

$name = trim((string) Env::get('BOOTSTRAP_ADMIN_NAME'));
$phone = trim((string) Env::get('BOOTSTRAP_ADMIN_PHONE'));
$email = trim((string) Env::get('BOOTSTRAP_ADMIN_EMAIL'));
$password = (string) Env::get('BOOTSTRAP_ADMIN_PASSWORD');
if ($name === '' || !preg_match('/^0\d{10}$/', $phone) || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 14) {
    throw new RuntimeException('Set BOOTSTRAP_ADMIN_NAME, a valid Nigerian BOOTSTRAP_ADMIN_PHONE, BOOTSTRAP_ADMIN_EMAIL, and a 14+ character BOOTSTRAP_ADMIN_PASSWORD.');
}
$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', Env::get('DB_HOST'), Env::get('DB_PORT', '3306'), Env::get('DB_NAME'));
$pdo = new PDO($dsn, Env::get('DB_USER'), Env::get('DB_PASS'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$exists = $pdo->prepare('SELECT id FROM users WHERE phone=:phone OR email=:email LIMIT 1');
$exists->execute(['phone' => $phone, 'email' => $email]);
if ($exists->fetchColumn()) throw new RuntimeException('An account already exists for that phone or email.');
$pdo->prepare('INSERT INTO users (id,name,role,phone,email,password_hash,is_active) VALUES (:id,:name,:role,:phone,:email,:hash,1)')->execute(['id' => Ulids::make(), 'name' => $name, 'role' => 'super_admin', 'phone' => $phone, 'email' => $email, 'hash' => password_hash($password, PASSWORD_BCRYPT)]);
fwrite(STDOUT, "Created initial super administrator. Remove BOOTSTRAP_ADMIN_PASSWORD from the host environment now.\n");
