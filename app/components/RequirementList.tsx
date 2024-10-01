import React from 'react';

interface Requirement {
  status: 'met' | 'not_met' | 'uncertain';
  message?: string;
}

interface RequirementListProps {
  requirements: Record<string, Requirement>;
}

const RequirementList: React.FC<RequirementListProps> = ({ requirements }) => {
  return (
    <ul className="space-y-2">
      {Object.entries(requirements).map(([key, value]) => {
        let icon;
        let textColor;
        switch (value.status) {
          case 'met':
            icon = '✅';
            textColor = 'text-green-600';
            break;
          case 'not_met':
            icon = '❌';
            textColor = 'text-red-600';
            break;
          case 'uncertain':
          default:
            icon = '⚠️';
            textColor = 'text-yellow-600';
            break;
        }

        return (
          <li key={key} className={`flex items-start ${textColor}`}>
            <span className="mr-2">{icon}</span>
            <div>
              <span>{key}</span>
              {value.message && <p className="text-sm text-gray-600 mt-1">{value.message}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default RequirementList;