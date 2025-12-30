import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/user_profile_provider.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _new = TextEditingController();
  final _confirm = TextEditingController();

  @override
  void dispose() {
    _current.dispose();
    _new.dispose();
    _confirm.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<UserProfileProvider>();
    final primary = const Color(0xFF7C3AED);

    return Scaffold(
      appBar: AppBar(title: const Text('Change password')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _LabeledField(
                  label: 'Current password',
                  child: TextFormField(
                    controller: _current,
                    obscureText: true,
                    decoration: const InputDecoration(hintText: '••••••••'),
                    validator: (v) => (v == null || v.isEmpty) ? 'Isi current password.' : null,
                  ),
                ),
                _LabeledField(
                  label: 'New password',
                  child: TextFormField(
                    controller: _new,
                    obscureText: true,
                    decoration: const InputDecoration(hintText: 'Min 8 karakter, campur huruf/angka/simbol'),
                    validator: (v) {
                      final s = v ?? '';
                      if (s.length < 8) return 'Minimal 8 karakter.';
                      if (!RegExp(r'[a-z]').hasMatch(s)) return 'Harus ada huruf kecil.';
                      if (!RegExp(r'[A-Z]').hasMatch(s)) return 'Harus ada huruf besar.';
                      if (!RegExp(r'\d').hasMatch(s)) return 'Harus ada angka.';
                      if (!RegExp(r'[^A-Za-z0-9]').hasMatch(s)) return 'Harus ada simbol.';
                      return null;
                    },
                  ),
                ),
                _LabeledField(
                  label: 'Confirm new password',
                  child: TextFormField(
                    controller: _confirm,
                    obscureText: true,
                    decoration: const InputDecoration(hintText: 'Ulangi password baru'),
                    validator: (v) => v == _new.text ? null : 'Konfirmasi password tidak sama.',
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: provider.isLoading
                        ? null
                        : () async {
                            if (!_formKey.currentState!.validate()) return;
                            final ok = await provider.changePassword(
                              currentPassword: _current.text,
                              newPassword: _new.text,
                            );
                            if (!mounted) return;
                            if (ok) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password berhasil diubah.')));
                              Navigator.pop(context);
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(provider.error ?? 'Gagal mengubah password.')),
                              );
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: Text(provider.isLoading ? 'Saving...' : 'Save changes'),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Password minimal 8 karakter dan mengandung huruf kecil, huruf besar, angka, dan simbol.',
                  style: TextStyle(fontSize: 12, color: Colors.black54),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LabeledField extends StatelessWidget {
  final String label;
  final Widget child;
  const _LabeledField({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          child,
        ],
      ),
    );
  }
}

