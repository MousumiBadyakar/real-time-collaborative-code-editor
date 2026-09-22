import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from "react"
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"
import { io } from "socket.io-client"

const languages = {
  javascript: { name: "JavaScript", extension: "js", id: 63 },
  python: { name: "Python", extension: "py", id: 71 },
  java: { name: "Java", extension: "java", id: 62 },
  cpp: { name: "C++", extension: "cpp", id: 54 },
  c: { name: "C", extension: "c", id: 50 },
  go: { name: "Go", extension: "go", id: 60 }
}

function App() {
  const socket = useMemo(() => io("/", { autoConnect: false }), [])
  const editorRef = useRef(null)
  const [editor, setEditor] = useState(null)
  const [username, setUsername] = useState(() => new URLSearchParams(window.location.search).get("username") || "")
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [output, setOutput] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  const currentLanguage = languages[language]
  const fileName = `main.${currentLanguage.extension}`

  const handleMount = (editor) => {
    editorRef.current = editor
    setEditor(editor)
  }

  const handleJoin = (e) => {
    e.preventDefault()
    const name = e.target.username.value.trim()
    if (!name) return
    setUsername(name)
    window.history.pushState({}, "", "?username=" + encodeURIComponent(name))
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!message.trim()) return

    socket.emit("chat:message", {
      username,
      text: message.trim(),
      timestamp: Date.now()
    })

    setMessage("")
  }

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value
    setLanguage(newLanguage)
    setOutput("")
    socket.emit("editor:language", newLanguage)
  }

  const runCode = async () => {
    if (!editorRef.current) return

    const code = editorRef.current.getValue()

    if (!code.trim()) {
      setOutput("No code to run.")
      return
    }

    setIsRunning(true)
    setOutput("Running code...")

    try {
      const response = await fetch(
        "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            language_id: currentLanguage.id,
            source_code: code
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Execution service returned ${response.status}`)
      }

      const result = await response.json()
      const stdout = result.stdout || ""
      const stderr = result.stderr || ""
      const compileOutput = result.compile_output || ""

      if (stdout) {
        setOutput(stdout)
      } else if (stderr) {
        setOutput(stderr)
      } else if (compileOutput) {
        setOutput(compileOutput)
      } else if (result.status?.description) {
        setOutput(result.status.description)
      } else {
        setOutput("Program finished with no output.")
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => {
    const handleLanguageUpdate = (newLanguage) => {
      if (languages[newLanguage]) {
        setLanguage(newLanguage)
        setOutput("")
      }
    }

    const handleChatMessage = (newMessage) => {
      setMessages((prev) => [...prev, newMessage])
    }

    socket.on("editor:language", handleLanguageUpdate)
    socket.on("chat:message", handleChatMessage)
    socket.connect()

    return () => {
      socket.off("editor:language", handleLanguageUpdate)
      socket.off("chat:message", handleChatMessage)
      socket.disconnect()
    }
  }, [socket])

  useEffect(() => {
    if (!username || !editor) return

    const provider = new SocketIOProvider("/", "monaco", ydoc, {
      autoConnect: true
    })

    const monacoBinding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    )

    provider.awareness.setLocalStateField("user", { username })

    const handleAwarenessChange = () => {
      const states = Array.from(provider.awareness.getStates().values())

      const activeUsers = states
        .filter((state) => state.user?.username)
        .map((state) => state.user)

      setUsers(activeUsers)
    }

    provider.awareness.on("change", handleAwarenessChange)
    handleAwarenessChange()

    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField("user", null)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      monacoBinding.destroy()
      provider.awareness.off("change", handleAwarenessChange)
      provider.awareness.setLocalStateField("user", null)
      provider.disconnect()
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [username, editor, ydoc, yText])

  if (!username) {
    return (
      <main className="h-screen w-full bg-gray-950 flex items-center justify-center p-4">
        <form onSubmit={handleJoin} className="flex flex-col gap-4 w-80">
          <div className="text-center">
            <div className="text-5xl mb-4">{"</>"}</div>
            <h1 className="text-3xl text-white font-bold">CodeCollab</h1>
            <p className="text-gray-400 mt-2">Collaborative Coding Workspace</p>
          </div>
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            className="p-3 rounded-lg bg-gray-800 text-white outline-none border border-gray-700 focus:border-amber-300"
          />
          <button
            type="submit"
            className="p-3 rounded-lg bg-amber-50 text-gray-950 font-bold hover:bg-amber-200"
          >
            Join Workspace
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="h-screen w-full bg-gray-950 text-white p-4 flex flex-col gap-4 overflow-hidden">
      <header className="h-16 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-gray-950 flex items-center justify-center font-bold text-lg">
            {"</>"}
          </div>
          <div>
            <h1 className="font-bold text-lg">CodeCollab</h1>
            <p className="text-gray-500 text-sm">Collaborative Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-gray-950 border border-gray-800 text-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 mr-2"></span>
            Connected
          </div>
          <div className="px-4 py-2 rounded-lg bg-gray-800 text-sm">
            You: <span className="text-amber-300 font-bold">{username}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex gap-4">
        <aside className="w-64 shrink-0 bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Participants</h2>
                <p className="text-gray-500 text-sm mt-1">{users.length} online</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                👥
              </div>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {users.map((user, index) => (
              <div
                key={`${user.username}-${index}`}
                className={`p-3 rounded-lg mb-2 flex items-center gap-3 ${
                  user.username === username ? "bg-gray-800" : ""
                }`}
              >
                <div className="relative w-11 h-11 rounded-full bg-amber-50 text-gray-950 flex items-center justify-center font-bold">
                  {user.username.charAt(0).toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-gray-900"></span>
                </div>
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-green-400 text-sm">Online</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-800 text-center text-gray-500 text-sm">
            Real-time collaboration
          </div>
        </aside>

        <section className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex-1 min-h-0 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            <div className="h-14 px-5 border-b border-gray-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-200">{fileName}</span>
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  className="bg-gray-800 text-gray-200 px-3 py-1.5 rounded-md border border-gray-700 outline-none text-sm"
                >
                  {Object.entries(languages).map(([key, lang]) => (
                    <option key={key} value={key}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={runCode}
                disabled={isRunning}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-50 text-gray-950 font-bold border border-amber-100 hover:bg-amber-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm">{isRunning ? "Running..." : "▶"}</span>
                <span>{isRunning ? "Running" : "Run Code"}</span>
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                onMount={handleMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  automaticLayout: true
                }}
              />
            </div>
          </div>

          <div className="h-48 shrink-0 bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden">
            <div className="h-12 px-5 border-b border-gray-800 flex items-center justify-between shrink-0">
              <h2 className="font-bold">Output</h2>
              <span className="text-gray-500 text-sm">
                {isRunning ? "Executing..." : "Console"}
              </span>
            </div>
            <pre className="flex-1 overflow-y-auto p-4 text-sm text-gray-300 whitespace-pre-wrap">
              {output || "Run your code to see the output here."}
            </pre>
          </div>

          <div className="h-64 shrink-0 bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden">
            <div className="h-12 px-5 border-b border-gray-800 flex items-center justify-between shrink-0">
              <h2 className="font-bold">
                Team Chat{" "}
                <span className="text-gray-500 font-normal">
                  • {messages.length} messages
                </span>
              </h2>
              <span className="text-gray-500 text-sm">Real-time</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="text-3xl mb-3">💬</div>
                  <p>Start a conversation with your team</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-amber-50 text-gray-950 flex items-center justify-center font-bold">
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-300 font-bold">
                          {msg.username}
                        </span>
                        <span className="text-gray-600 text-xs">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-gray-800 flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message your team..."
                className="flex-1 p-3 rounded-lg bg-gray-800 text-white outline-none border border-gray-700 focus:border-amber-300"
              />
              <button
                type="submit"
                className="px-6 rounded-lg bg-amber-50 text-gray-950 font-bold hover:bg-amber-200"
              >
                Send
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App