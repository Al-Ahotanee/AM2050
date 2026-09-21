<?php
declare(strict_types=1);

use AM2050\Core\Env;
use AM2050\Support\Ulids;

require dirname(__DIR__) . '/vendor/autoload.php';
Env::load(dirname(__DIR__));

$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', Env::get('DB_HOST'), Env::get('DB_PORT', '3306'), Env::get('DB_NAME'));
$pdo = new PDO($dsn, Env::get('DB_USER'), Env::get('DB_PASS'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ward = $pdo->query("SELECT id FROM wards ORDER BY created_at ASC LIMIT 1")->fetchColumn();
if (!$ward) throw new RuntimeException('Create a ward before creating sandbox role scopes.');
$school = $pdo->prepare("SELECT id FROM schools WHERE school_id = 'AM2050-SANDBOX-001' LIMIT 1"); $school->execute(); $schoolId = $school->fetchColumn();
if (!$schoolId) {
    $schoolId = Ulids::make();
    $pdo->prepare("INSERT INTO schools(id,school_id,school_name,school_type,ownership,ward_id,total_capacity) VALUES(:id,'AM2050-SANDBOX-001','AM2050 Sandbox Learning Centre','integrated','community',:ward,80)")->execute(['id' => $schoolId, 'ward' => $ward]);
}
$class = $pdo->prepare("SELECT id FROM school_classes WHERE class_code = 'AM2050-SBX-P1' LIMIT 1"); $class->execute(); $classId = $class->fetchColumn();
if (!$classId) {
    $classId = Ulids::make();
    $pdo->prepare("INSERT INTO school_classes(id,class_code,class_name,school_id,class_level,capacity,academic_year) VALUES(:id,'AM2050-SBX-P1','Sandbox Primary 1',:school,'Primary 1',40,'2026/2027')")->execute(['id' => $classId, 'school' => $schoolId]);
}
fwrite(STDOUT, json_encode(['schoolId' => $schoolId, 'classId' => $classId], JSON_THROW_ON_ERROR) . PHP_EOL);
