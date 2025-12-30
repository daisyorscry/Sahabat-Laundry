<?php
// app/Helpers/AuthTokenHelper.php

namespace App\Helpers;

use App\Models\Auth\User;
use App\Models\Auth\RefreshToken;
use App\Support\TokenBlacklist;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class AuthTokenHelper
{
    /**
     * Issue access + refresh token, simpan refresh ke DB (per device).
     * @return array{access_token:string, refresh_token:string}
     */
    public static function issue(User $user, Request $request, array $extraPayload = []): array
    {
        // Load memberTier relation if not loaded
        if (!$user->relationLoaded('memberTier')) {
            $user->load('memberTier');
        }

        $payload = array_merge($extraPayload, [
            'sub' => $user->id,
            'name' => $user->full_name,
            'phone' => $user->phone_number,
            'role' => $user->roles()->pluck('slug')->first(),
            'token_version' => (int) $user->token_version,
            'member_tier_code' => $user->memberTier?->code,
        ]);

        // Generate tokens
        $access = JwtHelper::generateAccessToken($payload);
        $refresh = JwtHelper::generateRefreshToken($payload);

        // Decode keduanya untuk ambil exp
        $decodedAccess = JwtHelper::decode($access);
        $decodedRefresh = JwtHelper::decode($refresh);

        // Simpan refresh token di DB
        RefreshToken::create([
            'user_id' => $user->id,
            'jti' => $decodedRefresh->jti,
            'device_id' => $request->header('X-Device-Id'),
            'ip' => $request->ip(),
            'ua' => $request->userAgent(),
            'expires_at' => Carbon::createFromTimestamp($decodedRefresh->exp),
        ]);

        // Return dengan expire_at biar mobile gak perlu decode lagi
        return [
            'access_token' => $access,
            'access_token_expires_at' => Carbon::createFromTimestamp($decodedAccess->exp)->toISOString(),
            'refresh_token' => $refresh,
            'refresh_token_expires_at' => Carbon::createFromTimestamp($decodedRefresh->exp)->toISOString(),
        ];
    }


    /**
     * Refresh rotation: revoke RT lama, buat pasangan token baru, simpan RT baru.
     * @return array{access_token:string, refresh_token:string}
     */
    public static function rotate(string $refreshToken): array
    {
        $rtPayload = JwtHelper::decode($refreshToken);
        $userId = $rtPayload->sub ?? null;
        $jti = $rtPayload->jti ?? null;
        $tvTok = (int) ($rtPayload->token_version ?? -1);
        if (!$userId || !$jti)
            throw new \RuntimeException('Refresh token tidak valid');

        $user = User::find($userId);
        if (!$user)
            throw new \RuntimeException('User tidak ditemukan');

        // cek token_version
        if ($tvTok < (int) $user->token_version) {
            throw new \RuntimeException('Sesi telah kedaluwarsa');
        }

        $row = RefreshToken::where('jti', $jti)->first();
        if (!$row)
            throw new \RuntimeException('Refresh token tidak berlaku');
        if ($row->revoked_at)
            throw new \RuntimeException('Refresh token sudah dicabut');
        if (now()->greaterThan($row->expires_at))
            throw new \RuntimeException('Refresh token kedaluwarsa');

        return DB::transaction(function () use ($user, $row) {
            // revoke lama
            $row->revoked_at = now();
            $row->save();

            // Load memberTier relation if not loaded
            if (!$user->relationLoaded('memberTier')) {
                $user->load('memberTier');
            }

            // issue baru
            $payload = [
                'sub' => $user->id,
                'name' => $user->full_name,
                'phone' => $user->phone_number,
                'role' => $user->roles()->pluck('slug')->first(),
                'token_version' => (int) $user->token_version,
                'member_tier_code' => $user->memberTier?->code,
            ];

            $newAccess = JwtHelper::generateAccessToken($payload);
            $newRefresh = JwtHelper::generateRefreshToken($payload);

            // Decode keduanya untuk ambil exp
            $decodedAccess = JwtHelper::decode($newAccess);
            $decodedRefresh = JwtHelper::decode($newRefresh);

            RefreshToken::create([
                'user_id' => $user->id,
                'jti' => $decodedRefresh->jti,
                'device_id' => $row->device_id,
                'ip' => $row->ip,
                'ua' => $row->ua,
                'expires_at' => Carbon::createFromTimestamp($decodedRefresh->exp),
            ]);

            // Return dengan expire_at biar mobile gak perlu decode lagi
            return [
                'access_token' => $newAccess,
                'access_token_expires_at' => Carbon::createFromTimestamp($decodedAccess->exp)->toISOString(),
                'refresh_token' => $newRefresh,
                'refresh_token_expires_at' => Carbon::createFromTimestamp($decodedRefresh->exp)->toISOString(),
            ];
        });
    }

    /**
     * Blacklist access token dari Authorization header (langsung invalid sampai exp).
     */
    public static function blacklistAccessFromRequest(Request $request): void
    {
        $auth = $request->header('Authorization');
        if (!$auth || !str_starts_with($auth, 'Bearer '))
            return;

        $access = trim(substr($auth, 7));
        try {
            $payload = JwtHelper::decode($access);
            $jti = $payload->jti ?? null;
            $exp = $payload->exp ?? null;
            if ($jti && $exp && $exp > time()) {
                TokenBlacklist::put($jti, $exp - time());
            }
        } catch (Throwable) {
            // ignore
        }
    }

    /**
     * Revoke 1 refresh token berdasarkan string token.
     */
    public static function revokeByToken(string $refreshToken): void
    {
        try {
            $rtPayload = JwtHelper::decode($refreshToken);
            $jti = $rtPayload->jti ?? null;
            if ($jti) {
                RefreshToken::where('jti', $jti)
                    ->whereNull('revoked_at')
                    ->update(['revoked_at' => now()]);
            }
        } catch (Throwable) {
            // idempotent
        }
    }

    /**
     * Revoke semua sesi pada device_id tertentu milik user.
     */
    public static function revokeByDevice(string $userId, string $deviceId): int
    {
        return RefreshToken::where('user_id', $userId)
            ->where('device_id', $deviceId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    /**
     * Revoke semua refresh token milik user (logout-all). Optional bump token_version.
     */
    public static function revokeAllForUser(User $user, bool $bumpTokenVersion = true): void
    {
        DB::transaction(function () use ($user, $bumpTokenVersion) {
            if ($bumpTokenVersion) {
                $user->token_version = ($user->token_version ?? 0) + 1;
                $user->save();
            }

            RefreshToken::where('user_id', $user->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);
        });
    }

    /**
     * Cek token_version payload vs DB. Lempar exception jika invalid.
     */
    public static function assertTokenVersionValid(object $payload): void
    {
        if (!property_exists($payload, 'sub') || !property_exists($payload, 'token_version')) {
            throw new \RuntimeException('Token tidak valid');
        }
        $user = User::find($payload->sub);
        if (!$user)
            throw new \RuntimeException('User tidak ditemukan');
        if ((int) $payload->token_version < (int) $user->token_version) {
            throw new \RuntimeException('Token sudah tidak berlaku');
        }
    }
}
