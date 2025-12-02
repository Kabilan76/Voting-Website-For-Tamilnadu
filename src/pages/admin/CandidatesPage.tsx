import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Plus, Save, Trash2, X, MapPin, LocateFixed } from 'lucide-react';
import { tamilNaduDistricts } from '@/data/tamilNaduDistricts';
import { getConstituenciesForDistrict } from '@/data/tamilNaduConstituencies';
import { useAuth } from '@/contexts/AuthContext';
import { useElection } from '@/contexts/ElectionContext';

const CandidatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();
  const { candidates, setCandidatesForDistrict } = useElection();
  const { toast } = useToast();

  const [selectedDistrict, setSelectedDistrict] = useState<string>(tamilNaduDistricts[0]);
  const [selectedConstituency, setSelectedConstituency] = useState<string>('');
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editCandidates, setEditCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchTrigger, setFetchTrigger] = useState<number>(0); // To control fetch manually

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!isAuthenticated || userRole !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, userRole, navigate]);

  // Update constituencies when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const districtConstituencies = getConstituenciesForDistrict(selectedDistrict);
      setConstituencies(districtConstituencies);
      setSelectedConstituency(districtConstituencies.length > 0 ? districtConstituencies[0] : '');
      setFetchTrigger(prev => prev + 1); // Trigger fetch when district changes
    }
  }, [selectedDistrict]);

  // Fetch candidates from backend only when fetchTrigger changes
  useEffect(() => {
    if (!selectedDistrict || !selectedConstituency) return;

    const fetchCandidates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:5000/candidates?district=${selectedDistrict}&constituency=${selectedConstituency}`
        );
        if (!response.ok) throw new Error('Failed to fetch candidates');
        const data = await response.json();
        setEditCandidates(data);
        // Update context with fetched data without causing re-render loop
        const otherCandidates = (candidates[selectedDistrict] || []).filter(
          c => c.constituency !== selectedConstituency
        );
        setCandidatesForDistrict(selectedDistrict, [...otherCandidates, ...data]);
      } catch (error) {
        console.error('Error fetching candidates:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load candidates. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [selectedDistrict, selectedConstituency, fetchTrigger, toast]); // Removed candidates and setCandidatesForDistrict from dependencies

  const handleAddCandidate = () => {
    setEditCandidates([...editCandidates, {
      id: `c${Date.now()}`,
      name: '',
      party: 'Independent',
      symbol: '⭐',
      votes: 0,
      district: selectedDistrict,
      constituency: selectedConstituency
    }]);
  };

  const handleRemoveCandidate = (index: number) => {
    const newCandidates = [...editCandidates];
    newCandidates.splice(index, 1);
    setEditCandidates(newCandidates);
  };

  const handleCandidateChange = (index: number, field: string, value: string) => {
    const newCandidates = [...editCandidates];
    newCandidates[index] = {
      ...newCandidates[index],
      [field]: value
    };
    setEditCandidates(newCandidates);
  };

  const handleSave = async () => {
    const isValid = editCandidates.every(c => c.name);
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "All candidates must have a name.",
      });
      return;
    }

    if (editCandidates.length > 4) {
      toast({
        variant: "destructive",
        title: "Too Many Candidates",
        description: "A maximum of 4 candidates is allowed per constituency.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          district: selectedDistrict,
          constituency: selectedConstituency,
          candidates: editCandidates,
        }),
      });

      if (!response.ok) throw new Error('Failed to save candidates');
      const data = await response.json();

      // Update context with saved data
      const otherCandidates = (candidates[selectedDistrict] || []).filter(
        c => c.constituency !== selectedConstituency
      );
      setCandidatesForDistrict(selectedDistrict, [...otherCandidates, ...editCandidates]);

      toast({
        title: "Candidates Saved",
        description: `Candidates for ${selectedDistrict} - ${selectedConstituency} have been updated.`,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving candidates:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save candidates. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to current candidates from context or fetch again
    const filteredCandidates = (candidates[selectedDistrict] || []).filter(
      c => c.constituency === selectedConstituency
    );
    setEditCandidates(filteredCandidates);
    setIsEditing(false);
  };

  if (!isAuthenticated || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Manage Candidates</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>இருப்பிடம்              </CardTitle>
              <CardDescription>
              வேட்பாளர்களை தேர்வு செய்ய மாவட்டம் மற்றும் தொகுதியை தேர்வு செய்யவும்

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
                    <div className={`w-3 h-3 rounded-full ${editCandidates.length ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">
                      {editCandidates.length 
                        ? `${editCandidates.length} candidates`
                        : 'No candidates'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {selectedConstituency 
                    ? `${selectedDistrict} - ${selectedConstituency} Candidates` 
                    : `${selectedDistrict} Candidates`}
                </CardTitle>
                <CardDescription>
                  {isEditing 
                    ? 'Edit candidates for this constituency' 
                    : 'View candidates for this constituency'}
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)} 
                  className="bg-ijkred hover:bg-ijkred-dark"
                  disabled={!selectedConstituency || isLoading}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Candidates
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-ijkred hover:bg-ijkred-dark" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Loading candidates...</p>
                </div>
              ) : !selectedConstituency ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Please select a constituency to manage candidates.</p>
                </div>
              ) : isEditing ? (
                <div className="space-y-6">
                  {editCandidates.map((candidate, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                      <div className="col-span-10">
                        <Label htmlFor={`name-${index}`}>Candidate Name</Label>
                        <Input
                          id={`name-${index}`}
                          value={candidate.name || ''}
                          onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                          placeholder="Enter candidate name"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="col-span-2 flex justify-end items-end pt-5">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveCandidate(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {editCandidates.length < 4 && (
                    <Button 
                      variant="outline" 
                      onClick={handleAddCandidate}
                      className="w-full py-6 border-dashed border-gray-300"
                      disabled={isLoading}
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Add Candidate
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  {editCandidates.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editCandidates.map(candidate => (
                        <div 
                          key={candidate.id} 
                          className="border rounded-lg p-4 hover:border-gray-400 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="bg-ijkred h-10 w-10 rounded-full flex items-center justify-center text-white font-bold">
                              {candidate.name.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <h3 className="font-medium text-lg">{candidate.name}</h3>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No candidates added for this constituency yet.</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(true)}
                        className="mt-4"
                        disabled={isLoading}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Candidates
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CandidatesPage;