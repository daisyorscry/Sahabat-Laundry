import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/user_profile_provider.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<UserProfileProvider>().fetchProfile());
  }

  Future<void> _showLogoutConfirmation(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Konfirmasi Logout'),
        content: const Text('Apakah Anda yakin ingin keluar dari aplikasi?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await _performLogout();
    }
  }

  Future<void> _performLogout() async {
    final authProvider = context.read<AuthProvider>();

    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      await authProvider.logout();

      if (!mounted) return;

      // Close loading dialog
      Navigator.pop(context);

      // Navigate to login and remove all previous routes
      Navigator.pushNamedAndRemoveUntil(
        context,
        '/login',
        (route) => false,
      );
    } catch (e) {
      if (!mounted) return;

      // Close loading dialog
      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal logout: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<UserProfileProvider>();
    final p = provider.profile;
    final primary = const Color(0xFF7C3AED);

    final status = p?.customerStatus?.code.toLowerCase();
    Color statusColor;
    IconData statusIcon;
    String statusLabel = p?.customerStatus?.description ?? (status?.isNotEmpty == true ? status! : 'Status');
    switch (status) {
      case 'active':
        statusColor = const Color(0xFF22C55E);
        statusIcon = Icons.check_circle;
        break;
      case 'suspended':
        statusColor = const Color(0xFFF59E0B);
        statusIcon = Icons.warning_amber_rounded;
        break;
      case 'banned':
        statusColor = const Color(0xFFEF4444);
        statusIcon = Icons.cancel_rounded;
        break;
      default:
        statusColor = const Color(0xFF3B82F6);
        statusIcon = Icons.info_outline_rounded;
    }

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: provider.isLoading && p == null
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF7C3AED)))
            : SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 12),
                    // Logout (top-right)
                    Row(
                      children: [
                        const Spacer(),
                        IconButton(
                          onPressed: () => _showLogoutConfirmation(context),
                          icon: Icon(Icons.logout, color: primary),
                          tooltip: 'Logout',
                        ),
                        const SizedBox(width: 12),
                      ],
                    ),
                    const SizedBox(height: 4),
                    // Avatar + name + email
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        children: [
                          GestureDetector(
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Image picker belum dikonfigurasi'),
                                ),
                              );
                            },
                            child: CircleAvatar(
                              radius: 48,
                              backgroundColor: Colors.grey.shade200,
                              backgroundImage: (p?.avatarUrl?.isNotEmpty == true)
                                  ? NetworkImage(p!.avatarUrl!)
                                  : null,
                              child: (p?.avatarUrl?.isNotEmpty == true)
                                  ? null
                                  : Text(
                                      (p?.fullName.isNotEmpty == true)
                                          ? p!.fullName.trim().split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join().toUpperCase()
                                          : 'U',
                                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.black54),
                                    ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            p?.fullName.isNotEmpty == true ? p!.fullName : 'User',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                p?.email ?? '-',
                                style: const TextStyle(color: Colors.black87),
                              ),
                              if ((p?.emailVerifiedAt ?? '').isNotEmpty) ...[
                                const SizedBox(width: 6),
                                Icon(Icons.verified, size: 16, color: const Color(0xFF22C55E)),
                              ],
                            ],
                          ),
                          if (p?.customerStatus != null) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: statusColor, width: 1),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(statusIcon, size: 14, color: statusColor),
                                  const SizedBox(width: 6),
                                  Text(statusLabel, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: statusColor)),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            onPressed: () => Navigator.pushNamed(context, '/profile/edit'),
                            icon: const Icon(Icons.edit, size: 16),
                            label: const Text('Edit profile saya'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.black87,
                              side: BorderSide(color: Colors.grey.shade300),
                              backgroundColor: Colors.grey.shade50,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Sheet list rows
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
                        border: Border(
                          top: BorderSide(color: primary, width: 1),
                          left: BorderSide(color: primary, width: 1),
                          right: BorderSide(color: primary, width: 1),
                        ),
                        boxShadow: const [
                          BoxShadow(color: Colors.black26, offset: Offset(0, -12), blurRadius: 24),
                        ],
                      ),
                      child: Column(
                        children: [
                          _ListRow(
                            icon: Icons.map,
                            label: 'Addresses',
                            onTap: () => Navigator.pushNamed(context, '/profile/addresses'),
                          ),
                          _ListRow(
                            icon: Icons.store_mall_directory,
                            label: 'Outlets',
                            onTap: () => Navigator.pushNamed(context, '/profile/outlets'),
                          ),
                          _ListRow(
                            icon: Icons.shield_moon_outlined,
                            label: 'Login activity',
                            onTap: () => Navigator.pushNamed(context, '/profile/login-activity'),
                          ),
                          _ListRow(
                            icon: Icons.lock_outline,
                            label: 'Change password',
                            onTap: () => Navigator.pushNamed(context, '/profile/change-password'),
                          ),
                          _ListRow(
                            icon: Icons.tag,
                            label: 'Change PIN',
                            onTap: () => Navigator.pushNamed(context, '/profile/change-pin'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

class _ListRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  const _ListRow({required this.icon, required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: Color(0x10000000), width: 1)),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: Colors.black87),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
            const Icon(Icons.chevron_right, color: Color(0x8F000000), size: 20),
          ],
        ),
      ),
    );
  }
}

