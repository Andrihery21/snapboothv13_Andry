import React from 'react';

const EffectDessin = ({ onSelect }) => {
  const effects = [
    {
      value: 'anime',
      label: 'Japanese Manga (II)',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130120365x947590826747246600/Cartoon%20yourself-Japanese%20manga%202.png'
    },
    {
      value: 'claborate',
      label: 'Chinese Brushwork',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130154070x692047786667617400/Cartoon%20yourself-%20Chinese%20fine%20brushwork%20painting.png'
    },
    {
      value: 'sketch',
      label: 'Pencil Drawing (I)',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564526017x784742993887914200/Cartoon%20yourself-Pencil%20drawing.png'
    },
    {
      value: 'full',
      label: 'Pencil Drawing (II)',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564671766x857421022456529500/Cartoon%20yourself-Pencil%20drawing%202.png'
    },
    {
      value: 'head',
      label: 'Moe Manga',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564753249x294964184177892740/Cartoon%20yourself-Moe%20Manga.jpeg'
    },
    {
      value: 'vintage',
      label: 'Vintage Comic',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564853684x500805100845962900/0%20-%20AI%20Image%20anime%20generator-0%20Vintage%20Comic..jpg'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {effects.map((effect) => (
        <button
          key={effect.value}
          onClick={() => onSelect(effect.value)}
          className="bg-gray-800 hover:bg-purple-700 text-white rounded-lg overflow-hidden shadow-md"
        >
          <img src={effect.image} alt={effect.label} className="w-full h-32 object-cover" />
          <div className="p-2 text-center font-medium text-sm">{effect.label}</div>
        </button>
      ))}
    </div>
  );
};

export default EffectDessin;
