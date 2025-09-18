// mockArtistData.js

export const mockArtistData = [
  {
    pk: "ARTIST#1",
    sk: "PROFILE",
    artistId: "artist-001",
    artistsName: "Sarah Mitchell",
    instagramHandle: "sarahtattoos",
    bio: "Traditional and neo-traditional tattoo artist specializing in roses, eagles, and nautical themes",
    avatar: "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-72.jpg",
    profileLink: "https://instagram.com/sarahtattoos",
    tattooStudio: {
      studioName: "Ink & Steel Studio",
      address: { city: "London", latitude: 51.5225, longitude: -0.0786 },
    },
    styles: ["traditional", "neo_traditional"],
    portfolioImages: [
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/traditional/tattoo_107.png",
        description: "Traditional rose with thorns",
        style: "traditional"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/traditional/tattoo_103.png",
        description: "Neo-traditional eagle with geometric elements",
        style: "traditional"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/traditional/tattoo_105.png",
        description: "Traditional anchor",
        style: "traditional"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/traditional/tattoo_89.png",
        description: "Traditional swallow pair",
        style: "traditional"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/traditional/tattoo_109.png",
        description: "Neo-traditional wolf portrait",
        style: "traditional"
      }
    ],
    opted_out: false,
  },
  {
    pk: "ARTIST#3030",
    sk: "PROFILE",
    artistId: "3030",
    avatar: "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/96.jpg",
    bio: "Geometric and blackwork specialist with modern aesthetic",
    artistsName: "Luna Rodriguez",
    instagramHandle: "LunaRodriguez_tattoo",
    profileLink: "https://instagram.com/LunaRodriguez_tattoo",
    tattooStudio: {
      studioName: "Modern Ink Studio",
      streetAddress: "45 Camden High Street",
      address: { city: "London", latitude: 51.5392, longitude: -0.1426 },
    },
    styles: ["geometric", "blackwork", "minimalism"],
    portfolioImages: [
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/geometric/tattoo_1.png",
        description: "Geometric mandala design",
        style: "geometric"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/blackwork/tattoo_141.png",
        description: "Blackwork tribal pattern",
        style: "blackwork"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/geometric/tattoo_11.png",
        description: "Abstract geometric shapes",
        style: "geometric"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/minimalism/tattoo_10.png",
        description: "Minimalist line art",
        style: "minimalism"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/blackwork/tattoo_41.png",
        description: "Bold blackwork design",
        style: "blackwork"
      }
    ],
    opted_out: false,
  },
  {
    pk: "ARTIST#602",
    sk: "PROFILE",
    artistId: "602",
    avatar: "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-25.jpg",
    bio: "Watercolor and realism specialist creating vibrant, lifelike tattoos",
    artistsName: "Marcus Chen",
    instagramHandle: "MarcusChen_tattoo",
    profileLink: "https://instagram.com/MarcusChen_tattoo",
    tattooStudio: {
      studioName: "Vibrant Ink Studio",
      streetAddress: "78 Shoreditch High Street",
      address: { city: "London", latitude: 51.5074, longitude: -0.1278 },
    },
    styles: ["watercolour", "realism", "neo_traditional"],
    portfolioImages: [
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/watercolour/tattoo_125.png",
        description: "Watercolor butterfly design",
        style: "watercolour"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/realism/tattoo_21.png",
        description: "Realistic portrait piece",
        style: "realism"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/watercolour/tattoo_126.png",
        description: "Watercolor floral arrangement",
        style: "watercolour"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/realism/tattoo_23.png",
        description: "Photorealistic animal portrait",
        style: "realism"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/neo_traditional/tattoo_29.png",
        description: "Neo-traditional rose with color",
        style: "neo_traditional"
      }
    ],
    opted_out: false,
  },
  {
    pk: "ARTIST#338",
    sk: "PROFILE",
    artistId: "338",
    avatar: "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-45.jpg",
    bio: "Dotwork and floral specialist with intricate detail work",
    artistsName: "Isabella Foster",
    instagramHandle: "IsabellaFoster_ink",
    profileLink: "https://instagram.com/IsabellaFoster_ink",
    tattooStudio: {
      studioName: "Botanical Tattoo Collective",
      streetAddress: "92 Brick Lane",
      address: { city: "London", latitude: 51.5225, longitude: -0.0714 },
    },
    styles: ["dotwork", "floral", "fineline"],
    portfolioImages: [
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/dotwork/tattoo_60.png",
        description: "Intricate dotwork mandala",
        style: "dotwork"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/floral/tattoo_124.png",
        description: "Delicate floral arrangement",
        style: "floral"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/fineline/tattoo_4.png",
        description: "Fine line botanical design",
        style: "fineline"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/dotwork/tattoo_61.png",
        description: "Geometric dotwork pattern",
        style: "dotwork"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/floral/tattoo_127.png",
        description: "Realistic flower composition",
        style: "floral"
      }
    ],
    opted_out: false,
  },
  {
    pk: "ARTIST#789",
    sk: "PROFILE",
    artistId: "789",
    avatar: "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-67.jpg",
    bio: "Old school and new school tattoo artist with bold, vibrant style",
    artistsName: "Jake Thompson",
    instagramHandle: "JakeThompson_tattoos",
    profileLink: "https://instagram.com/JakeThompson_tattoos",
    tattooStudio: {
      studioName: "Classic Ink Parlour",
      streetAddress: "156 Camden Market",
      address: { city: "London", latitude: 51.5448, longitude: -0.1461 },
    },
    styles: ["old_school", "new_school", "traditional"],
    portfolioImages: [
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/old_school/tattoo_100.png",
        description: "Classic old school anchor",
        style: "old_school"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/new_school/tattoo_12.png",
        description: "Vibrant new school character",
        style: "new_school"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/old_school/tattoo_101.png",
        description: "Traditional sailor jerry style",
        style: "old_school"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/new_school/tattoo_13.png",
        description: "Cartoon-style new school design",
        style: "new_school"
      },
      {
        url: "http://localhost:4566/tattoo-directory-images/styles/traditional/tattoo_102.png",
        description: "Bold traditional eagle",
        style: "traditional"
      }
    ],
    opted_out: false,
  }
];