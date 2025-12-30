class AddressModel {
  final String id;
  final String userId;
  final String label;
  final String? address;
  final double? latitude;
  final double? longitude;
  final bool isPrimary;

  AddressModel({
    required this.id,
    required this.userId,
    required this.label,
    this.address,
    this.latitude,
    this.longitude,
    required this.isPrimary,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    // Handle is_primary as bool, int (0/1), or string
    bool isPrimary = false;
    if (json['is_primary'] != null) {
      if (json['is_primary'] is bool) {
        isPrimary = json['is_primary'];
      } else if (json['is_primary'] is int) {
        isPrimary = json['is_primary'] == 1;
      } else if (json['is_primary'] is String) {
        isPrimary = json['is_primary'].toString() == '1' ||
            json['is_primary'].toString().toLowerCase() == 'true';
      }
    }

    return AddressModel(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      label: json['label'] ?? '',
      address: json['address'],
      latitude: json['latitude'] != null
          ? (json['latitude'] is num
              ? (json['latitude'] as num).toDouble()
              : double.tryParse(json['latitude'].toString()))
          : null,
      longitude: json['longitude'] != null
          ? (json['longitude'] is num
              ? (json['longitude'] as num).toDouble()
              : double.tryParse(json['longitude'].toString()))
          : null,
      isPrimary: isPrimary,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'label': label,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'is_primary': isPrimary,
    };
  }

  AddressModel copyWith({
    String? id,
    String? userId,
    String? label,
    String? address,
    double? latitude,
    double? longitude,
    bool? isPrimary,
  }) {
    return AddressModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      label: label ?? this.label,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isPrimary: isPrimary ?? this.isPrimary,
    );
  }
}
