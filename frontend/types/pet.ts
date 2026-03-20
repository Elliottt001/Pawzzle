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
  imageSource?: number;
  gender?: '公' | '母';
  neutered?: '已绝育' | '未绝育';
  tags?: string[];
  story?: string;
  location?: string;
};
