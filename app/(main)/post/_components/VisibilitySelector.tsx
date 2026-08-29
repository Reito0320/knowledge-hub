import type { PostVisibility } from '@/lib/post/post-visibility';
import { FiEye, FiLink, FiLock, FiUsers } from 'react-icons/fi';

type VisibilitySelectorProps = {
  value: PostVisibility;
  onChange: (visibility: PostVisibility) => void;
};

const options = [
  {
    value: 'ORGANIZATION',
    label: '社内の全員',
    description: 'ホームや検索結果にも表示',
    icon: FiUsers,
  },
  {
    value: 'LINK',
    label: 'リンクを知る人',
    description: '一覧には表示せずURLから閲覧',
    icon: FiLink,
  },
  {
    value: 'DEPARTMENT',
    label: '同じ部署',
    description: '投稿者と同じ部署だけ閲覧',
    icon: FiEye,
  },
  {
    value: 'PRIVATE',
    label: '自分のみ',
    description: '公開後も投稿者だけ閲覧',
    icon: FiLock,
  },
] as const;

const VisibilitySelector = ({ value, onChange }: VisibilitySelectorProps) => (
  <section className="rounded-2xl border border-[#E3D9CF] bg-white p-5">
    <div className="flex items-center gap-2 text-sm font-bold text-[#4E433A]">
      <FiEye aria-hidden="true" className="text-[#A66334]" />
      閲覧できる範囲
    </div>
    <p className="mt-1 text-xs leading-5 text-[#88796C]">
      公開後にこの記事を読めるメンバーを選びます。
    </p>
    <div className="mt-4 space-y-2">
      {options.map(({ value: optionValue, label, description, icon: Icon }) => (
        <label
          key={optionValue}
          className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
            value === optionValue
              ? 'border-[#C47A45] bg-[#FFF6ED]'
              : 'border-[#E7DED5] hover:bg-[#FCF9F5]'
          }`}
        >
          <input
            type="radio"
            name="visibility"
            value={optionValue}
            checked={value === optionValue}
            onChange={() => onChange(optionValue)}
            className="mt-1 accent-[#A66334]"
          />
          <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-[#A66334]" />
          <span>
            <span className="block text-sm font-bold text-[#55483D]">{label}</span>
            <span className="mt-0.5 block text-xs text-[#88796C]">{description}</span>
          </span>
        </label>
      ))}
    </div>
  </section>
);

export default VisibilitySelector;
