<?php
// app/Http/Requests/Staff/UpdateStaffRequest.php
namespace App\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        return [
            'full_name' => 'sometimes|string|max:100',
            'email' => ['sometimes', 'nullable', 'email', 'max:100', Rule::unique('users', 'email')->ignore($this->route('id'), 'id')],
            'phone_number' => ['sometimes', 'nullable', 'string', 'max:20', Rule::unique('users', 'phone_number')->ignore($this->route('id'), 'id')],
            'password' => 'sometimes|string|min:8',
            'pin' => 'sometimes|nullable|string|min:4|max:12',
            'is_active' => 'sometimes|boolean',
            'positions' => 'sometimes|array',
            'positions.*' => 'string|max:50',
        ];
    }
}
