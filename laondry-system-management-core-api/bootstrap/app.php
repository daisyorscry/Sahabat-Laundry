<?php

use App\Http\Middleware\JwtAuth;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\EnsureRequestHeader;
use App\Http\Middleware\RejectEmptyJson;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\RequireRole;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'ensure.headers' => EnsureRequestHeader::class,
            'auth.jwt' => JwtAuth::class,
            'reject.empty' => RejectEmptyJson::class,
            'role' => RequireRole::class
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
