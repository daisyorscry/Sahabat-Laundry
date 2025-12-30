<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mobile\Profile\SetDefaultOutletRequest;
use App\Models\Auth\User;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Throwable;

class ProfileController extends Controller
{
    use ApiResponse;

    // GET /mobile/me/member-tier
    public function memberTier()
    {
        try {
            /** @var User $u */
            $u = User::query()
                ->with(['memberTier:id,code,name,description,discount_percentage,benefits,priority'])
                ->findOrFail(Auth::id());

            // Ambil dari relasi memberTier (kalau ada). Kalau tidak, null.
            $tier = $u->memberTier
                ? [
                    'id' => $u->memberTier->id,
                    'code' => $u->memberTier->code,
                    'name' => $u->memberTier->name,
                    'description' => $u->memberTier->description,
                    'discount_percentage' => $u->memberTier->discount_percentage,
                    'benefits' => $u->memberTier->benefits,
                    'priority' => $u->memberTier->priority,
                ]
                : null;

            return $this->successResponse(['member_tier' => $tier]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil member tier', 500, ['exception' => $e->getMessage()]);
        }
    }

    // PUT /mobile/me/default-outlet
    public function setDefaultOutlet(SetDefaultOutletRequest $request)
    {
        try {
            $uid = Auth::id();

            $user = DB::transaction(function () use ($request, $uid) {
                /** @var User $u */
                $u = User::lockForUpdate()->findOrFail($uid);
                $u->default_outlet_id = $request->validated()['outlet_id'];
                $u->save();
                return $u->fresh(['defaultOutlet:id,code,name,city']);
            });

            return $this->successResponse($user, 'Default outlet diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal set default outlet', 422, ['exception' => $e->getMessage()]);
        }
    }
}
