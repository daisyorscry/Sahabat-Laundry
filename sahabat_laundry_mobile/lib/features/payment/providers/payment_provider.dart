import 'package:flutter/foundation.dart';
import '../models/payment_transaction_model.dart';
import '../services/payment_service.dart';
import 'package:url_launcher/url_launcher.dart';

class PaymentProvider with ChangeNotifier {
  final PaymentService _paymentService = PaymentService();

  bool _isLoading = false;
  String? _error;
  PaymentTransactionModel? _currentTransaction;
  List<PaymentTransactionModel> _paymentHistory = [];
  CreateSnapTokenResponse? _snapTokenResponse;

  bool get isLoading => _isLoading;
  String? get error => _error;
  PaymentTransactionModel? get currentTransaction => _currentTransaction;
  List<PaymentTransactionModel> get paymentHistory => _paymentHistory;
  CreateSnapTokenResponse? get snapTokenResponse => _snapTokenResponse;

  void setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void setError(String? error) {
    _error = error;
    notifyListeners();
  }

  /// Create Snap Token for payment
  Future<bool> createSnapToken({
    required String orderId,
    required String paymentOrderId,
    required double grossAmount,
    required List<PaymentItem> items,
    CustomerDetail? customerDetail,
    List<String>? enabledPayments,
    int expiryMinutes = 60,
  }) async {
    setLoading(true);
    setError(null);

    try {
      final request = CreateSnapTokenRequest(
        orderId: orderId,
        paymentOrderId: paymentOrderId,
        grossAmount: grossAmount,
        items: items,
        customerDetail: customerDetail,
        enabledPayments: enabledPayments ?? [
          'gopay',
          'qris',
        ],
        expiryMinutes: expiryMinutes,
      );

      _snapTokenResponse = await _paymentService.createSnapToken(request);

      // Also fetch the transaction details
      await getPaymentByOrderId(orderId);

      setLoading(false);
      return true;
    } catch (e) {
      setError(e.toString());
      setLoading(false);
      return false;
    }
  }

  /// Open Midtrans payment page in browser
  Future<bool> openPaymentPage() async {
    if (_snapTokenResponse == null) {
      setError('No payment token available');
      return false;
    }

    try {
      final uri = Uri.parse(_snapTokenResponse!.redirectUrl);
      // Try external app (browser)
      bool launched = false;
      try {
        launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (_) {}

      // Fallback to in-app browser (Chrome Custom Tabs / SFSafariViewController)
      if (!launched) {
        try {
          launched = await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
        } catch (_) {}
      }

      // Last fallback: platform default
      if (!launched) {
        try {
          launched = await launchUrl(uri, mode: LaunchMode.platformDefault);
        } catch (_) {}
      }

      if (launched) return true;

      setError('Could not open payment page');
      return false;
    } catch (e) {
      setError('Error opening payment page: ${e.toString()}');
      return false;
    }
  }

  /// Check payment transaction status
  Future<bool> checkTransactionStatus(String paymentOrderId) async {
    setLoading(true);
    setError(null);

    try {
      _currentTransaction = await _paymentService.checkTransactionStatus(
        paymentOrderId,
      );
      setLoading(false);
      return true;
    } catch (e) {
      setError(e.toString());
      setLoading(false);
      return false;
    }
  }

  /// Get payment by order ID
  Future<bool> getPaymentByOrderId(String orderId) async {
    setLoading(true);
    setError(null);

    try {
      _currentTransaction = await _paymentService.getPaymentByOrderId(orderId);
      setLoading(false);
      return true;
    } catch (e) {
      setError(e.toString());
      setLoading(false);
      return false;
    }
  }

  /// Get payment by payment order ID
  Future<bool> getPaymentByPaymentOrderId(String paymentOrderId) async {
    setLoading(true);
    setError(null);

    try {
      _currentTransaction = await _paymentService.getPaymentByPaymentOrderId(
        paymentOrderId,
      );
      setLoading(false);
      return true;
    } catch (e) {
      setError(e.toString());
      setLoading(false);
      return false;
    }
  }

  /// Get payment history for an order
  Future<bool> getPaymentHistory(String orderId) async {
    setLoading(true);
    setError(null);

    try {
      _paymentHistory = await _paymentService.getPaymentHistory(orderId);
      setLoading(false);
      return true;
    } catch (e) {
      setError(e.toString());
      setLoading(false);
      return false;
    }
  }

  /// Poll payment status until success or timeout
  Future<bool> pollPaymentStatus({
    required String paymentOrderId,
    int maxAttempts = 60, // Poll for max 5 minutes (60 * 5s = 300s)
    Duration interval = const Duration(seconds: 5),
  }) async {
    for (int i = 0; i < maxAttempts; i++) {
      await Future.delayed(interval);

      final success = await checkTransactionStatus(paymentOrderId);
      if (!success) continue;

      // Check if payment is completed (success or failed)
      if (_currentTransaction != null) {
        if (_currentTransaction!.isSuccess) {
          return true;
        } else if (_currentTransaction!.isFailed ||
                   _currentTransaction!.isExpired ||
                   _currentTransaction!.isCanceled) {
          return false;
        }
      }
    }

    setError('Payment status check timeout');
    return false;
  }

  /// Clear current transaction
  void clearCurrentTransaction() {
    _currentTransaction = null;
    _snapTokenResponse = null;
    _error = null;
    notifyListeners();
  }

  /// Clear payment history
  void clearPaymentHistory() {
    _paymentHistory = [];
    notifyListeners();
  }

  /// Reset all state
  void reset() {
    _isLoading = false;
    _error = null;
    _currentTransaction = null;
    _paymentHistory = [];
    _snapTokenResponse = null;
    notifyListeners();
  }
}
