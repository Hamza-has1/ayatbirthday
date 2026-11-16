export type SectionId = 'overview' | 'cake' | 'envelope' | 'activities' | 'games';

export interface WishLantern {
  id: string;
  author: string;
  message: string;
  color: 'gold' | 'rose' | 'cyan';
  createdAt: number;
}

export interface CakeState {
  candlesLit: boolean[];
  isCut: boolean;
  sliceProgress: number;
}

export interface EnvelopeState {
  isOpen: boolean;
  cardPulled: boolean;
}

export interface HighScores {
  giftCatcher: number;
  chronoSpark: number;
  starlightBurst: number;
}
