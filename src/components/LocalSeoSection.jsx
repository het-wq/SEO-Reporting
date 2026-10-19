import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

export default function LocalSeoSection({ localSeo, periodName, prevPeriodName }) {
  if (!localSeo) return null;

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <MapPin size={18} className="section-icon" />
          <h2 className="section-title">06. Local SEO Ranking (Grid My Business GMB Visibility)</h2>
        </div>
        <span className="section-badge">{periodName} vs {prevPeriodName}</span>
      </div>

      <div className="local-seo-grid">
        {localSeo.map((item, idx) => {
          const rankDiff = (item.avgRank.current - item.avgRank.previous).toFixed(1);

          return (
            <div key={idx} className="local-card">
              <div className="local-card-header">
                <div className="local-kw-wrap">
                  <Navigation size={15} className="kw-nav-icon" />
                  <span className="local-keyword">{item.keyword}</span>
                </div>
                <span className="gmb-tag">Google Business Profile</span>
              </div>

              <div className="local-stat-boxes">
                <div className="local-mini-box main-rank">
                  <span className="mini-box-label">Avg Rank</span>
                  <div className="mini-rank-val">{item.avgRank.current}</div>
                  <span className="mini-box-prev">Prev: {item.avgRank.previous} ({rankDiff > 0 ? `+${rankDiff}` : rankDiff})</span>
                </div>

                <div className="local-mini-box">
                  <span className="mini-box-label">Top 3 Grid Pins</span>
                  <div className="mini-box-val">{item.top3.current}</div>
                  <span className="mini-box-prev">Prev: {item.top3.previous}</span>
                </div>

                <div className="local-mini-box">
                  <span className="mini-box-label">Top 4-10 Pins</span>
                  <div className="mini-box-val">{item.top10.current}</div>
                  <span className="mini-box-prev">Prev: {item.top10.previous}</span>
                </div>

                <div className="local-mini-box">
                  <span className="mini-box-label">Top 11-20 Pins</span>
                  <div className="mini-box-val">{item.top20.current}</div>
                  <span className="mini-box-prev">Prev: {item.top20.previous}</span>
                </div>
              </div>

              <div className="local-card-footer">
                <span>{item.notes}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
