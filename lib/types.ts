// /lib/types.ts
export type CharacterRow = {
  id: string;
  character_name: string;
  quote: string;
  anime_name: string;
  year: number | null;
  genre: string | null;
  mal_ranking: number | null;
  image_url?: string | null;
};

export type MatchMap = Partial<{
  anime_name: boolean;
  year: boolean;
  genre: boolean;
  mal_ranking: boolean;
}>;

export type Dir = 'up' | 'down' | 'equal' | null;

export type Attempt = {
  guess: CharacterRow;
  matches: MatchMap;
  hints?: {
    year: Dir;
    mal_ranking: Dir;
  };
};

export type Suggestion = {
  id: string;
  character_name: string;
};
