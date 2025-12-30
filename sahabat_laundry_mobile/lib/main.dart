import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/otp_verification_screen.dart';
import 'features/root/tabs_screen.dart';
import 'features/home/providers/home_provider.dart';
import 'features/order/providers/order_provider.dart';
import 'features/order/providers/cart_provider.dart';
import 'features/order/screens/order_list_screen.dart';
import 'features/order/screens/create_order_screen.dart';
import 'features/order/screens/service_list_screen.dart';
import 'features/order/screens/service_details_screen.dart';
import 'features/order/screens/order_detail_screen.dart';
import 'features/catalog/providers/catalog_provider.dart';
import 'features/profile/providers/address_provider.dart';
import 'features/profile/providers/user_profile_provider.dart';
import 'features/profile/screens/profile_screen.dart';
import 'features/profile/screens/edit_profile_screen.dart';
import 'features/profile/screens/change_password_screen.dart';
import 'features/profile/screens/change_pin_screen.dart';
import 'features/profile/screens/login_activity_screen.dart';
import 'features/profile/screens/outlets_screen.dart';
import 'features/profile/screens/address_selection_screen.dart';
import 'features/profile/screens/address_form_screen.dart';
import 'features/payment/providers/payment_provider.dart';
import 'features/payment/screens/payment_status_screen.dart';
import 'core/utils/display_helper.dart';

void main() {
  // Ensure Flutter is initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Use Flutter default image cache; no custom sizing

  // Log display info (refresh rate, resolution, etc)
  DisplayHelper.logDisplayInfo();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => HomeProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => CatalogProvider()),
        ChangeNotifierProvider(create: (_) => AddressProvider()),
        ChangeNotifierProvider(create: (_) => UserProfileProvider()),
        ChangeNotifierProvider(create: (_) => PaymentProvider()),
      ],
      child: MaterialApp(
        title: 'Sahabat Laundry',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF009688),
          ),
          useMaterial3: true,
        ),
        initialRoute: '/',
        routes: {
          '/': (context) => const AuthGate(),
          '/login': (context) => const LoginScreen(),
          '/verify-otp': (context) => const OtpVerificationScreen(),
          // After login, go to the Tabs container (home/orders/profile)
          '/home': (context) => const TabsScreen(),
          '/services': (context) => const ServiceListScreen(),
          '/select-address': (context) => const AddressSelectionScreen(),
          '/orders': (context) => const OrderListScreen(),
          '/profile': (context) => const ProfileScreen(),
          '/profile/edit': (context) => const EditProfileScreen(),
          '/profile/change-password': (context) => const ChangePasswordScreen(),
          '/profile/change-pin': (context) => const ChangePinScreen(),
          '/profile/login-activity': (context) => const LoginActivityScreen(),
          '/profile/outlets': (context) => const OutletsScreen(),
          '/profile/addresses': (context) => const AddressSelectionScreen(),
        },
        onGenerateRoute: (settings) {
          if (settings.name == '/address-form') {
            final args = settings.arguments as Map<String, dynamic>?;
            return MaterialPageRoute(
              builder: (context) => AddressFormScreen(
                addressId: args?['addressId'] as String?,
              ),
            );
          }

          if (settings.name == '/create-order') {
            final args = settings.arguments as Map<String, dynamic>?;
            if (args == null) {
              // Return error screen if arguments are missing
              return MaterialPageRoute(
                builder: (context) => Scaffold(
                  appBar: AppBar(title: const Text('Error')),
                  body: const Center(
                    child: Text('Missing required parameters for create order'),
                  ),
                ),
              );
            }
            return MaterialPageRoute(
              builder: (context) => CreateOrderScreen(
                outletId: args['outletId'] as String? ?? '',
                isExpress: args['isExpress'] as bool? ?? false,
                cart: args['cart'] as Map<String, Map<String, dynamic>>? ?? {},
              ),
            );
          }

          if (settings.name == '/service-details') {
            final args = settings.arguments as Map<String, dynamic>?;
            return MaterialPageRoute(
              builder: (context) => ServiceDetailsScreen(
                serviceId: args?['serviceId'] as String? ?? '',
                outletId: args?['outletId'] as String? ?? '',
                isExpress: args?['isExpress'] as bool? ?? false,
              ),
            );
          }

          if (settings.name == '/order-detail') {
            final args = settings.arguments as Map<String, dynamic>?;
            return MaterialPageRoute(
              builder: (context) => OrderDetailScreen(
                orderId: args?['orderId'] as String? ?? '',
              ),
            );
          }

          if (settings.name == '/payment-status') {
            final args = settings.arguments as Map<String, dynamic>?;
            return MaterialPageRoute(
              builder: (context) => PaymentStatusScreen(
                transaction: args != null && args['transaction'] != null
                    ? args['transaction'] as dynamic
                    : null,
                paymentOrderId: args != null ? args['paymentOrderId'] as String? : null,
                orderId: args != null ? args['orderId'] as String? : null,
              ),
            );
          }

          return null;
        },
      ),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _isChecking = true;

  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    final authProvider = context.read<AuthProvider>();
    final isAuthenticated = await authProvider.checkAuthStatus();

    if (!mounted) return;

    setState(() {
      _isChecking = false;
    });

    if (isAuthenticated) {
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF009688)),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
