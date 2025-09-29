# Tattoo Directory Content Generation

This script generates comprehensive visual content for the UK Tattoo Artist Directory using Google Cloud's Vertex AI Imagen 4 model.

## Content Types Generated

### 1. Tattoo Portfolio Images (1,000 images)
- **Format**: 1024x1024 (1:1 aspect ratio) - optimized for social media
- **Styles**: 22 different tattoo styles (traditional, neo-traditional, blackwork, etc.)
- **Subjects**: 600+ diverse subjects across multiple categories
- **Organization**: Images organized by tattoo style in subdirectories

### 2. Studio Images (600 images for 100 studios)
- **Format**: 1024x576 (16:9 aspect ratio) - landscape format for business use
- **Categories per studio**:
  - **Internal** (2 images): Tattoo stations, waiting areas, equipment
  - **External** (2 images): Storefronts, signage, building exteriors  
  - **Working** (2 images): Artists at work, consultation processes

## Directory Structure

```
generated_content/
├── tattoos/
│   ├── traditional/
│   ├── neo_traditional/
│   ├── blackwork/
│   └── [other styles]/
├── studios/
│   ├── ink_studio_001/
│   │   ├── internal_01_ink_studio.png
│   │   ├── internal_02_ink_studio.png
│   │   ├── external_01_ink_studio.png
│   │   ├── external_02_ink_studio.png
│   │   ├── working_01_ink_studio.png
│   │   ├── working_02_ink_studio.png
│   │   └── studio_info.json
│   └── [other studios]/
├── generation_metadata.json
└── all_studios_metadata.json
```

## Configuration

### Required Setup

Before you run the script, you need to set up your Google Cloud environment.
- Google Cloud Project: If you don't have one, create a new project in the Google Cloud Console.
- Enable Vertex AI API: In your project, navigate to the "APIs & Services" dashboard and enable the "Vertex AI API"
- Install Google Cloud CLI: Install the gcloud CLI on your machine.
- Authenticate: Authenticate your local environment by running this command in your terminal and following the prompts

Authenticate to GCP: This runs on Vertex, GCPs AI PaaS platform.
```bash
gcloud auth application-default login
```

Install Python Libraries: You'll need the Vertex AI SDK for Python.
```bash
pip install google-cloud-aiplatform
```

1. **Google Cloud Project**: Update `PROJECT_ID` in the script
2. **Vertex AI API**: Enable Vertex AI API in your GCP project
3. **Authentication**: Set up Application Default Credentials
4. **Billing**: Ensure billing is enabled (Imagen 4 is a paid service)

### Key Settings
```python
PROJECT_ID = "your-gcp-project-id"  # Replace with your project
LOCATION = "us-central1"            # Or your preferred region
NUM_TATTOO_IMAGES = 1000           # Tattoo portfolio images
NUM_STUDIOS = 100                  # Number of studios
IMAGES_PER_STUDIO = 6              # 2 internal + 2 external + 2 working
```

### Image Quality Settings
- **Safety Filter**: `block_some` - balanced content filtering
- **Person Generation**: `allow_adult` - enables human subjects in studio images
- **Aspect Ratios**: 1:1 for tattoos, 16:9 for studios

## Usage

### Basic Execution
```bash
cd scripts
python generate_tattoos_expert.py
```

### Estimated Generation Time
- **Tattoo Images**: ~30-45 minutes (1000 images with rate limiting)
- **Studio Images**: ~15-20 minutes (600 images)
- **Total**: ~45-65 minutes

### Cost Estimation (Imagen 4)
- **Per Image**: ~$0.04 USD
- **Total Images**: 1,600 images
- **Estimated Cost**: ~$64 USD

## Content Categories

### Tattoo Subjects (600+ options)
- **Animals & Creatures**: Lions, wolves, dragons, mythical beasts
- **Marine Life**: Octopus, sharks, sea turtles, coral reefs
- **Mythology**: Greek gods, Norse mythology, cultural deities
- **Nature & Flora**: Roses, trees, landscapes, celestial bodies
- **Objects & Symbols**: Anchors, skulls, geometric patterns
- **Cultural Symbols**: Religious icons, tribal patterns
- **Fine Art**: Abstract designs, famous art inspirations

### Studio Types
- Modern minimalist, vintage traditional, industrial chic
- Cozy boutique, high-end luxury, street art inspired
- Clean medical, artistic bohemian, retro americana

### UK Locations
Covers major UK cities: London, Manchester, Birmingham, Liverpool, Leeds, Sheffield, Bristol, Newcastle, Edinburgh, Glasgow, Cardiff, Belfast, and more.

## Output Metadata

### Studio Information (`studio_info.json`)
```json
{
  "name": "Ink Studio",
  "location": "London", 
  "type": "modern minimalist",
  "images": {
    "internal": ["internal_01_ink_studio.png", "internal_02_ink_studio.png"],
    "external": ["external_01_ink_studio.png", "external_02_ink_studio.png"],
    "working": ["working_01_ink_studio.png", "working_02_ink_studio.png"]
  }
}
```

### Generation Metadata (`generation_metadata.json`)
- Generation timestamp
- Configuration settings used
- Expected vs actual image counts
- Image quality settings

## Error Handling

- **Rate Limiting**: Built-in delays between API calls
- **Retry Logic**: Automatic retry on temporary failures
- **Skip Existing**: Won't regenerate existing images
- **Error Logging**: Detailed error messages for debugging

## Social Media Optimization

### Tattoo Portfolio Images (1:1)
- Perfect for Instagram posts
- Suitable for Facebook, Twitter
- High resolution for print portfolios

### Studio Images (16:9)
- Ideal for website headers
- Great for Facebook cover photos
- Professional business presentations

## Quality Assurance

### Prompt Engineering
- Style-specific artistic directives
- Professional photography terminology
- UK-specific location and cultural context
- Realistic studio naming conventions

### Content Filtering
- Appropriate safety filtering for business use
- Professional, portfolio-quality imagery
- Consistent branding and aesthetic

## Troubleshooting

### Common Issues
1. **Authentication Error**: Ensure GCP credentials are set up
2. **Quota Exceeded**: Check Vertex AI quotas in GCP console
3. **Billing Error**: Verify billing account is active
4. **Network Timeout**: Script includes retry logic for temporary issues

### Performance Tips
- Run during off-peak hours for better API performance
- Monitor GCP quotas and billing
- Use SSD storage for faster file operations
- Consider running in batches for very large generations

## Integration with Tattoo Directory

Generated content is designed to integrate seamlessly with:
- Artist profile pages (portfolio images)
- Studio listing pages (studio images)
- Search and filter functionality
- Social media marketing campaigns
- SEO-optimized image galleries

This comprehensive content generation provides a solid foundation for populating the UK Tattoo Artist Directory with high-quality, diverse visual content suitable for both web and social media use.