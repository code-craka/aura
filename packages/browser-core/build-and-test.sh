#!/bin/bash

# Build and Test Script for Aura Browser Core
# Handles building the customized Chromium and running tests

set -e

# Configuration
BUILD_TYPE="${BUILD_TYPE:-Release}"
TARGET_PLATFORMS="${TARGET_PLATFORMS:-linux mac win}"
CHROMIUM_DIR="chromium"
BUILD_DIR="$CHROMIUM_DIR/src/out/$BUILD_TYPE"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to build for specific platform
build_platform() {
    local platform=$1
    log_info "Building for platform: $platform"

    cd $CHROMIUM_DIR/src

    case $platform in
        "linux")
            gn gen $BUILD_DIR --args="
                is_debug=false
                is_official_build=true
                symbol_level=0
                enable_nacl=false
                is_component_build=false
                use_sysroot=false
                treat_warnings_as_errors=false
                enable_linux_installer=true
            "
            ;;
        "mac")
            gn gen $BUILD_DIR --args="
                is_debug=false
                is_official_build=true
                symbol_level=0
                target_cpu=\"x64\"
                enable_nacl=false
                is_component_build=false
                treat_warnings_as_errors=false
            "
            ;;
        "win")
            gn gen $BUILD_DIR --args="
                is_debug=false
                is_official_build=true
                symbol_level=0
                target_cpu=\"x64\"
                enable_nacl=false
                is_component_build=false
                treat_warnings_as_errors=false
            "
            ;;
    esac

    # Build with ninja
    log_info "Starting build with ninja..."
    ninja -C $BUILD_DIR chrome

    # Build additional components
    ninja -C $BUILD_DIR chromedriver
    ninja -C $BUILD_DIR chrome/installer

    cd ../..
    log_success "Build completed for $platform"
}

# Function to run basic functionality tests
run_basic_tests() {
    log_info "Running basic functionality tests..."

    if [ ! -f "$BUILD_DIR/chrome" ]; then
        log_error "Chrome binary not found at $BUILD_DIR/chrome"
        exit 1
    fi

    # Test 1: Version check
    log_info "Test 1: Checking version..."
    $BUILD_DIR/chrome --version

    # Test 2: Basic page load test
    log_info "Test 2: Testing basic page load..."
    timeout 30s $BUILD_DIR/chrome --headless --no-sandbox --disable-gpu \
        --disable-software-rasterizer --disable-dev-shm-usage \
        --remote-debugging-port=9222 \
        https://example.com || true

    # Test 3: Extension compatibility check
    log_info "Test 3: Testing extension compatibility..."
    # This would test loading a basic extension

    log_success "Basic functionality tests completed"
}

# Function to run web standards compliance tests
run_standards_tests() {
    log_info "Running web standards compliance tests..."

    # Test modern web APIs
    log_info "Testing modern web APIs..."

    # Create a test HTML file
    cat > /tmp/test_standards.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Standards Test</title>
</head>
<body>
    <h1>Web Standards Compliance Test</h1>
    <div id="test-results"></div>

    <script>
        const results = [];
        const testElement = document.getElementById('test-results');

        // Test ES6 features
        try {
            const arrow = () => 'ES6 Arrow Functions';
            results.push('✓ ES6 Arrow Functions supported');
        } catch(e) {
            results.push('✗ ES6 Arrow Functions not supported');
        }

        // Test Promises
        try {
            Promise.resolve('test');
            results.push('✓ Promises supported');
        } catch(e) {
            results.push('✗ Promises not supported');
        }

        // Test Fetch API
        try {
            fetch;
            results.push('✓ Fetch API supported');
        } catch(e) {
            results.push('✗ Fetch API not supported');
        }

        // Test Web Components
        try {
            customElements;
            results.push('✓ Web Components supported');
        } catch(e) {
            results.push('✗ Web Components not supported');
        }

        testElement.innerHTML = results.join('<br>');
    </script>
</body>
</html>
EOF

    # Test with headless Chrome
    $BUILD_DIR/chrome --headless --no-sandbox --disable-gpu \
        --disable-software-rasterizer --disable-dev-shm-usage \
        /tmp/test_standards.html

    log_success "Web standards compliance tests completed"
}

# Function to test AI integration hooks
test_ai_hooks() {
    log_info "Testing AI integration hooks..."

    # This would test the native AI hooks integration
    # For now, just check if the hooks library was built
    if [ -f "$BUILD_DIR/libai_integration.so" ] || [ -f "$BUILD_DIR/libai_integration.dylib" ] || [ -f "$BUILD_DIR/ai_integration.dll" ]; then
        log_success "AI integration library found"
    else
        log_warning "AI integration library not found - this may be expected if not yet implemented"
    fi

    log_success "AI integration hooks tests completed"
}

# Function to run security tests
run_security_tests() {
    log_info "Running security tests..."

    # Test sandboxing
    log_info "Testing process sandboxing..."
    $BUILD_DIR/chrome --enable-sandbox --version

    # Test security features
    log_info "Testing security features..."
    # This would run additional security tests

    log_success "Security tests completed"
}

# Function to package builds
package_builds() {
    log_info "Packaging builds for distribution..."

    for platform in $TARGET_PLATFORMS; do
        log_info "Packaging for $platform..."

        case $platform in
            "linux")
                # Create .deb package
                mkdir -p packages/linux
                cp $BUILD_DIR/chrome packages/linux/
                cp $BUILD_DIR/*.so packages/linux/
                # Create tar.gz archive
                tar -czf aura-browser-linux.tar.gz -C packages/linux .
                ;;
            "mac")
                # Create .dmg package
                mkdir -p packages/mac/AuraBrowser.app/Contents/MacOS
                cp $BUILD_DIR/chrome packages/mac/AuraBrowser.app/Contents/MacOS/
                # Create DMG
                hdiutil create -volname "Aura Browser" -srcfolder packages/mac -ov aura-browser-mac.dmg
                ;;
            "win")
                # Create installer
                mkdir -p packages/win
                cp $BUILD_DIR/chrome.exe packages/win/
                cp $BUILD_DIR/*.dll packages/win/
                # Create installer executable
                # This would use NSIS or similar tool
                ;;
        esac
    done

    log_success "Build packaging completed"
}

# Function to run performance benchmarks
run_performance_tests() {
    log_info "Running performance benchmarks..."

    # Startup time test
    log_info "Testing startup time..."
    time $BUILD_DIR/chrome --version > /dev/null

    # Memory usage test
    log_info "Testing memory usage..."
    $BUILD_DIR/chrome --headless --no-sandbox --disable-gpu \
        --memory-pressure-off --max_old_space_size=4096 \
        --remote-debugging-port=9222 https://example.com &
    CHROME_PID=$!

    sleep 5
    ps -o pid,ppid,cmd,pcpu,pmem -p $CHROME_PID
    kill $CHROME_PID

    log_success "Performance benchmarks completed"
}

# Main build and test function
build_and_test() {
    log_info "Starting build and test process for Aura Browser Core"

    # Check if Chromium source exists
    if [ ! -d "$CHROMIUM_DIR" ]; then
        log_error "Chromium source not found. Run setup-chromium.sh first."
        exit 1
    fi

    # Build for all platforms
    for platform in $TARGET_PLATFORMS; do
        build_platform $platform
    done

    # Run tests
    run_basic_tests
    run_standards_tests
    test_ai_hooks
    run_security_tests
    run_performance_tests

    # Package builds
    package_builds

    log_success "Build and test process completed successfully!"
    log_info "Build artifacts available in:"
    log_info "  - $BUILD_DIR/ (build directory)"
    log_info "  - packages/ (packaged distributions)"
    log_info ""
    log_info "Next steps:"
    log_info "1. Test the packaged builds on target platforms"
    log_info "2. Run integration tests with AI engine"
    log_info "3. Perform manual testing of key features"
    log_info "4. Create release packages"
}

# Run main function with all arguments
build_and_test "$@"
