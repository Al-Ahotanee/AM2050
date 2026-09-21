<?php
declare(strict_types=1);

namespace AM2050\Controllers;

use AM2050\Core\Request;
use AM2050\Core\Response;
use AM2050\Middleware\AuthMiddleware;
use AM2050\Middleware\RoleMiddleware;
use AM2050\Services\GovernanceService;

final class GovernanceController
{
    public function __construct(private readonly AuthMiddleware $auth, private readonly GovernanceService $service) {}
    private function actor(Request $request): array { $actor=$this->auth->require($request);RoleMiddleware::allow($actor,['super_admin','program_admin']);return$actor; }
    public function rules(Request $request): never { $this->actor($request);Response::success($this->service->rules()); }
    public function updateRule(Request $request,array $params): never { $actor=$this->actor($request);$body=$request->body();if(!array_key_exists('value',$body))Response::error('value is required.',400);Response::success($this->service->updateRule($actor,$params['key'],$body['value'])); }
    public function auditLog(Request $request): never { $this->actor($request);$result=$this->service->auditLog($request->query);Response::paginate($result['data'],$result['page'],$result['limit'],$result['total']); }
}
