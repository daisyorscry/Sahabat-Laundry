<?php

namespace App\Http\Requests\Mobile\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SetDefaultOutletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'outlet_id' => ['required', 'uuid', Rule::exists('outlets', 'id')->whereNull('deleted_at')],
        ];
    }
}
