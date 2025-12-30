import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/payment_transaction_model.dart';

/// Payment status badge widget
class PaymentStatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;

  const PaymentStatusBadge({
    super.key,
    required this.status,
    this.fontSize = 12,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _getStatusColors(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: colors['background'],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        _getStatusLabel(status),
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          color: colors['text'],
        ),
      ),
    );
  }

  Map<String, Color> _getStatusColors(String status) {
    switch (status) {
      case 'SUCCESS':
        return {
          'background': Colors.green.shade50,
          'text': Colors.green.shade700,
        };
      case 'PENDING':
        return {
          'background': Colors.orange.shade50,
          'text': Colors.orange.shade700,
        };
      case 'FAILED':
        return {
          'background': Colors.red.shade50,
          'text': Colors.red.shade700,
        };
      case 'EXPIRED':
        return {
          'background': Colors.grey.shade200,
          'text': Colors.grey.shade700,
        };
      case 'CANCELED':
        return {
          'background': Colors.grey.shade200,
          'text': Colors.grey.shade700,
        };
      default:
        return {
          'background': Colors.blue.shade50,
          'text': Colors.blue.shade700,
        };
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'SUCCESS':
        return 'Berhasil';
      case 'FAILED':
        return 'Gagal';
      case 'EXPIRED':
        return 'Kadaluarsa';
      case 'CANCELED':
        return 'Dibatalkan';
      default:
        return status;
    }
  }
}

/// Payment method icon widget
class PaymentMethodIcon extends StatelessWidget {
  final String paymentMethod;
  final double size;
  final Color? color;

  const PaymentMethodIcon({
    super.key,
    required this.paymentMethod,
    this.size = 24,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Icon(
      _getPaymentMethodIcon(paymentMethod),
      size: size,
      color: color ?? _getPaymentMethodColor(paymentMethod),
    );
  }

  IconData _getPaymentMethodIcon(String method) {
    switch (method) {
      case 'gopay':
        return Icons.account_balance_wallet;
      case 'bank_transfer':
        return Icons.account_balance;
      case 'shopeepay':
        return Icons.wallet;
      case 'qris':
        return Icons.qr_code_scanner;
      case 'credit_card':
        return Icons.credit_card;
      case 'cstore':
        return Icons.store;
      default:
        return Icons.payment;
    }
  }

  Color _getPaymentMethodColor(String method) {
    switch (method) {
      case 'gopay':
        return Colors.green;
      case 'bank_transfer':
        return Colors.blue;
      case 'shopeepay':
        return Colors.orange;
      case 'qris':
        return Colors.purple;
      case 'credit_card':
        return Colors.indigo;
      default:
        return Colors.grey;
    }
  }
}

/// Payment amount display widget
class PaymentAmountDisplay extends StatelessWidget {
  final double amount;
  final double fontSize;
  final Color? color;
  final FontWeight fontWeight;

  const PaymentAmountDisplay({
    super.key,
    required this.amount,
    this.fontSize = 24,
    this.color,
    this.fontWeight = FontWeight.bold,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Text(
      currencyFormat.format(amount),
      style: TextStyle(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color ?? Theme.of(context).primaryColor,
      ),
    );
  }
}

/// Payment transaction card widget
class PaymentTransactionCard extends StatelessWidget {
  final PaymentTransactionModel transaction;
  final VoidCallback? onTap;

  const PaymentTransactionCard({
    super.key,
    required this.transaction,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with status badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      transaction.paymentOrderId,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  PaymentStatusBadge(status: transaction.status),
                ],
              ),
              const SizedBox(height: 12),

              // Amount
              PaymentAmountDisplay(
                amount: transaction.grossAmount,
                fontSize: 20,
              ),
              const SizedBox(height: 8),

              // Payment method
              if (transaction.paymentMethod != null)
                Row(
                  children: [
                    PaymentMethodIcon(
                      paymentMethod: transaction.paymentMethod!,
                      size: 16,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      transaction.paymentMethodLabel,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              const SizedBox(height: 8),

              // Date
              Row(
                children: [
                  const Icon(
                    Icons.access_time,
                    size: 16,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(
                      transaction.transactionTime ?? transaction.createdAt,
                    ),
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return DateFormat('dd MMM yyyy, HH:mm').format(date);
  }
}

/// Copyable text widget
class CopyableText extends StatelessWidget {
  final String text;
  final String? label;
  final TextStyle? textStyle;

  const CopyableText({
    super.key,
    required this.text,
    this.label,
    this.textStyle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (label != null) ...[
                Text(
                  label!,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 4),
              ],
              Text(
                text,
                style: textStyle ??
                    const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
        ),
        IconButton(
          icon: const Icon(Icons.copy, size: 20),
          onPressed: () {
            Clipboard.setData(ClipboardData(text: text));
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Disalin ke clipboard'),
                duration: Duration(seconds: 2),
              ),
            );
          },
          tooltip: 'Salin',
        ),
      ],
    );
  }
}

/// Payment detail row widget
class PaymentDetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isHighlighted;

  const PaymentDetailRow({
    super.key,
    required this.label,
    required this.value,
    this.isHighlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
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
        ],
      ),
    );
  }
}

/// Empty state widget for payment lists
class PaymentEmptyState extends StatelessWidget {
  final String message;
  final IconData icon;
  final VoidCallback? onActionPressed;
  final String? actionLabel;

  const PaymentEmptyState({
    super.key,
    this.message = 'Belum ada riwayat pembayaran',
    this.icon = Icons.receipt_long_outlined,
    this.onActionPressed,
    this.actionLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.grey,
                  ),
              textAlign: TextAlign.center,
            ),
            if (onActionPressed != null && actionLabel != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onActionPressed,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Payment error state widget
class PaymentErrorState extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const PaymentErrorState({
    super.key,
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              'Error',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onRetry,
                child: const Text('Coba Lagi'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Loading indicator widget
class PaymentLoadingIndicator extends StatelessWidget {
  final String? message;

  const PaymentLoadingIndicator({
    super.key,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
