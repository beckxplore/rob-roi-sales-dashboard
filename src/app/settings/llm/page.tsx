"use client"
import { useState } from 'react'
import { Save, TestTube, AlertCircle, CheckCircle2, Zap } from 'lucide-react'

const providers = [
  { id: 'openrouter', name: 'OpenRouter', models: ['qwen/qwen-3-32b', 'anthropic/claude-sonnet-4', 'google/gemini-2.0-flash'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'] },
  { id: 'gemini', name: 'Google Gemini', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
]

const personas = [
  { id: 'critical', name: 'Critical Agent', description: 'Ruthlessly challenges leads, questions economics, pokes holes in viability' },
  { id: 'supportive', name: 'Supportive Advisor', description: 'Encourages team, suggests optimizations, highlights wins' },
  { id: 'analytical', name: 'Analytical Analyst', description: 'Deep data analysis, metrics focus, ROI calculations' },
  { id: 'diplomatic', name: 'Diplomatic Negotiator', description: 'Soft approach, empathy-first, relationship building' },
]

export default function LLMConfigPage() {
  const [selectedProvider, setSelectedProvider] = useState('openrouter')
  const [selectedModel, setSelectedModel] = useState('qwen/qwen-3-32b')
  const [selectedPersona, setSelectedPersona] = useState('critical')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSave = () => {
    // In production, save to database/env
    localStorage.setItem('llm_config', JSON.stringify({
      provider: selectedProvider,
      model: selectedModel,
      persona: selectedPersona,
      temperature,
      maxTokens,
    }))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    // Simulate API test
    await new Promise(r => setTimeout(r, 1500))
    
    if (apiKey.length > 10) {
      setTestResult({ success: true, message: 'Connection successful! API responded correctly.' })
    } else {
      setTestResult({ success: false, message: 'Invalid API key or connection failed.' })
    }
    setTesting(false)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">LLM Configuration</h1>
        <p className="text-muted-foreground mt-1">Configure your AI provider and agent persona</p>
      </div>

      {/* Provider Selection */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          AI Provider
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelectedProvider(p.id); setSelectedModel(p.models[0]) }}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedProvider === p.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-foreground/25'
              }`}
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{p.models.length} models</div>
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Model</h2>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {providers.find(p => p.id === selectedProvider)?.models.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Agent Persona */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Agent Persona</h2>
        <div className="space-y-3">
          {personas.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPersona(p.id)}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                selectedPersona === p.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-foreground/25'
              }`}
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-muted-foreground mt-1">{p.description}</div>
            </button>
          ))}
        </div>
        {selectedPersona === 'critical' && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-amber-400 inline mr-2" />
            <span className="text-amber-400">Critical Agent mode:</span> The AI will actively challenge lead viability and question assumptions.
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Advanced Settings</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Temperature ({temperature})</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">API Key</h2>
        <div className="flex gap-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API key..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <TestTube className="w-4 h-4" />
            {testing ? 'Testing...' : 'Test'}
          </button>
        </div>
        {testResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
            testResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {testResult.message}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Configuration
        </button>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 p-4 bg-emerald-500 text-white rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5" />
          Configuration saved!
        </div>
      )}
    </div>
  )
}
