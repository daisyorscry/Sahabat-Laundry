package com.example.sahabat_laundry_mobile

import android.os.Build
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Enable high refresh rate (120fps) for supported devices
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window?.attributes?.preferredDisplayModeId = getHighestRefreshRateDisplayModeId()
        }
    }

    private fun getHighestRefreshRateDisplayModeId(): Int {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val display = display
            val modes = display?.supportedModes ?: return 0

            // Find mode with highest refresh rate
            var maxRefreshRate = 60f
            var modeId = 0

            for (mode in modes) {
                if (mode.refreshRate > maxRefreshRate) {
                    maxRefreshRate = mode.refreshRate
                    modeId = mode.modeId
                }
            }

            println("🚀 Display: Highest refresh rate available: ${maxRefreshRate}Hz (mode: $modeId)")
            return modeId
        }
        return 0
    }
}
