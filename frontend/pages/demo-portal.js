import { useEffect, useState } from "react";
import { PublicShell } from "@/components/PublicShell";
import dynamic from "next/dynamic";

const PRIMARY = "#0B3C5D";
const SECONDARY = "#1A4D8F";

const DEMO_PROPERTY = {
  ownerName: "Ravi Kumar",
  surveyNumber: "124/7A",
  village: "Rampur",
  district: "Lucknow",
  landArea: "1200 sq meters",
};

const STEPS = [
  { id: 1, label: "Citizen Identity Verification" },
  { id: 2, label: "Land Registration" },
  { id: 3, label: "Government Approval" },
  { id: 4, label: "Blockchain Recording" },
  { id: 5, label: "Public Verification" },
];

const DemoParcelMap = dynamic(
  () => import("@/components/DemoParcelMap").then((m) => m.DemoParcelMap),
  { ssr: false }
);
const DemoParcelSidePanel = dynamic(
  () => import("@/components/DemoParcelMap").then((m) => m.DemoParcelSidePanel),
  { ssr: false }
);

export default function DemoPortalPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [logs, setLogs] = useState([]);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [landSubmitted, setLandSubmitted] = useState(false);
  const [govApproved, setGovApproved] = useState(false);
  const [txInfo, setTxInfo] = useState(null);
  const [recordVerified, setRecordVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);

  function pushLog(message) {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${message}`]);
  }

  function markStepComplete(stepId) {
    setCompletedSteps((prev) => (prev.includes(stepId) ? prev : [...prev, stepId]));
    if (stepId < 5) setCurrentStep(stepId + 1);
  }

  async function handleVerifyIdentity() {
    setLoading(true);
    pushLog("Starting Aadhaar-based identity verification");
    await new Promise((r) => setTimeout(r, 900));
    setIdentityVerified(true);
    pushLog("Identity verified");
    setLoading(false);
    markStepComplete(1);
  }

  function handleSubmitLand() {
    setLandSubmitted(true);
    pushLog("Land registration submitted");
    markStepComplete(2);
  }

  async function handleApprove() {
    setLoading(true);
    pushLog("Government officer reviewing application");
    await new Promise((r) => setTimeout(r, 800));
    setGovApproved(true);
    pushLog("Government approval granted");
    setLoading(false);
    markStepComplete(3);
  }

  async function handleCreateTx() {
    setLoading(true);
    pushLog("Creating blockchain transaction");
    setCurrentStep(4);
    await new Promise((r) => setTimeout(r, 1200));
    const hash = "0x8f3ab92d81a47cfe238a";
    const block = 10425;
    const ts = new Date().toLocaleString();
    const nodeId = "Node-Delhi-01";
    setTxInfo({ hash, block, ts, nodeId });
    pushLog("Blockchain transaction created");
    await new Promise((r) => setTimeout(r, 500));
    pushLog("Block confirmed");
    setLoading(false);
    markStepComplete(4);
  }

  function handleVerifyRecord() {
    setRecordVerified(true);
    pushLog("Public verification successful");
    markStepComplete(5);
  }

  const allDone = completedSteps.length === 5 && txInfo && recordVerified;

  return (
    <PublicShell
      title="BhoomiChain Demo Portal – Interactive Land Registration Workflow"
      subtitle="Experience the complete lifecycle of land registration powered by blockchain."
      hideQuickLinks
    >
      <div className="grid lg:grid-cols-[260px,minmax(0,1.4fr),minmax(0,0.9fr)] gap-5">
        {/* LEFT: Workflow stepper */}
        <aside className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: PRIMARY }}>
            Demo Workflow
          </h2>
          <ol className="space-y-3 text-sm">
            {STEPS.map((step) => {
              const isDone = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              return (
                <li
                  key={step.id}
                  className={`flex items-start gap-3 rounded-lg px-2 py-2 ${
                    isCurrent ? "bg-slate-50 border border-slate-200" : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isDone
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                        : isCurrent
                        ? "bg-[#0B3C5D] text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isDone ? "✓" : step.id}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{step.label}</div>
                    {isCurrent && (
                      <div className="text-[11px] text-slate-500 mt-0.5">Current step</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* CENTER: Interactive demo */}
        <section className="space-y-4">
          {currentStep === 1 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: PRIMARY }}>
                Step 1 — Citizen Identity Verification
              </h2>
              <p className="text-xs text-slate-600">
                Simulated Aadhaar-based identity verification for land owner.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Owner Name</label>
                  <input
                    className="input text-sm"
                    defaultValue={DEMO_PROPERTY.ownerName}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Aadhaar Number</label>
                  <input className="input text-sm" defaultValue="1234 5678 9012" readOnly />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Mobile Number</label>
                  <input className="input text-sm" defaultValue="+91-98765 43210" readOnly />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Address</label>
                  <input
                    className="input text-sm"
                    defaultValue="House 24, Rampur, Lucknow, Uttar Pradesh"
                    readOnly
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleVerifyIdentity}
                disabled={loading || identityVerified}
                className="btn btn-primary mt-2 px-4 py-2.5 rounded-lg text-sm"
              >
                {identityVerified ? "Identity Verified" : loading ? "Verifying identity…" : "Verify Identity"}
              </button>
              {identityVerified && (
                <div className="mt-2 text-xs text-emerald-700 font-medium">
                  ✓ Identity verified for Aadhaar-linked citizen.
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: PRIMARY }}>
                Step 2 — Land Registration
              </h2>
              <p className="text-xs text-slate-600">
                Registrar captures land parcel details and previews the GIS boundary.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">State</label>
                  <input className="input text-sm" defaultValue="Uttar Pradesh" readOnly />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">District</label>
                  <input className="input text-sm" defaultValue={DEMO_PROPERTY.district} readOnly />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Village</label>
                  <input className="input text-sm" defaultValue={DEMO_PROPERTY.village} readOnly />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Survey Number</label>
                  <input className="input text-sm" defaultValue={DEMO_PROPERTY.surveyNumber} readOnly />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Land Area (sq m)</label>
                  <input className="input text-sm" defaultValue="1200" readOnly />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Land Type</label>
                  <input className="input text-sm" defaultValue="Residential" readOnly />
                </div>
              </div>
              <div className="mt-4 grid md:grid-cols-[1.1fr,minmax(0,0.9fr)] gap-4">
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                  <div className="text-xs font-medium text-slate-600 mb-2">
                    Mini Map Preview (Simulated Parcel)
                  </div>
                  <div className="relative h-40 bg-slate-100 rounded-md overflow-hidden">
                    <svg viewBox="0 0 200 140" className="w-full h-full">
                      <rect width="200" height="140" fill="#e5e7eb" />
                      <path
                        d="M40 90 L80 40 L150 55 L160 105 L90 120 Z"
                        fill="#bfdbfe"
                        stroke={SECONDARY}
                        strokeWidth="2"
                      />
                      <circle cx="100" cy="80" r="3" fill={PRIMARY} />
                    </svg>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 text-xs text-slate-700 space-y-1.5">
                  <div className="font-semibold text-slate-900">Registration Summary</div>
                  <div>Owner: {DEMO_PROPERTY.ownerName}</div>
                  <div>Survey No: {DEMO_PROPERTY.surveyNumber}</div>
                  <div>Village: {DEMO_PROPERTY.village}</div>
                  <div>District: {DEMO_PROPERTY.district}</div>
                  <div>Area: {DEMO_PROPERTY.landArea}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmitLand}
                disabled={landSubmitted}
                className="btn btn-primary mt-3 px-4 py-2.5 rounded-lg text-sm"
              >
                {landSubmitted ? "Land Registration Submitted" : "Submit Land Registration"}
              </button>
              {landSubmitted && (
                <div className="mt-2 text-xs text-emerald-700 font-medium">
                  ✓ Land registration request captured for BhoomiChain review.
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: PRIMARY }}>
                Step 3 — Government Verification
              </h2>
              <p className="text-xs text-slate-600">
                A registrar reviews the application and approves the land record.
              </p>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-sm text-slate-700 space-y-1.5">
                <div className="font-semibold text-slate-900 mb-1">Application Summary</div>
                <div>Owner Name: {DEMO_PROPERTY.ownerName}</div>
                <div>Survey Number: {DEMO_PROPERTY.surveyNumber}</div>
                <div>Village: {DEMO_PROPERTY.village}</div>
                <div>Land Area: {DEMO_PROPERTY.landArea}</div>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading || govApproved}
                  className="btn btn-primary px-4 py-2.5 rounded-lg text-sm"
                >
                  {govApproved ? "Registration Approved" : loading ? "Approving…" : "Approve Registration"}
                </button>
                <button
                  type="button"
                  disabled
                  className="btn btn-secondary px-4 py-2.5 rounded-lg text-sm opacity-60 cursor-not-allowed"
                >
                  Reject Registration
                </button>
              </div>
              {govApproved && (
                <div className="mt-2 text-xs text-emerald-700 font-medium">
                  ✓ Government verification complete. Record ready for blockchain minting.
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              <h2 className="text-sm font-semibold" style={{ color: PRIMARY }}>
                Step 4 — Blockchain Recording
              </h2>
              <p className="text-xs text-slate-600">
                BhoomiChain creates an immutable transaction for this land parcel.
              </p>
              <div className="grid md:grid-cols-[minmax(0,1.2fr),minmax(0,0.9fr)] gap-4">
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                  <div className="text-xs text-slate-500 mb-2">Consensus Nodes (Demo)</div>
                  <div className="relative h-40">
                    <svg viewBox="0 0 260 140" className="w-full h-full">
                      <defs>
                        <linearGradient id="linkGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={SECONDARY} stopOpacity="0.1" />
                          <stop offset="100%" stopColor={SECONDARY} stopOpacity="0.6" />
                        </linearGradient>
                      </defs>
                      <circle cx="60" cy="40" r="14" fill="#eff6ff" stroke={SECONDARY} />
                      <circle cx="200" cy="40" r="14" fill="#eff6ff" stroke={SECONDARY} />
                      <circle cx="60" cy="110" r="14" fill="#eff6ff" stroke={SECONDARY} />
                      <circle cx="200" cy="110" r="14" fill="#eff6ff" stroke={SECONDARY} />
                      <circle cx="130" cy="75" r="18" fill="#ecfdf3" stroke="#16a34a" />
                      <line x1="60" y1="40" x2="130" y2="75" stroke="url(#linkGrad)" strokeWidth="2" />
                      <line x1="200" y1="40" x2="130" y2="75" stroke="url(#linkGrad)" strokeWidth="2" />
                      <line x1="60" y1="110" x2="130" y2="75" stroke="url(#linkGrad)" strokeWidth="2" />
                      <line x1="200" y1="110" x2="130" y2="75" stroke="url(#linkGrad)" strokeWidth="2" />
                      <text x="130" y="78" textAnchor="middle" fontSize="9" fill="#166534">
                        New Block
                      </text>
                    </svg>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Nodes reach consensus and write the land record to the BhoomiChain ledger.
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs text-slate-700 space-y-1.5">
                  <div className="font-semibold text-slate-900 mb-1">Transaction Details</div>
                  <div>
                    <span className="text-slate-500">Transaction Hash:</span>{" "}
                    <span className="font-mono text-[11px]">
                      {txInfo?.hash || "0x8f3ab92d81a47cfe238a"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Block Number:</span>{" "}
                    {txInfo?.block || 10425}
                  </div>
                  <div>
                    <span className="text-slate-500">Network:</span> BhoomiChain Ledger
                  </div>
                  <div>
                    <span className="text-slate-500">Node ID:</span>{" "}
                    {txInfo?.nodeId || "Node-Delhi-01"}
                  </div>
                  <div>
                    <span className="text-slate-500">Timestamp:</span>{" "}
                    {txInfo?.ts || "Just now"}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    ✓ Transaction Confirmed
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateTx}
                    disabled={loading}
                    className="btn btn-primary mt-3 px-4 py-2.5 rounded-lg text-sm w-full"
                  >
                    {loading ? "Creating blockchain transaction…" : "Replay Blockchain Animation"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: PRIMARY }}>
                  Step 5 — Public Land Record Verification
                </h2>
                <p className="text-xs text-slate-600">
                  Search and verify land ownership using the interactive map.
                </p>
              </div>
              <DemoParcelMap
                onSelectParcel={(parcel) => {
                  setSelectedParcel(parcel);
                  setRecordVerified(false);
                }}
              />
              <div className="grid md:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)] gap-3">
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-sm text-slate-700 space-y-1.5">
                  <div className="font-semibold text-slate-900 mb-1">Land Record Dashboard (Demo)</div>
                  <div>Owner Name: {selectedParcel?.ownerName || DEMO_PROPERTY.ownerName}</div>
                  <div>Survey Number: {selectedParcel?.surveyNumber || DEMO_PROPERTY.surveyNumber}</div>
                  <div>Village: {selectedParcel?.village || DEMO_PROPERTY.village}</div>
                  <div>District: {DEMO_PROPERTY.district}</div>
                  <div>Land Area: {selectedParcel?.area || DEMO_PROPERTY.landArea}</div>
                  <div>
                    Blockchain Hash:{" "}
                    <span className="font-mono text-xs">
                      {selectedParcel?.hash || txInfo?.hash || "0x8f3ab92d81a47cfe238a"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <DemoParcelSidePanel parcel={selectedParcel} txInfo={txInfo} />
                  <button
                    type="button"
                    onClick={handleVerifyRecord}
                    disabled={recordVerified || !selectedParcel}
                    className="btn btn-primary w-full mt-1 px-4 py-2.5 rounded-lg text-sm"
                  >
                    {recordVerified ? "Record Verified on Blockchain" : "Verify on Blockchain"}
                  </button>
                  {recordVerified && (
                    <div className="mt-1 text-xs text-emerald-700 font-medium">
                      ✓ Record verified against BhoomiChain ledger.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Certificate and end state */}
          {allDone && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              <h2 className="text-sm font-semibold" style={{ color: PRIMARY }}>
                Digital Land Ownership Certificate
              </h2>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-sm text-slate-800 space-y-1.5">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Government of India · BhoomiChain (Demo)
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  Digital Land Ownership Certificate
                </div>
                <div className="mt-3">
                  Owner: <span className="font-semibold">{DEMO_PROPERTY.ownerName}</span>
                </div>
                <div>Survey No: {DEMO_PROPERTY.surveyNumber}</div>
                <div>Village: {DEMO_PROPERTY.village}</div>
                <div>District: {DEMO_PROPERTY.district}</div>
                <div>Area: {DEMO_PROPERTY.landArea}</div>
                <div className="mt-2 text-xs">
                  Blockchain Transaction ID:{" "}
                  <span className="font-mono">
                    {txInfo?.hash || "0x8f3ab92d81a47cfe238a"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary px-4 py-2.5 rounded-lg text-sm"
                onClick={() => window.print()}
              >
                Download Certificate (Print)
              </button>
              <div className="text-xs text-emerald-700 font-semibold">
                Land Registration Completed Successfully — record anchored on BhoomiChain and publicly verifiable.
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: Blockchain log */}
        <aside className="bg-black rounded-xl border border-slate-800 shadow-inner text-xs font-mono text-emerald-100 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-100">
              BhoomiChain Transaction Log (Demo)
            </span>
          </div>
          <div className="flex-1 px-3 py-2 overflow-auto space-y-0.5">
            {logs.length === 0 ? (
              <div className="text-slate-500">[waiting for actions]</div>
            ) : (
              logs.map((l, idx) => (
                <div key={idx} className="whitespace-pre">
                  {l}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </PublicShell>
  );
}

