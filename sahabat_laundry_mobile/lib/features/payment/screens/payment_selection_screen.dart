import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/payment_provider.dart';
import '../models/payment_transaction_model.dart';
import '../../order/models/order_model.dart';
import '../../auth/providers/auth_provider.dart';
import 'payment_webview_screen.dart';

class PaymentSelectionScreen extends StatefulWidget {
  final OrderModel order;

  const PaymentSelectionScreen({super.key, required this.order});

  @override
  State<PaymentSelectionScreen> createState() => _PaymentSelectionScreenState();
}

class _PaymentSelectionScreenState extends State<PaymentSelectionScreen> {
  final List<PaymentMethod> _paymentMethods = [
    PaymentMethod(
      id: 'gopay',
      name: 'GoPay',
      icon: Icons.account_balance_wallet,
      color: Colors.green,
      description: 'Bayar dengan GoPay',
    ),
    PaymentMethod(
      id: 'qris',
      name: 'QRIS',
      icon: Icons.qr_code_scanner,
      color: Colors.purple,
      description: 'Scan QRIS untuk bayar',
    ),
  ];

  List<String> _selectedMethods = [];

  @override
  void initState() {
    super.initState();
    // Preselect supported methods (GoPay + QRIS) and check existing payment
    _selectedMethods = ['gopay', 'qris'];
    // Check if payment already exists
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkExistingPayment();
    });
  }

  Future<void> _checkExistingPayment() async {
    final paymentProvider = context.read<PaymentProvider>();
    await paymentProvider.getPaymentByOrderId(widget.order.id);

    if (paymentProvider.currentTransaction != null &&
        paymentProvider.currentTransaction!.isPending) {
      // Payment exists and pending, navigate to status screen
      if (mounted) {
        Navigator.pushReplacementNamed(
          context,
          '/payment-status',
          arguments: paymentProvider.currentTransaction,
        );
      }
    }
  }

  Future<void> _processPayment() async {
    if (_selectedMethods.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pilih minimal satu metode pembayaran'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final paymentProvider = context.read<PaymentProvider>();
    final authProvider = context.read<AuthProvider>();
    var user = authProvider.user;
    // Try to fetch user profile if not available yet
    if (user == null) {
      try {
        await authProvider.fetchUserProfile();
        user = authProvider.user;
      } catch (_) {}
    }

    // Debug log
    print('[PaymentSelection] Order ID: ${widget.order.id}');
    print('[PaymentSelection] Order No: ${widget.order.orderNo}');
    print('[PaymentSelection] Total: ${widget.order.total}');
    if (user != null) {
      print('[PaymentSelection] User: ${user.fullName}');
    } else {
      print(
        '[PaymentSelection] User: <null> (proceeding without customer detail)',
      );
    }

    // Validate order data
    if (widget.order.total <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Total pembayaran tidak valid'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Generate payment order ID
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final paymentOrderId = 'PAY-${widget.order.orderNo}-$timestamp';

    // Create payment items from order
    final items = <PaymentItem>[
      PaymentItem(
        id: 'ORDER-${widget.order.orderNo}',
        name: 'Laundry Service - ${widget.order.orderNo}',
        price: widget.order.total,
        qty: 1,
      ),
    ];

    // Customer detail
    CustomerDetail? customerDetail;
    if (user != null) {
      customerDetail = CustomerDetail(
        firstName: user.fullName.split(' ').first,
        lastName: user.fullName.split(' ').length > 1
            ? user.fullName.split(' ').sublist(1).join(' ')
            : '',
        email: user.email ?? 'customer@example.com',
        phone: user.phoneNumber ?? '08123456789',
      );
    }

    print('[PaymentSelection] Payment Order ID: $paymentOrderId');
    print('[PaymentSelection] Items: ${items.map((e) => e.toJson())}');
    if (customerDetail != null) {
      print('[PaymentSelection] Customer: ${customerDetail.toJson()}');
    }

    final success = await paymentProvider.createSnapToken(
      orderId: widget.order.id,
      paymentOrderId: paymentOrderId,
      grossAmount: widget.order.total,
      items: items,
      customerDetail: customerDetail,
      enabledPayments: _selectedMethods,
      expiryMinutes: 60,
    );

    if (!mounted) return;

    if (success && paymentProvider.snapTokenResponse != null) {
      // Navigate to in-app WebView; deep links will be handled internally
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => PaymentWebViewScreen(
            snapToken: paymentProvider.snapTokenResponse!.token,
            redirectUrl: paymentProvider.snapTokenResponse!.redirectUrl,
            paymentOrderId: paymentOrderId,
            orderId: widget.order.id,
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(paymentProvider.error ?? 'Gagal membuat pembayaran'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pilih Metode Pembayaran'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Order summary card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Order #${widget.order.orderNo}',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Total Pembayaran',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    Text(
                      currencyFormat.format(widget.order.total),
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(
                            color: Theme.of(context).primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Payment methods list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _paymentMethods.length,
              itemBuilder: (context, index) {
                final method = _paymentMethods[index];
                final isSelected = _selectedMethods.contains(method.id);

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  elevation: isSelected ? 4 : 1,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: isSelected ? method.color : Colors.grey.shade300,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: InkWell(
                    onTap: () {
                      setState(() {
                        if (isSelected) {
                          _selectedMethods.remove(method.id);
                        } else {
                          _selectedMethods.add(method.id);
                        }
                      });
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: method.color.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              method.icon,
                              color: method.color,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  method.name,
                                  style: Theme.of(context).textTheme.titleMedium
                                      ?.copyWith(fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  method.description,
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            Icon(
                              Icons.check_circle,
                              color: method.color,
                              size: 28,
                            )
                          else
                            Icon(
                              Icons.circle_outlined,
                              color: Colors.grey.shade400,
                              size: 28,
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Process payment button
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Consumer<PaymentProvider>(
              builder: (context, paymentProvider, child) {
                return SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: paymentProvider.isLoading
                        ? null
                        : _processPayment,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: paymentProvider.isLoading
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
                        : const Text(
                            'Lanjutkan Pembayaran',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class PaymentMethod {
  final String id;
  final String name;
  final IconData icon;
  final Color color;
  final String description;

  PaymentMethod({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    required this.description,
  });
}
