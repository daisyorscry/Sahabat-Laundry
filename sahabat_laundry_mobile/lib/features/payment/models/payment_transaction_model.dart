class PaymentTransactionModel {
  final String id;
  final String orderId;
  final String paymentOrderId;
  final double grossAmount;
  final String status;
  final String? paymentMethod;
  final String? paymentType;
  final String? transactionId;
  final String? fraudStatus;
  final String? snapToken;
  final String? snapRedirectUrl;
  final String? vaNumber;
  final String? billerCode;
  final String? billKey;
  final DateTime? expiryTime;
  final DateTime? settlementTime;
  final DateTime? transactionTime;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<PaymentStatusLog>? statusLogs;

  PaymentTransactionModel({
    required this.id,
    required this.orderId,
    required this.paymentOrderId,
    required this.grossAmount,
    required this.status,
    this.paymentMethod,
    this.paymentType,
    this.transactionId,
    this.fraudStatus,
    this.snapToken,
    this.snapRedirectUrl,
    this.vaNumber,
    this.billerCode,
    this.billKey,
    this.expiryTime,
    this.settlementTime,
    this.transactionTime,
    required this.createdAt,
    required this.updatedAt,
    this.statusLogs,
  });

  factory PaymentTransactionModel.fromJson(Map<String, dynamic> json) {
    return PaymentTransactionModel(
      id: json['id'] ?? '',
      orderId: json['order_id'] ?? '',
      paymentOrderId: json['payment_order_id'] ?? '',
      grossAmount: _toDouble(json['gross_amount']),
      status: json['status'] ?? 'PENDING',
      paymentMethod: json['payment_method'],
      paymentType: json['payment_type'],
      transactionId: json['transaction_id'],
      fraudStatus: json['fraud_status'],
      snapToken: json['snap_token'],
      snapRedirectUrl: json['snap_redirect_url'],
      vaNumber: json['va_number'],
      billerCode: json['biller_code'],
      billKey: json['bill_key'],
      expiryTime: _parseDateTime(json['expiry_time']),
      settlementTime: _parseDateTime(json['settlement_time']),
      transactionTime: _parseDateTime(json['transaction_time']),
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      statusLogs: json['status_logs'] != null
          ? (json['status_logs'] as List)
              .map((e) => PaymentStatusLog.fromJson(e))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_id': orderId,
      'payment_order_id': paymentOrderId,
      'gross_amount': grossAmount,
      'status': status,
      'payment_method': paymentMethod,
      'payment_type': paymentType,
      'transaction_id': transactionId,
      'fraud_status': fraudStatus,
      'snap_token': snapToken,
      'snap_redirect_url': snapRedirectUrl,
      'va_number': vaNumber,
      'biller_code': billerCode,
      'bill_key': billKey,
      'expiry_time': expiryTime?.toIso8601String(),
      'settlement_time': settlementTime?.toIso8601String(),
      'transaction_time': transactionTime?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v) ?? 0;
    return 0;
  }

  static DateTime? _parseDateTime(dynamic v) {
    if (v == null) return null;
    if (v is String && v.isNotEmpty) {
      try {
        return DateTime.parse(v);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  // Helper methods
  bool get isPending => status == 'PENDING';
  bool get isSuccess => status == 'SUCCESS';
  bool get isFailed => status == 'FAILED';
  bool get isExpired => status == 'EXPIRED';
  bool get isCanceled => status == 'CANCELED';

  String get statusLabel {
    switch (status) {
      case 'PENDING':
        return 'Menunggu Pembayaran';
      case 'SUCCESS':
        return 'Pembayaran Berhasil';
      case 'FAILED':
        return 'Pembayaran Gagal';
      case 'EXPIRED':
        return 'Pembayaran Kadaluarsa';
      case 'CANCELED':
        return 'Pembayaran Dibatalkan';
      default:
        return status;
    }
  }

  String get paymentMethodLabel {
    if (paymentMethod == null) return 'Belum dipilih';
    switch (paymentMethod) {
      case 'gopay':
        return 'GoPay';
      case 'bank_transfer':
        return 'Transfer Bank';
      case 'shopeepay':
        return 'ShopeePay';
      case 'credit_card':
        return 'Kartu Kredit';
      case 'cstore':
        return 'Gerai Retail';
      case 'qris':
        return 'QRIS';
      default:
        return paymentMethod!;
    }
  }
}

class PaymentStatusLog {
  final String id;
  final String paymentTransactionId;
  final String? previousStatus;
  final String newStatus;
  final String? fraudStatus;
  final String? statusMessage;
  final String source;
  final DateTime createdAt;

  PaymentStatusLog({
    required this.id,
    required this.paymentTransactionId,
    this.previousStatus,
    required this.newStatus,
    this.fraudStatus,
    this.statusMessage,
    required this.source,
    required this.createdAt,
  });

  factory PaymentStatusLog.fromJson(Map<String, dynamic> json) {
    return PaymentStatusLog(
      id: json['id'] ?? '',
      paymentTransactionId: json['payment_transaction_id'] ?? '',
      previousStatus: json['previous_status'],
      newStatus: json['new_status'] ?? '',
      fraudStatus: json['fraud_status'],
      statusMessage: json['status_message'],
      source: json['source'] ?? '',
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class CreateSnapTokenRequest {
  final String orderId;
  final String paymentOrderId;
  final double grossAmount;
  final List<PaymentItem> items;
  final CustomerDetail? customerDetail;
  final List<String> enabledPayments;
  final int expiryMinutes;

  CreateSnapTokenRequest({
    required this.orderId,
    required this.paymentOrderId,
    required this.grossAmount,
    required this.items,
    this.customerDetail,
    this.enabledPayments = const [],
    this.expiryMinutes = 60,
  });

  Map<String, dynamic> toJson() {
    return {
      'order_id': orderId,
      'payment_order_id': paymentOrderId,
      'gross_amount': grossAmount,
      'items': items.map((e) => e.toJson()).toList(),
      'customer_detail': customerDetail?.toJson(),
      'enabled_payments': enabledPayments,
      'expiry_minutes': expiryMinutes,
    };
  }
}

class PaymentItem {
  final String id;
  final String name;
  final double price;
  final int qty;

  PaymentItem({
    required this.id,
    required this.name,
    required this.price,
    required this.qty,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'qty': qty,
    };
  }
}

class CustomerDetail {
  final String firstName;
  final String lastName;
  final String email;
  final String phone;

  CustomerDetail({
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
  });

  Map<String, dynamic> toJson() {
    return {
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': phone,
    };
  }
}

class CreateSnapTokenResponse {
  final String paymentTransactionId;
  final String token;
  final String redirectUrl;
  final String clientKey;
  final DateTime? expiryTime;

  CreateSnapTokenResponse({
    required this.paymentTransactionId,
    required this.token,
    required this.redirectUrl,
    required this.clientKey,
    this.expiryTime,
  });

  factory CreateSnapTokenResponse.fromJson(Map<String, dynamic> json) {
    return CreateSnapTokenResponse(
      paymentTransactionId: json['payment_transaction_id'] ?? '',
      token: json['token'] ?? '',
      redirectUrl: json['redirect_url'] ?? '',
      clientKey: json['client_key'] ?? '',
      expiryTime: json['expiry_time'] != null
          ? DateTime.parse(json['expiry_time'])
          : null,
    );
  }
}
