import 'package:flutter/material.dart';
import '../../../core/network/dio_client.dart';
import '../models/home_dashboard_model.dart';

class HomeProvider with ChangeNotifier {
  final _dioClient = DioClient();

  HomeDashboardModel? _dashboard;
  bool _isLoading = false;
  String? _error;

  HomeDashboardModel? get dashboard => _dashboard;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchDashboard() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _dioClient.dio.get('/mobile/home/dashboard');

      if (response.statusCode == 200) {
        _dashboard = HomeDashboardModel.fromJson(response.data['data']);
        _error = null;
      } else {
        _error = response.data['message'] ?? 'Gagal mengambil data dashboard';
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Error fetching dashboard: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() async {
    await fetchDashboard();
  }
}
