import 'dart:io';
import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';
import '../constants/api_constants.dart';
import 'base_url.dart';
import '../storage/secure_storage_service.dart';

class DioClient {
  static final DioClient _instance = DioClient._internal();
  factory DioClient() => _instance;
  DioClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: adaptBaseUrl(ApiConstants.coreBaseUrl),
        connectTimeout: const Duration(
          milliseconds: ApiConstants.requestTimeoutMs,
        ),
        receiveTimeout: const Duration(
          milliseconds: ApiConstants.requestTimeoutMs,
        ),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: _onRequest,
        onError: _onError,
        onResponse: _onResponse,
      ),
    );
  }

  late final Dio _dio;
  final _storage = SecureStorageService();
  final _uuid = const Uuid();
  String? _deviceId;
  bool _isRefreshing = false;

  Dio get dio => _dio;

  // printging untuk setiap response
  Future<void> _onResponse(
    Response response,
    ResponseInterceptorHandler handler,
  ) async {
    print('← [RESPONSE] ${response.statusCode} ${response.requestOptions.uri}');
    print('Response data: ${response.data}');
    handler.next(response);
  }

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    print('→ [REQUEST] ${options.method} ${options.uri}');
    print('Headers: ${options.headers}');
    print('Data: ${options.data}');
    // Add authorization token
    final token = await _storage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    // Add device metadata
    _deviceId ??= _uuid.v4();
    options.headers['x-device-id'] = _deviceId;
    options.headers['x-device-type'] = 'mobile';
    options.headers['x-platform'] = Platform.isAndroid ? 'android' : 'ios';
    options.headers['x-browser'] = 'flutter';

    handler.next(options);
  }

  Future<void> _onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    print('✗ [ERROR] ${err.response?.statusCode} ${err.requestOptions.uri}');
    print('Error type: ${err.type}');
    print('Error message: ${err.message}');

    // Handle 401 errors (unauthorized)
    if (err.response?.statusCode == 401) {
      print('[AUTH] Got 401 error, attempting token refresh...');
      print('[AUTH] Is already refreshing: $_isRefreshing');

      // Try to refresh token
      final refreshToken = await _storage.getRefreshToken();
      print('[AUTH] Refresh token exists: ${refreshToken != null}');
      print('[AUTH] Request path: ${err.requestOptions.path}');
      print('[AUTH] Is refresh endpoint: ${err.requestOptions.path.contains('/refresh-token')}');

      // Prevent multiple concurrent refresh attempts
      if (_isRefreshing) {
        print('[AUTH] Already refreshing token, rejecting this request');
        await Future.delayed(const Duration(milliseconds: 500));
        return handler.next(err);
      }

      if (refreshToken != null &&
          !err.requestOptions.path.contains('/refresh-token')) {
        print('[AUTH] Attempting to refresh token...');
        _isRefreshing = true;

        try {
          // Refresh the token - kirim refresh token via Bearer header
          final response = await _dio.post(
            ApiConstants.refreshToken,
            options: Options(
              headers: {
                'Authorization': 'Bearer $refreshToken',
              },
            ),
          );

          print('[AUTH] Refresh response status: ${response.statusCode}');
          print('[AUTH] Refresh response data: ${response.data}');

          if (response.statusCode == 200) {
            final data = response.data['data'];
            await _storage.saveTokens(
              accessToken: data['access_token'],
              refreshToken: data['refresh_token'],
              expiresAt: data['access_token_expires_at'],
            );

            print('[AUTH] Token refreshed successfully, retrying original request...');

            // Retry the original request
            final opts = err.requestOptions;
            opts.headers['Authorization'] = 'Bearer ${data['access_token']}';

            _isRefreshing = false;

            final cloneReq = await _dio.fetch(opts);
            return handler.resolve(cloneReq);
          }
        } catch (e) {
          // Refresh failed, clear tokens and propagate error
          print('[AUTH] Token refresh failed: $e');
          _isRefreshing = false;
          await _storage.clearTokens();
        } finally {
          _isRefreshing = false;
        }
      } else {
        print('[AUTH] Skipping refresh - either no refresh token or already on refresh endpoint');
      }
    }

    handler.next(err);
  }

  Future<void> clearSession() async {
    await _storage.clearAll();
  }
}
