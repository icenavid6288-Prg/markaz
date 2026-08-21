<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhoneLoginToken extends Model
{
    public $timestamps = false;

    protected $primaryKey = 'phone';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'phone',
        'token',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }
}
