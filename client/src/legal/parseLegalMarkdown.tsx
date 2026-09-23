import type { ReactNode } from 'react';

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-b-${match.index}`}>{token.slice(2, -2)}</strong>);
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        nodes.push(
          <a key={`${keyPrefix}-a-${match.index}`} href={linkMatch[2]}>
            {linkMatch[1]}
          </a>,
        );
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function isTableRow(line: string): boolean {
  return line.trimStart().startsWith('|');
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const cells = parseTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell));
}

export function parseLegalMarkdown(source: string, skipTitle = true): ReactNode[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed === '---') {
      blocks.push(<hr key={`block-${blockKey++}`} className="legal-doc-hr" />);
      i += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      if (skipTitle) {
        i += 1;
        continue;
      }
      blocks.push(
        <h1 key={`block-${blockKey++}`} className="legal-doc-h1">
          {parseInline(trimmed.slice(2), `h1-${blockKey}`)}
        </h1>,
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h2 key={`block-${blockKey++}`} className="legal-doc-h2">
          {parseInline(trimmed.slice(3), `h2-${blockKey}`)}
        </h2>,
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h3 key={`block-${blockKey++}`} className="legal-doc-h3">
          {parseInline(trimmed.slice(4), `h3-${blockKey}`)}
        </h3>,
      );
      i += 1;
      continue;
    }

    if (isTableRow(trimmed)) {
      const header = parseTableRow(trimmed);
      i += 1;
      if (i < lines.length && isTableSeparator(lines[i])) {
        i += 1;
      }
      const bodyRows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        bodyRows.push(parseTableRow(lines[i]));
        i += 1;
      }
      blocks.push(
        <div key={`block-${blockKey++}`} className="legal-doc-table-wrap">
          <table className="legal-doc-table">
            <thead>
              <tr>
                {header.map((cell, ci) => (
                  <th key={ci}>{parseInline(cell, `th-${blockKey}-${ci}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{parseInline(cell, `td-${blockKey}-${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (trimmed.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i += 1;
      }
      blocks.push(
        <ul key={`block-${blockKey++}`} className="legal-doc-list">
          {items.map((item, ii) => (
            <li key={ii}>{parseInline(item, `li-${blockKey}-${ii}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        !next ||
        next === '---' ||
        next.startsWith('#') ||
        next.startsWith('- ') ||
        isTableRow(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      i += 1;
    }

    const paragraph = paragraphLines.join(' ');
    if (paragraph.startsWith('*') && paragraph.endsWith('*') && !paragraph.startsWith('**')) {
      blocks.push(
        <p key={`block-${blockKey++}`} className="legal-doc-disclaimer">
          {parseInline(paragraph.slice(1, -1), `p-${blockKey}`)}
        </p>,
      );
    } else {
      blocks.push(
        <p key={`block-${blockKey++}`} className="legal-doc-p">
          {parseInline(paragraph, `p-${blockKey}`)}
        </p>,
      );
    }
  }

  return blocks;
}
