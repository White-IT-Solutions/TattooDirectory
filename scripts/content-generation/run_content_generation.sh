#!/bin/bash
set -e

# Tattoo Directory Content Generation Script
# Linux/macOS shell script version

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Default values
LOCATION="europe-west2"
OUTPUT_DIR="generated_content"
TEST_MODE=false
SKIP_CHECKS=false
FORCE=false
PROJECT_ID=""

# Helper functions
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

show_help() {
    echo -e "${NC}Usage: $0 --project-id PROJECT_ID [OPTIONS]${NC}"
    echo ""
    echo -e "${NC}Required:${NC}"
    echo -e "${GRAY}  --project-id ID      Google Cloud Project ID (required)${NC}"
    echo ""
    echo -e "${NC}Options:${NC}"
    echo -e "${GRAY}  --location REGION    GCP region (default: europe-west2)${NC}"
    echo -e "${GRAY}  --output-dir DIR     Output directory (default: generated_content)${NC}"
    echo -e "${GRAY}  --test               Run in test mode (8 images total)${NC}"
    echo -e "${GRAY}  --skip-checks        Skip dependency and authentication checks${NC}"
    echo -e "${GRAY}  --force              Skip confirmation prompts${NC}"
    echo -e "${GRAY}  --help               Show this help message${NC}"
    echo ""
    echo -e "${NC}Examples:${NC}"
    echo -e "${GRAY}  $0 --project-id my-gcp-project${NC}"
    echo -e "${GRAY}  $0 --project-id my-gcp-project --test${NC}"
    echo -e "${GRAY}  $0 --project-id my-gcp-project --location europe-west2${NC}"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project-id)
            PROJECT_ID="$2"
            shift 2
            ;;
        --location)
            LOCATION="$2"
            shift 2
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --test)
            TEST_MODE=true
            shift
            ;;
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$PROJECT_ID" ]]; then
    print_error "Project ID is required"
    echo "Usage: $0 --project-id YOUR_PROJECT_ID"
    echo "Use --help for more information"
    exit 1
fi

# Validate project ID format
if [[ "$PROJECT_ID" == "your-gcp-project-id" ]]; then
    print_error "Please provide a valid Google Cloud Project ID"
    echo "Usage: $0 --project-id YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}TATTOO DIRECTORY CONTENT GENERATION${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "${NC}Configuration:${NC}"
echo -e "${GRAY}  Project ID: $PROJECT_ID${NC}"
echo -e "${GRAY}  Location: $LOCATION${NC}"
echo -e "${GRAY}  Output Dir: $OUTPUT_DIR${NC}"
if [[ "$TEST_MODE" == true ]]; then
    echo -e "${YELLOW}  Mode: TEST MODE (8 images)${NC}"
else
    echo -e "${NC}  Mode: FULL PRODUCTION (960 images)${NC}"
fi
echo ""

# Check dependencies and authentication
if [[ "$SKIP_CHECKS" == false ]]; then
    print_info "Checking Python installation..."
    if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
        print_error "Python is not installed or not in PATH"
        echo "Please install Python 3.8+ and try again"
        exit 1
    fi
    
    # Use python3 if available, otherwise python
    PYTHON_CMD="python3"
    if ! command -v python3 &> /dev/null; then
        PYTHON_CMD="python"
    fi
    
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1)
    print_success "Python found: $PYTHON_VERSION"

    # Check if we're in the right directory
    if [[ ! -f "generate_tattoos_expert.py" ]]; then
        print_error "Script not found in current directory"
        echo "Please run this from the scripts/content-generation/ directory"
        exit 1
    fi

    # Check for required dependencies
    print_info "Checking dependencies..."
    if ! $PYTHON_CMD -c "import vertexai" 2>/dev/null; then
        print_warning "Vertex AI library not found"
        print_info "Installing required dependencies..."
        pip install google-cloud-aiplatform
        if [[ $? -ne 0 ]]; then
            print_error "Failed to install dependencies"
            exit 1
        fi
        print_success "Dependencies installed successfully"
    else
        print_success "Vertex AI library found"
    fi

    # Check GCP authentication
    print_info "Checking GCP authentication..."
    if ! gcloud auth application-default print-access-token &>/dev/null; then
        print_warning "GCP authentication not found"
        echo "Please run: gcloud auth application-default login"
        echo "Or set up service account credentials"
        if [[ "$FORCE" == false ]]; then
            read -p "Continue anyway? (y/N): " continue_choice
            if [[ "$continue_choice" != "y" && "$continue_choice" != "Y" ]]; then
                exit 1
            fi
        fi
    else
        print_success "GCP authentication found"
    fi
fi

echo ""
print_info "Starting content generation..."

if [[ "$TEST_MODE" == true ]]; then
    echo -e "${YELLOW}[TEST MODE] This will generate:${NC}"
    echo -e "${GRAY}  - 5 tattoo portfolio images (1 per style)${NC}"
    echo -e "${GRAY}  - 3 studio images for 1 studio${NC}"
    echo -e "${GRAY}  - Estimated time: 2-3 minutes${NC}"
    echo -e "${GRAY}  - Estimated cost: ~\$0.50 USD${NC}"
else
    echo -e "${NC}[FULL MODE] This will generate:${NC}"
    echo -e "${GRAY}  - 660 tattoo portfolio images (30 per style, 22 styles)${NC}"
    echo -e "${GRAY}  - 300 studio images for 100 studios${NC}"
    echo -e "${GRAY}  - Estimated time: 45-65 minutes${NC}"
    echo -e "${GRAY}  - Estimated cost: ~\$64 USD${NC}"
fi
echo ""

if [[ "$FORCE" == false ]]; then
    read -p "Proceed with generation? (y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo -e "${YELLOW}Generation cancelled${NC}"
        exit 0
    fi
fi

echo ""
print_info "Generation in progress..."
echo -e "${GRAY}Check the console output for detailed progress${NC}"
echo ""

# Prepare Python script arguments
PYTHON_ARGS="--project-id $PROJECT_ID --location $LOCATION --output-dir $OUTPUT_DIR"
if [[ "$TEST_MODE" == true ]]; then
    PYTHON_ARGS="$PYTHON_ARGS --test-mode"
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

# Run the generation script
if $PYTHON_CMD generate_tattoos_expert.py $PYTHON_ARGS; then
    echo ""
    print_success "Content generation completed successfully!"
    echo -e "${CYAN}📁 Check the '$OUTPUT_DIR' directory for results${NC}"
    if [[ "$TEST_MODE" == true ]]; then
        echo -e "${YELLOW}🧪 Test mode completed - review results before running full generation${NC}"
    fi
else
    echo ""
    print_error "Generation failed with errors"
    echo -e "${GRAY}Check the output above for details${NC}"
    exit 1
fi

echo ""