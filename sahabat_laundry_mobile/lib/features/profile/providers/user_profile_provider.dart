import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/user_profile_model.dart';

class UserProfileProvider with ChangeNotifier {
  final _dioClient = DioClient();

  UserProfileModel? _profile;
  bool _loading = false;
  String? _error;

  UserProfileModel? get profile => _profile;
  bool get isLoading => _loading;
  String? get error => _error;

  Future<void> fetchProfile() async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _dioClient.dio.get(ApiConstants.userProfile);
      if (res.statusCode == 200) {
        final data = res.data['data'] ?? res.data['data'];
        if (data is Map<String, dynamic>) {
          _profile = UserProfileModel.fromJson(data);
        }
      }
    } catch (e) {
      _setError('Gagal memuat profil');
      debugPrint('fetchProfile error: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateProfile({String? fullName, String? email, String? phoneNumber}) async {
    _setLoading(true);
    _setError(null);
    try {
      final payload = <String, dynamic>{};
      if (fullName != null) payload['full_name'] = fullName;
      if (email != null) payload['email'] = email;
      if (phoneNumber != null) payload['phone_number'] = phoneNumber;
      final res = await _dioClient.dio.patch(ApiConstants.userProfile, data: payload);
      if (res.statusCode == 200) {
        await fetchProfile();
        return true;
      }
      return false;
    } on DioException catch (e) {
      _setError(e.response?.data['message']?.toString() ?? 'Gagal memperbarui profil');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> uploadAvatar(File file, {String fileName = 'avatar.jpg'}) async {
    _setLoading(true);
    _setError(null);
    try {
      final form = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(file.path, filename: fileName),
      });
      final res = await _dioClient.dio.post(
        ApiConstants.uploadAvatar,
        data: form,
        options: Options(headers: {'Content-Type': 'multipart/form-data'}),
      );
      if (res.statusCode == 200) {
        await fetchProfile();
        return true;
      }
      return false;
    } on DioException catch (e) {
      _setError(e.response?.data['message']?.toString() ?? 'Gagal mengunggah avatar');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> changePassword({required String currentPassword, required String newPassword}) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _dioClient.dio.post(ApiConstants.changePassword, data: {
        'current_password': currentPassword,
        'new_password': newPassword,
      });
      return res.statusCode == 200;
    } on DioException catch (e) {
      _setError(e.response?.data['message']?.toString() ?? 'Gagal mengubah password');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> changePin({required String currentPin, required String newPin}) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _dioClient.dio.post(ApiConstants.changePin, data: {
        'current_pin': currentPin,
        'new_pin': newPin,
      });
      return res.statusCode == 200;
    } on DioException catch (e) {
      _setError(e.response?.data['message']?.toString() ?? 'Gagal mengubah PIN');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool v) {
    _loading = v;
    notifyListeners();
  }

  void _setError(String? v) {
    _error = v;
    notifyListeners();
  }
}
