import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/order_provider.dart';
import '../../payment/screens/payment_selection_screen.dart';
import '../../catalog/providers/catalog_provider.dart';
import '../../profile/providers/address_provider.dart';
import '../../auth/providers/auth_provider.dart';

class CreateOrderScreen extends StatefulWidget {
  final String outletId;
  final bool isExpress;
  final Map<String, Map<String, dynamic>> cart;

  const CreateOrderScreen({
    super.key,
    required this.outletId,
    required this.isExpress,
    required this.cart,
  });

  @override
  State<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends State<CreateOrderScreen> {
  String _deliveryMethod =
      'PICKUP_DELIVERY'; // PICKUP_DELIVERY, DROPOFF_DELIVERY, SELF_SERVICE
  String _notes = '';
  bool _pickupSameAsDelivery = true;
  String? _selectedDeliveryAddressId;
  String? _selectedPickupAddressId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final addressProvider = context.read<AddressProvider>();
    await addressProvider.fetchAddresses();

    // Set default delivery address to primary address
    if (addressProvider.addresses.isNotEmpty &&
        _selectedDeliveryAddressId == null) {
      setState(() {
        _selectedDeliveryAddressId =
            addressProvider.primaryAddress?.id ??
            addressProvider.addresses.first.id;
        if (_pickupSameAsDelivery) {
          _selectedPickupAddressId = _selectedDeliveryAddressId;
        }
      });
    }
  }

  Future<void> _handleCreateOrder() async {
    if (widget.cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cart is empty'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Validate addresses based on delivery method
    if (_deliveryMethod == 'PICKUP_DELIVERY') {
      if (_selectedDeliveryAddressId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select delivery address'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
      if (!_pickupSameAsDelivery && _selectedPickupAddressId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select pickup address'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    } else if (_deliveryMethod == 'DROPOFF_DELIVERY') {
      if (_selectedDeliveryAddressId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select delivery address'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    }

    final orderProvider = context.read<OrderProvider>();
    final addressProvider = context.read<AddressProvider>();
    final catalogProvider = context.read<CatalogProvider>();
    final authProvider = context.read<AuthProvider>();

    // Prepare order items
    final items = <OrderItemRequest>[];
    widget.cart.forEach((serviceId, cartItem) {
      try {
        final service = catalogProvider.services.firstWhere(
          (s) => s.id == serviceId,
        );
        final quantity = (cartItem['quantity'] ?? 1) as num;
        final addonIds = (cartItem['addonIds'] ?? []) as List;

      if (service.pricingModel == 'weight') {
        items.add(
          OrderItemRequest(
            serviceId: serviceId,
            weightKg: quantity.toDouble(),
            isExpress: widget.isExpress,
            addons: addonIds
                .map((id) => AddonRequest(addonId: id as String, qty: 1))
                .toList(),
          ),
        );
      } else {
        items.add(
          OrderItemRequest(
            serviceId: serviceId,
            qty: quantity.toInt(),
            isExpress: widget.isExpress,
            addons: addonIds
                .map((id) => AddonRequest(addonId: id as String, qty: 1))
                .toList(),
          ),
        );
      }
      } catch (e) {
        // Service not found, skip it
        debugPrint('Service $serviceId not found in catalog');
      }
    });

    // Determine order type and addresses
    String orderType;
    String? pickupAddress;
    String? deliveryAddress;

    if (_deliveryMethod == 'PICKUP_DELIVERY') {
      orderType = 'PICKUP';
      final deliveryAddr = addressProvider.addresses.firstWhere(
        (addr) => addr.id == _selectedDeliveryAddressId,
      );
      deliveryAddress = deliveryAddr.address;

      if (_pickupSameAsDelivery) {
        pickupAddress = deliveryAddress;
      } else {
        final pickupAddr = addressProvider.addresses.firstWhere(
          (addr) => addr.id == _selectedPickupAddressId,
        );
        pickupAddress = pickupAddr.address;
      }
    } else if (_deliveryMethod == 'DROPOFF_DELIVERY') {
      orderType = 'DROPOFF';
      final deliveryAddr = addressProvider.addresses.firstWhere(
        (addr) => addr.id == _selectedDeliveryAddressId,
      );
      deliveryAddress = deliveryAddr.address;
      pickupAddress = null;
    } else {
      // SELF_SERVICE
      orderType = 'DROPOFF';
      pickupAddress = null;
      deliveryAddress = null;
    }

    try {
      final order = await orderProvider.createOrder(
        outletId: widget.outletId,
        orderType: orderType,
        items: items,
        pickupAddress: pickupAddress,
        deliveryAddress: deliveryAddress,
        notes: _notes.isEmpty ? null : _notes,
        // Pass member tier code so backend uses correct service price
        memberTier: authProvider.user?.memberTier?.code,
      );

      if (!mounted) return;

      if (order != null) {
        // Navigate directly to payment selection screen
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => PaymentSelectionScreen(order: order),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(orderProvider.error ?? 'Failed to create order'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  double _calculateTotal() {
    final catalogProvider = context.read<CatalogProvider>();
    double total = 0;
    widget.cart.forEach((serviceId, cartItem) {
      try {
        final service = catalogProvider.services.firstWhere(
          (s) => s.id == serviceId,
        );
        final price = service.servicePrice?.unitPrice ?? service.basePrice ?? 0;
        final qty = (cartItem['quantity'] ?? 1) as num;
        total += price * qty.toDouble();

        // Add addon prices
        final addonPrices = cartItem['addonPrices'] as Map<String, dynamic>?;
        if (addonPrices != null) {
          addonPrices.forEach((addonId, addonPrice) {
            total += (addonPrice as num).toDouble() * qty.toDouble();
          });
        }
      } catch (e) {
        // Service not found, skip it
        debugPrint('Service $serviceId not found in catalog');
      }
    });
    return total;
  }

  @override
  Widget build(BuildContext context) {
    final addressProvider = context.watch<AddressProvider>();
    final catalogProvider = context.watch<CatalogProvider>();
    final orderProvider = context.watch<OrderProvider>();

    final totalPayment = _calculateTotal();

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Checkout',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              'Review your order',
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
            padding: const EdgeInsets.only(bottom: 140),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),

                // Delivery Method Selection
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF3E8FF),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.local_shipping,
                              color: Color(0xFF7C3AED),
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Delivery Method',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1F2937),
                                ),
                              ),
                              Text(
                                'Choose how you want your laundry handled',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF9CA3AF),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Pickup & Delivery
                      _buildDeliveryMethodOption(
                        value: 'PICKUP_DELIVERY',
                        icon: Icons.local_shipping_outlined,
                        title: 'Pickup & Delivery',
                        subtitle: 'We pickup and deliver your laundry',
                        badge: 'Popular',
                      ),

                      const SizedBox(height: 12),

                      // Drop-off & Delivery
                      _buildDeliveryMethodOption(
                        value: 'DROPOFF_DELIVERY',
                        icon: Icons.store,
                        title: 'Drop-off & Delivery',
                        subtitle: 'Drop at outlet, we deliver when done',
                      ),

                      const SizedBox(height: 12),

                      // Self Service
                      _buildDeliveryMethodOption(
                        value: 'SELF_SERVICE',
                        icon: Icons.home,
                        title: 'Self Service',
                        subtitle: 'Drop-off and pickup by yourself',
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Addresses Section
                if (_deliveryMethod != 'SELF_SERVICE') ...[
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 20,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Delivery Address
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3E8FF),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.location_on,
                                color: Color(0xFF7C3AED),
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Delivery Address',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1F2937),
                                  ),
                                ),
                                Text(
                                  'Where should we deliver?',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF9CA3AF),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Address Selector
                        _buildAddressSelector(
                          addresses: addressProvider.addresses,
                          selectedId: _selectedDeliveryAddressId,
                          onChanged: (id) {
                            setState(() {
                              _selectedDeliveryAddressId = id;
                              if (_pickupSameAsDelivery) {
                                _selectedPickupAddressId = id;
                              }
                            });
                          },
                        ),

                        // Pickup Address for PICKUP_DELIVERY
                        if (_deliveryMethod == 'PICKUP_DELIVERY') ...[
                          const SizedBox(height: 16),

                          // Checkbox for same address
                          InkWell(
                            onTap: () {
                              setState(() {
                                _pickupSameAsDelivery = !_pickupSameAsDelivery;
                                if (_pickupSameAsDelivery) {
                                  _selectedPickupAddressId =
                                      _selectedDeliveryAddressId;
                                }
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _pickupSameAsDelivery
                                      ? const Color(0xFF10B981)
                                      : const Color(0xFFE5E7EB),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 20,
                                    height: 20,
                                    decoration: BoxDecoration(
                                      color: _pickupSameAsDelivery
                                          ? const Color(0xFF10B981)
                                          : Colors.white,
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(
                                        color: _pickupSameAsDelivery
                                            ? const Color(0xFF10B981)
                                            : const Color(0xFFD1D5DB),
                                        width: 2,
                                      ),
                                    ),
                                    child: _pickupSameAsDelivery
                                        ? const Icon(
                                            Icons.check,
                                            size: 14,
                                            color: Colors.white,
                                          )
                                        : null,
                                  ),
                                  const SizedBox(width: 12),
                                  const Text(
                                    'Pickup address same as delivery address',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF1F2937),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // Pickup Address Selector
                          if (!_pickupSameAsDelivery) ...[
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Icon(
                                    Icons.location_on,
                                    color: Color(0xFF10B981),
                                    size: 16,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'Pickup Address',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1F2937),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            _buildAddressSelector(
                              addresses: addressProvider.addresses,
                              selectedId: _selectedPickupAddressId,
                              onChanged: (id) {
                                setState(() {
                                  _selectedPickupAddressId = id;
                                });
                              },
                            ),
                          ],
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),
                ],

                // Order List
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF3E8FF),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.shopping_bag,
                              color: Color(0xFF7C3AED),
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Order List',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1F2937),
                                ),
                              ),
                              Text(
                                '${widget.cart.length} items in your cart',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF9CA3AF),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Cart Items
                      ...widget.cart.entries.map((entry) {
                        final serviceId = entry.key;
                        final cartItem = entry.value;
                        try {
                          final service = catalogProvider.services.firstWhere(
                            (s) => s.id == serviceId,
                          );
                          final quantity = (cartItem['quantity'] ?? 1) as num;
                          final price =
                              service.servicePrice?.unitPrice ??
                              service.basePrice ??
                              0;
                          final isWeight = service.pricingModel == 'weight';
                          final addonPrices = cartItem['addonPrices'] as Map<String, dynamic>?;
                          final addonIds = cartItem['addonIds'] as List<dynamic>?;

                          // Calculate total for this service including addons
                          double serviceTotal = price * quantity.toDouble();
                          if (addonPrices != null) {
                            addonPrices.forEach((addonId, addonPrice) {
                              serviceTotal += (addonPrice as num).toDouble() * quantity.toDouble();
                            });
                          }

                          return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFFE5E7EB),
                              ),
                            ),
                            child: Row(
                              children: [
                                // Service Image
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: service.iconUrl != null
                                      ? Image.network(
                                          service.iconUrl!,
                                          width: 60,
                                          height: 60,
                                          fit: BoxFit.cover,
                                          errorBuilder:
                                              (context, error, stackTrace) {
                                                return Container(
                                                  width: 60,
                                                  height: 60,
                                                  color: Colors.grey.shade300,
                                                  child: const Icon(
                                                    Icons.checkroom,
                                                    size: 30,
                                                  ),
                                                );
                                              },
                                        )
                                      : Container(
                                          width: 60,
                                          height: 60,
                                          color: Colors.grey.shade300,
                                          child: const Icon(
                                            Icons.checkroom,
                                            size: 30,
                                          ),
                                        ),
                                ),
                                const SizedBox(width: 12),

                                // Service Info
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        service.name,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF1F2937),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${isWeight ? "$quantity Kg" : "${quantity.toInt()} Unit"} x Rp ${_formatCurrency(price)}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF6B7280),
                                        ),
                                      ),
                                      // Display addons if any
                                      if (addonIds != null && addonIds.isNotEmpty && addonPrices != null) ...[
                                        const SizedBox(height: 6),
                                        ...addonIds.map((addonId) {
                                          final addonPrice = addonPrices[addonId];
                                          if (addonPrice == null) return const SizedBox.shrink();
                                          return Padding(
                                            padding: const EdgeInsets.only(bottom: 2),
                                            child: Row(
                                              children: [
                                                const Icon(
                                                  Icons.add_circle_outline,
                                                  size: 12,
                                                  color: Color(0xFF9CA3AF),
                                                ),
                                                const SizedBox(width: 4),
                                                Flexible(
                                                  child: Text(
                                                    'Addon (+Rp ${_formatCurrency((addonPrice as num).toDouble())})',
                                                    style: const TextStyle(
                                                      fontSize: 11,
                                                      color: Color(0xFF9CA3AF),
                                                      fontStyle: FontStyle.italic,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          );
                                        }),
                                      ],
                                    ],
                                  ),
                                ),

                                // Price
                                Text(
                                  'Rp ${_formatCurrency(serviceTotal)}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF7C3AED),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                        } catch (e) {
                          // Service not found, return empty container
                          return const SizedBox.shrink();
                        }
                      }).where((widget) => widget is! SizedBox),
                    ],
                  ),
                ),

                const SizedBox(height: 8),

                // Special Instructions
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Special Instructions (Optional)',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        onChanged: (value) {
                          setState(() {
                            _notes = value;
                          });
                        },
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText:
                              'e.g., Separate white clothes from colored ones, handle with care...',
                          hintStyle: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF9CA3AF),
                          ),
                          filled: true,
                          fillColor: const Color(0xFFF9FAFB),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Color(0xFFE5E7EB),
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Color(0xFFE5E7EB),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Color(0xFF7C3AED),
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Payment Summary
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(
                            Icons.receipt_long,
                            color: Color(0xFF7C3AED),
                            size: 20,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Payment Summary',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Services',
                            style: TextStyle(
                              fontSize: 14,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                          Text(
                            'Rp ${_formatCurrency(totalPayment)}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF7C3AED),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Bottom Bar with Total and Place Order
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
                          'Total Payment',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                        Text(
                          'Rp ${_formatCurrency(totalPayment)}',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF7C3AED),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Pay Now Button (creates order then go to payment)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: orderProvider.isLoading
                            ? null
                            : _handleCreateOrder,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF7C3AED),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: orderProvider.isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.payments_outlined, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Pay Now',
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

  Widget _buildDeliveryMethodOption({
    required String value,
    required IconData icon,
    required String title,
    required String subtitle,
    String? badge,
  }) {
    final isSelected = _deliveryMethod == value;

    return InkWell(
      onTap: () {
        setState(() {
          _deliveryMethod = value;
        });
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF3E8FF) : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF7C3AED)
                : const Color(0xFFE5E7EB),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected
                    ? const Color(0xFF7C3AED)
                    : const Color(0xFFE5E7EB),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : const Color(0xFF6B7280),
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: isSelected
                              ? const Color(0xFF7C3AED)
                              : const Color(0xFF1F2937),
                        ),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            badge,
                            style: const TextStyle(
                              fontSize: 9,
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: isSelected
                          ? const Color(0xFF7C3AED)
                          : const Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? const Color(0xFF7C3AED) : Colors.white,
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
    );
  }

  Widget _buildAddressSelector({
    required List addresses,
    required String? selectedId,
    required Function(String?) onChanged,
  }) {
    if (addresses.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF3C7),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Row(
          children: [
            Icon(Icons.info_outline, color: Color(0xFF92400E), size: 20),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'No addresses available. Please add an address.',
                style: TextStyle(fontSize: 13, color: Color(0xFF92400E)),
              ),
            ),
          ],
        ),
      );
    }

    // Find selected address or use first address
    dynamic selectedAddress;
    try {
      selectedAddress = addresses.firstWhere((addr) => addr.id == selectedId);
    } catch (e) {
      selectedAddress = addresses.first;
    }

    return InkWell(
      onTap: () async {
        // Navigate to address selection screen
        final result = await Navigator.pushNamed(context, '/select-address');
        if (result != null && result is String) {
          onChanged(result);
        }
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFF3E8FF),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.location_on,
                color: Color(0xFF7C3AED),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        selectedAddress.label ?? 'Home',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      if (selectedAddress.isPrimary) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Default',
                            style: TextStyle(
                              fontSize: 9,
                              color: Color(0xFF065F46),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    selectedAddress.address ?? '',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, color: Color(0xFF9CA3AF), size: 20),
          ],
        ),
      ),
    );
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }
}
