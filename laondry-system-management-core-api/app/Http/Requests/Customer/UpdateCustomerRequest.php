<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function rules(): array
    {
        $customerId = $this->route('customer')->id ?? $this->route('customer');

        return [
            'full_name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($customerId)
            ],
            'phone_number' => [
                'sometimes',
                'string',
                'max:20',
                Rule::unique('users', 'phone_number')->ignore($customerId)
            ],
            'password' => ['sometimes', 'nullable', 'string', 'min:6', 'max:255'],
            'pin' => ['sometimes', 'nullable', 'string', 'min:4', 'max:6'],
            'is_active' => ['sometimes', 'boolean'],
            'is_member' => ['sometimes', 'boolean'],
            'balance' => ['sometimes', 'numeric', 'min:0'],
            'customer_status_id' => ['sometimes', 'nullable', 'integer', 'exists:customer_statuses,id'],
            'banned_reason' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }

    public function messages(): array
    {
        return [
            'full_name.required' => 'Nama lengkap wajib diisi',
            'phone_number.unique' => 'Nomor telepon sudah terdaftar',
            'email.unique' => 'Email sudah terdaftar',
            'email.email' => 'Format email tidak valid',
        ];
    }
}
