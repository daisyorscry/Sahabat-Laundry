import 'user_model.dart';

class LoginResponse {
  final bool success;
  final String message;
  final TokenData? token;
  final UserModel? user;
  final bool? requiresOtp;
  final bool? requiresVerification;

  LoginResponse({
    required this.success,
    required this.message,
    this.token,
    this.user,
    this.requiresOtp,
    this.requiresVerification,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'];
    return LoginResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      token: data?['token'] != null ? TokenData.fromJson(data['token']) : null,
      user: data?['user'] != null ? UserModel.fromJson(data['user']) : null,
      requiresOtp: json['requires_otp'],
      requiresVerification: json['requires_verification'],
    );
  }
}

class TokenData {
  final String accessToken;
  final String refreshToken;
  final String? accessTokenExpiresAt;

  TokenData({
    required this.accessToken,
    required this.refreshToken,
    this.accessTokenExpiresAt,
  });

  factory TokenData.fromJson(Map<String, dynamic> json) {
    return TokenData(
      accessToken: json['access_token'] ?? '',
      refreshToken: json['refresh_token'] ?? '',
      accessTokenExpiresAt: json['access_token_expires_at'],
    );
  }
}
