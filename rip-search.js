// Maintenance: when README.md#Current-RIP-Index changes, update this
// static index in the same PR so the search page does not drift silently.
const RIP_INDEX = [
  {
    number: "0001",
    title: "Proof of Antiquity (PoA) Consensus Specification",
    status: "Draft",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0001-proof-of-antiquity.md",
  },
  {
    number: "0007",
    title: "Entropy-Based Validator Fingerprinting & Scoring",
    status: "Active",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0007-entropy-fingerprinting.md",
  },
  {
    number: "0201",
    title: "Fleet Detection Immune System",
    status: "Deployed",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0201-fleet-immune-system.md",
  },
  {
    number: "0202",
    title: "Fail-Closed Producer Enrollment Gate",
    status: "Draft",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0202-fail-closed-producer-enrollment.md",
  },
  {
    number: "200",
    title: "Round-Robin 1-CPU-1-Vote PoA",
    status: "Active",
    source: "README legacy entry",
    href: "https://github.com/Scottcjn/Rustchain",
  },
  {
    number: "300",
    title: "Post-Quantum Signature Migration",
    status: "Draft",
    source: "This repository",
    href: "RIP-300-post-quantum-signatures.md",
  },
  {
    number: "0301",
    title: "Tip Credits + Atlas Land Transfer Economy",
    status: "Draft / Request for Comments",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0301-tip-credits-atlas-economy.md",
  },
  {
    number: "302",
    title: "Agent Economy Protocol",
    status: "Active",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-302-agent-economy.md",
  },
  {
    number: "302-test",
    title: "Reproducible Agent-to-Agent Transaction Test Challenge",
    status: "Draft",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-302-agent-to-agent-test-challenge.md",
  },
  {
    number: "0304",
    title: "Retro Console Mining via Pico Serial Bridge",
    status: "Draft",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0304-retro-console-mining.md",
  },
  {
    number: "0305-A",
    title: "Solana SPL Token Deployment for wRTC Bridge",
    status: "Draft",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0305-solana-spl-token-deployment.md",
  },
  {
    number: "0305-C",
    title: "Bridge API + Lock Ledger",
    status: "Draft",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0305-bridge-lock-ledger.md",
  },
  {
    number: "0305-D",
    title: "Reward Claim System & Eligibility Flow",
    status: "Draft",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0305-reward-claim-system.md",
  },
  {
    number: "0306",
    title: "SophiaCore Attestation Inspector",
    status: "Draft",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0306-sophia-attestation-inspector.md",
  },
  {
    number: "0308",
    title: "Proof of Physical AI (PPA)",
    status: "Draft",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0308-proof-of-physical-ai.md",
  },
  {
    number: "0310",
    title: "Proof of Provenance (PoP)",
    status: "Draft",
    source: "RustChain canonical docs",
    href: "https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0310-proof-of-provenance.md",
  },
];

const searchInput = document.getElementById("rip-search");
const statusSelect = document.getElementById("rip-status");
const resultsBody = document.getElementById("rip-results");
const resultCount = document.getElementById("rip-count");
const emptyState = document.getElementById("rip-empty");

function normalize(value) {
  return value.toLowerCase().trim();
}

function searchableText(rip) {
  return normalize([
    rip.number,
    rip.title,
    rip.status,
    rip.source,
  ].join(" "));
}

function createTextCell(label, text) {
  const cell = document.createElement("td");
  cell.dataset.label = label;
  cell.textContent = text;
  return cell;
}

function createRipCell(rip) {
  const cell = document.createElement("td");
  cell.dataset.label = "RIP";
  const link = document.createElement("a");
  link.href = rip.href;
  link.textContent = `RIP-${rip.number}`;
  cell.appendChild(link);
  return cell;
}

function createStatusCell(status) {
  const cell = document.createElement("td");
  cell.dataset.label = "Status";
  const badge = document.createElement("span");
  badge.className = "status";
  badge.textContent = status;
  cell.appendChild(badge);
  return cell;
}

function renderRows(rips) {
  resultsBody.replaceChildren();

  for (const rip of rips) {
    const row = document.createElement("tr");
    row.append(
      createRipCell(rip),
      createTextCell("Title", rip.title),
      createStatusCell(rip.status),
      createTextCell("Source", rip.source),
    );
    resultsBody.appendChild(row);
  }

  resultCount.textContent = `${rips.length} of ${RIP_INDEX.length} RIPs shown`;
  emptyState.hidden = rips.length !== 0;
}

function applyFilters() {
  const query = normalize(searchInput.value);
  const status = statusSelect.value;

  const filtered = RIP_INDEX.filter((rip) => {
    const matchesQuery = !query || searchableText(rip).includes(query);
    const matchesStatus = status === "all" || rip.status === status;
    return matchesQuery && matchesStatus;
  });

  renderRows(filtered);
}

function populateStatusOptions() {
  const statuses = [...new Set(RIP_INDEX.map((rip) => rip.status))].sort();
  for (const status of statuses) {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    statusSelect.appendChild(option);
  }
}

populateStatusOptions();
searchInput.addEventListener("input", applyFilters);
statusSelect.addEventListener("change", applyFilters);
applyFilters();

