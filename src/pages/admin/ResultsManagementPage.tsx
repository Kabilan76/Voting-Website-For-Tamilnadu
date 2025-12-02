import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Trophy, AlertCircle, PieChart, Users, MapPin, LocateFixed, Eye, EyeOff } from 'lucide-react';
import { tamilNaduDistricts } from '@/data/tamilNaduDistricts';
import { getConstituenciesForDistrict } from '@/data/tamilNaduConstituencies';
import { useAuth } from '@/contexts/AuthContext';
import { useElection } from '@/contexts/ElectionContext';
import { useToast } from '@/components/ui/use-toast';

const ResultsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();
  const {
    candidates,
    results,
    setWinner,
    isResultsAnnounced,
    setIsResultsAnnounced,
    getTotalVotes,
    showVoteCounts,
    setShowVoteCounts
  } = useElection();
  const { toast } = useToast();
  const [selectedDistrict, setSelectedDistrict] = useState<string>(tamilNaduDistricts[0]);
  const [selectedConstituency, setSelectedConstituency] = useState<string>('');
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  const totalVotes = getTotalVotes();

  useEffect(() => {
    if (!isAuthenticated || userRole !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, userRole, navigate]);

  useEffect(() => {
    if (selectedDistrict) {
      const districtConstituencies = getConstituenciesForDistrict(selectedDistrict);
      setConstituencies(districtConstituencies);
      setSelectedConstituency(districtConstituencies.length > 0 ? districtConstituencies[0] : '');
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedDistrict && selectedConstituency) {
      const resultKey = `${selectedDistrict}-${selectedConstituency}`;
      setSelectedWinner(results[resultKey] || '');
    } else {
      setSelectedWinner('');
    }
  }, [selectedDistrict, selectedConstituency, results]);

  useEffect(() => {
    const fetchPublishedStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/results/status');
        if (response.ok) {
          const data = await response.json();
          setIsPublished(data.published); // Assuming the API returns { published: boolean }
        } else {
          throw new Error('Failed to fetch published status');
        }
      } catch (error) {
        console.error('Error fetching published status:', error);
      }
    };
  
    fetchPublishedStatus();
  }, []);
  

  const constituencyCandidates = React.useMemo(() => {
    if (!selectedDistrict || !selectedConstituency) return [];

    return (candidates[selectedDistrict] || [])
      .filter(c => c.constituency === selectedConstituency)
      .sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [candidates, selectedDistrict, selectedConstituency]);

  const constituencyVotesTotal = constituencyCandidates.reduce(
    (total, candidate) => total + (candidate.votes || 0), 0
  );

  const handleSaveWinner = async () => {
    if (!selectedWinner) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select a winner." });
      return;
    }
  
    if (!selectedDistrict || !selectedConstituency) {
      toast({ variant: "destructive", title: "Location Required", description: "Please select both district and constituency." });
      return;
    }
  
    const resultKey = `${selectedDistrict}-${selectedConstituency}`;
  
    try {
      const response = await fetch("http://localhost:5000/api/save-winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district: selectedDistrict, constituency: selectedConstituency, winnerId: selectedWinner }),
      });
  
      if (!response.ok) throw new Error("Failed to save winner.");
  
      setWinner(selectedDistrict, selectedConstituency, selectedWinner);
      toast({ title: "Winner Saved", description: `Winner for ${selectedDistrict} - ${selectedConstituency} has been updated.` });
    } catch (error) {
      console.error("Error saving winner:", error);
      toast({ variant: "destructive", title: "Error Saving Winner", description: "Failed to save winner. Please try again." });
    }
  };
  
  const handlePublishResults = async () => {
    const hasAnyWinner = Object.values(results).some((winnerId) => winnerId !== null && winnerId !== undefined);
  
    if (!hasAnyWinner) {
      toast({ variant: "destructive", title: "No Winner", description: "Please ensure there are winners selected for each district and constituency." });
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5000/api/results/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true }),
      });
  
      if (response.ok) {
        setIsPublished(true); // Update state after publishing
        setShowPublishDialog(false);
        toast({ title: "Results Published", description: "Election results have been published and are now visible to voters." });
      } else {
        console.error('Failed to publish results');
        toast({ variant: "destructive", title: "Error", description: "An error occurred while publishing the results." });
      }
    } catch (error) {
      console.error('Failed to publish results:', error);
      toast({ variant: "destructive", title: "Error", description: "An error occurred while publishing the results." });
    }
  };
  
  const handleUnpublishResults = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/results/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: false }),
      });
  
      if (response.ok) {
        setIsPublished(false); // Update state after unpublishing
        toast({ title: "Results Unpublished", description: "Election results have been hidden from voters." });
      } else {
        console.error('Failed to unpublish results');
        toast({ variant: "destructive", title: "Error", description: "An error occurred while unpublishing the results." });
      }
    } catch (error) {
      console.error('Error unpublishing results:', error);
      toast({ variant: "destructive", title: "Error", description: "An error occurred while unpublishing the results." });
    }
  };
  
  

const handleVoteCountsToggle = (checked: boolean) => {
  setShowVoteCounts(checked);
  
  toast({
    title: checked ? "Vote Counts Visible" : "Vote Counts Hidden",
    description: checked 
      ? "Vote counts will now be visible to all users." 
      : "Vote counts are now hidden from users.",
  });
};



  const getVotePercentage = (votes: number) => {
    if (constituencyVotesTotal === 0) return 0;
    return Math.round((votes / constituencyVotesTotal) * 100);
  };

  if (!isAuthenticated || userRole !== 'admin') {
    return null;
  }
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Manage Results</h2>
          
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="vote-counts-toggle" 
                checked={showVoteCounts}
                onCheckedChange={handleVoteCountsToggle}
              />
              <Label htmlFor="vote-counts-toggle" className="flex items-center gap-2">
                {showVoteCounts ? (
                  <>
                    <Eye className="h-4 w-4 text-ijkred" />
                    <span>Show Vote Counts</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-gray-500" />
                    <span>Hide Vote Counts</span>
                  </>
                )}
              </Label>
            </div>
            
            {isPublished ? (
  <Button 
    variant="outline" 
    className="border-red-500 text-red-500 hover:bg-red-50"
    onClick={handleUnpublishResults}
  >
    Hide Results
  </Button>
) : (
  <Button 
    onClick={() => setShowPublishDialog(true)} 
    className="bg-ijkred hover:bg-ijkred-dark"
  >
    Publish Results
  </Button>
)}

          </div>
        </div>

        <Card className="mb-8 bg-gradient-to-r from-ijkred/5 to-white border-ijkred/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-ijkred" />
              <span>Voting Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Total Votes Cast</p>
                <p className="text-3xl font-bold text-ijkred">{totalVotes}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Constituencies with Results</p>
                <p className="text-3xl font-bold text-ijkred">{Object.keys(results).length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Total Districts</p>
                <p className="text-3xl font-bold text-ijkred">{tamilNaduDistricts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>இருப்பிடம்</CardTitle>
              <CardDescription>
              வேட்பாளர்களை தேர்வு செய்ய மாவட்டம் மற்றும் தொகுதியை தேர்வு செய்யவும்
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="district-select" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-ijkred" />
                    மாவட்டத்தை தேர்வு செய்யவும்
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
                    <Label htmlFor="constituency-select" className="flex items-center gap-2">
                      <LocateFixed className="h-4 w-4 text-ijkred" />
                      மண்டலத்தை தேர்வு செய்யவும்
                    </Label>
                    <Select 
                      value={selectedConstituency} 
                      onValueChange={setSelectedConstituency}
                    >
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

                <div className="pt-4">
                  <p className="text-sm text-gray-500 mb-2">Status</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedWinner ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">
                      {selectedWinner 
                        ? 'Winner declared'
                        : 'No winner yet'}
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-gray-500 mb-2">Constituency Vote Count</p>
                  <p className="text-2xl font-bold text-ijkred">{constituencyVotesTotal}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle>
                {selectedConstituency 
                  ? `${selectedDistrict} - ${selectedConstituency} Results` 
                  : 'Results'}
              </CardTitle>
              <CardDescription>
                {selectedConstituency 
                  ? 'Vote counts and winner selection for this constituency'
                  : 'Please select a district and constituency'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedConstituency ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Please select a district and constituency to manage results.</p>
                </div>
              ) : constituencyCandidates.length > 0 ? (
                <div className="space-y-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Votes</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {constituencyCandidates.map((candidate) => (
                        <TableRow 
                          key={candidate.id}
                          className={candidate.id === selectedWinner ? "bg-green-50" : ""}
                        >
                          <TableCell className="font-medium">{candidate.name}</TableCell>
                          <TableCell>{candidate.party}</TableCell>
                          <TableCell>{candidate.symbol}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {candidate.votes || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-ijkred h-2.5 rounded-full" 
                                  style={{ width: `${getVotePercentage(candidate.votes || 0)}%` }}
                                ></div>
                              </div>
                              <span>{getVotePercentage(candidate.votes || 0)}%</span>
                              {candidate.id === selectedWinner && (
                                <Trophy className="ml-1 h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div>
                    <Label htmlFor="winner-select">Select Winner</Label>
                    <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                      <SelectTrigger id="winner-select" className="w-full">
                        <SelectValue placeholder="Select the winner" />
                      </SelectTrigger>
                      <SelectContent>
                        {constituencyCandidates.map(candidate => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.name} ({candidate.votes || 0} votes)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveWinner} 
                      className="bg-ijkred hover:bg-ijkred-dark"
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      Save Winner
                    </Button>
                  </div>

                  {selectedWinner && (
                    <div className="mt-8 border rounded-lg p-6 bg-green-50">
                      <h3 className="text-lg font-semibold text-green-800 mb-4">Selected Winner</h3>
                      
                      {constituencyCandidates.map(candidate => {
                        if (candidate.id === selectedWinner) {
                          return (
                            <div key={candidate.id} className="flex items-center space-x-4">
                              <div className="bg-white h-16 w-16 rounded-full flex items-center justify-center text-4xl shadow-sm">
                                {candidate.symbol}
                              </div>
                              <div>
                                <h4 className="text-xl font-bold">{candidate.name}</h4>
                                <p className="text-gray-700">{candidate.party}</p>
                                <p className="text-green-700 font-semibold mt-1">
                                  {candidate.votes || 0} votes
                                </p>
                              </div>
                              <div className="ml-auto">
                                <Trophy className="h-8 w-8 text-yellow-600" />
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No candidates available for this constituency.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin/candidates')}
                    className="mt-4"
                  >
                    Add Candidates
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Election Results</DialogTitle>
              <DialogDescription>
                Are you sure you want to publish the election results? This will make the results visible to all voters.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-start space-x-3 text-amber-600 bg-amber-50 p-3 rounded-md">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p className="text-sm">
                  Please ensure that you have selected winners for all relevant constituencies before publishing. This action can be reversed later if needed.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePublishResults} className="bg-ijkred hover:bg-ijkred-dark">
                Yes, Publish Results
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ResultsManagementPage;
