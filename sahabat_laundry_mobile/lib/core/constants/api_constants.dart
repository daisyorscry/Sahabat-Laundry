class ApiConstants {
  // Base URLs
  static const String orderBaseUrl = 'http://192.168.0.107:8089/api/v1';
  static const String coreBaseUrl = 'http://192.168.0.107:8000/api/v1';
  static const int requestTimeoutMs = 2500000000;

  // Auth endpoints
  static const String loginEmail = '/auth/login-email';
  static const String loginPin = '/auth/login';
  static const String verifyOtp = '/auth/verify-otp';
  static const String resendOtp = '/auth/resend-otp';
  static const String refreshToken = '/auth/refresh-token';
  static const String logout = '/auth/logout';

  // User endpoints
  static const String userProfile = '/user-profile/me';
  static const String uploadAvatar = '/user-profile/avatar';

  // Order endpoints
  static const String orders = '/orders';
  static const String quote = '/quote';

  // Catalog endpoints
  static const String services = '/mobile/services';
  static const String serviceCategories = '/mobile/service-categories';
  static const String outlets = '/mobile/outlets';

  // Profile endpoints
  static const String addresses = '/user-profile/me/addresses';
  static const String changePassword = '/auth/change-password';
  static const String changePin = '/auth/change-pin';
}
