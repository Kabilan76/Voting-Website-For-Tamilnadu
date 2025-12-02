
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, ChartBar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Logo from './Logo';
import { useAuth } from '@/contexts/AuthContext';

const NavBar: React.FC = () => {
  const { isAuthenticated, userRole, userName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <nav className="hidden md:flex items-center space-x-6">
                {userRole === 'voter' && (
                  <>
                    <Link 
                      to="/vote" 
                      className={`text-gray-700 hover:text-ijkred font-medium ${
                        location.pathname === '/vote' ? 'text-ijkred font-semibold' : ''
                      }`}
                    >
                     வாக்கு
                    </Link>
                    <Link 
                      to="/results" 
                      className={`text-gray-700 hover:text-ijkred font-medium ${
                        location.pathname === '/results' ? 'text-ijkred font-semibold' : ''
                      }`}
                    >
                      தேர்தல் முடிவு
                    </Link>
                  </>
                )}
                
                {userRole === 'admin' && (
                  <>
                    <Link 
                      to="/admin/candidates" 
                      className={`text-gray-700 hover:text-ijkred font-medium ${
                        location.pathname === '/admin/candidates' ? 'text-ijkred font-semibold' : ''
                      }`}
                    >
                     வேட்பாளர்கள்
                    </Link>
                    <Link 
                      to="/admin/results" 
                      className={`text-gray-700 hover:text-ijkred font-medium ${
                        location.pathname === '/admin/results' ? 'text-ijkred font-semibold' : ''
                      }`}
                    >
                      முடிவுகள்
                    </Link>
                    <Link 
                      to="/admin/settings" 
                      className={`text-gray-700 hover:text-ijkred font-medium ${
                        location.pathname === '/admin/settings' ? 'text-ijkred font-semibold' : ''
                      }`}
                    >
                      அமைப்புகள்
                    </Link>
                  </>
                )}
              </nav>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <User className="h-5 w-5 text-ijkred" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{userName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userRole === 'admin' ? 'Administrator' : 'Voter'}
                    </p>
                  </div>
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-500 focus:text-red-500"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/public-results">
                <Button variant="outline" className="border-ijkred text-ijkred hover:bg-red-50 flex items-center gap-2">
                  <ChartBar className="h-4 w-4" />
                  <span className="hidden sm:inline">தேர்தல் முடிவுகள்
                  </span>
                </Button>
              </Link>
              <Link to="/">
                <Button variant="default" className="bg-ijkred hover:bg-ijkred-dark">
                உள்நுழைவு
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavBar;
