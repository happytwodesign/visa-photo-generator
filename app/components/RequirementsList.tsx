import React from 'react';
import { Check } from 'lucide-react';

interface RequirementsListProps {
  requirements?: Record<string, boolean>;
  showChecks?: boolean;
}

const RequirementsList: React.FC<RequirementsListProps> = ({ requirements, showChecks = false }) => {
  const requirementItems = [
    '35x45mm photo size',
    'Neutral facial expression',
    'Eyes open and clearly visible',
    'Face centered and looking straight at the camera',
    'Plain light-colored background',
    'No shadows on face or background',
    'Mouth closed',
    'No hair across eyes',
    'No head covering (unless for religious reasons)',
    'No glare on glasses, or preferably, no glasses'
  ];

  return (
    <div className="mt-4">
      <ul className="space-y-2">
        {requirementItems.map((item, index) => (
          <li key={index} className="flex items-center text-gray-700">
            {showChecks ? (
              requirements && requirements[item] && (
                <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
              )
            ) : (
              <span className="mr-2 flex-shrink-0">•</span>
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RequirementsList;