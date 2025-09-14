/**
 * Unit tests for DynamoDB data access layer
 * 
 * Note: These tests focus on key generation and data structure validation.
 * Integration tests with actual DynamoDB should be in separate test files.
 */

import {
    generateArtistKeys,
    generateStyleGeohashKeys,
    generateArtistNameKeys,
    generateInstagramKeys,
    generateAllGSIKeys,
    createArtistItem
} from '../dynamodb.js';

describe('DynamoDB Data Access Layer', () => {

    describe('Key Generation Functions', () => {
        describe('generateArtistKeys', () => {
            it('should generate correct primary keys for an artist', () => {
                const artistId = 'artist-123';
                const keys = generateArtistKeys(artistId);
                
                expect(keys).toEqual({
                    PK: 'ARTIST#artist-123',
                    SK: 'METADATA'
                });
            });

            it('should throw error when artistId is missing', () => {
                expect(() => generateArtistKeys()).toThrow('artistId is required for key generation');
                expect(() => generateArtistKeys('')).toThrow('artistId is required for key generation');
            });
        });

        describe('generateStyleGeohashKeys', () => {
            it('should generate correct GSI1 keys with provided shard', () => {
                const keys = generateStyleGeohashKeys('traditional', 'gcpvj', 'artist-123', 5);
                
                expect(keys).toEqual({
                    gsi1pk: 'STYLE#traditional#SHARD#5',
                    gsi1sk: 'GEOHASH#gcpvj#ARTIST#artist-123'
                });
            });

            it('should generate GSI1 keys with random shard when not provided', () => {
                const keys = generateStyleGeohashKeys('realism', 'gcpvj', 'artist-123');
                
                expect(keys.gsi1pk).toMatch(/^STYLE#realism#SHARD#[0-9]$/);
                expect(keys.gsi1sk).toBe('GEOHASH#gcpvj#ARTIST#artist-123');
            });

            it('should normalize style to lowercase', () => {
                const keys = generateStyleGeohashKeys('TRADITIONAL', 'gcpvj', 'artist-123', 0);
                
                expect(keys.gsi1pk).toBe('STYLE#traditional#SHARD#0');
            });

            it('should throw error when required parameters are missing', () => {
                expect(() => generateStyleGeohashKeys()).toThrow('style, geohash, and artistId are required for GSI1 key generation');
                expect(() => generateStyleGeohashKeys('traditional')).toThrow('style, geohash, and artistId are required for GSI1 key generation');
                expect(() => generateStyleGeohashKeys('traditional', 'gcpvj')).toThrow('style, geohash, and artistId are required for GSI1 key generation');
            });
        });

        describe('generateArtistNameKeys', () => {
            it('should generate correct GSI2 keys with normalized name', () => {
                const keys = generateArtistNameKeys('Alex The Artist', 'artist-123');
                
                expect(keys).toEqual({
                    gsi2pk: 'ARTISTNAME#alextheartist',
                    gsi2sk: 'ARTIST#artist-123'
                });
            });

            it('should handle names with special characters', () => {
                const keys = generateArtistNameKeys('Alex-The Artist!', 'artist-123');
                
                expect(keys.gsi2pk).toBe('ARTISTNAME#alextheartist');
            });

            it('should throw error when required parameters are missing', () => {
                expect(() => generateArtistNameKeys()).toThrow('artistName and artistId are required for GSI2 key generation');
                expect(() => generateArtistNameKeys('Alex')).toThrow('artistName and artistId are required for GSI2 key generation');
            });
        });

        describe('generateInstagramKeys', () => {
            it('should generate correct GSI3 keys', () => {
                const keys = generateInstagramKeys('alextattoo');
                
                expect(keys).toEqual({
                    gsi3pk: 'INSTAGRAM#alextattoo'
                });
            });

            it('should remove @ symbol and normalize to lowercase', () => {
                const keys = generateInstagramKeys('@AlexTattoo');
                
                expect(keys.gsi3pk).toBe('INSTAGRAM#alextattoo');
            });

            it('should throw error when instagramHandle is missing', () => {
                expect(() => generateInstagramKeys()).toThrow('instagramHandle is required for GSI3 key generation');
                expect(() => generateInstagramKeys('')).toThrow('instagramHandle is required for GSI3 key generation');
            });
        });

        describe('generateAllGSIKeys', () => {
            it('should generate all GSI keys when all data is provided', () => {
                const artistData = {
                    artistId: 'artist-123',
                    artistName: 'Alex The Artist',
                    instagramHandle: 'alextattoo',
                    styles: ['traditional', 'realism'],
                    geohash: 'gcpvj'
                };

                const keys = generateAllGSIKeys(artistData);
                
                expect(keys).toMatchObject({
                    gsi2pk: 'ARTISTNAME#alextheartist',
                    gsi2sk: 'ARTIST#artist-123',
                    gsi3pk: 'INSTAGRAM#alextattoo'
                });
                expect(keys.gsi1pk).toMatch(/^STYLE#traditional#SHARD#[0-9]$/);
                expect(keys.gsi1sk).toBe('GEOHASH#gcpvj#ARTIST#artist-123');
            });

            it('should generate only required keys when optional data is missing', () => {
                const artistData = {
                    artistId: 'artist-123',
                    artistName: 'Alex The Artist'
                };

                const keys = generateAllGSIKeys(artistData);
                
                expect(keys).toEqual({
                    gsi2pk: 'ARTISTNAME#alextheartist',
                    gsi2sk: 'ARTIST#artist-123'
                });
            });

            it('should throw error when required data is missing', () => {
                expect(() => generateAllGSIKeys({})).toThrow('artistId and artistName are required');
                expect(() => generateAllGSIKeys({ artistId: 'artist-123' })).toThrow('artistId and artistName are required');
            });
        });

        describe('createArtistItem', () => {
            it('should create complete artist item with all keys', () => {
                const artistData = {
                    artistId: 'artist-123',
                    artistName: 'Alex The Artist',
                    instagramHandle: 'alextattoo',
                    geohash: 'gcpvj',
                    locationDisplay: 'Leeds, UK',
                    styles: ['traditional'],
                    portfolioImages: ['image1.jpg'],
                    contactInfo: { email: 'alex@example.com' }
                };

                const item = createArtistItem(artistData);
                
                expect(item).toMatchObject({
                    PK: 'ARTIST#artist-123',
                    SK: 'METADATA',
                    gsi2pk: 'ARTISTNAME#alextheartist',
                    gsi2sk: 'ARTIST#artist-123',
                    gsi3pk: 'INSTAGRAM#alextattoo',
                    artistName: 'Alex The Artist',
                    instagramHandle: 'alextattoo',
                    geohash: 'gcpvj',
                    locationDisplay: 'Leeds, UK',
                    styles: ['traditional'],
                    portfolioImages: ['image1.jpg'],
                    contactInfo: { email: 'alex@example.com' },
                    itemType: 'ARTIST_METADATA'
                });
                
                expect(item.gsi1pk).toMatch(/^STYLE#traditional#SHARD#[0-9]$/);
                expect(item.gsi1sk).toBe('GEOHASH#gcpvj#ARTIST#artist-123');
                expect(item.createdAt).toBeDefined();
                expect(item.updatedAt).toBeDefined();
            });

            it('should use default values for optional fields', () => {
                const artistData = {
                    artistId: 'artist-123',
                    artistName: 'Alex The Artist'
                };

                const item = createArtistItem(artistData);
                
                expect(item.styles).toEqual([]);
                expect(item.portfolioImages).toEqual([]);
                expect(item.contactInfo).toEqual({});
            });
        });
    });


});