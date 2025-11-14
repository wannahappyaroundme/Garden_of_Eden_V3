/**
 * Persona Parameter Group Component
 * Accordion-style grouping of related persona parameters
 */

import { useState } from 'react';
import { Slider } from './ui/slider';
import type { PersonaSettings } from '../lib/tauri-api';
import type { PersonaParameterGroup as GroupType } from '@shared/types/persona-groups.types';

interface PersonaParameterGroupProps {
  group: GroupType;
  persona: PersonaSettings;
  onUpdate: (key: keyof PersonaSettings, value: number) => void;
  defaultExpanded?: boolean;
}

export default function PersonaParameterGroup({
  group,
  persona,
  onUpdate,
  defaultExpanded = false,
}: PersonaParameterGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{group.icon}</span>
          <div className="text-left">
            <h3 className="font-semibold text-base">{group.title}</h3>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <svg
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Parameter Sliders - Collapsible */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-6 border-t border-border">
          {group.parameters.map(param => {
            const value = persona[param.key as keyof PersonaSettings] as number;

            return (
              <div key={param.key}>
                <div className="flex justify-between mb-2">
                  <div>
                    <label className="text-sm font-medium">{param.label}</label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {param.description}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {value}/10
                  </span>
                </div>

                <Slider
                  value={[value]}
                  onValueChange={([newValue]) =>
                    onUpdate(param.key as keyof PersonaSettings, newValue)
                  }
                  min={0}
                  max={10}
                  step={1}
                  className="my-2"
                />

                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{param.lowLabel}</span>
                  <span>{param.highLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
