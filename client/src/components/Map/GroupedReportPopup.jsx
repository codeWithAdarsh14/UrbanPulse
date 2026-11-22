/**
 * GroupedReportPopup Component
 * Displays all reports sharing the same or nearby coordinates as distinct,
 * independently readable cards in a scrollable container.
 */

import ReportVoteControls from './ReportVoteControls';

export default function GroupedReportPopup({
  reports,
  formatDate,
  isSpiderfied,
  onToggleSpiderfy,
  onReportUpdate,
  onLoginClick,
}) {
  const count = reports.length;

  return (
    <div className="popup-container grouped-popup-container">
      {/* Header */}
      <div className="grouped-popup-header">
        <div className="grouped-header-left">
          <h4 className="grouped-popup-title">Problems at this location</h4>
          <span className="grouped-count-badge">{count} Reports</span>
        </div>
        {onToggleSpiderfy && count > 1 && (
          <button
            type="button"
            className={`btn-spiderfy-toggle ${isSpiderfied ? 'active' : ''}`}
            onClick={onToggleSpiderfy}
            title={isSpiderfied ? 'Collapse markers to single location' : 'Fan out markers on the map'}
          >
            {isSpiderfied ? '⊙ Group' : '✦ Fan Out'}
          </button>
        )}
      </div>

      <p className="grouped-popup-subtitle">
        Multiple civic issues have been reported around this exact location:
      </p>

      {/* Scrollable list of individual report cards */}
      <div className="grouped-reports-list" tabIndex={0} aria-label="List of problems reported at this location">
        {reports.map((report, idx) => (
          <div key={report._id || idx} className="grouped-report-card">
            <div className="report-card-top">
              <span className="report-card-index">#{idx + 1}</span>
              <h5 className="report-card-title">{report.title}</h5>
              <span className="popup-badge badge-report">{report.category}</span>
            </div>

            <div className="report-card-meta">
              <div className="meta-row">
                <span className="meta-label">Status:</span>
                <span className="popup-badge badge-status">{report.status || 'active'}</span>
              </div>
              {report.createdAt && (
                <div className="meta-row">
                  <span className="meta-label">Reported:</span>
                  <span className="meta-val">{formatDate(report.createdAt)}</span>
                </div>
              )}
              {report.confidenceScore > 0 && (
                <div className="meta-row">
                  <span className="meta-label">Confidence:</span>
                  <span className="meta-val">{report.confidenceScore}%</span>
                </div>
              )}
            </div>

            <p className="report-card-desc">{report.description}</p>

            <ReportVoteControls
              report={report}
              onVoteSuccess={onReportUpdate}
              onLoginClick={onLoginClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
