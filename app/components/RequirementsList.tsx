import { Check } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface RequirementsListProps {
  requirements?: Record<string, boolean>;
  showChecks?: boolean;
}

export default function RequirementsList({ requirements, showChecks = false }: RequirementsListProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const defaultRequirements = {
    '35x45mm photo size': true,
    'Neutral facial expression': true,
    'Eyes open and clearly visible': true,
    'Face centered and looking straight at the camera': true,
    'Plain light-colored background': true,
    'No shadows on face or background': true,
    'Mouth closed': true,
    'No hair across eyes': true,
    'No head covering (unless for religious reasons)': true,
    'No glare on glasses, or preferably, no glasses': true
  };

  const requirementsToShow = requirements || defaultRequirements;

  return (
    <ul className={`space-y-2 ${!showChecks ? 'list-disc list-inside' : ''}`}>
      {Object.entries(requirementsToShow).map(([requirement, met]) => (
        <li key={requirement} className={`${isMobile ? 'text-sm' : 'text-base'} ${showChecks ? 'flex items-start' : ''}`}>
          {showChecks ? (
            <span className={`mr-2 mt-1 ${met ? 'text-green-500' : 'text-red-500'}`}>
              {met ? <Check size={16} /> : '✗'}
            </span>
          ) : null}
          <span>{requirement}</span>
        </li>
      ))}
    </ul>
  );
}