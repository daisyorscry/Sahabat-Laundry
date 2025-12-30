import 'dart:io';
import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';
import '../constants/api_constants.dart';
import 'base_url.dart';
import '../storage/secure_storage_service.dart';

class OrderServiceClient {
  static final OrderServiceClient _instance = OrderServiceClient._internal();
  factory OrderServiceClient() => _instance;

  OrderServiceClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: adaptBaseUrl(ApiConstants.orderBaseUrl),
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

  Dio get dio => _dio;

  // Printing untuk setiap response
  Future<void> _onResponse(
    Response response,
    ResponseInterceptorHandler handler,
  ) async {
    print(
      '← [ORDER-SERVICE RESPONSE] ${response.statusCode} ${response.requestOptions.uri}',
    );
    print('Response data: ${response.data}');
    handler.next(response);
  }

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    print('→ [ORDER-SERVICE REQUEST] ${options.method} ${options.uri}');
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
    // Handle 401 errors (unauthorized)
    if (err.response?.statusCode == 401) {
      // Try to refresh token using main API (port 8000)
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null &&
          !err.requestOptions.path.contains('/refresh-token')) {
        try {
          // Create separate Dio instance for refresh token (using port 8000)
          final refreshDio = Dio(
            BaseOptions(
              baseUrl: adaptBaseUrl(ApiConstants.coreBaseUrl),
              headers: {'Content-Type': 'application/json'},
            ),
          );

          // Refresh the token
          final response = await refreshDio.post(
            ApiConstants.refreshToken,
            data: {'refresh_token': refreshToken},
            options: Options(
              headers: {
                'Authorization': 'Bearer ${await _storage.getAccessToken()}',
              },
            ),
          );

          if (response.statusCode == 200) {
            final data = response.data['data'];
            await _storage.saveTokens(
              accessToken: data['access_token'],
              refreshToken: data['refresh_token'],
              expiresAt: data['access_token_expires_at'],
            );

            // Retry the original request
            final opts = err.requestOptions;
            opts.headers['Authorization'] = 'Bearer ${data['access_token']}';
            final cloneReq = await _dio.fetch(opts);
            return handler.resolve(cloneReq);
          }
        } catch (e) {
          // Refresh failed, clear tokens and propagate error
          await _storage.clearTokens();
        }
      }
    }

    handler.next(err);
  }

  Future<void> clearSession() async {
    await _storage.clearAll();
  }
}
