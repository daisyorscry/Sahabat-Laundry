import 'dart:io';
import 'package:flutter/services.dart';
import '../../core/network/order_service_client.dart';

class MidtransPaymentService {
  final _client = OrderServiceClient();
  static const MethodChannel _channel = MethodChannel('midtrans_mobile_sdk');

  Future<Map<String, dynamic>> createSnapToken({
    required String orderId,
    required double grossAmount,
    List<Map<String, dynamic>> items = const [],
    Map<String, dynamic>? customer,
    List<String> enabledPayments = const [],
    int expiryMinutes = 0,
  }) async {
    final payload = {
      'order_id': orderId,
      'gross_amount': grossAmount,
      'items': items,
      'customer_detail': customer,
      'enabled_payments': enabledPayments,
      'expiry_minutes': expiryMinutes,
    };

    final resp = await _client.dio.post(
      '/payments/midtrans/token',
      data: payload,
    );
    return (resp.data['data'] as Map).cast<String, dynamic>();
  }

  /// Start Mobile SDK payment using platform channel.
  /// Expect native side to handle iOS/Android Midtrans SDKs.
  Future<Map<String, dynamic>> startPayment({
    required String clientKey,
    required String snapToken,
    required bool isProduction,
  }) async {
    try {
      final result = await _channel.invokeMethod<Map>('startPayment', {
        'clientKey': clientKey,
        'snapToken': snapToken,
        'isProduction': isProduction,
      });
      return (result ?? {}).cast<String, dynamic>();
    } on MissingPluginException {
      // Native SDK not wired yet
      return {
        'status': 'unsupported',
        'message':
            'Midtrans Mobile SDK not linked on ${Platform.isAndroid ? 'Android' : 'iOS'}',
      };
    }
  }
}
