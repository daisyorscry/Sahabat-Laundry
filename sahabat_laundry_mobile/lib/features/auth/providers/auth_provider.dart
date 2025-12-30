import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../../core/constants/api_constants.dart';
import '../models/user_model.dart';
import '../models/login_response.dart';

class AuthProvider with ChangeNotifier {
  final _dioClient = DioClient();
  final _storage = SecureStorageService();

  UserModel? _user;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Check if user is already logged in
  Future<bool> checkAuthStatus() async {
    try {
      final token = await _storage.getAccessToken();
      if (token != null) {
        // Try to fetch user profile
        await fetchUserProfile();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Login with email and password
  Future<LoginResponse> loginWithEmail({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _dioClient.dio.post(
        ApiConstants.loginEmail,
        data: {'email': email.trim(), 'password': password},
      );

      final loginResponse = LoginResponse.fromJson(response.data);

      // Extract phone number from various possible locations in response
      final phoneNumber = loginResponse.user?.phoneNumber ??
          response.data['data']?['phone_number'] ??
          response.data['phone_number'];

      // Save identity for future use
      if (phoneNumber != null || email.isNotEmpty) {
        await _storage.saveIdentity(
          email: email.trim(),
          phone: phoneNumber,
        );
      }

      // Case 1: Device recognized - has tokens, login directly
      if (loginResponse.success &&
          loginResponse.token != null &&
          loginResponse.token!.accessToken.isNotEmpty &&
          loginResponse.token!.refreshToken.isNotEmpty) {
        await _storage.saveTokens(
          accessToken: loginResponse.token!.accessToken,
          refreshToken: loginResponse.token!.refreshToken,
          expiresAt: loginResponse.token!.accessTokenExpiresAt,
        );

        if (loginResponse.user != null) {
          _user = loginResponse.user;
          _isAuthenticated = true;
        }

        // Fetch full user profile
        await fetchUserProfile();

        _setLoading(false);
        return loginResponse;
      }

      // Case 2: Check if message contains OTP keywords
      final messageLower = loginResponse.message.toLowerCase();
      if (loginResponse.success &&
          (messageLower.contains('otp') ||
              messageLower.contains('terkirim') ||
              messageLower.contains('dikirim'))) {
        _setLoading(false);
        return loginResponse;
      }

      // Case 3: Check explicit OTP/verification flags
      if (loginResponse.requiresOtp == true ||
          loginResponse.requiresVerification == true) {
        _setLoading(false);
        return loginResponse;
      }

      // Case 4: Default - if success but no token, assume OTP needed
      _setLoading(false);
      return loginResponse;
    } on DioException catch (e) {
      _setLoading(false);

      // Handle 403 status with verification message - redirect to OTP
      if (e.response?.statusCode == 403) {
        final errorMessage = e.response?.data['message'] ?? '';
        if (errorMessage.toLowerCase().contains('verifik')) {
          final phoneNumber = e.response?.data['data']?['user']?['phone_number'] ??
              e.response?.data['phone_number'];

          await _storage.saveIdentity(
            email: email.trim(),
            phone: phoneNumber,
          );

          // Return a response indicating OTP is required
          _setError(errorMessage);
          return LoginResponse(
            success: false,
            message: errorMessage,
            requiresOtp: true,
            requiresVerification: true,
          );
        }
      }

      // Handle other errors
      final errorMessage = e.response?.data['message'] ?? 'Login failed';
      final errors = e.response?.data['errors'];

      if (errors != null && errors is Map) {
        final errorList = <String>[];
        errors.forEach((key, value) {
          if (value is List) {
            errorList.addAll(value.map((e) => e.toString()));
          }
        });
        final fullError = [errorMessage, ...errorList].join('\n');
        _setError(fullError);
        throw Exception(fullError);
      }

      _setError(errorMessage);
      throw Exception(errorMessage);
    }
  }

  // Verify OTP
  Future<LoginResponse> verifyOtp({
    required String identity,
    required String otp,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _dioClient.dio.post(
        ApiConstants.verifyOtp,
        data: {'identity': identity, 'otp': otp},
      );

      final loginResponse = LoginResponse.fromJson(response.data);

      if (loginResponse.success && loginResponse.token != null) {
        await _storage.saveTokens(
          accessToken: loginResponse.token!.accessToken,
          refreshToken: loginResponse.token!.refreshToken,
          expiresAt: loginResponse.token!.accessTokenExpiresAt,
        );

        if (loginResponse.user != null) {
          await _storage.saveIdentity(
            email: loginResponse.user?.email,
            phone: loginResponse.user?.phoneNumber,
          );
          _user = loginResponse.user;
          _isAuthenticated = true;
        }

        await fetchUserProfile();
      }

      _setLoading(false);
      return loginResponse;
    } on DioException catch (e) {
      _setLoading(false);
      final errorMessage =
          e.response?.data['message'] ?? 'OTP verification failed';
      _setError(errorMessage);
      throw Exception(errorMessage);
    }
  }

  // Resend OTP
  Future<void> resendOtp({required String identity}) async {
    _setLoading(true);
    _setError(null);

    try {
      await _dioClient.dio.post(
        ApiConstants.resendOtp,
        data: {'identity': identity},
      );

      _setLoading(false);
    } on DioException catch (e) {
      _setLoading(false);
      final errorMessage =
          e.response?.data['message'] ?? 'Failed to resend OTP';
      _setError(errorMessage);
      throw Exception(errorMessage);
    }
  }

  // Fetch user profile
  Future<void> fetchUserProfile() async {
    try {
      final response = await _dioClient.dio.get(ApiConstants.userProfile);

      if (response.statusCode == 200) {
        _user = UserModel.fromJson(response.data['data']);
        _isAuthenticated = true;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching user profile: $e');
    }
  }

  // Logout
  Future<void> logout() async {
    _setLoading(true);

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null) {
        await _dioClient.dio.post(
          ApiConstants.logout,
          data: {'refresh_token': refreshToken},
        );
      }
    } catch (e) {
      debugPrint('Error during logout: $e');
    }

    await _dioClient.clearSession();
    _user = null;
    _isAuthenticated = false;
    _setLoading(false);
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
