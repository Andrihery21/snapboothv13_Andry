import React from 'react';

const EffectCaricature = ({ onSelect }) => {
  const effects = [
    {
      value: 'big head,small body,chibi caricature of samurai',
      label: 'Samurai',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739126125629x627173688556666400/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20Samurai.jpg'
    },
    {
      value: 'big head,small body,chibi caricature of doctor',
      label: 'Doctor',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125311981x859935082600382700/LightX%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20doctor.jpg'
    },
    {
      value: 'big head,small body,chibi caricature of politician',
      label: 'Politician',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125474597x287225342642065200/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20politician.jpg'
    },
    {
      value: 'big head,small body,chibi caricature of fire fighter',
      label: 'Fire fighter',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125667741x318419791472486240/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20firefighter%20%282%29.jpg'
    },
    {
      value: 'big head,small body,chibi caricature of chef',
      label: 'Chef',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125929014x892874969854078300/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20chef.jpg'
    },
    {
      value: 'big head,small body,chibi caricature of rockstar',
      label: 'Rockstar',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739162961761x567174639334006000/LightX%20Rockstar-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20rockstar%20%282%29.jpg'
    },
    {
      value: 'big head,small body,chibi caricature of footballer',
      label: 'Footballer',
      image: 'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739126050897x142406437776538830/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20footballer.jpg'
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

      <button
        onClick={() => onSelect(null)}
        className="col-span-full flex justify-center items-center bg-purple-700 text-white text-sm font-semibold py-2 px-4 rounded-full mt-4 hover:bg-purple-800 shadow-lg"
      >
        Pas d'effet, je suis suffisamment stylé comme ça
      </button>
    </div>
  );
};

export default EffectCaricature;
