class OutletModel {
  final String id;
  final String code;
  final String name;
  final String? address;
  final String? phone;
  final bool isActive;

  OutletModel({
    required this.id,
    required this.code,
    required this.name,
    this.address,
    this.phone,
    required this.isActive,
  });

  factory OutletModel.fromJson(Map<String, dynamic> json) {
    // Handle both boolean and string 'true'/'false' for is_active
    bool isActive = true;
    if (json['is_active'] != null) {
      if (json['is_active'] is bool) {
        isActive = json['is_active'];
      } else if (json['is_active'] is String) {
        isActive = json['is_active'].toString().toLowerCase() == 'true';
      } else if (json['is_active'] is int) {
        isActive = json['is_active'] == 1;
      }
    }

    return OutletModel(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? json['address_line'],
      phone: json['phone'],
      isActive: isActive,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
      'address': address,
      'phone': phone,
      'is_active': isActive,
    };
  }
}
