import React from 'react';

interface RequirementsListProps {
  requirements?: Record<string, boolean>;
}

const RequirementsList: React.FC<RequirementsListProps> = ({ requirements }) => {
  const defaultRequirements = [
    "35x45mm photo size",
    "Neutral facial expression",
    "Eyes open and clearly visible",
    "Face centered and looking straight at the camera",
    "Plain light-colored background",
    "No shadows on face or background",
    "Mouth closed",
    "No hair across eyes",
    "No head covering (unless for religious reasons)",
    "No glare on glasses, or preferably, no glasses"
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Schengen Visa Photo Requirements</h3>
      <ul className="list-disc pl-5">
        {defaultRequirements.map((req, index) => (
          <li key={index} className={requirements ? (requirements[req] ? 'text-green-500' : 'text-red-500') : ''}>
            {req}
          </li>
        ))}
      </ul>
      <a href="https://ec.europa.eu/home-affairs/schengen-visa_en" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-2 inline-block">
        Source: Official Schengen Visa Info
      </a>
    </div>
  );
};

export default RequirementsList;