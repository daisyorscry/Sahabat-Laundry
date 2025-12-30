import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/service_model.dart';
import '../models/category_model.dart';
import '../models/outlet_model.dart';

class CatalogProvider with ChangeNotifier {
  final _dioClient = DioClient();

  List<ServiceModel> _services = [];
  List<CategoryModel> _categories = [];
  List<OutletModel> _outlets = [];
  bool _isLoading = false;
  String? _error;

  List<ServiceModel> get services => _services;
  List<CategoryModel> get categories => _categories;
  List<OutletModel> get outlets => _outlets;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Fetch all services with optional filters
  Future<void> fetchServices({
    String? q,
    String? categoryId,
    String? pricingModel,
    bool? isExpressAvailable,
    int? perPage,
    String? outletId,
    String? memberTier,
    bool? isExpress,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      final queryParams = <String, dynamic>{};
      if (q != null) queryParams['q'] = q;
      if (categoryId != null) queryParams['category_id'] = categoryId;
      if (pricingModel != null) queryParams['pricing_model'] = pricingModel;
      if (isExpressAvailable != null) {
        queryParams['is_express_available'] = isExpressAvailable;
      }
      if (perPage != null) queryParams['per_page'] = perPage;
      if (outletId != null) queryParams['outlet_id'] = outletId;
      if (memberTier != null) queryParams['member_tier'] = memberTier;
      if (isExpress != null) queryParams['is_express'] = isExpress;

      final response = await _dioClient.dio.get(
        ApiConstants.services,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        List<dynamic> servicesList;

        // Handle different response structures
        if (data is List) {
          servicesList = data;
        } else if (data is Map && data['items'] != null) {
          servicesList = data['items'] as List;
        } else {
          servicesList = [];
        }

        _services = servicesList
            .map((json) => ServiceModel.fromJson(json))
            .toList();
      }

      _setLoading(false);
    } on DioException catch (e) {
      _setLoading(false);
      final errorMessage =
          e.response?.data['message'] ?? 'Gagal memuat layanan';
      _setError(errorMessage);
    } catch (e) {
      _setLoading(false);
      debugPrint('Error fetching services: $e');
      _setError('Gagal memuat layanan');
    }
  }

  // Fetch service categories
  Future<void> fetchCategories() async {
    _setError(null);

    try {
      final response = await _dioClient.dio.get(ApiConstants.serviceCategories);

      if (response.statusCode == 200) {
        final data = response.data['data'];
        List<dynamic> categoriesList;

        if (data is List) {
          categoriesList = data;
        } else if (data is Map && data['items'] != null) {
          categoriesList = data['items'] as List;
        } else {
          categoriesList = [];
        }

        _categories = categoriesList
            .map((json) => CategoryModel.fromJson(json))
            .toList();
        notifyListeners();
      }
    } on DioException catch (e) {
      debugPrint('Error fetching categories: $e');
      final errorMessage =
          e.response?.data['message'] ?? 'Gagal memuat kategori';
      _setError(errorMessage);
    } catch (e) {
      debugPrint('Error fetching categories: $e');
      _setError('Gagal memuat kategori: ${e.toString()}');
    }
  }

  // Fetch outlets
  Future<void> fetchOutlets() async {
    _setError(null);

    try {
      final response = await _dioClient.dio.get(ApiConstants.outlets);

      if (response.statusCode == 200) {
        final data = response.data['data'];
        List<dynamic> outletsList;

        if (data is List) {
          outletsList = data;
        } else if (data is Map && data['items'] != null) {
          outletsList = data['items'] as List;
        } else {
          outletsList = [];
        }

        _outlets = outletsList
            .map((json) => OutletModel.fromJson(json))
            .where((o) => o.isActive)
            .toList();
        notifyListeners();
      }
    } on DioException catch (e) {
      debugPrint('Error fetching outlets: $e');
      final errorMessage = e.response?.data['message'] ?? 'Gagal memuat outlet';
      _setError(errorMessage);
    } catch (e) {
      debugPrint('Error fetching outlets: $e');
    }
  }

  // Fetch service detail (supports contextual pricing via query params)
  Future<ServiceModel?>  getServiceDetail(
    String serviceId, {
    String? outletId,
    String? memberTier,
    bool? isExpress,
  }) async {
    try {
      final response = await _dioClient.dio.get(
        '${ApiConstants.services}/$serviceId',
        queryParameters: {
          if (outletId != null) 'outlet_id': outletId,
          if (memberTier != null) 'member_tier': memberTier,
          if (isExpress != null) 'is_express': isExpress,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        return ServiceModel.fromJson(data);
      }
      return null;
    } on DioException catch (e) {
      debugPrint('Error fetching service detail: $e');
      return null;
    }
  }

  // Fetch service addons
  Future<List<AddonModel>> getServiceAddons(String serviceId) async {
    try {
      final response = await _dioClient.dio.get(
        '${ApiConstants.services}/$serviceId/addons',
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        List<dynamic> addonsList;

        if (data is List) {
          addonsList = data;
        } else if (data is Map && data['items'] != null) {
          addonsList = data['items'] as List;
        } else {
          addonsList = [];
        }

        return addonsList.map((json) => AddonModel.fromJson(json)).toList();
      }
      return [];
    } on DioException catch (e) {
      debugPrint('Error fetching service addons: $e');
      return [];
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

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
