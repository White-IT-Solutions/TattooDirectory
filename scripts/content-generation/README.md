# Content Generation Scripts

This directory contains scripts for generating tattoo portfolio images and studio images using Google Cloud's Vertex AI Imagen model.

## Files

- `generate_tattoos_expert.py` - Main Python script for image generation
- `run_content_generation.bat` - Windows batch script wrapper
- `run_content_generation.ps1` - PowerShell script wrapper  
- `run_content_generation.sh` - Linux/macOS bash script wrapper

## Usage

**⚠️ Important: Project ID Required**

All scripts now require a Google Cloud Project ID to be provided via command line for security. Never commit your project ID to the repository.

### Test Mode (Recommended First Run)

Test mode generates a small sample of images to verify setup and configuration:

**Windows (Command Prompt):**
```cmd
run_content_generation.bat --project-id YOUR_PROJECT_ID --test
```

**Windows (PowerShell):**
```powershell
.\run_content_generation.ps1 -ProjectId YOUR_PROJECT_ID -Test
```

**Linux/macOS:**
```bash
./run_content_generation.sh --project-id YOUR_PROJECT_ID --test
```

**Test Mode Output:**
- 5 tattoo portfolio images (1 per style)
- 3 studio images for 1 studio
- Estimated time: 2-3 minutes
- Estimated cost: ~$0.50 USD

### Full Production Mode

Full mode generates the complete dataset:

**Windows (Command Prompt):**
```cmd
run_content_generation.bat --project-id YOUR_PROJECT_ID
```

**Windows (PowerShell):**
```powershell
.\run_content_generation.ps1 -ProjectId YOUR_PROJECT_ID
```

**Linux/macOS:**
```bash
./run_content_generation.sh --project-id YOUR_PROJECT_ID
```

**Full Mode Output:**
- 660 tattoo portfolio images (30 per style, 22 styles)
- 300 studio images for 100 studios
- Estimated time: 45-65 minutes
- Estimated cost: ~$64 USD

## Command Line Options

### Windows Batch (.bat)
**Required:**
- `--project-id ID` - Google Cloud Project ID (required)

**Options:**
- `--location REGION` - GCP region (default: europe-west2)
- `--output-dir DIR` - Output directory (default: generated_content)
- `--test` - Run in test mode
- `--skip-checks` - Skip dependency and authentication checks
- `--force` - Skip confirmation prompts
- `--help` - Show help message

### PowerShell (.ps1)
**Required:**
- `-ProjectId ID` - Google Cloud Project ID (required)

**Options:**
- `-Location REGION` - GCP region (default: europe-west2)
- `-OutputDir DIR` - Output directory (default: generated_content)
- `-Test` - Run in test mode
- `-SkipChecks` - Skip dependency and authentication checks
- `-Force` - Skip confirmation prompts
- `-Help` - Show help message

### Bash (.sh)
**Required:**
- `--project-id ID` - Google Cloud Project ID (required)

**Options:**
- `--location REGION` - GCP region (default: global
- `--output-dir DIR` - Output directory (default: generated_content)
- `--test` - Run in test mode
- `--skip-checks` - Skip dependency and authentication checks
- `--force` - Skip confirmation prompts
- `--help` - Show help message

### Examples

```bash
# Basic usage
./run_content_generation.sh --project-id my-tattoo-project

# Test mode with custom location
./run_content_generation.sh --project-id my-tattoo-project --test --location global

# Full production with custom output directory
./run_content_generation.sh --project-id my-tattoo-project --output-dir /path/to/images

# Automated run (skip prompts)
./run_content_generation.sh --project-id my-tattoo-project --test --force --skip-checks
```

## Prerequisites

1. **Python 3.8+** with pip
2. **Google Cloud SDK** (`gcloud` command)
3. **Google Cloud Project** with Vertex AI enabled
4. **Authentication** - Choose one option:
   - **Option A (Recommended for development):** `gcloud auth application-default login`
   - **Option B (Recommended for production):** Service account JSON key file

## Authentication Setup

### Option A: User Authentication (Development)
```bash
# Install Google Cloud SDK first, then run:
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

### Option B: Service Account (Production)
1. Create a service account in Google Cloud Console
2. Grant it the "Vertex AI User" role
3. Download the JSON key file
4. Use the `--service-account-key` parameter:

```powershell
.\run_content_generation.ps1 -ProjectId YOUR_PROJECT_ID -ServiceAccountKey "path\to\service-account.json" -Test
```

## Configuration

**Security Note:** The project ID is now passed via command line arguments and is never stored in the code. This prevents accidental exposure of sensitive project information in public repositories.

**Default Configuration:**
- **Location:** `europe-west2` (can be overridden with `--location`)
- **Output Directory:** `generated_content` (can be overridden with `--output-dir`)
- **Test Mode:** Disabled by default (enable with `--test`)

**Supported Vertex AI Regions:**
- `globalwa)
- `us-east1` (South Carolina) 
- `us-west1` (Oregon)
- `europe-west2` (London) - Default
- `europe-west4` (Netherlands)
- `asia-southeast1` (Singapore)
- `asia-northeast1` (Tokyo)
- `australia-southeast1` (Sydney)

**Important:** Use regions (like `europe-west2`), not zones (like `europe-west2-a`). Vertex AI operates at the region level.

## Output Structure

Generated content is saved to `generated_content/` directory:

```
generated_content/
├── tattoos/
│   ├── old_school/
│   ├── traditional/
│   ├── new_school/
│   └── ... (22 style directories)
└── studios/
    ├── studio_001/
    │   ├── internal_01_studio_name.png
    │   ├── external_01_studio_name.png
    │   ├── working_01_studio_name.png
    │   └── studio_info.json
    └── ... (100 studio directories)
```

## Error Handling

The scripts include comprehensive error checking for:
- Python installation and version
- Required dependencies (Vertex AI library)
- Google Cloud authentication
- Project configuration
- File permissions

## Development Workflow

1. **First Run**: Use test mode to verify setup
2. **Review Results**: Check generated images in `generated_content/`
3. **Adjust Configuration**: Modify prompts or settings if needed
4. **Full Run**: Execute full production generation
5. **Monitor Progress**: Watch console output for detailed progress

## Cost Management

- **Test Mode**: ~$0.50 USD (8 images)
- **Full Mode**: ~$64 USD (960 images)
- Images are generated using Imagen 4 model
- Costs are based on Google Cloud Vertex AI pricing

## Troubleshooting

### Common Issues

1. **Authentication Error**: Run `gcloud auth application-default login`
2. **Missing Dependencies**: Scripts will auto-install `google-cloud-aiplatform`
3. **Project Not Found**: Verify PROJECT_ID in the Python script
4. **Quota Exceeded**: Check Vertex AI quotas in Google Cloud Console

### Skip Checks Mode

Use `--skip-checks` to bypass dependency verification if you're confident about your setup:

```bash
./run_content_generation.sh --project-id YOUR_PROJECT_ID --test --skip-checks --force
```

This is useful for automated environments or when running multiple times.

### Direct Python Usage

You can also run the Python script directly:

```bash
python generate_tattoos_expert.py --project-id YOUR_PROJECT_ID --test-mode
python generate_tattoos_expert.py --project-id YOUR_PROJECT_ID --location globaltput-dir custom_images
```