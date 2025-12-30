<?php

namespace App\Http\Requests\ServicePrice;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServicePriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => ['sometimes', 'uuid', Rule::exists('services', 'id')->whereNull('deleted_at')],
            'outlet_id' => ['sometimes', 'uuid', Rule::exists('outlets', 'id')->whereNull('deleted_at')],
            'member_tier' => ['sometimes', 'nullable', 'string', 'max:50'],
            'is_express' => ['sometimes', 'boolean'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'effective_start' => ['sometimes', 'date'],
            'effective_end' => ['sometimes', 'nullable', 'date', 'after_or_equal:effective_start'],
        ];
    }

    public function messages(): array
    {
        return [
            'effective_end.after_or_equal' => 'effective_end harus >= effective_start',
        ];
    }
}
