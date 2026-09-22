<?php
declare(strict_types=1);

namespace AM2050\Tests\Services;

use AM2050\Services\AuthService;
use PHPUnit\Framework\TestCase;

final class AuthServiceTest extends TestCase
{
    public function testPublicUserStripsSensitiveCredentials(): void
    {
        $rawUser = [
            'id' => '01M0E5SB0G19ZYGD0C02CZTEQP',
            'name' => 'Amina Bello',
            'role' => 'mobilizer',
            'phone' => '08012345678',
            'email' => 'amina@am2050.ng',
            'password_hash' => '$2y$10$abcdefghijklmnopqrstuvwxyz1234567890',
            'failed_login_count' => 2,
            'locked_until' => null,
            'assigned_scope_type' => 'ward',
            'assigned_scope_id' => '01M0E5SB0G19ZYGD0C02CZTEQW',
            'last_login' => '2026-09-20 10:00:00',
        ];

        $public = AuthService::publicUser($rawUser);

        self::assertSame('01M0E5SB0G19ZYGD0C02CZTEQP', $public['id']);
        self::assertSame('Amina Bello', $public['name']);
        self::assertSame('mobilizer', $public['role']);
        self::assertSame('08012345678', $public['phone']);
        self::assertSame('amina@am2050.ng', $public['email']);
        self::assertSame('ward', $public['assigned_scope_type']);
        self::assertSame('01M0E5SB0G19ZYGD0C02CZTEQW', $public['assigned_scope_id']);

        self::assertArrayNotHasKey('password_hash', $public);
        self::assertArrayNotHasKey('failed_login_count', $public);
        self::assertArrayNotHasKey('locked_until', $public);
        self::assertArrayNotHasKey('last_login', $public);
    }
}
