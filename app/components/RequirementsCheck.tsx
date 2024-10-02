import React from 'react';
import { Check, X } from 'lucide-react';

interface Requirement {
  status: 'met' | 'not_met' | 'uncertain' | 'warning';
  message?: string;
}

interface RequirementsCheckProps {
  requirements: Record<string, Requirement>;
}

const RequirementsCheck: React.FC<RequirementsCheckProps> = ({ requirements }) => {
  return (
    <div className="space-y-3">
      {Object.entries(requirements).map(([key, value]) => (
        <div key={key} className="flex items-center space-x-2">
          {value.status === 'met' && (
            <>
              <Check className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-gray-900">{key}</span>
            </>
          )}
          {value.status === 'not_met' && (
            <>
              <X className="text-red-500 flex-shrink-0" size={20} />
              <span className="text-gray-900">{value.message || 'Requirement not met'}</span>
            </>
          )}
          {value.status === 'warning' && (
            <>
              <Check className="text-orange-500 flex-shrink-0" size={20} />
              <span className="text-gray-900">{value.message || key}</span>
            </>
          )}
          {value.status === 'uncertain' && (
            <>
              <Check className="text-gray-400 flex-shrink-0" size={20} />
              <span className="text-gray-900">{key}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default RequirementsCheck;