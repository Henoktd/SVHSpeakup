import type { AccountInfo } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { startTransition, useEffect, useMemo, useState } from "react";
import type {
  InvestigatorCaseDetailResponse,
  InvestigatorCaseListItem
} from "@svh/types";
import {
  investigatorAuthConfigured,
  investigatorLoginRequest
} from "./authConfig";
import { getInvestigatorCase, getInvestigatorCases } from "./lib/api";

export function App() {
  if (!investigatorAuthConfigured) {
    return (
      <div className="investigator-app">
        <main className="investigator-shell investigator-shell-centered">
          <section className="investigator-panel investigator-setup-panel">
            <p className="eyebrow">Security required</p>
            <h1>Investigator access must use Microsoft Entra sign-in.</h1>
            <p>
              Configure the SPA and API application settings first, then only
              the allowed investigators will be able to see cases.
            </p>
            <ul className="investigator-setup-list">
              <li>`VITE_INVESTIGATOR_ENTRA_TENANT_ID`</li>
              <li>`VITE_INVESTIGATOR_ENTRA_CLIENT_ID`</li>
              <li>`VITE_INVESTIGATOR_API_SCOPE`</li>
              <li>`INVESTIGATOR_AUTH_ENABLED=true`</li>
              <li>`INVESTIGATOR_API_AUDIENCES=...`</li>
              <li>
                one of `INVESTIGATOR_ALLOWED_GROUP_IDS`,
                `INVESTIGATOR_ALLOWED_ROLE_VALUES`, or
                `INVESTIGATOR_ALLOWED_USER_OIDS`
              </li>
            </ul>
          </section>
        </main>
      </div>
    );
  }

  return <AuthenticatedInvestigatorApp />;
}

function AuthenticatedInvestigatorApp() {
  const { accounts, inProgress, instance } = useMsal();
  const activeAccount = instance.getActiveAccount() ?? accounts[0] ?? null;
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (activeAccount && !instance.getActiveAccount()) {
      instance.setActiveAccount(activeAccount);
    }
  }, [activeAccount, instance]);

  useEffect(() => {
    if (!activeAccount) {
      setAccessToken(null);
      return;
    }

    let isCancelled = false;

    async function acquireAccessToken() {
      try {
        const tokenResponse = await instance.acquireTokenSilent({
          ...investigatorLoginRequest,
          account: activeAccount
        });

        if (!isCancelled) {
          setAccessToken(tokenResponse.accessToken);
          setAuthError(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setAccessToken(null);
          setAuthError(
            error instanceof Error
              ? error.message
              : "Unable to acquire an investigator access token."
          );
        }
      }
    }

    void acquireAccessToken();

    return () => {
      isCancelled = true;
    };
  }, [activeAccount, instance]);

  if (!activeAccount) {
    return (
      <div className="investigator-app">
        <main className="investigator-shell investigator-shell-centered">
          <section className="investigator-panel investigator-login-panel">
            <p className="eyebrow">Restricted workspace</p>
            <h1>Investigator sign-in required</h1>
            <p>
              This portal should not be open to the public. Sign in with an
              approved SVH Microsoft account to continue.
            </p>
            <button
              className="investigator-primary-button"
              disabled={inProgress !== "none"}
              onClick={() => void instance.loginRedirect(investigatorLoginRequest)}
              type="button"
            >
              {inProgress === "none" ? "Sign in with Microsoft" : "Signing in..."}
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <InvestigatorWorkspace
      accessToken={accessToken}
      account={activeAccount}
      authError={authError}
      onRefreshToken={() =>
        instance.acquireTokenRedirect({
          ...investigatorLoginRequest,
          account: activeAccount
        })
      }
      onSignOut={() => instance.logoutRedirect({ account: activeAccount })}
    />
  );
}

function InvestigatorWorkspace({
  accessToken,
  account,
  authError,
  onRefreshToken,
  onSignOut
}: {
  accessToken: string | null;
  account: AccountInfo;
  authError: string | null;
  onRefreshToken: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [cases, setCases] = useState<InvestigatorCaseListItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] =
    useState<InvestigatorCaseDetailResponse | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setCases([]);
      setSelectedCaseId(null);
      setSelectedCase(null);
      setIsLoadingList(false);
      return;
    }

    const nextAccessToken = accessToken;
    let isCancelled = false;

    async function loadCases() {
      setIsLoadingList(true);
      setListError(null);

      try {
        const result = await getInvestigatorCases(nextAccessToken);

        if (isCancelled) {
          return;
        }

        setCases(result.cases);
        setSelectedCaseId((currentSelectedCaseId) =>
          currentSelectedCaseId ?? result.cases[0]?.caseId ?? null
        );
      } catch (error) {
        if (!isCancelled) {
          setListError(
            error instanceof Error
              ? error.message
              : "Unable to load investigator cases."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingList(false);
        }
      }
    }

    void loadCases();

    return () => {
      isCancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !selectedCaseId) {
      setSelectedCase(null);
      return;
    }

    const nextAccessToken = accessToken;
    const nextCaseId = selectedCaseId;
    let isCancelled = false;

    async function loadCaseDetail() {
      setIsLoadingDetail(true);
      setDetailError(null);

      try {
        const result = await getInvestigatorCase(nextAccessToken, nextCaseId);

        if (!isCancelled) {
          setSelectedCase(result);
        }
      } catch (error) {
        if (!isCancelled) {
          setDetailError(
            error instanceof Error
              ? error.message
              : "Unable to load the selected case."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDetail(false);
        }
      }
    }

    void loadCaseDetail();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, selectedCaseId]);

  const metrics = useMemo(() => {
    const openCases = cases.filter(
      (caseItem) =>
        caseItem.status !== "resolved" && caseItem.status !== "closed"
    ).length;
    const recentCases = cases.filter((caseItem) => {
      const submittedAt = new Date(caseItem.submittedAt).getTime();
      return Date.now() - submittedAt <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const averageAgeHours =
      cases.length === 0
        ? 0
        : Math.round(
            cases.reduce((totalHours, caseItem) => {
              const submittedAt = new Date(caseItem.submittedAt).getTime();
              return totalHours + (Date.now() - submittedAt) / 36e5;
            }, 0) / cases.length
          );

    return {
      averageAgeHours,
      openCases,
      recentCases
    };
  }, [cases]);

  return (
    <div className="investigator-app">
      <header className="investigator-topbar">
        <div>
          <p className="eyebrow">SVH SpeakUp</p>
          <h1>Investigator workspace</h1>
        </div>
        <div className="investigator-account-card">
          <strong>{account.name ?? "Signed-in investigator"}</strong>
          <span>{account.username}</span>
          <div className="investigator-account-actions">
            <button
              className="investigator-secondary-button"
              onClick={() => void onSignOut()}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="investigator-shell">
        {authError ? (
          <section className="investigator-auth-banner">
            <p>{authError}</p>
            <button
              className="investigator-secondary-button"
              onClick={() => void onRefreshToken()}
              type="button"
            >
              Refresh sign-in
            </button>
          </section>
        ) : null}

        {!accessToken ? (
          <section className="investigator-panel investigator-login-panel">
            <p>Completing secure sign-in...</p>
          </section>
        ) : null}

        <section className="investigator-stats">
          <article className="investigator-stat-card">
            <p>Open cases</p>
            <strong>{metrics.openCases}</strong>
            <span>Cases not yet resolved or closed</span>
          </article>
          <article className="investigator-stat-card">
            <p>New this week</p>
            <strong>{metrics.recentCases}</strong>
            <span>Submissions received in the last 7 days</span>
          </article>
          <article className="investigator-stat-card accent">
            <p>Average case age</p>
            <strong>{metrics.averageAgeHours}h</strong>
            <span>Based on submission time of loaded cases</span>
          </article>
        </section>

        <section className="investigator-main-grid">
          <article className="investigator-panel investigator-list-panel">
            <div className="investigator-panel-head">
              <div>
                <p className="eyebrow">Queue</p>
                <h2>Active cases</h2>
              </div>
              <span className="investigator-pill">{cases.length} loaded</span>
            </div>

            {isLoadingList ? <p>Loading cases...</p> : null}
            {listError ? <p className="investigator-error">{listError}</p> : null}

            <div className="investigator-case-list">
              {cases.map((caseItem) => (
                <button
                  className={`investigator-case-card${
                    selectedCaseId === caseItem.caseId ? " selected" : ""
                  }`}
                  key={caseItem.caseId}
                  onClick={() =>
                    startTransition(() => setSelectedCaseId(caseItem.caseId))
                  }
                  type="button"
                >
                  <div className="investigator-case-topline">
                    <span className="investigator-case-id">{caseItem.caseId}</span>
                    <span className={`status-chip ${caseItem.status}`}>
                      {caseItem.statusLabel}
                    </span>
                  </div>
                  <h3>{caseItem.title}</h3>
                  <p>{caseItem.descriptionSnippet}</p>
                  <div className="investigator-case-meta">
                    <span>{caseItem.categoryLabel}</span>
                    <span>{formatDateTime(caseItem.submittedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="investigator-panel investigator-detail-panel">
            <div className="investigator-panel-head">
              <div>
                <p className="eyebrow">Case detail</p>
                <h2>
                  {selectedCase ? selectedCase.title : "Select a case"}
                </h2>
              </div>
              {selectedCase ? (
                <span className={`status-chip ${selectedCase.status}`}>
                  {selectedCase.statusLabel}
                </span>
              ) : null}
            </div>

            {isLoadingDetail ? <p>Loading case detail...</p> : null}
            {detailError ? <p className="investigator-error">{detailError}</p> : null}

            {selectedCase ? (
              <>
                <div className="investigator-detail-grid">
                  <div>
                    <span>Case ID</span>
                    <strong>{selectedCase.caseId}</strong>
                  </div>
                  <div>
                    <span>Category</span>
                    <strong>{selectedCase.categoryLabel}</strong>
                  </div>
                  <div>
                    <span>Submitted</span>
                    <strong>{formatDateTime(selectedCase.submittedAt)}</strong>
                  </div>
                  <div>
                    <span>Last activity</span>
                    <strong>{formatDateTime(selectedCase.lastActivityAt)}</strong>
                  </div>
                  <div>
                    <span>Reporter email</span>
                    <strong>{selectedCase.reporterEmail ?? "Not provided"}</strong>
                  </div>
                  <div>
                    <span>Incident date</span>
                    <strong>
                      {selectedCase.incidentDateText
                        ? formatDateTime(selectedCase.incidentDateText)
                        : "Not provided"}
                    </strong>
                  </div>
                </div>

                <section className="investigator-narrative">
                  <h3>Report narrative</h3>
                  <p>{selectedCase.description}</p>
                </section>

                <div className="investigator-detail-grid compact">
                  <div>
                    <span>Location</span>
                    <strong>{selectedCase.locationText || "Not provided"}</strong>
                  </div>
                  <div>
                    <span>People involved</span>
                    <strong>
                      {selectedCase.peopleInvolved || "Not provided"}
                    </strong>
                  </div>
                  <div>
                    <span>Evidence notes</span>
                    <strong>{selectedCase.evidenceNotes || "Not provided"}</strong>
                  </div>
                  <div>
                    <span>Reporter confirmations</span>
                    <strong>
                      {selectedCase.confidentialityAccepted &&
                      selectedCase.consentAccepted
                        ? "Accepted"
                        : "Incomplete"}
                    </strong>
                  </div>
                </div>

                <section className="investigator-narrative">
                  <h3>Presidential escalation context</h3>
                  <p>{selectedCase.presidentialEscalationReason}</p>
                </section>

                <div className="investigator-detail-grid compact">
                  <div>
                    <span>Raised through normal channels</span>
                    <strong>
                      {formatBooleanLabel(
                        selectedCase.raisedThroughNormalChannels
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Potential impact</span>
                    <strong>
                      {selectedCase.potentialImpactLabel || "Not provided"}
                    </strong>
                  </div>
                  <div>
                    <span>Urgency</span>
                    <strong>{selectedCase.urgencyLabel || "Not provided"}</strong>
                  </div>
                  <div>
                    <span>Local action summary</span>
                    <strong>
                      {selectedCase.normalChannelActionSummary || "Not provided"}
                    </strong>
                  </div>
                </div>

                {selectedCase.presidentialEscalationFactorLabels.length > 0 ? (
                  <div className="investigator-tag-list">
                    {selectedCase.presidentialEscalationFactorLabels.map((label) => (
                      <span className="investigator-pill" key={label}>
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}

                {selectedCase.presidentialEscalationOtherDetail ? (
                  <section className="investigator-narrative">
                    <h3>Other escalation detail</h3>
                    <p>{selectedCase.presidentialEscalationOtherDetail}</p>
                  </section>
                ) : null}

                <section className="investigator-activity">
                  <h3>Activity timeline</h3>
                  <div className="investigator-activity-list">
                    {selectedCase.activity.map((activityItem) => (
                      <article
                        className="investigator-activity-card"
                        key={`${activityItem.createdAt}-${activityItem.summary}`}
                      >
                        <p className="investigator-activity-meta">
                          {activityItem.actorType} ·{" "}
                          {formatDateTime(activityItem.createdAt)}
                        </p>
                        <p>{activityItem.summary}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <p className="investigator-muted">
                Choose a case from the queue to inspect the full submission and
                audit timeline.
              </p>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}

function formatDateTime(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString();
}

function formatBooleanLabel(value: boolean) {
  return value ? "Yes" : "No";
}
