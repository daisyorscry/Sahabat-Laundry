class CustomerStatus {
  final int id;
  final String code;
  final String description;

  CustomerStatus({required this.id, required this.code, required this.description});

  factory CustomerStatus.fromJson(Map<String, dynamic> json) => CustomerStatus(
        id: json['id'] ?? 0,
        code: (json['code'] ?? '').toString(),
        description: (json['description'] ?? '').toString(),
      );
}

class LoginActivityItem {
  final String id;
  final String? createdAt;
  final String? usedAt;
  final Map<String, dynamic>? raw;

  LoginActivityItem({required this.id, this.createdAt, this.usedAt, this.raw});

  factory LoginActivityItem.fromJson(Map<String, dynamic> json) => LoginActivityItem(
        id: (json['id'] ?? '').toString(),
        createdAt: json['created_at']?.toString(),
        usedAt: json['used_at']?.toString(),
        raw: json,
      );
}

class UserProfileModel {
  final String id;
  final String fullName;
  final String? email;
  final String? phoneNumber;
  final bool? isActive;
  final String? balance;
  final String? avatarUrl;
  final String? emailVerifiedAt;
  final int? addressesCount;
  final CustomerStatus? customerStatus;
  final List<LoginActivityItem> logins;

  UserProfileModel({
    required this.id,
    required this.fullName,
    this.email,
    this.phoneNumber,
    this.isActive,
    this.balance,
    this.avatarUrl,
    this.emailVerifiedAt,
    this.addressesCount,
    this.customerStatus,
    this.logins = const [],
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    final loginsData = json['logins'];
    final List<LoginActivityItem> logins = (loginsData is List)
        ? loginsData
            .whereType<Map<String, dynamic>>()
            .map((e) => LoginActivityItem.fromJson(e))
            .toList()
        : [];

    return UserProfileModel(
      id: (json['id'] ?? '').toString(),
      fullName: (json['full_name'] ?? '').toString(),
      email: json['email']?.toString(),
      phoneNumber: json['phone_number']?.toString(),
      isActive: json['is_active'] is bool ? json['is_active'] as bool : null,
      balance: json['balance']?.toString(),
      avatarUrl: json['avatar_url']?.toString(),
      emailVerifiedAt: json['email_verified_at']?.toString(),
      addressesCount: json['addresses_count'] is int ? json['addresses_count'] as int : null,
      customerStatus: (json['customer_status'] is Map<String, dynamic>)
          ? CustomerStatus.fromJson(json['customer_status'] as Map<String, dynamic>)
          : null,
      logins: logins,
    );
  }
}

