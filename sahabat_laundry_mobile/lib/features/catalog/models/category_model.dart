class CategoryModel {
  final String id;
  final String code;
  final String name;
  final String? description;
  final bool isActive;

  CategoryModel({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    required this.isActive,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
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

    return CategoryModel(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      isActive: isActive,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
      'description': description,
      'is_active': isActive,
    };
  }
}
