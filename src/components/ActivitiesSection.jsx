import React from 'react';
import { CheckCircle2, AlertCircle, Lightbulb, ListTodo } from 'lucide-react';

export default function ActivitiesSection({ offPageActivities, insights, periodName }) {
  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <ListTodo size={18} className="section-icon" />
          <h2 className="section-title">05. Off-Page Activities & Monthly Highlights ({periodName})</h2>
        </div>
      </div>

      {/* Off-page Activity Boxes */}
      {offPageActivities && (
        <div className="sub-section">
          <h3 className="sub-section-title">Off-Page Tasks Completed</h3>
          <div className="metrics-grid grid-auto">
            {offPageActivities.map((act, idx) => (
              <div key={idx} className="metric-box activity-box">
                <span className="activity-label">{act.activity}</span>
                <div className="activity-count">{act.count}</div>
                <span className="activity-status">Completed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hits, Misses & Future Initiatives */}
      {insights && (
        <div className="insights-two-col">
          <div className="insights-card">
            <div className="insights-header">
              <CheckCircle2 size={16} className="text-success" />
              <h3>Key Hits & Misses</h3>
            </div>
            <ul className="insights-list">
              {insights.hitsAndMisses.map((item, idx) => (
                <li key={idx} className={item.type === 'hit' ? 'item-hit' : 'item-miss'}>
                  <span className="bullet-indicator">{item.type === 'hit' ? '✓' : '•'}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="insights-card">
            <div className="insights-header">
              <Lightbulb size={16} className="text-warning" />
              <h3>Next Month Initiatives</h3>
            </div>
            <ul className="insights-list">
              {insights.newInitiatives.map((item, idx) => (
                <li key={idx} className="item-initiative">
                  <span className="bullet-indicator">&rarr;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
