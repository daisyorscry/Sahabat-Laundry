<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class EnsureRequestHeader
{
    public function handle(Request $request, Closure $next)
    {
        if (
            !$request->hasHeader('x-sahabatlaundry') ||
            trim($request->header('x-sahabatlaundry')) === '' ||
            !$request->hasHeader('x-timestamp') ||
            trim($request->header('x-timestamp')) === '' ||
            strtolower($request->header('content-type')) !== 'application/json' ||
            strtolower($request->header('accept')) !== 'application/json'
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Header tidak valid atau kosong',
                'timestamp' => Carbon::now()->toISOString(),
            ], 400);
        }


        try {
            $parsed = Carbon::parse($request->header('x-timestamp'))->utc();

            if (!$parsed->between(now()->utc()->subMinutes(5), now()->utc()->addMinutes(5))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Timestamp terlalu jauh dari waktu server',
                    'timestamp' => Carbon::now()->toISOString(),
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Format X-TIMESTAMP tidak valid',
                'timestamp' => Carbon::now()->toISOString(),
            ], 400);
        }

        return $next($request);
    }
}
