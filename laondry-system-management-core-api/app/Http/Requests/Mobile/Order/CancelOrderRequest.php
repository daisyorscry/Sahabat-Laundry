<?php

namespace App\Http\Requests\Mobile\Order;

use Illuminate\Foundation\Http\FormRequest;

class CancelOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['reason' => ['nullable','string','max:255']]; }
}
