<?php

namespace App\Models\Auth;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CustomerStatus extends Model
{
    use HasFactory;


    protected $fillable = ['code', 'description'];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
