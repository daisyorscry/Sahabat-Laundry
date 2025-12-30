import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/address_model.dart';

class AddressProvider with ChangeNotifier {
  final _dioClient = DioClient();

  List<AddressModel> _addresses = [];
  bool _isLoading = false;
  String? _error;
  String? _selectedAddressId;

  List<AddressModel> get addresses => _addresses;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get selectedAddressId => _selectedAddressId;

  // Get primary address
  AddressModel? get primaryAddress {
    try {
      return _addresses.firstWhere((addr) => addr.isPrimary);
    } catch (e) {
      return _addresses.isNotEmpty ? _addresses.first : null;
    }
  }

  // Get selected address or primary
  AddressModel? get selectedAddress {
    if (_selectedAddressId != null) {
      try {
        return _addresses.firstWhere((addr) => addr.id == _selectedAddressId);
      } catch (e) {
        return primaryAddress;
      }
    }
    return primaryAddress;
  }

  // Set selected address
  void selectAddress(String addressId) {
    _selectedAddressId = addressId;
    notifyListeners();
  }

  // Fetch all addresses
  Future<void> fetchAddresses() async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _dioClient.dio.get(ApiConstants.addresses);

      if (response.statusCode == 200) {
        final data = response.data['data'];
        List<dynamic> addressList;

        if (data is List) {
          addressList = data;
        } else {
          addressList = [];
        }

        _addresses =
            addressList.map((json) => AddressModel.fromJson(json)).toList();

        // Sort primary first
        _addresses.sort((a, b) => b.isPrimary ? 1 : -1);
      }

      _setLoading(false);
    } on DioException catch (e) {
      _setLoading(false);
      final errorMessage =
          e.response?.data['message'] ?? 'Gagal memuat alamat';
      _setError(errorMessage);
      debugPrint('Error fetching addresses: $e');
    } catch (e) {
      _setLoading(false);
      debugPrint('Error fetching addresses: $e');
      _setError('Gagal memuat alamat');
    }
  }

  // Create address
  Future<bool> createAddress({
    required String label,
    String? address,
    double? latitude,
    double? longitude,
    bool isPrimary = false,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _dioClient.dio.post(
        ApiConstants.addresses,
        data: {
          'label': label,
          if (address != null) 'address': address,
          if (latitude != null) 'latitude': latitude,
          if (longitude != null) 'longitude': longitude,
          'is_primary': isPrimary,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        await fetchAddresses();
        _setLoading(false);
        return true;
      }

      _setLoading(false);
      return false;
    } on DioException catch (e) {
      _setLoading(false);
      final errorMessage =
          e.response?.data['message'] ?? 'Gagal membuat alamat';
      _setError(errorMessage);
      return false;
    }
  }

  // Update address
  Future<bool> updateAddress({
    required String id,
    String? label,
    String? address,
    double? latitude,
    double? longitude,
    bool? isPrimary,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      final Map<String, dynamic> data = {};
      if (label != null) data['label'] = label;
      if (address != null) data['address'] = address;
      if (latitude != null) data['latitude'] = latitude;
      if (longitude != null) data['longitude'] = longitude;
      if (isPrimary != null) data['is_primary'] = isPrimary;

      final response = await _dioClient.dio.patch(
        '${ApiConstants.addresses}/$id',
        data: data,
      );

      if (response.statusCode == 200) {
        await fetchAddresses();
        _setLoading(false);
        return true;
      }

      _setLoading(false);
      return false;
    } on DioException catch (e) {
      _setLoading(false);
      final errorMessage =
          e.response?.data['message'] ?? 'Gagal memperbarui alamat';
      _setError(errorMessage);
      return false;
    }
  }

  // Delete address
  Future<bool> deleteAddress(String id) async {
    _setLoading(true);
    _setError(null);

    try {
      final response =
          await _dioClient.dio.delete('${ApiConstants.addresses}/$id');

      if (response.statusCode == 200 || response.statusCode == 204) {
        await fetchAddresses();
        _setLoading(false);
        return true;
      }

      _setLoading(false);
      return false;
    } on DioException catch (e) {
      _setLoading(false);
      final errorMessage =
          e.response?.data['message'] ?? 'Gagal menghapus alamat';
      _setError(errorMessage);
      return false;
    }
  }

  // Set primary address
  Future<bool> setPrimaryAddress(String id) async {
    _setLoading(true);
    _setError(null);

    try {
      final response =
          await _dioClient.dio.post('${ApiConstants.addresses}/$id/primary');

      if (response.statusCode == 200) {
        await fetchAddresses();
        _setLoading(false);
        return true;
      }

      _setLoading(false);
      return false;
    } on DioException catch (e) {
      _setLoading(false);
      final errorMessage =
          e.response?.data['message'] ?? 'Gagal mengatur alamat utama';
      _setError(errorMessage);
      return false;
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
