import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const Module = require("node:module");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename(
      path.join(repoRoot, request.slice(2)),
      parent,
      isMain,
      options
    );
  }

  return originalResolveFilename(request, parent, isMain, options);
};

require.extensions[".ts"] = function loadTs(module, filename) {
  const source = require("node:fs").readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });

  module._compile(transpiled.outputText, filename);
};

const { handleWebsiteCoachApiRequest } = require("../lib/web-intelligence/website-coach-api.ts");

const validBody = {
  websiteUrl: "https://example.com",
  businessType: "Founder coaching practice",
  targetAudience: "Early-stage founders",
  mainGoal: "book-calls",
};

async function runCase(name, body, getUser) {
  const response = await handleWebsiteCoachApiRequest(body, { getUser });
  return { name, response };
}

function assertError(response, status, error) {
  assert.equal(response.status, status);
  assert.deepEqual(response.body, { error });
}

function assertWebsiteCoachResultShape(response) {
  assert.equal(response.status, 200);
  assert.equal(typeof response.body.normalizedUrl, "string");
  assert.equal(typeof response.body.overallScore, "number");
  assert.ok(Array.isArray(response.body.topRecommendations));
  assert.equal(response.body.topRecommendations.length, 5);
  assert.equal(typeof response.body.messagingClarityFeedback, "string");
  assert.equal(typeof response.body.trustCredibilityFeedback, "string");
  assert.ok(Array.isArray(response.body.conversionOpportunities));
  assert.ok(Array.isArray(response.body.suggestedNextActions));
}

let authCalls = 0;
const authenticated = async () => {
  authCalls += 1;
  return { user: { id: "test-user" } };
};
const unauthenticated = async () => {
  authCalls += 1;
  return { user: null };
};
const shouldNotCallAuth = async () => {
  authCalls += 1;
  throw new Error("Auth should not be called for invalid input.");
};

authCalls = 0;
assertError(
  (await runCase("missing URL", { ...validBody, websiteUrl: "" }, shouldNotCallAuth)).response,
  400,
  "A website URL is required."
);
assert.equal(authCalls, 0);

authCalls = 0;
assertError(
  (
    await runCase(
      "invalid URL",
      { ...validBody, websiteUrl: "ftp://example.com" },
      shouldNotCallAuth
    )
  ).response,
  400,
  "Please enter a valid website URL."
);
assert.equal(authCalls, 0);

authCalls = 0;
assertError(
  (
    await runCase(
      "invalid goal",
      { ...validBody, mainGoal: "raise-capital" },
      shouldNotCallAuth
    )
  ).response,
  400,
  "Please choose a valid website goal."
);
assert.equal(authCalls, 0);

authCalls = 0;
assertError(
  (await runCase("unauthenticated", validBody, unauthenticated)).response,
  401,
  "Not authenticated."
);
assert.equal(authCalls, 1);

authCalls = 0;
assertWebsiteCoachResultShape(
  (await runCase("authenticated success", validBody, authenticated)).response
);
assert.equal(authCalls, 1);

console.log("Website Coach API verification passed.");
