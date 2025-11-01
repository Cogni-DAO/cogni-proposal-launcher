import { NextApiRequest, NextApiResponse } from 'next'

interface MetadataQuery {
  repo?: string
  pr?: string
  action?: string
  target?: string
  repoUrl?: string
  v?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { repo, pr, action, target = 'change', repoUrl, v = '1' } = req.query as MetadataQuery

  // Validate required parameters
  if (!pr || !action) {
    return res.status(400).send('Missing required parameters: pr and action are required')
  }

  // Validate parameter sizes
  if (pr.length > 10 || action.length > 20) {
    return res.status(400).send('Parameter size limit exceeded')
  }

  // Determine repository name
  let repoName = 'repo'
  let repoIdentifier = ''
  
  if (repo) {
    if (repo.length > 100) {
      return res.status(400).send('Repository parameter too long')
    }
    repoName = repo.split('/').pop() || repo
    repoIdentifier = repo
  } else if (repoUrl) {
    try {
      const decoded = decodeURIComponent(repoUrl)
      repoName = decoded.split('/').pop() || 'repo'
      repoIdentifier = decoded
    } catch (e) {
      repoName = repoUrl.split('/').pop() || 'repo'
      repoIdentifier = repoUrl
    }
  }

  // Generate metadata
  const metadata = {
    title: `${repoName}-${action}-PR#${pr}`,
    summary: `${action.charAt(0).toUpperCase()}${action.slice(1)} PR #${pr} in ${repoName}`,
    description: `This proposal will signal to ${action} pull request #${pr} in repository ${repoIdentifier}`,
    version: "1.0.0",
    type: "proposal",
    created: new Date().toISOString(),
    parameters: {
      repository: repoIdentifier,
      pullRequest: pr,
      action: action,
      target: target
    }
  }

  // Set response headers
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600')
  res.setHeader('X-Metadata-Version', v)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  return res.status(200).json(metadata)
}