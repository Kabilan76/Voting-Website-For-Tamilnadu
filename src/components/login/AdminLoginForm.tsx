
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { User as UserIcon, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLoginFormProps {
  onLoginSuccess: () => void;
  isMobile?: boolean;
}

const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onLoginSuccess, isMobile = false }) => {
  const { toast } = useToast();
  const { login } = useAuth();

  // Admin login state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = () => {
    if (!adminUsername) {
      toast({
        variant: "destructive",
        title: "Username Required",
        description: "Please enter your admin username",
      });
      return;
    }
    
    if (!adminPassword) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter your admin password",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Add a small delay to simulate network request
    setTimeout(() => {
      // For demo purposes, using fixed credentials
      if (adminUsername === 'IJK' && adminPassword === 'IJK123') {
        login('admin', 'All Districts', 'Administrator');
        toast({
          title: "Login Successful!",
          description: "Welcome to the Admin Dashboard",
        });
        onLoginSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid username or password. Try admin/password.",
        });
      }
      setIsLoading(false);
    }, 800);
  };

  const labelClassName = isMobile ? "text-sm" : "text-base";
  const inputClassName = isMobile ? "h-9 text-sm" : "h-10 text-base";
  const iconSize = isMobile ? 16 : 18;
  const iconClassname = isMobile ? "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" : "absolute left-3 top-3 h-4 w-4 text-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin-username" className={labelClassName}>நிர்வாகி பெயர் (admin name)</Label>
        <div className="relative">
          <UserIcon className={iconClassname} size={iconSize} />
          <Input
            id="admin-username"
            placeholder="நிர்வாகி பெயரை உள்ளிடுங்கள்"
            className={`pl-10 ${inputClassName}`}
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-password" className={labelClassName}>கடவுச்சொல் (Password)</Label>
        <div className="relative">
          <Lock className={iconClassname} size={iconSize} />
          <Input
            id="admin-password"
            type="password"
            placeholder="நிர்வாகி கடவுச்சொல் (admin password)"
            className={`pl-10 ${inputClassName}`}
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />
        </div>
      </div>

      <Button 
        className="w-full bg-ijkred hover:bg-ijkred-dark transition-colors duration-300 shadow-md hover:shadow-lg" 
        onClick={handleAdminLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "உள்நுழைவு"
        )}
      </Button>
    </div>
  );
};

export default AdminLoginForm;
