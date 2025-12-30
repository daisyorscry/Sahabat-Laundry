<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncServiceAddonsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'addons' => ['required', 'array'],
            'addons.*.addon_id' => [
                'required',
                'uuid',
                'distinct',
                Rule::exists('addons', 'id')->whereNull('deleted_at')
            ],
            'addons.*.is_required' => ['sometimes', 'boolean'],
        ];
    }
}
