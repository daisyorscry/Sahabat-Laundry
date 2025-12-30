import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../catalog/providers/catalog_provider.dart';

class OutletsScreen extends StatefulWidget {
  const OutletsScreen({super.key});

  @override
  State<OutletsScreen> createState() => _OutletsScreenState();
}

class _OutletsScreenState extends State<OutletsScreen> {
  String? _selectedId;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      final p = context.read<CatalogProvider>();
      await p.fetchOutlets();
      if (mounted && p.outlets.isNotEmpty) {
        setState(() => _selectedId = p.outlets.first.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final p = context.watch<CatalogProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Outlets')),
      body: p.outlets.isEmpty
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF7C3AED)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: p.outlets.length,
              itemBuilder: (context, idx) {
                final o = p.outlets[idx];
                final active = _selectedId == o.id;
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: active ? const Color(0xFFECFDF5) : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: active ? const Color(0xFF00695C) : const Color(0xFFE5E7EB)),
                  ),
                  child: ListTile(
                    onTap: () => setState(() => _selectedId = o.id),
                    title: Text(o.name, style: TextStyle(color: active ? const Color(0xFF065F46) : const Color(0xFF111827), fontWeight: FontWeight.w600)),
                    subtitle: (o.address?.isNotEmpty == true)
                        ? Text(o.address!, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: active ? const Color(0xFF047857) : const Color(0xFF6B7280)))
                        : null,
                    trailing: Icon(active ? Icons.check_circle : Icons.circle_outlined, color: active ? const Color(0xFF00695C) : const Color(0xFF9CA3AF)),
                  ),
                );
              },
            ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedId == null
                  ? null
                  : () {
                      Navigator.pop(context, _selectedId);
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: const Text('Use this outlet', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ),
      ),
    );
  }
}

