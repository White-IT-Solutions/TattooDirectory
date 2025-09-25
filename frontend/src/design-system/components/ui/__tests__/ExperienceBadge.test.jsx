import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExperienceBadge from '../ExperienceBadge/ExperienceBadge';

describe('ExperienceBadge Component', () => {
  const mockExperience = {
    yearsActive: 8,
    apprenticeshipCompleted: true,
    certifications: ['Bloodborne Pathogen', 'First Aid', 'Advanced Color Theory'],
    specializations: ['Japanese Traditional', 'Neo-Traditional', 'Color Realism'],
    awards: ['Best Traditional Tattoo 2023', 'Artist of the Year 2022'],
    mentorshipPrograms: ['Apprentice Mentor Program'],
    continuingEducation: ['Advanced Shading Workshop 2023', 'Color Theory Masterclass'],
    professionalMemberships: ['Professional Tattoo Artists Guild']
  };

  describe('Basic Rendering', () => {
    test('renders experience badges correctly', () => {
      render(<ExperienceBadge experience={mockExperience} />);
      
      expect(screen.getByText('8 years')).toBeInTheDocument();
      expect(screen.getByText('👑')).toBeInTheDocument(); // Master level icon
      expect(screen.getByText('Certified')).toBeInTheDocument();
    });

    test('handles null experience gracefully', () => {
      render(<ExperienceBadge experience={null} />);
      
      expect(document.body.firstChild).toBeEmptyDOMElement();
    });

    test('handles empty experience object', () => {
      render(<ExperienceBadge experience={{}} />);
      
      // Should render container but minimal content
      expect(document.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('Experience Levels', () => {
    test('shows master level for 10+ years', () => {
      const masterExperience = { ...mockExperience, yearsActive: 12 };
      render(<ExperienceBadge experience={masterExperience} />);
      
      expect(screen.getByText('👑')).toBeInTheDocument();
      expect(screen.getByText('12 years')).toBeInTheDocument();
    });

    test('shows expert level for 5-9 years', () => {
      const expertExperience = { ...mockExperience, yearsActive: 7 };
      render(<ExperienceBadge experience={expertExperience} />);
      
      expect(screen.getByText('⭐')).toBeInTheDocument();
      expect(screen.getByText('7 years')).toBeInTheDocument();
    });

    test('shows experienced level for 2-4 years', () => {
      const experiencedArtist = { ...mockExperience, yearsActive: 3 };
      render(<ExperienceBadge experience={experiencedArtist} />);
      
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('3 years')).toBeInTheDocument();
    });

    test('shows certified level for apprenticeship completed', () => {
      const certifiedArtist = { 
        yearsActive: 1, 
        apprenticeshipCompleted: true 
      };
      render(<ExperienceBadge experience={certifiedArtist} />);
      
      expect(screen.getByText('🎓')).toBeInTheDocument();
      expect(screen.getByText('Certified')).toBeInTheDocument();
    });

    test('shows emerging level for new artists', () => {
      const emergingArtist = { 
        yearsActive: 1, 
        apprenticeshipCompleted: false 
      };
      render(<ExperienceBadge experience={emergingArtist} />);
      
      expect(screen.getByText('🌱')).toBeInTheDocument();
    });
  });

  describe('Awards Display', () => {
    test('shows award badge when awards present', () => {
      render(<ExperienceBadge experience={mockExperience} />);
      
      expect(screen.getByText('🏆')).toBeInTheDocument();
      expect(screen.getByText('2 Awards')).toBeInTheDocument();
    });

    test('shows single award correctly', () => {
      const singleAwardExperience = {
        ...mockExperience,
        awards: ['Best Traditional Tattoo 2023']
      };
      render(<ExperienceBadge experience={singleAwardExperience} />);
      
      expect(screen.getByText('1 Award')).toBeInTheDocument();
    });

    test('hides award badge when no awards', () => {
      const noAwardsExperience = { ...mockExperience, awards: [] };
      render(<ExperienceBadge experience={noAwardsExperience} />);
      
      expect(screen.queryByText('🏆')).not.toBeInTheDocument();
    });
  });

  describe('Variant Layouts', () => {
    test('renders compact variant correctly', () => {
      render(<ExperienceBadge experience={mockExperience} variant="compact" />);
      
      expect(screen.getByText('8y')).toBeInTheDocument(); // Shortened format
      expect(screen.getByText('Cert')).toBeInTheDocument(); // Shortened format
    });

    test('renders detailed variant with professional memberships', () => {
      render(<ExperienceBadge experience={mockExperience} variant="detailed" />);
      
      expect(screen.getByText('🏛️')).toBeInTheDocument();
      expect(screen.getByText('Professional Member')).toBeInTheDocument();
    });

    test('shows specializations count in default variant', () => {
      render(<ExperienceBadge experience={mockExperience} />);
      
      expect(screen.getByText('+3 specializations')).toBeInTheDocument();
    });

    test('hides specializations in compact variant', () => {
      render(<ExperienceBadge experience={mockExperience} variant="compact" />);
      
      expect(screen.queryByText('+3 specializations')).not.toBeInTheDocument();
    });
  });

  describe('Tooltip Functionality', () => {
    test('shows detailed tooltip on hover', async () => {
      render(<ExperienceBadge experience={mockExperience} showTooltip={true} />);
      
      const badge = screen.getByText('8 years').closest('div');
      fireEvent.mouseEnter(badge);
      
      await waitFor(() => {
        expect(screen.getByText('Experience Level: Master')).toBeInTheDocument();
        expect(screen.getByText('8 years active in the tattoo industry')).toBeInTheDocument();
      });
    });

    test('shows specializations in tooltip', async () => {
      render(<ExperienceBadge experience={mockExperience} showTooltip={true} />);
      
      const badge = screen.getByText('8 years').closest('div');
      fireEvent.mouseEnter(badge);
      
      await waitFor(() => {
        expect(screen.getByText('Specializations')).toBeInTheDocument();
        expect(screen.getByText('Japanese Traditional')).toBeInTheDocument();
        expect(screen.getByText('Neo-Traditional')).toBeInTheDocument();
      });
    });

    test('shows awards in tooltip', async () => {
      render(<ExperienceBadge experience={mockExperience} showTooltip={true} />);
      
      const badge = screen.getByText('8 years').closest('div');
      fireEvent.mouseEnter(badge);
      
      await waitFor(() => {
        expect(screen.getByText('Awards & Recognition')).toBeInTheDocument();
        expect(screen.getByText('Best Traditional Tattoo 2023')).toBeInTheDocument();
      });
    });

    test('shows certifications in tooltip', async () => {
      render(<ExperienceBadge experience={mockExperience} showTooltip={true} />);
      
      const badge = screen.getByText('8 years').closest('div');
      fireEvent.mouseEnter(badge);
      
      await waitFor(() => {
        expect(screen.getByText('Certifications')).toBeInTheDocument();
        expect(screen.getByText('Bloodborne Pathogen')).toBeInTheDocument();
        expect(screen.getByText('First Aid')).toBeInTheDocument();
      });
    });

    test('shows continuing education in tooltip', async () => {
      render(<ExperienceBadge experience={mockExperience} showTooltip={true} />);
      
      const badge = screen.getByText('8 years').closest('div');
      fireEvent.mouseEnter(badge);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Training')).toBeInTheDocument();
        expect(screen.getByText('Advanced Shading Workshop 2023')).toBeInTheDocument();
      });
    });

    test('hides tooltip on mouse leave', async () => {
      render(<ExperienceBadge experience={mockExperience} showTooltip={true} />);
      
      const badge = screen.getByText('8 years').closest('div');
      fireEvent.mouseEnter(badge);
      
      await waitFor(() => {
        expect(screen.getByText('Experience Level: Master')).toBeInTheDocument();
      });
      
      fireEvent.mouseLeave(badge);
      
      await waitFor(() => {
        expect(screen.queryByText('Experience Level: Master')).not.toBeInTheDocument();
      });
    });
  });

  describe('Certifications Display', () => {
    test('shows top certifications as badges', () => {
      render(<ExperienceBadge experience={mockExperience} />);
      
      expect(screen.getByText('Bloodborne Pathogen')).toBeInTheDocument();
      expect(screen.getByText('First Aid')).toBeInTheDocument();
    });

    test('limits certification badges in compact variant', () => {
      render(<ExperienceBadge experience={mockExperience} variant="compact" />);
      
      expect(screen.getByText('Bloodborne Pathogen')).toBeInTheDocument();
      expect(screen.queryByText('First Aid')).not.toBeInTheDocument(); // Only shows 1 in compact
    });
  });

  describe('Size Variants', () => {
    test('applies correct size classes', () => {
      render(<ExperienceBadge experience={mockExperience} size="lg" />);
      
      // Should apply large size to badges
      expect(document.querySelector('[class*="text-lg"]')).toBeInTheDocument();
    });
  });

  describe('Professional Memberships', () => {
    test('shows professional membership badge in detailed variant', () => {
      render(<ExperienceBadge experience={mockExperience} variant="detailed" />);
      
      expect(screen.getByText('🏛️')).toBeInTheDocument();
      expect(screen.getByText('Professional Member')).toBeInTheDocument();
    });

    test('hides professional membership in compact variant', () => {
      render(<ExperienceBadge experience={mockExperience} variant="compact" />);
      
      expect(screen.queryByText('Professional Member')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles single year correctly', () => {
      const oneYearExperience = { ...mockExperience, yearsActive: 1 };
      render(<ExperienceBadge experience={oneYearExperience} />);
      
      expect(screen.getByText('1 year')).toBeInTheDocument(); // Singular form
    });

    test('handles zero years gracefully', () => {
      const zeroYearExperience = { ...mockExperience, yearsActive: 0 };
      render(<ExperienceBadge experience={zeroYearExperience} />);
      
      // Should still render other badges
      expect(screen.getByText('Certified')).toBeInTheDocument();
    });

    test('handles missing arrays gracefully', () => {
      const minimalExperience = { yearsActive: 5 };
      render(<ExperienceBadge experience={minimalExperience} />);
      
      expect(screen.getByText('5 years')).toBeInTheDocument();
      // Should not crash with missing arrays
    });
  });

  describe('Accessibility', () => {
    test('provides proper semantic structure', () => {
      render(<ExperienceBadge experience={mockExperience} />);
      
      // Should have proper badge structure for screen readers
      expect(screen.getByText('8 years')).toBeInTheDocument();
      expect(screen.getByText('Certified')).toBeInTheDocument();
    });

    test('tooltip provides additional context for screen readers', async () => {
      render(<ExperienceBadge experience={mockExperience} showTooltip={true} />);
      
      const badge = screen.getByText('8 years').closest('div');
      fireEvent.mouseEnter(badge);
      
      await waitFor(() => {
        // Tooltip should provide detailed information
        expect(screen.getByText('8 years active in the tattoo industry')).toBeInTheDocument();
      });
    });
  });
});