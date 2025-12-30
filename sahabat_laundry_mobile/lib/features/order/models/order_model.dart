import 'dart:convert' as convert;

class OrderModel {
  final String id;
  final String orderNo;
  final String customerId;
  final String outletId;
  final String? outletName;
  final String statusCode;
  final String? statusName;
  final bool isExpress;
  final String? promisedAt;
  final String? pickupAddress;
  final String? deliveryAddress;
  final String? notes;
  final double subtotal;
  final double taxAmount;
  final double discountAmount;
  final double total;
  final List<OrderItem>? items;
  final String createdAt;
  final String updatedAt;

  OrderModel({
    required this.id,
    required this.orderNo,
    required this.customerId,
    required this.outletId,
    this.outletName,
    required this.statusCode,
    this.statusName,
    required this.isExpress,
    this.promisedAt,
    this.pickupAddress,
    this.deliveryAddress,
    this.notes,
    required this.subtotal,
    required this.taxAmount,
    required this.discountAmount,
    required this.total,
    this.items,
    required this.createdAt,
    required this.updatedAt,
  });

  static double _toDouble(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v) ?? 0;
    return 0;
  }

  static int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? '',
      orderNo: json['order_no'] ?? '',
      customerId: json['customer_id'] ?? '',
      outletId: json['outlet_id'] ?? '',
      outletName: json['outlet_name'],
      statusCode: json['status_code'] ?? '',
      statusName: json['status_name'],
      isExpress: json['is_express'] ?? false,
      promisedAt: json['promised_at'],
      pickupAddress: json['pickup_address'],
      deliveryAddress: json['delivery_address'],
      notes: json['notes'],
      subtotal: _toDouble(json['subtotal']),
      taxAmount: _toDouble(json['tax_amount']),
      discountAmount: _toDouble(json['discount_amount']),
      total: _toDouble(json['total']),
      items: (() {
        final raw = json['items'];
        if (raw == null) return null;
        if (raw is List) {
          return raw
              .whereType<Map<String, dynamic>>()
              .map((i) => OrderItem.fromJson(i))
              .toList();
        }
        if (raw is String) {
          try {
            final decoded = raw.isNotEmpty ? convert.jsonDecode(raw) : null;
            if (decoded is List) {
              return decoded
                  .whereType<Map<String, dynamic>>()
                  .map((i) => OrderItem.fromJson(i))
                  .toList();
            }
          } catch (_) {}
        }
        return null;
      })(),
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'] ?? '',
    );
  }
}

class OrderItem {
  final String id;
  final String serviceId;
  final String serviceCode;
  final String serviceName;
  final int qty;
  final double unitPrice;
  final double subtotal;
  final List<OrderItemAddon>? addons;

  OrderItem({
    required this.id,
    required this.serviceId,
    required this.serviceCode,
    required this.serviceName,
    required this.qty,
    required this.unitPrice,
    required this.subtotal,
    this.addons,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] ?? '',
      serviceId: json['service_id'] ?? '',
      serviceCode: json['service_code'] ?? '',
      serviceName: json['service_name'] ?? '',
      qty: OrderModel._toInt(json['qty']),
      unitPrice: OrderModel._toDouble(json['unit_price']),
      subtotal: OrderModel._toDouble(json['subtotal']),
      addons: (() {
        final raw = json['addons'];
        if (raw == null) return null;
        if (raw is List) {
          return raw
              .whereType<Map<String, dynamic>>()
              .map((a) => OrderItemAddon.fromJson(a))
              .toList();
        }
        if (raw is String) {
          try {
            final decoded = raw.isNotEmpty ? convert.jsonDecode(raw) : null;
            if (decoded is List) {
              return decoded
                  .whereType<Map<String, dynamic>>()
                  .map((a) => OrderItemAddon.fromJson(a))
                  .toList();
            }
          } catch (_) {}
        }
        return null;
      })(),
    );
  }
}

class OrderItemAddon {
  final String id;
  final String addonId;
  final String addonCode;
  final String addonName;
  final int qty;
  final double unitPrice;
  final double subtotal;

  OrderItemAddon({
    required this.id,
    required this.addonId,
    required this.addonCode,
    required this.addonName,
    required this.qty,
    required this.unitPrice,
    required this.subtotal,
  });

  factory OrderItemAddon.fromJson(Map<String, dynamic> json) {
    return OrderItemAddon(
      id: json['id'] ?? '',
      addonId: json['addon_id'] ?? '',
      addonCode: json['addon_code'] ?? '',
      addonName: json['addon_name'] ?? '',
      qty: OrderModel._toInt(json['qty']),
      unitPrice: OrderModel._toDouble(json['unit_price']),
      subtotal: OrderModel._toDouble(json['subtotal']),
    );
  }
}
