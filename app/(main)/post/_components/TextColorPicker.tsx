import { FiDroplet } from 'react-icons/fi';

export type MarkdownTextColor = 'orange' | 'green' | 'blue' | 'red';

type Props = { onSelect: (color: MarkdownTextColor) => void };

const colors = [
  { value: 'orange', label: 'オレンジ', className: 'bg-[#B66A36]' },
  { value: 'green', label: 'グリーン', className: 'bg-[#39745A]' },
  { value: 'blue', label: 'ブルー', className: 'bg-[#356A92]' },
  { value: 'red', label: 'レッド', className: 'bg-[#B6534D]' },
] as const;

const TextColorPicker = ({ onSelect }: Props) => (
  <div className="group relative">
    <button type="button" aria-label="文字色を変更" title="文字色" className="flex size-9 items-center justify-center rounded-lg text-[#76685D] transition hover:bg-[#FFF1E5] hover:text-[#A66334]">
      <FiDroplet aria-hidden="true" />
    </button>
    <div className="invisible absolute left-0 top-full z-40 mt-1 flex translate-y-1 gap-1 rounded-xl border border-[#E7DED5] bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
      {colors.map((color) => (
        <button key={color.value} type="button" title={color.label} aria-label={`文字色を${color.label}にする`} onClick={() => onSelect(color.value)} className={`size-6 rounded-full border-2 border-white shadow-sm ring-1 ring-black/10 transition hover:scale-110 ${color.className}`} />
      ))}
    </div>
  </div>
);

export default TextColorPicker;
