import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SecureStorageService {
  static final SecureStorageService _instance = SecureStorageService._internal();
  factory SecureStorageService() => _instance;
  SecureStorageService._internal();

  final _secureStorage = const FlutterSecureStorage();

  // Token keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _tokenExpiresAtKey = 'access_token_expires_at';

  // Identity keys (stored in SharedPreferences for quick access)
  static const String _identityEmailKey = 'identity_email';
  static const String _identityPhoneKey = 'identity_phone';

  // Token operations
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    String? expiresAt,
  }) async {
    await _secureStorage.write(key: _accessTokenKey, value: accessToken);
    await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);
    if (expiresAt != null) {
      await _secureStorage.write(key: _tokenExpiresAtKey, value: expiresAt);
    }
  }

  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: _accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: _refreshTokenKey);
  }

  Future<String?> getTokenExpiresAt() async {
    return await _secureStorage.read(key: _tokenExpiresAtKey);
  }

  Future<void> clearTokens() async {
    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _tokenExpiresAtKey);
  }

  // Identity operations (for PIN login)
  Future<void> saveIdentity({String? email, String? phone}) async {
    final prefs = await SharedPreferences.getInstance();
    if (email != null) {
      await prefs.setString(_identityEmailKey, email);
    }
    if (phone != null) {
      await prefs.setString(_identityPhoneKey, phone);
    }
  }

  Future<String?> getIdentityEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_identityEmailKey);
  }

  Future<String?> getIdentityPhone() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_identityPhoneKey);
  }

  Future<void> clearIdentity() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_identityEmailKey);
    await prefs.remove(_identityPhoneKey);
  }

  // Clear all stored data
  Future<void> clearAll() async {
    await clearTokens();
    await clearIdentity();
  }
}
