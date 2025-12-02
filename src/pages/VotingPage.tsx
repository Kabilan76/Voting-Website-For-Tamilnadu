import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock } from 'lucide-react';
import ThankYouDialog from '@/components/ThankYouDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useElection } from '@/contexts/ElectionContext';

const VotingPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    userDistrict,
    userConstituency,
    hasVoted,
    setHasVoted,
    isAuthenticated,
    userRole,
    phoneNumber,
  } = useAuth();
  const {
    resultAnnouncementDate,
    isResultsAnnounced,
    hasUserVoted,
  } = useElection();

  const [constituencyCandidates, setConstituencyCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [timeUntilResults, setTimeUntilResults] = useState<string>('');
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [checkingVote, setCheckingVote] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || userRole !== 'voter') {
      navigate('/');
    }
  }, [isAuthenticated, userRole, navigate]);

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!userDistrict || !userConstituency) return;

      try {
        setLoadingCandidates(true);
        const res = await fetch(
          `http://localhost:5000/candidates?district=${userDistrict}&constituency=${userConstituency}`
        );
        if (!res.ok) throw new Error('Failed to fetch candidates');
        const data = await res.json();
        setConstituencyCandidates(data);
      } catch (error) {
        toast({
          title: 'Error loading candidates',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCandidates(false);
      }
    };

    fetchCandidates();
  }, [userDistrict, userConstituency, toast]);

  useEffect(() => {
    const checkVoteStatus = async () => {
      const voted = await hasUserVoted(phoneNumber);
      setAlreadyVoted(voted);
      if (voted) setHasVoted(true);
      setCheckingVote(false);
    };

    if (phoneNumber) checkVoteStatus();
  }, [phoneNumber]);

  useEffect(() => {
    if (!checkingVote && alreadyVoted) {
      toast({
        title: 'Already Voted',
        description: 'You have already cast your vote.',
        variant: 'destructive',
      });
      navigate('/results');
    }
  }, [checkingVote, alreadyVoted, navigate, toast]);

  useEffect(() => {
    if (!resultAnnouncementDate || isResultsAnnounced) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const announcementTime = new Date(resultAnnouncementDate);
      const timeDiff = announcementTime.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimeUntilResults('Results are being processed');
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilResults(`${days}d ${hours}h ${minutes}m`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [resultAnnouncementDate, isResultsAnnounced]);

  if (!userDistrict || !userConstituency || !phoneNumber) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p>Missing voter information. Please log in again.</p>
        <Button className="mt-4" onClick={() => navigate('/login')}>
          Back to Login
        </Button>
      </div>
    );
  }

  const handleVote = async () => {
    if (!selectedCandidate || !phoneNumber || !userDistrict || !userConstituency) {
      toast({
        variant: 'destructive',
        title: 'Missing Info',
        description: 'Please ensure you are logged in and have selected a candidate.',
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          candidate_id: selectedCandidate,
          district: userDistrict,
          constituency: userConstituency,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setHasVoted(true);
        setShowThankYou(true);
        toast({
          title: 'Vote Recorded',
          description: 'Your vote has been successfully counted.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Vote Failed',
          description: data.error || 'You may have already voted.',
        });
        if (response.status === 409) {
          setAlreadyVoted(true);
          navigate('/results');
        }
      }
    } catch (error) {
      console.error('Vote submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Server Error',
        description: 'Something went wrong while submitting your vote.',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-ijkred text-white rounded-t-lg">
            <CardTitle className="text-2xl">வாக்கு பதிவு செய்யுங்கள்
            </CardTitle>
            <CardDescription className="text-white/80">
              {userDistrict && userConstituency
                ? `${userDistrict} - ${userConstituency}`
                : 'Your constituency'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loadingCandidates ? (
              <div className="text-center py-8 text-gray-500">
                Loading candidates...
              </div>
            ) : constituencyCandidates.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    Select one candidate from your constituency to cast your vote.
                    This action cannot be undone.
                  </p>
                </div>

                <RadioGroup
                  value={selectedCandidate || ''}
                  onValueChange={setSelectedCandidate}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {constituencyCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedCandidate === candidate.id
                            ? 'border-ijkred bg-red-50'
                            : 'hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedCandidate(candidate.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem
                            value={candidate.id}
                            id={candidate.id}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={candidate.id}
                              className="font-medium text-lg cursor-pointer"
                            >
                              {candidate.name}
                            </Label>
                            <div className="flex items-center mt-1 space-x-2">
                              <span className="text-xl">{candidate.symbol}</span>
                              <span className="text-sm text-gray-600">
                                {candidate.party}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <div className="mt-8 flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Results announcement: </span>
                    <span className="ml-1 font-medium">
                      {resultAnnouncementDate
                        ? new Date(resultAnnouncementDate).toLocaleDateString()
                        : 'To be announced'}
                    </span>
                    <Clock className="w-4 h-4 ml-3 mr-1" />
                    <span>{timeUntilResults}</span>
                  </div>
                  <Button
                    onClick={handleVote}
                    className="bg-ijkred hover:bg-ijkred-dark"
                    disabled={!selectedCandidate}
                  >
                    Cast Vote
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-lg text-gray-600">
                உங்கள் தொகுதியில் இதுவரை எந்தத் தேர்தல் முன்னிலைப் பதிவும் இல்லை.
                .
                </p>
                <p className="text-sm text-gray-500 mt-2">
                தயவுசெய்து பிறகு முயற்சிக்கவும், அல்லது தேர்தல் நிர்வாகியை தொடர்பு கொள்ளுங்கள்.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <ThankYouDialog
          open={showThankYou}
          onClose={() => {
            setShowThankYou(false);
            navigate('/results');
          }}
        />
      </div>
    </div>
  );
};

export default VotingPage;
