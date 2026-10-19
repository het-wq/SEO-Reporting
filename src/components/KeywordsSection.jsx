import React, { useState } from 'react';
import { KeyRound, Search, TrendingUp, Award } from 'lucide-react';

export default function KeywordsSection({ topKeywords, periodName }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!topKeywords) return null;

  const filtered = topKeywords.filter((k) =>
    k.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <KeyRound size={18} className="section-icon" />
          <h2 className="section-title">04. Top Performing Keywords ({periodName})</h2>
        </div>

        <div className="search-filter-box">
          <Search size={14} className="search-filter-icon" />
          <input
            type="text"
            className="search-filter-input"
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Rank</th>
              <th>Top Queries / Keywords</th>
              <th style={{ width: '120px' }}>Position</th>
              <th style={{ width: '120px' }}>Rank Tier</th>
              <th style={{ width: '120px' }}>Change</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const isTop10 = item.ranking <= 10;
              const isTop5 = item.ranking <= 5;

              return (
                <tr key={idx} className={isTop5 ? 'highlight-row' : ''}>
                  <td className="rank-cell">
                    <span className={`rank-badge ${isTop5 ? 'badge-gold' : isTop10 ? 'badge-blue' : 'badge-gray'}`}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="keyword-cell">
                    <span className="keyword-text">{item.keyword}</span>
                  </td>
                  <td>
                    <span className="position-pill">Pos {item.ranking}</span>
                  </td>
                  <td>
                    <span className="status-tag">
                      {isTop5 ? (
                        <>
                          <Award size={12} className="award-icon" /> Top 5
                        </>
                      ) : (
                        item.status
                      )}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`change-tag ${
                        item.change.startsWith('+')
                          ? 'positive'
                          : item.change.startsWith('-')
                          ? 'negative'
                          : 'neutral'
                      }`}
                    >
                      {item.change}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="no-data-cell">
                  No matching keywords found for "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
