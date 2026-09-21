<?php
declare(strict_types=1);

namespace AM2050\Controllers;

use AM2050\Core\Request;
use AM2050\Core\Response;
use AM2050\Middleware\AuthMiddleware;
use AM2050\Middleware\RoleMiddleware;
use AM2050\Services\ChildJourneyService;

final class ChildJourneyController
{
    private const ROLES=['super_admin','program_admin','lga_supervisor','ward_supervisor','headmaster','mobilizer','almajiri_liaison','teacher','guardian'];
    public function __construct(private readonly AuthMiddleware $auth, private readonly ChildJourneyService $service) {}
    private function actor(Request $request): array { $actor=$this->auth->require($request); RoleMiddleware::allow($actor,self::ROLES); return $actor; }
    public function children(Request $request): never { $actor=$this->actor($request); $result=$this->service->children($actor,$request->query); Response::paginate($result['data'],$result['page'],$result['limit'],$result['total']); }
    public function journey(Request $request,array $params): never { Response::success($this->service->journey($this->actor($request),$params['id'],$request->query)); }
}
