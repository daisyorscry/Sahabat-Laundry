<?php

namespace App\Http\Requests\Mobile\Order;

use Illuminate\Foundation\Http\FormRequest;

class RequestDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        return [
            'delivery_address' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
