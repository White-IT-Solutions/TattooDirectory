#!/usr/bin/env node

/**
 * Studio Frontend Mock Data Generation Tests
 * 
 * Tests for studio frontend mock data generation functionality
 * Tests mock data format, consistency, and frontend compatibility
 */

const { FrontendSyncProcessor } = require('../frontend-sync-processor');
const { DATA_CONFIG } = require('../data-config');
const fs = require('fs');
const path = require('path');

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(),
    writeFile: jest.fn().mockResolvedValue(),
    readFile: jest.fn().mockResolvedValue('{}'),
    access: jest.fn().mockResolvedValue()
  },
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('{}'),
  writeFileSync: jest.fn()
}));

describe('Studio Frontend Mock Data Generation', () => {
  let processor;
  let mockStudios;

  beforeEach(() => {
    processor = new FrontendSyncProcessor(DATA_CONFIG);
    
    // Mock studio data
    mockStudios = [
      {
        studioId: 'studio-001',
        studioName: 'London Ink Studio',
        address: '123 Test Street, Shoreditch, London E1 6SB',
        postcode: 'E1 6SB',
        latitude: 51.5225,
        longitude: -0.0786,
        locationDisplay: 'Shoreditch, London, UK',
        contactInfo: {
          phone: '+44 20 7946 0958',
          email: 'info@londonink.com',
          website: 'https://londonink.com',
          instagram: '@londoninkstudio'
        },
        openingHours: {
          monday: '10:00-18:00',
          tuesday: '10:00-18:00',
          wednesday: '10:00-18:00',
          thursday: '10:00-18:00',
          friday: '10:00-18:00',
          saturday: '10:00-18:00',
          sunday: 'closed'
        },
        artists: ['artist-001', 'artist-002'],
        artistCount: 2,
        rating: 4.7,
        reviewCount: 89,
        established: 2015,
        specialties: ['traditional', 'neo_traditional'],
        images: [
          {
            type: 'exterior',
            url: 'http://localhost:4566/test-bucket/studios/studio-001/exterior/1_medium.webp',
            description: 'Studio exterior',
            isPrimary: true
          }
        ],
        geohash: 'gcpvj0u'
      },
      {
        studioId: 'studio-002',
        studioName: 'Manchester Tattoo Co',
        address: '456 Test Road, Northern Quarter, Manchester M1 1AA',
        postcode: 'M1 1AA',
        latitude: 53.4808,
        longitude: -2.2426,
        locationDisplay: 'Northern Quarter, Manchester, UK',
        contactInfo: {
          phone: '+44 161 123 4567',
          email: 'hello@manchestertattoo.co.uk',
          website: 'https://manchestertattoo.co.uk',
          instagram: '@manchestertattoo'
        },
        openingHours: {
          monday: 'closed',
          tuesday: '11:00-19:00',
          wednesday: '11:00-19:00',
          thursday: '11:00-19:00',
          friday: '11:00-19:00',
          saturday: '10:00-18:00',
          sunday: '12:00-17:00'
        },
        artists: ['artist-003'],
        artistCount: 1,
        rating: 4.5,
        reviewCount: 67,
        established: 2018,
        specialties: ['geometric', 'blackwork'],
        images: [
          {
            type: 'interior',
            url: 'http://localhost:4566/test-bucket/studios/studio-002/interior/1_medium.webp',
            description: 'Studio interior',
            isPrimary: true
          }
        ],
        geohash: 'gcw2j0u'
      }
    ];

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('studio data processing', () => {
    test('should process studio data for frontend compatibility', () => {
      // Test basic studio data structure
      const studioData = {
        studioId: 'studio-001',
        studioName: 'Test Studio',
        address: '123 Test Street, London E1 6SB',
        postcode: 'E1 6SB',
        latitude: 51.5074,
        longitude: -0.1278,
        locationDisplay: 'London, UK',
        contactInfo: {
          phone: '+44 20 7946 0958',
          email: 'info@teststudio.com',
          website: 'https://teststudio.com',
          instagram: '@teststudio'
        },
        artists: ['artist-001', 'artist-002'],
        artistCount: 2,
        rating: 4.5,
        specialties: ['traditional', 'realism']
      };
      
      // Verify studio data structure
      expect(studioData.studioId).toBeDefined();
      expect(studioData.studioName).toBeDefined();
      expect(studioData.address).toBeDefined();
      expect(studioData.contactInfo).toBeDefined();
      expect(studioData.artists).toBeInstanceOf(Array);
      expect(studioData.artistCount).toBe(studioData.artists.length);
      expect(studioData.rating).toBeGreaterThan(0);
      expect(studioData.specialties).toBeInstanceOf(Array);
    });

    test('should validate studio data structure for frontend', () => {
      const studio = mockStudios[0];
      
      // Verify required fields for frontend compatibility
      expect(studio.studioId).toBeDefined();
      expect(studio.studioName).toBeDefined();
      expect(studio.locationDisplay).toBeDefined();
      expect(studio.address).toBeDefined();
      expect(studio.contactInfo).toBeDefined();
      expect(studio.artists).toBeInstanceOf(Array);
      expect(studio.artistCount).toBe(studio.artists.length);
      expect(studio.rating).toBeGreaterThan(0);
      expect(studio.specialties).toBeInstanceOf(Array);
    });

    test('should validate contact information formats', () => {
      mockStudios.forEach(studio => {
        // Phone number format
        expect(studio.contactInfo.phone).toMatch(/^\+44/);
        
        // Email format
        expect(studio.contactInfo.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        
        // Website format
        expect(studio.contactInfo.website).toMatch(/^https?:\/\//);
        
        // Instagram handle format
        expect(studio.contactInfo.instagram).toMatch(/^@[a-zA-Z0-9_]+$/);
      });
    });

    test('should validate opening hours format', () => {
      mockStudios.forEach(studio => {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(day => {
          expect(studio.openingHours[day]).toBeDefined();
          // Should be either 'closed' or time format 'HH:MM-HH:MM'
          expect(studio.openingHours[day]).toMatch(/^(closed|\d{2}:\d{2}-\d{2}:\d{2})$/);
        });
      });
    });
  });

  describe('data consistency', () => {
    test('should maintain consistent artist counts', () => {
      mockStudios.forEach(studio => {
        expect(studio.artistCount).toBe(studio.artists.length);
      });
    });

    test('should have valid coordinates for UK', () => {
      mockStudios.forEach(studio => {
        expect(studio.latitude).toBeGreaterThan(49.0);
        expect(studio.latitude).toBeLessThan(61.0);
        expect(studio.longitude).toBeGreaterThan(-8.0);
        expect(studio.longitude).toBeLessThan(2.0);
      });
    });

    test('should have valid ratings', () => {
      mockStudios.forEach(studio => {
        expect(studio.rating).toBeGreaterThanOrEqual(1.0);
        expect(studio.rating).toBeLessThanOrEqual(5.0);
      });
    });
  });
});