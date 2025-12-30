class ServiceModel {
  final String id;
  final String code;
  final String name;
  final String? description;
  final String pricingModel; // "weight" or "piece"
  final bool isExpressAvailable;
  final String? iconPath;
  final String? iconUrl;
  final String categoryId;
  final ServiceCategory? category;
  final int? minQty;
  final int? estDurationHours;
  final double? basePrice;
  final ServicePrice? servicePrice;

  ServiceModel({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    required this.pricingModel,
    required this.isExpressAvailable,
    this.iconPath,
    this.iconUrl,
    required this.categoryId,
    this.category,
    this.minQty,
    this.estDurationHours,
    this.basePrice,
    this.servicePrice,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      pricingModel: json['pricing_model'] ?? 'piece',
      isExpressAvailable: json['is_express_available'] ?? false,
      iconPath: json['icon_path'],
      iconUrl: json['icon_url'],
      categoryId: json['category_id'] ?? '',
      category: json['category'] != null
          ? ServiceCategory.fromJson(json['category'])
          : null,
      minQty: json['min_qty'] != null
          ? (json['min_qty'] is num
              ? (json['min_qty'] as num).toInt()
              : int.tryParse(json['min_qty'].toString()))
          : null,
      estDurationHours: json['est_duration_hours'] != null
          ? (json['est_duration_hours'] is num
              ? (json['est_duration_hours'] as num).toInt()
              : int.tryParse(json['est_duration_hours'].toString()))
          : null,
      basePrice: json['base_price'] != null
          ? (json['base_price'] is num
              ? (json['base_price'] as num).toDouble()
              : double.tryParse(json['base_price'].toString()))
          : null,
      servicePrice: json['service_price'] != null
          ? ServicePrice.fromJson(json['service_price'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
      'description': description,
      'pricing_model': pricingModel,
      'is_express_available': isExpressAvailable,
      'icon_path': iconPath,
      'icon_url': iconUrl,
      'category_id': categoryId,
      'category': category?.toJson(),
      'min_qty': minQty,
      'est_duration_hours': estDurationHours,
      'base_price': basePrice,
      'service_price': servicePrice?.toJson(),
    };
  }
}

class ServiceCategory {
  final String id;
  final String code;
  final String name;

  ServiceCategory({
    required this.id,
    required this.code,
    required this.name,
  });

  factory ServiceCategory.fromJson(Map<String, dynamic> json) {
    return ServiceCategory(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
    };
  }
}

class ServicePrice {
  final String id;
  final String outletId;
  final String? memberTier;
  final double unitPrice;
  final bool isExpress;
  final String? effectiveStart;
  final String? effectiveEnd;

  ServicePrice({
    required this.id,
    required this.outletId,
    this.memberTier,
    required this.unitPrice,
    required this.isExpress,
    this.effectiveStart,
    this.effectiveEnd,
  });

  factory ServicePrice.fromJson(Map<String, dynamic> json) {
    return ServicePrice(
      id: json['id'] ?? '',
      outletId: json['outlet_id'] ?? '',
      memberTier: json['member_tier'],
      unitPrice: json['unit_price'] != null
          ? (json['unit_price'] is num
              ? (json['unit_price'] as num).toDouble()
              : double.tryParse(json['unit_price'].toString()) ?? 0.0)
          : 0.0,
      isExpress: json['is_express'] ?? false,
      effectiveStart: json['effective_start'],
      effectiveEnd: json['effective_end'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'outlet_id': outletId,
      'member_tier': memberTier,
      'unit_price': unitPrice,
      'is_express': isExpress,
      'effective_start': effectiveStart,
      'effective_end': effectiveEnd,
    };
  }
}

class AddonModel {
  final String id;
  final String code;
  final String name;
  final double price;
  final bool isRequired;

  AddonModel({
    required this.id,
    required this.code,
    required this.name,
    required this.price,
    required this.isRequired,
  });

  factory AddonModel.fromJson(Map<String, dynamic> json) {
    return AddonModel(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      price: json['price'] != null
          ? (json['price'] is num
              ? (json['price'] as num).toDouble()
              : double.tryParse(json['price'].toString()) ?? 0.0)
          : 0.0,
      isRequired: json['is_required'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
      'price': price,
      'is_required': isRequired,
    };
  }
}
