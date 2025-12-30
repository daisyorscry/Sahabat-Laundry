import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/home_dashboard_model.dart';

class PopularServicesSection extends StatelessWidget {
  final List<PopularService> services;

  const PopularServicesSection({super.key, required this.services});

  @override
  Widget build(BuildContext context) {
    if (services.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.star, color: Color(0xFFF59E0B), size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Layanan Populer',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ],
              ),
              TextButton(
                onPressed: () => Navigator.pushNamed(context, '/services'),
                child: const Text(
                  'Lihat Semua',
                  style: TextStyle(
                    color: Color(0xFF7C3AED),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 180,
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemCount: services.length,
            itemBuilder: (context, index) {
              final service = services[index];
              return _PopularServiceCard(service: service);
            },
          ),
        ),
      ],
    );
  }
}

class _PopularServiceCard extends StatelessWidget {
  final PopularService service;

  const _PopularServiceCard({required this.service});

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(
          context,
          '/services',
          arguments: {'selectedServiceId': service.id},
        );
      },
      child: Container(
        width: 160,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7C3AED).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    _getServiceIcon(service.code),
                    color: const Color(0xFF7C3AED),
                    size: 24,
                  ),
                ),
                if (service.hasDiscount)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '-${service.discountPercentage}%',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              service.name,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            if (service.hasDiscount) ...[
              Text(
                currencyFormat.format(service.basePrice),
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[500],
                  decoration: TextDecoration.lineThrough,
                ),
              ),
              const SizedBox(height: 2),
            ],
            Text(
              currencyFormat.format(service.unitPrice),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF7C3AED),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.shopping_bag, size: 12, color: Colors.grey[500]),
                const SizedBox(width: 4),
                Text(
                  '${service.orderCount}+ order',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _getServiceIcon(String code) {
    switch (code.toUpperCase()) {
      case 'CUCI_SETRIKA':
        return Icons.local_laundry_service;
      case 'SETRIKA':
        return Icons.iron;
      case 'CUCI_LIPAT':
        return Icons.checkroom;
      case 'KILAT':
      case 'EXPRESS':
        return Icons.bolt;
      case 'KARPET':
        return Icons.photo_size_select_large;
      case 'SEPATU':
        return Icons.dry_cleaning;
      case 'SELIMUT':
      case 'BEDCOVER':
        return Icons.bed;
      default:
        return Icons.local_laundry_service;
    }
  }
}
