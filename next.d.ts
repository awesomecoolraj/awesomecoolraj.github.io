declare module 'next/link' {
  import React from 'react'
  import { LinkProps as NextLinkProps } from 'next/dist/client/link'

  type LinkProps = NextLinkProps & {
    children: React.ReactNode
  }

  export default function Link(props: LinkProps): JSX.Element
}