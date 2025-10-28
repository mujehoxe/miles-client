#!/bin/bash

# Exit on any failure
set -e

echo "Installing CocoaPods dependencies..."
cd ios
pod install

echo "CocoaPods installation completed"
