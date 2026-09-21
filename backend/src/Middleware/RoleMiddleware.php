<?php
declare(strict_types=1);

namespace AM2050\Middleware;

use AM2050\Core\Response;

final class RoleMiddleware
{
    private const RANKS = ['super_admin' => 100, 'program_admin' => 80, 'lga_supervisor' => 60, 'ward_supervisor' => 50, 'headmaster' => 40, 'mobilizer' => 30, 'almajiri_liaison' => 30, 'teacher' => 20, 'guardian' => 10];

    public static function require(array $auth, string $minimumRole, array $excludedRoles = []): void
    {
        if (in_array($auth['role'], $excludedRoles, true) || (self::RANKS[$auth['role']] ?? 0) < (self::RANKS[$minimumRole] ?? PHP_INT_MAX)) {
            Response::error('You do not have permission to perform this action.', 403);
        }
    }

    /** Enforces the documented per-module capability matrix where rank alone is insufficient. */
    public static function allow(array $auth, array $roles): void
    {
        if (!in_array($auth['role'], $roles, true)) {
            Response::error('You do not have permission to perform this action.', 403);
        }
    }
}
