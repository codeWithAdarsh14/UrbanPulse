import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { confirmReport, disputeReport } from '../../services/reportService';
import './ReportVoteControls.css';

/**
 * ReportVoteControls Component
 * Reusable Confirm/Dispute voting widget for civic reports.
 *
 * Supports all 8 distinct UI states:
 * 1. Normal voting UI (logged in, not creator, not voted yet)
 * 2. Logged-out user UI (prompts login, "Login to Vote" action)
 * 3. Report creator UI ("You cannot vote on your own report")
 * 4. Already confirmed UI (indicates previous confirm, locks vote)
 * 5. Already disputed UI (indicates previous dispute, locks vote)
 * 6. Voting in progress UI (per-report loading state: "Confirming..." / "Disputing...")
 * 7. Successful voting UI (immediate count/confidence update & success banner)
 * 8. Voting error UI (clear backend/network error message & recovery)
 */
export default function ReportVoteControls({
  report,
  onVoteSuccess,
  onLoginClick,
  className = '',
}) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loadingAction, setLoadingAction] = useState(null); // 'confirm' | 'dispute' | null
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Maintain local report state for instantaneous reactive updates
  const [localReport, setLocalReport] = useState(report);
  useEffect(() => {
    setLocalReport(report);
  }, [report]);

  const activeReport = localReport || report;
  if (!activeReport) return null;

  const currentUserId = user?._id || user?.id;
  const reportId = activeReport._id || activeReport.id;

  // 1. Report ownership check
  const createdBy = activeReport.createdBy;
  const creatorId = createdBy?._id || createdBy?.id || createdBy;
  const isCreator = Boolean(
    currentUserId &&
    creatorId &&
    currentUserId.toString() === creatorId.toString()
  );

  // 2. Voting activity checks
  const confirmations = Array.isArray(activeReport.confirmations) ? activeReport.confirmations : [];
  const disputes = Array.isArray(activeReport.disputes) ? activeReport.disputes : [];

  const hasConfirmed = Boolean(
    currentUserId &&
    confirmations.some((c) => {
      const cId = c?._id || c?.id || c;
      return cId && cId.toString() === currentUserId.toString();
    })
  );

  const hasDisputed = Boolean(
    currentUserId &&
    disputes.some((d) => {
      const dId = d?._id || d?.id || d;
      return dId && dId.toString() === currentUserId.toString();
    })
  );

  // 3. Counts and confidence calculation
  const confirmCount = confirmations.length;
  const disputeCount = disputes.length;
  const totalVotes = confirmCount + disputeCount;

  let confidenceDisplay = 'No votes yet';
  if (totalVotes > 0) {
    const score = typeof activeReport.confidenceScore === 'number'
      ? activeReport.confidenceScore
      : (confirmCount / totalVotes) * 100;
    confidenceDisplay = `${Math.round(score)}%`;
  }

  // 4. Action Handlers
  const handleConfirm = async () => {
    if (loadingAction || authLoading || !isAuthenticated || isCreator || hasConfirmed || hasDisputed) return;
    setLoadingAction('confirm');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await confirmReport(reportId);
      setLocalReport(updated);
      setSuccessMessage('Successfully confirmed this report!');
      if (onVoteSuccess) {
        onVoteSuccess(updated);
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to confirm report. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDispute = async () => {
    if (loadingAction || authLoading || !isAuthenticated || isCreator || hasConfirmed || hasDisputed) return;
    setLoadingAction('dispute');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await disputeReport(reportId);
      setLocalReport(updated);
      setSuccessMessage('Successfully disputed this report!');
      if (onVoteSuccess) {
        onVoteSuccess(updated);
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to dispute report. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (onLoginClick) {
      onLoginClick();
    }
  };

  return (
    <div className={`report-vote-controls ${className}`}>
      {/* Metrics Row: Confirmations, Disputes, Confidence */}
      <div className="vote-metrics-row">
        <div className="vote-metric-item">
          <span className="metric-label">Confirmations:</span>
          <span className="metric-val val-confirm">{confirmCount}</span>
        </div>
        <div className="vote-metric-item">
          <span className="metric-label">Disputes:</span>
          <span className="metric-val val-dispute">{disputeCount}</span>
        </div>
        <div className="vote-metric-item">
          <span className="metric-label">Confidence:</span>
          <span className={`metric-val ${totalVotes > 0 ? 'val-confidence' : 'val-muted'}`}>
            {confidenceDisplay}
          </span>
        </div>
      </div>

      {/* State 7: Success banner */}
      {successMessage && (
        <div className="vote-feedback vote-feedback-success" role="status">
          <span className="feedback-icon" aria-hidden="true">&#10003;</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* State 8: Error banner */}
      {errorMessage && (
        <div className="vote-feedback vote-feedback-error" role="alert">
          <span className="feedback-icon" aria-hidden="true">&#9888;</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mutually Exclusive State Rendering */}

      {/* Auth Initializing Loading State: do not show logged-out UI or buttons until resolved */}
      {authLoading ? (
        <div className="vote-state-box vote-state-auth-loading">
          <span className="vote-btn-spinner" aria-hidden="true" />
          <span className="vote-state-text">Checking authorization...</span>
        </div>
      ) : (
        <>
          {/* State 2: Logged-out user */}
          {!isAuthenticated && (
            <div className="vote-state-box vote-state-logged-out">
              <p className="vote-state-text">Login to participate in voting.</p>
              <a
                href="/login"
                onClick={handleLogin}
                className="btn-vote-login"
                role="button"
              >
                Login to Vote
              </a>
            </div>
          )}

          {/* State 3: Report creator */}
          {isAuthenticated && isCreator && (
            <div className="vote-state-box vote-state-creator">
              <span className="vote-info-icon" aria-hidden="true">&#8505;</span>
              <p className="vote-state-text">You cannot vote on your own report.</p>
            </div>
          )}

          {/* State 4: Already confirmed */}
          {isAuthenticated && !isCreator && hasConfirmed && (
            <div className="vote-state-box vote-state-voted vote-voted-confirm">
              <span className="vote-badge-pill pill-confirmed">Confirmed &#10003;</span>
              <p className="vote-state-text">You have already confirmed this report.</p>
            </div>
          )}

          {/* State 5: Already disputed */}
          {isAuthenticated && !isCreator && hasDisputed && (
            <div className="vote-state-box vote-state-voted vote-voted-dispute">
              <span className="vote-badge-pill pill-disputed">Disputed &#10005;</span>
              <p className="vote-state-text">You have already disputed this report.</p>
            </div>
          )}

          {/* State 1 & State 6: Normal voting / In progress */}
          {isAuthenticated && !isCreator && !hasConfirmed && !hasDisputed && (
            <div className="vote-buttons-row">
              <button
                type="button"
                className={`btn-vote btn-confirm ${loadingAction === 'confirm' ? 'is-loading' : ''}`}
                onClick={handleConfirm}
                disabled={Boolean(loadingAction)}
                aria-busy={loadingAction === 'confirm'}
                title="Confirm this report as genuine"
              >
                {loadingAction === 'confirm' ? (
                  <>
                    <span className="vote-btn-spinner" aria-hidden="true" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
              <button
                type="button"
                className={`btn-vote btn-dispute ${loadingAction === 'dispute' ? 'is-loading' : ''}`}
                onClick={handleDispute}
                disabled={Boolean(loadingAction)}
                aria-busy={loadingAction === 'dispute'}
                title="Dispute this report as incorrect or misleading"
              >
                {loadingAction === 'dispute' ? (
                  <>
                    <span className="vote-btn-spinner" aria-hidden="true" />
                    <span>Disputing...</span>
                  </>
                ) : (
                  'Dispute'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
