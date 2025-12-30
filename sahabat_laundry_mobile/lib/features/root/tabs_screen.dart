import 'package:flutter/material.dart';
import '../home/screens/home_screen.dart';
import '../order/screens/order_list_screen.dart';
import '../profile/screens/profile_screen.dart';

class TabsScreen extends StatefulWidget {
  const TabsScreen({super.key});

  @override
  State<TabsScreen> createState() => _TabsScreenState();
}

class _TabsScreenState extends State<TabsScreen> {
  int _index = 0;
  DateTime? _lastBackPress;

  Future<bool> _onWillPop() async {
    final now = DateTime.now();
    final backButtonHasBeenPressedTwice = _lastBackPress != null &&
        now.difference(_lastBackPress!) < const Duration(seconds: 2);

    if (backButtonHasBeenPressedTwice) {
      // User pressed back twice within 2 seconds, exit app
      return true;
    }

    // First back press, show toast
    _lastBackPress = now;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Tekan sekali lagi untuk keluar'),
        duration: Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        margin: EdgeInsets.only(bottom: 80, left: 16, right: 16),
      ),
    );

    return false;
  }

  @override
  Widget build(BuildContext context) {
    final items = const [
      NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
      NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Orders'),
      NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
    ];

    final List<Widget> pages = <Widget>[
      const HomeScreen(),
      const OrderListScreen(),
      const ProfileScreen(),
    ];

    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        body: IndexedStack(index: _index, children: pages),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _index,
          onDestinationSelected: (i) => setState(() => _index = i),
          destinations: items,
          indicatorColor: const Color(0xFF7C3AED).withOpacity(0.15),
          surfaceTintColor: Colors.white,
          elevation: 0,
        ),
      ),
    );
  }
}
