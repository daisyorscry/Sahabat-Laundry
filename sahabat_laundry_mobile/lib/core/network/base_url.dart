import 'dart:io';

/// Adapts a dev base URL for the current runtime.
/// - On Android emulator, `localhost` or `127.0.0.1` should be `10.0.2.2`.
/// - Otherwise returns as-is.
String adaptBaseUrl(String raw) {
  try {
    final uri = Uri.parse(raw);
    if (Platform.isAndroid &&
        (uri.host == 'localhost' || uri.host == '127.0.0.1')) {
      final adapted = uri.replace(host: '10.0.2.2');
      return adapted.toString();
    }
  } catch (_) {}
  return raw;
}

