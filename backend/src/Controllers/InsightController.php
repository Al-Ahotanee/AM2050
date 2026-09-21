<?php
declare(strict_types=1);

namespace AM2050\Controllers;

use AM2050\Core\Request;
use AM2050\Core\Response;
use AM2050\Middleware\AuthMiddleware;
use AM2050\Middleware\RoleMiddleware;
use AM2050\Services\InsightService;

final class InsightController
{
    private const DEFAULTER_ROLES = ['super_admin','program_admin','lga_supervisor','ward_supervisor','headmaster','teacher'];
    private const OUT_OF_SCHOOL_ROLES = ['super_admin','program_admin','lga_supervisor','ward_supervisor','mobilizer'];
    private const STAFF_ROLES = ['super_admin','program_admin','lga_supervisor','ward_supervisor','headmaster','mobilizer','almajiri_liaison','teacher'];
    public function __construct(private readonly AuthMiddleware $auth, private readonly InsightService $service) {}
    private function actor(Request $request): array { return $this->auth->require($request); }
    public function stats(Request $request): never { $actor=$this->actor($request);RoleMiddleware::allow($actor,self::STAFF_ROLES);Response::success($this->service->dashboard($actor)); }
    public function outOfSchool(Request $request): never { $actor=$this->actor($request);RoleMiddleware::allow($actor,self::OUT_OF_SCHOOL_ROLES);Response::success($this->service->outOfSchool($actor)); }
    public function defaulters(Request $request): never { $actor=$this->actor($request);RoleMiddleware::allow($actor,self::DEFAULTER_ROLES);Response::success($this->service->defaulters($actor,$request->query)); }
    public function trend(Request $request): never { $actor=$this->actor($request);RoleMiddleware::allow($actor,self::DEFAULTER_ROLES);Response::success($this->service->attendanceTrend($actor)); }
    public function heatMap(Request $request): never { $actor=$this->actor($request);RoleMiddleware::allow($actor,['super_admin','program_admin','lga_supervisor']);Response::success($this->service->heatMap($actor)); }
    public function dropoutRisk(Request $request): never { $actor=$this->actor($request);RoleMiddleware::allow($actor,['super_admin','program_admin','lga_supervisor','ward_supervisor']);Response::success($this->service->dropoutRisk($actor)); }
    public function roi(Request $request): never { $actor=$this->actor($request);RoleMiddleware::allow($actor,['super_admin','program_admin']);Response::success($this->service->roi()); }
    public function decisionDashboard(Request $request): never { $actor=$this->actor($request);RoleMiddleware::allow($actor,self::STAFF_ROLES);Response::success($this->service->decisionDashboard($actor)); }
    public function metricDrilldown(Request $request,array $params): never { $actor=$this->actor($request);RoleMiddleware::allow($actor,self::STAFF_ROLES);Response::success($this->service->metricDrilldown($actor,$params['metric'])); }
    public function exportMetric(Request $request,array $params): never { $actor=$this->actor($request);RoleMiddleware::allow($actor,self::STAFF_ROLES);$data=$this->service->metricDrilldown($actor,$params['metric']);$format=$request->query['format']??'csv';$safe=array_map(static fn($row)=>array_map(static fn($value)=>is_string($value)&&preg_match('/^[=+\-@]/',$value)?"'".$value:$value,$row),$data['rows']);if($format==='xlsx'){header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');header('Content-Disposition: attachment; filename="am2050-dashboard-'.$data['key'].'.xlsx"');$sheet=(new \PhpOffice\PhpSpreadsheet\Spreadsheet())->getActiveSheet();$sheet->fromArray($data['columns'],null,'A1');$sheet->fromArray($safe,null,'A2');$sheet->getStyle('A1:Z1')->getFont()->setBold(true);(new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($sheet->getParent()))->save('php://output');exit;}header('Content-Type: text/csv; charset=utf-8');header('Content-Disposition: attachment; filename="am2050-dashboard-'.$data['key'].'.csv"');$out=fopen('php://output','w');fputcsv($out,$data['columns']);foreach($safe as$row)fputcsv($out,$row);fclose($out);exit; }
}
