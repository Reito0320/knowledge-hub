const tagColorClasses = [
  'bg-[#E8F0FA] text-[#254F8F]',
  'bg-[#F8EADF] text-[#995D31]',
  'bg-[#E8F4EE] text-[#39745A]',
  'bg-[#F2EAF7] text-[#76518A]',
  'bg-[#FBECEF] text-[#A34F65]',
] as const;

const normalizeTagName = (name: string) =>
  name.trim().normalize('NFKC').toLocaleLowerCase();

// タグ名から色を決定するため、DBへ色を保存しなくても全画面で同じ色を再現できる。
export const getTagColorClass = (name: string) => {
  const colorIndex = Array.from(normalizeTagName(name)).reduce(
    (total, character) => total + character.codePointAt(0)!,
    0,
  );

  return tagColorClasses[colorIndex % tagColorClasses.length];
};
