<?php
return [
    'tiers' => env('MEMBERSHIP_TIERS')
        ? explode(',', env('MEMBERSHIP_TIERS'))
        : ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
];

