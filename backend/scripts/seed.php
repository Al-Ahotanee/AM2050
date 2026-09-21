<?php
declare(strict_types=1);

use AM2050\Core\Env;
use AM2050\Support\Ulids;

require dirname(__DIR__) . '/vendor/autoload.php';
Env::load(dirname(__DIR__));
$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', Env::get('DB_HOST'), Env::get('DB_PORT', '3306'), Env::get('DB_NAME'));
$pdo = new PDO($dsn, Env::get('DB_USER'), Env::get('DB_PASS'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->beginTransaction();
try {
    $state = Ulids::make(); $lga = Ulids::make(); $ward = Ulids::make();
    $pdo->prepare('INSERT INTO states (id, name, code) VALUES (:id, :name, :code) ON DUPLICATE KEY UPDATE name=VALUES(name)')->execute(['id' => $state, 'name' => 'Jigawa', 'code' => 'JIG']);
    $stateId = $pdo->query("SELECT id FROM states WHERE code = 'JIG'")->fetchColumn();
    $lookupLga = $pdo->prepare('SELECT id FROM lgas WHERE name=:name AND state_id=:state LIMIT 1'); $lookupLga->execute(['name' => 'Buji', 'state' => $stateId]); $lgaId = $lookupLga->fetchColumn();
    if (!$lgaId) { $pdo->prepare('INSERT INTO lgas (id, name, state_id) VALUES (:id, :name, :state)')->execute(['id' => $lga, 'name' => 'Buji', 'state' => $stateId]); $lgaId = $lga; }
    $lookupWard = $pdo->prepare('SELECT id FROM wards WHERE name=:name AND lga_id=:lga LIMIT 1'); $lookupWard->execute(['name' => 'Ahoto', 'lga' => $lgaId]); $wardId = $lookupWard->fetchColumn();
    if (!$wardId) { $pdo->prepare('INSERT INTO wards (id, name, lga_id) VALUES (:id, :name, :lga)')->execute(['id' => $ward, 'name' => 'Ahoto', 'lga' => $lgaId]); }
    $rules = ['incentiveAttendanceThreshold' => 80, 'incentiveAmount' => 0, 'slaDays' => 7, 'programName' => 'Arewa Mission 2050'];
    foreach ($rules as $key => $value) { $pdo->prepare('INSERT INTO program_rules (id, rule_key, rule_value) VALUES (:id, :key, :value) ON DUPLICATE KEY UPDATE rule_value=VALUES(rule_value)')->execute(['id' => Ulids::make(), 'key' => $key, 'value' => json_encode($value, JSON_THROW_ON_ERROR)]); }
    $pdo->commit();
    fwrite(STDOUT, "Bootstrapped Jigawa / Buji / Ahoto. No communities, user accounts, passwords, or operational records were created.\n");
} catch (Throwable $error) {
    $pdo->rollBack();
    throw $error;
}
