export interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
}

export interface Review {
  id: number;
  title: string;
  movie_title: string;
  content: string;
  likes: number;
  created_at: string;
  status: 'approved' | 'pending' | 'rejected';
  author: {
    id: number;
    username: string;
  };
}
