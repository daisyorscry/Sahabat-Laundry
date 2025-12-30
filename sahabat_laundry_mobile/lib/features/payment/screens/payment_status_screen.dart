import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/payment_provider.dart';
import '../models/payment_transaction_model.dart';

class PaymentStatusScreen extends StatefulWidget {
  final PaymentTransactionModel? transaction;
  final String? paymentOrderId;
  final String? orderId;

  const PaymentStatusScreen({
    super.key,
    this.transaction,
    this.paymentOrderId,
    this.orderId,
  });

  @override
  State<PaymentStatusScreen> createState() => _PaymentStatusScreenState();
}

class _PaymentStatusScreenState extends State<PaymentStatusScreen> {
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.transaction == null && widget.paymentOrderId != null) {
      _loadTransactionStatus();
    }
  }

  Future<void> _loadTransactionStatus() async {
    setState(() => _isLoading = true);
    final paymentProvider = context.read<PaymentProvider>();
    await paymentProvider.checkTransactionStatus(widget.paymentOrderId!);
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<PaymentProvider>(
      builder: (context, paymentProvider, child) {
        final transaction = widget.transaction ?? paymentProvider.currentTransaction;

        if (_isLoading || transaction == null) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Status Pembayaran'),
            ),
            body: const Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: const Text('Status Pembayaran'),
            automaticallyImplyLeading: false,
          ),
          body: _buildStatusContent(transaction),
        );
      },
    );
  }

  Widget _buildStatusContent(PaymentTransactionModel transaction) {
    final currencyFormat = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return SingleChildScrollView(
      child: Column(
        children: [
          // Status icon and message
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: _getStatusGradientColors(transaction.status),
              ),
            ),
            child: Column(
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Icon(
                    _getStatusIcon(transaction.status),
                    size: 50,
                    color: _getStatusColor(transaction.status),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  transaction.statusLabel,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  _getStatusDescription(transaction.status),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.9),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),

          // Transaction details
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Amount card
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total Pembayaran',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                            Text(
                              currencyFormat.format(transaction.grossAmount),
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Theme.of(context).primaryColor,
                              ),
                            ),
                          ],
                        ),
                        if (transaction.paymentMethod != null) ...[
                          const Divider(height: 32),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Metode Pembayaran',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey,
                                ),
                              ),
                              Text(
                                transaction.paymentMethodLabel,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Transaction info
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Detail Transaksi',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        _buildDetailRow(
                          'Order ID',
                          transaction.paymentOrderId,
                        ),
                        const SizedBox(height: 12),
                        _buildDetailRow(
                          'Waktu Transaksi',
                          transaction.transactionTime != null
                              ? DateFormat('dd MMM yyyy, HH:mm').format(
                                  transaction.transactionTime!,
                                )
                              : DateFormat('dd MMM yyyy, HH:mm').format(
                                  transaction.createdAt,
                                ),
                        ),
                        if (transaction.transactionId != null) ...[
                          const SizedBox(height: 12),
                          _buildDetailRow(
                            'Transaction ID',
                            transaction.transactionId!,
                          ),
                        ],
                        if (transaction.vaNumber != null) ...[
                          const SizedBox(height: 12),
                          _buildDetailRow(
                            'Nomor VA',
                            transaction.vaNumber!,
                            isCopyable: true,
                          ),
                        ],
                        if (transaction.expiryTime != null &&
                            transaction.isPending) ...[
                          const SizedBox(height: 12),
                          _buildDetailRow(
                            'Kadaluarsa',
                            DateFormat('dd MMM yyyy, HH:mm').format(
                              transaction.expiryTime!,
                            ),
                            isHighlighted: true,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Action buttons
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                if (transaction.isPending) ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _checkPaymentStatus(transaction),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Cek Status Pembayaran',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                if (transaction.isFailed || transaction.isExpired) ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _retryPayment,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Coba Lagi',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _goToHome,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Kembali ke Beranda',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(
    String label,
    String value, {
    bool isCopyable = false,
    bool isHighlighted = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
        ),
        Expanded(
          flex: 3,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isHighlighted ? Colors.orange : Colors.black87,
                  ),
                  textAlign: TextAlign.right,
                ),
              ),
              if (isCopyable) ...[
                const SizedBox(width: 8),
                InkWell(
                  onTap: () {
                    // Copy to clipboard functionality
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Disalin ke clipboard'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                  },
                  child: const Icon(
                    Icons.copy,
                    size: 16,
                    color: Colors.grey,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  List<Color> _getStatusGradientColors(String status) {
    switch (status) {
      case 'SUCCESS':
        return [Colors.green.shade400, Colors.green.shade600];
      case 'PENDING':
        return [Colors.orange.shade400, Colors.orange.shade600];
      case 'FAILED':
        return [Colors.red.shade400, Colors.red.shade600];
      case 'EXPIRED':
        return [Colors.grey.shade400, Colors.grey.shade600];
      case 'CANCELED':
        return [Colors.grey.shade400, Colors.grey.shade600];
      default:
        return [Colors.blue.shade400, Colors.blue.shade600];
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'SUCCESS':
        return Icons.check_circle;
      case 'PENDING':
        return Icons.access_time;
      case 'FAILED':
        return Icons.error;
      case 'EXPIRED':
        return Icons.timer_off;
      case 'CANCELED':
        return Icons.cancel;
      default:
        return Icons.info;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'SUCCESS':
        return Colors.green;
      case 'PENDING':
        return Colors.orange;
      case 'FAILED':
        return Colors.red;
      case 'EXPIRED':
        return Colors.grey;
      case 'CANCELED':
        return Colors.grey;
      default:
        return Colors.blue;
    }
  }

  String _getStatusDescription(String status) {
    switch (status) {
      case 'SUCCESS':
        return 'Pembayaran Anda telah berhasil diproses';
      case 'PENDING':
        return 'Menunggu konfirmasi pembayaran';
      case 'FAILED':
        return 'Pembayaran gagal, silakan coba lagi';
      case 'EXPIRED':
        return 'Pembayaran telah kadaluarsa';
      case 'CANCELED':
        return 'Pembayaran telah dibatalkan';
      default:
        return 'Status pembayaran tidak diketahui';
    }
  }

  Future<void> _checkPaymentStatus(PaymentTransactionModel transaction) async {
    setState(() => _isLoading = true);
    final paymentProvider = context.read<PaymentProvider>();
    await paymentProvider.checkTransactionStatus(transaction.paymentOrderId);
    setState(() => _isLoading = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Status pembayaran telah diperbarui'),
        ),
      );
    }
  }

  void _retryPayment() {
    // Navigate back to payment selection
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/orders',
      (route) => false,
    );
  }

  void _goToHome() {
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/',
      (route) => false,
    );
  }
}
