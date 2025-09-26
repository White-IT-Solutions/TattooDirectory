import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
import random
import os
import time
import json

# --- CONFIGURATION ---
PROJECT_ID = "your-gcp-project-id"  # <--- REPLACE with your Google Cloud Project ID
LOCATION = "us-central1"           # <--- REPLACE with your desired region if needed
OUTPUT_DIR = "generated_content"    # Main directory to save all images
NUM_TATTOO_IMAGES = 1000           # Number of tattoo portfolio images
NUM_STUDIOS = 100                  # Number of studios to generate images for
IMAGES_PER_STUDIO = 6              # 2 internal, 2 external, 2 working area images

# Image generation settings for Imagen 4
IMAGE_SETTINGS = {
    "tattoo_portfolio": {
        "aspect_ratio": "1:1",  # Square format for social media
        "resolution": "1024x1024",
        "safety_filter_level": "block_some",
        "person_generation": "allow_adult"
    },
    "studio_images": {
        "aspect_ratio": "16:9",  # Landscape for studio shots
        "resolution": "1024x576", 
        "safety_filter_level": "block_some",
        "person_generation": "allow_adult"
    }
}

# --- PROMPT COMPONENTS (FINAL EXPANSION) ---

# Your list of 22 tattoo styles
tattoo_styles = [
    "old_school", "traditional", "new_school", "neo_traditional", "tribal",
    "blackwork", "dotwork", "geometric", "japanese", "lettering",
    "biomechanical", "watercolour", "floral", "fineline", "realism",
    "minimalist", "surrealism", "portrait", "sketch", "illustrative",
    "ornamental", "trash_polka"
]

# 600+ Tattoo Subjects for Maximum Variety (Greatly Expanded)
tattoo_subjects = [
    # --- Animals & Creatures (Expanded) ---
    "a majestic lion's face", "a howling wolf silhouette", "a roaring grizzly bear", "a coiled rattlesnake", "an octopus wrapping a skull",
    "a soaring eagle", "a tiger creeping through bamboo", "a cunning red fox in snow", "a noble stag with large antlers", "an elephant adorned with jewels",
    "a powerful rhino", "a mythical dragon", "a rising phoenix", "a griffin", "a kraken attacking a ship", "a kitsune with nine tails",
    "a detailed scarab beetle", "a monarch butterfly", "a death's head moth", "a hummingbird sipping nectar", "a wise old owl with spectacles", "playful dolphins",
    "a great white shark", "a sea turtle with a galaxy on its shell", "a koi fish swimming upstream", "a pair of koi fish in a yin-yang", "a scorpion",
    "a spider in its web", "a honeybee on a honeycomb", "a panther", "a cheetah", "a galloping horse", "a ram's skull", "a bull's skull with horns",
    "a raven on a branch", "a peacock displaying its feathers", "a chameleon", "a T-Rex skeleton", "a majestic whale", "a seahorse", "a jellyfish", 
    "a bat in flight", "a sloth hanging from a branch", "a panda eating bamboo", "a lemur", "a fierce wolverine", "a graceful swan", "a colorful parrot",
    "a wise tortoise", "a leaping frog", "a prowling jaguar", "a majestic moose", "a cunning raccoon", "a noble falcon", "a swimming otter",
    "a charging bull", "a praying mantis", "a colorful chameleon", "a fierce badger", "a graceful deer", "a powerful bison", "a climbing gecko",
    "a soaring albatross", "a curious meerkat", "a mighty gorilla", "a sleek seal", "a vibrant toucan", "a wise elephant", "a fierce hyena",
    
    # --- Marine Life (New Category) ---
    "a giant Pacific octopus", "a hammerhead shark", "a manta ray gliding", "a school of tropical fish", "a coral reef ecosystem", "a blue whale",
    "a lobster with claws raised", "a starfish on rocks", "a nautilus shell", "an anglerfish with glowing lure", "a sea anemone", "a crab scuttling",
    "a swordfish leaping", "a barracuda hunting", "a sea urchin", "a moray eel", "a pufferfish inflated", "a seahorse pair dancing",
    
    # --- Insects & Arachnids (New Category) ---
    "a detailed dragonfly", "a rhinoceros beetle", "a praying mantis stalking", "a black widow spider", "a tarantula", "a cicada emerging",
    "a grasshopper in tall grass", "a ladybug on a leaf", "a wasp building a nest", "a centipede coiled", "a firefly glowing", "an ant carrying food",
    "a cricket chirping", "a walking stick insect", "a caterpillar transforming", "a dung beetle rolling", "a mosquito in amber", "a tick magnified",
    
    # --- Mythology, Folklore & Gods (Expanded) ---
    "Medusa with snakes for hair", "Zeus, king of the gods", "Poseidon with his trident", "Anubis, the Egyptian god", "Odin with his ravens Huginn and Muninn",
    "Thor with his hammer Mjolnir", "Loki, the trickster god", "a Valkyrie with a sword and shield", "a Centaur archer", "a Minotaur in a labyrinth",
    "Icarus with melting wings", "Atlas holding the celestial sphere", "a Siren luring sailors", "a Chimera", "a Hydra with multiple heads",
    "Cthulhu rising from the depths", "a Japanese Oni mask", "a Tengu (crow-like goblin)", "a Raijin (god of thunder) beating his drums",
    "Ganesha", "Shiva the destroyer", "Kali with a necklace of skulls", "a powerful Djinn emerging from a lamp", "a Slavic Leshy (forest spirit)",
    "Quetzalcoatl the feathered serpent", "Bastet the cat goddess", "Horus with falcon head", "Set the chaos god", "Thoth with ibis head",
    "Freya the Norse goddess", "Balder the beautiful god", "Heimdall the watchman", "Fenrir the giant wolf", "Jormungandr the world serpent",
    "a Celtic Banshee wailing", "a Scottish Kelpie", "an Irish Leprechaun", "a Welsh Dragon", "a Cornish Pixie", "a Manx Cat Sith",
    "Anansi the spider trickster", "Kokopelli the fertility deity", "Wendigo the cannibalistic creature", "Thunderbird of Native American lore",
    
    # --- Nature & Flora (Expanded) ---
    "a single blooming rose", "a bouquet of wildflowers", "a lotus flower", "a sunflower", "a cherry blossom branch", "a venus flytrap",
    "a mighty oak tree", "a weeping willow", "a dense pine forest", "a mountain range landscape", "a powerful ocean wave", "a serene lake scene",
    "a lightning strike", "a swirling tornado", "the phases of the moon", "a solar eclipse", "the sun and moon together", "a galaxy spiral",
    "a nebula", "planet Saturn with its rings", "a crystalline structure", "a geode", "bioluminescent mushrooms on a log", "a fern leaf",
    "a pitcher plant", "a bonsai tree", "a wreath of laurel leaves", "a landscape inside a bottle", "a volcano erupting", "the Aurora Borealis",
    "a field of lavender", "a cactus flower blooming", "a dandelion seed head", "a morning glory vine", "a water lily on a pond", "a redwood forest",
    "a bamboo grove", "a desert oasis", "a frozen waterfall", "a field of poppies", "a mushroom fairy ring", "a twisted driftwood piece",
    "a crystal cave", "a hot spring", "a meteor shower", "a rainbow after rain", "a field of wheat", "a vineyard landscape",
    
    # --- Objects & Symbols (Expanded) ---
    "a classic anchor entwined with rope", "a ship's wheel", "a vintage pirate ship on a stormy sea", "a lighthouse on a cliff", "a detailed compass rose", "an old world map",
    "a melting hourglass", "a vintage clock with roman numerals", "gears and cogs", "a skeleton key", "a padlock and key", "a dagger piercing a heart",
    "a katana sword", "a shield and swords", "a bow and arrow", "a revolver pistol", "a lantern", "a candle", "a book with pages turning",
    "a feather", "an anatomical heart", "a hyper-detailed human skull", "a human skeleton", "a plague doctor mask", "a Venetian mask",
    "a dreamcatcher", "a hamsa hand", "an all-seeing eye in a pyramid", "the ouroboros serpent", "a Celtic knot", "a Viking rune compass (Vegvisir)",
    "a triquetra", "a pentagram", "a caduceus", "the scales of justice", "a crown", "a violin", "a guitar", "a retro microphone",
    "a classic car", "a motorcycle engine", "a knight's helmet", "a samurai mask", "a pocket watch", "a straight razor", "a quill and inkpot",
    "a potion bottle with swirling liquid", "a wizard's staff", "a crystal ball", "tarot cards (The Fool, The Magician, Death)", "a telescope",
    "a vintage typewriter", "a film camera", "a gramophone", "a ship in a bottle", "a snow globe", "a music box ballerina", "a chess set",
    "a vintage suitcase", "a hot air balloon", "a windmill", "a church bell", "a sundial", "a weathervane", "a door knocker",
    
    # --- Portraits, Figures & Pop Culture (Expanded) ---
    "a stoic philosopher's face", "a beautiful woman with flowing hair (Art Nouveau style)", "a fierce Viking warrior", "a stoic Native American chief", "a Japanese geisha",
    "a samurai warrior in armor", "a Spartan hoplite", "a Roman centurion", "an Egyptian pharaoh", "Cleopatra", "a dark sorceress", "a wise wizard",
    "an ethereal fairy", "a beautiful mermaid", "a guardian angel", "a grim reaper", "a cyberpunk android", "an astronaut in space", "a 1920s flapper girl",
    "a film noir detective", "a classic movie monster (Frankenstein, Dracula)", "a knight fighting a dragon", "a matador and bull",
    "a pin-up girl from the 1940s", "a rockabilly greaser", "a hippie from the 1960s", "a punk rocker with mohawk", "a gothic vampire",
    "a steampunk inventor", "a Wild West gunslinger", "a medieval monk", "a Renaissance artist", "a Victorian lady", "a pirate captain",
    
    # --- Science, Sci-Fi & Macabre (Expanded) ---
    "a DNA helix", "a diagram of the solar system", "an atom's structure", "a Da Vinci flying machine sketch", "a futuristic cityscape", "a retro rocket ship",
    "a robot with exposed wiring", "an alien creature", "a space shuttle launching", "a post-apocalyptic survivor in a gas mask",
    "a skull with roses growing from it", "a skeleton hand holding a flower", "a gothic cathedral", "a haunted house", "an occult goat head (Baphomet)",
    "alchemical symbols", "a ouija board planchette", "a human spine", "a ribcage with a bird inside", "a gas mask", "a biohazard symbol",
    "a laboratory beaker", "a microscope view", "a circuit board pattern", "a holographic display", "a time machine", "a portal to another dimension",
    "a zombie apocalypse scene", "a vampire's coffin", "a werewolf transformation", "a ghost in chains", "a demon's face", "a witch's cauldron",
    
    # --- Fine Art & Abstract (Expanded) ---
    "a design inspired by Van Gogh's 'Starry Night'", "a cubist portrait", "a surrealist melting clock inspired by Dali", "an M.C. Escher impossible staircase",
    "a stained glass window design", "a rococo ornamental flourish", "a bauhaus geometric design", "abstract ink splatters", "a complex mandala",
    "sacred geometry (Flower of Life, Metatron's Cube)", "a shattered glass effect", "a burning playing card (ace of spades)", "a king and queen chess piece",
    "dice rolling a lucky seven", "a roaring 20s art deco pattern", "barbed wire", "a soundwave pattern", "binary code falling like rain",
    "a Rorschach inkblot", "a Jackson Pollock splatter", "a Mondrian grid", "a Kandinsky abstract", "a Picasso face", "a Warhol pop art",
    
    # --- Cultural & Religious Symbols (New Category) ---
    "a Buddhist wheel of dharma", "a Christian cross with roses", "an Islamic geometric pattern", "a Jewish Star of David", "a Hindu Om symbol",
    "a Sikh Khanda", "a Taoist yin-yang", "a Shinto torii gate", "a Native American medicine wheel", "an African Adinkra symbol",
    "a Celtic cross", "a Norse Mjolnir", "an Egyptian ankh", "a Mayan calendar", "an Aztec sun stone", "a Polynesian tribal pattern",
    
    # --- Food & Culinary (New Category) ---
    "a slice of pizza", "a hamburger stack", "a sushi roll", "a taco with fillings", "a donut with sprinkles", "a coffee cup with steam",
    "a wine bottle and glass", "a beer mug with foam", "a cocktail with umbrella", "a birthday cake with candles", "an ice cream cone",
    "a bunch of grapes", "a pineapple crown", "a watermelon slice", "a strawberry", "a banana", "an apple with bite taken",
    
    # --- Sports & Activities (New Category) ---
    "a soccer ball in net", "a basketball going through hoop", "a baseball and bat", "a football in motion", "a tennis racket and ball",
    "a golf club and ball", "a hockey stick and puck", "a surfboard on wave", "a skateboard in motion", "a bicycle wheel",
    "a motorcycle in action", "a race car speeding", "a mountain climber", "a skier on slope", "a swimmer diving",
    
    # --- Architecture & Landmarks (New Category) ---
    "the Eiffel Tower", "Big Ben clock tower", "the Statue of Liberty", "a Gothic cathedral spire", "a Japanese pagoda",
    "a Greek temple", "a Roman colosseum", "an Egyptian pyramid", "a modern skyscraper", "a rustic log cabin",
    "a lighthouse beam", "a windmill turning", "a bridge spanning water", "a castle on a hill", "a barn in countryside"
]

# Studio Types and Characteristics
studio_types = [
    "modern minimalist", "vintage traditional", "industrial chic", "cozy boutique", "high-end luxury",
    "street art inspired", "clean medical", "artistic bohemian", "retro americana", "gothic dark",
    "bright contemporary", "rustic vintage", "urban loft", "classic traditional", "futuristic modern"
]

# Studio Image Categories
studio_image_categories = {
    "internal": [
        "the main tattooing area with multiple stations", "a close-up of a tattoo chair and equipment setup",
        "the reception and waiting area", "a wall displaying flash art and designs", "the sterilization and prep area",
        "artist workstations with supplies organized", "a consultation room with portfolio books", "the payment counter area"
    ],
    "external": [
        "the storefront with signage and window displays", "the entrance door with studio branding",
        "the building exterior showing the studio location", "street view of the studio neighborhood",
        "the studio's outdoor seating area", "nighttime exterior with neon signs", "the studio's parking area"
    ],
    "working": [
        "an artist tattooing a client's arm", "detailed shot of tattoo machine in action",
        "an artist sketching a custom design", "the consultation process with a client", "an artist preparing stencils",
        "the aftercare instruction process", "an artist organizing their color palette", "the cleaning and setup process"
    ]
}

# ~50 Detailed Body Placements
body_placements = [
    "perfectly centered on the sternum", "as a full sleeve, wrapping the entire arm from shoulder to wrist", "on the inner forearm, a long vertical design",
    "on the outer bicep", "as a shoulder cap piece", "on the back of the hand", "spanning across the knuckles", "on the side of the neck, below the ear",
    "as a large full back piece, from shoulders to waist", "centered on the upper back, between the shoulder blades", "on the front of the thigh, a large vertical piece",
    "wrapping around the calf muscle", "on the shin, facing forward", "as an ornamental piece on the top of the foot", "curving along the collarbone",
    "as a chest piece, spanning from pectoral to pectoral", "on a single pectoral muscle", "on the ribs, following the curve of the body",
    "on the stomach, centered around the navel", "on the oblique, accentuating the waistline", "behind the ear, a small and delicate design",
    "on the back of the neck", "as an underbust or 'chandelier' tattoo", "as a half sleeve on the lower arm", "as a half sleeve on the upper arm",
    "on the hip, curving with the bone", "as a garter-like band around the upper thigh", "on the inner wrist", "on the ankle, like a bracelet",
    "as a 'gauntlet' design on the forearm and hand", "as a throat piece", "as a delicate spine tattoo, running down the vertebrae", "on the shoulder blade",
    "as a face tattoo on the temple", "covering the entire front torso", "as matching pieces on both forearms", "on the inside of the thigh",
    "wrapping around the elbow in a circular pattern", "a small design on the finger", "on the palm of the hand", "on the sole of the foot"
]

# 15+ Descriptive Skin Tones
skin_tones = [
    "on very fair, pale porcelain skin", "on light skin with cool, pink undertones", "on fair skin with warm, yellow undertones",
    "on light skin with a dusting of natural freckles", "on creamy alabaster skin", "on light olive-toned skin", "on golden tan skin",
    "on sun-kissed, slightly bronzed skin", "on medium caramel-brown skin", "on warm, reddish-brown skin", "on rich, medium-brown skin",
    "on cool-toned dark brown skin", "on deep, espresso-toned skin", "on dark, ebony skin with cool undertones", "on very dark, lustrous skin"
]

# 15+ Photographic Framing Styles
framing_styles = [
    "an extreme close-up, focusing on the ink texture and skin pores", "a tight macro shot of the linework", "a medium shot showing the tattoo and the muscle it sits on",
    "a wide environmental shot in a modern tattoo studio", "a straight-on, flat-lay perspective", "a dynamic three-quarter angle view",
    "a shot from a low angle, looking up", "a shot from a high angle, looking down", "a portrait shot where the tattoo is a key feature", "a detail shot with a very shallow depth of field",
    "a candid, lifestyle photograph", "a perfectly centered and symmetrical composition", "an off-center composition following the rule of thirds",
    "a dutch angle for a sense of unease", "a wide shot showing how the tattoo complements the person's physique"
]

# 15+ Professional Lighting Styles
lighting_styles = [
    "lit by soft, diffused studio light from a large softbox", "lit with dramatic, high-contrast chiaroscuro lighting", "using classic Rembrandt lighting with a triangular highlight",
    "lit by a single, hard key light to create sharp shadows", "backlit with a soft rim light to separate the subject from the background",
    "illuminated by warm, golden hour sunlight", "in the cool, blue light of twilight", "lit by vibrant, colorful neon lights", "using cinematic, moody lighting with volumetric haze",
    "a clean, high-key lighting setup with a white background", "a dark, low-key lighting setup with a black background", "lit by the flickering light of a candle",
    "using a ring light for an even, modern look", "natural light from a large window", "hard, direct flash photography style"
]

# Dynamic artistic instructions to be added to the prompt
artistic_directives = [
    "Focus on the ultra-fine linework and delicate stippling.", "Emphasize the bold outlines and saturated color packing, typical of the style.",
    "Pay close attention to the smooth black and grey blending.", "Ensure high contrast with deep blacks and clever use of negative skin space.",
    "Mimic the texture of brushwork and ink washes.", "Render with hyper-realistic detail, capturing skin texture and ink sheen.",
    "Create a powerful composition with clear visual flow.", "The design should have symbolic depth and be instantly readable.",
    "Ensure the design is perfectly tattoo-able with clean, confident lines.", "Highlight the geometric precision and symmetry.",
    "Use a limited color palette for maximum impact.", "Focus on the ornamental details and intricate patterns."
]

# --- HELPER FUNCTIONS ---

def generate_studio_name():
    """Generate a realistic UK tattoo studio name."""
    prefixes = ["Ink", "Black", "Royal", "Electric", "Sacred", "Rebel", "Urban", "Classic", "Modern", "Vintage"]
    suffixes = ["Tattoo", "Ink", "Studio", "Parlour", "Gallery", "Works", "Art", "Collective", "House", "Shop"]
    descriptors = ["Rose", "Skull", "Dragon", "Phoenix", "Crown", "Anchor", "Heart", "Star", "Moon", "Sun"]
    
    style = random.choice(["prefix_suffix", "prefix_descriptor_suffix", "descriptor_suffix"])
    
    if style == "prefix_suffix":
        return f"{random.choice(prefixes)} {random.choice(suffixes)}"
    elif style == "prefix_descriptor_suffix":
        return f"{random.choice(prefixes)} {random.choice(descriptors)} {random.choice(suffixes)}"
    else:
        return f"{random.choice(descriptors)} {random.choice(suffixes)}"

def generate_uk_location():
    """Generate a realistic UK location."""
    uk_cities = [
        "London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Sheffield", "Bristol", "Newcastle",
        "Nottingham", "Brighton", "Edinburgh", "Glasgow", "Cardiff", "Belfast", "Oxford", "Cambridge",
        "Bath", "York", "Canterbury", "Chester", "Norwich", "Exeter", "Plymouth", "Portsmouth"
    ]
    return random.choice(uk_cities)

def create_studio_prompt(category, description, studio_name, location, studio_type):
    """Create a detailed prompt for studio image generation."""
    base_prompts = {
        "internal": f"Professional interior photograph of '{studio_name}', a {studio_type} tattoo studio in {location}. {description}. Clean, well-lit space with professional tattoo equipment, comfortable seating, and hygienic surfaces. Modern lighting, organized supplies, and a welcoming atmosphere.",
        
        "external": f"Professional exterior photograph of '{studio_name}', a {studio_type} tattoo studio located in {location}. {description}. Clear signage, inviting storefront, urban UK street setting with typical British architecture.",
        
        "working": f"Professional documentary-style photograph inside '{studio_name}', a {studio_type} tattoo studio in {location}. {description}. Professional tattoo artist at work, proper safety protocols, clean environment, focused artistic process."
    }
    
    technical_specs = "Shot with professional camera, excellent lighting, high detail, commercial photography quality, suitable for business portfolio and social media marketing."
    
    return f"{base_prompts[category]} {technical_specs}"

def create_tattoo_prompt_with_imagen4(style, subject, placement, skin, framing, lighting, directives):
    """Create an optimized prompt for Imagen 4 tattoo generation."""
    return (
        f"Professional tattoo portfolio photograph: A '{style}' style tattoo of '{subject}', positioned {placement} {skin}. "
        f"Photography: {framing}, {lighting}. {directives} "
        f"High-resolution, sharp focus, professional tattoo photography, suitable for artist portfolio and social media. "
        f"Clean execution, proper contrast, vibrant colors where appropriate."
    )

# --- MAIN GENERATION FUNCTIONS ---

def generate_studio_images():
    """Generate internal, external, and working area images for tattoo studios."""
    print(f"Generating images for {NUM_STUDIOS} tattoo studios...")
    
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    model = ImageGenerationModel.from_pretrained("imagegeneration@006")
    
    studios_dir = os.path.join(OUTPUT_DIR, "studios")
    if not os.path.exists(studios_dir):
        os.makedirs(studios_dir)
    
    studio_metadata = []
    
    for studio_idx in range(NUM_STUDIOS):
        try:
            # Generate studio characteristics
            studio_name = generate_studio_name()
            location = generate_uk_location()
            studio_type = random.choice(studio_types)
            
            # Create studio directory
            safe_studio_name = studio_name.replace(" ", "_").replace("'", "").lower()
            studio_dir = os.path.join(studios_dir, f"{safe_studio_name}_{studio_idx+1:03d}")
            if not os.path.exists(studio_dir):
                os.makedirs(studio_dir)
            
            studio_info = {
                "name": studio_name,
                "location": location,
                "type": studio_type,
                "images": {"internal": [], "external": [], "working": []}
            }
            
            print(f"[Studio {studio_idx+1}/{NUM_STUDIOS}] Generating images for '{studio_name}' in {location}")
            
            # Generate 2 images for each category
            for category in ["internal", "external", "working"]:
                for img_idx in range(2):
                    description = random.choice(studio_image_categories[category])
                    prompt = create_studio_prompt(category, description, studio_name, location, studio_type)
                    
                    filename = f"{category}_{img_idx+1:02d}_{safe_studio_name}.png"
                    output_path = os.path.join(studio_dir, filename)
                    
                    if os.path.exists(output_path):
                        print(f"  -> Skipping existing: {filename}")
                        continue
                    
                    print(f"  -> Generating {category} image {img_idx+1}/2...")
                    
                    # Generate image with Imagen 4 settings
                    response = model.generate_images(
                        prompt=prompt,
                        number_of_images=1,
                        aspect_ratio=IMAGE_SETTINGS["studio_images"]["aspect_ratio"],
                        safety_filter_level=IMAGE_SETTINGS["studio_images"]["safety_filter_level"],
                        person_generation=IMAGE_SETTINGS["studio_images"]["person_generation"]
                    )
                    
                    response[0].save(location=output_path)
                    studio_info["images"][category].append(filename)
                    
                    time.sleep(1)  # Rate limiting
            
            studio_metadata.append(studio_info)
            
            # Save studio metadata
            metadata_path = os.path.join(studio_dir, "studio_info.json")
            with open(metadata_path, 'w') as f:
                json.dump(studio_info, f, indent=2)
                
        except Exception as e:
            print(f"Error generating studio {studio_idx+1}: {e}")
            time.sleep(5)
    
    # Save complete studio metadata
    metadata_path = os.path.join(studios_dir, "all_studios_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(studio_metadata, f, indent=2)
    
    print(f"Studio image generation complete! Generated images for {len(studio_metadata)} studios.")
    return studio_metadata

def generate_tattoo_images_final():
    """Main function to generate and save tattoo portfolio images."""
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    model = ImageGenerationModel.from_pretrained("imagegeneration@006")

    tattoos_dir = os.path.join(OUTPUT_DIR, "tattoos")
    if not os.path.exists(tattoos_dir):
        os.makedirs(tattoos_dir)
        print(f"Created tattoos directory: {tattoos_dir}")

    print(f"Starting tattoo portfolio generation of {NUM_TATTOO_IMAGES} images...")

    for i in range(NUM_TATTOO_IMAGES):
        try:
            # --- DYNAMIC COMPONENT SELECTION ---
            style = random.choice(tattoo_styles)
            subject = random.choice(tattoo_subjects)
            placement = random.choice(body_placements)
            skin = random.choice(skin_tones)
            framing = random.choice(framing_styles)
            lighting = random.choice(lighting_styles)
            directives = " ".join(random.sample(artistic_directives, k=random.randint(1, 2)))

            # --- OPTIMIZED PROMPT FOR IMAGEN 4 ---
            prompt = create_tattoo_prompt_with_imagen4(style, subject, placement, skin, framing, lighting, directives)
            
            # --- FILE AND FOLDER MANAGEMENT ---
            style_dir = os.path.join(tattoos_dir, style)
            if not os.path.exists(style_dir):
                os.makedirs(style_dir)

            safe_subject = subject.replace(" ", "_").replace("'", "").split(",")[0].lower()[:30]  # Limit length
            filename = f"{style}_{safe_subject}_{i+1:04d}.png"
            output_path = os.path.join(style_dir, filename)
            
            if os.path.exists(output_path):
                print(f"[{i+1}/{NUM_TATTOO_IMAGES}] Skipping existing file: {filename}")
                continue

            print(f"[{i+1}/{NUM_TATTOO_IMAGES}] Style: {style} | Generating: {subject[:50]}...")

            # --- API CALL WITH IMAGEN 4 SETTINGS ---
            response = model.generate_images(
                prompt=prompt,
                number_of_images=1,
                aspect_ratio=IMAGE_SETTINGS["tattoo_portfolio"]["aspect_ratio"],
                safety_filter_level=IMAGE_SETTINGS["tattoo_portfolio"]["safety_filter_level"],
                person_generation=IMAGE_SETTINGS["tattoo_portfolio"]["person_generation"]
            )
            
            response[0].save(location=output_path)
            print(f"    -> Saved to {output_path}")
            time.sleep(1.5)  # API rate-limiting delay

        except Exception as e:
            print(f"Error occurred for tattoo {i+1}: {e}")
            time.sleep(5)

    print(f"\nTattoo portfolio generation complete! Generated {NUM_TATTOO_IMAGES} images.")

def generate_all_content():
    """Main function to generate both tattoo portfolio and studio images."""
    print("=" * 60)
    print("TATTOO DIRECTORY CONTENT GENERATION")
    print("=" * 60)
    print(f"Configuration:")
    print(f"  - Project ID: {PROJECT_ID}")
    print(f"  - Location: {LOCATION}")
    print(f"  - Output Directory: {OUTPUT_DIR}")
    print(f"  - Tattoo Images: {NUM_TATTOO_IMAGES}")
    print(f"  - Studios: {NUM_STUDIOS}")
    print(f"  - Images per Studio: {IMAGES_PER_STUDIO}")
    print("=" * 60)
    
    # Create main output directory
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created main directory: {OUTPUT_DIR}")
    
    try:
        # Generate studio images first (smaller dataset)
        print("\n🏢 PHASE 1: Generating Studio Images")
        print("-" * 40)
        studio_metadata = generate_studio_images()
        
        # Generate tattoo portfolio images
        print(f"\n🎨 PHASE 2: Generating Tattoo Portfolio Images")
        print("-" * 40)
        generate_tattoo_images_final()
        
        # Generate summary report
        print(f"\n📊 GENERATION SUMMARY")
        print("-" * 40)
        print(f"✅ Studios generated: {len(studio_metadata) if 'studio_metadata' in locals() else 0}")
        print(f"✅ Expected tattoo images: {NUM_TATTOO_IMAGES}")
        print(f"✅ Total expected images: {NUM_STUDIOS * IMAGES_PER_STUDIO + NUM_TATTOO_IMAGES}")
        print(f"📁 Output directory: {OUTPUT_DIR}")
        
        # Save generation metadata
        generation_info = {
            "generation_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "configuration": {
                "tattoo_images": NUM_TATTOO_IMAGES,
                "studios": NUM_STUDIOS,
                "images_per_studio": IMAGES_PER_STUDIO,
                "total_expected": NUM_STUDIOS * IMAGES_PER_STUDIO + NUM_TATTOO_IMAGES
            },
            "image_settings": IMAGE_SETTINGS,
            "studios_generated": len(studio_metadata) if 'studio_metadata' in locals() else 0
        }
        
        metadata_path = os.path.join(OUTPUT_DIR, "generation_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(generation_info, f, indent=2)
        
        print(f"📋 Generation metadata saved to: {metadata_path}")
        print("\n🎉 ALL CONTENT GENERATION COMPLETE!")
        
    except Exception as e:
        print(f"\n❌ Error in main generation process: {e}")
        raise


if __name__ == "__main__":
    # Run the complete content generation
    generate_all_content()