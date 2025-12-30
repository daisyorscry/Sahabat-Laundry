import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/home_dashboard_model.dart';

class StatisticsCard extends StatelessWidget {
  final CustomerStatistics stats;

  const StatisticsCard({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.analytics, color: Color(0xFF7C3AED), size: 20),
              SizedBox(width: 8),
              Text(
                'Statistik Anda',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _StatItem(
                  label: 'Total Order',
                  value: stats.totalOrders.toString(),
                  icon: Icons.receipt_long,
                  color: const Color(0xFF3B82F6),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatItem(
                  label: 'Bulan Ini',
                  value: stats.ordersThisMonth.toString(),
                  icon: Icons.calendar_today,
                  color: const Color(0xFF10B981),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatItem(
                  label: 'Total Belanja',
                  value: currencyFormat.format(stats.totalSpending),
                  icon: Icons.payments,
                  color: const Color(0xFFF59E0B),
                  isLarge: true,
                ),
              ),
            ],
          ),
          if (stats.activeOrdersCount > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.pending_actions,
                      color: Color(0xFFF59E0B), size: 18),
                  const SizedBox(width: 8),
                  Text(
                    '${stats.activeOrdersCount} order sedang diproses',
                    style: const TextStyle(
                      color: Color(0xFF92400E),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final bool isLarge;

  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.isLarge = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(isLarge ? 16 : 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: isLarge ? 24 : 20),
          SizedBox(height: isLarge ? 12 : 8),
          Text(
            value,
            style: TextStyle(
              fontSize: isLarge ? 20 : 18,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1F2937),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: isLarge ? 13 : 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}
