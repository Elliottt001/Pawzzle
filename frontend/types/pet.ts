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
  imageUrl?: string | null;
};
