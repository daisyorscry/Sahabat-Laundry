<?php
// app/Http/Controllers/StaffManagement/StaffManagement.php
namespace App\Http\Controllers\StaffManagement;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\StoreStaffRequest;
use App\Http\Requests\Staff\UpdateStaffRequest;
use App\Models\Auth\User;
use App\Models\Auth\StaffPosition;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class StaffManagementController extends Controller
{
    use ApiResponse;

    public function index(Request $req)
    {
        try {
            $perPage = (int)($req->integer('per_page') ?: 20);
            $sortRaw = $req->get('sort', '-created_at');
            [$sortCol, $sortDir] = $this->parseSort($sortRaw, [
                'full_name','email','phone_number','is_active','created_at'
            ]);

            $q = User::query()
                ->with(['roles:id,name', 'staffPositions:id,user_id,position'])
                ->whereHas('roles', fn($r) => $r->where('name', 'staff'))
                ->when($req->filled('q'), fn($x) => $x->searchAll($req->get('q')))
                ->when($req->filled('position'), fn($x) =>
                    $x->whereHas('staffPositions', fn($p) =>
                        $p->where('position', 'ilike', '%'.$req->get('position').'%')
                    )
                )
                ->when($req->filled('is_active'), fn($x) =>
                    $x->where('is_active', filter_var($req->get('is_active'), FILTER_VALIDATE_BOOLEAN))
                )
                ->when($req->filled('banned'), function ($x) use ($req) {
                    $bool = filter_var($req->get('banned'), FILTER_VALIDATE_BOOLEAN);
                    return $bool ? $x->whereNotNull('banned_reason') : $x->whereNull('banned_reason');
                })
                ->when($req->filled('created_from'), fn($x)=>$x->whereDate('created_at','>=',$req->date('created_from')))
                ->when($req->filled('created_to'), fn($x)=>$x->whereDate('created_at','<=',$req->date('created_to')))
                ->when($req->boolean('with_trashed'), fn($x)=>$x->withTrashed());

            $data = $q->orderBy($sortCol, $sortDir)->paginate($perPage);

            // opsional rapihin payload posisi jadi array string
            $data->getCollection()->transform(function ($u) {
                $u->positions = $u->staffPositions->pluck('position')->values();
                unset($u->staffPositions);
                return $u;
            });

            return $this->paginatedResponse($data);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil data staff', 500, ['exception'=>$e->getMessage()]);
        }
    }

    public function show(string $id)
    {
        try {
            $user = User::with(['roles:id,name','staffPositions:id,user_id,position'])
                ->withTrashed()
                ->whereHas('roles', fn($r) => $r->where('name','staff'))
                ->findOrFail($id);

            $user->positions = $user->staffPositions->pluck('position')->values();
            unset($user->staffPositions);

            return $this->successResponse($user);
        } catch (Throwable $e) {
            return $this->errorResponse('Staff tidak ditemukan', 404);
        }
    }

    public function store(StoreStaffRequest $req)
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
                $user->is_member = false;
                $user->customer_status_id = null;
                $user->save();

                // pastikan role 'staff'
                $staffRoleId = DB::table('roles')->where('name','staff')->value('id');
                if ($staffRoleId) $user->roles()->syncWithoutDetaching([$staffRoleId]);

                // sync positions (array of strings)
                $this->syncPositions($user, $p['positions'] ?? []);

                $user->load(['roles:id,name','staffPositions:id,user_id,position']);
                $user->positions = $user->staffPositions->pluck('position')->values();
                unset($user->staffPositions);

                return $user;
            });

            return $this->successResponse($user, 'Created', 201);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat staff', 422, ['exception'=>$e->getMessage()]);
        }
    }

    public function update(UpdateStaffRequest $req, string $id)
    {
        try {
            $user = DB::transaction(function () use ($req, $id) {
                $user = User::withTrashed()
                    ->whereHas('roles', fn($r) => $r->where('name','staff'))
                    ->findOrFail($id);

                $p = $req->validated();

                $user->full_name = $p['full_name'] ?? $user->full_name;
                if (array_key_exists('email',$p)) $user->email = $p['email'];
                if (array_key_exists('phone_number',$p)) $user->phone_number = $p['phone_number'];
                if (isset($p['password'])) $user->password_hash = password_hash($p['password'], PASSWORD_BCRYPT);
                if (array_key_exists('pin',$p)) $user->pin_hash = $p['pin'] !== null ? password_hash($p['pin'], PASSWORD_BCRYPT) : null;
                if (array_key_exists('is_active',$p)) $user->is_active = $p['is_active'];
                $user->save();

                if (array_key_exists('positions', $p)) {
                    $this->syncPositions($user, $p['positions'] ?? []);
                }

                $user->load(['roles:id,name','staffPositions:id,user_id,position']);
                $user->positions = $user->staffPositions->pluck('position')->values();
                unset($user->staffPositions);

                return $user;
            });

            return $this->successResponse($user, 'Updated');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal update staff', 422, ['exception'=>$e->getMessage()]);
        }
    }

    public function destroy(string $id)
    {
        try {
            $user = User::whereHas('roles', fn($r) => $r->where('name','staff'))->findOrFail($id);
            $user->delete();
            return $this->successResponse(null, 'Deleted');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal delete staff', 422, ['exception'=>$e->getMessage()]);
        }
    }

    public function restore(string $id)
    {
        try {
            $user = User::withTrashed()
                ->whereHas('roles', fn($r) => $r->where('name','staff'))
                ->findOrFail($id);

            if ($user->trashed()) $user->restore();

            $user->load(['staffPositions:id,user_id,position']);
            $user->positions = $user->staffPositions->pluck('position')->values();
            unset($user->staffPositions);

            return $this->successResponse($user, 'Restored');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal restore staff', 422, ['exception'=>$e->getMessage()]);
        }
    }

    public function ban(Request $req, string $id)
    {
        $req->validate(['reason' => 'required|string|min:5|max:255']);
        try {
            $user = User::withTrashed()
                ->whereHas('roles', fn($r) => $r->where('name','staff'))
                ->findOrFail($id);

            $user->banned_reason = $req->string('reason');
            $user->is_active = false;
            $user->save();

            return $this->successResponse($user, 'Banned');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal ban staff', 422, ['exception'=>$e->getMessage()]);
        }
    }

    public function unban(string $id)
    {
        try {
            $user = User::withTrashed()
                ->whereHas('roles', fn($r) => $r->where('name','staff'))
                ->findOrFail($id);

            $user->banned_reason = null;
            $user->is_active = true;
            $user->save();

            return $this->successResponse($user, 'Unbanned');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal unban staff', 422, ['exception'=>$e->getMessage()]);
        }
    }

    private function syncPositions(User $user, array $positions): void
    {
        $positions = collect($positions)
            ->filter(fn($p) => is_string($p) && trim($p) !== '')
            ->map(fn($p) => trim($p))
            ->unique()
            ->values();

        // hapus posisi yang tidak ada di array baru
        StaffPosition::where('user_id', $user->id)
            ->whereNotIn('position', $positions)
            ->delete();

        // tambahkan yang baru
        $existing = StaffPosition::where('user_id', $user->id)->pluck('position')->all();
        $toInsert = $positions->diff($existing)->map(fn($p) => [
            'user_id' => $user->id,
            'position' => $p,
        ])->all();

        if (!empty($toInsert)) {
            StaffPosition::insert($toInsert);
        }
    }

    private function parseSort(string $raw, array $whitelist): array
    {
        $dir = str_starts_with($raw, '-') ? 'desc' : 'asc';
        $col = ltrim($raw, '-');
        if (!in_array($col, $whitelist, true)) $col = 'created_at';
        return [$col, $dir];
    }
}
