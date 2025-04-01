export type TeeColor = 'Red' | 'White' | 'Blue' | 'Gold';

export type LieCondition = 'Tee' | 'Fairway' | 'Rough' | 'Sand' | 'Recovery' | 'Green';

export interface Hole {
  number: number;
  par: number;
  distance: number;
}

export interface Course {
  id: string;
  name: string;
  teeColors: TeeColor[];
  holes: Record<TeeColor, Hole[]>;
}

export interface Shot {
  id: string;
  holeNumber: number;
  shotNumber: number;
  lie: LieCondition;
  distanceToHole: number;
  distanceTraveled?: number;
  completed: boolean;
  strokesGained?: number;
}

export interface Round {
  id: string;
  date: string;
  courseId: string;
  teeColor: TeeColor;
  shots: Shot[];
  totalStrokes: number;
  completed: boolean;
}

export interface RoundSummary {
  totalStrokes: number;
  shotsByLie: Record<LieCondition, number>;
  // Will add strokes gained categories later
}

// Update RouteParams to work with React Navigation
export type RouteParams = {
  HomeScreen: undefined;
  StartRoundScreen: undefined;
  CourseSelectionScreen: undefined;
  AddCourseScreen: undefined;
  HoleScreen: {
    holeNumber: number;
    courseId: string;
    teeColor: TeeColor;
    roundId: string;
  };
  RoundSummaryScreen: {
    roundId: string;
  };
};
