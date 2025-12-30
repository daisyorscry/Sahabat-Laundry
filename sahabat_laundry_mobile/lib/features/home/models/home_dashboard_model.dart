class HomeDashboardModel {
  final UserSummary user;
  final CustomerStatistics statistics;
  final List<ActiveOrder> activeOrders;
  final List<RecentOrder> recentOrders;
  final List<PopularService> popularServices;

  HomeDashboardModel({
    required this.user,
    required this.statistics,
    required this.activeOrders,
    required this.recentOrders,
    required this.popularServices,
  });

  factory HomeDashboardModel.fromJson(Map<String, dynamic> json) {
    return HomeDashboardModel(
      user: UserSummary.fromJson(json['user']),
      statistics: CustomerStatistics.fromJson(json['statistics']),
      activeOrders: (json['active_orders'] as List)
          .map((e) => ActiveOrder.fromJson(e))
          .toList(),
      recentOrders: (json['recent_orders'] as List)
          .map((e) => RecentOrder.fromJson(e))
          .toList(),
      popularServices: (json['popular_services'] as List)
          .map((e) => PopularService.fromJson(e))
          .toList(),
    );
  }
}

class UserSummary {
  final String id;
  final String fullName;
  final String? email;
  final String? phoneNumber;
  final double balance;
  final MemberTier? memberTier;
  final String? defaultOutletId;

  UserSummary({
    required this.id,
    required this.fullName,
    this.email,
    this.phoneNumber,
    required this.balance,
    this.memberTier,
    this.defaultOutletId,
  });

  factory UserSummary.fromJson(Map<String, dynamic> json) {
    return UserSummary(
      id: json['id'],
      fullName: json['full_name'],
      email: json['email'],
      phoneNumber: json['phone_number'],
      balance: (json['balance'] as num).toDouble(),
      memberTier: json['member_tier'] != null
          ? MemberTier.fromJson(json['member_tier'])
          : null,
      defaultOutletId: json['default_outlet_id'],
    );
  }
}

class MemberTier {
  final int id;
  final String code;
  final String name;

  MemberTier({
    required this.id,
    required this.code,
    required this.name,
  });

  factory MemberTier.fromJson(Map<String, dynamic> json) {
    return MemberTier(
      id: json['id'],
      code: json['code'],
      name: json['name'],
    );
  }
}

class CustomerStatistics {
  final int totalOrders;
  final int ordersThisMonth;
  final double totalSpending;
  final double spendingThisMonth;
  final double averageOrderValue;
  final int activeOrdersCount;
  final int completedOrdersCount;

  CustomerStatistics({
    required this.totalOrders,
    required this.ordersThisMonth,
    required this.totalSpending,
    required this.spendingThisMonth,
    required this.averageOrderValue,
    required this.activeOrdersCount,
    required this.completedOrdersCount,
  });

  factory CustomerStatistics.fromJson(Map<String, dynamic> json) {
    return CustomerStatistics(
      totalOrders: json['total_orders'] ?? 0,
      ordersThisMonth: json['orders_this_month'] ?? 0,
      totalSpending: (json['total_spending'] as num?)?.toDouble() ?? 0,
      spendingThisMonth: (json['spending_this_month'] as num?)?.toDouble() ?? 0,
      averageOrderValue:
          (json['average_order_value'] as num?)?.toDouble() ?? 0,
      activeOrdersCount: json['active_orders_count'] ?? 0,
      completedOrdersCount: json['completed_orders_count'] ?? 0,
    );
  }
}

class ActiveOrder {
  final String id;
  final String orderNo;
  final String status;
  final String? statusDescription;
  final String? statusColor;
  final String? outletName;
  final String? promisedAt;
  final double total;
  final List<OrderItemSummary> itemsSummary;
  final String createdAt;

  ActiveOrder({
    required this.id,
    required this.orderNo,
    required this.status,
    this.statusDescription,
    this.statusColor,
    this.outletName,
    this.promisedAt,
    required this.total,
    required this.itemsSummary,
    required this.createdAt,
  });

  factory ActiveOrder.fromJson(Map<String, dynamic> json) {
    return ActiveOrder(
      id: json['id'],
      orderNo: json['order_no'],
      status: json['status'],
      statusDescription: json['status_description'],
      statusColor: json['status_color'],
      outletName: json['outlet_name'],
      promisedAt: json['promised_at'],
      total: (json['total'] as num).toDouble(),
      itemsSummary: (json['items_summary'] as List)
          .map((e) => OrderItemSummary.fromJson(e))
          .toList(),
      createdAt: json['created_at'],
    );
  }
}

class OrderItemSummary {
  final String? serviceName;
  final dynamic qty;
  final String unit;

  OrderItemSummary({
    this.serviceName,
    required this.qty,
    required this.unit,
  });

  factory OrderItemSummary.fromJson(Map<String, dynamic> json) {
    return OrderItemSummary(
      serviceName: json['service_name'],
      qty: json['qty'],
      unit: json['unit'],
    );
  }

  String get display {
    if (qty is int) {
      return '$qty $unit';
    } else if (qty is double) {
      return '${qty.toStringAsFixed(1)} $unit';
    }
    return '$qty $unit';
  }
}

class RecentOrder {
  final String id;
  final String orderNo;
  final String? outletName;
  final double total;
  final int itemsCount;
  final String itemsSummary;
  final String createdAt;
  final bool canReorder;

  RecentOrder({
    required this.id,
    required this.orderNo,
    this.outletName,
    required this.total,
    required this.itemsCount,
    required this.itemsSummary,
    required this.createdAt,
    required this.canReorder,
  });

  factory RecentOrder.fromJson(Map<String, dynamic> json) {
    return RecentOrder(
      id: json['id'],
      orderNo: json['order_no'],
      outletName: json['outlet_name'],
      total: (json['total'] as num).toDouble(),
      itemsCount: json['items_count'] ?? 0,
      itemsSummary: json['items_summary'] ?? '',
      createdAt: json['created_at'],
      canReorder: json['can_reorder'] ?? false,
    );
  }
}

class PopularService {
  final String id;
  final String code;
  final String name;
  final String? description;
  final double basePrice;
  final double unitPrice;
  final bool hasDiscount;
  final int discountPercentage;
  final String? iconPath;
  final int orderCount;

  PopularService({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    required this.basePrice,
    required this.unitPrice,
    required this.hasDiscount,
    required this.discountPercentage,
    this.iconPath,
    required this.orderCount,
  });

  factory PopularService.fromJson(Map<String, dynamic> json) {
    return PopularService(
      id: json['id'],
      code: json['code'],
      name: json['name'],
      description: json['description'],
      basePrice: (json['base_price'] as num).toDouble(),
      unitPrice: (json['unit_price'] as num).toDouble(),
      hasDiscount: json['has_discount'] ?? false,
      discountPercentage: json['discount_percentage'] ?? 0,
      iconPath: json['icon_path'],
      orderCount: json['order_count'] ?? 0,
    );
  }
}
