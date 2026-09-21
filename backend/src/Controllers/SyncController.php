<?php
declare(strict_types=1);
namespace AM2050\Controllers;
use AM2050\Core\Request; use AM2050\Core\Response; use AM2050\Middleware\AuthMiddleware; use AM2050\Middleware\RoleMiddleware; use AM2050\Services\SyncService;
final class SyncController { public function __construct(private readonly AuthMiddleware $auth,private readonly SyncService $service){} public function batch(Request $request):never{$actor=$this->auth->require($request);RoleMiddleware::require($actor,'mobilizer',['headmaster','teacher','guardian']);$records=$request->input('records',[]);if(!is_array($records)){Response::error('records must be an array.',400);}Response::success(['records'=>$this->service->batch($actor,$records)]);} }
