<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChangeStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        return [
            'to_status' => ['required', 'string', 'max:30', Rule::exists('order_statuses', 'code')],
            'note' => ['nullable', 'string'],
        ];
    }
}
