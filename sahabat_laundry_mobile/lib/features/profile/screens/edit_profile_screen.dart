import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/user_profile_provider.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _fullName;
  late final TextEditingController _email;
  late final TextEditingController _phone;

  @override
  void initState() {
    super.initState();
    final p = context.read<UserProfileProvider>().profile;
    _fullName = TextEditingController(text: p?.fullName ?? '');
    _email = TextEditingController(text: p?.email ?? '');
    _phone = TextEditingController(text: p?.phoneNumber ?? '');
  }

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<UserProfileProvider>();
    final primary = const Color(0xFF7C3AED);

    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _LabeledField(
                  label: 'Full name',
                  child: TextFormField(
                    controller: _fullName,
                    decoration: const InputDecoration(hintText: 'Nama lengkap'),
                    validator: (v) => (v != null && v.length > 100) ? 'Maksimal 100 karakter.' : null,
                  ),
                ),
                _LabeledField(
                  label: 'Email',
                  child: TextFormField(
                    controller: _email,
                    decoration: const InputDecoration(hintText: 'nama@contoh.com'),
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) {
                      final val = v?.trim() ?? '';
                      if (val.isEmpty) return null; // optional
                      final re = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
                      if (!re.hasMatch(val)) return 'Format email tidak valid.';
                      if (val.length > 100) return 'Maksimal 100 karakter.';
                      return null;
                    },
                  ),
                ),
                _LabeledField(
                  label: 'Phone number',
                  child: TextFormField(
                    controller: _phone,
                    decoration: const InputDecoration(hintText: '08xxxxxxxxxx'),
                    keyboardType: TextInputType.phone,
                    validator: (v) => (v != null && v.length > 20) ? 'Maksimal 20 karakter.' : null,
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: provider.isLoading
                        ? null
                        : () async {
                            if (!_formKey.currentState!.validate()) return;
                            final ok = await provider.updateProfile(
                              fullName: _fullName.text.trim(),
                              email: _email.text.trim().isEmpty ? null : _email.text.trim(),
                              phoneNumber: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
                            );
                            if (!mounted) return;
                            if (ok) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profil diperbarui')));
                              Navigator.pop(context);
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(provider.error ?? 'Gagal menyimpan')),
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
                  'Mengubah email akan menghapus status verifikasi dan mungkin perlu verifikasi ulang.',
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

