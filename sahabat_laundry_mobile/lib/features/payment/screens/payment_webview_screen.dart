import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../providers/payment_provider.dart';

class PaymentWebViewScreen extends StatefulWidget {
  final String snapToken;
  final String redirectUrl;
  final String paymentOrderId;
  final String orderId;

  const PaymentWebViewScreen({
    super.key,
    required this.snapToken,
    required this.redirectUrl,
    required this.paymentOrderId,
    required this.orderId,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _controller;
  Timer? _statusCheckTimer;
  bool _isPaymentCompleted = false;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initWebView();
    _startStatusPolling();
  }

  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
            _checkPaymentStatus();
          },
          onNavigationRequest: (NavigationRequest request) {
            final url = request.url;
            // Handle deep links to external apps (GoPay/ShopeePay) inside WebView flow
            if (_handleDeepLink(url)) {
              return NavigationDecision.prevent;
            }

            // Detect completion URLs
            if (url.contains('finish') ||
                url.contains('complete') ||
                url.contains('success')) {
              _handlePaymentCompletion();
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
          onWebResourceError: (WebResourceError error) {
            setState(() {
              _errorMessage = 'Error loading payment page: ${error.description}';
              _isLoading = false;
            });
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.redirectUrl));

    // Add JavaScript handlers for Midtrans callbacks
    _controller.addJavaScriptChannel(
      'MidtransCallback',
      onMessageReceived: (JavaScriptMessage message) {
        _handleMidtransCallback(message.message);
      },
    );
  }

  bool _handleDeepLink(String url) {
    // GoPay / ShopeePay direct schemes
    if (url.startsWith('gojek://') || url.startsWith('shopeepay://')) {
      _launchExternal(Uri.parse(url));
      return true;
    }

    // Android intent:// format
    if (url.startsWith('intent://')) {
      final intentIdx = url.indexOf('#Intent;');
      final params = intentIdx != -1 ? url.substring(intentIdx + 8) : '';
      String scheme = 'https';
      final schemeMatch = RegExp(r'scheme=([^;]+)').firstMatch(params);
      if (schemeMatch != null) scheme = schemeMatch.group(1)!;
      // Transform to scheme:// form
      final transformed = url.replaceFirst('intent://', '$scheme://').split('#Intent;').first;
      // Try open external app
      _launchExternal(Uri.parse(transformed));
      return true;
    }

    return false;
  }

  Future<void> _launchExternal(Uri uri) async {
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  void _startStatusPolling() {
    // Poll payment status every 5 seconds
    _statusCheckTimer = Timer.periodic(
      const Duration(seconds: 5),
      (timer) async {
        if (_isPaymentCompleted) {
          timer.cancel();
          return;
        }
        await _checkPaymentStatus();
      },
    );
  }

  Future<void> _checkPaymentStatus() async {
    if (_isPaymentCompleted) return;

    final paymentProvider = context.read<PaymentProvider>();
    await paymentProvider.checkTransactionStatus(widget.paymentOrderId);

    if (paymentProvider.currentTransaction != null) {
      final transaction = paymentProvider.currentTransaction!;

      // Check if payment is completed (success or failed)
      if (transaction.isSuccess ||
          transaction.isFailed ||
          transaction.isExpired ||
          transaction.isCanceled) {
        _handlePaymentCompletion();
      }
    }
  }

  void _handleMidtransCallback(String message) {
    // Handle callbacks from Midtrans JavaScript
    // Message format: "status:transaction_status"
    if (message.startsWith('status:')) {
      final status = message.split(':')[1];
      if (status == 'success' || status == 'settlement') {
        _handlePaymentCompletion();
      }
    }
  }

  void _handlePaymentCompletion() {
    if (_isPaymentCompleted) return;

    setState(() {
      _isPaymentCompleted = true;
    });

    _statusCheckTimer?.cancel();

    // Navigate to payment status screen
    if (mounted) {
      Navigator.pushReplacementNamed(
        context,
        '/payment-status',
        arguments: {
          'paymentOrderId': widget.paymentOrderId,
          'orderId': widget.orderId,
        },
      );
    }
  }

  Future<bool> _onWillPop() async {
    if (_isPaymentCompleted) {
      return false;
    }

    // Show confirmation dialog
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Batalkan Pembayaran?'),
        content: const Text(
          'Pembayaran Anda sedang diproses. Apakah Anda yakin ingin membatalkan?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Tidak'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('Ya, Batalkan'),
          ),
        ],
      ),
    );

    return shouldPop ?? false;
  }

  @override
  void dispose() {
    _statusCheckTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (bool didPop) async {
        if (!didPop) {
          final shouldPop = await _onWillPop();
          if (shouldPop && context.mounted) {
            Navigator.of(context).pop();
          }
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Pembayaran'),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () async {
              if (await _onWillPop()) {
                if (mounted) {
                  Navigator.pop(context);
                }
              }
            },
          ),
        ),
        body: Stack(
          children: [
            // WebView
            if (_errorMessage == null)
              WebViewWidget(controller: _controller)
            else
              Center(
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
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _errorMessage!,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _errorMessage = null;
                            _isLoading = true;
                          });
                          _initWebView();
                        },
                        child: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
                ),
              ),

            // Loading indicator
            if (_isLoading && _errorMessage == null)
              Container(
                color: Colors.white,
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 16),
                      Text(
                        'Memuat halaman pembayaran...',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Payment completed overlay
            if (_isPaymentCompleted)
              Container(
                color: Colors.white,
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 16),
                      Text(
                        'Memproses pembayaran...',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
