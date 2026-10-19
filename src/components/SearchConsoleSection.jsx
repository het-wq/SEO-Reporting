import React, { useState } from 'react';
import MetricBox from './MetricBox';
import { Search, Monitor, Smartphone, Layers } from 'lucide-react';

export default function SearchConsoleSection({ gscOverview, deviceTraffic, queryBreakdown, periodName, prevPeriodName }) {
  const [deviceTab, setDeviceTab] = useState('overall'); // 'overall' | 'desktop' | 'mobile'

  if (!gscOverview) return null;

  const currentQueries = queryBreakdown ? queryBreakdown[deviceTab] || [] : [];

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <Search size={18} className="section-icon" />
          <h2 className="section-title">02. Google Search Console Overview</h2>
        </div>
        <span className="section-badge">{periodName} vs {prevPeriodName}</span>
      </div>

      {/* Primary KPI Boxes */}
      <div className="metrics-grid grid-4">
        {gscOverview.map((item) => (
          <MetricBox
            key={item.key}
            title={item.label}
            value={item.current.toLocaleString ? item.current.toLocaleString() : item.current}
            previousValue={item.previous.toLocaleString ? item.previous.toLocaleString() : item.previous}
            diff={item.diff}
            invertColor={item.invertColor}
            subtitle={
              item.key === 'position'
                ? 'Average rank across indexed queries'
                : item.key === 'ctr'
                ? 'Click-Through Rate'
                : 'Search performance'
            }
          />
        ))}
      </div>

      {/* Device Breakdown */}
      {deviceTraffic && deviceTraffic.length > 0 && (
        <div className="sub-section">
          <h3 className="sub-section-title">Device Breakdown (Search Console Clicks)</h3>
          <div className="device-cards-grid">
            {deviceTraffic.map((d) => (
              <div key={d.device} className="device-box">
                <div className="device-box-header">
                  <div className="device-title">
                    {d.device === 'Desktop' ? <Monitor size={16} /> : <Smartphone size={16} />}
                    <span>{d.device}</span>
                  </div>
                </div>
                <div className="device-metric-row">
                  <span className="device-curr">{d.current.toLocaleString()} clicks</span>
                  {d.impressions !== undefined && (
                    <span className="device-prev">{d.impressions.toLocaleString()} impressions</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branded vs Non-Branded Breakdown */}
      {queryBreakdown && (
        <div className="sub-section">
          <div className="sub-header-with-tabs">
            <h3 className="sub-section-title">Branded vs Non-Branded Search Queries</h3>

            <div className="tab-pill-group">
              <button
                className={`tab-pill ${deviceTab === 'overall' ? 'active' : ''}`}
                onClick={() => setDeviceTab('overall')}
              >
                <Layers size={13} />
                <span>Overall</span>
              </button>
              <button
                className={`tab-pill ${deviceTab === 'desktop' ? 'active' : ''}`}
                onClick={() => setDeviceTab('desktop')}
              >
                <Monitor size={13} />
                <span>Desktop</span>
              </button>
              <button
                className={`tab-pill ${deviceTab === 'mobile' ? 'active' : ''}`}
                onClick={() => setDeviceTab('mobile')}
              >
                <Smartphone size={13} />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          <div className="metrics-grid grid-4">
            {currentQueries.map((item, idx) => (
              <MetricBox
                key={idx}
                title={item.label}
                value={item.current.toLocaleString()}
                previousValue={item.previous.toLocaleString()}
                diff={item.diff}
                subtitle={`${deviceTab.toUpperCase()} Query Segment`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
