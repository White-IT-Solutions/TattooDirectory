#!/usr/bin/env python3
"""
Simple Imagen API test script to troubleshoot rate limiting and authentication.
Usage: python test_imagen.py --project-id YOUR_PROJECT_ID
"""

import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
import argparse
import time

def test_imagen_api(project_id, location="europe-west2"):
    """Test Imagen API with a simple prompt."""
    
    print(f"🔧 Testing Imagen API...")
    print(f"  Project: {project_id}")
    print(f"  Location: {location}")
    
    try:
        # Initialize Vertex AI
        vertexai.init(project=project_id, location=location)
        print("✅ Vertex AI initialized successfully")
        
        # Load the model
        model = ImageGenerationModel.from_pretrained("imagen-4.0-generate-001")
        print("✅ Model loaded successfully")
        
        # Simple test prompt
        prompt = "A simple red rose on a white background"
        print(f"🎨 Generating image with prompt: '{prompt}'")
        
        # Generate image
        response = model.generate_images(
            prompt=prompt,
            number_of_images=1,
            aspect_ratio="1:1",
            safety_filter_level="block_some"
        )
        
        # Save the image
        output_path = "test_image.png"
        response[0].save(location=output_path)
        
        print(f"✅ SUCCESS! Image saved to: {output_path}")
        print("🎉 Imagen API is working correctly!")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print("\n🔍 Troubleshooting tips:")
        print("  1. Check your project ID is correct")
        print("  2. Ensure Vertex AI API is enabled")
        print("  3. Verify authentication: gcloud auth application-default login")
        print("  4. Check billing is enabled")
        print("  5. Try a different region if rate limited")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Imagen API")
    parser.add_argument("--project-id", required=True, help="Google Cloud Project ID")
    parser.add_argument("--location", default="europe-west2", help="GCP region")
    
    args = parser.parse_args()
    test_imagen_api(args.project_id, args.location)