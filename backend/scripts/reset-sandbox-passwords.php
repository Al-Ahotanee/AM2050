<?php
declare(strict_types=1);

use AM2050\Core\Env;

require dirname(__DIR__) . '/vendor/autoload.php';
Env::load(dirname(__DIR__));

if (Env::get('APP_ENV') !== 'local') {
    throw new RuntimeException('Sandbox credential resets are permitted only in APP_ENV=local.');
}

$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', Env::get('DB_HOST'), Env::get('DB_PORT', '3306'), Env::get('DB_NAME'));
$pdo = new PDO($dsn, Env::get('DB_USER'), Env::get('DB_PASS'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$phones = ['09024355355', '08000000011', '08000000012', '08000000013', '08000000014', '08000000015', '08000000016', '08000000017', '08000000018'];
$password = 'AM2050-Sandbox-2026!';
$statement = $pdo->prepare('UPDATE users SET password_hash=:hash, is_active=1, failed_login_count=0, locked_until=NULL WHERE phone=:phone');
$updated = 0;
foreach ($phones as $phone) {
    $statement->execute(['hash' => password_hash($password, PASSWORD_BCRYPT), 'phone' => $phone]);
    $updated += $statement->rowCount();
}
fwrite(STDOUT, "Reset {$updated} local sandbox account password(s). Rotate all sandbox credentials before production deployment.\n");
