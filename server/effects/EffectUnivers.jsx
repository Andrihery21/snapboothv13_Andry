import React from 'react';

const EffectUnivers = ({ onSelect }) => {
  const effects = [
    {
      value: 'animation3d',
      label: '3D Animation',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130290754x925359529669461600/Cartoon%20yourself-Animation%203D.png'
    },
    {
      value: 'future',
      label: 'Future Tech',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564961243x558145837457536300/4-%20AI%20Image%20anime%20generator%20-%204%20Future%20Technology..jpg'
    },
    {
      value: 'chinese_trad',
      label: 'Traditional Chinese',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565037951x922301476010605700/5-%20AI%20Image%20anime%20generator%20-%205%20Traditional%20Chinese%20Painting%20Style.jpg'
    },
    {
      value: 'general_battle',
      label: 'General in Battle',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565115416x952288200492438900/6%20-%20AI%20Image%20anime%20generator%20-%206%20General%20in%20a%20Hundred%20Battles..jpg'
    },
    {
      value: 'colorful_cartoon',
      label: 'Colorful Cartoon',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565590887x221935701029312600/7%20-AI%20Image%20anime%20generator%20-%20Colorful%20Cartoon.jpg'
    },
    {
      value: 'graceful_chinese',
      label: 'Graceful Chinese',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565647482x402675898065792960/8-%20AI%20Image%20anime%20generator%20-%20Graceful%20Chinese%20Style.jpg'
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

export default EffectUnivers;
