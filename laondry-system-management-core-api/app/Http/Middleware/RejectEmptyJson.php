<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RejectEmptyJson
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        if ($request->isJson() && empty($request->all())) {
            return response()->json([
                'success' => false,
                'message' => 'Body tidak boleh kosong',
                'timestamp' => now()->toISOString(),
            ], 400);
        }

        return $next($request);
    }

}
