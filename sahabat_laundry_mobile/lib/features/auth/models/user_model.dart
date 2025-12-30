class UserModel {
  final String id;
  final String fullName;
  final String? email;
  final String? phoneNumber;
  final bool? isActive;
  final String? balance;
  final String? address;
  final MemberTier? memberTier;

  UserModel({
    required this.id,
    required this.fullName,
    this.email,
    this.phoneNumber,
    this.isActive,
    this.balance,
    this.address,
    this.memberTier,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      fullName: json['full_name'] ?? '',
      email: json['email'],
      phoneNumber: json['phone_number'],
      isActive: json['is_active'],
      balance: json['balance'],
      address: json['address'],
      memberTier: json['member_tier'] != null
          ? MemberTier.fromJson(json['member_tier'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'email': email,
      'phone_number': phoneNumber,
      'is_active': isActive,
      'balance': balance,
      'address': address,
      'member_tier': memberTier?.toJson(),
    };
  }
}

class MemberTier {
  final String id;
  final String code;
  final String name;
  final double discountPercentage;

  MemberTier({
    required this.id,
    required this.code,
    required this.name,
    required this.discountPercentage,
  });

  factory MemberTier.fromJson(Map<String, dynamic> json) {
    return MemberTier(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      discountPercentage: (json['discount_percentage'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
      'discount_percentage': discountPercentage,
    };
  }
}
