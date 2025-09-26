import { render, screen } from '@testing-library/react';
import ExperienceBadge from '../ExperienceBadge';

describe('ExperienceBadge', () => {
  it('displays years of experience', () => {
    const experience = { yearsActive: 5 };
    render(<ExperienceBadge experience={experience} />);
    
    expect(screen.getByText('5 years')).toBeInTheDocument();
  });

  it('displays singular year correctly', () => {
    const experience = { yearsActive: 1 };
    render(<ExperienceBadge experience={experience} />);
    
    expect(screen.getByText('1 year')).toBeInTheDocument();
  });

  it('shows certified badge when apprenticeship completed', () => {
    const experience = { apprenticeshipCompleted: true };
    render(<ExperienceBadge experience={experience} />);
    
    expect(screen.getByText('Certified')).toBeInTheDocument();
  });

  it('displays certifications', () => {
    const experience = { 
      certifications: ['First Aid', 'Bloodborne Pathogens', 'Advanced Shading']
    };
    render(<ExperienceBadge experience={experience} />);
    
    expect(screen.getByText('First Aid')).toBeInTheDocument();
    expect(screen.getByText('Bloodborne Pathogens')).toBeInTheDocument();
    // Should only show first 2 certifications
    expect(screen.queryByText('Advanced Shading')).not.toBeInTheDocument();
  });

  it('displays all experience elements together', () => {
    const experience = { 
      yearsActive: 8,
      apprenticeshipCompleted: true,
      certifications: ['First Aid', 'Bloodborne Pathogens']
    };
    render(<ExperienceBadge experience={experience} />);
    
    expect(screen.getByText('8 years')).toBeInTheDocument();
    expect(screen.getByText('Certified')).toBeInTheDocument();
    expect(screen.getByText('First Aid')).toBeInTheDocument();
    expect(screen.getByText('Bloodborne Pathogens')).toBeInTheDocument();
  });

  it('returns null when no experience provided', () => {
    const { container } = render(<ExperienceBadge experience={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles empty certifications array', () => {
    const experience = { 
      yearsActive: 3,
      certifications: []
    };
    render(<ExperienceBadge experience={experience} />);
    
    expect(screen.getByText('3 years')).toBeInTheDocument();
  });
});