import React from 'react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface ProcessingConfigProps {
  removeBackground: boolean;
  onRemoveBackgroundChange: (value: boolean) => void;
}

export function ProcessingConfig({ removeBackground, onRemoveBackgroundChange }: ProcessingConfigProps) {
  return (
    <div className="flex items-center space-x-2 mt-4">
      <Switch
        id="remove-background"
        checked={removeBackground}
        onCheckedChange={onRemoveBackgroundChange}
      />
      <Label htmlFor="remove-background">Remove Background</Label>
    </div>
  );
}