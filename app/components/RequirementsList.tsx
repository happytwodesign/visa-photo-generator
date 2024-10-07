import React from 'react';
import { Check, X, AlertTriangle, HelpCircle } from 'lucide-react';

interface Requirement {
  name: string;
  status: 'Pass' | 'Fail' | 'Recommendation' | 'Semi Pass';
  message?: string;
}

interface RequirementsListProps {
  requirements: Requirement[];
}

const RequirementsList: React.FC<RequirementsListProps> = ({ requirements }) => {
  const getStatusIcon = (status: Requirement['status']) => {
    switch (status) {
      case 'Pass':
        return <Check className="text-green-500" />;
      case 'Fail':
        return <X className="text-red-500" />;
      case 'Recommendation':
      case 'Semi Pass':
        return <AlertTriangle className="text-orange-500" />;
      default:
        return <HelpCircle className="text-gray-500" />;
    }
  };

  return (
    <ul className="space-y-2">
      {requirements.map((req, index) => (
        <li key={index} className="flex items-start">
          <span className="mr-2 mt-1">{getStatusIcon(req.status)}</span>
          <div>
            <span className="font-medium">{req.name}</span>
            {req.message && <p className="text-sm text-gray-600">{req.message}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default RequirementsList;