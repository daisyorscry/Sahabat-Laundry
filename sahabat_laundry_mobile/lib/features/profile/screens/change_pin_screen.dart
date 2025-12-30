import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/user_profile_provider.dart';

class ChangePinScreen extends StatefulWidget {
  const ChangePinScreen({super.key});

  @override
  State<ChangePinScreen> createState() => _ChangePinScreenState();
}

class _ChangePinScreenState extends State<ChangePinScreen> {
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

    String? pinValidator(String? v) {
      final s = v ?? '';
      if (!RegExp(r'^\d{4,6}$').hasMatch(s)) return 'PIN harus 4–6 digit.';
      return null;
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Change PIN')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _LabeledField(
                  label: 'Current PIN',
                  child: TextFormField(
                    controller: _current,
                    decoration: const InputDecoration(hintText: '••••'),
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    validator: pinValidator,
                  ),
                ),
                _LabeledField(
                  label: 'New PIN',
                  child: TextFormField(
                    controller: _new,
                    decoration: const InputDecoration(hintText: '4–6 digit'),
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    validator: pinValidator,
                  ),
                ),
                _LabeledField(
                  label: 'Confirm new PIN',
                  child: TextFormField(
                    controller: _confirm,
                    decoration: const InputDecoration(hintText: 'Ulangi PIN'),
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    validator: (v) => v == _new.text ? null : 'Konfirmasi PIN tidak sama.',
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
                            final ok = await provider.changePin(
                              currentPin: _current.text,
                              newPin: _new.text,
                            );
                            if (!mounted) return;
                            if (ok) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('PIN berhasil diubah.')));
                              Navigator.pop(context);
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(provider.error ?? 'Gagal mengubah PIN.')),
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
                  'PIN hanya angka 4–6 digit. Mengubah PIN akan menginvalidasi sesi lama.',
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
