import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/home_provider.dart';
import '../widgets/user_summary_card.dart';
import '../widgets/quick_actions.dart';
import '../widgets/statistics_card.dart';
import '../widgets/active_orders_section.dart';
import '../widgets/popular_services_section.dart';
import '../widgets/recent_orders_section.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch dashboard data when screen loads
    Future.microtask(() {
      if (mounted) {
        context.read<HomeProvider>().fetchDashboard();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Consumer<HomeProvider>(
          builder: (context, homeProvider, child) {
            if (homeProvider.isLoading && homeProvider.dashboard == null) {
              return const Center(
                child: CircularProgressIndicator(
                  color: Color(0xFF7C3AED),
                ),
              );
            }

            if (homeProvider.error != null && homeProvider.dashboard == null) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      homeProvider.error ?? 'Terjadi kesalahan',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey[600],
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => homeProvider.fetchDashboard(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF7C3AED),
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Coba Lagi'),
                    ),
                  ],
                ),
              );
            }

            final dashboard = homeProvider.dashboard;
            if (dashboard == null) {
              return const SizedBox.shrink();
            }

            return RefreshIndicator(
              onRefresh: () => homeProvider.fetchDashboard(),
              color: const Color(0xFF7C3AED),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // App Bar with Notification
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Beranda',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: const Icon(
                              Icons.notifications_outlined,
                              color: Color(0xFF1F2937),
                              size: 24,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // User Summary Card
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: UserSummaryCard(user: dashboard.user),
                    ),
                    const SizedBox(height: 20),

                    // Quick Actions
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 20),
                      child: QuickActions(),
                    ),
                    const SizedBox(height: 24),

                    // Active Orders Section
                    if (dashboard.activeOrders.isNotEmpty) ...[
                      ActiveOrdersSection(orders: dashboard.activeOrders),
                      const SizedBox(height: 24),
                    ],

                    // Statistics Card
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: StatisticsCard(stats: dashboard.statistics),
                    ),
                    const SizedBox(height: 24),

                    // Popular Services Section
                    if (dashboard.popularServices.isNotEmpty) ...[
                      PopularServicesSection(
                        services: dashboard.popularServices,
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Recent Orders Section
                    if (dashboard.recentOrders.isNotEmpty) ...[
                      RecentOrdersSection(orders: dashboard.recentOrders),
                      const SizedBox(height: 24),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
