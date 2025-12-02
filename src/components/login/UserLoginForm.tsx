
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PhoneCall, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useElection } from '@/contexts/ElectionContext';
import DistrictConstituencySelector from '@/components/DistrictConstituencySelector';

interface UserLoginFormProps {
  onLoginSuccess: () => void;
  isMobile?: boolean;
}

const UserLoginForm: React.FC<UserLoginFormProps> = ({ onLoginSuccess, isMobile = false }) => {
  const { toast } = useToast();
  const { login, hasVoted, setHasVoted } = useAuth();
  const { hasUserVoted } = useElection();

  // User login state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState('');
  const [constituency, setConstituency] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUserLogin = async () => {
    if (!phoneNumber || phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
      });
      return;
    }
  
    if (!district) {
      toast({
        variant: "destructive",
        title: "District Required",
        description: "Please select your district",
      });
      return;
    }
  
    if (!constituency) {
      toast({
        variant: "destructive",
        title: "Constituency Required",
        description: "Please select your constituency",
      });
      return;
    }
  
    if (!password) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter your password",
      });
      return;
    }
  
    setIsLoading(true);
  
    try {
      const response = await fetch(`http://localhost:5000/voters?phoneNumber=${phoneNumber}&password=${password}`);
      const data = await response.json();
  
      if (!data.success || !data.voter) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid phone number or password.",
        });
        setIsLoading(false);
        return;
      }
  
      const user = data.voter;
  
      if (user.userDistrict !== district || user.userConstituency !== constituency) {
        toast({
          variant: "destructive",
          title: "Invalid Details",
          description: "District or Constituency doesn't match our records.",
        });
        setIsLoading(false);
        return;
      }
  
      if (user.hasVoted) {
        toast({
          variant: "destructive",
          title: "Already Voted",
          description: "You have already cast your vote.",
        });
        setIsLoading(false);
        return;
      }
  
      const displayName = user.userName || userName || `Voter-${phoneNumber.slice(-4)}`;
      login('voter', district, displayName, phoneNumber, constituency);
      setHasVoted(user.hasVoted);
  
      toast({
        title: "Login Successful!",
        description: `Welcome, ${displayName}!`,
      });
  
      setIsLoading(false);
      onLoginSuccess();
  
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to login. Please try again.",
      });
      setIsLoading(false);
    }
  };
  
  

  const labelClassName = isMobile ? "text-sm" : "text-base";
  const inputClassName = isMobile ? "h-9 text-sm" : "h-10 text-base";
  const iconSize = isMobile ? 16 : 18;
  const iconClassname = isMobile ? "absolute left-3 top-2.5 h-4 w-4 text-ijkred" : "absolute left-3 top-3 h-4 w-4 text-ijkred";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className={`text-ijkred-dark ${labelClassName}`}>உங்கள் பெயர் (Optional)</Label>
        <div className="relative">
          <UserIcon className={iconClassname} size={iconSize} />
          <Input
            id="name"
            placeholder="உங்கள் பெயரை உள்ளிடவும்"
            className={`pl-10 border-ijkred/30 focus-visible:ring-ijkred ${inputClassName}`}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone" className={`text-ijkred-dark ${labelClassName}`}>தொலைபேசி எண்</Label>
        <div className="relative">
          <PhoneCall className={iconClassname} size={iconSize} />
          <Input
            id="phone"
            placeholder="தொலைபேசி எண்ணை உள்ளிடவும்"
            className={`pl-10 border-ijkred/30 focus-visible:ring-ijkred ${inputClassName}`}
            value={phoneNumber}
            inputMode="numeric"
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 10) setPhoneNumber(value);
            }}
            maxLength={10}
          />
        </div>
      </div>

      {/* District and Constituency Selector */}
      <DistrictConstituencySelector
        selectedDistrict={district}
        selectedConstituency={constituency}
        onDistrictChange={setDistrict}
        onConstituencyChange={setConstituency}
        isMobile={isMobile}
      />

      <div className="space-y-2">
        <Label htmlFor="password" className={`text-ijkred-dark ${labelClassName}`}>உறுப்பினர் எண்</Label>
        <div className="relative">
          <Lock className={iconClassname} size={iconSize} />
          <Input
            id="password"
            type="password"
            placeholder="உறுப்பினர் எண்ணை உள்ளிடவும்"
            className={`pl-10 border-ijkred/30 focus-visible:ring-ijkred ${inputClassName}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <Button 
        className="w-full bg-ijkred hover:bg-ijkred-dark transition-colors duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5" 
        onClick={handleUserLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          "உள்நுழையவும்"
        )}
      </Button>
    </div>
  );
};

export default UserLoginForm;
