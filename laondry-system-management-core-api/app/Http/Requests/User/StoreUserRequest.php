<?php
// app/Http/Requests/User/StoreUserRequest.php
namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        return [
            'full_name' => 'required|string|max:100',
            'email' => 'nullable|email|max:100|unique:users,email',
            'phone_number' => 'nullable|string|max:20|unique:users,phone_number',
            'password' => 'required|string|min:8',
            'pin' => 'nullable|string|min:4|max:12',
            'is_active' => 'boolean',
            'is_member' => 'boolean',
            'balance' => 'numeric|min:0',
            'customer_status_id' => 'nullable|exists:customer_statuses,id',
            'role_ids' => 'array',
            'role_ids.*' => 'uuid|exists:roles,id',
        ];
    }
}
