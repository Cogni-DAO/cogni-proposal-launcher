import type { NextApiRequest, NextApiResponse } from 'next'

// Official Aragon metadata structure (from lines 175-180)
interface MetadataUploadBody {
  title: string
  summary: string
  description: string
  resources?: any[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Same-origin only: enforce Host header always
  const host = req.headers.host
  const allowed = [process.env.APP_HOST, `www.${process.env.APP_HOST}`]
  if (!allowed.includes(host)) return res.status(403).json({ error: 'forbidden' })

  try {
    // Validate request body
    const metadata: MetadataUploadBody = req.body
    if (!metadata.title || !metadata.summary) {
      return res.status(400).json({ error: 'title and summary are required' })
    }

    // Size cap - limit to 10KB JSON
    const jsonSize = JSON.stringify(metadata).length
    if (jsonSize > 10240) {
      return res.status(400).json({ error: 'metadata too large (max 10KB)' })
    }

    // Environment variable for Pinata
    const PINATA_API_JWT = process.env.PINATA_API_JWT
    if (!PINATA_API_JWT) {
      return res.status(500).json({ error: 'PINATA_API_JWT not configured' })
    }

    // Create JSON metadata using OFFICIAL Aragon structure (lines 175-180)
    const metadataJson = {
      title: metadata.title,
      summary: metadata.summary,
      description: metadata.description,
      resources: metadata.resources || []
    }


    // Upload to Pinata IPFS
    const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_API_JWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pinataContent: metadataJson,
        pinataOptions: { cidVersion: 1 }
      })
    })

    if (!uploadResponse.ok) {
      return res.status(502).json({ error: 'pin failed' })
    }

    const result = await uploadResponse.json()
    const cid = result.IpfsHash

    if (!cid) {
      throw new Error('No CID returned from Pinata')
    }


    // No CORS: endpoint not callable cross-origin

    return res.status(200).json({ 
      cid,
      ipfsUri: `ipfs://${cid}`,
      size: jsonSize,
      gateway: `https://gateway.pinata.cloud/ipfs/${cid}`
    })

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to upload to IPFS',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}