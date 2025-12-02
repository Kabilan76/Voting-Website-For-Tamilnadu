
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginHeader from '@/components/login/LoginHeader';
import LoginCard from '@/components/login/LoginCard';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { userRole, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'admin') {
        navigate('/admin/candidates');
      } else {
        navigate('/vote');
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  const handleUserLoginSuccess = () => {
    navigate('/vote');
  };

  const handleAdminLoginSuccess = () => {
    navigate('/admin/candidates');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-ijkred/5 py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="flex flex-col items-center w-full max-w-md space-y-6 animate-fade-in">
        <div className="w-full flex justify-start">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-ijkred"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <LoginHeader />
        <LoginCard 
          onUserLoginSuccess={handleUserLoginSuccess}
          onAdminLoginSuccess={handleAdminLoginSuccess}
          isMobile={isMobile}
        />
        <p className="text-xs text-center text-gray-500 mt-4 px-4">
          © {new Date().getFullYear()} MARVEL Party. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
