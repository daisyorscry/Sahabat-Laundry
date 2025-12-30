import '../../catalog/models/service_model.dart';

class CartItem {
  final String serviceId;
  final String serviceName;
  final String pricingModel;
  final double basePrice;
  final double actualPrice; // Price after discount/member tier
  final int quantity;
  final List<AddonModel> addons;
  final String? iconPath;
  final String categoryId;

  CartItem({
    required this.serviceId,
    required this.serviceName,
    required this.pricingModel,
    required this.basePrice,
    required this.actualPrice,
    required this.quantity,
    required this.addons,
    this.iconPath,
    required this.categoryId,
  });

  // Calculate total price for this cart item (service price + addons)
  double get totalPrice {
    double serviceTotal = actualPrice * quantity;
    double addonsTotal = addons.fold(0, (sum, addon) => sum + addon.price);
    return serviceTotal + (addonsTotal * quantity);
  }

  // Create CartItem from ServiceModel
  factory CartItem.fromService({
    required ServiceModel service,
    required int quantity,
    List<AddonModel>? addons,
  }) {
    final basePrice = service.basePrice ?? 0;
    final actualPrice = service.servicePrice?.unitPrice ?? basePrice;

    return CartItem(
      serviceId: service.id,
      serviceName: service.name,
      pricingModel: service.pricingModel,
      basePrice: basePrice,
      actualPrice: actualPrice,
      quantity: quantity,
      addons: addons ?? [],
      iconPath: service.iconPath ?? service.iconUrl,
      categoryId: service.categoryId,
    );
  }

  // Copy with method for updating quantity or addons
  CartItem copyWith({
    int? quantity,
    List<AddonModel>? addons,
  }) {
    return CartItem(
      serviceId: serviceId,
      serviceName: serviceName,
      pricingModel: pricingModel,
      basePrice: basePrice,
      actualPrice: actualPrice,
      quantity: quantity ?? this.quantity,
      addons: addons ?? this.addons,
      iconPath: iconPath,
      categoryId: categoryId,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'service_id': serviceId,
      'service_name': serviceName,
      'pricing_model': pricingModel,
      'base_price': basePrice,
      'actual_price': actualPrice,
      'quantity': quantity,
      'addons': addons.map((addon) => addon.toJson()).toList(),
      'icon_path': iconPath,
      'category_id': categoryId,
    };
  }

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      serviceId: json['service_id'] ?? '',
      serviceName: json['service_name'] ?? '',
      pricingModel: json['pricing_model'] ?? 'piece',
      basePrice: (json['base_price'] as num?)?.toDouble() ?? 0.0,
      actualPrice: (json['actual_price'] as num?)?.toDouble() ?? 0.0,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      addons: (json['addons'] as List<dynamic>?)
              ?.map((addon) => AddonModel.fromJson(addon))
              .toList() ??
          [],
      iconPath: json['icon_path'],
      categoryId: json['category_id'] ?? '',
    );
  }
}
