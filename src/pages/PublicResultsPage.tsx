import React, { useState, useEffect, useMemo } from 'react';
import { useElection } from '@/contexts/ElectionContext';
import { tamilNaduDistricts } from '@/data/tamilNaduDistricts';
import { getConstituenciesForDistrict } from '@/data/tamilNaduConstituencies';

const PublicResultsPage: React.FC = () => {
  const {
    candidates,
    resultAnnouncementDate,
    isResultsAnnounced,
    showVoteCounts,
    setWinner,
    results
  } = useElection();

  const [selectedDistrict, setSelectedDistrict] = useState(tamilNaduDistricts[0]);
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [winner, setWinnerState] = useState<any>(null);
  const [timeUntilResults, setTimeUntilResults] = useState('');

  // Memoized candidates for the selected constituency
  const constituencyCandidates = useMemo(() => {
    return (candidates[selectedDistrict] || []).filter(c => c.constituency === selectedConstituency);
  }, [candidates, selectedDistrict, selectedConstituency]);

  // Fetch constituencies for the selected district
  useEffect(() => {
    const cons = getConstituenciesForDistrict(selectedDistrict);
    setConstituencies(cons);
    setSelectedConstituency(cons[0] || '');
  }, [selectedDistrict]);

  // Countdown until results are announced
  useEffect(() => {
    if (!resultAnnouncementDate || isResultsAnnounced) return;
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(resultAnnouncementDate);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) return clearInterval(interval);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      setTimeUntilResults(`${days}d ${hours}h ${mins}m`);
    }, 60000);
    return () => clearInterval(interval);
  }, [resultAnnouncementDate, isResultsAnnounced]);

  // Fetch winner data from the API
  useEffect(() => {
    const fetchWinner = async () => {
      if (!selectedDistrict || !selectedConstituency) return;
      try {
        const res = await fetch(`http://localhost:5000/api/results/winner?district=${selectedDistrict}&constituency=${selectedConstituency}`);
        const data = await res.json();
        console.log('API response:', data);

        if (res.ok) {
          setWinnerState(data);
        } else {
          const key = `${selectedDistrict}-${selectedConstituency}`;
          const winnerId = results[key];
          const fallback = (candidates[selectedDistrict] || []).find(
            c => c.id === winnerId && c.constituency === selectedConstituency
          );
          if (fallback) setWinnerState(fallback);
        }
      } catch (err) {
        console.error('Error fetching winner:', err);
      }
    };
    fetchWinner();
  }, [selectedDistrict, selectedConstituency, results, candidates]);

  // Handle saving winner
  const handleSaveWinner = async () => {
    if (winner) {
      try {
        await setWinner(selectedDistrict, selectedConstituency, winner.id);
      } catch (err) {
        console.error('Error saving winner:', err);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-4">Tamil Nadu Election Results</h1>
      <p className="text-center text-gray-600 mb-6">Select a district and constituency to view results</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block mb-1 font-medium">District</label>
          <select
            className="w-full p-2 border rounded"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            {tamilNaduDistricts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {constituencies.length > 0 && (
          <div>
            <label className="block mb-1 font-medium">Constituency</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedConstituency}
              onChange={(e) => setSelectedConstituency(e.target.value)}
            >
              {constituencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white p-6 border rounded shadow">
        {isResultsAnnounced ? (
          <>
            {winner ? (
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-green-600">Winner: {winner.name}</h2>
                <p className="text-gray-700">{winner.symbol} — {winner.party}</p>
                {showVoteCounts && <p className="text-sm text-gray-500">{winner.votes} votes</p>}
                <button
                  onClick={handleSaveWinner}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
                >
                  Save Winner
                </button>
              </div>
            ) : (
              <p className="text-center text-gray-600">No winner yet.</p>
            )}
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Results Coming Soon</h2>
            <p>Expected on: {new Date(resultAnnouncementDate).toLocaleDateString()}</p>
            {timeUntilResults && <p className="text-sm text-gray-500 mt-1">{timeUntilResults} remaining</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicResultsPage;
