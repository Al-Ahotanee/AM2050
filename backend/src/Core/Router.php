<?php
declare(strict_types=1);

namespace AM2050\Core;

use RuntimeException;

final class Router
{
    /** @var array<int, array{method:string,pattern:string,handler:callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = ['method' => strtoupper($method), 'pattern' => $pattern, 'handler' => $handler];
    }

    public function dispatch(Request $request): never
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method) {
                continue;
            }
            $regex = '#^' . preg_replace('#:([A-Za-z_][A-Za-z0-9_]*)#', '(?P<$1>[^/]+)', $route['pattern']) . '$#';
            if (preg_match($regex, $request->path, $matches) === 1) {
                $params = array_filter($matches, static fn($key): bool => !is_int($key), ARRAY_FILTER_USE_KEY);
                ($route['handler'])($request, $params);
                throw new RuntimeException('Route handler returned without a response.');
            }
        }
        Response::error('Endpoint not found.', 404);
    }
}
