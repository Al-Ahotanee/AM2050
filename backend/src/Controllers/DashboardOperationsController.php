<?php
declare(strict_types=1);
namespace AM2050\Controllers;
use AM2050\Core\Request;use AM2050\Core\Response;use AM2050\Middleware\AuthMiddleware;use AM2050\Middleware\RoleMiddleware;use AM2050\Services\DashboardOperationsService;
final class DashboardOperationsController{
 private const EXEC=['super_admin','program_admin'];
 public function __construct(private readonly AuthMiddleware $auth,private readonly DashboardOperationsService $service){}
 private function actor(Request $r):array{$a=$this->auth->require($r);RoleMiddleware::allow($a,self::EXEC);return$a;}
 public function owners(Request $r,array $p):never{$a=$this->actor($r);Response::success($this->service->owners($a,$p['key']));}
 public function assign(Request $r,array $p):never{$a=$this->actor($r);$d=$r->body();Response::success($this->service->assign($a,$p['key'],$d['ownerUserId']??null));}
 public function sla(Request $r):never{$a=$this->actor($r);Response::success($this->service->slaTargets($a));}
 public function updateSla(Request $r):never{$a=$this->actor($r);Response::success($this->service->updateSlaTargets($a,$r->body()));}
 public function schedules(Request $r):never{$a=$this->actor($r);Response::success($this->service->schedules($a));}
 public function executiveOwners(Request $r):never{$a=$this->actor($r);Response::success($this->service->executiveOwners($a));}
 public function createSchedule(Request $r):never{$a=$this->actor($r);Response::success($this->service->createSchedule($a,$r->body()),201);}
 public function updateSchedule(Request $r,array $p):never{$a=$this->actor($r);Response::success($this->service->updateSchedule($a,$p['id'],$r->body()));}
 public function packs(Request $r):never{$a=$this->actor($r);Response::success($this->service->packs($a));}
 public function generate(Request $r):never{$a=$this->actor($r);$pack=$this->service->generatePack($a,$r->body());Response::success($pack,!empty($pack['was_reused'])?200:201);}
 public function download(Request $r,array $p):never{$a=$this->actor($r);$this->service->outputPack($a,$p['id']);}
}
