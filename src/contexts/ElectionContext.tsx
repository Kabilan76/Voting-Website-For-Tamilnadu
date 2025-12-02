import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Types
interface Candidate {
  id: string;
  name: string;
  party: string;
  symbol: string;
  votes: number;
  district: string;
  constituency?: string;
}

interface Vote {
  candidateId: string;
  district: string;
  timestamp: Date;
  voterPhone: string;
  constituency?: string;
}

interface CandidatesByDistrict {
  [district: string]: Candidate[];
}

interface VotesByDistrict {
  [district: string]: number;
}

interface ResultsByDistrictConstituency {
  [key: string]: string; // Maps "district-constituency" to winning candidate ID
}

interface ElectionContextType {
  candidates: CandidatesByDistrict;
  addCandidate: (candidate: Omit<Candidate, 'id' | 'votes'>) => void;
  removeCandidate: (candidateId: string) => void;
  updateCandidate: (candidateId: string, updates: Partial<Omit<Candidate, 'id' | 'votes'>>) => void;
  votes: Vote[];
  totalVotesByDistrict: VotesByDistrict;
  addVote: (
    district: string,
    candidateId: string,
    voterPhone: string,
    constituency?: string
  ) => Promise<boolean>;
  hasUserVoted: (phoneNumber: string) => Promise<boolean>;
  resultAnnouncementDate: Date | null;
  setResultAnnouncementDate: (date: Date | null) => void;
  isResultsAnnounced: boolean;
  setIsResultsAnnounced: (value: boolean) => void;
  resetElection: () => void;
  results: ResultsByDistrictConstituency;
  setWinner: (district: string, constituency: string, candidateId: string) => Promise<void>;
  getTotalVotes: () => number;
  setCandidatesForDistrict: (district: string, candidateList: Candidate[]) => void;
  showVoteCounts: boolean; // Added or verified
  setShowVoteCounts: (value: boolean) => void; // Added or verified
  fetchWinner: (district: string, constituency: string) => Promise<Candidate | null>;
}

const ElectionContext = createContext<ElectionContextType | null>(null);

interface ElectionProviderProps {
  children: ReactNode;
}

// Mock data (unchanged)
const initialCandidates: Candidate[] = [
  {
    id: 'c1',
    name: 'Rajinikanth',
    party: 'IJK',
    symbol: '🌟',
    votes: 0,
    district: 'Chennai',
    constituency: 'Thousand Lights'
  },
  // ... other candidates
];

export const ElectionProvider: React.FC<ElectionProviderProps> = ({ children }) => {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [resultAnnouncementDate, setResultAnnouncementDate] = useState<Date | null>(
    new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  );
  const [isResultsAnnounced, setIsResultsAnnounced] = useState<boolean>(false);
  const [results, setResults] = useState<ResultsByDistrictConstituency>({});
  const [showVoteCounts, setShowVoteCounts] = useState<boolean>(true); // Added state for showVoteCounts

  // Fetch initial results and announcement status on mount (unchanged)
useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const [resStatus, resResults, resDate] = await Promise.all([
        fetch('http://localhost:5000/api/results/status'),
        fetch('http://localhost:5000/api/results/all'),
        fetch('http://localhost:5000/api/election/announcement-date')
      ]);

      if (resStatus.ok) {
        const data = await resStatus.json();
        setIsResultsAnnounced(data.isAnnounced ?? true); // Default to true if undefined
      }

      if (resResults.ok) {
        const allResults = await resResults.json();
        const newResults: ResultsByDistrictConstituency = {};
        allResults.forEach((result: any) => {
          const key = `${result.district}-${result.constituency}`;
          newResults[key] = result.winner_id;
        });
        setResults(newResults);
        console.log('Fetched results:', newResults);
      }

      if (resDate.ok) {
        const data = await resDate.json();
        if (data.announcement_date) {
          setResultAnnouncementDate(new Date(data.announcement_date));
          console.log('Fetched announcement date:', data.announcement_date);
        }
      }

    } catch (error) {
      console.error('Failed to fetch initial election data:', error);
    }
  };

  fetchInitialData();
}, []);

  
  // Group candidates by district (unchanged)
  const candidatesByDistrict: CandidatesByDistrict = candidates.reduce(
    (acc: CandidatesByDistrict, candidate: Candidate) => {
      if (!acc[candidate.district]) {
        acc[candidate.district] = [];
      }
      acc[candidate.district].push(candidate);
      return acc;
    },
    {}
  );

  // Calculate total votes by district (unchanged)
  const totalVotesByDistrict: VotesByDistrict = votes.reduce(
    (acc: VotesByDistrict, vote: Vote) => {
      acc[vote.district] = (acc[vote.district] || 0) + 1;
      return acc;
    },
    {}
  );

  // Get total votes across all districts (unchanged)
  const getTotalVotes = (): number => {
    return votes.length;
  };

  // Updated setWinner (unchanged)
  const setWinner = async (district: string, constituency: string, candidateId: string) => {
    const districtConstituencyKey = `${district}-${constituency}`;
    try {
      const response = await fetch('http://localhost:5000/api/save-winner', {  // Updated the URL to match Flask route
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          district,
          constituency,
          winnerId: candidateId,  // Make sure the key matches the Flask route (winnerId instead of winner_id)
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to save winner: ${response.statusText}`);
      }
  
      // Assuming the backend returns a success message
      const data = await response.json();
      if (data.message === 'Winner saved successfully') {  // Check for the correct success message
        // Update local state after successful backend save
        setResults(prev => ({
          ...prev,
          [districtConstituencyKey]: candidateId,
        }));
        console.log(`Winner set for ${district} - ${constituency}: ${candidateId}`);
      } else {
        console.error('Failed to save winner: ', data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error setting winner:', error);
    }
  };
  

  // Set candidates for a district (unchanged)
  const setCandidatesForDistrict = (district: string, candidateList: Candidate[]) => {
    const filteredCandidates = candidates.filter(c => c.district !== district);
    setCandidates([...filteredCandidates, ...candidateList]);
  };

  // Add a new candidate (unchanged)
  const addCandidate = (candidate: Omit<Candidate, 'id' | 'votes'>) => {
    const newCandidate: Candidate = {
      ...candidate,
      id: `c${candidates.length + 1}`,
      votes: 0
    };
    setCandidates([...candidates, newCandidate]);
  };

  // Remove a candidate (unchanged)
  const removeCandidate = (candidateId: string) => {
    setCandidates(candidates.filter(c => c.id !== candidateId));
  };

  // Update a candidate (unchanged)
  const updateCandidate = (candidateId: string, updates: Partial<Omit<Candidate, 'id' | 'votes'>>) => {
    setCandidates(
      candidates.map(c => 
        c.id === candidateId 
          ? { ...c, ...updates } 
          : c
      )
    );
  };

  // Add a vote (unchanged)
  const addVote = async (
    district: string,
    candidateId: string,
    voterPhone: string,
    constituency?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:5000/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId, district, phone: voterPhone, constituency })
      });
      const data = await response.json();
      if (response.ok && !data.error) {
        const newVote: Vote = { candidateId, district, constituency, timestamp: new Date(), voterPhone };
        setVotes(prev => [...prev, newVote]);
        setCandidates(prev =>
          prev.map(c => c.id === candidateId ? { ...c, votes: c.votes + 1 } : c)
        );
        return true;
      } else {
        console.error('Vote submission failed:', data.error || data.message);
        return false;
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      return false;
    }
  };

  // Check if user has already voted (unchanged)
  const hasUserVoted = async (phoneNumber: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:5000/api/has-voted?phone=${phoneNumber}`);
      const data = await response.json();
      return data.hasVoted === 1;
    } catch (error) {
      console.error("Error checking if user has voted:", error);
      return false;
    }
  };

  // Fetch winner for a district and constituency (unchanged)
  const fetchWinner = async (district: string, constituency: string): Promise<Candidate | null> => {
    if (!isResultsAnnounced || !district || !constituency) {
      console.log(`No winner fetched: Results not announced or missing district/constituency (${district}, ${constituency})`);
      return null;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/results/winner?district=${encodeURIComponent(district)}&constituency=${encodeURIComponent(constituency)}`
      );
      if (!response.ok) {
        console.warn(`Fetch winner failed with status ${response.status}: ${response.statusText}`);
        console.log(`No winner found for ${district} - ${constituency}`);
        return null;
      }
      const data = await response.json();
      if (data && Object.keys(data).length > 0) {
        console.log(`Winner for ${district} - ${constituency}: ${data.name} (ID: ${data.id})`);
        return data;
      } else {
        console.log(`No winner found for ${district} - ${constituency} (winner_id: not matched in candidates)`);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch winner:', error);
      console.log(`No winner found for ${district} - ${constituency} due to error`);
      return null;
    }
  };

  // Reset the election data (unchanged)
  const resetElection = () => {
    setCandidates(initialCandidates.map(c => ({ ...c, votes: 0 })));
    setVotes([]);
    setIsResultsAnnounced(false);
    setResultAnnouncementDate(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000));
    setResults({});
  };

  // Update candidates' votes based on the votes array (unchanged)
  useEffect(() => {
    if (votes.length > 0) {
      const voteCounts = votes.reduce((acc: Record<string, number>, vote) => {
        acc[vote.candidateId] = (acc[vote.candidateId] || 0) + 1;
        return acc;
      }, {});
      setCandidates(currentCandidates => 
        currentCandidates.map(candidate => ({
          ...candidate,
          votes: voteCounts[candidate.id] || 0
        }))
      );
    }
  }, [votes]);

  return (
    <ElectionContext.Provider
      value={{
        candidates: candidatesByDistrict,
        addCandidate,
        removeCandidate,
        updateCandidate,
        votes,
        totalVotesByDistrict,
        addVote,
        hasUserVoted,
        resultAnnouncementDate,
        setResultAnnouncementDate,
        isResultsAnnounced,
        setIsResultsAnnounced,
        resetElection,
        results,
        setWinner,
        getTotalVotes,
        setCandidatesForDistrict,
        showVoteCounts, // Provided value
        setShowVoteCounts, // Provided setter
        fetchWinner
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = (): ElectionContextType => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return context;
};