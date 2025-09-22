
// This file defines the shape of the Assignment data.
// Data fetching and mutation are now handled client-side via the useAssignments hook.
export type Assignment = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'new' | 'inprogress' | 'completed';
  stars: number;
};
