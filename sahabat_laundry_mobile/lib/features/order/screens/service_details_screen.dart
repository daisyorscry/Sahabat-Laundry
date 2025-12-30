import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../catalog/models/service_model.dart';
import '../../catalog/providers/catalog_provider.dart';
import '../../auth/providers/auth_provider.dart';

class ServiceDetailsScreen extends StatefulWidget {
  final String serviceId;
  final String outletId;
  final bool isExpress;
  final List<String>? initialAddonIds;
  final double? initialQuantity;

  const ServiceDetailsScreen({
    super.key,
    required this.serviceId,
    required this.outletId,
    this.isExpress = false,
    this.initialAddonIds,
    this.initialQuantity,
  });

  @override
  State<ServiceDetailsScreen> createState() => _ServiceDetailsScreenState();
}

class _ServiceDetailsScreenState extends State<ServiceDetailsScreen> {
  List<AddonModel> _addons = [];
  final Set<String> _selectedAddonIds = {};
  double _quantity = 1.0;
  bool _isLoading = true;
  ServiceModel? _service;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final catalogProvider = context.read<CatalogProvider>();
    final authProvider = context.read<AuthProvider>();
    final memberTier = authProvider.user?.memberTier?.code;

    // Fetch service details with contextual pricing and addons
    final serviceDetail = await catalogProvider.getServiceDetail(
      widget.serviceId,
      outletId: widget.outletId,
      memberTier: memberTier,
      isExpress: widget.isExpress,
    );
    await _fetchAddons();

    if (!mounted) return;

    final service =
        serviceDetail ??
        ServiceModel(
          id: widget.serviceId,
          code: '',
          name: 'Unknown Service',
          pricingModel: 'piece',
          isExpressAvailable: false,
          categoryId: '',
        );

    setState(() {
      _service = service;
      _quantity = widget.initialQuantity ?? 1.0;
      _isLoading = false;
    });

    // Pre-populate selected addons from initial values (when editing)
    if (widget.initialAddonIds != null && widget.initialAddonIds!.isNotEmpty) {
      setState(() {
        _selectedAddonIds.addAll(widget.initialAddonIds!);
      });
    } else {
      // Auto-select required addons only if not editing
      final requiredAddonIds = _addons
          .where((addon) => addon.isRequired)
          .map((addon) => addon.id)
          .toSet();

      if (requiredAddonIds.isNotEmpty) {
        setState(() {
          _selectedAddonIds.addAll(requiredAddonIds);
        });
      }
    }
  }

  Future<void> _fetchAddons() async {
    try {
      final catalogProvider = context.read<CatalogProvider>();
      final addons = await catalogProvider.getServiceAddons(widget.serviceId);
      if (mounted) {
        setState(() {
          _addons = addons;
        });
      }
    } catch (e) {
      debugPrint('Error fetching addons: $e');
    }
  }

  void _toggleAddon(AddonModel addon) {
    if (addon.isRequired) return; // Cannot toggle required addons

    setState(() {
      if (_selectedAddonIds.contains(addon.id)) {
        _selectedAddonIds.remove(addon.id);
      } else {
        _selectedAddonIds.add(addon.id);
      }
    });
  }

  void _addToCart() {
    // Create addon prices map (addonId -> price)
    final addonPrices = <String, double>{};
    for (final addonId in _selectedAddonIds) {
      final addon = _addons.firstWhere((a) => a.id == addonId);
      addonPrices[addonId] = addon.price;
    }

    // Return selected data back to service list screen
    Navigator.pop(context, {
      'serviceId': widget.serviceId,
      'quantity': _quantity,
      'addonIds': _selectedAddonIds.toList(),
      'addonPrices': addonPrices,
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          title: const Text('Add-ons'),
          centerTitle: false,
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
        ),
        body: const Center(
          child: CircularProgressIndicator(color: Color(0xFF7C3AED)),
        ),
      );
    }

    if (_service == null) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          title: const Text('Add-ons'),
          centerTitle: false,
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
        ),
        body: const Center(child: Text('Service not found')),
      );
    }

    // Get service price from API (unit_price) and base price
    final basePrice = _service!.basePrice ?? 0;
    final servicePrice = _service!.servicePrice?.unitPrice ?? basePrice;
    final isWeight = _service!.pricingModel == 'weight';

    // Check if there's a discount
    final hasDiscount = basePrice > 0 && servicePrice < basePrice;
    final discountPercentage = hasDiscount
        ? (((basePrice - servicePrice) / basePrice) * 100).round()
        : 0;

    double _calculateTotal() {
      if (_service == null) return 0;

      final basePrice =
          _service!.servicePrice?.unitPrice ?? _service!.basePrice ?? 0;
      double total = basePrice;

      // Add addon prices
      for (final addonId in _selectedAddonIds) {
        final addon = _addons.firstWhere((a) => a.id == addonId);
        total += addon.price;
      }

      return total;
    }

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Add-ons',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              'Customize your order',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF9CA3AF),
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
        centerTitle: false,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image with overlapping card
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // Service Image
                    if (_service!.iconPath != null)
                      Image.network(
                        _service!.iconPath!,
                        height: 250,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            height: 250,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  const Color(
                                    0xFF7C3AED,
                                  ).withValues(alpha: 0.1),
                                  const Color(
                                    0xFF7C3AED,
                                  ).withValues(alpha: 0.05),
                                ],
                              ),
                            ),
                            child: const Icon(
                              Icons.local_laundry_service_rounded,
                              size: 64,
                              color: Color(0xFF7C3AED),
                            ),
                          );
                        },
                      )
                    else
                      Container(
                        height: 250,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              const Color(0xFF7C3AED).withValues(alpha: 0.1),
                              const Color(0xFF7C3AED).withValues(alpha: 0.05),
                            ],
                          ),
                        ),
                        child: const Icon(
                          Icons.local_laundry_service_rounded,
                          size: 64,
                          color: Color(0xFF7C3AED),
                        ),
                      ),

                    // Overlapping Service Info Card
                    Positioned(
                      bottom: -40,
                      left: 16,
                      right: 16,
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.1),
                              blurRadius: 20,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Service Name
                            Text(
                              _service!.name,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1F2937),
                              ),
                            ),
                            const SizedBox(height: 8),

                            // Per Unit Badge
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3E8FF),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                isWeight ? 'Per Kg' : 'Per Unit',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF7C3AED),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Price Section
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // Show base price (strikethrough) if there's a discount
                                      if (hasDiscount)
                                        Text(
                                          'Rp ${_formatCurrency(basePrice)}',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey.shade400,
                                            decoration:
                                                TextDecoration.lineThrough,
                                          ),
                                        ),
                                      // Service price
                                      Row(
                                        children: [
                                          Text(
                                            'Rp ${_formatCurrency(servicePrice)}',
                                            style: const TextStyle(
                                              fontSize: 24,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF7C3AED),
                                            ),
                                          ),
                                          Text(
                                            ' ${isWeight ? "/ Kg" : "/ Unit"}',
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: Colors.grey.shade600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                // Discount badge
                                if (hasDiscount)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [
                                          Color(0xFFEC4899),
                                          Color(0xFFDB2777),
                                        ],
                                      ),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      'Save $discountPercentage%',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                              ],
                            ),

                            // Description
                            if (_service!.description != null) ...[
                              const SizedBox(height: 12),
                              Text(
                                _service!.description!,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey.shade600,
                                  height: 1.5,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 60),

                // Premium Add-ons Section
                if (_addons.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3E8FF),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.auto_awesome,
                            color: Color(0xFF7C3AED),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Premium Add-ons',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1F2937),
                              ),
                            ),
                            Text(
                              'Enhance your laundry experience',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Addons List
                  ..._addons.map((addon) => _buildAddonItem(addon)),

                  const SizedBox(height: 16),
                ],
              ],
            ),
          ),

          // Bottom Bar with Total and Add to Cart
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Total
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                        Text(
                          'Rp ${_formatCurrency(_calculateTotal())}',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF7C3AED),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Add to Cart Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _addToCart,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF7C3AED),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.shopping_cart, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Add to Cart',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddonItem(AddonModel addon) {
    final isSelected = _selectedAddonIds.contains(addon.id);
    final iconData = _getAddonIcon(addon.code);
    final iconColor = _getAddonIconColor(addon.code);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: addon.isRequired ? null : () => _toggleAddon(addon),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? const Color(0xFF7C3AED) : Colors.transparent,
              width: 2,
            ),
          ),
          child: Row(
            children: [
              // Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(iconData, color: iconColor, size: 24),
              ),
              const SizedBox(width: 16),

              // Addon info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      addon.name,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '+ Rp ${_formatCurrency(addon.price)}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF7C3AED),
                      ),
                    ),
                  ],
                ),
              ),

              // Checkbox
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF7C3AED)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF7C3AED)
                        : const Color(0xFFD1D5DB),
                    width: 2,
                  ),
                ),
                child: isSelected
                    ? const Icon(Icons.check, size: 16, color: Colors.white)
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getAddonIcon(String code) {
    final lowerCode = code.toLowerCase();
    if (lowerCode.contains('antifungal') || lowerCode.contains('treatment')) {
      return Icons.health_and_safety;
    } else if (lowerCode.contains('dust') || lowerCode.contains('protection')) {
      return Icons.shield;
    } else if (lowerCode.contains('softener')) {
      return Icons.auto_awesome;
    } else if (lowerCode.contains('label')) {
      return Icons.label;
    } else if (lowerCode.contains('color')) {
      return Icons.palette;
    } else if (lowerCode.contains('iron') || lowerCode.contains('press')) {
      return Icons.iron;
    } else if (lowerCode.contains('fold')) {
      return Icons.folder;
    } else {
      return Icons.add_circle_outline;
    }
  }

  Color _getAddonIconColor(String code) {
    final lowerCode = code.toLowerCase();
    if (lowerCode.contains('antifungal') || lowerCode.contains('treatment')) {
      return const Color(0xFF3B82F6); // Blue
    } else if (lowerCode.contains('dust') || lowerCode.contains('protection')) {
      return const Color(0xFF10B981); // Green
    } else if (lowerCode.contains('softener')) {
      return const Color(0xFF7C3AED); // Purple
    } else if (lowerCode.contains('label')) {
      return const Color(0xFFF59E0B); // Orange
    } else if (lowerCode.contains('color')) {
      return const Color(0xFFEC4899); // Pink
    } else {
      return const Color(0xFF6B7280); // Gray
    }
  }

  String _formatCurrency(double amount) {
    return amount
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }
}
