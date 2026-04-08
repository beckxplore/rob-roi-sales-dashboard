"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Search, Upload, Folder, Filter } from 'lucide-react'

interface Asset {
  id: string
  name: string
  type: string
  category: string
  url: string
  tags: string
  description?: string
  lead?: { id: string; companyName: string }
  createdAt: string
}

const typeColors: Record<string, string> = {
  PRESENTATION: 'bg-blue-500/20 text-blue-400',
  PROPOSAL: 'bg-violet-500/20 text-violet-400',
  CONTRACT: 'bg-emerald-500/20 text-emerald-400',
  BRIEF: 'bg-amber-500/20 text-amber-400',
  TEMPLATE: 'bg-cyan-500/20 text-cyan-400',
  OTHER: 'bg-gray-500/20 text-gray-400',
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const url = new URL('/api/assets', window.location.origin)
      if (search) url.searchParams.set('q', search)
      if (filterType) url.searchParams.set('type', filterType)
      
      const res = await fetch(url.toString())
      const data = await res.json()
      setAssets(data.assets || [])
    } catch (err) {
      console.error('Failed to fetch assets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAssets()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Folder className="w-8 h-8 text-violet-400" />
            Asset Library
          </h1>
          <p className="text-muted-foreground mt-1">Searchable repository of presentations, proposals, and contracts</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium">
          <Upload className="w-4 h-4" />
          Upload Asset
        </button>
      </div>

      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, description, or tags..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); fetchAssets() }}
          className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Types</option>
          <option value="PRESENTATION">Presentation</option>
          <option value="PROPOSAL">Proposal</option>
          <option value="CONTRACT">Contract</option>
          <option value="BRIEF">Brief</option>
          <option value="TEMPLATE">Template</option>
          <option value="OTHER">Other</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium">
          Search
        </button>
      </form>

      {/* Assets Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No assets found</p>
          <p className="text-sm text-muted-foreground mt-1">Upload your first asset to get started</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <a
              key={asset.id}
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[asset.type] || typeColors.OTHER}`}>
                  {asset.type}
                </span>
              </div>
              
              <h3 className="font-medium group-hover:text-primary transition-colors">{asset.name}</h3>
              
              {asset.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{asset.description}</p>
              )}
              
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>{formatDate(asset.createdAt)}</span>
                {asset.lead && (
                  <Link href={`/leads/${asset.lead.id}`} className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                    {asset.lead.companyName}
                  </Link>
                )}
              </div>
              
              {asset.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {JSON.parse(asset.tags).slice(0, 3).map((tag: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 bg-secondary rounded text-xs">{tag}</span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
