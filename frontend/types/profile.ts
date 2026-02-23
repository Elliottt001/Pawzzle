import { PetCardData } from './pet';

export type UserType = 'INDIVIDUAL' | 'INSTITUTION';

export type AuthStep = 'landing' | 'phone' | 'code' | 'nickname' | 'institution' | 'wechat';

export type UserProfile = {
  id: number;
  name: string;
  userType: UserType | null;
  pets: PetCardData[];
};

export type AdoptionSummary = {
  id: string;
  pet: PetCardData;
  status: 'APPLY' | 'SCREENING' | 'TRIAL' | 'ADOPTED';
  adoptedAt?: number | null;
};
