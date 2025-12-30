import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
// Using Image.network directly; no disk cache
import '../../catalog/providers/catalog_provider.dart';
import '../../catalog/models/service_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import 'service_details_screen.dart';

// Lightweight style/cache constants to reduce rebuild allocations
class _UI {
  static const br20 = BorderRadius.all(Radius.circular(20));
  static const br16 = BorderRadius.all(Radius.circular(16));
  static const br12 = BorderRadius.all(Radius.circular(12));
  static const br8 = BorderRadius.all(Radius.circular(8));

  static const p16 = EdgeInsets.all(16);
  static const pv8 = EdgeInsets.symmetric(vertical: 8);

  static const textTitle18Bold = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.bold,
  );
  static const textCaption12Grey = TextStyle(
    fontSize: 12,
    color: Color(0xFF6B7280),
  );
  static const textCartCount = TextStyle(fontSize: 14, color: Colors.black54);
  static const textTotalLabel = TextStyle(fontSize: 14, color: Colors.black54);
  static const textTotalValue = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Color(0xFF7C3AED),
  );
  static const textCheckout = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
  );
}

// No custom disk cache manager

class ServiceListScreen extends StatefulWidget {
  const ServiceListScreen({super.key});

  @override
  State<ServiceListScreen> createState() => _ServiceListScreenState();
}

class _ServiceListScreenState extends State<ServiceListScreen> {
  bool isExpress = false;
  String? selectedOutletId;
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  String _query = '';
  bool _isSearching = false;
  final FocusNode _searchFocus = FocusNode();
  // Category chips + section sync (derived from services)
  final Map<String, GlobalKey> _sectionKeys = {};
  final GlobalKey _chipsKey = GlobalKey();
  final ScrollController _chipsController = ScrollController();
  final Map<String, GlobalKey> _chipKeys = {};
  final ValueNotifier<String?> _activeCategoryNotifier = ValueNotifier<String?>(
    null,
  );
  List<String> _orderedCategoryIds = [];

  @override
  void initState() {
    super.initState();
    // Use addPostFrameCallback to avoid calling setState during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData().then((_) {
        // No need to force render; slivers build lazily
      });
    });
    _scrollController.addListener(_handleScroll);
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    final catalogProvider = context.read<CatalogProvider>();
    final authProvider = context.read<AuthProvider>();
    final memberTier = authProvider.user?.memberTier?.code;

    // Fetch outlets and categories (address not used here)
    await Future.wait([
      catalogProvider.fetchOutlets(),
      catalogProvider.fetchCategories(),
    ]);

    if (!mounted) return;

    // Set default outlet if available
    if (catalogProvider.outlets.isNotEmpty) {
      setState(() {
        selectedOutletId = catalogProvider.outlets.first.id;
      });
    }

    // No category preselect — we fetch all services

    // Fetch ALL services WITHOUT category filter (match React Native)
    await catalogProvider.fetchServices(
      outletId: selectedOutletId,
      memberTier: memberTier,
      isExpress: isExpress,
      // NO categoryId filter - fetch all!
    );
  }

  @override
  void dispose() {
    _scrollController.removeListener(_handleScroll);
    _scrollController.dispose();
    _searchController.dispose();
    _searchFocus.dispose();
    _chipsController.dispose();
    _activeCategoryNotifier.dispose();
    super.dispose();
  }

  List<Widget> _buildAllServicesSlivers(List<ServiceModel> services) {
    final slivers = <Widget>[];
    final q = _query.trim().toLowerCase();
    bool matches(ServiceModel s) {
      if (q.isEmpty) return true;
      return s.name.toLowerCase().contains(q) ||
          s.code.toLowerCase().contains(q) ||
          (s.description?.toLowerCase().contains(q) ?? false);
    }

    final items = services.where(matches).toList();
    slivers.add(
      SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.75,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          delegate: SliverChildBuilderDelegate(
            (context, i) => RepaintBoundary(
              child: _ServiceCard(
                service: items[i],
                selectedOutletId: selectedOutletId,
                isExpress: isExpress,
              ),
            ),
            childCount: items.length,
            addAutomaticKeepAlives: false,
          ),
        ),
      ),
    );

    if (items.isEmpty) {
      slivers.add(
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Center(
              child: const Text(
                'Tidak ada layanan',
                style: TextStyle(color: Color(0xFF757575)),
              ),
            ),
          ),
        ),
      );
    }

    return slivers;
  }

  // Group by category with section headers (derive from services)
  List<Widget> _buildCategorySliversFromServices(List<ServiceModel> services) {
    final slivers = <Widget>[];
    final q = _query.trim().toLowerCase();
    bool matches(ServiceModel s) {
      if (q.isEmpty) return true;
      return s.name.toLowerCase().contains(q) ||
          s.code.toLowerCase().contains(q) ||
          (s.description?.toLowerCase().contains(q) ?? false);
    }

    final Map<String, String> catNames = {};
    final Map<String, List<ServiceModel>> groups = {};
    for (final s in services) {
      if (!matches(s)) continue;
      final cid = s.categoryId;
      final cname = s.category?.name ?? 'Lainnya';
      catNames[cid] = cname;
      groups.putIfAbsent(cid, () => []).add(s);
    }

    final ordered = groups.keys.toList()
      ..sort((a, b) => (catNames[a] ?? '').compareTo(catNames[b] ?? ''));
    _orderedCategoryIds = ordered;

    for (final cid in ordered) {
      final cname = catNames[cid] ?? '';
      final items = groups[cid] ?? const [];
      if (items.isEmpty) continue;

      slivers.add(const SliverToBoxAdapter(child: SizedBox(height: 8)));
      slivers.add(
        SliverToBoxAdapter(
          child: Container(
            key: _sectionKeys.putIfAbsent(cid, () => GlobalKey()),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                const Icon(
                  Icons.shopping_bag,
                  size: 18,
                  color: Color(0xFF7C3AED),
                ),
                const SizedBox(width: 8),
                Text(
                  cname,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      slivers.add(
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.75,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, i) => RepaintBoundary(
                child: _ServiceCard(
                  service: items[i],
                  selectedOutletId: selectedOutletId,
                  isExpress: isExpress,
                ),
              ),
              childCount: items.length,
              addAutomaticKeepAlives: false,
            ),
          ),
        ),
      );
    }

    if (slivers.isEmpty) return _buildAllServicesSlivers(services);
    return slivers;
  }

  void _handleScroll() {
    try {
      final chipsCtx = _chipsKey.currentContext;
      if (chipsCtx == null) return;
      final rb = chipsCtx.findRenderObject() as RenderBox?;
      double headerBottom = 0;
      if (rb != null)
        headerBottom = rb.localToGlobal(Offset.zero).dy + rb.size.height;

      String? current;
      for (final cid in _orderedCategoryIds) {
        final ctx = _sectionKeys[cid]?.currentContext;
        final rbox = ctx?.findRenderObject() as RenderBox?;
        if (rbox == null) continue;
        final dy = rbox.localToGlobal(Offset.zero).dy;
        if (dy <= headerBottom + 24) {
          current = cid;
        } else {
          break;
        }
      }
      if (current != null && current != _activeCategoryNotifier.value) {
        _activeCategoryNotifier.value = current;
        _scrollChipIntoView(current);
      }
    } catch (_) {}
  }

  void _scrollToSection(String categoryId) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final key = _sectionKeys[categoryId];
      if (key?.currentContext != null) {
        Scrollable.ensureVisible(
          key!.currentContext!,
          duration: const Duration(milliseconds: 300),
          alignment: 0.0,
          curve: Curves.easeInOut,
        );
      }
    });
  }

  void _scrollChipIntoView(String categoryId) {
    final key = _chipKeys[categoryId];
    if (key?.currentContext != null) {
      Scrollable.ensureVisible(
        key!.currentContext!,
        duration: const Duration(milliseconds: 250),
        alignment: 0.3,
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _refreshServices() async {
    final catalogProvider = context.read<CatalogProvider>();
    final authProvider = context.read<AuthProvider>();
    final memberTier = authProvider.user?.memberTier?.code;

    // Fetch ALL services WITHOUT category filter
    await catalogProvider.fetchServices(
      outletId: selectedOutletId,
      memberTier: memberTier,
      isExpress: isExpress,
      // NO categoryId filter - fetch all!
    );
  }

  // Get ALL services (unfiltered)
  List<ServiceModel> get allServices {
    final catalogProvider = context.watch<CatalogProvider>();
    return catalogProvider.services;
  }

  // No category filter; use allServices

  @override
  Widget build(BuildContext context) {
    // Screen-level calculations not strictly needed after moving to slivers
    // Use select for specific values to reduce rebuilds
    final catalogProvider = context.watch<CatalogProvider>();

    // Only watch cart for total and count
    final totalPrice = context.select<CartProvider, double>(
      (p) => p.calculateTotal(),
    );
    final selectedCount = context.select<CartProvider, int>(
      (p) => p.selectedCount,
    );
    final isCartNotEmpty = context.select<CartProvider, bool>(
      (p) => p.isNotEmpty,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
        title: AnimatedSwitcher(
          duration: const Duration(milliseconds: 260),
          transitionBuilder: (child, anim) {
            return SizeTransition(
              sizeFactor: anim,
              axis: Axis.horizontal,
              axisAlignment: 1.0, // grow from right to left (memanjang ke kiri)
              child: FadeTransition(opacity: anim, child: child),
            );
          },
          child: _isSearching
              ? SizedBox(
                  key: const ValueKey('search'),
                  height: 40,
                  child: TextField(
                    focusNode: _searchFocus,
                    controller: _searchController,
                    onChanged: (v) => setState(() => _query = v),
                    decoration: InputDecoration(
                      hintText: 'Cari layanan…',
                      prefixIcon: const Icon(Icons.search),
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(
                        vertical: 0,
                        horizontal: 12,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: _UI.br12,
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: _UI.br12,
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: _UI.br12,
                        borderSide: const BorderSide(color: Color(0xFF7C3AED)),
                      ),
                    ),
                  ),
                )
              : const Column(
                  key: ValueKey('title'),
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Laundry', style: _UI.textTitle18Bold),
                    Text('Pilih layanan', style: _UI.textCaption12Grey),
                  ],
                ),
        ),
        centerTitle: false,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        surfaceTintColor:
            Colors.transparent, // Fix: prevent color change on scroll
        elevation: 0,
        actions: _isSearching
            ? [
                if (_query.isNotEmpty)
                  TextButton(
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _query = '');
                    },
                    child: const Text('Clear'),
                  )
                else
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _isSearching = false;
                        _query = '';
                        _searchController.clear();
                      });
                    },
                    child: const Text('Batal'),
                  ),
              ]
            : [
                IconButton(
                  tooltip: 'Express',
                  icon: Icon(
                    Icons.bolt,
                    color: isExpress ? const Color(0xFF7C3AED) : null,
                  ),
                  onPressed: () {
                    setState(() => isExpress = !isExpress);
                    _refreshServices();
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: () {
                    setState(() => _isSearching = true);
                    Future.delayed(
                      const Duration(milliseconds: 50),
                      () => _searchFocus.requestFocus(),
                    );
                  },
                ),
              ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Address header removed by request
            const SizedBox.shrink(),

            // Category chips derived from services
            ValueListenableBuilder<String?>(
              valueListenable: _activeCategoryNotifier,
              builder: (context, activeCategory, _) {
                final services = catalogProvider.services;
                // Derive categories from services
                final Map<String, String> catNames = {};
                for (final s in services) {
                  catNames[s.categoryId] = s.category?.name ?? 'Lainnya';
                }
                final ids = catNames.keys.toList()
                  ..sort(
                    (a, b) => (catNames[a] ?? '').compareTo(catNames[b] ?? ''),
                  );
                return Container(
                  key: _chipsKey,
                  height: 50,
                  padding: _UI.pv8,
                  color: Colors.white,
                  child: ListView(
                    controller: _chipsController,
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      for (final cid in ids)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            key: _chipKeys.putIfAbsent(cid, () => GlobalKey()),
                            label: Text(catNames[cid] ?? ''),
                            selected: activeCategory == cid,
                            onSelected: (_) => _scrollToSection(cid),
                            backgroundColor: Colors.white,
                            selectedColor: const Color(0xFF7C3AED),
                            showCheckmark: false,
                            checkmarkColor: Colors.white,
                            labelStyle: TextStyle(
                              color: activeCategory == cid
                                  ? Colors.white
                                  : Colors.black87,
                              fontWeight: activeCategory == cid
                                  ? FontWeight.w700
                                  : FontWeight.w600,
                            ),
                            shape: StadiumBorder(
                              side: activeCategory == cid
                                  ? BorderSide.none
                                  : const BorderSide(color: Color(0xFFE5E7EB)),
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),

            // Search bar moved into AppBar when active

            // Service List
            Expanded(
              child: catalogProvider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : CustomScrollView(
                      controller: _scrollController,
                      cacheExtent: MediaQuery.of(context).size.height * 0.7,
                      slivers: _buildCategorySliversFromServices(
                        catalogProvider.services,
                      ),
                    ),
            ),

            // Bottom Cart Bar
            if (isCartNotEmpty)
              Container(
                padding: _UI.p16,
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: SafeArea(
                  top: false,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '$selectedCount items selected',
                            style: _UI.textCartCount,
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text('Total', style: _UI.textTotalLabel),
                              Text(
                                'Rp ${_formatCurrency(totalPrice)}',
                                style: _UI.textTotalValue,
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            // Navigate to checkout/create order screen
                            final cartProvider = context.read<CartProvider>();
                            Navigator.pushNamed(
                              context,
                              '/create-order',
                              arguments: {
                                'outletId': selectedOutletId,
                                'isExpress': isExpress,
                                'cart': cartProvider.getCartForCheckout(),
                              },
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF7C3AED),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: const RoundedRectangleBorder(
                              borderRadius: _UI.br12,
                            ),
                            elevation: 0,
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.shopping_cart, size: 20),
                              SizedBox(width: 8),
                              Text('Checkout Now', style: _UI.textCheckout),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // category chip builder removed

  String _formatCurrency(double amount) {
    return amount
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }
}

// Separate widget for service card with optimized rebuilds
class _ServiceCard extends StatelessWidget {
  final ServiceModel service;
  final String? selectedOutletId;
  final bool isExpress;

  const _ServiceCard({
    required this.service,
    required this.selectedOutletId,
    required this.isExpress,
  });

  @override
  Widget build(BuildContext context) {
    // Decode downscale for grid cells (not disk cache)
    final media = MediaQuery.of(context);
    final devicePixelRatio = media.devicePixelRatio;
    // Two-column layout width: 16+16 horizontal padding and 12 spacing between
    final gridCellWidth = (media.size.width - 32 - 12) / 2;
    final computedCacheWidth = (gridCellWidth * devicePixelRatio).round();
    // Only watch cart data for THIS specific service
    final amount = context.select<CartProvider, double>(
      (p) => p.getAmount(service.id),
    );
    final bool isInCart = amount > 0;
    final double basePrice = service.basePrice ?? 0;
    final double actualPrice = service.servicePrice?.unitPrice ?? basePrice;
    final bool hasDiscount = basePrice > 0 && actualPrice < basePrice;
    final int discountPercent = hasDiscount
        ? (((basePrice - actualPrice) / basePrice) * 100).round()
        : 0;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: _UI.br20,
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A000000), // black with 10% opacity
            blurRadius: 12,
            spreadRadius: 0,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () async {
            // Navigate to service details screen
            final result = await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ServiceDetailsScreen(
                  serviceId: service.id,
                  outletId: selectedOutletId ?? '',
                  isExpress: isExpress,
                ),
              ),
            );

            // Update cart from result (matching React Native logic)
            if (result != null &&
                result is Map<String, dynamic> &&
                context.mounted) {
              final cartProvider = context.read<CartProvider>();
              final amount = (result['quantity'] ?? 1).toDouble();
              final addonIds =
                  (result['addonIds'] as List<dynamic>?)
                      ?.map((e) => e.toString())
                      .toList() ??
                  [];
              final addonPrices =
                  (result['addonPrices'] as Map<String, dynamic>?)?.map(
                    (key, value) => MapEntry(key, (value as num).toDouble()),
                  ) ??
                  {};

              cartProvider.setSelection(
                service.id,
                amount: amount,
                addonIds: addonIds,
                addonPrices: addonPrices,
                service: service,
              );
            }
          },
          borderRadius: _UI.br20,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image with discount badge
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(20),
                    ),
                    child: service.iconPath != null
                        ? Image(
                            image: ResizeImage(
                              NetworkImage(service.iconPath!),
                              width: computedCacheWidth,
                            ),
                            height: 120,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            filterQuality: FilterQuality.low,
                            gaplessPlayback: true,
                          )
                        : Container(
                            height: 120,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  const Color(
                                    0xFF7C3AED,
                                  ).withValues(alpha: 0.1),
                                  const Color(
                                    0xFF7C3AED,
                                  ).withValues(alpha: 0.05),
                                ],
                              ),
                            ),
                          ),
                  ),
                  if (hasDiscount)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFFEC4899),
                              Color(0xFFDB2777),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Save $discountPercent%',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              // Content
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            service.name,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                              height: 1.1,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  'Rp ${_ServiceCard._formatCurrency(actualPrice)}',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF7C3AED),
                                    height: 1.1,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Text(
                                service.pricingModel == 'weight'
                                    ? '/Kg'
                                    : '/Unit',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF757575),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      // Add to Cart or Edit buttons
                      if (isInCart)
                        Builder(builder: (context) {
                          final cartProvider = context.read<CartProvider>();
                          final bool isWeight = service.pricingModel == 'weight';
                          final double step = isWeight ? 0.5 : 1.0;

                          void decrease() {
                            double next = amount - step;
                            if (next <= 0) {
                              cartProvider.clearSelection(service.id);
                            } else {
                              // Normalize to 1 decimal for weight
                              if (isWeight) {
                                next = (next * 10).round() / 10.0;
                              }
                              cartProvider.updateAmount(service.id, next);
                            }
                          }

                          void increase() {
                            double next = amount + step;
                            if (isWeight) {
                              next = (next * 10).round() / 10.0;
                            }
                            cartProvider.updateAmount(service.id, next);
                          }

                          return Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF3E8FF),
                              borderRadius: _UI.br20,
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: Row(
                              children: [
                                // Decrease
                                InkWell(
                                  onTap: decrease,
                                  borderRadius: const BorderRadius.all(Radius.circular(999)),
                                  child: Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.remove,
                                      size: 16,
                                      color: Color(0xFF7C3AED),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                // Center tappable to customize
                                Expanded(
                                  child: InkWell(
                                    onTap: () async {
                                      final currentAddonIds = cartProvider.getAddonIds(service.id);
                                      final currentAmount = cartProvider.getAmount(service.id);
                                      final result = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => ServiceDetailsScreen(
                                            serviceId: service.id,
                                            outletId: selectedOutletId ?? '',
                                            isExpress: isExpress,
                                            initialAddonIds: currentAddonIds,
                                            initialQuantity: currentAmount,
                                          ),
                                        ),
                                      );
                                      if (result != null && result is Map<String, dynamic> && context.mounted) {
                                        final amount = (result['quantity'] ?? 1).toDouble();
                                        final addonIds =
                                            (result['addonIds'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [];
                                        final addonPrices =
                                            (result['addonPrices'] as Map<String, dynamic>?)?.map(
                                                  (key, value) => MapEntry(key, (value as num).toDouble()),
                                                ) ??
                                                {};

                                        cartProvider.setSelection(
                                          service.id,
                                          amount: amount,
                                          addonIds: addonIds,
                                          addonPrices: addonPrices,
                                          service: service,
                                        );
                                      }
                                    },
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(
                                          Icons.shopping_cart,
                                          size: 14,
                                          color: Color(0xFF7C3AED),
                                        ),
                                        const SizedBox(width: 6),
                                        Flexible(
                                          child: Text(
                                            isWeight
                                                ? '${amount.toStringAsFixed(1)} Kg'
                                                : '${amount.toInt()} item',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              color: Color(0xFF7C3AED),
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                // Increase
                                InkWell(
                                  onTap: increase,
                                  borderRadius: const BorderRadius.all(Radius.circular(999)),
                                  child: Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF7C3AED),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.add,
                                      size: 16,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        })
                      else
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () async {
                              // Navigate to service details screen
                              final result = await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => ServiceDetailsScreen(
                                    serviceId: service.id,
                                    outletId: selectedOutletId ?? '',
                                    isExpress: isExpress,
                                  ),
                                ),
                              );

                              // If user added to cart, update the cart
                              if (result != null &&
                                  result is Map<String, dynamic> &&
                                  context.mounted) {
                                final cartProvider = context
                                    .read<CartProvider>();
                                final amount = (result['quantity'] ?? 1)
                                    .toDouble();
                                final addonIds =
                                    (result['addonIds'] as List<dynamic>?)
                                        ?.map((e) => e.toString())
                                        .toList() ??
                                    [];
                                final addonPrices =
                                    (result['addonPrices']
                                            as Map<String, dynamic>?)
                                        ?.map(
                                          (key, value) => MapEntry(
                                            key,
                                            (value as num).toDouble(),
                                          ),
                                        ) ??
                                    {};

                                cartProvider.setSelection(
                                  service.id,
                                  amount: amount,
                                  addonIds: addonIds,
                                  addonPrices: addonPrices,
                                  service: service,
                                );
                              }
                            },
                            icon: const Icon(
                              Icons.shopping_cart_outlined,
                              size: 18,
                            ),
                            label: const Text(
                              'Add to Cart',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF7C3AED),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              shape: const StadiumBorder(),
                              elevation: 0,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _formatCurrency(double amount) {
    return amount
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }
}

// Shimmer removed for lightweight loading
