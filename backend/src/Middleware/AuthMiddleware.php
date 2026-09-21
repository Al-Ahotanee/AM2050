<?php
declare(strict_types=1);

namespace AM2050\Middleware;

use AM2050\Core\Request;
use AM2050\Core\Response;
use AM2050\Services\AuthService;

final class AuthMiddleware
{
    public function __construct(private readonly AuthService $auth) {}

    public function require(Request $request): array
    {
        $header = $request->header('authorization');
        if ($header === null || !preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            Response::error('Authentication is required.', 401);
        }
        try {
            $user = $this->auth->verifyAccessToken($matches[1]);
        } catch (\Throwable) {
            Response::error('Authentication token is invalid or expired.', 401);
        }
        $request->set('auth', $user);
        return $user;
    }
}
