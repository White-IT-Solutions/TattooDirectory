"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '../../../design-system/components/ui/Card/Card';
import Badge from '../../../design-system/components/ui/Badge/Badge';
import Button from '../../../design-system/components/ui/Button/Button';
import { Skeleton } from '../../../design-system/components/ui/Skeleton/Skeleton';
import Breadcrumb from '../../../design-system/components/ui/Breadcrumb/Breadcrumb';

// Mock style data - in a real app this would come from an API
const mockStylesData = {
  traditional: {
    styleId: 'traditional',
    styleName: 'Traditional',
    description: 'Bold, iconic tattoo style featuring thick black outlines, solid colors, and classic imagery. Traditional tattoos are known for their timeless appeal and strong visual impact. This style emerged from the maritime culture and has become one of the most recognizable and enduring tattoo styles in the world.',
    longDescription: 'Traditional tattoos, also known as "Old School" or "American Traditional," represent the foundation of modern Western tattooing. This style is characterized by its bold, black outlines and a limited but vibrant color palette. The imagery is iconic and symbolic, often featuring nautical themes, animals, and classic Americana. Traditional tattoos are designed to age well, with their bold lines and solid colors maintaining their clarity over time.',
    characteristics: [
      'Bold black outlines',
      'Solid color fills',
      'Limited color palette',
      'Iconic imagery',
      'High contrast',
      'Symbolic meaning',
      'Timeless appeal',
      'Ages well over time'
    ],
    popularMotifs: [
      'Anchors',
      'Roses',
      'Eagles',
      'Skulls',
      'Pin-up girls',
      'Swallows',
      'Hearts',
      'Daggers',
      'Ships',
      'Lighthouses',
      'Banners with text',
      'Panthers'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#FF0000', name: 'Red' },
      { color: '#00FF00', name: 'Green' },
      { color: '#0000FF', name: 'Blue' },
      { color: '#FFFF00', name: 'Yellow' },
      { color: '#FFA500', name: 'Orange' }
    ],
    difficulty: 'beginner',
    timeOrigin: 'Early 1900s - American and European sailors',
    historicalContext: 'Traditional tattoos originated in the early 20th century among sailors and military personnel. The style was popularized by legendary tattoo artists like Sailor Jerry (Norman Collins) and Bert Grimm. These tattoos served as badges of honor, telling stories of travels, battles, and personal beliefs. The bold, simple designs were practical for the limited equipment and techniques available at the time.',
    aliases: ['Old School', 'American Traditional', 'Classic', 'Sailor Jerry Style'],
    portfolioImages: [
      {
        url: '/images/styles/traditional-anchor.jpg',
        description: 'Classic anchor with rope and banner',
        artist: 'Traditional Mike',
        tags: ['anchor', 'nautical', 'banner']
      },
      {
        url: '/images/styles/traditional-rose.jpg',
        description: 'Bold red rose with thorns',
        artist: 'Old School Sarah',
        tags: ['rose', 'flower', 'red']
      },
      {
        url: '/images/styles/traditional-eagle.jpg',
        description: 'American eagle with spread wings',
        artist: 'Patriot Pete',
        tags: ['eagle', 'american', 'patriotic']
      },
      {
        url: '/images/styles/traditional-skull.jpg',
        description: 'Classic skull with crossbones',
        artist: 'Bones Betty',
        tags: ['skull', 'crossbones', 'death']
      },
      {
        url: '/images/styles/traditional-swallow.jpg',
        description: 'Swallow in flight with banner',
        artist: 'Sailor Sam',
        tags: ['swallow', 'bird', 'flight']
      },
      {
        url: '/images/styles/traditional-heart.jpg',
        description: 'Sacred heart with flames',
        artist: 'Heart Harry',
        tags: ['heart', 'sacred', 'flames']
      }
    ],
    relatedStyles: ['neo-traditional', 'americana', 'nautical'],
    technicalNotes: [
      'Requires steady hand for bold outlines',
      'Color saturation is key',
      'Proper needle grouping essential',
      'Bold lines prevent aging issues',
      'Solid color packing technique'
    ]
  },
  realism: {
    styleId: 'realism',
    styleName: 'Realism',
    description: 'Highly detailed tattoo style that aims to replicate photographic quality. Realism tattoos showcase incredible technical skill and attention to detail, creating lifelike representations of subjects.',
    longDescription: 'Realism in tattooing represents the pinnacle of technical achievement, requiring years of practice and an exceptional understanding of light, shadow, and form. This style emerged as tattoo equipment and techniques advanced, allowing artists to create incredibly detailed and lifelike images. Realism tattoos can be done in black and grey or full color, each presenting unique challenges and opportunities for artistic expression.',
    characteristics: [
      'Photographic quality',
      'Fine details',
      'Smooth gradients',
      'Realistic proportions',
      'Complex shading',
      'Depth and dimension',
      'Lifelike textures',
      'Precise execution'
    ],
    popularMotifs: [
      'Portraits',
      'Animals',
      'Flowers',
      'Landscapes',
      'Objects',
      'Eyes',
      'Hands',
      'Wildlife',
      'Celebrities',
      'Family members',
      'Pets',
      'Nature scenes'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#808080', name: 'Grey' },
      { color: '#C0C0C0', name: 'Light Grey' },
      { color: '#8B4513', name: 'Brown' },
      { color: '#DEB887', name: 'Skin Tone' },
      { color: '#F5DEB3', name: 'Light Skin' }
    ],
    difficulty: 'advanced',
    timeOrigin: '1980s - Evolution of tattoo artistry',
    historicalContext: 'Realism in tattooing became possible with the advancement of tattoo machines and needle technology in the 1980s and 1990s. Artists like Bob Tyrrell and Paul Booth pioneered techniques that allowed for incredibly detailed work. The style gained popularity as tattoos became more mainstream and clients sought more sophisticated artwork.',
    aliases: ['Photo-realism', 'Hyperrealism', 'Realistic', 'Portrait work'],
    portfolioImages: [
      {
        url: '/images/styles/realism-portrait.jpg',
        description: 'Photorealistic portrait of a woman',
        artist: 'Realism Rob',
        tags: ['portrait', 'woman', 'photorealistic']
      },
      {
        url: '/images/styles/realism-tiger.jpg',
        description: 'Detailed tiger face with piercing eyes',
        artist: 'Wildlife Wendy',
        tags: ['tiger', 'animal', 'eyes']
      },
      {
        url: '/images/styles/realism-rose.jpg',
        description: 'Hyperrealistic rose with water droplets',
        artist: 'Nature Nick',
        tags: ['rose', 'flower', 'water']
      },
      {
        url: '/images/styles/realism-eye.jpg',
        description: 'Incredibly detailed human eye',
        artist: 'Detail Dan',
        tags: ['eye', 'human', 'detail']
      }
    ],
    relatedStyles: ['black-and-grey', 'portrait', 'surrealism'],
    technicalNotes: [
      'Requires advanced shading techniques',
      'Multiple needle configurations needed',
      'Extensive reference material essential',
      'Long session times typical',
      'Proper healing crucial for detail retention'
    ]
  },
  blackwork: {
    styleId: 'blackwork',
    styleName: 'Blackwork',
    description: 'Bold tattoo style using only black ink to create striking designs. Blackwork emphasizes contrast, patterns, and negative space to create powerful visual impact.',
    longDescription: 'Blackwork represents a return to the fundamental power of black ink in tattooing. This style encompasses everything from bold tribal designs to intricate geometric patterns and modern interpretations of ancient art forms. The absence of color forces artists to rely on composition, contrast, and technique to create compelling artwork.',
    characteristics: [
      'Black ink only',
      'Bold patterns',
      'Geometric shapes',
      'Negative space usage',
      'High contrast',
      'Strong composition',
      'Pattern work',
      'Solid black areas'
    ],
    popularMotifs: [
      'Geometric patterns',
      'Mandalas',
      'Tribal designs',
      'Silhouettes',
      'Abstract shapes',
      'Dotwork',
      'Ornamental designs',
      'Sacred geometry',
      'Blackout sections',
      'Linework',
      'Pattern fills',
      'Negative space art'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' }
    ],
    difficulty: 'intermediate',
    timeOrigin: '1990s - Modern interpretation of tribal art',
    historicalContext: 'While black tattoos have ancient roots in tribal cultures worldwide, modern blackwork emerged in the 1990s as artists began exploring the artistic possibilities of working exclusively in black ink. This style draws inspiration from tribal art, woodcut prints, and contemporary graphic design.',
    aliases: ['Black and Grey', 'Tribal Modern', 'Geometric', 'Ornamental'],
    portfolioImages: [
      {
        url: '/images/styles/blackwork-mandala.jpg',
        description: 'Intricate mandala with geometric patterns',
        artist: 'Pattern Paul',
        tags: ['mandala', 'geometric', 'pattern']
      },
      {
        url: '/images/styles/blackwork-tribal.jpg',
        description: 'Modern tribal design with bold lines',
        artist: 'Tribal Tom',
        tags: ['tribal', 'bold', 'modern']
      },
      {
        url: '/images/styles/blackwork-geometric.jpg',
        description: 'Complex geometric pattern work',
        artist: 'Geo Grace',
        tags: ['geometric', 'pattern', 'complex']
      },
      {
        url: '/images/styles/blackwork-dotwork.jpg',
        description: 'Detailed dotwork mandala',
        artist: 'Dot Dorothy',
        tags: ['dotwork', 'mandala', 'detailed']
      }
    ],
    relatedStyles: ['tribal', 'geometric', 'dotwork'],
    technicalNotes: [
      'Solid black packing technique',
      'Precise line work essential',
      'Pattern consistency crucial',
      'Negative space planning important',
      'Bold execution prevents fading'
    ]
  },
  watercolor: {
    styleId: 'watercolor',
    styleName: 'Watercolor',
    description: 'Artistic tattoo style that mimics watercolor painting techniques with flowing colors, soft edges, and painterly effects.',
    longDescription: 'Watercolor tattoos represent a modern artistic approach that brings the fluidity and spontaneity of watercolor painting to skin. This style emerged in the 2000s as tattoo artists began experimenting with techniques that could replicate the soft, flowing nature of watercolor art. The style often features minimal or no outlines, allowing colors to blend and flow naturally.',
    characteristics: [
      'Soft color blending',
      'Paint-like effects',
      'Flowing transitions',
      'Minimal outlines',
      'Artistic freedom',
      'Gradient effects',
      'Splatter techniques',
      'Organic shapes'
    ],
    popularMotifs: [
      'Flowers',
      'Animals',
      'Abstract art',
      'Splashes',
      'Brushstrokes',
      'Nature scenes',
      'Butterflies',
      'Birds',
      'Landscapes',
      'Dreamcatchers',
      'Feathers',
      'Trees'
    ],
    colorPalette: [
      { color: '#FF69B4', name: 'Hot Pink' },
      { color: '#87CEEB', name: 'Sky Blue' },
      { color: '#98FB98', name: 'Pale Green' },
      { color: '#DDA0DD', name: 'Plum' },
      { color: '#F0E68C', name: 'Khaki' },
      { color: '#FFA07A', name: 'Light Salmon' }
    ],
    difficulty: 'advanced',
    timeOrigin: '2000s - Contemporary tattoo innovation',
    historicalContext: 'Watercolor tattoos emerged in the early 2000s as tattoo artists began pushing the boundaries of traditional techniques. Artists like Amanda Wachob and Koray Karagözler pioneered this style, drawing inspiration from contemporary watercolor painting and abstract art. The style gained popularity through social media, where its photogenic qualities made it highly shareable.',
    aliases: ['Painterly', 'Artistic', 'Watercolour', 'Abstract'],
    portfolioImages: [
      {
        url: '/images/styles/watercolor-flower.jpg',
        description: 'Watercolor rose with paint splashes',
        artist: 'Watercolor Wendy',
        tags: ['rose', 'flower', 'splashes']
      },
      {
        url: '/images/styles/watercolor-bird.jpg',
        description: 'Abstract hummingbird in watercolor style',
        artist: 'Paint Pete',
        tags: ['bird', 'hummingbird', 'abstract']
      },
      {
        url: '/images/styles/watercolor-butterfly.jpg',
        description: 'Colorful butterfly with paint effects',
        artist: 'Color Carol',
        tags: ['butterfly', 'colorful', 'paint']
      },
      {
        url: '/images/styles/watercolor-tree.jpg',
        description: 'Watercolor tree with flowing colors',
        artist: 'Nature Nick',
        tags: ['tree', 'nature', 'flowing']
      }
    ],
    relatedStyles: ['abstract', 'painterly', 'contemporary'],
    technicalNotes: [
      'Requires advanced color theory knowledge',
      'Soft shading techniques essential',
      'Color blending skills crucial',
      'Minimal outline work',
      'Proper color saturation important'
    ]
  },
  geometric: {
    styleId: 'geometric',
    styleName: 'Geometric',
    description: 'Modern tattoo style featuring precise geometric shapes, patterns, and mathematical designs. Emphasizes symmetry and clean lines.',
    longDescription: 'Geometric tattoos represent the intersection of mathematics and art, creating designs that are both visually striking and intellectually satisfying. This style draws inspiration from sacred geometry, architectural elements, and mathematical principles. The precision required makes it a technically demanding style that showcases an artist\'s skill in creating perfect lines and symmetrical patterns.',
    characteristics: [
      'Precise lines',
      'Geometric shapes',
      'Symmetrical patterns',
      'Mathematical precision',
      'Clean execution',
      'Sacred geometry',
      'Architectural elements',
      'Perfect symmetry'
    ],
    popularMotifs: [
      'Sacred geometry',
      'Mandalas',
      'Polygons',
      'Fractals',
      'Tessellations',
      'Abstract patterns',
      'Hexagons',
      'Triangles',
      'Circles',
      'Spirals',
      'Cubes',
      'Polyhedrons'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#FF0000', name: 'Red' },
      { color: '#0000FF', name: 'Blue' },
      { color: '#FFD700', name: 'Gold' },
      { color: '#800080', name: 'Purple' },
      { color: '#008000', name: 'Green' }
    ],
    difficulty: 'intermediate',
    timeOrigin: '2010s - Contemporary geometric art movement',
    historicalContext: 'Geometric tattoos gained popularity in the 2010s as part of a broader movement toward minimalism and precision in art. The style draws from ancient sacred geometry traditions while incorporating modern design principles. Social media platforms like Instagram helped popularize the style, with its clean, photogenic designs appealing to a new generation of tattoo enthusiasts.',
    aliases: ['Sacred Geometry', 'Mathematical', 'Precision', 'Architectural'],
    portfolioImages: [
      {
        url: '/images/styles/geometric-mandala.jpg',
        description: 'Intricate geometric mandala design',
        artist: 'Geo Grace',
        tags: ['mandala', 'geometric', 'intricate']
      },
      {
        url: '/images/styles/geometric-triangle.jpg',
        description: 'Sacred geometry triangle composition',
        artist: 'Sacred Sam',
        tags: ['triangle', 'sacred', 'composition']
      },
      {
        url: '/images/styles/geometric-hexagon.jpg',
        description: 'Hexagonal pattern with fine details',
        artist: 'Pattern Paul',
        tags: ['hexagon', 'pattern', 'details']
      },
      {
        url: '/images/styles/geometric-spiral.jpg',
        description: 'Mathematical spiral with geometric elements',
        artist: 'Math Mike',
        tags: ['spiral', 'mathematical', 'elements']
      }
    ],
    relatedStyles: ['minimalist', 'blackwork', 'dotwork'],
    technicalNotes: [
      'Requires steady hand for straight lines',
      'Compass and ruler precision needed',
      'Symmetry is crucial',
      'Planning and measurement essential',
      'Clean line work prevents aging issues'
    ]
  },
  minimalist: {
    styleId: 'minimalist',
    styleName: 'Minimalist',
    description: 'Simple, clean tattoo style focusing on essential elements. Minimalist tattoos use fine lines and subtle details to create elegant designs.',
    longDescription: 'Minimalist tattoos embody the "less is more" philosophy, stripping designs down to their essential elements. This style gained popularity in the 2010s as part of a broader cultural shift toward minimalism. The challenge lies in creating meaningful, impactful designs using the fewest possible elements, requiring artists to master the art of restraint and precision.',
    characteristics: [
      'Fine lines',
      'Simple designs',
      'Minimal detail',
      'Clean execution',
      'Subtle elegance',
      'Essential elements only',
      'Negative space usage',
      'Delicate appearance'
    ],
    popularMotifs: [
      'Line art',
      'Small symbols',
      'Simple flowers',
      'Geometric shapes',
      'Text',
      'Tiny animals',
      'Arrows',
      'Hearts',
      'Stars',
      'Moons',
      'Mountains',
      'Waves'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#808080', name: 'Grey' }
    ],
    difficulty: 'beginner',
    timeOrigin: '2010s - Modern simplicity movement',
    historicalContext: 'Minimalist tattoos emerged alongside the broader minimalism movement in design and lifestyle. Influenced by Scandinavian design principles and the rise of social media, these tattoos appealed to people wanting subtle, elegant body art. The style became particularly popular among first-time tattoo recipients and professionals seeking discrete tattoos.',
    aliases: ['Fine Line', 'Simple', 'Delicate', 'Subtle'],
    portfolioImages: [
      {
        url: '/images/styles/minimalist-line.jpg',
        description: 'Simple line art mountain range',
        artist: 'Simple Sue',
        tags: ['line art', 'mountain', 'simple']
      },
      {
        url: '/images/styles/minimalist-flower.jpg',
        description: 'Delicate single-line flower',
        artist: 'Delicate Dan',
        tags: ['flower', 'delicate', 'single-line']
      },
      {
        url: '/images/styles/minimalist-symbol.jpg',
        description: 'Small meaningful symbol',
        artist: 'Symbol Sally',
        tags: ['symbol', 'small', 'meaningful']
      },
      {
        url: '/images/styles/minimalist-text.jpg',
        description: 'Clean typography design',
        artist: 'Type Tom',
        tags: ['typography', 'clean', 'text']
      }
    ],
    relatedStyles: ['fine-line', 'geometric', 'contemporary'],
    technicalNotes: [
      'Requires very steady hand',
      'Fine needle work essential',
      'Precision in simple forms',
      'Clean healing important',
      'Less room for error correction'
    ]
  },
  'neo-traditional': {
    styleId: 'neo-traditional',
    styleName: 'Neo-Traditional',
    description: 'Evolution of traditional tattooing with enhanced detail, expanded color palette, and modern artistic techniques while maintaining classic appeal.',
    longDescription: 'Neo-Traditional tattoos represent the evolution of American Traditional style, incorporating modern techniques and expanded artistic possibilities while maintaining the bold, iconic nature of traditional work. This style emerged in the 1980s as artists began pushing the boundaries of traditional tattooing with more detailed work, dimensional shading, and a broader color palette.',
    characteristics: [
      'Enhanced detail',
      'Expanded color palette',
      'Modern techniques',
      'Classic appeal',
      'Dimensional shading',
      'Improved proportions',
      'Contemporary imagery',
      'Bold foundations'
    ],
    popularMotifs: [
      'Enhanced roses',
      'Detailed animals',
      'Modern pin-ups',
      'Ornate frames',
      'Decorative elements',
      'Realistic portraits',
      'Nature scenes',
      'Mythical creatures',
      'Skulls with detail',
      'Elaborate banners',
      'Art nouveau elements',
      'Contemporary symbols'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#FF0000', name: 'Red' },
      { color: '#00FF00', name: 'Green' },
      { color: '#0000FF', name: 'Blue' },
      { color: '#FFFF00', name: 'Yellow' },
      { color: '#FFA500', name: 'Orange' },
      { color: '#800080', name: 'Purple' },
      { color: '#FF69B4', name: 'Hot Pink' }
    ],
    difficulty: 'intermediate',
    timeOrigin: '1980s - Modern evolution of traditional',
    historicalContext: 'Neo-Traditional tattooing emerged in the 1980s as artists like Marcus Pacheco and Jeff Gogue began expanding upon traditional American tattooing. This style maintains the bold, readable nature of traditional work while incorporating more sophisticated shading, expanded color palettes, and contemporary artistic techniques.',
    aliases: ['New Traditional', 'Enhanced Traditional', 'Modern Traditional'],
    portfolioImages: [
      {
        url: '/images/styles/neo-traditional-rose.jpg',
        description: 'Detailed neo-traditional rose with enhanced shading',
        artist: 'Neo Nick',
        tags: ['rose', 'detailed', 'shading']
      },
      {
        url: '/images/styles/neo-traditional-animal.jpg',
        description: 'Modern take on traditional animal imagery',
        artist: 'Evolution Eve',
        tags: ['animal', 'modern', 'traditional']
      }
    ],
    relatedStyles: ['traditional', 'illustrative', 'contemporary'],
    technicalNotes: [
      'Combines traditional boldness with modern detail',
      'Requires understanding of both old and new techniques',
      'Color theory knowledge essential',
      'Dimensional shading techniques',
      'Maintains readability while adding complexity'
    ]
  },
  japanese: {
    styleId: 'japanese',
    styleName: 'Japanese',
    description: 'Traditional Japanese tattoo style featuring bold imagery, flowing compositions, and rich cultural symbolism with centuries of history.',
    longDescription: 'Japanese tattooing, known as Irezumi, represents one of the oldest and most sophisticated tattoo traditions in the world. This style is characterized by large-scale compositions that flow with the body\'s natural contours, featuring traditional Japanese imagery steeped in cultural and spiritual significance.',
    characteristics: [
      'Bold imagery',
      'Flowing composition',
      'Cultural symbolism',
      'Large scale designs',
      'Traditional motifs',
      'Wind and water elements',
      'Seasonal themes',
      'Spiritual significance'
    ],
    popularMotifs: [
      'Dragons',
      'Koi fish',
      'Cherry blossoms',
      'Waves',
      'Tigers',
      'Phoenixes',
      'Samurai',
      'Geishas',
      'Oni masks',
      'Chrysanthemums',
      'Peonies',
      'Wind bars'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#FF0000', name: 'Red' },
      { color: '#0000FF', name: 'Blue' },
      { color: '#FFD700', name: 'Gold' },
      { color: '#008000', name: 'Green' },
      { color: '#800080', name: 'Purple' }
    ],
    difficulty: 'advanced',
    timeOrigin: '300 AD - Ancient Japanese tradition',
    historicalContext: 'Japanese tattooing has roots dating back over 1,700 years, evolving from spiritual and decorative practices to the sophisticated art form known today. The style was refined during the Edo period (1603-1868) and has maintained its traditional techniques and imagery while adapting to modern tattooing methods.',
    aliases: ['Irezumi', 'Tebori', 'Oriental', 'Asian Traditional'],
    portfolioImages: [
      {
        url: '/images/styles/japanese-dragon.jpg',
        description: 'Traditional Japanese dragon with clouds',
        artist: 'Master Takeshi',
        tags: ['dragon', 'clouds', 'traditional']
      },
      {
        url: '/images/styles/japanese-koi.jpg',
        description: 'Koi fish swimming upstream with cherry blossoms',
        artist: 'Sakura Sam',
        tags: ['koi', 'cherry blossoms', 'water']
      }
    ],
    relatedStyles: ['oriental', 'traditional', 'large-scale'],
    technicalNotes: [
      'Requires understanding of Japanese symbolism',
      'Large-scale composition planning essential',
      'Traditional color application techniques',
      'Flow and movement crucial',
      'Cultural sensitivity important'
    ]
  },
  tribal: {
    styleId: 'tribal',
    styleName: 'Tribal',
    description: 'Ancient tattoo style featuring bold black patterns inspired by indigenous cultures worldwide, emphasizing symbolic meaning and spiritual significance.',
    longDescription: 'Tribal tattooing represents one of humanity\'s oldest forms of body art, with roots in indigenous cultures across the globe. Modern tribal tattoos draw inspiration from Polynesian, Celtic, Native American, and other traditional designs, focusing on bold black patterns that carry deep cultural and spiritual meaning.',
    characteristics: [
      'Bold black patterns',
      'Cultural symbolism',
      'Spiritual significance',
      'Geometric elements',
      'Flowing lines',
      'Negative space usage',
      'Ancient origins',
      'Meaningful designs'
    ],
    popularMotifs: [
      'Polynesian patterns',
      'Celtic knots',
      'Maori designs',
      'Native American symbols',
      'Animal spirits',
      'Ancestral patterns',
      'Protective symbols',
      'Tribal bands',
      'Spearheads',
      'Sun symbols',
      'Wave patterns',
      'Sacred geometry'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' }
    ],
    difficulty: 'intermediate',
    timeOrigin: 'Ancient times - Indigenous cultures worldwide',
    historicalContext: 'Tribal tattoos have existed for thousands of years across various indigenous cultures, serving purposes from spiritual protection to social status indication. Modern tribal tattooing gained popularity in the 1990s, though it\'s important to approach these designs with cultural respect and understanding.',
    aliases: ['Indigenous', 'Polynesian', 'Celtic', 'Native'],
    portfolioImages: [
      {
        url: '/images/styles/tribal-polynesian.jpg',
        description: 'Traditional Polynesian tribal sleeve design',
        artist: 'Island Mike',
        tags: ['polynesian', 'sleeve', 'traditional']
      },
      {
        url: '/images/styles/tribal-celtic.jpg',
        description: 'Celtic knot tribal armband',
        artist: 'Celtic Kate',
        tags: ['celtic', 'knot', 'armband']
      }
    ],
    relatedStyles: ['blackwork', 'cultural', 'spiritual'],
    technicalNotes: [
      'Cultural research and respect essential',
      'Bold line work crucial',
      'Understanding of traditional meanings important',
      'Solid black application techniques',
      'Pattern flow and composition key'
    ]
  },
  dotwork: {
    styleId: 'dotwork',
    styleName: 'Dotwork',
    description: 'Intricate tattoo style created entirely from dots, producing detailed patterns, mandalas, and geometric designs with unique texture and depth.',
    longDescription: 'Dotwork tattooing is a meticulous technique where entire designs are created using only dots of varying sizes and densities. This style can create incredible detail and unique textures impossible to achieve with traditional line work, often resulting in mesmerizing patterns and optical effects.',
    characteristics: [
      'Dot-only technique',
      'Intricate patterns',
      'Unique textures',
      'Geometric precision',
      'Mandala designs',
      'Optical effects',
      'Meditative quality',
      'High detail level'
    ],
    popularMotifs: [
      'Mandalas',
      'Sacred geometry',
      'Geometric patterns',
      'Stippled portraits',
      'Abstract designs',
      'Ornamental work',
      'Spiritual symbols',
      'Nature patterns',
      'Cosmic themes',
      'Architectural elements',
      'Floral patterns',
      'Animal silhouettes'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#808080', name: 'Grey' }
    ],
    difficulty: 'advanced',
    timeOrigin: '2000s - Contemporary technique evolution',
    historicalContext: 'Dotwork as a distinct tattoo style emerged in the early 2000s, influenced by pointillism in fine art and traditional stippling techniques. Artists like Xed LeHead and Thomas Hooper pioneered this meticulous approach, creating intricate designs that showcase incredible patience and precision.',
    aliases: ['Stippling', 'Pointillism', 'Dot Shading'],
    portfolioImages: [
      {
        url: '/images/styles/dotwork-mandala.jpg',
        description: 'Intricate dotwork mandala with geometric precision',
        artist: 'Dot Master Dan',
        tags: ['mandala', 'geometric', 'precision']
      },
      {
        url: '/images/styles/dotwork-portrait.jpg',
        description: 'Stippled portrait created entirely with dots',
        artist: 'Pointillist Pete',
        tags: ['portrait', 'stippled', 'detailed']
      }
    ],
    relatedStyles: ['geometric', 'blackwork', 'mandala'],
    technicalNotes: [
      'Requires exceptional patience and precision',
      'Dot density controls shading and depth',
      'Consistent dot size crucial for even tones',
      'Time-intensive technique',
      'Proper needle selection important'
    ]
  },
  surrealism: {
    styleId: 'surrealism',
    styleName: 'Surrealism',
    description: 'Artistic tattoo style inspired by the surrealist art movement, featuring dreamlike imagery, impossible scenes, and thought-provoking compositions.',
    longDescription: 'Surrealist tattoos draw inspiration from the 20th-century art movement, creating dreamlike, often impossible scenes that challenge perception and reality. This style combines realistic techniques with fantastical elements, resulting in thought-provoking and visually striking tattoos.',
    characteristics: [
      'Dreamlike imagery',
      'Impossible scenes',
      'Thought-provoking',
      'Realistic techniques',
      'Fantastical elements',
      'Symbolic meaning',
      'Artistic complexity',
      'Narrative quality'
    ],
    popularMotifs: [
      'Melting objects',
      'Floating elements',
      'Morphing forms',
      'Dream sequences',
      'Optical illusions',
      'Symbolic imagery',
      'Abstract concepts',
      'Time distortion',
      'Impossible architecture',
      'Metamorphosis',
      'Subconscious themes',
      'Psychological elements'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#808080', name: 'Grey' },
      { color: '#4169E1', name: 'Royal Blue' },
      { color: '#8B0000', name: 'Dark Red' },
      { color: '#FFD700', name: 'Gold' },
      { color: '#800080', name: 'Purple' }
    ],
    difficulty: 'advanced',
    timeOrigin: '1990s - Fine art influence in tattooing',
    historicalContext: 'Surrealist tattoos emerged as tattoo artists began incorporating fine art influences into their work in the 1990s. Artists like Paul Booth and Guy Aitchison pioneered this approach, bringing the dreamlike quality of artists like Salvador Dalí and René Magritte to skin.',
    aliases: ['Dreamlike', 'Fantastical', 'Abstract Realism'],
    portfolioImages: [
      {
        url: '/images/styles/surrealism-melting.jpg',
        description: 'Melting clock inspired by Dalí',
        artist: 'Dream Dave',
        tags: ['melting', 'clock', 'dali']
      },
      {
        url: '/images/styles/surrealism-morph.jpg',
        description: 'Morphing face-to-landscape composition',
        artist: 'Surreal Sue',
        tags: ['morphing', 'face', 'landscape']
      }
    ],
    relatedStyles: ['realism', 'abstract', 'fine-art'],
    technicalNotes: [
      'Strong artistic background beneficial',
      'Composition planning crucial',
      'Multiple techniques often combined',
      'Symbolic understanding important',
      'Creative problem-solving required'
    ]
  },
  biomechanical: {
    styleId: 'biomechanical',
    styleName: 'Biomechanical',
    description: 'Futuristic tattoo style blending organic and mechanical elements, creating the illusion of machinery beneath or integrated with human anatomy.',
    longDescription: 'Biomechanical tattoos create the illusion that the wearer\'s body contains mechanical components, blending organic human anatomy with futuristic machinery. This style was heavily influenced by the work of H.R. Giger and the Alien film franchise, creating a unique aesthetic that\'s both beautiful and unsettling.',
    characteristics: [
      'Organic-mechanical fusion',
      'Futuristic aesthetic',
      'Anatomical integration',
      'Metallic textures',
      'Complex shading',
      'Sci-fi influence',
      'Dimensional illusion',
      'Technical precision'
    ],
    popularMotifs: [
      'Mechanical joints',
      'Exposed machinery',
      'Cybernetic implants',
      'Robotic limbs',
      'Gear systems',
      'Hydraulic pistons',
      'Circuit patterns',
      'Metallic plating',
      'Alien technology',
      'Futuristic weapons',
      'Mechanical hearts',
      'Cyber enhancements'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#C0C0C0', name: 'Silver' },
      { color: '#808080', name: 'Grey' },
      { color: '#4169E1', name: 'Blue' },
      { color: '#FF0000', name: 'Red' },
      { color: '#FFD700', name: 'Gold' }
    ],
    difficulty: 'advanced',
    timeOrigin: '1980s - Sci-fi and cyberpunk influence',
    historicalContext: 'Biomechanical tattooing emerged in the 1980s, heavily influenced by H.R. Giger\'s artwork for the Alien films and the growing cyberpunk movement. Artists like Guy Aitchison and Aaron Cain pioneered this style, creating intricate designs that blur the line between human and machine.',
    aliases: ['Bio-mech', 'Cybernetic', 'Mechanical', 'Giger-style'],
    portfolioImages: [
      {
        url: '/images/styles/biomech-arm.jpg',
        description: 'Mechanical arm with exposed gears and pistons',
        artist: 'Cyber Carl',
        tags: ['mechanical', 'arm', 'gears']
      },
      {
        url: '/images/styles/biomech-spine.jpg',
        description: 'Cybernetic spine with metallic vertebrae',
        artist: 'Robo Rob',
        tags: ['spine', 'cybernetic', 'metallic']
      }
    ],
    relatedStyles: ['sci-fi', 'realism', 'technical'],
    technicalNotes: [
      'Understanding of anatomy essential',
      'Metallic texture techniques crucial',
      'Perspective and dimension important',
      'Complex shading required',
      'Reference material study necessary'
    ]
  },
  portrait: {
    styleId: 'portrait',
    styleName: 'Portrait',
    description: 'Specialized tattoo style focused on creating lifelike representations of people, capturing facial features, expressions, and personality with incredible detail.',
    longDescription: 'Portrait tattooing represents one of the most challenging and rewarding aspects of tattoo artistry, requiring exceptional skill in capturing not just physical likeness but also the essence and personality of the subject. This style demands mastery of proportion, shading, and detail work.',
    characteristics: [
      'Lifelike representation',
      'Facial detail mastery',
      'Expression capture',
      'Personality essence',
      'Proportion accuracy',
      'Advanced shading',
      'Emotional depth',
      'Technical precision'
    ],
    popularMotifs: [
      'Family members',
      'Celebrities',
      'Historical figures',
      'Pets',
      'Self-portraits',
      'Memorial portraits',
      'Movie characters',
      'Musicians',
      'Religious figures',
      'Cultural icons',
      'Loved ones',
      'Fictional characters'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#808080', name: 'Grey' },
      { color: '#DEB887', name: 'Skin Tone' },
      { color: '#8B4513', name: 'Brown' },
      { color: '#F5DEB3', name: 'Light Skin' },
      { color: '#654321', name: 'Dark Brown' }
    ],
    difficulty: 'advanced',
    timeOrigin: '1970s - Advancement of tattoo techniques',
    historicalContext: 'Portrait tattooing became more prevalent in the 1970s as tattoo equipment and techniques advanced. Artists like Bob Tyrrell and Mike DeVries elevated portrait work to fine art levels, proving that tattoos could capture incredible detail and emotional depth.',
    aliases: ['Portraiture', 'Realistic Portraits', 'Memorial Work'],
    portfolioImages: [
      {
        url: '/images/styles/portrait-family.jpg',
        description: 'Detailed family portrait with multiple subjects',
        artist: 'Portrait Paul',
        tags: ['family', 'multiple', 'detailed']
      },
      {
        url: '/images/styles/portrait-celebrity.jpg',
        description: 'Celebrity portrait with perfect likeness',
        artist: 'Likeness Lisa',
        tags: ['celebrity', 'likeness', 'perfect']
      }
    ],
    relatedStyles: ['realism', 'black-and-grey', 'memorial'],
    technicalNotes: [
      'Exceptional reference photos required',
      'Understanding of facial anatomy crucial',
      'Advanced shading techniques essential',
      'Proportion accuracy critical',
      'Multiple session planning often needed'
    ]
  },
  'fine-line': {
    styleId: 'fine-line',
    styleName: 'Fine Line',
    description: 'Delicate tattoo style using extremely thin lines to create subtle, elegant designs with minimal visual weight and maximum artistic impact.',
    longDescription: 'Fine line tattooing focuses on creating delicate, subtle designs using the thinnest possible lines. This style has gained massive popularity for its elegant, minimalist aesthetic and ability to create detailed work that ages gracefully while maintaining a light visual presence on the skin.',
    characteristics: [
      'Extremely thin lines',
      'Delicate appearance',
      'Subtle elegance',
      'Minimal visual weight',
      'Precise execution',
      'Clean aesthetics',
      'Detailed work',
      'Graceful aging'
    ],
    popularMotifs: [
      'Botanical illustrations',
      'Single-line drawings',
      'Delicate flowers',
      'Minimalist animals',
      'Script lettering',
      'Geometric shapes',
      'Constellation maps',
      'Architectural elements',
      'Abstract line art',
      'Symbolic imagery',
      'Nature scenes',
      'Ornamental details'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#808080', name: 'Grey' }
    ],
    difficulty: 'intermediate',
    timeOrigin: '2010s - Social media influence',
    historicalContext: 'Fine line tattooing gained prominence in the 2010s, largely driven by social media platforms like Instagram where delicate, photogenic tattoos performed well. Artists like Dr. Woo and JonBoy popularized this style, making it accessible to clients wanting subtle, elegant body art.',
    aliases: ['Single Needle', 'Delicate', 'Micro Tattoos'],
    portfolioImages: [
      {
        url: '/images/styles/fine-line-botanical.jpg',
        description: 'Delicate botanical illustration with fine details',
        artist: 'Fine Flora',
        tags: ['botanical', 'delicate', 'detailed']
      },
      {
        url: '/images/styles/fine-line-script.jpg',
        description: 'Elegant script lettering in fine line style',
        artist: 'Script Sam',
        tags: ['script', 'elegant', 'lettering']
      }
    ],
    relatedStyles: ['minimalist', 'botanical', 'script'],
    technicalNotes: [
      'Requires extremely steady hand',
      'Single needle or small groupings',
      'Proper depth crucial for longevity',
      'Clean healing essential',
      'Less room for error correction'
    ]
  },
  sketch: {
    styleId: 'sketch',
    styleName: 'Sketch',
    description: 'Artistic tattoo style that mimics pencil or pen drawings, featuring loose lines, cross-hatching, and the spontaneous quality of preliminary artwork.',
    longDescription: 'Sketch style tattoos replicate the look of preliminary drawings, complete with loose lines, cross-hatching, and the organic imperfections that make hand-drawn art so appealing. This style celebrates the beauty of the artistic process itself, bringing sketchbook aesthetics to skin.',
    characteristics: [
      'Loose line quality',
      'Cross-hatching shading',
      'Organic imperfections',
      'Artistic spontaneity',
      'Sketch-like appearance',
      'Hand-drawn aesthetic',
      'Expressive lines',
      'Artistic process celebration'
    ],
    popularMotifs: [
      'Portrait sketches',
      'Animal studies',
      'Architectural drawings',
      'Botanical studies',
      'Figure drawings',
      'Abstract sketches',
      'Concept art',
      'Life drawings',
      'Technical illustrations',
      'Artistic studies',
      'Gesture drawings',
      'Observational art'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#808080', name: 'Grey' },
      { color: '#2F4F4F', name: 'Dark Slate Grey' }
    ],
    difficulty: 'intermediate',
    timeOrigin: '2000s - Fine art influence in tattooing',
    historicalContext: 'Sketch style tattooing emerged as artists began incorporating more fine art influences into their work in the 2000s. This style celebrates the beauty of preliminary artwork and the artistic process, bringing the intimate quality of sketchbook studies to permanent body art.',
    aliases: ['Sketchy', 'Hand-drawn', 'Artistic Study'],
    portfolioImages: [
      {
        url: '/images/styles/sketch-portrait.jpg',
        description: 'Loose sketch-style portrait with cross-hatching',
        artist: 'Sketchy Steve',
        tags: ['portrait', 'cross-hatching', 'loose']
      },
      {
        url: '/images/styles/sketch-animal.jpg',
        description: 'Animal study in sketch style with expressive lines',
        artist: 'Study Sally',
        tags: ['animal', 'study', 'expressive']
      }
    ],
    relatedStyles: ['illustrative', 'fine-art', 'expressive'],
    technicalNotes: [
      'Understanding of drawing techniques essential',
      'Controlled "looseness" required',
      'Cross-hatching skills important',
      'Artistic background beneficial',
      'Line weight variation crucial'
    ]
  },
  'new-school': {
    styleId: 'new-school',
    styleName: 'New School',
    description: 'Vibrant, cartoon-inspired tattoo style featuring exaggerated proportions, bright colors, and playful imagery with a contemporary twist.',
    longDescription: 'New School tattooing emerged as a reaction to traditional styles, incorporating cartoon and graffiti influences with exaggerated proportions, vibrant colors, and playful imagery. This style celebrates pop culture, animation, and contemporary art with a fun, energetic approach.',
    characteristics: [
      'Cartoon influences',
      'Exaggerated proportions',
      'Bright vibrant colors',
      'Playful imagery',
      'Contemporary themes',
      'Pop culture references',
      'Energetic style',
      'Bold outlines'
    ],
    popularMotifs: [
      'Cartoon characters',
      'Graffiti elements',
      'Pop culture icons',
      'Exaggerated animals',
      'Comic book style',
      'Video game characters',
      'Street art influences',
      'Animated features',
      'Caricatures',
      'Fantasy creatures',
      'Modern symbols',
      'Playful objects'
    ],
    colorPalette: [
      { color: '#FF0000', name: 'Bright Red' },
      { color: '#00FF00', name: 'Bright Green' },
      { color: '#0000FF', name: 'Bright Blue' },
      { color: '#FFFF00', name: 'Yellow' },
      { color: '#FF00FF', name: 'Magenta' },
      { color: '#00FFFF', name: 'Cyan' },
      { color: '#FFA500', name: 'Orange' },
      { color: '#800080', name: 'Purple' }
    ],
    difficulty: 'intermediate',
    timeOrigin: '1990s - Pop culture and cartoon influence',
    historicalContext: 'New School tattooing developed in the 1990s as artists like Mike Giant and Chris Garver began incorporating cartoon, graffiti, and pop culture influences into their work. This style represented a departure from traditional imagery, embracing contemporary culture and playful aesthetics.',
    aliases: ['Cartoon Style', 'Pop Art', 'Contemporary'],
    portfolioImages: [
      {
        url: '/images/styles/new-school-cartoon.jpg',
        description: 'Vibrant cartoon character with exaggerated features',
        artist: 'Cartoon Carl',
        tags: ['cartoon', 'vibrant', 'exaggerated']
      },
      {
        url: '/images/styles/new-school-graffiti.jpg',
        description: 'Graffiti-inspired design with bright colors',
        artist: 'Graf Grace',
        tags: ['graffiti', 'bright', 'street-art']
      }
    ],
    relatedStyles: ['cartoon', 'pop-art', 'contemporary'],
    technicalNotes: [
      'Color theory knowledge important',
      'Bold line work essential',
      'Understanding of cartoon proportions',
      'Vibrant color application skills',
      'Pop culture awareness helpful'
    ]
  },
  illustrative: {
    styleId: 'illustrative',
    styleName: 'Illustrative',
    description: 'Artistic tattoo style that mimics book illustrations, combining realistic elements with stylized artistic interpretation and narrative quality.',
    longDescription: 'Illustrative tattoos draw inspiration from book illustrations, combining realistic elements with artistic stylization to create narrative, story-telling pieces. This style often incorporates elements from children\'s books, fairy tales, and classic illustrations with a sophisticated artistic approach.',
    characteristics: [
      'Book illustration style',
      'Narrative quality',
      'Artistic stylization',
      'Story-telling elements',
      'Sophisticated approach',
      'Mixed techniques',
      'Literary influences',
      'Whimsical elements'
    ],
    popularMotifs: [
      'Fairy tale scenes',
      'Storybook characters',
      'Literary references',
      'Whimsical animals',
      'Fantasy landscapes',
      'Vintage illustrations',
      'Children\'s book art',
      'Classic tales',
      'Mythological scenes',
      'Artistic interpretations',
      'Narrative compositions',
      'Stylized nature'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#8B4513', name: 'Brown' },
      { color: '#2F4F4F', name: 'Dark Slate Grey' },
      { color: '#B22222', name: 'Fire Brick' },
      { color: '#228B22', name: 'Forest Green' },
      { color: '#4169E1', name: 'Royal Blue' }
    ],
    difficulty: 'intermediate',
    timeOrigin: '2000s - Literary and artistic influences',
    historicalContext: 'Illustrative tattooing gained popularity in the 2000s as artists began drawing more heavily from literary and artistic sources. This style celebrates the art of illustration, bringing the narrative quality of book art to tattooing with sophisticated artistic interpretation.',
    aliases: ['Book Illustration', 'Narrative', 'Storybook'],
    portfolioImages: [
      {
        url: '/images/styles/illustrative-fairy.jpg',
        description: 'Fairy tale scene with whimsical characters',
        artist: 'Story Sam',
        tags: ['fairy tale', 'whimsical', 'narrative']
      },
      {
        url: '/images/styles/illustrative-forest.jpg',
        description: 'Stylized forest scene with literary quality',
        artist: 'Book Betty',
        tags: ['forest', 'stylized', 'literary']
      }
    ],
    relatedStyles: ['storybook', 'artistic', 'narrative'],
    technicalNotes: [
      'Strong artistic background beneficial',
      'Understanding of illustration techniques',
      'Narrative composition skills',
      'Mixed media approach often used',
      'Literary knowledge helpful'
    ]
  },
  ornamental: {
    styleId: 'ornamental',
    styleName: 'Ornamental',
    description: 'Decorative tattoo style featuring intricate patterns, filigree work, and ornate designs inspired by jewelry, architecture, and decorative arts.',
    longDescription: 'Ornamental tattooing focuses on decorative patterns and ornate designs inspired by jewelry, architectural details, and decorative arts from various cultures. This style emphasizes symmetry, intricate detail work, and the beauty of pure decoration without necessarily representing specific objects.',
    characteristics: [
      'Intricate patterns',
      'Decorative focus',
      'Ornate designs',
      'Symmetrical layouts',
      'Filigree work',
      'Architectural inspiration',
      'Jewelry influences',
      'Cultural motifs'
    ],
    popularMotifs: [
      'Filigree patterns',
      'Lace designs',
      'Architectural details',
      'Jewelry motifs',
      'Mandala elements',
      'Baroque ornaments',
      'Art nouveau patterns',
      'Islamic geometry',
      'Victorian decorations',
      'Rococo elements',
      'Ornate frames',
      'Decorative borders'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#808080', name: 'Grey' },
      { color: '#FFD700', name: 'Gold' },
      { color: '#C0C0C0', name: 'Silver' }
    ],
    difficulty: 'intermediate',
    timeOrigin: '2010s - Decorative arts revival',
    historicalContext: 'Ornamental tattooing gained prominence in the 2010s as part of a broader revival of interest in decorative arts and craftsmanship. This style draws from various cultural traditions of ornamentation, celebrating the beauty of pure decoration and intricate pattern work.',
    aliases: ['Decorative', 'Filigree', 'Pattern Work'],
    portfolioImages: [
      {
        url: '/images/styles/ornamental-lace.jpg',
        description: 'Intricate lace pattern with delicate details',
        artist: 'Ornate Olivia',
        tags: ['lace', 'intricate', 'delicate']
      },
      {
        url: '/images/styles/ornamental-baroque.jpg',
        description: 'Baroque-inspired ornamental design',
        artist: 'Decorative Dan',
        tags: ['baroque', 'ornamental', 'classical']
      }
    ],
    relatedStyles: ['decorative', 'geometric', 'cultural'],
    technicalNotes: [
      'Precision and symmetry crucial',
      'Understanding of decorative arts helpful',
      'Pattern consistency important',
      'Cultural sensitivity required',
      'Detailed planning essential'
    ]
  },
  // Handle style ID variations from the data
  'neo_traditional': {
    styleId: 'neo_traditional',
    styleName: 'Neo-Traditional',
    description: 'Evolution of traditional tattooing with enhanced detail, expanded color palette, and modern artistic techniques while maintaining classic appeal.',
    longDescription: 'Neo-Traditional tattoos represent the evolution of American Traditional style, incorporating modern techniques and expanded artistic possibilities while maintaining the bold, iconic nature of traditional work. This style emerged in the 1980s as artists began pushing the boundaries of traditional tattooing with more detailed work, dimensional shading, and a broader color palette.',
    characteristics: [
      'Enhanced detail',
      'Expanded color palette',
      'Modern techniques',
      'Classic appeal',
      'Dimensional shading',
      'Improved proportions',
      'Contemporary imagery',
      'Bold foundations'
    ],
    popularMotifs: [
      'Enhanced roses',
      'Detailed animals',
      'Modern pin-ups',
      'Ornate frames',
      'Decorative elements',
      'Realistic portraits',
      'Nature scenes',
      'Mythical creatures',
      'Skulls with detail',
      'Elaborate banners',
      'Art nouveau elements',
      'Contemporary symbols'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#FF0000', name: 'Red' },
      { color: '#00FF00', name: 'Green' },
      { color: '#0000FF', name: 'Blue' },
      { color: '#FFFF00', name: 'Yellow' },
      { color: '#FFA500', name: 'Orange' },
      { color: '#800080', name: 'Purple' },
      { color: '#FF69B4', name: 'Hot Pink' }
    ],
    difficulty: 'intermediate',
    timeOrigin: '1980s - Modern evolution of traditional',
    historicalContext: 'Neo-Traditional tattooing emerged in the 1980s as artists like Marcus Pacheco and Jeff Gogue began expanding upon traditional American tattooing. This style maintains the bold, readable nature of traditional work while incorporating more sophisticated shading, expanded color palettes, and contemporary artistic techniques.',
    aliases: ['New Traditional', 'Enhanced Traditional', 'Modern Traditional'],
    portfolioImages: [
      {
        url: '/images/styles/neo-traditional-rose.jpg',
        description: 'Detailed neo-traditional rose with enhanced shading',
        artist: 'Neo Nick',
        tags: ['rose', 'detailed', 'shading']
      },
      {
        url: '/images/styles/neo-traditional-animal.jpg',
        description: 'Modern take on traditional animal imagery',
        artist: 'Evolution Eve',
        tags: ['animal', 'modern', 'traditional']
      }
    ],
    relatedStyles: ['traditional', 'illustrative', 'contemporary'],
    technicalNotes: [
      'Combines traditional boldness with modern detail',
      'Requires understanding of both old and new techniques',
      'Color theory knowledge essential',
      'Dimensional shading techniques',
      'Maintains readability while adding complexity'
    ]
  },
  'watercolour': {
    styleId: 'watercolour',
    styleName: 'Watercolour',
    description: 'Artistic tattoo style that mimics watercolor painting techniques with flowing colors, soft edges, and painterly effects.',
    longDescription: 'Watercolor tattoos represent a modern artistic approach that brings the fluidity and spontaneity of watercolor painting to skin. This style emerged in the 2000s as tattoo artists began experimenting with techniques that could replicate the soft, flowing nature of watercolor art. The style often features minimal or no outlines, allowing colors to blend and flow naturally.',
    characteristics: [
      'Soft color blending',
      'Paint-like effects',
      'Flowing transitions',
      'Minimal outlines',
      'Artistic freedom',
      'Gradient effects',
      'Splatter techniques',
      'Organic shapes'
    ],
    popularMotifs: [
      'Flowers',
      'Animals',
      'Abstract art',
      'Splashes',
      'Brushstrokes',
      'Nature scenes',
      'Butterflies',
      'Birds',
      'Landscapes',
      'Dreamcatchers',
      'Feathers',
      'Trees'
    ],
    colorPalette: [
      { color: '#FF69B4', name: 'Hot Pink' },
      { color: '#87CEEB', name: 'Sky Blue' },
      { color: '#98FB98', name: 'Pale Green' },
      { color: '#DDA0DD', name: 'Plum' },
      { color: '#F0E68C', name: 'Khaki' },
      { color: '#FFA07A', name: 'Light Salmon' }
    ],
    difficulty: 'advanced',
    timeOrigin: '2000s - Contemporary tattoo innovation',
    historicalContext: 'Watercolor tattoos emerged in the early 2000s as tattoo artists began pushing the boundaries of traditional techniques. Artists like Amanda Wachob and Koray Karagözler pioneered this style, drawing inspiration from contemporary watercolor painting and abstract art. The style gained popularity through social media, where its photogenic qualities made it highly shareable.',
    aliases: ['Painterly', 'Artistic', 'Watercolor', 'Abstract'],
    portfolioImages: [
      {
        url: '/images/styles/watercolor-flower.jpg',
        description: 'Watercolor rose with paint splashes',
        artist: 'Watercolor Wendy',
        tags: ['rose', 'flower', 'splashes']
      },
      {
        url: '/images/styles/watercolor-bird.jpg',
        description: 'Abstract hummingbird in watercolor style',
        artist: 'Paint Pete',
        tags: ['bird', 'hummingbird', 'abstract']
      }
    ],
    relatedStyles: ['abstract', 'painterly', 'contemporary'],
    technicalNotes: [
      'Requires advanced color theory knowledge',
      'Soft shading techniques essential',
      'Color blending skills crucial',
      'Minimal outline work',
      'Proper color saturation important'
    ]
  },
  'fineline': {
    styleId: 'fineline',
    styleName: 'Fine Line',
    description: 'Delicate tattoo style using extremely thin lines to create subtle, elegant designs with minimal visual weight and maximum artistic impact.',
    longDescription: 'Fine line tattooing focuses on creating delicate, subtle designs using the thinnest possible lines. This style has gained massive popularity for its elegant, minimalist aesthetic and ability to create detailed work that ages gracefully while maintaining a light visual presence on the skin.',
    characteristics: [
      'Extremely thin lines',
      'Delicate appearance',
      'Subtle elegance',
      'Minimal visual weight',
      'Precise execution',
      'Clean aesthetics',
      'Detailed work',
      'Graceful aging'
    ],
    popularMotifs: [
      'Botanical illustrations',
      'Single-line drawings',
      'Delicate flowers',
      'Minimalist animals',
      'Script lettering',
      'Geometric shapes',
      'Constellation maps',
      'Architectural elements',
      'Abstract line art',
      'Symbolic imagery',
      'Nature scenes',
      'Ornamental details'
    ],
    colorPalette: [
      { color: '#000000', name: 'Black' },
      { color: '#808080', name: 'Grey' }
    ],
    difficulty: 'intermediate',
    timeOrigin: '2010s - Social media influence',
    historicalContext: 'Fine line tattooing gained prominence in the 2010s, largely driven by social media platforms like Instagram where delicate, photogenic tattoos performed well. Artists like Dr. Woo and JonBoy popularized this style, making it accessible to clients wanting subtle, elegant body art.',
    aliases: ['Single Needle', 'Delicate', 'Micro Tattoos'],
    portfolioImages: [
      {
        url: '/images/styles/fine-line-botanical.jpg',
        description: 'Delicate botanical illustration with fine details',
        artist: 'Fine Flora',
        tags: ['botanical', 'delicate', 'detailed']
      },
      {
        url: '/images/styles/fine-line-script.jpg',
        description: 'Elegant script lettering in fine line style',
        artist: 'Script Sam',
        tags: ['script', 'elegant', 'lettering']
      }
    ],
    relatedStyles: ['minimalist', 'botanical', 'script'],
    technicalNotes: [
      'Requires extremely steady hand',
      'Single needle or small groupings',
      'Proper depth crucial for longevity',
      'Clean healing essential',
      'Less room for error correction'
    ]
  },

  'floral': {
    styleId: 'floral',
    styleName: 'Floral',
    description: 'Botanical tattoo style specializing in flower and plant designs, ranging from realistic botanical illustrations to stylized floral compositions.',
    longDescription: 'Floral tattoos represent one of the most popular and versatile categories in tattooing, encompassing everything from realistic botanical illustrations to stylized flower designs. This style can be executed in various techniques including fine line, watercolor, traditional, or realistic approaches, making it adaptable to many artistic preferences.',
    characteristics: [
      'Botanical accuracy',
      'Natural beauty',
      'Versatile techniques',
      'Symbolic meaning',
      'Seasonal themes',
      'Delicate details',
      'Organic flow',
      'Feminine appeal'
    ],
    popularMotifs: [
      'Roses',
      'Peonies',
      'Cherry blossoms',
      'Sunflowers',
      'Lotus flowers',
      'Wildflowers',
      'Botanical wreaths',
      'Flower bouquets',
      'Leaves and vines',
      'Floral mandalas',
      'Birth flowers',
      'Seasonal blooms'
    ],
    colorPalette: [
      { color: '#FF69B4', name: 'Pink' },
      { color: '#FF0000', name: 'Red' },
      { color: '#800080', name: 'Purple' },
      { color: '#FFFF00', name: 'Yellow' },
      { color: '#FFA500', name: 'Orange' },
      { color: '#228B22', name: 'Green' }
    ],
    difficulty: 'intermediate',
    timeOrigin: 'Ancient times - Universal botanical appreciation',
    historicalContext: 'Floral tattoos have existed across cultures throughout history, symbolizing beauty, growth, and the cycles of life. In modern tattooing, botanical designs have evolved from simple traditional roses to incredibly detailed botanical illustrations, influenced by both scientific illustration and contemporary floral art.',
    aliases: ['Botanical', 'Flower', 'Nature', 'Plant'],
    portfolioImages: [
      {
        url: '/images/styles/floral-rose.jpg',
        description: 'Detailed botanical rose illustration',
        artist: 'Botanical Betty',
        tags: ['rose', 'botanical', 'detailed']
      },
      {
        url: '/images/styles/floral-wildflower.jpg',
        description: 'Wildflower bouquet composition',
        artist: 'Garden Grace',
        tags: ['wildflower', 'bouquet', 'natural']
      }
    ],
    relatedStyles: ['botanical', 'fine-line', 'watercolor'],
    technicalNotes: [
      'Botanical reference knowledge helpful',
      'Understanding of plant anatomy',
      'Color theory for natural hues',
      'Delicate shading techniques',
      'Composition and flow important'
    ]
  },
  'new_school': {
    styleId: 'new_school',
    styleName: 'New School',
    description: 'Vibrant, cartoon-inspired tattoo style featuring exaggerated proportions, bright colors, and playful imagery with a contemporary twist.',
    longDescription: 'New School tattooing emerged as a reaction to traditional styles, incorporating cartoon and graffiti influences with exaggerated proportions, vibrant colors, and playful imagery. This style celebrates pop culture, animation, and contemporary art with a fun, energetic approach.',
    characteristics: [
      'Cartoon influences',
      'Exaggerated proportions',
      'Bright vibrant colors',
      'Playful imagery',
      'Contemporary themes',
      'Pop culture references',
      'Energetic style',
      'Bold outlines'
    ],
    popularMotifs: [
      'Cartoon characters',
      'Graffiti elements',
      'Pop culture icons',
      'Exaggerated animals',
      'Comic book style',
      'Video game characters',
      'Street art influences',
      'Animated features',
      'Caricatures',
      'Fantasy creatures',
      'Modern symbols',
      'Playful objects'
    ],
    colorPalette: [
      { color: '#FF0000', name: 'Bright Red' },
      { color: '#00FF00', name: 'Bright Green' },
      { color: '#0000FF', name: 'Bright Blue' },
      { color: '#FFFF00', name: 'Yellow' },
      { color: '#FF00FF', name: 'Magenta' },
      { color: '#00FFFF', name: 'Cyan' },
      { color: '#FFA500', name: 'Orange' },
      { color: '#800080', name: 'Purple' }
    ],
    difficulty: 'intermediate',
    timeOrigin: '1990s - Pop culture and cartoon influence',
    historicalContext: 'New School tattooing developed in the 1990s as artists like Mike Giant and Chris Garver began incorporating cartoon, graffiti, and pop culture influences into their work. This style represented a departure from traditional imagery, embracing contemporary culture and playful aesthetics.',
    aliases: ['Cartoon Style', 'Pop Art', 'Contemporary'],
    portfolioImages: [
      {
        url: '/images/styles/new-school-cartoon.jpg',
        description: 'Vibrant cartoon character with exaggerated features',
        artist: 'Cartoon Carl',
        tags: ['cartoon', 'vibrant', 'exaggerated']
      },
      {
        url: '/images/styles/new-school-graffiti.jpg',
        description: 'Graffiti-inspired design with bright colors',
        artist: 'Graf Grace',
        tags: ['graffiti', 'bright', 'street-art']
      }
    ],
    relatedStyles: ['cartoon', 'pop-art', 'contemporary'],
    technicalNotes: [
      'Color theory knowledge important',
      'Bold line work essential',
      'Understanding of cartoon proportions',
      'Vibrant color application skills',
      'Pop culture awareness helpful'
    ]
  }
};

// Add aliases for style ID variations
mockStylesData['minimalism'] = mockStylesData['minimalist'];

function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 'beginner':
      return 'success';
    case 'intermediate':
      return 'warning';
    case 'advanced':
      return 'error';
    default:
      return 'neutral';
  }
}

function getDifficultyLabel(difficulty) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export default function StyleDetailPage({ styleId }) {
  const [style, setStyle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    // Simulate API call
    const loadStyle = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const styleData = mockStylesData[styleId];
      if (styleData) {
        setStyle(styleData);
      }
      setLoading(false);
    };

    loadStyle();
  }, [styleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background-primary)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-6 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-12 w-48 mb-4" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-3/4 mb-6" />
              <Skeleton className="h-64 w-full mb-6" />
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-8 w-32 mb-4" />
              <Card className="p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <div className="flex gap-2 mb-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-6 rounded-full" />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!style) {
    return (
      <div className="min-h-screen bg-[var(--background-primary)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
              Style Not Found
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
              The tattoo style you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/styles">
              <Button variant="primary">
                Browse All Styles
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Styles', href: '/styles' },
    { label: style.styleName, href: `/styles/${style.styleId}` }
  ];

  return (
    <div className="min-h-screen bg-[var(--background-primary)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-4xl font-bold text-[var(--text-primary)] font-[var(--font-heading)]">
                  {style.styleName}
                </h1>
                <Badge variant={getDifficultyColor(style.difficulty)} size="lg">
                  {getDifficultyLabel(style.difficulty)}
                </Badge>
              </div>
              <p className="text-lg text-[var(--text-secondary)] mb-4">
                {style.description}
              </p>
              <p className="text-[var(--text-secondary)]">
                {style.longDescription}
              </p>
            </div>

            {/* Portfolio Gallery */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
                Portfolio Examples
              </h2>
              
              {/* Main Image */}
              <Card className="mb-4 overflow-hidden">
                <div className="relative aspect-video bg-[var(--background-secondary)] flex items-center justify-center">
                  <div className="text-center text-[var(--text-tertiary)]">
                    <div className="w-16 h-16 mx-auto mb-2 opacity-50">
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                    <p className="text-sm">
                      {style.portfolioImages[selectedImageIndex]?.description || 'Portfolio image'}
                    </p>
                    <p className="text-xs mt-1">
                      by {style.portfolioImages[selectedImageIndex]?.artist || 'Artist'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Thumbnail Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {style.portfolioImages.map((image, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all duration-200 overflow-hidden ${
                      selectedImageIndex === index 
                        ? 'ring-2 ring-[var(--interactive-primary)]' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <div className="relative aspect-square bg-[var(--background-secondary)] flex items-center justify-center">
                      <div className="text-center text-[var(--text-tertiary)]">
                        <div className="w-8 h-8 mx-auto mb-1 opacity-50">
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                          </svg>
                        </div>
                        <p className="text-xs">{image.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Historical Context */}
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                Historical Context
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                <strong>Origin:</strong> {style.timeOrigin}
              </p>
              <p className="text-[var(--text-secondary)]">
                {style.historicalContext}
              </p>
            </Card>

            {/* Technical Notes */}
            {style.technicalNotes && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                  Technical Notes
                </h2>
                <ul className="space-y-2">
                  {style.technicalNotes.map((note, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[var(--interactive-primary)] mr-2">•</span>
                      <span className="text-[var(--text-secondary)]">{note}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Style Information */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Style Information
              </h3>
              
              {/* Difficulty */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Difficulty Level
                </h4>
                <Badge variant={getDifficultyColor(style.difficulty)}>
                  {getDifficultyLabel(style.difficulty)}
                </Badge>
              </div>

              {/* Color Palette */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Color Palette
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {style.colorPalette.map((colorInfo, index) => (
                    <div key={index} className="text-center">
                      <div
                        className="w-full h-8 rounded border-2 border-[var(--border-primary)] mb-1"
                        style={{ backgroundColor: colorInfo.color }}
                        title={`${colorInfo.name} (${colorInfo.color})`}
                      />
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {colorInfo.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aliases */}
              {style.aliases && style.aliases.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Also Known As
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {style.aliases.map((alias, index) => (
                      <Badge key={index} variant="neutral" size="sm">
                        {alias}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Characteristics */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Key Characteristics
              </h3>
              <div className="space-y-2">
                {style.characteristics.map((characteristic, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-[var(--interactive-primary)] mr-2">✓</span>
                    <span className="text-[var(--text-secondary)] text-sm">{characteristic}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Popular Motifs */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Popular Motifs
              </h3>
              <div className="flex flex-wrap gap-2">
                {style.popularMotifs.map((motif, index) => (
                  <Badge key={index} variant="neutral" size="sm">
                    {motif}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Link href={`/artists?style=${style.styleId}`}>
                <Button variant="primary" className="w-full">
                  Find {style.styleName} Artists
                </Button>
              </Link>
              <Link href="/styles">
                <Button variant="outline" className="w-full">
                  Browse All Styles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}