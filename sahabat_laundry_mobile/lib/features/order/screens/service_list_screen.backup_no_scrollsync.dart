import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
// Using Image.network directly; no disk cache
import '../../catalog/providers/catalog_provider.dart';
import '../../catalog/models/service_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../../profile/providers/address_provider.dart';
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
  static const textTotalLabel = TextStyle(fontSize: 12, color: Colors.black54);
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
  String? selectedCategoryId;
  bool isExpress = false;
  String? selectedOutletId;
  final ScrollController _scrollController = ScrollController();
  final Map<String, GlobalKey> _sectionKeys = {};
  final GlobalKey _chipsKey = GlobalKey();
  final ScrollController _chipsController = ScrollController();
  final Map<String, GlobalKey> _chipKeys = {};
  final TextEditingController _searchController = TextEditingController();
  String _query = '';
  bool _isSearching = false;
  final FocusNode _searchFocus = FocusNode();

  // Throttle scroll listener
  DateTime? _lastScrollUpdate;
  static const _scrollThrottleDuration = Duration(milliseconds: 100);

  // ValueNotifier to prevent full rebuild on category change
  final ValueNotifier<String?> _activeCategoryNotifier = ValueNotifier<String?>(
    null,
  );
  bool _isProgrammaticScroll =
      false; // Flag to prevent scroll listener during programmatic scroll

  // Section keys will be used with ensureVisible; no manual offsets

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
    final addressProvider = context.read<AddressProvider>();
    final memberTier = authProvider.user?.memberTier?.code;

    // Fetch outlets, categories, and addresses first
    await Future.wait([
      catalogProvider.fetchOutlets(),
      catalogProvider.fetchCategories(),
      addressProvider.fetchAddresses(),
    ]);

    if (!mounted) return;

    // Set default outlet if available
    if (catalogProvider.outlets.isNotEmpty) {
      setState(() {
        selectedOutletId = catalogProvider.outlets.first.id;
      });
    }

    // Set default category if available
    if (catalogProvider.categories.isNotEmpty) {
      setState(() {
        selectedCategoryId = catalogProvider.categories.first.id;
        _activeCategoryNotifier.value = catalogProvider.categories.first.id;
      });
    }

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
    _chipsController.dispose();
    _searchController.dispose();
    _searchFocus.dispose();
    _activeCategoryNotifier.dispose();
    super.dispose();
  }

  void _handleScroll() {
    // Skip during programmatic scroll
    if (_isProgrammaticScroll) return;

    // Throttle to avoid too many updates
    final now = DateTime.now();
    if (_lastScrollUpdate != null &&
        now.difference(_lastScrollUpdate!) < _scrollThrottleDuration) {
      return;
    }
    _lastScrollUpdate = now;

    try {
      final chipsCtx = _chipsKey.currentContext;
      if (chipsCtx == null) return;

      double headerBottom = 0;
      final rb = chipsCtx.findRenderObject() as RenderBox?;
      if (rb != null) {
        headerBottom = rb.localToGlobal(Offset.zero).dy + rb.size.height;
      }

      String? current;
      for (final entry in _sectionKeys.entries) {
        final ctx = entry.value.currentContext;
        if (ctx == null) continue;
        final rb = ctx.findRenderObject() as RenderBox?;
        if (rb == null) continue;
        final dy = rb.localToGlobal(Offset.zero).dy;
        if (dy <= headerBottom + 24) {
          current = entry.key;
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
    _activeCategoryNotifier.value = categoryId;
    selectedCategoryId = categoryId;
    // Use ensureVisible directly; works with slivers
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _attemptScrollToSection(categoryId, retries: 5);
    });
  }

  void _attemptScrollToSection(String categoryId, {int retries = 3}) {
    final key = _sectionKeys[categoryId];

    if (key?.currentContext != null) {
      _isProgrammaticScroll = true;

      Scrollable.ensureVisible(
        key!.currentContext!,
        duration: const Duration(milliseconds: 300),
        alignment: 0.0,
        curve: Curves.easeInOut,
      ).then((_) {
        Future.delayed(const Duration(milliseconds: 100), () {
          _isProgrammaticScroll = false;
        });
      });
    } else if (retries > 0) {
      Future.delayed(const Duration(milliseconds: 50), () {
        _attemptScrollToSection(categoryId, retries: retries - 1);
      });
    } else {
      _isProgrammaticScroll = false;
    }
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

  List<Widget> _buildCategorySlivers(
    List<ServiceModel> services,
    List categories,
  ) {
    final slivers = <Widget>[];
    final q = _query.trim().toLowerCase();
    bool matches(ServiceModel s) {
      if (q.isEmpty) return true;
      return s.name.toLowerCase().contains(q) ||
          s.code.toLowerCase().contains(q) ||
          (s.description?.toLowerCase().contains(q) ?? false);
    }

    for (final cat in categories) {
      final String cid = (cat as dynamic).id as String;
      final String cname = (cat as dynamic).name as String;
      final items = services
          .where((s) => s.categoryId == cid && matches(s))
          .toList();
      if (items.isEmpty) continue;

      _sectionKeys.putIfAbsent(cid, () => GlobalKey());

      // Section header
      slivers.add(
        SliverToBoxAdapter(
          child: Container(
            key: _sectionKeys[cid],
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

      // Grid items (lazily built)
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
              (context, i) => const RepaintBoundary(child: SizedBox.shrink()),
              childCount: 0,
            ),
          ),
        ),
      );

      // Replace placeholder delegate with real one to keep patch minimal readability
      slivers.removeLast();
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

    if (slivers.isEmpty) {
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

  // Get filtered services by selected category (client-side filtering)
  List<ServiceModel> get filteredServices {
    final catalogProvider = context.watch<CatalogProvider>();
    final allSvcs = catalogProvider.services;

    // If no category selected, return all
    if (selectedCategoryId == null) return allSvcs;

    // Filter by category ID (client-side)
    return allSvcs.where((s) => s.categoryId == selectedCategoryId).toList();
  }

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

            // Category Tabs - Only rebuild this section when active category changes
            ValueListenableBuilder<String?>(
              valueListenable: _activeCategoryNotifier,
              builder: (context, activeCategory, _) {
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
                      _buildCategoryChip(
                        'Express',
                        Icons.bolt,
                        isExpress: true,
                        activeCategory: activeCategory,
                      ),
                      ...catalogProvider.categories.map(
                        (category) => _buildCategoryChip(
                          category.name,
                          Icons.checkroom,
                          categoryId: category.id,
                          activeCategory: activeCategory,
                          itemKey: _chipKeys.putIfAbsent(
                            category.id,
                            () => GlobalKey(),
                          ),
                          onTap: () => _scrollToSection(category.id),
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
                      slivers: _buildCategorySlivers(
                        catalogProvider.services,
                        catalogProvider.categories,
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

  Widget _buildCategoryChip(
    String label,
    IconData icon, {
    bool isExpress = false,
    String? categoryId,
    String? activeCategory,
    VoidCallback? onTap,
    Key? itemKey,
  }) {
    final bool isSelected = isExpress
        ? this.isExpress
        : activeCategory == categoryId;

    return Container(
      key: itemKey,
      margin: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [const SizedBox(width: 6), Text(label)],
        ),
        selected: isSelected,
        onSelected: (selected) {
          if (isExpress) {
            setState(() {
              this.isExpress = selected;
            });
            // Only refresh when toggling express (need re-fetch from API)
            _refreshServices();
          } else {
            // Scroll to section when chip is tapped
            if (selected && categoryId != null) {
              onTap?.call();
            } else {
              // no-op
            }
          }
        },
        backgroundColor: Colors.white,
        selectedColor: const Color(0xFF7C3AED),
        showCheckmark: false,
        checkmarkColor: Colors.white,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : Colors.black87,
          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
        ),
        shape: StadiumBorder(
          side: isSelected
              ? BorderSide.none
              : const BorderSide(color: Color(0xFFE5E7EB)),
        ),
      ),
    );
  }

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
    // No image decode downscale or cache tuning
    // Only watch cart data for THIS specific service
    final amount = context.select<CartProvider, double>(
      (p) => p.getAmount(service.id),
    );
    final bool isInCart = amount > 0;
    final double basePrice = service.basePrice ?? 0;
    final double actualPrice = service.servicePrice?.unitPrice ?? basePrice;
    final bool hasDiscount = basePrice > 0 && actualPrice < basePrice;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: _UI.br20,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 4),
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
                        ? Image.network(
                            service.iconPath!,
                            height: 120,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            filterQuality: FilterQuality.low,
                            gaplessPlayback: true,
                            loadingBuilder: (context, child, progress) {
                              if (progress == null) return child;
                              return Container(
                                height: 120,
                                color: const Color(0xFFF5F5F5),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                height: 120,
                                decoration: const BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      Color(0x1A7C3AED),
                                      Color(0x0D7C3AED),
                                    ],
                                  ),
                                ),
                                child: const Icon(
                                  Icons.local_laundry_service_rounded,
                                  size: 48,
                                  color: Color(0xFF7C3AED),
                                ),
                              );
                            },
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
                            child: const Icon(
                              Icons.local_laundry_service_rounded,
                              size: 48,
                              color: Color(0xFF7C3AED),
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
                      Flexible(
                        child: Column(
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
                            const SizedBox(height: 3),
                            if (hasDiscount)
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      'Rp ${_ServiceCard._formatCurrency(actualPrice)}',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF7C3AED),
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  Text(
                                    service.pricingModel == 'weight'
                                        ? '/Kg'
                                        : '/Unit',
                                    style: const TextStyle(
                                      fontSize: 9,
                                      color: Color(0xFF757575),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                          ],
                        ),
                      ),
                      // Add to Cart or Edit buttons
                      if (isInCart)
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: _UI.br20,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(left: 8),
                                  child: Text(
                                    service.pricingModel == 'weight'
                                        ? '✓ ${amount.toStringAsFixed(1)} Kg'
                                        : '✓ ${amount.toInt()} in cart',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.green.shade700,
                                    ),
                                  ),
                                ),
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  ElevatedButton(
                                    onPressed: () async {
                                      // Get current cart data for this service
                                      final cartProvider = context
                                          .read<CartProvider>();
                                      final currentAddonIds = cartProvider
                                          .getAddonIds(service.id);
                                      final currentAmount = cartProvider
                                          .getAmount(service.id);

                                      // Navigate to service details screen to edit
                                      final result = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              ServiceDetailsScreen(
                                                serviceId: service.id,
                                                outletId:
                                                    selectedOutletId ?? '',
                                                isExpress: isExpress,
                                                initialAddonIds:
                                                    currentAddonIds,
                                                initialQuantity: currentAmount,
                                              ),
                                        ),
                                      );

                                      // Update cart if result is returned
                                      if (result != null &&
                                          result is Map<String, dynamic> &&
                                          context.mounted) {
                                        final cartProvider = context
                                            .read<CartProvider>();
                                        final amount = (result['quantity'] ?? 1)
                                            .toDouble();
                                        final addonIds =
                                            (result['addonIds']
                                                    as List<dynamic>?)
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
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.green,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                        vertical: 8,
                                      ),
                                      shape: const RoundedRectangleBorder(
                                        borderRadius: _UI.br16,
                                      ),
                                      elevation: 0,
                                      minimumSize: Size.zero,
                                    ),
                                    child: const Text(
                                      'Edit',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  InkWell(
                                    onTap: () {
                                      final cartProvider = context
                                          .read<CartProvider>();
                                      cartProvider.clearSelection(service.id);
                                    },
                                    borderRadius: _UI.br12,
                                    child: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: Colors.red.shade100,
                                        borderRadius: _UI.br12,
                                      ),
                                      child: Icon(
                                        Icons.delete_outline,
                                        size: 14,
                                        color: Colors.red.shade700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        )
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
                              padding: const EdgeInsets.symmetric(vertical: 7),
                              shape: const RoundedRectangleBorder(
                                borderRadius: _UI.br8,
                              ),
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
