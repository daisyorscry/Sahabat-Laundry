import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';

/// Helper class untuk detect dan display refresh rate info
class DisplayHelper {
  /// Get current display refresh rate
  static double getRefreshRate() {
    final view = ui.PlatformDispatcher.instance.views.first;
    return view.display.refreshRate;
  }

  /// Print display info ke console
  static void logDisplayInfo() {
    final view = ui.PlatformDispatcher.instance.views.first;
    final display = view.display;

    debugPrint('');
    debugPrint('🖥️  === DISPLAY INFO ===');
    debugPrint('📊 Refresh Rate: ${display.refreshRate} Hz');
    debugPrint('📏 Size: ${display.size.width.toInt()} x ${display.size.height.toInt()}');
    debugPrint('🔢 Device Pixel Ratio: ${display.devicePixelRatio}');
    debugPrint('🎯 Target FPS: ${display.refreshRate.toInt()} fps');
    debugPrint('');

    if (display.refreshRate >= 120) {
      debugPrint('✅ HIGH REFRESH RATE ACTIVE! Running at ${display.refreshRate.toInt()}fps 🚀');
    } else if (display.refreshRate >= 90) {
      debugPrint('✅ Running at ${display.refreshRate.toInt()}fps (90Hz+)');
    } else {
      debugPrint('ℹ️  Running at standard ${display.refreshRate.toInt()}fps');
      debugPrint('💡 Device may not support higher refresh rates');
    }
    debugPrint('');
  }

  /// Check if device supports high refresh rate
  static bool isHighRefreshRateSupported() {
    return getRefreshRate() >= 90;
  }

  /// Get FPS target string for display
  static String getFpsString() {
    final rate = getRefreshRate();
    if (rate >= 120) {
      return '120fps';
    } else if (rate >= 90) {
      return '90fps';
    } else {
      return '60fps';
    }
  }
}
