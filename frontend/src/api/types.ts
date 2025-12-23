export interface UserBase {
  id: number;
  username: string;
}

export interface User extends UserBase {
  role: 'user' | 'admin';
}

export interface Review {
  id: number;
  title: string;
  movie_title: string;
  content: string;
  likes: number;
  is_liked: boolean;
  created_at: string;
  status: 'approved' | 'pending' | 'rejected';
  author: {
    id: number;
    username: string;
  };
}
