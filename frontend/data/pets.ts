export type PetCardData = {
  id: string;
  name: string;
  breed: string;
  age: string;
  energy: string;
  trait: string;
  distance: string;
  icon: 'dog' | 'cat' | 'paw';
  tone: string;
};

export const petCards: PetCardData[] = [
  {
    id: 'p1',
    name: 'Mochi',
    breed: 'Corgi',
    age: '2 yrs',
    energy: 'Playful',
    trait: 'Loves sunrise walks and snack puzzles.',
    distance: '2.1 km',
    icon: 'dog',
    tone: '#FDE2B3',
  },
  {
    id: 'p2',
    name: 'Luna',
    breed: 'British Shorthair',
    age: '3 yrs',
    energy: 'Calm',
    trait: 'Apartment-friendly and gentle with guests.',
    distance: '3.6 km',
    icon: 'cat',
    tone: '#DCEBFF',
  },
  {
    id: 'p3',
    name: 'Rio',
    breed: 'Mini Poodle',
    age: '1 yr',
    energy: 'Smart',
    trait: 'Quick learner, loves puzzle toys.',
    distance: '1.4 km',
    icon: 'paw',
    tone: '#E5F5DE',
  },
  {
    id: 'p4',
    name: 'Hazel',
    breed: 'Shiba Inu',
    age: '4 yrs',
    energy: 'Independent',
    trait: 'Enjoys calm mornings and steady routines.',
    distance: '4.8 km',
    icon: 'dog',
    tone: '#FFE1E1',
  },
];
