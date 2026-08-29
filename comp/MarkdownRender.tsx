import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';

const colorClasses: Record<string, string> = {
  orange: 'text-[#B66A36]',
  green: 'text-[#39745A]',
  blue: 'text-[#356A92]',
  red: 'text-[#B6534D]',
};

const markdownSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), 'dataColor'],
  },
};

type MarkdownRendererProps = {
  content: string;
};

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-5 mt-10 border-b border-[#E7D8CB] pb-3 text-3xl font-bold text-[#3E4652]">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-4 mt-9 border-b border-[#EFE2D6] pb-2 text-2xl font-bold text-[#75492E]">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-3 mt-7 text-xl font-bold text-[#263F60]">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="my-4 leading-8 text-[#344256]">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="my-5 list-disc space-y-2 pl-6 text-[#344256]">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="my-5 list-decimal space-y-2 pl-6 text-[#344256]">
            {children}
          </ol>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-6 border-l-4 border-[#C47A45] bg-[#FFF6ED] px-5 py-3 text-[#6F5B4C]">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => {
          const isExternalLink =
            href?.startsWith('http://') || href?.startsWith('https://');

          return (
            <a
              href={href}
              target={isExternalLink ? '_blank' : undefined}
              rel={isExternalLink ? 'noreferrer noopener' : undefined}
              className="font-semibold text-[#254F8F] underline decoration-[#254F8F]/30 underline-offset-4 hover:decoration-[#254F8F]"
            >
              {children}
            </a>
          );
        },
        code: ({ children }) => (
          <code className="rounded bg-[#EEF1F4] px-1.5 py-0.5 font-mono text-sm text-[#B24A62]">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="my-6 overflow-x-auto rounded-xl bg-[#182536] p-5 font-mono text-sm leading-6 text-[#E8EEF5]">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-[#DDE4EC] bg-[#F1F4F7] px-4 py-3 font-bold text-[#344256]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-[#DDE4EC] px-4 py-3 text-[#566477]">
            {children}
          </td>
        ),
        hr: () => <hr className="my-8 border-[#DDE4EC]" />,
        span: ({ node, children }) => {
          const color = node?.properties?.dataColor;
          const colorName = typeof color === 'string' ? color : '';
          return <span className={colorClasses[colorName]}>{children}</span>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
