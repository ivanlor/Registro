export interface TimeRecord {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  name: string;
  description: string;
  calculatedHours: number;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
}

export type NewTimeRecord = Omit<TimeRecord, 'id' | 'status' | 'timestamp'>;
