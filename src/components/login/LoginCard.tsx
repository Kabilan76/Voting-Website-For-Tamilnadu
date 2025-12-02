
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserLoginForm from './UserLoginForm';
import AdminLoginForm from './AdminLoginForm';
import { motion } from '@/components/ui/motion';

interface LoginCardProps {
  onUserLoginSuccess: () => void;
  onAdminLoginSuccess: () => void;
  isMobile?: boolean;
}

const LoginCard: React.FC<LoginCardProps> = ({ 
  onUserLoginSuccess, 
  onAdminLoginSuccess,
  isMobile = false
}) => {
  const [activeTab, setActiveTab] = useState("user");
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="w-full border-ijkred/20 shadow-md">
        <CardHeader className={`bg-gradient-to-r from-ijkred/10 to-ijkred/5 rounded-t-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <CardTitle className={`text-ijkred-dark ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          MARVEL கட்சி
          </CardTitle>
          <CardDescription className="text-ijkred-dark/80">
          உங்கள் குரல் எதிர்காலத்தை மாற்றுவதில் முக்கியமானது!
          </CardDescription>
        </CardHeader>
        
        <CardContent className={`${isMobile ? 'pt-4 px-4' : 'pt-6 px-6'}`}>
          <Tabs 
            defaultValue="user" 
            className="w-full"
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-ijkred/10">
              <TabsTrigger 
                value="user" 
                className="data-[state=active]:bg-ijkred data-[state=active]:text-white transition-all duration-200"
              >
              வாக்காளர் 
              </TabsTrigger>
              <TabsTrigger 
                value="admin"
                className="data-[state=active]:bg-ijkred data-[state=active]:text-white transition-all duration-200"
              >
              நிர்வாகி 
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="animate-in fade-in-50 duration-300">
              <UserLoginForm onLoginSuccess={onUserLoginSuccess} isMobile={isMobile} />
            </TabsContent>

            <TabsContent value="admin" className="animate-in fade-in-50 duration-300">
              <AdminLoginForm onLoginSuccess={onAdminLoginSuccess} isMobile={isMobile} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LoginCard;
