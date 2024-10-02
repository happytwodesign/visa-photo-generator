import React from 'react';

interface RequirementsListProps {
  requirements: string[];
}

const RequirementsList: React.FC<RequirementsListProps> = ({ requirements }) => {
  return (
    <ul className="list-disc pl-5 space-y-3">
      {requirements.map((requirement, index) => (
        <li key={index} className="text-gray-900">{requirement}</li>
      ))}
    </ul>
  );
};

export default RequirementsList;