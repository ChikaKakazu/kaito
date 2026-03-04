import { useState } from "react";
import { useJiraSpaces } from "../../hooks/useJiraSpaces";

export function JiraSettings({ onBack }: { onBack: () => void }) {
  const { spaces, loading, addSpace, removeSpace } = useJiraSpaces();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [email, setEmail] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !baseUrl.trim() || !projectKey.trim() || !email.trim() || !accessToken.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addSpace({
        name: name.trim(),
        base_url: baseUrl.trim().replace(/\/+$/, ""),
        email: email.trim(),
        project_key: projectKey.trim().toUpperCase(),
        access_token: accessToken.trim(),
      });
      setName("");
      setBaseUrl("");
      setEmail("");
      setProjectKey("");
      setAccessToken("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold">Jira Spaces</h1>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Space
        </button>

        {showForm && (
          <div className="mb-6 bg-gray-800 rounded-xl p-4 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Space name (e.g. My Project)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="Base URL (e.g. https://yourteam.atlassian.net)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (e.g. you@example.com)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value)}
              placeholder="Project key (e.g. PROJ)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Access token"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={submitting || !name.trim() || !baseUrl.trim() || !email.trim() || !projectKey.trim() || !accessToken.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : spaces.length === 0 ? (
          <p className="text-gray-400">
            No Jira spaces configured. Add one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="bg-gray-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold">{space.name}</h3>
                  <p className="text-sm text-gray-400">
                    {space.base_url} &middot; {space.project_key}
                  </p>
                  {space.last_fetched_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last synced: {new Date(space.last_fetched_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeSpace(space.id)}
                  className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
