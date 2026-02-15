export interface JikanImage {
  jpg: {
    image_url: string;
    large_image_url: string;
  }
}

export interface JikanEntry {
  mal_id: number;
  title: string;
  title_japanese: string;
  images: JikanImage;
  synopsis: string;
  type: 'TV' | 'Movie' | 'Manga';
  episodes?: number;
  chapters?: number;
  status: string;
  score: number;
  genres: { name: string }[];
}