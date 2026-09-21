<?php
declare(strict_types=1);

namespace AM2050\Support;

/** Builds parameterized scope clauses. Every scoped repository must use one of these methods. */
final class ScopeFilter
{
    private const GLOBAL_ROLES = ['super_admin', 'program_admin'];

    public static function byWard(array $auth, string $wardColumn): array
    {
        if (in_array($auth['role'], self::GLOBAL_ROLES, true)) {
            return ['', []];
        }
        $scope = $auth['assigned_scope_id'] ?? null;
        return match ($auth['assigned_scope_type'] ?? null) {
            'ward' => [" AND {$wardColumn} = :scope_id", ['scope_id' => $scope]],
            'lga' => [" AND {$wardColumn} IN (SELECT id FROM wards WHERE lga_id = :scope_id)", ['scope_id' => $scope]],
            'state' => [" AND {$wardColumn} IN (SELECT w.id FROM wards w INNER JOIN lgas l ON l.id = w.lga_id WHERE l.state_id = :scope_id)", ['scope_id' => $scope]],
            default => [' AND 1 = 0', []],
        };
    }

    public static function bySchool(array $auth, string $schoolColumn): array
    {
        if (in_array($auth['role'], self::GLOBAL_ROLES, true)) {
            return ['', []];
        }
        if (($auth['assigned_scope_type'] ?? null) === 'school') {
            return [" AND {$schoolColumn} = :scope_id", ['scope_id' => $auth['assigned_scope_id']]];
        }
        if (($auth['assigned_scope_type'] ?? null) === 'class') {
            return [" AND {$schoolColumn} = (SELECT school_id FROM school_classes WHERE id = :scope_id)", ['scope_id' => $auth['assigned_scope_id']]];
        }
        return [' AND 1 = 0', []];
    }

    public static function byClass(array $auth, string $classColumn): array
    {
        if (in_array($auth['role'], self::GLOBAL_ROLES, true)) {
            return ['', []];
        }
        if (($auth['assigned_scope_type'] ?? null) === 'class') {
            return [" AND {$classColumn} = :scope_id", ['scope_id' => $auth['assigned_scope_id']]];
        }
        if (($auth['assigned_scope_type'] ?? null) === 'school') {
            return [" AND {$classColumn} IN (SELECT id FROM school_classes WHERE school_id = :scope_id)", ['scope_id' => $auth['assigned_scope_id']]];
        }
        return [' AND 1 = 0', []];
    }
}
