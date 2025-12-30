<h2>Login Berhasil</h2>
<p>Halo, {{ $data['full_name'] }}!</p>
<p>Ada aktivitas login ke akun kamu dengan detail berikut:</p>

<ul>
    <li><strong>Waktu:</strong> {{ $data['logged_in_at'] }}</li>
    <li><strong>IP Address:</strong> {{ $data['ip_address'] }}</li>
    <li><strong>Device Type:</strong> {{ $data['device_type'] }}</li>
    <li><strong>Platform:</strong> {{ $data['platform'] }}</li>
    <li><strong>Browser:</strong> {{ $data['browser'] }}</li>
    <li><strong>Lokasi:</strong> {{ $data['city'] ?? '-' }}, {{ $data['country'] ?? '-' }}</li>
    <li><strong>Koordinat:</strong> {{ $data['latitude'] ?? '-' }}, {{ $data['longitude'] ?? '-' }}</li>
</ul>

<p>Jika ini bukan kamu, segera hubungi admin!</p>
