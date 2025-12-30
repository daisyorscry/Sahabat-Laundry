import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/order_provider.dart';
import '../models/order_model.dart';
import '../../payment/providers/payment_provider.dart';
import '../../payment/models/payment_transaction_model.dart';
import '../../payment/screens/payment_webview_screen.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen>
    with SingleTickerProviderStateMixin {
  OrderModel? _order;
  bool _isLoading = true;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    _loadOrderDetail();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadOrderDetail() async {
    final orderProvider = context.read<OrderProvider>();
    final order = await orderProvider.getOrderDetail(widget.orderId);

    if (mounted) {
      setState(() {
        _order = order;
        _isLoading = false;
      });
      _animationController.forward();
    }
  }

  String _formatDateTime(String? dateTime) {
    if (dateTime == null) return '-';
    try {
      final date = DateTime.parse(dateTime);
      return DateFormat('dd MMM yyyy, HH:mm').format(date);
    } catch (e) {
      return dateTime;
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

  Color _getStatusColor(String statusCode) {
    switch (statusCode.toUpperCase()) {
      case 'NEW':
        return const Color(0xFF7C3AED);
      case 'IN_PROGRESS':
        return const Color(0xFFF59E0B);
      case 'COMPLETED':
        return const Color(0xFF10B981);
      case 'CANCELED':
      case 'CANCELLED':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF6B7280);
    }
  }

  IconData _getStatusIcon(String statusCode) {
    switch (statusCode.toUpperCase()) {
      case 'NEW':
        return Icons.assignment_outlined;
      case 'IN_PROGRESS':
        return Icons.local_laundry_service;
      case 'COMPLETED':
        return Icons.check_circle_outline;
      case 'CANCELED':
      case 'CANCELLED':
        return Icons.cancel_outlined;
      default:
        return Icons.info_outlined;
    }
  }

  bool _canCancelOrder(String statusCode) {
    final code = statusCode.toUpperCase();
    return code == 'NEW' || code == 'PENDING';
  }

  Future<void> _handleCancelOrder() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.warning_amber_rounded,
                color: Color(0xFFEF4444),
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            const Text('Cancel Order?', style: TextStyle(fontSize: 18)),
          ],
        ),
        content: const Text(
          'Are you sure you want to cancel this order? This action cannot be undone.',
          style: TextStyle(color: Color(0xFF6B7280)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No, Keep It'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final orderProvider = context.read<OrderProvider>();
      final success = await orderProvider.cancelOrder(widget.orderId);

      if (!mounted) return;

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 12),
                Text('Order cancelled successfully'),
              ],
            ),
            backgroundColor: const Color(0xFF7C3AED),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(orderProvider.error ?? 'Failed to cancel order'),
                ),
              ],
            ),
            backgroundColor: const Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text('Order Details'),
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
        ),
        body: const Center(
          child: CircularProgressIndicator(
            color: Color(0xFF7C3AED),
            strokeWidth: 2,
          ),
        ),
      );
    }

    if (_order == null) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text('Order Details'),
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.search_off,
                  size: 64,
                  color: Color(0xFF9CA3AF),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Order not found',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final canCancel = _canCancelOrder(_order!.statusCode);
    final canPay = _order!.statusCode.toUpperCase() == 'NEW' || _order!.statusCode.toUpperCase() == 'PENDING';
    final statusColor = _getStatusColor(_order!.statusCode);
    final statusIcon = _getStatusIcon(_order!.statusCode);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Order Details',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              'Track your order',
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
      body: SingleChildScrollView(
        padding: EdgeInsets.only(bottom: (canCancel || canPay) ? 120 : 16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Status Card
              _buildStatusCard(statusColor, statusIcon),

              const SizedBox(height: 16),

              // Order Info (header + card)
              _buildSectionHeader(
                icon: Icons.info_outline,
                iconBg: const Color(0xFFF3E8FF),
                iconColor: const Color(0xFF7C3AED),
                title: 'Order Information',
              ),
              const SizedBox(height: 12),
              _buildOrderInfoCard(),

              const SizedBox(height: 16),

              // Address Details (header + card)
              if (_order!.pickupAddress != null || _order!.deliveryAddress != null) ...[
                _buildSectionHeader(
                  icon: Icons.location_on,
                  iconBg: const Color(0xFFF3E8FF),
                  iconColor: const Color(0xFF7C3AED),
                  title: 'Address Details',
                ),
                const SizedBox(height: 12),
                _buildAddressCard(),
                const SizedBox(height: 16),
              ],

              // Items (header + card)
              _buildSectionHeader(
                icon: Icons.inventory_2_outlined,
                iconBg: const Color(0xFFF3E8FF),
                iconColor: const Color(0xFF7C3AED),
                title: 'Service Items',
              ),
              const SizedBox(height: 12),
              _buildItemsCard(),

              const SizedBox(height: 16),

              // Payment Summary (header + card)
              _buildSectionHeader(
                icon: Icons.receipt_long,
                iconBg: const Color(0xFFF3E8FF),
                iconColor: const Color(0xFF7C3AED),
                title: 'Payment Summary',
              ),
              const SizedBox(height: 12),
              _buildPaymentCard(),

              const SizedBox(height: 16),

              // Cancel Button
              if (canCancel) _buildCancelButton(),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
      bottomNavigationBar: (canCancel || canPay)
          ? SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
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
                child: Row(
                  children: [
                    if (canCancel) ...[
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _handleCancelOrder,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFEF4444),
                            side: const BorderSide(color: Color(0xFFEF4444)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    if (canPay)
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _handlePayNow,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF7C3AED),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          icon: const Icon(Icons.payments_outlined),
                          label: const Text('Pay Now'),
                        ),
                      ),
                  ],
                ),
              ),
            )
          : null,
    );
  }

  Future<void> _handlePayNow() async {
    try {
      if (_order == null) return;
      // Use in-app WebView flow with deep-link handling
      final paymentProvider = Provider.of<PaymentProvider>(context, listen: false);

      // Build items payload
      final items = (_order!.items ?? [])
          .map((it) => PaymentItem(
                id: it.serviceId ?? 'ITEM',
                name: it.serviceName ?? 'Laundry Item',
                price: it.unitPrice?.toDouble() ?? 0,
                qty: it.qty ?? 1,
              ))
          .toList();

      // Payment order id: use order_no for idempotency
      final paymentOrderId = _order!.orderNo ?? _order!.id;

      final okCreate = await paymentProvider.createSnapToken(
        orderId: _order!.id,
        paymentOrderId: paymentOrderId,
        grossAmount: _order!.total?.toDouble() ?? 0,
        items: items,
        enabledPayments: const ['gopay', 'qris'],
        expiryMinutes: 60,
      );

      if (!okCreate || paymentProvider.snapTokenResponse == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(paymentProvider.error ?? 'Gagal membuat pembayaran')),
        );
        return;
      }

      // Open in-app WebView
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => PaymentWebViewScreen(
            snapToken: paymentProvider.snapTokenResponse!.token,
            redirectUrl: paymentProvider.snapTokenResponse!.redirectUrl,
            paymentOrderId: paymentOrderId,
            orderId: _order!.id,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Payment error: $e')),
      );
    }
  }

  Widget _buildStatusCard(Color statusColor, IconData statusIcon) {
    return Container(
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
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            children: [
              const Text(
                'Order Number',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF9CA3AF),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              Row(
                children: [
                  const Icon(
                    Icons.access_time,
                    size: 14,
                    color: Color(0xFF9CA3AF),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDateTime(_order!.createdAt),
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 4),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(statusIcon, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _order!.statusName ?? _order!.statusCode,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: statusColor,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _getStatusMessage(
                          _order!.statusCode,
                          _order!.outletName,
                        ),
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderInfoCard() {
    return Container(
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
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox.shrink(),

          _buildInfoRow(
            Icons.store_outlined,
            'Outlet',
            _order!.outletName ?? '-',
            const Color(0xFF7C3AED),
          ),

          if (_order!.isExpress)
            _buildInfoRow(
              Icons.bolt,
              'Express Service',
              'Yes',
              const Color(0xFFF59E0B),
            ),

          if (_order!.promisedAt != null)
            _buildInfoRow(
              Icons.schedule,
              'Estimated Done',
              _formatDateTime(_order!.promisedAt),
              const Color(0xFF7C3AED),
            ),

          // Addresses moved to Address Details section card

          if (_order!.notes != null) ...[
            const Divider(height: 32),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.note_outlined,
                    size: 16,
                    color: Color(0xFF92400E),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Notes',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF6B7280),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _order!.notes!,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildItemsCard() {
    return Container(
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
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),

          if (_order!.items != null)
            ..._order!.items!.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              final last = index >= _order!.items!.length - 1;
              return Column(
                children: [
                  _buildServiceItem(item),
                  if (!last) ...[
                    const SizedBox(height: 12),
                    _DottedDivider(color: const Color(0xFFE5E7EB), height: 1, dashWidth: 6, dashSpace: 4),
                    const SizedBox(height: 12),
                  ],
                ],
              );
            }),
        ],
      ),
    );
  }

  Widget _buildPaymentCard() {
    return Container(
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
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 8),

          _buildPaymentRow('Subtotal', _order!.subtotal),
          if (_order!.taxAmount > 0) ...[
            const SizedBox(height: 12),
            _buildPaymentRow('Tax', _order!.taxAmount),
          ],
          if (_order!.discountAmount > 0) ...[
            const SizedBox(height: 12),
            _buildPaymentRow(
              'Discount',
              -_order!.discountAmount,
              isDiscount: true,
            ),
          ],

          const SizedBox(height: 12),
          _DottedDivider(color: Color(0xFFE5E7EB), height: 1, dashWidth: 6, dashSpace: 4),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Payment',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF6B7280),
                ),
              ),
              Text(
                'Rp ${_formatCurrency(_order!.total)}',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF7C3AED),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAddressCard() {
    return Container(
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
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_order!.pickupAddress != null)
            _buildAddressRow(
              Icons.location_on,
              'Pickup Address',
              _order!.pickupAddress!,
              const Color(0xFF7C3AED),
            ),
          if (_order!.pickupAddress != null && _order!.deliveryAddress != null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Divider(height: 1),
            ),
          if (_order!.deliveryAddress != null)
            _buildAddressRow(
              Icons.home,
              'Delivery Address',
              _order!.deliveryAddress!,
              const Color(0xFF7C3AED),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader({
    required IconData icon,
    required String title,
    Color iconBg = const Color(0xFFF3E8FF),
    Color iconColor = const Color(0xFF7C3AED),
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconBg,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
      ],
    );
  }

  Widget _buildCancelButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: _handleCancelOrder,
        icon: const Icon(Icons.close),
        label: const Text('Cancel Order'),
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFFEF4444),
          side: const BorderSide(color: Color(0xFFEF4444)),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF1F2937),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressRow(
    IconData icon,
    String label,
    String address,
    Color color,
  ) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: color,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                address,
                style: const TextStyle(fontSize: 14, color: Color(0xFF1F2937)),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildServiceItem(OrderItem item) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Thumbnail placeholder (no image in model, so show neutral box)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 72,
                  height: 72,
                  color: const Color(0xFFE5E7EB),
                  child: const Icon(Icons.image, color: Color(0xFF9CA3AF)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.serviceName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${item.qty} Unit',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF6B7280),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                'Rp ${_formatCurrency(item.subtotal)}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
            ],
          ),

          // Addons
          if (item.addons != null && item.addons!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Column(
              children: item.addons!.map((addon) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      const Text(
                        '+ ',
                        style: TextStyle(color: Color(0xFF6B7280), fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      Expanded(
                        child: Text(
                          addon.addonName,
                          style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                        ),
                      ),
                      Text(
                        'Rp ${_formatCurrency(addon.subtotal)}',
                        style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPaymentRow(
    String label,
    double amount, {
    bool isDiscount = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
        ),
        Text(
          '${isDiscount ? "-" : ""}Rp ${_formatCurrency(amount.abs())}',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isDiscount
                ? const Color(0xFF7C3AED)
                : const Color(0xFF1F2937),
          ),
        ),
      ],
    );
  }

  String _getStatusMessage(String statusCode, String? outletName) {
    final outlet = outletName ?? 'outlet';
    switch (statusCode.toUpperCase()) {
      case 'NEW':
        return 'Your order has been received by $outlet';
      case 'IN_PROGRESS':
        return 'Your order is being processed by $outlet';
      case 'COMPLETED':
        return 'Your order has been completed at $outlet';
      case 'CANCELED':
      case 'CANCELLED':
        return 'Your order has been cancelled';
      default:
        return 'Thank you for ordering at $outlet';
    }
  }
}

// Simple dotted divider to mimic modern receipt separators
class _DottedDivider extends StatelessWidget {
  final Color color;
  final double height;
  final double dashWidth;
  final double dashSpace;
  const _DottedDivider({
    Key? key,
    this.color = const Color(0xFFE5E7EB),
    this.height = 1,
    this.dashWidth = 4,
    this.dashSpace = 4,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final count = (constraints.maxWidth / (dashWidth + dashSpace)).floor();
        return Row(
          children: List.generate(count * 2 - 1, (i) {
            if (i.isOdd) return SizedBox(width: dashSpace);
            return Container(width: dashWidth, height: height, color: color);
          }),
        );
      },
    );
  }
}
