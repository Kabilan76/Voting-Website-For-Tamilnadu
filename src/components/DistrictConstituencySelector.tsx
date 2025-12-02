
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { MapPin, LocateFixed } from 'lucide-react';
import { getAllDistricts, getConstituenciesForDistrict } from '@/data/tamilNaduConstituencies';

interface DistrictConstituencySelectorProps {
  selectedDistrict: string;
  selectedConstituency: string;
  onDistrictChange: (district: string) => void;
  onConstituencyChange: (constituency: string) => void;
  className?: string;
  isMobile?: boolean;
  label?: boolean;
}

const DistrictConstituencySelector: React.FC<DistrictConstituencySelectorProps> = ({
  selectedDistrict,
  selectedConstituency,
  onDistrictChange,
  onConstituencyChange,
  className = '',
  isMobile = false,
  label = true
}) => {
  const [districts] = useState<string[]>(getAllDistricts());
  const [constituencies, setConstituencies] = useState<string[]>([]);

  // Update constituencies when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const districtConstituencies = getConstituenciesForDistrict(selectedDistrict);
      setConstituencies(districtConstituencies);
      
      // If current constituency is not in the new district's constituencies, reset it
      if (selectedConstituency && !districtConstituencies.includes(selectedConstituency)) {
        onConstituencyChange('');
      }
    } else {
      setConstituencies([]);
      onConstituencyChange('');
    }
  }, [selectedDistrict, selectedConstituency, onConstituencyChange]);

  const labelClassName = isMobile ? "text-sm" : "text-base";
  const inputClassName = isMobile ? "h-9 text-sm" : "h-10 text-base";
  const iconSize = isMobile ? 16 : 18;
  const iconClassname = isMobile ? "absolute left-3 top-2.5 h-4 w-4 text-ijkred" : "absolute left-3 top-3 h-4 w-4 text-ijkred";

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        {label && (
          <Label htmlFor="district" className={`text-ijkred-dark ${labelClassName}`}>
            மாவட்டம்
          </Label>
        )}
        <div className="relative">
          <MapPin className={iconClassname} size={iconSize} />
          <Select value={selectedDistrict} onValueChange={onDistrictChange}>
            <SelectTrigger 
              id="district" 
              className={`pl-10 border-ijkred/30 focus-visible:ring-ijkred ${inputClassName}`}
            >
              <SelectValue placeholder="மாவட்டத்தை தேர்வு செய்யவும்" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {districts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedDistrict && (
        <div className="space-y-2">
          {label && (
            <Label htmlFor="constituency" className={`text-ijkred-dark ${labelClassName}`}>
             மண்டலம்
            </Label>
          )}
          <div className="relative">
            <LocateFixed className={iconClassname} size={iconSize} />
            <Select 
              value={selectedConstituency} 
              onValueChange={onConstituencyChange}
              disabled={constituencies.length === 0}
            >
              <SelectTrigger 
                id="constituency" 
                className={`pl-10 border-ijkred/30 focus-visible:ring-ijkred ${inputClassName}`}
              >
                <SelectValue placeholder="மண்டலத்தை தேர்வு செய்யவும்" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {constituencies.map((constituency) => (
                  <SelectItem key={constituency} value={constituency}>
                    {constituency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictConstituencySelector;
