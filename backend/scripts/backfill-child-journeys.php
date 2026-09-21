<?php
declare(strict_types=1);
use AM2050\Core\Database;
use AM2050\Core\Env;
use AM2050\Services\ChildJourneyService;
use AM2050\Support\AuditLogger;
require dirname(__DIR__).'/vendor/autoload.php';
Env::load(dirname(__DIR__));
$database=new Database();
$service=new ChildJourneyService($database,new AuditLogger($database->pdo()));
$result=$service->backfill();
fwrite(STDOUT,"Child Journey backfill completed: {$result['processed']} children, run {$result['runId']}\n");
