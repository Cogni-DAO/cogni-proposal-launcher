// middleware.ts at repo root
import { NextResponse, NextRequest } from 'next/server'
import { validate } from './lib/deeplink'
import { joinSpec, mergeSpec, proposeFaucetSpec } from './lib/deeplinkSpecs'

export function middleware(req: NextRequest) {
  console.log('[MW]', req.nextUrl.pathname, req.nextUrl.search)
  
  const url = req.nextUrl
  const params = Object.fromEntries(url.searchParams)
  
  if (url.pathname === '/join') {
    if (!validate(params, joinSpec)) {
      return new NextResponse('Invalid parameters for /join', { status: 400 })
    }
  }
  
  if (url.pathname === '/merge-change') {
    if (!validate(params, mergeSpec)) {
      return new NextResponse('Invalid parameters for /merge-change', { status: 400 })
    }
  }
  
  if (url.pathname === '/propose-faucet') {
    if (!validate(params, proposeFaucetSpec)) {
      return new NextResponse('Invalid parameters for /propose-faucet', { status: 400 })
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*']
}