import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { Trophy, AlertTriangle } from 'lucide-react';
import { tamilNaduDistricts } from '@/data/tamilNaduDistricts';
import { getConstituenciesForDistrict } from '@/data/tamilNaduConstituencies';
import { useAuth } from '@/contexts/AuthContext';
import { useElection } from '@/contexts/ElectionContext';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

interface Candidate {
  id: string;
  name: string;
  party: string;
  symbol: string;
  votes: number;
  district: string;
  constituency?: string;
}

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userDistrict, userConstituency } = useAuth();
  const { 
    candidates, 
    isResultsAnnounced, 
    resultAnnouncementDate, 
    results,
    showVoteCounts,
    fetchWinner,
    setWinner
  } = useElection();
  
  const [selectedDistrict, setSelectedDistrict] = useState<string>(userDistrict || tamilNaduDistricts[0]);
  const [selectedConstituency, setSelectedConstituency] = useState<string>(userConstituency || '');
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [timeUntilResults, setTimeUntilResults] = useState<string>('');
  const [winner, setWinnerState] = useState<Candidate | null>(null);

  // Initialize with user's district/constituency
  useEffect(() => {
    if (userDistrict) setSelectedDistrict(userDistrict);
    if (userConstituency) setSelectedConstituency(userConstituency);
  }, [userDistrict, userConstituency]);

  // Update constituency list based on district
  useEffect(() => {
    const districtConstituencies = getConstituenciesForDistrict(selectedDistrict);
    setConstituencies(districtConstituencies);

    if (userConstituency && districtConstituencies.includes(userConstituency)) {
      setSelectedConstituency(userConstituency);
    } else if (!districtConstituencies.includes(selectedConstituency)) {
      setSelectedConstituency(districtConstituencies[0] || '');
    }
  }, [selectedDistrict, userConstituency]);

  // Time until result announcement
  useEffect(() => {
    if (!resultAnnouncementDate || isResultsAnnounced) return;

    const updateTime = () => {
      const now = new Date();
      const announceTime = new Date(resultAnnouncementDate);
      const diff = announceTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilResults('Results are being processed');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilResults(`${days}d ${hours}h ${minutes}m`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [resultAnnouncementDate, isResultsAnnounced]);

  // Fetch winner using context and check pre-loaded results
  useEffect(() => {
    const getWinner = async () => {
      const winnerData = await fetchWinner(selectedDistrict, selectedConstituency);
      setWinnerState(winnerData);

      // Check if winner is in pre-loaded results
      const resultKey = `${selectedDistrict}-${selectedConstituency}`;
      const winnerIdFromResults = results[resultKey];
      if (winnerIdFromResults && !winnerData) {
        const candidate = (candidates[selectedDistrict] || []).find(c => c.id === winnerIdFromResults && c.constituency === selectedConstituency);
        if (candidate) setWinnerState(candidate);
      }
    };
    getWinner();
  }, [selectedDistrict, selectedConstituency, isResultsAnnounced, fetchWinner, results, candidates]);

  const constituencyCandidates = React.useMemo(() => {
    if (!selectedDistrict || !selectedConstituency) return [];

    return (candidates[selectedDistrict] || [])
      .filter(c => c.constituency === selectedConstituency)
      .sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [candidates, selectedDistrict, selectedConstituency]);

  const constituencyWinner = React.useMemo(() => {
    const resultKey = `${selectedDistrict}-${selectedConstituency}`;
    const winnerId = results[resultKey];
    if (!winnerId) return winner; // Fallback to API-fetched winner
    return constituencyCandidates.find(c => c.id === winnerId) || winner;
  }, [results, selectedDistrict, selectedConstituency, constituencyCandidates, winner]);

  // Handle saving winner with null check
  const handleSaveWinner = async () => {
    if (!winner) {
      console.error('No winner selected to save');
      return;
    }
    try {
      await setWinner(selectedDistrict, selectedConstituency, winner.id);
      console.log(`Winner saved for ${selectedDistrict} - ${selectedConstituency}: ${winner.id}`);
    } catch (error) {
      console.error('Error saving winner:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-ijkred text-white rounded-t-lg">
            <CardTitle className="text-2xl">தேர்தல் முடிவுகள்</CardTitle>
            <CardDescription className="text-white/80">
              {isResultsAnnounced 
                ? "Official election results" 
                : `முடிவுகள் ${timeUntilResults} அறிவிக்கப்படும்`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isResultsAnnounced ? (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="district-select">மாவட்டத்தை தேர்வு செய்யவும்
                    </Label>
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                      <SelectTrigger id="district-select" className="w-full mt-1">
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {tamilNaduDistricts.map(district => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {constituencies.length > 0 && (
                    <div>
                      <Label htmlFor="constituency-select">மண்டலத்தை தேர்வு செய்யவும்
                      </Label>
                      <Select value={selectedConstituency} onValueChange={setSelectedConstituency}>
                        <SelectTrigger id="constituency-select" className="w-full mt-1">
                          <SelectValue placeholder="Select constituency" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {constituencies.map(constituency => (
                            <SelectItem key={constituency} value={constituency}>
                              {constituency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {constituencyCandidates.length > 0 ? (
                  <div className="space-y-6">
                    {constituencyWinner && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm">
                        <h3 className="text-xl font-semibold text-green-700 flex items-center">
                          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                          Winning Candidate - {selectedConstituency}
                        </h3>
                        <div className="mt-4 flex items-center space-x-4">
                          <div className="bg-white text-4xl h-16 w-16 rounded-full flex items-center justify-center shadow-sm">
                            {constituencyWinner.symbol}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold">{constituencyWinner.name}</h4>
                            <p className="text-gray-700">{constituencyWinner.party}</p>
                          </div>
                        </div>
                        <Button
                          onClick={handleSaveWinner}
                          className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
                          disabled={!winner}
                        >
                          Save Winner
                        </Button>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-medium mb-3">All Candidates</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Party</TableHead>
                            {showVoteCounts && <TableHead>Votes</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {constituencyCandidates.map(candidate => (
                            <TableRow
                              key={candidate.id}
                              className={constituencyWinner && candidate.id === constituencyWinner.id ? "bg-green-50" : ""}
                            >
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xl">{candidate.symbol}</span>
                                  <span className="font-medium">{candidate.name}</span>
                                  {constituencyWinner && candidate.id === constituencyWinner.id && (
                                    <Trophy className="h-4 w-4 text-yellow-500 ml-1" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{candidate.party}</TableCell>
                              {showVoteCounts && (
                                <TableCell>{candidate.votes || 0}</TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No candidates available for {selectedConstituency || "this constituency"}.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">முடிவுகள் இன்னும் அறிவிக்கப்படவில்லை</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                தேர்தல் முடிவுகள் விரைவில் அறிவிக்கப்படும். தயவுசெய்து பின்னர் மீண்டும் சரிபார்க்கவும் {timeUntilResults}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultsPage;