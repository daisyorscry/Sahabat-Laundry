<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Models\Auth\User;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Throwable;

class CustomerController extends Controller
{
    use ApiResponse;

    /**
     * GET /customers
     * List all customers dengan filter & relasi lengkap
     */
    public function index(Request $request)
    {
        try {
            $q = trim((string) $request->query('q', ''));
            $isActive = $request->has('is_active') ? $request->boolean('is_active') : null;
            $isMember = $request->has('is_member') ? $request->boolean('is_member') : null;
            $statusId = $request->query('customer_status_id');

            $sort = $request->query('sort', 'created_at');
            $order = strtolower($request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
            $per = (int) $request->query('per_page', 15);
            $per = max(1, min($per, 100));

            $sortable = ['created_at', 'updated_at', 'full_name', 'email', 'phone_number', 'balance', 'is_member'];
            if (!in_array($sort, $sortable, true)) {
                $sort = 'created_at';
            }

            // Query customer role only
            $paginator = User::query()
                ->whereHas('roles', function (Builder $q) {
                    $q->where('slug', 'customer');
                })
                ->when($q !== '', function (Builder $query) use ($q) {
                    $query->searchAll($q);
                })
                ->when(!is_null($isActive), fn($qq) => $qq->where('is_active', $isActive))
                ->when(!is_null($isMember), fn($qq) => $qq->where('is_member', $isMember))
                ->when($statusId, fn($qq) => $qq->where('customer_status_id', $statusId))
                ->with([
                    'customerStatus',
                    'addresses' => fn($q) => $q->orderByDesc('is_primary'),
                    'roles:id,slug,name'
                ])
                ->withCount(['addresses'])
                ->orderBy($sort, $order)
                ->paginate($per);

            return $this->successResponse([
                'items' => $paginator->items(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
                'query' => compact('q', 'isActive', 'isMember', 'statusId', 'sort', 'order'),
            ]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil daftar customer', 500, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * POST /customers
     * Membuat customer baru
     */
    public function store(StoreCustomerRequest $request)
    {
        try {
            $customer = DB::transaction(function () use ($request) {
                $payload = $request->validated();

                $user = new User();
                $user->full_name = $payload['full_name'];
                $user->email = $payload['email'] ?? null;
                $user->phone_number = $payload['phone_number'];
                $user->password_hash = isset($payload['password']) ? Hash::make($payload['password']) : null;
                $user->pin_hash = isset($payload['pin']) ? Hash::make($payload['pin']) : null;
                $user->is_active = (bool) ($payload['is_active'] ?? true);
                $user->is_member = (bool) ($payload['is_member'] ?? false);
                $user->balance = (float) ($payload['balance'] ?? 0);
                $user->customer_status_id = $payload['customer_status_id'] ?? null;
                $user->save();

                // Attach role customer
                $customerRole = \App\Models\Auth\Role::where('slug', 'customer')->first();
                if ($customerRole) {
                    $user->roles()->attach($customerRole->id);
                }

                // Add address if provided
                if (!empty($payload['addresses'])) {
                    foreach ($payload['addresses'] as $idx => $addr) {
                        $user->addresses()->create([
                            'label' => $addr['label'] ?? 'Alamat ' . ($idx + 1),
                            'address' => $addr['address'],
                            'latitude' => $addr['latitude'] ?? null,
                            'longitude' => $addr['longitude'] ?? null,
                            'is_primary' => (bool) ($addr['is_primary'] ?? ($idx === 0)),
                        ]);
                    }
                }

                return $user->fresh([
                    'customerStatus',
                    'addresses',
                    'roles:id,slug,name'
                ])->loadCount('addresses');
            });

            return $this->successResponse($customer, 'Customer berhasil dibuat');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat customer', 422, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * GET /customers/{id}
     * Detail customer dengan semua relasi
     */
    public function show(Request $request, User $customer)
    {
        try {
            // Load semua relasi yang mungkin dibutuhkan
            $customer->load([
                'customerStatus',
                'addresses' => fn($q) => $q->orderByDesc('is_primary'),
                'roles:id,slug,name',
            ])
            ->loadCount([
                'addresses',
                'logins',
                'otps'
            ]);

            // Optional: load order history jika diminta
            if ($request->boolean('with_orders')) {
                $customer->load([
                    'orders' => function ($q) use ($request) {
                        $q->with(['outlet:id,name', 'statusRef:code,description'])
                            ->orderByDesc('created_at')
                            ->limit((int) $request->query('order_limit', 10));
                    }
                ])
                ->loadCount('orders');
            }

            return $this->successResponse($customer);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil customer', 500, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * PUT/PATCH /customers/{id}
     * Update customer data
     */
    public function update(UpdateCustomerRequest $request, User $customer)
    {
        try {
            $updated = DB::transaction(function () use ($request, $customer) {
                $payload = $request->validated();

                if (array_key_exists('full_name', $payload)) {
                    $customer->full_name = $payload['full_name'];
                }
                if (array_key_exists('email', $payload)) {
                    $customer->email = $payload['email'];
                }
                if (array_key_exists('phone_number', $payload)) {
                    $customer->phone_number = $payload['phone_number'];
                }
                if (array_key_exists('password', $payload) && !empty($payload['password'])) {
                    $customer->password_hash = Hash::make($payload['password']);
                }
                if (array_key_exists('pin', $payload) && !empty($payload['pin'])) {
                    $customer->pin_hash = Hash::make($payload['pin']);
                }
                if (array_key_exists('is_active', $payload)) {
                    $customer->is_active = (bool) $payload['is_active'];
                }
                if (array_key_exists('is_member', $payload)) {
                    $customer->is_member = (bool) $payload['is_member'];
                }
                if (array_key_exists('balance', $payload)) {
                    $customer->balance = (float) $payload['balance'];
                }
                if (array_key_exists('customer_status_id', $payload)) {
                    $customer->customer_status_id = $payload['customer_status_id'];
                }
                if (array_key_exists('banned_reason', $payload)) {
                    $customer->banned_reason = $payload['banned_reason'];
                }

                $customer->save();

                return $customer->fresh([
                    'customerStatus',
                    'addresses',
                    'roles:id,slug,name'
                ])->loadCount('addresses');
            });

            return $this->successResponse($updated, 'Customer diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui customer', 422, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /customers/{id}
     * Soft delete customer
     */
    public function destroy(User $customer)
    {
        try {
            DB::transaction(function () use ($customer) {
                $customer->delete();
            });

            return $this->successResponse(['id' => $customer->id], 'Customer dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghapus customer', 422, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * POST /customers/{id}/restore
     * Restore soft deleted customer
     */
    public function restore(string $id)
    {
        try {
            $customer = User::withTrashed()->findOrFail($id);

            DB::transaction(function () use ($customer) {
                $customer->restore();
            });

            return $this->successResponse(
                $customer->fresh(['customerStatus', 'addresses', 'roles:id,slug,name']),
                'Customer dipulihkan'
            );
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memulihkan customer', 422, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * POST /customers/{id}/ban
     * Ban customer dengan reason
     */
    public function ban(Request $request, User $customer)
    {
        $request->validate([
            'banned_reason' => ['required', 'string', 'max:500']
        ]);

        try {
            DB::transaction(function () use ($request, $customer) {
                $customer->is_active = false;
                $customer->banned_reason = $request->input('banned_reason');
                $customer->save();
            });

            return $this->successResponse(
                $customer->fresh(['customerStatus', 'addresses', 'roles:id,slug,name']),
                'Customer di-ban'
            );
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal ban customer', 422, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * POST /customers/{id}/unban
     * Unban customer
     */
    public function unban(User $customer)
    {
        try {
            DB::transaction(function () use ($customer) {
                $customer->is_active = true;
                $customer->banned_reason = null;
                $customer->save();
            });

            return $this->successResponse(
                $customer->fresh(['customerStatus', 'addresses', 'roles:id,slug,name']),
                'Customer di-unban'
            );
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal unban customer', 422, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * PATCH /customers/{id}/balance
     * Adjust customer balance (topup/deduct)
     */
    public function adjustBalance(Request $request, User $customer)
    {
        $request->validate([
            'amount' => ['required', 'numeric'],
            'type' => ['required', 'in:topup,deduct'],
            'note' => ['nullable', 'string', 'max:500']
        ]);

        try {
            $updated = DB::transaction(function () use ($request, $customer) {
                $amount = (float) $request->input('amount');
                $type = $request->input('type');

                if ($type === 'topup') {
                    $customer->balance += $amount;
                } else {
                    $customer->balance -= $amount;
                }

                $customer->save();

                // TODO: Bisa ditambahkan log transaksi balance di sini jika ada model BalanceLog

                return $customer->fresh(['customerStatus', 'addresses', 'roles:id,slug,name']);
            });

            return $this->successResponse($updated, 'Balance customer diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal adjust balance', 422, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * GET /customers/{id}/orders
     * Get customer order history
     */
    public function orders(Request $request, User $customer)
    {
        try {
            $status = $request->query('status');
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');
            $per = (int) $request->query('per_page', 15);
            $per = max(1, min($per, 100));

            $orders = \App\Models\OrderService\Order::query()
                ->where('customer_id', $customer->id)
                ->when($status, fn($q) => $q->where('status', strtoupper($status)))
                ->when($dateFrom, fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
                ->when($dateTo, fn($q) => $q->whereDate('created_at', '<=', $dateTo))
                ->with([
                    'outlet:id,name',
                    'statusRef:code,description',
                    'items.service:id,code,name',
                    'items.addons'
                ])
                ->orderByDesc('created_at')
                ->paginate($per);

            return $this->successResponse([
                'customer_id' => $customer->id,
                'customer_name' => $customer->full_name,
                'items' => $orders->items(),
                'pagination' => [
                    'current_page' => $orders->currentPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                    'last_page' => $orders->lastPage(),
                ],
            ]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil order history', 500, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * GET /customers/{id}/statistics
     * Customer statistics (total orders, spending, dll)
     */
    public function statistics(User $customer)
    {
        try {
            $stats = DB::transaction(function () use ($customer) {
                $orders = \App\Models\OrderService\Order::where('customer_id', $customer->id);

                return [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->full_name,
                    'total_orders' => $orders->count(),
                    'total_spending' => (float) $orders->sum('grand_total'),
                    'average_order_value' => (float) $orders->avg('grand_total'),
                    'completed_orders' => $orders->where('status', 'COMPLETED')->count(),
                    'pending_orders' => $orders->whereIn('status', ['NEW', 'PROCESSING', 'READY'])->count(),
                    'cancelled_orders' => $orders->where('status', 'CANCELLED')->count(),
                    'current_balance' => (float) $customer->balance,
                    'is_member' => (bool) $customer->is_member,
                    'member_since' => $customer->created_at?->toDateString(),
                    'last_order_date' => $orders->max('created_at'),
                ];
            });

            return $this->successResponse($stats);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil statistik customer', 500, ['exception' => $e->getMessage()]);
        }
    }
}
