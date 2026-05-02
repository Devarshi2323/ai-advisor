import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const agents = [
  { key: "orchestrator", label: "🧠 Orchestrator", desc: "Breaking down your business problem..." },
  { key: "analyst", label: "📊 Analyst", desc: "Analyzing pain points and opportunities..." },
  { key: "report", label: "📝 Report Writer", desc: "Writing your modernization roadmap..." },
  { key: "final", label: "✅ Critic", desc: "Polishing the final report..." },
];

const BACKEND_URL = "https://ai-advisor-production-6f7f.up.railway.app";

export default function App() {
  const [problem, setProblem] = useState("");
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState({});
  const [activeAgent, setActiveAgent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    if (!results.final) return;
    const userMessage = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          report_context: results.final,
        }),
      });
      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
  };

  const analyze = async () => {
    if (!problem.trim()) return;
    setStatus("loading");
    setResults({});
    setActiveAgent(0);
    setChatMessages([]);

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem }),
      });
      const data = await response.json();

      for (let i = 0; i < agents.length; i++) {
        setActiveAgent(i);
        await new Promise((r) => setTimeout(r, 500));
        setResults((prev) => ({ ...prev, [agents[i].key]: data[agents[i].key] }));
      }

      setResults((prev) => ({ ...prev, s3_file: data.s3_file }));
      setActiveAgent(null);
      setStatus("done");
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🤖 AI Business Advisor</h1>
        <p style={styles.subtitle}>
          Powered by Multi-Agent AI — Describe your business problem and get a full modernization roadmap
        </p>

        <textarea
          style={styles.textarea}
          placeholder="Example: I run a trucking company in Ontario with 15 drivers. My invoicing is manual and I have no visibility into delivery status. What should I modernize first?"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={5}
        />

        <button
          style={{ ...styles.button, opacity: status === "loading" ? 0.7 : 1 }}
          onClick={analyze}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Agents Working..." : "Analyze My Business"}
        </button>

        {(status === "loading" || status === "done") && (
          <div style={styles.agentContainer}>
            <h2 style={styles.agentTitle}>Agent Pipeline</h2>
            {agents.map((agent, index) => (
              <div key={agent.key} style={styles.agentRow}>
                <div style={{
                  ...styles.agentStatus,
                  background: results[agent.key] ? "#22c55e" : activeAgent === index ? "#f59e0b" : "#334155",
                }}>
                  {results[agent.key] ? "✓" : activeAgent === index ? "..." : "○"}
                </div>
                <div>
                  <div style={styles.agentLabel}>{agent.label}</div>
                  <div style={styles.agentDesc}>
                    {results[agent.key] ? "Complete" : activeAgent === index ? agent.desc : "Waiting..."}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {status === "done" && results.final && (
          <div style={styles.report}>
            <h2 style={styles.reportTitle}>📋 Final Report</h2>
            {results.s3_file && (
              <p style={{ color: "#22c55e", fontSize: "0.85rem", marginBottom: "1rem" }}>
                ✅ Report saved to AWS S3: {results.s3_file}
              </p>
            )}
            <div style={{ color: "#cbd5e1" }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{results.final}</ReactMarkdown>
            </div>
          </div>
        )}

        {status === "error" && (
          <p style={{ color: "#ef4444", marginTop: "1rem" }}>
            Something went wrong. Make sure your backend is running.
          </p>
        )}

        {status === "done" && results.final && (
          <div style={styles.chatContainer}>
            <h2 style={styles.agentTitle}>💬 Ask a Follow-up Question</h2>

            <div style={styles.chatMessages}>
              {chatMessages.map((msg, index) => (
                <div key={index} style={{
                  ...styles.chatBubble,
                  background: msg.role === "user" ? "#3b82f6" : "#1e3a5f",
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                }}>
                  {msg.role === "user" ? msg.content : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>}
                </div>
              ))}
            </div>

            <div style={styles.chatInputRow}>
              <input
                style={styles.chatInput}
                placeholder="Ask anything about the report..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
              />
              <button style={styles.chatButton} onClick={sendChat}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "2rem",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: "#1e293b",
    borderRadius: "16px",
    padding: "2.5rem",
    maxWidth: "800px",
    width: "100%",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    overflowY: "auto",
    maxHeight: "90vh",
  },
  title: {
    color: "#f8fafc",
    fontSize: "2rem",
    margin: "0 0 0.5rem 0",
  },
  subtitle: {
    color: "#94a3b8",
    margin: "0 0 1.5rem 0",
    lineHeight: "1.6",
  },
  textarea: {
    width: "100%",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1rem",
    color: "#f8fafc",
    fontSize: "0.95rem",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    marginTop: "1rem",
    width: "100%",
    padding: "1rem",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  agentContainer: {
    marginTop: "2rem",
    background: "#0f172a",
    borderRadius: "12px",
    padding: "1.5rem",
  },
  agentTitle: {
    color: "#f8fafc",
    margin: "0 0 1rem 0",
    fontSize: "1.1rem",
  },
  agentRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem 0",
    borderBottom: "1px solid #1e293b",
  },
  agentStatus: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "bold",
    flexShrink: 0,
    transition: "background 0.3s",
  },
  agentLabel: {
    color: "#f8fafc",
    fontWeight: "600",
  },
  agentDesc: {
    color: "#64748b",
    fontSize: "0.85rem",
  },
  report: {
    marginTop: "2rem",
    background: "#0f172a",
    borderRadius: "12px",
    padding: "1.5rem",
    color: "#cbd5e1",
  },
  reportTitle: {
    color: "#f8fafc",
    margin: "0 0 1rem 0",
  },
  chatContainer: {
    marginTop: "2rem",
    background: "#0f172a",
    borderRadius: "12px",
    padding: "1.5rem",
  },
  chatMessages: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "1rem",
    maxHeight: "300px",
    overflowY: "auto",
  },
  chatBubble: {
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    color: "#f8fafc",
    fontSize: "0.9rem",
    lineHeight: "1.6",
    maxWidth: "80%",
  },
  chatInputRow: {
    display: "flex",
    gap: "0.75rem",
  },
  chatInput: {
    flex: 1,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "#f8fafc",
    fontSize: "0.95rem",
    outline: "none",
  },
  chatButton: {
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
};