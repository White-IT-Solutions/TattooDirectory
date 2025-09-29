#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}TATTOO DIRECTORY CONTENT GENERATION${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Parse command line arguments
SKIP_CHECKS=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --skip-checks    Skip dependency and authentication checks"
            echo "  --force          Skip confirmation prompts"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_header

# Check if Python is available
if [ "$SKIP_CHECKS" = false ]; then
    print_info "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        PYTHON_VERSION=$(python3 --version)
        print_success "Python found: $PYTHON_VERSION"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
        PYTHON_VERSION=$(python --version)
        print_success "Python found: $PYTHON_VERSION"
    else
        print_error "Python is not installed or not in PATH"
        echo "Please install Python 3.8+ and try again"
        exit 1
    fi

    # Check if we're in the right directory
    if [ ! -f "generate_tattoos_expert.py" ]; then
        print_error "Script not found in current directory"
        echo "Please run this from the scripts/ directory"
        exit 1
    fi

    # Check for required dependencies
    print_info "Checking dependencies..."
    if $PYTHON_CMD -c "import vertexai" 2>/dev/null; then
        print_success "Vertex AI library found"
    else
        print_warning "Vertex AI library not found"
        print_info "Installing required dependencies..."
        pip install google-cloud-aiplatform
        if [ $? -ne 0 ]; then
            print_error "Failed to install dependencies"
            exit 1
        fi
        print_success "Dependencies installed successfully"
    fi

    # Check GCP authentication
    print_info "Checking GCP authentication..."
    if gcloud auth application-default print-access-token &>/dev/null; then
        print_success "GCP authentication found"
    else
        print_warning "GCP authentication not found"
        echo "Please run: gcloud auth application-default login"
        echo "Or set up service account credentials"
        if [ "$FORCE" = false ]; then
            read -p "Continue anyway? (y/N): " continue_choice
            if [[ ! "$continue_choice" =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
else
    PYTHON_CMD="python3"
    if ! command -v python3 &> /dev/null; then
        PYTHON_CMD="python"
    fi
fi

echo ""
print_info "Starting content generation..."
echo -e "${GRAY}This will generate:${NC}"
echo -e "${GRAY}  - 1000 tattoo portfolio images (1:1 aspect ratio)${NC}"
echo -e "${GRAY}  - 600 studio images for 100 studios (16:9 aspect ratio)${NC}"
echo -e "${GRAY}  - Estimated time: 45-65 minutes${NC}"
echo -e "${GRAY}  - Estimated cost: ~\$64 USD${NC}"
echo ""

if [ "$FORCE" = false ]; then
    read -p "Proceed with generation? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Generation cancelled${NC}"
        exit 0
    fi
fi

echo ""
print_info "Generation in progress..."
echo -e "${GRAY}Check the console output for detailed progress${NC}"
echo ""

# Run the generation script
if $PYTHON_CMD generate_tattoos_expert.py; then
    echo ""
    print_success "Content generation completed successfully!"
    echo -e "${CYAN}📁 Check the 'generated_content' directory for results${NC}"
else
    echo ""
    print_error "Generation failed with errors"
    echo -e "${GRAY}Check the output above for details${NC}"
    exit 1
fi

echo ""