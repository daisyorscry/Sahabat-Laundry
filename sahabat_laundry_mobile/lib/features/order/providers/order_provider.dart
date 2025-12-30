import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:dio/dio.dart';
import '../../../core/network/order_service_client.dart';
import '../models/order_model.dart';

class OrderProvider with ChangeNotifier {
  final _orderServiceClient = OrderServiceClient();

  List<OrderModel> _orders = [];
  bool _isLoading = false;
  String? _error;

  List<OrderModel> get orders => _orders;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Fetch all orders
  Future<void> fetchOrders() async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _orderServiceClient.dio.get('/orders');

      if (response.statusCode == 200) {
        final responseData = response.data['data'];

        // Handle different response structures
        List<dynamic> ordersList;
        if (responseData is List) {
          // Direct list
          ordersList = responseData;
        } else if (responseData is Map) {
          // Nested in 'data' key (pagination) or 'orders' key
          ordersList =
              (responseData['data'] ?? responseData['orders'] ?? []) as List;
        } else {
          ordersList = [];
        }

        _orders = ordersList.map((json) => OrderModel.fromJson(json)).toList();
      }

      _setLoading(false);
    } on DioException catch (e) {
      _setLoading(false);
      final errorMessage = e.response?.data['message'] ?? 'Gagal memuat orders';
      _setError(errorMessage);
    } catch (e) {
      _setLoading(false);
      debugPrint('Error parsing orders: $e');
      _setError('Gagal memuat orders: ${e.toString()}');
    }
  }

  // Get order detail
  Future<OrderModel?> getOrderDetail(String orderId) async {
    try {
      final response = await _orderServiceClient.dio.get('/orders/$orderId');

      if (response.statusCode == 200) {
        final raw = response.data['data'];
        Map<String, dynamic>? map;
        if (raw is Map<String, dynamic>) {
          map = raw;
        } else if (raw is String) {
          try {
            final decoded = jsonDecode(raw);
            if (decoded is Map<String, dynamic>) {
              map = decoded;
            } else if (decoded is List &&
                decoded.isNotEmpty &&
                decoded.first is Map) {
              map = (decoded.first as Map).cast<String, dynamic>();
            }
          } catch (_) {}
        } else if (raw is List && raw.isNotEmpty && raw.first is Map) {
          map = (raw.first as Map).cast<String, dynamic>();
        }
        if (map != null) return OrderModel.fromJson(map);
        return null;
      }
      return null;
    } on DioException catch (e) {
      debugPrint('Error fetching order detail: $e');
      return null;
    }
  }

  // Create order
  Future<OrderModel?> createOrder({
    required String outletId,
    required String orderType,
    required List<OrderItemRequest> items,
    String? requestedPickupAt,
    String? pickupAddress,
    String? deliveryAddress,
    String? memberTier,
    String? notes,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _orderServiceClient.dio.post(
        '/orders',
        data: {
          'outlet_id': outletId,
          'order_type': orderType,
          if (requestedPickupAt != null)
            'requested_pickup_at': requestedPickupAt,
          if (pickupAddress != null) 'pickup_address': pickupAddress,
          if (deliveryAddress != null) 'delivery_address': deliveryAddress,
          if (memberTier != null) 'member_tier': memberTier,
          if (notes != null) 'notes': notes,
          'items': items.map((item) => item.toJson()).toList(),
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final order = OrderModel.fromJson(response.data['data']);
        _orders.insert(0, order);
        _setLoading(false);
        notifyListeners();
        return order;
      }

      _setLoading(false);
      return null;
    } on DioException catch (e) {
      _setLoading(false);
      final errorMessage = e.response?.data['message'] ?? 'Gagal membuat order';
      _setError(errorMessage);
      return null;
    }
  }

  // Cancel order
  Future<bool> cancelOrder(String orderId) async {
    try {
      final response = await _orderServiceClient.dio.post(
        '/orders/$orderId/cancel',
      );

      if (response.statusCode == 200) {
        // Refresh orders list
        await fetchOrders();
        return true;
      }
      return false;
    } on DioException catch (e) {
      debugPrint('Error canceling order: $e');
      final errorMessage =
          e.response?.data['message'] ?? 'Gagal membatalkan order';
      _setError(errorMessage);
      return false;
    }
  }

  // Get order timeline
  Future<List<OrderTimeline>> getOrderTimeline(String orderId) async {
    try {
      final response = await _orderServiceClient.dio.get(
        '/orders/$orderId/timeline',
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        if (data is List) {
          return data.map((item) => OrderTimeline.fromJson(item)).toList();
        }
      }
      return [];
    } on DioException catch (e) {
      debugPrint('Error fetching order timeline: $e');
      return [];
    }
  }

  // Calculate quote
  Future<QuoteResult?> calculateQuote(QuotePayload payload) async {
    try {
      final response = await _orderServiceClient.dio.post(
        '/quote',
        data: payload.toJson(),
      );

      if (response.statusCode == 200) {
        return QuoteResult.fromJson(response.data['data']);
      }
      return null;
    } on DioException catch (e) {
      debugPrint('Error calculating quote: $e');
      final errorMessage =
          e.response?.data['message'] ?? 'Gagal menghitung quote';
      _setError(errorMessage);
      return null;
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String? value) {
    _error = value;
    notifyListeners();
  }
}

// Helper class for order item request
class OrderItemRequest {
  final String serviceId;
  final int? qty;
  final double? weightKg;
  final bool? isExpress;
  final List<AddonRequest>? addons;

  OrderItemRequest({
    required this.serviceId,
    this.qty,
    this.weightKg,
    this.isExpress,
    this.addons,
  });

  Map<String, dynamic> toJson() {
    return {
      'service_id': serviceId,
      if (qty != null) 'qty': qty,
      if (weightKg != null) 'weight_kg': weightKg,
      if (isExpress != null) 'is_express': isExpress,
      if (addons != null) 'addons': addons!.map((a) => a.toJson()).toList(),
    };
  }
}

class AddonRequest {
  final String addonId;
  final int qty;

  AddonRequest({required this.addonId, required this.qty});

  Map<String, dynamic> toJson() {
    return {'addon_id': addonId, 'qty': qty};
  }
}

// Order Timeline Model
class OrderTimeline {
  final String statusCode;
  final String statusName;
  final String changedAt;
  final String? changedBy;
  final String? notes;

  OrderTimeline({
    required this.statusCode,
    required this.statusName,
    required this.changedAt,
    this.changedBy,
    this.notes,
  });

  factory OrderTimeline.fromJson(Map<String, dynamic> json) {
    return OrderTimeline(
      statusCode: json['status_code'] ?? json['to_status'] ?? '',
      statusName: json['status_name'] ?? '',
      changedAt: json['changed_at'] ?? json['created_at'] ?? '',
      changedBy: json['changed_by'],
      notes: json['notes'] ?? json['note'],
    );
  }
}

// Quote Models
class QuotePayload {
  final String outletId;
  final String? memberTier;
  final String? date;
  final List<QuoteItem> items;

  QuotePayload({
    required this.outletId,
    this.memberTier,
    this.date,
    required this.items,
  });

  Map<String, dynamic> toJson() {
    return {
      'outlet_id': outletId,
      if (memberTier != null) 'member_tier': memberTier,
      if (date != null) 'date': date,
      'items': items.map((item) => item.toJson()).toList(),
    };
  }
}

class QuoteItem {
  final String serviceId;
  final int? qty;
  final double? weightKg;
  final bool? isExpress;
  final List<AddonRequest>? addons;

  QuoteItem({
    required this.serviceId,
    this.qty,
    this.weightKg,
    this.isExpress,
    this.addons,
  });

  Map<String, dynamic> toJson() {
    return {
      'service_id': serviceId,
      if (qty != null) 'qty': qty,
      if (weightKg != null) 'weight_kg': weightKg,
      if (isExpress != null) 'is_express': isExpress,
      if (addons != null) 'addons': addons!.map((a) => a.toJson()).toList(),
    };
  }
}

class QuoteResult {
  final QuoteMeta meta;
  final List<QuoteResultItem> items;
  final double subtotal;
  final double grandTotal;

  QuoteResult({
    required this.meta,
    required this.items,
    required this.subtotal,
    required this.grandTotal,
  });

  factory QuoteResult.fromJson(Map<String, dynamic> json) {
    return QuoteResult(
      meta: QuoteMeta.fromJson(json['meta'] ?? {}),
      items:
          (json['items'] as List?)
              ?.map((item) => QuoteResultItem.fromJson(item))
              .toList() ??
          [],
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      grandTotal: (json['grand_total'] ?? 0).toDouble(),
    );
  }
}

class QuoteMeta {
  final String outletId;
  final String? memberTier;
  final String date;
  final List<String> warnings;

  QuoteMeta({
    required this.outletId,
    this.memberTier,
    required this.date,
    required this.warnings,
  });

  factory QuoteMeta.fromJson(Map<String, dynamic> json) {
    return QuoteMeta(
      outletId: json['outlet_id'] ?? '',
      memberTier: json['member_tier'],
      date: json['date'] ?? '',
      warnings:
          (json['warnings'] as List?)?.map((e) => e.toString()).toList() ?? [],
    );
  }
}

class QuoteResultItem {
  final String serviceId;
  final String serviceCode;
  final String serviceName;
  final String pricingModel;
  final bool isExpress;
  final int? qty;
  final double? weightKg;
  final double unitPrice;
  final double baseTotal;
  final List<QuoteAddon> addons;
  final double addonsTotal;
  final double lineTotal;

  QuoteResultItem({
    required this.serviceId,
    required this.serviceCode,
    required this.serviceName,
    required this.pricingModel,
    required this.isExpress,
    this.qty,
    this.weightKg,
    required this.unitPrice,
    required this.baseTotal,
    required this.addons,
    required this.addonsTotal,
    required this.lineTotal,
  });

  factory QuoteResultItem.fromJson(Map<String, dynamic> json) {
    return QuoteResultItem(
      serviceId: json['service_id'] ?? '',
      serviceCode: json['service_code'] ?? '',
      serviceName: json['service_name'] ?? '',
      pricingModel: json['pricing_model'] ?? '',
      isExpress: json['is_express'] ?? false,
      qty: json['qty'],
      weightKg: json['weight_kg'] != null
          ? (json['weight_kg'] as num).toDouble()
          : null,
      unitPrice: (json['unit_price'] ?? 0).toDouble(),
      baseTotal: (json['base_total'] ?? 0).toDouble(),
      addons:
          (json['addons'] as List?)
              ?.map((addon) => QuoteAddon.fromJson(addon))
              .toList() ??
          [],
      addonsTotal: (json['addons_total'] ?? 0).toDouble(),
      lineTotal: (json['line_total'] ?? 0).toDouble(),
    );
  }
}

class QuoteAddon {
  final String addonId;
  final String addonCode;
  final String addonName;
  final int qty;
  final double unitPrice;
  final double lineTotal;

  QuoteAddon({
    required this.addonId,
    required this.addonCode,
    required this.addonName,
    required this.qty,
    required this.unitPrice,
    required this.lineTotal,
  });

  factory QuoteAddon.fromJson(Map<String, dynamic> json) {
    return QuoteAddon(
      addonId: json['addon_id'] ?? '',
      addonCode: json['addon_code'] ?? '',
      addonName: json['addon_name'] ?? '',
      qty: json['qty'] ?? 0,
      unitPrice: (json['unit_price'] ?? 0).toDouble(),
      lineTotal: (json['line_total'] ?? 0).toDouble(),
    );
  }
}
