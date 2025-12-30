<?php

namespace App\Http\Requests\ServicePrice;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServicePriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'uuid', Rule::exists('services', 'id')->whereNull('deleted_at')],
            'outlet_id' => ['required', 'uuid', Rule::exists('outlets', 'id')->whereNull('deleted_at')],
            'member_tier' => ['nullable', 'string', 'max:50'],
            'is_express' => ['required', 'boolean'],
            'price' => ['required', 'numeric', 'min:0'],
            'effective_start' => ['required', 'date'],
            'effective_end' => ['nullable', 'date', 'after_or_equal:effective_start'],
        ];
    }

    public function messages(): array
    {
        return [
            'effective_end.after_or_equal' => 'effective_end harus >= effective_start',
        ];
    }
}
