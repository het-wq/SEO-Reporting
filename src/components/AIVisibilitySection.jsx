import React from 'react';
import MetricBox from './MetricBox';
import { Bot, Sparkles } from 'lucide-react';

export default function AIVisibilitySection({ aiVisibility, periodName, prevPeriodName }) {
  if (!aiVisibility) return null;

  const { summary, engines } = aiVisibility;

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <Bot size={18} className="section-icon" />
          <h2 className="section-title">AI Search Visibility (ChatGPT, Gemini & AI Overviews)</h2>
        </div>
        <span className="section-badge">{periodName} vs {prevPeriodName}</span>
      </div>

      {/* Summary KPI Boxes */}
      <div className="metrics-grid grid-3">
        <MetricBox
          title="AI Visibility Index"
          value={summary.score.current}
          previousValue={summary.score.previous}
          diff={summary.score.diff}
          subtitle="Overall prominence across AI responses"
        />
        <MetricBox
          title="Total AI Mentions"
          value={summary.mentions.current}
          previousValue={summary.mentions.previous}
          diff={summary.mentions.diff}
          subtitle="Brand mentions generated in AI answers"
        />
        <MetricBox
          title="Cited Pages"
          value={summary.citedPages.current}
          previousValue={summary.citedPages.previous}
          diff={summary.citedPages.diff}
          subtitle="Unique URLs linked in AI sources"
        />
      </div>

      {/* Engine breakdown */}
      <div className="sub-section">
        <h3 className="sub-section-title">Platform Breakdown</h3>
        <div className="metrics-grid grid-4">
          {engines.map((eng) => (
            <div key={eng.engine} className="metric-box ai-engine-card">
              <div className="engine-card-header">
                <Sparkles size={16} className="engine-icon" />
                <span className="engine-name">{eng.engine}</span>
              </div>

              <div className="engine-stats-grid">
                <div className="engine-stat-block">
                  <span className="stat-label">Mentions</span>
                  <div className="stat-value-row">
                    <span className="stat-val">{eng.currentMentions}</span>
                    <span className="stat-prev">Prev: {eng.previousMentions}</span>
                  </div>
                </div>

                <div className="engine-stat-block">
                  <span className="stat-label">Cited Pages</span>
                  <div className="stat-value-row">
                    <span className="stat-val">{eng.currentCited}</span>
                    <span className="stat-prev">Prev: {eng.previousCited}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
