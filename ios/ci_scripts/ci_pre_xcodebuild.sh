#!/bin/bash

echo "=== Xcode Cloud Pre-build Script ==="
echo "Current directory: $(pwd)"

# Just verify the frameworks are in place
if [[ -d "ios/Pods/OneSignalXCFramework" ]]; then
    echo "✅ OneSignal XCFramework found"
else
    echo "❌ OneSignal XCFramework not found"
fi

if [[ -f "ios/Pods/Target Support Files/Pods-MilesCRM/Pods-MilesCRM.release.xcconfig" ]]; then
    echo "✅ Pods configuration files found"
else
    echo "❌ Pods configuration files not found"
fi

echo "=== Pre-build verification completed ==="
