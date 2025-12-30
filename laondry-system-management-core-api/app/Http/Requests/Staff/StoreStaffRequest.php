<?php
namespace App\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'full_name' => 'required|string|max:100',
            'email' => 'nullable|email|max:100|unique:users,email',
            'phone_number' => 'nullable|string|max:20|unique:users,phone_number',
            'password' => 'required|string|min:8',
            'pin' => 'nullable|string|min:4|max:12',
            'is_active' => 'boolean',
            'positions' => 'array',              // array of strings
            'positions.*' => 'string|max:50',    // sesuai staff_positions.position
        ];
    }
}
