import React from 'react';
import MetricBox from './MetricBox';
import { Link2, Shield } from 'lucide-react';

export default function BacklinksSection({ backlinks, periodName, prevPeriodName }) {
  if (!backlinks) return null;

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <Link2 size={18} className="section-icon" />
          <h2 className="section-title">07. Backlinks & Authority Update</h2>
        </div>
        <span className="section-badge">Audit Dates: 30/06/2026 vs 31/07/2026</span>
      </div>

      <div className="metrics-grid grid-4">
        {backlinks.map((item, idx) => {
          const isNumericDiff = !isNaN(parseFloat(item.diff));
          const numDiff = isNumericDiff ? parseFloat(item.diff) : null;

          return (
            <MetricBox
              key={idx}
              title={item.metric}
              value={item.current}
              previousValue={item.previous}
              diff={numDiff}
              diffText={item.diff}
              subtitle="Authority & Link Profile"
            />
          );
        })}
      </div>
    </section>
  );
}
