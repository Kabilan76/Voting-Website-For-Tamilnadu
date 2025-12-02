
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect to login page
    navigate('/login');
  }, [navigate]);

  // This return will briefly show before redirect happens
  return null;
};

export default Index;
