import 'package:dio/dio.dart';
import '../../../core/network/order_service_client.dart';
import '../models/payment_transaction_model.dart';

class PaymentService {
  final OrderServiceClient _client = OrderServiceClient();

  /// Create Snap token for payment
  Future<CreateSnapTokenResponse> createSnapToken(
    CreateSnapTokenRequest request,
  ) async {
    try {
      // Debug log
      print('[PaymentService] Creating snap token with request: ${request.toJson()}');

      final response = await _client.dio.post(
        '/payments/midtrans/token',
        data: request.toJson(),
      );

      print('[PaymentService] Response: ${response.data}');

      if (response.data['success'] == true) {
        return CreateSnapTokenResponse.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? 'Failed to create snap token');
      }
    } on DioException catch (e) {
      print('[PaymentService] DioException: ${e.response?.data}');

      if (e.response != null && e.response!.data != null) {
        // Extract detailed error message
        final data = e.response!.data;
        String errorMsg = 'Failed to create snap token';

        if (data is Map) {
          if (data['message'] != null) {
            errorMsg = data['message'].toString();
          }
          if (data['error'] != null) {
            errorMsg = '$errorMsg: ${data['error']}';
          }
        }

        throw Exception(errorMsg);
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  /// Check payment transaction status from Midtrans
  Future<PaymentTransactionModel> checkTransactionStatus(
    String paymentOrderId,
  ) async {
    try {
      final response = await _client.dio.get(
        '/payments/midtrans/status/$paymentOrderId',
      );

      if (response.data['success'] == true) {
        return PaymentTransactionModel.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? 'Failed to check status');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response!.data['message'] ?? 'Failed to check status');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  /// Get payment transaction by order ID
  Future<PaymentTransactionModel> getPaymentByOrderId(String orderId) async {
    try {
      final response = await _client.dio.get(
        '/payments/midtrans/order/$orderId',
      );

      if (response.data['success'] == true) {
        return PaymentTransactionModel.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? 'Payment not found');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response!.data['message'] ?? 'Payment not found');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  /// Get payment transaction by payment order ID
  Future<PaymentTransactionModel> getPaymentByPaymentOrderId(
    String paymentOrderId,
  ) async {
    try {
      final response = await _client.dio.get(
        '/payments/midtrans/payment/$paymentOrderId',
      );

      if (response.data['success'] == true) {
        return PaymentTransactionModel.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? 'Payment not found');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response!.data['message'] ?? 'Payment not found');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  /// Get payment history for an order
  Future<List<PaymentTransactionModel>> getPaymentHistory(
    String orderId,
  ) async {
    try {
      final response = await _client.dio.get(
        '/payments/midtrans/history/order/$orderId',
      );

      if (response.data['success'] == true) {
        final transactions = (response.data['data']['transactions'] as List)
            .map((e) => PaymentTransactionModel.fromJson(e))
            .toList();
        return transactions;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to get history');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response!.data['message'] ?? 'Failed to get history');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  /// Get all transaction history with filters
  Future<Map<String, dynamic>> getTransactionHistory({
    String? status,
    String? paymentMethod,
    String? startDate,
    String? endDate,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (status != null) queryParams['status'] = status;
      if (paymentMethod != null) queryParams['payment_method'] = paymentMethod;
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;

      final response = await _client.dio.get(
        '/payments/midtrans/history',
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final transactions = (response.data['data']['transactions'] as List)
            .map((e) => PaymentTransactionModel.fromJson(e))
            .toList();

        return {
          'transactions': transactions,
          'pagination': response.data['data']['pagination'],
        };
      } else {
        throw Exception(response.data['message'] ?? 'Failed to get history');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response!.data['message'] ?? 'Failed to get history');
      }
      throw Exception('Network error: ${e.message}');
    }
  }
}
