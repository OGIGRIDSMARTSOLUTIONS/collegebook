const { customAlphabet } = require('nanoid');

// Not the DB primary key — a separate, human-readable public identifier
// used in logs, support tooling and URLs, per §3 of the architecture doc.
const numeric = customAlphabet('0123456789', 6);

function generateCode(prefix) {
  return `${prefix}_${numeric()}`;
}

module.exports = { generateCode };
