<?php

namespace App\Traits;

use Illuminate\Support\Carbon;

trait ApiResponse
{
    protected function successResponse($data = null, string $message = 'OK', int $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => Carbon::now()->toISOString(),
        ], $code);
    }

    protected function errorResponse(string $message = 'Terjadi kesalahan', int $code = 500, $errors = null)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => Carbon::now()->toISOString(),
        ], $code);
    }

    protected function paginatedResponse($data, string $message = 'OK', int $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data->items(),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
            ],
            'timestamp' => Carbon::now()->toISOString(),
        ], $code);
    }
}
