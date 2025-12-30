<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\OrderService\ServiceCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Throwable;

class ServiceCategoryController extends Controller
{
    use ApiResponse;

    // GET /mobile/service-categories
    public function index(Request $request)
    {
        try {
            $items = ServiceCategory::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'description']);
            return $this->successResponse(['items' => $items]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil kategori', 500, ['exception' => $e->getMessage()]);
        }
    }
}
