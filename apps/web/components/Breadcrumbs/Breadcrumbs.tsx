'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { routeTree, type RouteNode } from '@/config/routeTree'

interface BreadcrumbDropdownProps {
  node: RouteNode
  currentPath: string[]
  currentSegment: string
  onClose: () => void
  dynamicValues: Record<string, string>
}

function BreadcrumbDropdown({ node, currentPath, currentSegment, onClose, dynamicValues }: BreadcrumbDropdownProps) {
  const pathIndex = currentPath.indexOf(currentSegment)
  
  console.log('BreadcrumbDropdown Debug:', {
    currentPath,
    currentSegment,
    pathIndex,
    nodeName: node.name,
    isDynamic: node.isDynamic
  })
  
  // Build the path by traversing from root for each segment
  let currentNode: RouteNode = routeTree
  const segments: string[] = []
  
  for (let i = 0; i <= pathIndex; i++) {
    const segment = currentPath[i]
    console.log(`Processing segment[${i}]:`, {
      segment,
      currentNodeChildren: Object.keys(currentNode.children)
    })
    
    const nextNode = Object.values(currentNode.children).find(child => {
      const matches = child.name === segment || 
        (child.isDynamic && !child.name.startsWith('...'))
      console.log(`Checking child:`, {
        childName: child.name,
        segment,
        isDynamic: child.isDynamic,
        matches
      })
      return matches
    })
    
    if (nextNode) {
      currentNode = nextNode as RouteNode
      const segmentToUse = nextNode.isDynamic ? segment : nextNode.name
      console.log('Found node:', {
        nodeName: nextNode.name,
        isDynamic: nextNode.isDynamic,
        segmentToUse
      })
      segments.push(segmentToUse)
    } else {
      console.log('No matching node found, using segment:', segment)
      segments.push(segment)
    }
  }

  const basePath = '/' + segments.join('/')
  console.log('Final basePath:', basePath)

  return (
    <div className="absolute top-full left-0 mt-1 bg-white/90 rounded-md shadow-lg py-1 z-50">
      <Link
        href={basePath}
        className="block px-4 py-2 hover:bg-black/10"
        onClick={onClose}
      >
        {node.isDynamic ? dynamicValues[node.name] || node.name : node.name}
      </Link>
      
      {Object.keys(node.children).length > 0 && (
        <div className="border-t border-gray-200 my-1"></div>
      )}

      {Object.entries(node.children)
        .filter(([key]) => !key.startsWith('(') && !key.endsWith(')'))
        .filter(([_, childNode]) => !childNode.name.startsWith('...'))
        .filter(([_, childNode]) => !childNode.isDynamic || dynamicValues[childNode.name])
        .map(([key, childNode]) => {
          // For child links, use the actual route name
          const childSegment = childNode.isDynamic ? childNode.name : key
          let href = childNode.path || `/${childSegment}`
          
          // Replace any dynamic segments in the path with their values
          if (href) {
            Object.entries(dynamicValues).forEach(([paramName, value]) => {
              href = href.replace(`[${paramName}]`, value)
            })
          }

          console.log('Dropdown child link:', {
            key,
            childSegment,
            href,
            path: childNode.path,
            isDynamic: childNode.isDynamic,
            dynamicValues
          })
          
          // Skip rendering links with unresolved dynamic segments
          if (href.includes('[') && href.includes(']')) {
            return null
          }

          return (
            <Link
              key={key}
              href={href}
              className="block px-4 py-2 hover:bg-black/10"
              onClick={onClose}
            >
              {childNode.isDynamic ? dynamicValues[childNode.name] : childNode.name}
            </Link>
          )
      }).filter(Boolean)}
    </div>
  )
}

interface BreadcrumbItemProps {
  segment: string
  node: RouteNode
  currentPath: string[]
  isLast: boolean
  dynamicValues: Record<string, string>
}

function BreadcrumbItem({ segment, node, currentPath, isLast, dynamicValues }: BreadcrumbItemProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const children = Object.entries(node.children)
    .filter(([key]) => !key.startsWith('(') && !key.endsWith(')'))
  const hasChildren = children.length > 0
  const hasSingleChild = children.length === 1
  const displayName = node.isDynamic ? dynamicValues[node.name] || `[${node.name}]` : segment
  // Format displayName to be more readable
  const formattedDisplayName = node.isDynamic 
    ? `[${node.name.split(/(?=[A-Z])/).join(' ')}]`  // Split on capital letters for camelCase
    : node.name.split(/(?=[A-Z])/).join(' ') // Split camelCase into spaces

  console.log('BreadcrumbItem:', {
    segment,
    nodeName: node.name,
    isDynamic: node.isDynamic,
    hasChildren,
    hasSingleChild,
    currentPath
  })

  // Keep full path including startSegment for links, but don't add child
  const segmentIndex = currentPath.indexOf(segment)
  
  console.log('URL Construction Debug:', {
    segment,
    currentPath,
    segmentIndex,
    pathSlice: currentPath.slice(0, segmentIndex + 1),
    joinedPath: currentPath.slice(0, segmentIndex + 1).join('/'),
    startsWithSlash: currentPath.slice(0, segmentIndex + 1).join('/').startsWith('/')
  })
  
  const singleChildHref = hasSingleChild ? 
    (currentPath.slice(0, segmentIndex + 1).join('/').startsWith('/') ? '' : '/') + 
    currentPath.slice(0, segmentIndex + 1).join('/') : 
    undefined

  console.log('Final URL:', {
    singleChildHref,
    hasSingleChild
  })

  // if it doesn't start with http or /

  const handleDropdownClick = () => {
    console.log('Dropdown clicked:', {
      segment,
      currentPath,
      segmentIndex,
      node
    })
    setDropdownOpen(!dropdownOpen)
  }

  return (
    <li className="flex items-center">
      <div className="relative">
        {hasChildren ? (
          hasSingleChild ? (
            // Single child case - render as link
            <Link 
              href={singleChildHref!}
              className="flex items-center hover:opacity-70"
            >
              {displayName}
            </Link>
          ) : (
            // Multiple children case - render as dropdown
            <button
              className="flex items-center hover:opacity-70"
              onClick={handleDropdownClick}
            >
              {displayName}
              <svg
                className="w-4 h-4 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )
        ) : (
          <span className={isLast ? 'opacity-70' : ''}>
            {displayName}
          </span>
        )}
        {dropdownOpen && hasChildren && !hasSingleChild && (
          <BreadcrumbDropdown
            node={node}
            currentPath={currentPath}
            currentSegment={segment}
            onClose={() => setDropdownOpen(false)}
            dynamicValues={dynamicValues}
          />
        )}
      </div>
      {!isLast && <span className="mx-2">/</span>}
    </li>
  )
}

interface BreadcrumbsProps {
  dynamicValues?: Record<string, string>
  startSegment?: string
}

export function Breadcrumbs({ dynamicValues = {}, startSegment }: BreadcrumbsProps) {
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false)
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // Keep startSegment in currentPath for links, but filter for display
  const startIndex = startSegment ? pathSegments.indexOf(startSegment) : -1
  const displaySegments = startIndex !== -1 ? 
    pathSegments.slice(startIndex + 1) : 
    pathSegments

  // Find the starting node based on startSegment
  let startNode: RouteNode = routeTree
  if (startSegment) {
    for (const segment of pathSegments.slice(0, startIndex + 1)) {
      const node = Object.values(startNode.children).find(child => 
        child.name === segment ||
        (child.isDynamic && !child.name.startsWith('...'))
      )
      if (node) startNode = node
    }
  }

  let currentNode: RouteNode = startNode
  const breadcrumbs = displaySegments.map((segment, index) => {
    const node = Object.values(currentNode.children).find(child => 
      child.name === segment ||
      (child.isDynamic && !child.name.startsWith('...'))
    )
    
    if (!node) return null
    currentNode = node as typeof currentNode
    
    return {
      segment,
      node,
      isLast: index === displaySegments.length - 1
    }
  }).filter(Boolean)

  return (
    <nav>
      <ol className="flex flex-wrap items-center">
        <li className="flex items-center">
          {startSegment ? (
            <div className="relative">
              <button
                className="hover:opacity-70 flex items-center"
                onClick={() => setHomeDropdownOpen(!homeDropdownOpen)}
              >
                🏠
                <svg
                  className="w-4 h-4 ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {homeDropdownOpen && (
                <BreadcrumbDropdown
                  node={startNode}
                  currentPath={pathSegments.slice(0, startIndex + 1)}
                  currentSegment={startSegment}
                  onClose={() => setHomeDropdownOpen(false)}
                  dynamicValues={dynamicValues}
                />
              )}
            </div>
          ) : (
            <Link href="/" className="hover:opacity-70">
              🏠
            </Link>
          )}
          {breadcrumbs.length > 0 && <span className="mx-2">/</span>}
        </li>
        {breadcrumbs.map((item, index) => (
          <BreadcrumbItem
            key={index}
            segment={item!.segment}
            node={item!.node}
            currentPath={pathSegments}
            isLast={item!.isLast}
            dynamicValues={dynamicValues}
          />
        ))}
      </ol>
    </nav>
  )
} 