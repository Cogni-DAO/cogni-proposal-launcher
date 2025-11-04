import { stringToHex } from 'viem'

export interface ProposalMetadataInput {
  title: string
  summary: string  
  description: string
  resources?: Array<{name: string, url: string}>
}

export interface ProposalMetadataResult {
  metadataBytes: string
  title: string
  summary: string
}

export async function createProposalMetadata(input: ProposalMetadataInput): Promise<ProposalMetadataResult> {
  try {
    // Format: title, summary, then detailed description
    const combinedDescription = `${input.title}

${input.summary}

${input.description}`

    const officialMetadata = {
      title: input.title,
      summary: input.summary,
      description: combinedDescription,
      resources: input.resources || []
    }
    
    
    // TODO: this seems like a terrible function format.

    // Upload via our API endpoint (server handles all authentication)
    const uploadResponse = await fetch('/api/ipfs', {
      method: 'POST',
      headers: { 
        'content-type': 'application/json'
      },
      body: JSON.stringify(officialMetadata)
    })

    if (uploadResponse.ok) {
      const { cid } = await uploadResponse.json()
      const ipfsUri = `ipfs://${cid}`
      
      // Encode IPFS URI as bytes for Aragon
      const metadataBytes = stringToHex(ipfsUri)
      
      return { 
        metadataBytes, 
        title: input.title, 
        summary: input.summary 
      }
    } else {
      return { 
        metadataBytes: '0x', 
        title: input.title, 
        summary: input.summary 
      }
    }
  } catch {
    return { 
      metadataBytes: '0x', 
      title: input.title, 
      summary: input.summary 
    }
  }
}

interface ProposalPreviewProps {
  title: string
  summary: string
}

export function ProposalPreview({ title, summary }: ProposalPreviewProps) {
  return (
    <div className="bg-secondary border border-border rounded-lg p-4 mb-4">
      <p className="text-foreground font-semibold mb-3">📝 Proposal Title:</p>
      <p className="text-lg font-bold text-foreground mb-2">
        {title}
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        {summary}
      </p>
      <p className="text-xs text-muted-foreground italic">
        Title and summary will appear in description field for Aragon App compatibility
      </p>
    </div>
  )
}