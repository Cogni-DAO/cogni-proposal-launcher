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
    
    
    // Upload via our API endpoint
    const uploadResponse = await fetch('/api/ipfs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
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
  } catch (e) {
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
    <div style={{ backgroundColor: '#d4edda', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #c3e6cb' }}>
      <p><strong>📝 Proposal Title:</strong></p>
      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#155724' }}>
        {title}
      </p>
      <p style={{ fontSize: '14px', marginTop: '0.5rem', color: '#155724' }}>
        {summary}
      </p>
      <p style={{ fontSize: '12px', marginTop: '0.5rem', color: '#666' }}>
        <em>Title and summary will appear in description field for Aragon App compatibility</em>
      </p>
    </div>
  )
}