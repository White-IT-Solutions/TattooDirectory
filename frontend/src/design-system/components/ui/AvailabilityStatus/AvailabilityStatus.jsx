"use client";
import { cn } from '../../../utils/cn';
import Badge from '../Badge/Badge';
import Button from '../Button/Button';
import { FormattedDate } from '../DataVisualization/DataFormatting';

export default function AvailabilityStatus({ 
  availability, 
  size = 'sm',
  showActions = false,
  onBookingClick,
  onWaitListClick,
  className 
}) {
  if (!availability) return null;

  const { 
    bookingOpen, 
    nextAvailable, 
    waitingList,
    waitingListCount = 0,
    estimatedWaitTime,
    bookingUrl,
    consultationRequired = false,
    emergencySlots = false
  } = availability;

  const getStatusVariant = () => {
    if (!bookingOpen) return 'error';
    if (waitingList) return 'warning';
    if (emergencySlots) return 'accent';
    return 'success';
  };

  const getStatusText = () => {
    if (!bookingOpen) return 'Booking Closed';
    if (emergencySlots) return 'Emergency Slots';
    if (waitingList) return 'Waiting List';
    return 'Available';
  };

  const getStatusIcon = () => {
    if (!bookingOpen) return '🚫';
    if (emergencySlots) return '⚡';
    if (waitingList) return '⏳';
    return '✅';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <Badge 
          variant={getStatusVariant()} 
          size={size}
          icon={<span>{getStatusIcon()}</span>}
        >
          {getStatusText()}
        </Badge>
        
        {/* Waiting list count */}
        {waitingList && waitingListCount > 0 && (
          <Badge variant="outline" size="sm">
            {waitingListCount} waiting
          </Badge>
        )}
      </div>

      {/* Availability details */}
      <div className="space-y-1 text-xs text-neutral-600">
        {nextAvailable && bookingOpen && (
          <div className="flex items-center gap-1">
            <span>Next available:</span>
            <FormattedDate date={nextAvailable} format="short" />
          </div>
        )}
        
        {estimatedWaitTime && waitingList && (
          <div className="flex items-center gap-1">
            <span>Est. wait:</span>
            <span className="font-medium">{estimatedWaitTime}</span>
          </div>
        )}
        
        {consultationRequired && (
          <div className="flex items-center gap-1 text-accent-600">
            <span>💬</span>
            <span>Consultation required</span>
          </div>
        )}
        
        {emergencySlots && (
          <div className="flex items-center gap-1 text-accent-600">
            <span>⚡</span>
            <span>Last-minute slots available</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2">
          {bookingOpen && !waitingList && (
            <Button
              variant="primary"
              size="sm"
              onClick={onBookingClick}
              className="flex-1"
            >
              Book Now
            </Button>
          )}
          
          {waitingList && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onWaitListClick}
              className="flex-1"
            >
              Join Wait List
            </Button>
          )}
          
          {!bookingOpen && (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex-1"
            >
              Bookings Closed
            </Button>
          )}
          
          {consultationRequired && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => onBookingClick && onBookingClick('consultation')}
              className="flex-1"
            >
              Book Consultation
            </Button>
          )}
        </div>
      )}

      {/* Booking link */}
      {bookingUrl && !showActions && (
        <div className="text-xs">
          <a 
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 underline"
          >
            Book online →
          </a>
        </div>
      )}
    </div>
  );
}