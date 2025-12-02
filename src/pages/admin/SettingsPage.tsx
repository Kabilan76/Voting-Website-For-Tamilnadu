import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useElection } from '@/contexts/ElectionContext';
import axios from 'axios';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();
  const { setResultAnnouncementDate } = useElection();
  const { toast } = useToast();

  const [date, setDate] = useState<Date | undefined>(undefined);

  // Fetch the current result announcement date on load
  useEffect(() => {
    if (!isAuthenticated || userRole !== 'admin') {
      navigate('/');
      return;
    }

    // Fetch the announcement date from the backend
    axios
      .get('/api/election/announcement-date')
      .then((response) => {
        const announcementDate = response.data.announcement_date;
        if (announcementDate) {
          setDate(new Date(announcementDate));
        }
      })
      .catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch the announcement date.',
        });
      });
  }, [isAuthenticated, userRole, navigate, toast]);

  const handleSaveDate = async () => {
    if (!date) {
      toast({
        variant: "destructive",
        title: "Date Required",
        description: "Please select an announcement date.",
      });
      return;
    }
  
    try {
      const announcementDate = format(date, 'yyyy-MM-dd');
  
      const response = await fetch('http://localhost:5000/api/election/announcement-date', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ announcement_date: announcementDate }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save date');
      }
  
      // Update the context state with the new date
      setResultAnnouncementDate(date);
  
      toast({
        title: 'Date Saved',
        description: 'Result announcement date has been updated.',
      });
    } catch (error) {
      console.error('Error saving date:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save the date. Please try again.',
      });
    }
  };
  
  if (!isAuthenticated || userRole !== 'admin') {
    return null; // Redirect will happen
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Election Settings</h2>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>முடிவுகள் வெளியிடும் தேதி</CardTitle>
            <CardDescription>
            வாக்காளர்களுக்கு தேர்தல் முடிவுகள் வெளியிடப்படும் நாளை அமைக்கவும்.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="announcement-date">முடிவுகள் வெளியிடும் தேதி</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="announcement-date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
              <p>
                The selected date will be displayed to voters on the results page.
                They will not be able to see any results until you publish them,
                regardless of the date set here.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveDate}
                className="bg-ijkred hover:bg-ijkred-dark"
              >
                Save Date
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
