import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
import random
import os
import time

# --- CONFIGURATION ---
PROJECT_ID = "your-gcp-project-id"  # <--- REPLACE with your Google Cloud Project ID
LOCATION = "us-central1"           # <--- REPLACE with your desired region if needed
OUTPUT_DIR = "generated_tattoos_final" # Main directory to save the images
NUM_IMAGES_TO_GENERATE = 1000       # Total number of images you want (feel free to increase)

# --- PROMPT COMPONENTS (FINAL EXPANSION) ---

# Your list of 22 tattoo styles
tattoo_styles = [
    "old_school", "traditional", "new_school", "neo_traditional", "tribal",
    "blackwork", "dotwork", "geometric", "japanese", "lettering",
    "biomechanical", "watercolour", "floral", "fineline", "realism",
    "minimalist", "surrealism", "portrait", "sketch", "illustrative",
    "ornamental", "trash_polka"
]

# 400+ Tattoo Subjects for Maximum Variety
tattoo_subjects = [
    # --- Animals & Creatures (Expanded) ---
    "a majestic lion's face", "a howling wolf silhouette", "a roaring grizzly bear", "a coiled rattlesnake", "an octopus wrapping a skull",
    "a soaring eagle", "a tiger creeping through bamboo", "a cunning red fox in snow", "a noble stag with large antlers", "an elephant adorned with jewels",
    "a powerful rhino", "a mythical dragon", "a rising phoenix", "a griffin", "a kraken attacking a ship", "a kitsune with nine tails",
    "a detailed scarab beetle", "a monarch butterfly", "a death's head moth", "a hummingbird sipping nectar", "a wise old owl with spectacles", "playful dolphins",
    "a great white shark", "a sea turtle with a galaxy on its shell", "a koi fish swimming upstream", "a pair of koi fish in a yin-yang", "a scorpion",
    "a spider in its web", "a honeybee on a honeycomb", "a panther", "a cheetah", "a galloping horse", "a ram's skull", "a bull's skull with horns",
    "a raven on a branch", "a peacock displaying its feathers", "a chameleon", "a T-Rex skeleton", "a majestic whale", "a seahorse", "a jellyfish", "a bat in flight", "a sloth hanging from a branch", "a panda eating bamboo", "a lemur",
    # --- Mythology, Folklore & Gods ---
    "Medusa with snakes for hair", "Zeus, king of the gods", "Poseidon with his trident", "Anubis, the Egyptian god", "Odin with his ravens Huginn and Muninn",
    "Thor with his hammer Mjolnir", "Loki, the trickster god", "a Valkyrie with a sword and shield", "a Centaur archer", "a Minotaur in a labyrinth",
    "Icarus with melting wings", "Atlas holding the celestial sphere", "a Siren luring sailors", "a Chimera", "a Hydra with multiple heads",
    "Cthulhu rising from the depths", "a Japanese Oni mask", "a Tengu (crow-like goblin)", "a Raijin (god of thunder) beating his drums",
    "Ganesha", "Shiva the destroyer", "Kali with a necklace of skulls", "a powerful Djinn emerging from a lamp", "a Slavic Leshy (forest spirit)",
    # --- Nature & Flora (Expanded) ---
    "a single blooming rose", "a bouquet of wildflowers", "a lotus flower", "a sunflower", "a cherry blossom branch", "a venus flytrap",
    "a mighty oak tree", "a weeping willow", "a dense pine forest", "a mountain range landscape", "a powerful ocean wave", "a serene lake scene",
    "a lightning strike", "a swirling tornado", "the phases of the moon", "a solar eclipse", "the sun and moon together", "a galaxy spiral",
    "a nebula", "planet Saturn with its rings", "a crystalline structure", "a geode", "bioluminescent mushrooms on a log", "a fern leaf",
    "a pitcher plant", "a bonsai tree", "a wreath of laurel leaves", "a landscape inside a bottle", "a volcano erupting", "the Aurora Borealis",
    # --- Objects & Symbols (Expanded) ---
    "a classic anchor entwined with rope", "a ship's wheel", "a vintage pirate ship on a stormy sea", "a lighthouse on a cliff", "a detailed compass rose", "an old world map",
    "a melting hourglass", "a vintage clock with roman numerals", "gears and cogs", "a skeleton key", "a padlock and key", "a dagger piercing a heart",
    "a katana sword", "a shield and swords", "a bow and arrow", "a revolver pistol", "a lantern", "a candle", "a book with pages turning",
    "a feather", "an anatomical heart", "a hyper-detailed human skull", "a human skeleton", "a plague doctor mask", "a Venetian mask",
    "a dreamcatcher", "a hamsa hand", "an all-seeing eye in a pyramid", "the ouroboros serpent", "a Celtic knot", "a Viking rune compass (Vegvisir)",
    "a triquetra", "a pentagram", "a caduceus", "the scales of justice", "a crown", "a violin", "a guitar", "a retro microphone",
    "a classic car", "a motorcycle engine", "a knight's helmet", "a samurai mask", "a pocket watch", "a straight razor", "a quill and inkpot",
    "a potion bottle with swirling liquid", "a wizard's staff", "a crystal ball", "tarot cards (The Fool, The Magician, Death)", "a telescope",
    # --- Portraits, Figures & Pop Culture ---
    "a stoic philosopher's face", "a beautiful woman with flowing hair (Art Nouveau style)", "a fierce Viking warrior", "a stoic Native American chief", "a Japanese geisha",
    "a samurai warrior in armor", "a Spartan hoplite", "a Roman centurion", "an Egyptian pharaoh", "Cleopatra", "a dark sorceress", "a wise wizard",
    "an ethereal fairy", "a beautiful mermaid", "a guardian angel", "a grim reaper", "a cyberpunk android", "an astronaut in space", "a 1920s flapper girl",
    "a film noir detective", "a classic movie monster (Frankenstein, Dracula)", "a knight fighting a dragon", "a matador and bull",
    # --- Science, Sci-Fi & Macabre ---
    "a DNA helix", "a diagram of the solar system", "an atom's structure", "a Da Vinci flying machine sketch", "a futuristic cityscape", "a retro rocket ship",
    "a robot with exposed wiring", "an alien creature", "a space shuttle launching", "a post-apocalyptic survivor in a gas mask",
    "a skull with roses growing from it", "a skeleton hand holding a flower", "a gothic cathedral", "a haunted house", "an occult goat head (Baphomet)",
    "alchemical symbols", "a ouija board planchette", "a human spine", "a ribcage with a bird inside", "a gas mask", "a biohazard symbol",
    # --- Fine Art & Abstract ---
    "a design inspired by Van Gogh's 'Starry Night'", "a cubist portrait", "a surrealist melting clock inspired by Dali", "an M.C. Escher impossible staircase",
    "a stained glass window design", "a rococo ornamental flourish", "a bauhaus geometric design", "abstract ink splatters", "a complex mandala",
    "sacred geometry (Flower of Life, Metatron's Cube)", "a shattered glass effect", "a burning playing card (ace of spades)", "a king and queen chess piece",
    "dice rolling a lucky seven", "a roaring 20s art deco pattern", "barbed wire", "a soundwave pattern", "binary code falling like rain"
]

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

# --- SCRIPT LOGIC ---

def generate_tattoo_images_final():
    """Main function to generate and save tattoo images."""
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    model = ImageGenerationModel.from_pretrained("imagegeneration@006")

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created base directory: {OUTPUT_DIR}")

    print(f"Starting FINAL bulk generation of {NUM_IMAGES_TO_GENERATE} images...")

    for i in range(NUM_IMAGES_TO_GENERATE):
        try:
            # --- DYNAMIC COMPONENT SELECTION ---
            style = random.choice(tattoo_styles)
            subject = random.choice(tattoo_subjects)
            placement = random.choice(body_placements)
            skin = random.choice(skin_tones)
            framing = random.choice(framing_styles)
            lighting = random.choice(lighting_styles)
            directives = " ".join(random.sample(artistic_directives, k=random.randint(1, 2)))

            # --- EXPERT PROMPT CONSTRUCTION ---
            prompt = (
                f"Act as an expert AI tattoo concept artist and photo-realistic visual designer. "
                f"Render a rich, stylistically accurate, and hyper-detailed photo-realistic tattoo image. "
                f"Theme: A '{style}' style tattoo of '{subject}', seen {placement} {skin}. "
                f"Visuals: A {framing}, {lighting}. {directives} "
                f"The final image must be a balanced, high-contrast photograph suitable for a real-world tattoo portfolio."
            )
            
            # --- FILE AND FOLDER MANAGEMENT ---
            style_dir = os.path.join(OUTPUT_DIR, style)
            if not os.path.exists(style_dir):
                os.makedirs(style_dir)

            safe_subject = subject.replace(" ", "_").split(",")[0].lower()
            filename = f"{style}_{safe_subject}_{i+1:04d}.png"
            output_path = os.path.join(style_dir, filename)
            
            if os.path.exists(output_path):
                print(f"[{i+1}/{NUM_IMAGES_TO_GENERATE}] Skipping existing file: {filename}")
                continue

            print(f"[{i+1}/{NUM_IMAGES_TO_GENERATE}] Style: {style} | Generating: {subject}...")

            # --- API CALL AND IMAGE SAVING ---
            response = model.generate_images(prompt=prompt, number_of_images=1)
            response[0].save(location=output_path)
            
            print(f"--> Saved to {output_path}")
            time.sleep(2)  # API rate-limiting delay

        except Exception as e:
            print(f"!!!!!! An error occurred for item {i+1}: {e}")
            time.sleep(10)

    print("\nFinal bulk generation complete!")


if __name__ == "__main__":
    generate_tattoo_images_final()