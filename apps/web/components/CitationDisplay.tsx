'use server';

import React from 'react';
import { Database } from '@/lib/database.types';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

type Citation = Database['public']['Tables']['citations']['Row'];

interface CitationDisplayProps {
  citation: Citation | null | undefined;
}

/**
 * Renders citation details in a structured format.
 */
export const CitationDisplay: React.FC<CitationDisplayProps> = async ({ citation }) => {
  if (!citation) {
    return <p className="text-xs text-muted-foreground">Source information not available.</p>;
  }

  const {
    title,
    authors,
    journal_or_publisher,
    publication_year,
    volume,
    issue,
    pages,
    doi,
    pmid,
    url,
    type
  } = citation;

  const authorString = authors && authors.length > 0 ? authors.join(', ') : null;

  const renderLink = (href: string, text: string) => (
    <Link href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center text-xs">
      {text} <ExternalLink className="ml-1 h-3 w-3" />
    </Link>
  );

  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <p className="font-medium">Source:</p>
      {title && <p className="font-semibold">{title}</p>}
      {authorString && <p>Authors: {authorString}</p>}
      <p>
        {journal_or_publisher && <span>{journal_or_publisher}. </span>}
        {publication_year && <span>{publication_year}.</span>}
        {volume && <span> Vol {volume}</span>}
        {issue && <span>({issue})</span>}
        {pages && <span>: pp {pages}.</span>}
      </p>
      <div className="flex space-x-2">
        {doi && renderLink(`https://doi.org/${doi}`, `DOI: ${doi}`)}
        {pmid && renderLink(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`, `PMID: ${pmid}`)}
        {url && type !== 'journal_article' && type !== 'book' && renderLink(url, "Link")}
      </div>
    </div>
  );
}; 