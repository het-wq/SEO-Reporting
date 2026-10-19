import React from 'react';
import MetricBox from './MetricBox';
import { Globe, Smartphone, Monitor } from 'lucide-react';

export default function TrafficSection({ gaOverview, deviceTraffic, periodName, prevPeriodName }) {
  if (!gaOverview) return null;

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <Globe size={18} className="section-icon" />
          <h2 className="section-title">01. Overall Website Traffic (Google Analytics Overview)</h2>
        </div>
        <span className="section-badge">{periodName} vs {prevPeriodName}</span>
      </div>

      {/* Main KPI Boxes */}
      <div className="metrics-grid grid-5">
        {gaOverview.map((item) => (
          <MetricBox
            key={item.key}
            title={item.label}
            value={item.current.toLocaleString ? item.current.toLocaleString() : item.current}
            previousValue={item.previous.toLocaleString ? item.previous.toLocaleString() : item.previous}
            diff={item.diff}
            subtitle={item.key === 'time_on_site' ? 'Avg duration per organic session' : 'Users / Sessions'}
          />
        ))}
      </div>

      {/* Device Breakdown */}
      {deviceTraffic && (
        <div className="sub-section">
          <h3 className="sub-section-title">03. Device Based Organic Traffic</h3>
          <div className="device-cards-grid">
            {deviceTraffic.map((d) => {
              const total = deviceTraffic.reduce((acc, curr) => acc + curr.current, 0);
              const percentage = Math.round((d.current / total) * 100);

              return (
                <div key={d.device} className="device-box">
                  <div className="device-box-header">
                    <div className="device-title">
                      {d.device === 'Desktop' ? <Monitor size={16} /> : <Smartphone size={16} />}
                      <span>{d.device}</span>
                    </div>
                    <span className="metric-badge positive">+{d.diff}%</span>
                  </div>

                  <div className="device-metric-row">
                    <span className="device-curr">{d.current} visits</span>
                    <span className="device-prev">Prev: {d.previous}</span>
                  </div>

                  {/* Visual bar */}
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <div className="device-meta-text">{percentage}% of total device traffic</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
