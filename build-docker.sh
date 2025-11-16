#!/bin/bash

# ========================================
# Windsurf-Tool Docker 打包脚本 (最优方案)
# ========================================
# 支持在 macOS 上打包 Windows 版本
# 使用 Docker 确保跨平台兼容性

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 主函数
main() {
    print_header "🐳 Docker Windows 打包工具"
    
    # 1. 检查 Docker
    print_info "检查 Docker 环境..."
    if ! command -v docker &> /dev/null; then
        print_error "未找到 Docker"
        echo "请安装 Docker Desktop: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    if ! docker info &> /dev/null 2>&1; then
        print_error "Docker 未运行"
        echo "请启动 Docker Desktop"
        exit 1
    fi
    
    print_success "Docker 运行正常 ($(docker --version))"
    echo ""
    
    # 2. 选择打包方式
    print_info "选择打包方式:"
    echo "  1) 快速打包 - 直接使用官方镜像 (推荐)"
    echo "  2) 完整打包 - 构建自定义镜像 (更可控)"
    echo "  3) 仅打包 x64 版本"
    echo "  4) 仅打包 arm64 版本"
    echo ""
    read -p "请选择 [1-4, 默认: 1]: " choice
    choice=${choice:-1}
    
    # 3. 清理旧文件
    print_info "清理旧的打包文件..."
    rm -rf dist/*.exe dist/*.nsis.* dist/win-unpacked 2>/dev/null || true
    print_success "清理完成"
    echo ""
    
    # 4. 执行打包
    case $choice in
        1)
            build_quick
            ;;
        2)
            build_full
            ;;
        3)
            build_x64_only
            ;;
        4)
            build_arm64_only
            ;;
        *)
            print_error "无效的选择"
            exit 1
            ;;
    esac
    
    # 5. 显示结果
    show_results
}

# 快速打包 - 使用官方镜像
build_quick() {
    print_header "📦 快速打包 Windows 版本"
    
    print_info "拉取最新镜像..."
    docker pull electronuserland/builder:wine
    
    print_info "开始打包 (x64 + arm64)..."
    docker run --rm -ti \
        -v "$(pwd)":/project \
        -w /project \
        -e ELECTRON_CACHE=/root/.cache/electron \
        -e ELECTRON_BUILDER_CACHE=/root/.cache/electron-builder \
        electronuserland/builder:wine \
        bash -c "npm ci --prefer-offline && npm run build:win"
}

# 完整打包 - 构建自定义镜像
build_full() {
    print_header "📦 完整打包 Windows 版本"
    
    print_info "构建 Docker 镜像..."
    docker build -f Dockerfile.windows -t windsurf-builder:latest .
    
    print_info "开始打包..."
    docker run --rm \
        -v "$(pwd)/dist":/project/dist \
        windsurf-builder:latest
}

# 仅打包 x64
build_x64_only() {
    print_header "📦 打包 Windows x64 版本"
    
    print_info "拉取最新镜像..."
    docker pull electronuserland/builder:wine
    
    print_info "开始打包 x64..."
    docker run --rm -ti \
        -v "$(pwd)":/project \
        -w /project \
        -e ELECTRON_CACHE=/root/.cache/electron \
        -e ELECTRON_BUILDER_CACHE=/root/.cache/electron-builder \
        electronuserland/builder:wine \
        bash -c "npm ci --prefer-offline --no-audit && npm run build:win:x64"
}

# 仅打包 arm64
build_arm64_only() {
    print_header "📦 打包 Windows arm64 版本"
    
    docker pull electronuserland/builder:wine
    docker run --rm -ti \
        -v "$(pwd)":/project \
        -w /project \
        electronuserland/builder:wine \
        bash -c "npm ci --prefer-offline && npm run build:win:arm64"
}

# 显示打包结果
show_results() {
    echo ""
    print_header "✅ 打包完成"
    
    if [ -d "dist" ]; then
        print_info "生成的文件:"
        echo ""
        
        # 列出所有 Windows 相关文件
        find dist -name "*.exe" -o -name "*.nsis.*" | while read file; do
            size=$(ls -lh "$file" | awk '{print $5}')
            echo "  📦 $(basename "$file") ($size)"
        done
        
        echo ""
        print_success "输出目录: ./dist/"
        echo ""
        
        print_info "文件说明:"
        echo "  • Windsurf-Tool-*-win-x64.exe - Windows x64 安装程序"
        echo "  • Windsurf-Tool-*-win-arm64.exe - Windows ARM64 安装程序"
        echo "  • *.nsis.* - NSIS 安装程序相关文件"
        echo ""
        
        print_warning "重要提示:"
        echo "  1. 请在 Windows 系统上测试打包的应用"
        echo "  2. robotjs 等 native 模块已正确编译"
        echo "  3. 如有问题，请在 Windows 上重新打包"
    else
        print_error "未找到 dist 目录"
        exit 1
    fi
}

# 运行主函数
main
