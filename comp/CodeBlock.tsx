'use client';

import { useRef, useState, type ReactNode } from 'react';
import { FiCheck, FiClipboard } from 'react-icons/fi';

export default function CodeBlock({ children }: { children: ReactNode }) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [status, setStatus] = useState('');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codeRef.current?.textContent ?? '');
      setStatus('コピーしました');
    } catch {
      setStatus('コピーできませんでした。コードを選択してコピーしてください。');
    }
  };
  return (
    <div className="relative my-6 rounded-xl bg-[#182536] text-[#E8EEF5]">
      <button type="button" onClick={copy} aria-label="コードをコピー" title="コードをコピー"
        className="absolute right-2 top-2 rounded-lg bg-[#26394F] p-2 text-white hover:bg-[#3C526D] focus-visible:outline-2 focus-visible:outline-offset-2">
        {status === 'コピーしました' ? <FiCheck aria-hidden="true" /> : <FiClipboard aria-hidden="true" />}
      </button>
      <pre ref={codeRef} className="overflow-x-auto p-5 pr-14 font-mono text-sm leading-6 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit">{children}</pre>
      <span role="status" className={status.startsWith('コピーでき') ? 'block px-5 pb-3 text-xs' : 'sr-only'}>{status}</span>
    </div>
  );
}
