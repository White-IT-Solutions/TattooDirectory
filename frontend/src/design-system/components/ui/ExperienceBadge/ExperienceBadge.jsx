"use client";
import { useState } from 'react';
import { cn } from '../../../utils/cn';
import Badge from '../Badge/Badge';
import Card from '../Card/Card';

export default function ExperienceBadge({ 
  experience, 
  size = 'sm',
  showTooltip = false,
  variant = 'default',
  className 
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (!experience) return null;

  const { 
    yearsActive, 
    apprenticeshipCompleted, 
    certifications = [],
    specializations = [],
    awards = [],
    mentorshipPrograms = [],
    continuingEducation = [],
    professionalMemberships = []
  } = experience;

  const getExperienceLevel = () => {
    if (yearsActive >= 10) return { label: 'Master', variant: 'accent', icon: '👑' };
    if (yearsActive >= 5) return { label: 'Expert', variant: 'primary', icon: '⭐' };
    if (yearsActive >= 2) return { label: 'Experienced', variant: 'success', icon: '✓' };
    if (apprenticeshipCompleted) return { label: 'Certified', variant: 'secondary', icon: '🎓' };
    return { label: 'Emerging', variant: 'outline', icon: '🌱' };
  };

  const experienceLevel = getExperienceLevel();

  return (
    <div 
      className={cn('relative', className)}
      onMouseEnter={() => showTooltip && setShowDetails(true)}
      onMouseLeave={() => showTooltip && setShowDetails(false)}
    >
      <div className={cn('flex flex-wrap gap-1', variant === 'compact' ? 'gap-0.5' : 'gap-1')}>
        {/* Experience level badge */}
        {yearsActive && (
          <Badge 
            variant={experienceLevel.variant} 
            size={size}
            icon={<span>{experienceLevel.icon}</span>}
          >
            {variant === 'compact' 
              ? `${yearsActive}y` 
              : `${yearsActive} year${yearsActive !== 1 ? 's' : ''}`
            }
          </Badge>
        )}

        {/* Apprenticeship status */}
        {apprenticeshipCompleted && (
          <Badge variant="success" size={size} icon={<span>🎓</span>}>
            {variant === 'compact' ? 'Cert' : 'Certified'}
          </Badge>
        )}

        {/* Awards */}
        {awards.length > 0 && (
          <Badge variant="accent" size={size} icon={<span>🏆</span>}>
            {variant === 'compact' ? 'Award' : `${awards.length} Award${awards.length > 1 ? 's' : ''}`}
          </Badge>
        )}

        {/* Specializations */}
        {specializations.length > 0 && variant !== 'compact' && (
          <Badge variant="outline" size={size}>
            +{specializations.length} specialization{specializations.length > 1 ? 's' : ''}
          </Badge>
        )}

        {/* Top certifications */}
        {certifications.slice(0, variant === 'compact' ? 1 : 2).map((cert, index) => (
          <Badge key={index} variant="outline" size={size}>
            {cert}
          </Badge>
        ))}

        {/* Professional memberships */}
        {professionalMemberships.length > 0 && variant === 'detailed' && (
          <Badge variant="secondary" size={size} icon={<span>🏛️</span>}>
            Professional Member
          </Badge>
        )}
      </div>

      {/* Detailed tooltip */}
      {showDetails && showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <Card className="p-4 w-72 shadow-lg">
            <div className="space-y-3">
              {/* Experience summary */}
              <div>
                <h4 className="font-semibold text-sm text-neutral-900 mb-1">
                  Experience Level: {experienceLevel.label}
                </h4>
                <p className="text-xs text-neutral-600">
                  {yearsActive} years active in the tattoo industry
                  {apprenticeshipCompleted && ', certified professional'}
                </p>
              </div>

              {/* Specializations */}
              {specializations.length > 0 && (
                <div>
                  <h5 className="font-medium text-xs text-neutral-700 mb-1">Specializations</h5>
                  <div className="flex flex-wrap gap-1">
                    {specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards */}
              {awards.length > 0 && (
                <div>
                  <h5 className="font-medium text-xs text-neutral-700 mb-1">Awards & Recognition</h5>
                  <ul className="text-xs text-neutral-600 space-y-0.5">
                    {awards.slice(0, 3).map((award, index) => (
                      <li key={index}>• {award}</li>
                    ))}
                    {awards.length > 3 && (
                      <li className="text-neutral-500">+{awards.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <div>
                  <h5 className="font-medium text-xs text-neutral-700 mb-1">Certifications</h5>
                  <div className="flex flex-wrap gap-1">
                    {certifications.map((cert, index) => (
                      <Badge key={index} variant="success" size="sm">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Continuing education */}
              {continuingEducation.length > 0 && (
                <div>
                  <h5 className="font-medium text-xs text-neutral-700 mb-1">Recent Training</h5>
                  <ul className="text-xs text-neutral-600 space-y-0.5">
                    {continuingEducation.slice(0, 2).map((edu, index) => (
                      <li key={index}>• {edu}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}