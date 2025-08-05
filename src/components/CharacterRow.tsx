import CharacterCard from './CharacterCard';

type Character = {
  id: number;
  name: string;
  description: string | null;
  characterImages: { imageUrl: string }[];
};

type CharacterRowProps = {
  title: string;
  characters: Character[];
};

export default function CharacterRow({ title, characters }: CharacterRowProps) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {characters.map((char) => (
          <CharacterCard key={char.id} character={char} />
        ))}
      </div>
    </section>
  );
}