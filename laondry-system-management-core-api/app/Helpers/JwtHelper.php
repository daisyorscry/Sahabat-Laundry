<?php

namespace App\Helpers;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtHelper
{
    public static function generateAccessToken(array $payload): string
    {
        $now = time();
        $payload['iat'] = $now;
        $payload['jti'] = $payload['jti'] ?? bin2hex(random_bytes(8));
        $payload['exp'] = $now + (int) env('JWT_ACCESS_EXPIRE', 900); // 15m default
        return JWT::encode($payload, env('JWT_SECRET'), 'HS256');
    }

    public static function generateRefreshToken(array $payload): string
    {
        $now = time();
        $payload['iat'] = $now;
        $payload['jti'] = $payload['jti'] ?? bin2hex(random_bytes(8));
        $payload['exp'] = $now + (int) env('JWT_REFRESH_EXPIRE', 604800); // 7d default
        return JWT::encode($payload, env('JWT_SECRET'), 'HS256');
    }

    public static function decode(string $token): object
    {
        return JWT::decode($token, new Key(env('JWT_SECRET'), 'HS256'));
    }
}
