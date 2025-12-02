
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ThankYouDialogProps {
  open: boolean;
  onClose: () => void;
}

const ThankYouDialog: React.FC<ThankYouDialogProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleViewResults = () => {
    onClose();
    navigate('/results');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center">
          <div className="bg-green-100 p-3 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-2xl">Thank You for Voting!</DialogTitle>
          <DialogDescription className="text-center pt-4">
            Your vote has been recorded successfully. Thank you for participating in this democratic process.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center">
          <Button 
            onClick={handleViewResults}
            className="bg-ijkred hover:bg-ijkred-dark"
          >
            View Results
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
          >
            Go to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThankYouDialog;
