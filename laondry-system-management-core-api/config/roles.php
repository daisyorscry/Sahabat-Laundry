<?php

return [
    // Grup role
    'admin' => ['admin'],
    'customer' => ['customer'],
    'staff' => ['karyawan', 'kasir', 'kurir', 'cs'],
    'manajemen' => ['admin', 'superadmin'],
    'superadmin' => ['superadmin'],
    'all' => ['superadmin', 'admin', 'customer', 'karyawan', 'kasir', 'kurir', 'cs'],

    // Role satuan
    'karyawan' => ['karyawan'],
    'kasir' => ['kasir'],
    'kurir' => ['kurir'],
    'cs' => ['cs'],
];
