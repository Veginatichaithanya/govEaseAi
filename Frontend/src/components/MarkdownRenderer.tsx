import React, { useState } from 'react';
import { Copy, Check, ExternalLink, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // If content is raw JSON, try to format it cleanly
  let displayContent = content;
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(content);
      displayContent = JSON.stringify(parsed, null, 2);
    } catch {
      // Not valid JSON, display as normal text
    }
  }

  // Split into code blocks and normal text blocks
  const parts = displayContent.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-body">
      {parts.map((part, partIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Code block
          const lines = part.slice(3, -3).split('\n');
          const lang = lines[0].trim();
          const code = (lang ? lines.slice(1) : lines).join('\n');
          return <CodeBlock key={partIdx} code={code} lang={lang} />;
        }

        return <TextBlock key={partIdx} text={part} />;
      })}
    </div>
  );
};

const TextBlock: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let lineIdx = 0;

  while (lineIdx < lines.length) {
    const rawLine = lines[lineIdx];
    const trimmed = rawLine.trim();

    // 1. Skip empty lines
    if (!trimmed) {
      lineIdx++;
      continue;
    }

    // 2. Horizontal divider
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(<hr key={`hr-${lineIdx}`} className="markdown-divider" />);
      lineIdx++;
      continue;
    }

    // 3. Table detection: line contains '|' and looks like a table row
    if (trimmed.startsWith('|') || (trimmed.includes('|') && trimmed.endsWith('|'))) {
      const tableLines: string[] = [];
      let cur = lineIdx;
      while (cur < lines.length && (lines[cur].trim().startsWith('|') || (lines[cur].trim().includes('|') && lines[cur].trim().endsWith('|')))) {
        tableLines.push(lines[cur].trim());
        cur++;
      }

      // Check if tableLines has at least 2 rows and row 1 is delimiter (|---|---|)
      if (tableLines.length >= 2 && /^\|?(\s*:?-+:?\s*\|)+\s*(:?-+:?\s*)?\|?$/.test(tableLines[1])) {
        const headerCells = parseTableRow(tableLines[0]);
        const delimiterCells = parseTableRow(tableLines[1]);
        const alignments = delimiterCells.map(d => {
          const t = d.trim();
          if (t.startsWith(':') && t.endsWith(':')) return 'center' as const;
          if (t.endsWith(':')) return 'right' as const;
          return 'left' as const;
        });

        const bodyRows = tableLines.slice(2).map(r => parseTableRow(r));

        elements.push(
          <div key={`table-${lineIdx}`} className="markdown-table-wrapper">
            <table className="markdown-table">
              <thead>
                <tr>
                  {headerCells.map((h, hi) => (
                    <th key={hi} style={{ textAlign: alignments[hi] || 'left' }}>
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ textAlign: alignments[ci] || 'left' }}>
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

        lineIdx = cur;
        continue;
      }
    }

    // 4. Callout / Blockquote detection (e.g. > [!NOTE] or > quote)
    if (trimmed.startsWith('>')) {
      const blockLines: string[] = [];
      let cur = lineIdx;
      while (cur < lines.length && lines[cur].trim().startsWith('>')) {
        blockLines.push(lines[cur].trim().replace(/^>\s?/, ''));
        cur++;
      }

      const joined = blockLines.join('\n').trim();
      const isWarning = /\[!(WARNING|CAUTION|ALERT)\]|⚠️/i.test(joined);
      const isNote = /\[!(NOTE|INFO|TIP)\]|ℹ️/i.test(joined);
      const isSuccess = /\[!(SUCCESS|APPROVED)\]|✅/i.test(joined);

      const cleanedContent = joined
        .replace(/\[!(NOTE|WARNING|CAUTION|ALERT|INFO|TIP|SUCCESS|APPROVED)\]/gi, '')
        .trim();

      elements.push(
        <div
          key={`quote-${lineIdx}`}
          className={`markdown-callout ${
            isWarning ? 'warning' : isSuccess ? 'success' : isNote ? 'info' : 'standard'
          }`}
        >
          <div className="markdown-callout-icon">
            {isWarning ? (
              <AlertTriangle size={15} />
            ) : isSuccess ? (
              <CheckCircle2 size={15} />
            ) : (
              <Info size={15} />
            )}
          </div>
          <div className="markdown-callout-text">
            {renderInline(cleanedContent)}
          </div>
        </div>
      );

      lineIdx = cur;
      continue;
    }

    // 5. Warning / Note prefix without '>' (e.g. "**Please note:** ...", "⚠️ ...", "Important: ...")
    const calloutMatch = trimmed.match(/^(?:⚠️|\[!(?:WARNING|CAUTION|ALERT|NOTE|INFO|TIP|SUCCESS|APPROVED)\]|\*\*(?:⚠️|Warning:|Important:|Please note:|Note:)\*\*|Warning:|Important:|Please note:|Note:)/i);
    if (calloutMatch) {
      const isWarning = /^(?:⚠️|\[!(?:WARNING|CAUTION|ALERT)\]|\*\*(?:⚠️|Warning:|Important:)\*\*|Warning:|Important:)/i.test(trimmed);
      const isSuccess = /^(?:✅|\[!(?:SUCCESS|APPROVED)\])/i.test(trimmed);
      
      elements.push(
        <div
          key={`callout-${lineIdx}`}
          className={`markdown-callout ${isWarning ? 'warning' : isSuccess ? 'success' : 'info'}`}
        >
          <div className="markdown-callout-icon">
            {isWarning ? <AlertTriangle size={15} /> : isSuccess ? <CheckCircle2 size={15} /> : <Info size={15} />}
          </div>
          <div className="markdown-callout-text">
            {renderInline(trimmed)}
          </div>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 6. Headings (#, ##, ###)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${lineIdx}`} className="markdown-heading h4">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      lineIdx++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${lineIdx}`} className="markdown-heading h3">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      lineIdx++;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`h2-${lineIdx}`} className="markdown-heading h2">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      lineIdx++;
      continue;
    }

    // 7. Standalone Emoji Section Titles (e.g. "📋 Quick Self-Check", "**🔍 What Happens Next**")
    const emojiTitleMatch = trimmed.match(/^(?:\*\*)?([📋🔍⚡💡📌ℹ️✅⚠️🎯🚀📝]\s+[^\n*]+?)(?:\*\*)?$/);
    if (emojiTitleMatch) {
      elements.push(
        <div key={`sec-${lineIdx}`} className="markdown-section-title">
          {renderInline(emojiTitleMatch[1])}
        </div>
      );
      lineIdx++;
      continue;
    }

    // 8. Bullet lists (with checklist [ ] and [x] support)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      const listItems: string[] = [];
      let cur = lineIdx;
      while (cur < lines.length) {
        const m = lines[cur].trim().match(/^[-*•]\s+(.*)$/);
        if (m) {
          listItems.push(m[1]);
          cur++;
        } else {
          break;
        }
      }

      elements.push(
        <ul key={`ul-${lineIdx}`} className="markdown-list ul">
          {listItems.map((item, i) => {
            const isChecked = item.startsWith('[x] ') || item.startsWith('[X] ');
            const isUnchecked = item.startsWith('[ ] ');
            if (isChecked || isUnchecked) {
              const cleanItem = item.slice(4);
              return (
                <li key={i} className="markdown-checklist-item">
                  <span className={`markdown-check-badge ${isChecked ? 'checked' : 'unchecked'}`}>
                    {isChecked ? '✓' : '○'}
                  </span>
                  <span>{renderInline(cleanItem)}</span>
                </li>
              );
            }
            return <li key={i}>{renderInline(item)}</li>;
          })}
        </ul>
      );

      lineIdx = cur;
      continue;
    }

    // 9. Numbered lists
    const numMatch = trimmed.match(/^\d+[\.\)]\s+(.*)$/);
    if (numMatch) {
      const listItems: string[] = [];
      let cur = lineIdx;
      while (cur < lines.length) {
        const m = lines[cur].trim().match(/^\d+[\.\)]\s+(.*)$/);
        if (m) {
          listItems.push(m[1]);
          cur++;
        } else {
          break;
        }
      }

      elements.push(
        <ol key={`ol-${lineIdx}`} className="markdown-list ol">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ol>
      );

      lineIdx = cur;
      continue;
    }

    // Standalone Source / Sources block (e.g. "*Source: Municipal Licensing Guidelines — [portal](url)*")
    const sourceMatch = trimmed.match(/^(?:\*)?(?:Source|Sources):\s*(.*?)(\*)?$/i);
    if (sourceMatch) {
      elements.push(
        <div key={`source-${lineIdx}`} className="markdown-source-line">
          <span className="markdown-source-badge">Official Source</span>
          <span className="markdown-source-text">{renderInline(sourceMatch[1])}</span>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 10. Default paragraph
    elements.push(
      <p key={`p-${lineIdx}`} className="markdown-paragraph">
        {renderInline(trimmed)}
      </p>
    );
    lineIdx++;
  }

  return <>{elements}</>;
};

function parseTableRow(line: string): string[] {
  let content = line.trim();
  if (content.startsWith('|')) content = content.slice(1);
  if (content.endsWith('|')) content = content.slice(0, -1);
  return content.split('|').map(c => c.trim());
}

const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="markdown-code-block">
      <div className="markdown-code-header">
        <span className="markdown-code-lang">{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="markdown-code-copy-btn"
          title="Copy code"
        >
          {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="markdown-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by bold (**), inline code (`), links ([title](url)), and italic (*)
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\)|\*.*?\*)/g;
  const parts = text.split(regex);

  parts.forEach((part, idx) => {
    if (!part) return;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      tokens.push(
        <strong key={idx} className="markdown-bold">
          {renderInline(part.slice(2, -2))}
        </strong>
      );
    } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      tokens.push(
        <code key={idx} className="markdown-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (match) {
        tokens.push(
          <a
            key={idx}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="markdown-link"
          >
            <span>{match[1]}</span>
            <ExternalLink size={10} style={{ marginLeft: '3px', verticalAlign: 'middle' }} />
          </a>
        );
      } else {
        tokens.push(part);
      }
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      tokens.push(<em key={idx}>{renderInline(part.slice(1, -1))}</em>);
    } else {
      tokens.push(part);
    }
  });

  return tokens;
}
