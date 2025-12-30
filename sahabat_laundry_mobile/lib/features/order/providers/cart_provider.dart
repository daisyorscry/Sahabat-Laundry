import 'package:flutter/foundation.dart';
import '../../catalog/models/service_model.dart';

// Selection data with service snapshot for persistence
class ServiceSelection {
  final double amount; // quantity for piece, weight for weight-based
  final List<String> addonIds;

  // Store addon prices for total calculation (addonId -> price)
  final Map<String, double> addonPrices;

  // Store service snapshot so cart doesn't depend on services list
  final String serviceName;
  final double servicePrice;
  final String pricingModel;

  ServiceSelection({
    required this.amount,
    this.addonIds = const [],
    this.addonPrices = const {},
    required this.serviceName,
    required this.servicePrice,
    required this.pricingModel,
  });

  ServiceSelection copyWith({
    double? amount,
    List<String>? addonIds,
    Map<String, double>? addonPrices,
    String? serviceName,
    double? servicePrice,
    String? pricingModel,
  }) {
    return ServiceSelection(
      amount: amount ?? this.amount,
      addonIds: addonIds ?? this.addonIds,
      addonPrices: addonPrices ?? this.addonPrices,
      serviceName: serviceName ?? this.serviceName,
      servicePrice: servicePrice ?? this.servicePrice,
      pricingModel: pricingModel ?? this.pricingModel,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      'addonIds': addonIds,
      'addonPrices': addonPrices,
      'serviceName': serviceName,
      'servicePrice': servicePrice,
      'pricingModel': pricingModel,
    };
  }

  factory ServiceSelection.fromJson(Map<String, dynamic> json) {
    return ServiceSelection(
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      addonIds: (json['addonIds'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      addonPrices: (json['addonPrices'] as Map<String, dynamic>?)
              ?.map((key, value) => MapEntry(key, (value as num).toDouble())) ??
          {},
      serviceName: json['serviceName'] ?? '',
      servicePrice: (json['servicePrice'] as num?)?.toDouble() ?? 0.0,
      pricingModel: json['pricingModel'] ?? 'piece',
    );
  }
}

class CartProvider with ChangeNotifier {
  // Match React Native: selections = { [serviceId]: { amount, addonIds } }
  final Map<String, ServiceSelection> _selections = {};

  // Cache total to avoid recalculation spam
  double? _cachedTotal;
  int _lastSelectionCount = 0;

  // Getters
  Map<String, ServiceSelection> get selections => Map.unmodifiable(_selections);

  int get selectedCount => _selections.length;

  bool get isEmpty => _selections.isEmpty;

  bool get isNotEmpty => _selections.isNotEmpty;

  // Check if a service is selected
  bool isSelected(String serviceId) {
    return _selections.containsKey(serviceId);
  }

  // Get selection for a specific service
  ServiceSelection? getSelection(String serviceId) {
    return _selections[serviceId];
  }

  // Get amount for a specific service
  double getAmount(String serviceId) {
    return _selections[serviceId]?.amount ?? 0;
  }

  // Get addon IDs for a specific service
  List<String> getAddonIds(String serviceId) {
    return _selections[serviceId]?.addonIds ?? [];
  }

  // Set/Update selection for a service (with service data snapshot)
  void setSelection(
    String serviceId, {
    required double amount,
    List<String>? addonIds,
    Map<String, double>? addonPrices,
    required ServiceModel service,
  }) {
    if (amount <= 0) {
      clearSelection(serviceId);
      return;
    }

    final price = service.servicePrice?.unitPrice ?? service.basePrice ?? 0;

    _selections[serviceId] = ServiceSelection(
      amount: amount,
      addonIds: addonIds ?? _selections[serviceId]?.addonIds ?? [],
      addonPrices: addonPrices ?? _selections[serviceId]?.addonPrices ?? {},
      serviceName: service.name,
      servicePrice: price,
      pricingModel: service.pricingModel,
    );
    _cachedTotal = null; // Invalidate cache
    notifyListeners();
    debugPrint('✅ Cart updated: ${service.name} -> amount: $amount, price: $price, addons: ${addonPrices?.length ?? 0}');
  }

  // Update only amount
  void updateAmount(String serviceId, double amount) {
    if (amount <= 0) {
      clearSelection(serviceId);
      return;
    }

    if (_selections.containsKey(serviceId)) {
      _selections[serviceId] = _selections[serviceId]!.copyWith(amount: amount);
      _cachedTotal = null; // Invalidate cache
      notifyListeners();
    }
  }

  // Update only addons
  void updateAddons(String serviceId, List<String> addonIds, {Map<String, double>? addonPrices}) {
    if (_selections.containsKey(serviceId)) {
      _selections[serviceId] = _selections[serviceId]!.copyWith(
        addonIds: addonIds,
        addonPrices: addonPrices,
      );
      _cachedTotal = null; // Invalidate cache
      notifyListeners();
    }
  }

  // Clear selection for a specific service
  void clearSelection(String serviceId) {
    if (_selections.remove(serviceId) != null) {
      _cachedTotal = null; // Invalidate cache
      notifyListeners();
      debugPrint('🗑️ Removed from cart: $serviceId');
    }
  }

  // Clear all selections
  void clearAllSelections() {
    _selections.clear();
    _cachedTotal = null; // Invalidate cache
    notifyListeners();
    debugPrint('🗑️ Cart cleared');
  }

  // Calculate total price from stored snapshots (no need for services list!)
  double calculateTotal() {
    // Use cached value if cart hasn't changed
    if (_cachedTotal != null && _lastSelectionCount == _selections.length) {
      return _cachedTotal!;
    }

    // Early return for empty cart - avoid unnecessary loops
    if (_selections.isEmpty) {
      _cachedTotal = 0.0;
      _lastSelectionCount = 0;
      return 0.0;
    }

    double total = 0.0;

    for (final selection in _selections.values) {
      // Use stored snapshot data - bulletproof persistence!
      final serviceTotal = selection.servicePrice * selection.amount;
      total += serviceTotal;

      // Add addon prices
      for (final addonPrice in selection.addonPrices.values) {
        final addonTotal = addonPrice * selection.amount;
        total += addonTotal;
      }
    }

    // Cache the result
    _cachedTotal = total;
    _lastSelectionCount = _selections.length;

    return total;
  }

  // Get total items count (for display)
  int get totalItems {
    return _selections.values.fold(
      0,
      (sum, selection) => sum + selection.amount.toInt(),
    );
  }

  // Get cart data for checkout (matches React Native format)
  Map<String, Map<String, dynamic>> getCartForCheckout() {
    return _selections.map((serviceId, selection) {
      return MapEntry(serviceId, {
        'quantity': selection.amount,
        'addonIds': selection.addonIds,
        'addonPrices': selection.addonPrices,
      });
    });
  }

  // Debug: Print cart contents
  void printCart() {
    debugPrint('=== CART SELECTIONS ===');
    debugPrint('Selected Count: $selectedCount');
    for (final entry in _selections.entries) {
      debugPrint(
        '- ${entry.key}: amount=${entry.value.amount}, addons=${entry.value.addonIds.length}',
      );
    }
    debugPrint('====================');
  }
}
