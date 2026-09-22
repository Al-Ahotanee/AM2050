<?php
declare(strict_types=1);

namespace AM2050\Controllers;

use AM2050\Core\Env;
use AM2050\Core\Request;
use AM2050\Core\Response;
use AM2050\Services\AuthService;

final class AuthController
{
    public function __construct(private readonly AuthService $auth) {}

    public function login(Request $request): never
    {
        $identifier = trim((string) (
            $request->input('phone') 
            ?? $request->input('email') 
            ?? $request->input('login') 
            ?? $request->input('identifier') 
            ?? $request->input('username') 
            ?? ''
        ));
        $password = (string) $request->input('password', '');
        if ($identifier === '' || $password === '') {
            Response::error('Phone or email and password are required.', 400);
        }
        try {
            $result = $this->auth->login($identifier, $password);
        } catch (\RuntimeException $error) {
            $status = str_contains($error->getMessage(), 'locked') ? 429 : 401;
            Response::error($error->getMessage(), $status);
        }
        $this->setRefreshCookie($result['refreshToken']);
        unset($result['refreshToken']);
        Response::success($result);
    }

    public function refresh(Request $request): never
    {
        $token = $_COOKIE['am2050_refresh'] ?? '';
        if ($token === '') { Response::error('Refresh token is missing.', 401); }
        try {
            $result = $this->auth->refresh($token);
        } catch (\RuntimeException $error) {
            $this->clearRefreshCookie();
            Response::error($error->getMessage(), 401);
        }
        $this->setRefreshCookie($result['refreshToken']);
        unset($result['refreshToken']);
        Response::success($result);
    }

    public function logout(Request $request): never
    {
        $token = $_COOKIE['am2050_refresh'] ?? '';
        if ($token !== '') { $this->auth->logout($token); }
        $this->clearRefreshCookie();
        Response::success(['loggedOut' => true]);
    }

    public function me(Request $request): never
    {
        Response::success(AuthService::publicUser((array) $request->get('auth')));
    }

    private function setRefreshCookie(string $token): void
    {
        $secure = Env::bool('COOKIE_SECURE', true); $sameSite = ucfirst(strtolower((string) Env::get('COOKIE_SAMESITE', 'Strict')));
        if (!in_array($sameSite, ['Strict', 'Lax', 'None'], true) || ($sameSite === 'None' && !$secure)) { $sameSite = 'Lax'; }
        setcookie('am2050_refresh', $token, ['expires' => time() + (int) Env::get('REFRESH_TOKEN_TTL_SECONDS', '604800'), 'path' => '/api/v1/auth', 'secure' => $secure, 'httponly' => true, 'samesite' => $sameSite]);
    }

    private function clearRefreshCookie(): void
    {
        $secure = Env::bool('COOKIE_SECURE', true); $sameSite = ucfirst(strtolower((string) Env::get('COOKIE_SAMESITE', 'Strict')));
        setcookie('am2050_refresh', '', ['expires' => time() - 3600, 'path' => '/api/v1/auth', 'secure' => $secure, 'httponly' => true, 'samesite' => in_array($sameSite, ['Strict', 'Lax', 'None'], true) ? $sameSite : 'Strict']);
    }
}
