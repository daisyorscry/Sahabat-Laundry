<?php
// app/Http/Controllers/UserManagement/UserManagement.php
namespace App\Http\Controllers\UserManagement;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\Auth\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class UserManagementController extends Controller
{
    use ApiResponse;

    public function index(Request $req)
    {
        try {
            $perPage = (int) ($req->integer('per_page') ?: 20);
            $sortRaw = $req->get('sort', '-created_at');
            [$sortCol, $sortDir] = $this->parseSort($sortRaw, [
                'full_name',
                'email',
                'phone_number',
                'is_active',
                'is_member',
                'created_at',
                'balance'
            ]);

            $q = User::query()
                ->with(['roles:id,name'])
                ->when($req->filled('q'), fn($x) => $x->searchAll($req->get('q')))
                ->when($req->filled('role_id'), fn($x) => $x->whereHas('roles', fn($r) => $r->where('roles.id', $req->get('role_id'))))
                ->when($req->filled('is_active'), fn($x) => $x->where('is_active', filter_var($req->get('is_active'), FILTER_VALIDATE_BOOLEAN)))
                ->when($req->filled('is_member'), fn($x) => $x->where('is_member', filter_var($req->get('is_member'), FILTER_VALIDATE_BOOLEAN)))
                ->when($req->filled('banned'), function ($x) use ($req) {
                    $bool = filter_var($req->get('banned'), FILTER_VALIDATE_BOOLEAN);
                    return $bool ? $x->whereNotNull('banned_reason') : $x->whereNull('banned_reason');
                })
                ->when($req->filled('created_from'), fn($x) => $x->whereDate('created_at', '>=', $req->date('created_from')))
                ->when($req->filled('created_to'), fn($x) => $x->whereDate('created_at', '<=', $req->date('created_to')))
                ->when($req->boolean('with_trashed'), fn($x) => $x->withTrashed());

            $data = $q->orderBy($sortCol, $sortDir)->paginate($perPage);

            return $this->paginatedResponse($data);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil data user', 500, ['exception' => $e->getMessage()]);
        }
    }

    public function show(string $id)
    {
        try {
            $user = User::with(['roles:id,name'])->withTrashed()->findOrFail($id);
            return $this->successResponse($user);
        } catch (Throwable $e) {
            return $this->errorResponse('User tidak ditemukan', 404);
        }
    }

    public function store(StoreUserRequest $req)
    {
        try {
            $user = DB::transaction(function () use ($req) {
                $p = $req->validated();

                $user = new User();
                $user->full_name = $p['full_name'];
                $user->email = $p['email'] ?? null;
                $user->phone_number = $p['phone_number'] ?? null;
                $user->password_hash = password_hash($p['password'], PASSWORD_BCRYPT);
                $user->pin_hash = isset($p['pin']) ? password_hash($p['pin'], PASSWORD_BCRYPT) : null;
                $user->is_active = $p['is_active'] ?? true;
                $user->is_member = $p['is_member'] ?? false;
                $user->balance = $p['balance'] ?? 0;
                $user->customer_status_id = $p['customer_status_id'] ?? null;
                $user->save();

                if (!empty($p['role_ids'])) {
                    $user->roles()->sync($p['role_ids']);
                }
                return $user;
            });

            return $this->successResponse($user, 'Created', 201);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat user', 422, ['exception' => $e->getMessage()]);
        }
    }

    public function update(UpdateUserRequest $req, string $id)
    {
        try {
            $user = DB::transaction(function () use ($req, $id) {
                $user = User::withTrashed()->findOrFail($id);
                $p = $req->validated();

                $user->full_name = $p['full_name'] ?? $user->full_name;
                if (array_key_exists('email', $p))
                    $user->email = $p['email'];
                if (array_key_exists('phone_number', $p))
                    $user->phone_number = $p['phone_number'];
                if (isset($p['password']))
                    $user->password_hash = password_hash($p['password'], PASSWORD_BCRYPT);
                if (array_key_exists('pin', $p))
                    $user->pin_hash = $p['pin'] !== null ? password_hash($p['pin'], PASSWORD_BCRYPT) : null;
                if (array_key_exists('is_active', $p))
                    $user->is_active = $p['is_active'];
                if (array_key_exists('is_member', $p))
                    $user->is_member = $p['is_member'];
                if (array_key_exists('balance', $p))
                    $user->balance = $p['balance'];
                if (array_key_exists('customer_status_id', $p))
                    $user->customer_status_id = $p['customer_status_id'];
                $user->save();

                if (array_key_exists('role_ids', $p)) {
                    $user->roles()->sync($p['role_ids'] ?? []);
                }
                return $user;
            });

            return $this->successResponse($user, 'Updated');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal update user', 422, ['exception' => $e->getMessage()]);
        }
    }

    public function destroy(string $id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();
            return $this->successResponse(null, 'Deleted');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal delete user', 422, ['exception' => $e->getMessage()]);
        }
    }

    public function restore(string $id)
    {
        try {
            $user = User::withTrashed()->findOrFail($id);
            if ($user->trashed())
                $user->restore();
            return $this->successResponse($user, 'Restored');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal restore user', 422, ['exception' => $e->getMessage()]);
        }
    }

    public function ban(Request $req, string $id)
    {
        $req->validate(['reason' => 'required|string|min:5|max:255']);
        try {
            $user = User::withTrashed()->findOrFail($id);
            $user->banned_reason = $req->string('reason');
            $user->is_active = false;
            $user->save();

            return $this->successResponse($user, 'Banned');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal ban user', 422, ['exception' => $e->getMessage()]);
        }
    }

    public function unban(string $id)
    {
        try {
            $user = User::withTrashed()->findOrFail($id);
            $user->banned_reason = null;
            $user->is_active = true;
            $user->save();

            return $this->successResponse($user, 'Unbanned');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal unban user', 422, ['exception' => $e->getMessage()]);
        }
    }

    private function parseSort(string $raw, array $whitelist): array
    {
        $dir = str_starts_with($raw, '-') ? 'desc' : 'asc';
        $col = ltrim($raw, '-');
        if (!in_array($col, $whitelist, true))
            $col = 'created_at';
        return [$col, $dir];
    }
}
