import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';

export const CurrentDate: React.FC = () => {
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  return (
    <div className="header-datetime" aria-label="Current date">
      <Calendar size={14} className="header-datetime-icon" />
      <span className="header-datetime-text">{formattedDate}</span>
    </div>
  );
};

export default CurrentDate;
